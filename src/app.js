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
            return; // res オブジェクトが利用できないため、レスポンスを送る必要はありません
        }

        AuctionEnd.forEach(auction => {
            const endDate = new Date(auction.end_datetime);
            const currentDate = new Date();
            const timeDiff = endDate - currentDate;
            console.log(`オークションID: ${auction.auction_id}, 残り時間: ${timeDiff}`);

            setTimeout(() => {
                auctionEnd.endAuction(auction.auction_id, (err, results) => {
                    if (err) {
                        console.error(`オークションID ${auction.auction_id} の終了処理でエラーが発生しました:`, err);
                    } else {
                        console.log(`オークションID ${auction.auction_id} の終了処理が成功しました:`, results);
                    }
                    auctionEnd.sendMail(auction.auction_id, results, (err) => {
                        if (err) {
                            console.error(`オークションID ${auction.auction_id} のメール送信でエラーが発生しました:`, err);
                        } else {
                            console.log(`オークションID ${auction.auction_id} のメール送信が成功しました`);
                        }
                    });
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

        bidQueries.getCurrentPrice(auctionId, (err, currentPrice) => {
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

    if (!auctionId || !carId || !bidAmount) {
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


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
// アプリケーション終了時にデータベース接続を切断
process.on('SIGINT', () => {
    db.disconnectDB();
    process.exit();
});
