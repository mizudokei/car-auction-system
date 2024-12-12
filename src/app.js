const express = require('express');
const app = express();
const db = require('./modules/db');
const auctionService = require('./modules/auctionService');
const bidQueries = require('./modules/bidQueries');
const auctionEnd = require('./modules/auctionEnd');
const path = require('path');
const mysql = require('mysql');
const { title } = require('process');
const { connect } = require('http2');
const session = require('express-session');
const bodyParser = require('body-parser');
const authService = require('./modules/authService');
const userQueries = require('./modules/userQueries'); // ユーザー情報を扱うモジュールをインポート
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// 静的ファイル
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/resources', express.static(path.join(__dirname, '../resources')));
app.set('view engine', 'ejs');

// サーバーが起動するときに実行する処理
const initializeServer = () => {
    auctionEnd.getAuctionEnd((err, AuctionEnd) => {
        if (err) {
            console.error("オークション終了データの取得エラー:", err);
            return;
        }
        AuctionEnd.forEach(auction => {
            const endDate = new Date(auction.end_datetime);
            const currentDate = new Date();
            const timeDiff = endDate - currentDate;
            console.log(`オークションID: ${auction.auction_id}, 残り時間: ${timeDiff}`);

            setTimeout(() => {
                auctionEnd.endAuction(auction.auction_id, (err, results) => {//オークションを終了。終了したオークションのlisting_idを取得
                    if (err) {
                        console.error(`オークションID ${auction.auction_id} の終了処理でエラーが発生しました:`, err);
                    } else {
                        console.log(`オークションID ${auction.auction_id} の終了処理が成功しました:`, results);
                        results.forEach((result) => {
                            auctionEnd.successfulbid(result.listing_id, (err, bidder) => {//落札処理
                                if (err) {
                                    console.error(`オークションID ${auction.auction_id}, リスティングID ${result.listing_id} の落札処理でエラーが発生しました:`, err);
                                } else {
                                    if (bidder === "y") { //落札者がいるか
                                        auctionEnd.sendMail(auction.auction_id, result.listing_id, (err) => {//メール送信
                                            if (err) {
                                                console.error(`オークションID ${auction.auction_id}, リスティングID ${result.listing_id} のメール送信でエラーが発生しました:`, err);
                                            } else {
                                                console.log(`オークションID ${auction.auction_id}, リスティングID ${result.listing_id} のメール送信が成功しました`);
                                            }
                                        });
                                    }
                                }
                            });                            
                        });
                    }
                });                
            }, timeDiff);            
        });
    });
};
initializeServer();

app.use(session({
    secret: 'ihiw03_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 3600000 }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    auctionService.getAuctionData((err, auctionData) => {
        if (err) {
            console.error("オークションデータの取得エラー:", err);
            return res.status(500).send("データの取得に失敗しました");
        }
        res.render('index', { user: req.session.user, title: 'ホームページ', auctionData: auctionData });
    });
});

// 入札画面
app.get('/bid', (req, res) => {
    const auctionId = req.query.auction_id;
    const carId = req.query.car_id;
    const listingId = req.query.listing_id;
    const auctionend = req.query.end_datetime;

    // end_datetime と今日の日付の差を計算
    const endDate = new Date(auctionend);
    const currentDate = new Date();
    const timeDiff = endDate - currentDate;
    
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hoursDiff = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsDiff = Math.floor((timeDiff % (1000 * 60)) / 1000);

    let timeRemaining = `${daysDiff}日 ${hoursDiff}時間 ${minutesDiff}分 ${secondsDiff}秒`;

    bidQueries.getCarDetails(carId, (err, carDetails) => {
        if (err) {
            console.error("車データの取得エラー:", err);
            return res.status(500).send("データの取得に失敗しました");
        }

        bidQueries.getCurrentPrice(listingId, (err, currentPrice) => {
            if (err) {
                console.error("車価格の取得エラー:", err);
                return res.status(500).send("データの取得に失敗しました");
            }
            bidQueries.getBidDetails(listingId, (err, bidDetails) => {
                if (err) {
                    console.error("入札履歴の取得エラー:", err);
                    return res.status(500).send("データの取得に失敗しました");
                }
                if(timeDiff < 0){
                    timeRemaining = "オークション終了"
                }
                res.render('bid', { 
                    auction_id: auctionId, 
                    car_id: carId, 
                    listing_id: listingId, 
                    carDetails: carDetails, 
                    current_price: currentPrice + 10000, //最低入札額を現在価格+10000としている
                    now_price: currentPrice,//現在価格
                    end_datetime: auctionend, 
                    time_remaining: timeRemaining,
                    bid_details: bidDetails,
                    user: req.session.user
                });
            });
        });
    });
});

// 入札確認
app.get('/submit-bid', (req, res, next) => {
    const auctionId = req.query.auction_id;
    const auctionend = req.query.end_datetime;
    const carId = req.query.car_id;
    const listingId = req.query.listing_id;
    const bidAmount = req.query.bidAmount;
    const userId = req.session.user ? req.session.user.user_id : null;

    if (!listingId || !carId || !bidAmount) {
        console.error("必要なデータが不足しています");
        return res.status(400).send("必要なデータが不足しています");
    }

    const endDate = new Date(auctionend);
    const currentDate = new Date();
    const timeDiff = endDate - currentDate;

    bidQueries.getCarDetails(carId, (err, carDetails) => {
        if (err) {
            console.error("車データの取得エラー:", err);
            return next(err);  // nextを使用してエラーを処理
        }
        if (timeDiff < 0) {
            const text = "このオークションは終了済みです";
            return res.render('confirm-bid', { text });
        }
        if (!userId) {
            const text = "入札にはログインが必要です";
            console.error("セッション切れ");
            return res.render('confirm-bid', { text });
        }
        res.render('submit-bid', { 
            title: '入札確認画面', 
            carDetails, 
            bidAmount, 
            auctionId, 
            listingId, 
            user: req.session.user 
        });
    });
});

app.get('/login', (req, res) => {
    res.render('login', { user: req.session.user, title: 'ログイン' });
});

app.post('/login-check', (req, res) => {
    const { email, password } = req.body;

    // ユーザー認証のロジックをここに追加
    authService.authenticateUser(email, password, (err, user) => {
        if (err) {
            console.error("認証エラー:", err);
            return res.status(500).send("ログインに失敗しました");
        }
        if (!user) {
            return res.status(401).send("メールアドレスまたはパスワードが間違っています");
        }
        req.session.user = user; // ユーザー情報をセッションに保存
        console.log("ログイン情報（セッション）の確認", req.session.user);
        res.redirect('/');
    });
});

// 入札処理
app.get('/confirmbid', (req, res) => {
    const auctionId = req.query.auction_id;
    const carId = req.query.car_id;
    const listingId = req.query.listing_id;
    const bidAmount = req.query.bidAmount;
    const bidDatetime = new Date();
    const userId = req.session.user.user_id;
    const text = "入札完了"
    
    if (!auctionId || !listingId || !bidAmount) {
        console.error("必要なデータが不足しています");
        return res.status(400).send("必要なデータが不足しています");
    }
    if (!userId) {
        text = "セッションが切れました。再ログインしてください。"
        console.error("セッション切れ");
        res.render('submit-bid', { text });
    }
    bidQueries.addbit(auctionId, listingId, userId, bidDatetime, bidAmount, (err) => {
        if (err) {
            console.error("入札額の更新エラー:", err);
            return res.status(500).send("入札額の更新に失敗しました");
        }

        // carDetailsを取得するための関数呼び出しを追加
        bidQueries.getCarDetails(carId, (err, carDetails) => {
            if (err) {
                console.error("車データの取得エラー:", err);
                return res.status(500).send("データの取得に失敗しました");
            }
            // 正しくcarDetailsをテンプレートに渡す
            res.render('confirm-bid', { 
                title: '入札確認画面', 
                carDetails: carDetails, 
                bidAmount: bidAmount,
                text:text
            });
        });
    });
});

// 会員登録画面へのルーティング
app.get('/signup', (req, res) => {
    res.render('signup', { user: req.session.user, title: '会員登録' });
});

// バリデーション関数
function validateSignupData(user_name, postal_code, tel, address, pass, confirm_pass) {
    const errors = [];
    // ユーザー名の未入力チェック
    if (!user_name) {
        errors.push("ユーザー名は必須です。");
    }
    if (!postal_code || !/^\d{3}-\d{4}$/.test(postal_code)) {
        errors.push("有効な郵便番号を入力してください。");
    }
    if (!tel || !/^\d{2,4}-\d{2,4}-\d{4}$/.test(tel)) {
        errors.push("電話番号は正しい形式で入力してください。");
    }
    if (!address) {
        errors.push("住所は必須です。");
    }
    if (!pass || pass.length < 8 || pass.length > 64) {
        errors.push("パスワードは8文字以上64文字以下である必要があります。");
    }
    if (pass !== confirm_pass) {
        errors.push("パスワードが一致しません。");
    }
    return errors;
}

// 会員登録処理
app.post('/signup', (req, res) => {
    const { last_name, first_name, postal_code, tel, prefecture, city, address, pass, confirm_pass, mail } = req.body;

    // 郵便番号にハイフンを追加
    const formattedPostalCode = postal_code.replace(/(\d{3})(\d{4})/, '$1-$2');
    // 電話番号にハイフンを追加
    const formattedTel = tel.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    // 名前を結合
    const user_name = `${last_name} ${first_name}`;
    // 住所を構成
    const fullAddress = `〒${formattedPostalCode} ${prefecture} ${city} ${address}`;

    // バリデーションチェック
    const errors = validateSignupData(user_name, formattedPostalCode, formattedTel, fullAddress, pass, confirm_pass);
    if (errors.length > 0) {
        return res.status(400).send(errors.join('<br>'));
    }

    // メールアドレスの一意性チェック
    userQueries.isEmailUnique(mail, (err, isUnique) => {
        if (err) {
            return res.status(500).send("メールアドレスのチェックに失敗しました");
        }
        if (!isUnique) {
            return res.status(400).send("このメールアドレスはすでに登録されています");
        }

        // ユーザー情報をデータベースに登録
        userQueries.addUser({ user_name, mail, tel: formattedTel, address: fullAddress, pass }, (err) => {
            if (err) {
                console.error("登録エラー:", err);
                return res.status(500).send("登録に失敗しました");
            }
            res.redirect('/signup-complete'); // 登録完了画面へリダイレクト
        });
    });
});

// 登録完了画面へのルーティング
app.get('/signup-complete', (req, res) => {
    res.render('signup-complete', { user: req.session.user, title: '登録完了' });
});

// バリデーション関数
function validateSignupData(user_name, postal_code, tel, address, pass, confirm_pass) {
    const errors = [];
    // ユーザー名は必須で、特殊記号や数字を含まないことをチェック
    if (!user_name || /[^ぁ-んァ-ン一-龥a-zA-Z\s]/.test(user_name)) {
        errors.push("ユーザー名は必須で、特殊記号や数字を含まないこと。");
    }
    if (!postal_code || !/^\d{3}-\d{4}$/.test(postal_code)) {
        errors.push("有効な郵便番号を入力してください。");
    }
    if (!address) {
        errors.push("住所は必須です。");
    }
    if (!pass || pass.length < 8 || pass.length > 64) {
        errors.push("パスワードは8文字以上64文字以下である必要があります。");
    }
    if (pass !== confirm_pass) {
        errors.push("パスワードが一致しません。");
    }
    return errors;
}

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
// アプリケーション終了時にデータベース接続を切断
process.on('SIGINT', () => {
    db.disconnectDB();
    process.exit();
});

// ユーザー情報画面へのルーティング
app.get('/user-info', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // ログインしていない場合はログイン画面へリダイレクト
    }
    res.render('user-info', { user: req.session.user });
});

// ユーザー情報の更新処理
app.post('/update-user', (req, res) => {
    const { user_name, email, tel, address } = req.body;
    const userId = req.session.user.user_id;

    // ユーザー情報をデータベースに更新
    userQueries.updateUser(userId, { user_name, email, tel, address }, (err) => {
        if (err) {
            console.error("ユーザー情報の更新エラー:", err);
            return res.status(500).send("ユーザー情報の更新に失敗しました");
        }
        req.session.user.user_name = user_name; // セッションのユーザー名を更新
        res.redirect('/user-info'); // ユーザー情報画面へリダイレクト
    });
});

// パール送信関数
function sendPasswordResetEmail(email) {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'mizunotoki.halstudent@gmail.com', // 送信元のメールアドレス
            pass: 'roqkam-gesca1-bibwAp' // 送信元のメールアカウントのパスワード
        }
    });

    const mailOptions = {
        from: 'mizunotoki.halstudent@gmail.com',
        to: email,
        subject: 'パスワード変更のお知らせ',
        text: 'パスワードが変更されました。'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('メール送信エラー:', error);
        }
        console.log('メール送信成功:', info.response);
    });
}

// パスワードリセットメール送信処理
app.post('/send-password-reset', (req, res) => {
    const { reset_email, new_password } = req.body;

    // メールアドレスの存在確認
    userQueries.findUserByEmail(reset_email, (err, user) => {
        if (err || !user) {
            return res.status(404).send("メールアドレスが見つかりません");
        }

        // パスワードをそのままデータベースに保存
        userQueries.updatePassword(user.user_id, new_password, (err) => {
            if (err) {
                console.error("パスワードの更新エラー:", err);
                return res.status(500).send("パスワードの更新に失敗しました");
            }

            // メール送信処理をここに追加
            sendPasswordResetEmail(reset_email); // メール送信関数を呼び出す

            res.redirect('/user-info'); // ユーザー情報画面へリダイレクト
        });
    });
});
