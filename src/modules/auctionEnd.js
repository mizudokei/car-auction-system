const db = require('./db');
const nodemailer = require('nodemailer'); //nodemailer(メール送信に使うライブラリ)のインポート

//------------------------------メール送信に使うメアドとパスワードの入力場所------------------------------
mailservice = "gmail" //利用するメールサービス
From_Email = "mizunotoki.halstudent@gmail.com" //メールアドレス
Pass       = "roqkam-gesca1-bibwAp" //パスワード
//テストではgmailとアプリパスワードを利用

const getAuctionEnd = (callback) => {
    const connection = db.connectDB();
    const query = `
        SELECT auction_id, end_datetime
        FROM auction_tbl
        WHERE auction_status = '開催中';
    `;

    connection.query(query, [], (err, results) => {
        if (err) {
            db.disconnectDB();
            return callback(err);
        }
        db.disconnectDB();
        callback(null, results);
    });
};

const successfulbid = (listing_id, callback) => {
    const connection = db.connectDB();

    const selectBidQuery = "SELECT user_id, bid_amount, bid_datetime FROM `bid_tbl` WHERE listing_id = ? ORDER BY bid_amount DESC LIMIT 1";
    connection.query(selectBidQuery, [listing_id], (err, bidResults) => {
        if (err) {
            db.disconnectDB();
            return callback(err);
        }

        if (bidResults.length > 0) { // 落札者がいる場合
            const { user_id, bid_amount, bid_datetime } = bidResults[0];
            const insertQuery = "INSERT INTO `successfulbid_tbl` (user_id, listing_id, successfulbid_datetime, successfulbid_amount) VALUES (?, ?, ?, ?)";
            connection.query(insertQuery, [user_id, listing_id, bid_datetime, bid_amount], (err, insertResults) => {
                if (err) {
                    db.disconnectDB();
                    return callback(err);
                }
                console.log(`listing_id: ${listing_id} の落札処理が完了しました。`);

                const carIdQuery = 'SELECT car_id FROM `listing_tbl` WHERE listing_id = ?';
                connection.query(carIdQuery, [listing_id], (err, carResults) => {
                    if (err) {
                        db.disconnectDB();
                        return callback(err);
                    }
                    const car_id = carResults[0].car_id;
                    const updateCarQuery = "UPDATE `car_tbl` SET `car_status` = '落札済' WHERE `car_id` = ?";
                    connection.query(updateCarQuery, [car_id], (err) => {
                        if (err) {
                            db.disconnectDB();
                            return callback(err);
                        }
                        const bidder = "y"; // 落札者がいた
                        db.disconnectDB();
                        callback(null, bidder);
                    });
                });
            });
        } else { // 落札者がいない場合
            console.log(`listing_id: ${listing_id} に対する入札者がいませんでした`);
            const carIdQuery = 'SELECT car_id FROM `listing_tbl` WHERE listing_id = ?';
            connection.query(carIdQuery, [listing_id], (err, carResults) => {
                if (err) {
                    db.disconnectDB();
                    return callback(err);
                }
                const car_id = carResults[0].car_id;
                const updateCarQuery = "UPDATE `car_tbl` SET `car_status` = '在庫あり' WHERE `car_id` = ?";
                connection.query(updateCarQuery, [car_id], (err) => {
                    if (err) {
                        db.disconnectDB();
                        return callback(err);
                    }
                    const bidder = "n"; // 落札者がいない
                    callback(null, bidder);
                });
            });
        }
    });
};

const endAuction = (auction_id, callback) => {
    const connection = db.connectDB();
    const updateQuery = "UPDATE `auction_tbl` SET `auction_status` = '終了' WHERE `auction_id` = ?";//対象オークションを終了
    console.log("auction_id:" + auction_id + " オークション終了");
    connection.query(updateQuery, [auction_id], (err, results) => {
        if (err) {
            db.disconnectDB();
            return callback(err);
        }
        const query = "SELECT listing_id FROM `listing_tbl` WHERE auction_id = ?";//終了したオークションの出品車両を取得
        connection.query(query, [auction_id], (err, results) => {
            if (err) {
                db.disconnectDB();
                return callback(err);
            }
            db.disconnectDB();
            callback(null, results);
        });
    });
};

//メール送る関数
const sendMail = (auction_id, listing_id, callback) => {

    // 今日の日付を求める関数
    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const weekday = weekdays[date.getDay()];
        return `${year}/${month}/${day} ${hours}:${minutes} (${weekday})`;
    }

    const today = new Date();
    const connection = db.connectDB();

    const query = `
        SELECT u.user_name, u.mail, s.successfulbid_amount, c.car_type, a.start_datetime
        FROM successfulbid_tbl s
        JOIN user_tbl u ON s.user_id = u.user_id
        JOIN listing_tbl l ON s.listing_id = l.listing_id
        JOIN car_tbl c ON l.car_id = c.car_id
        JOIN auction_tbl a ON l.auction_id = a.auction_id
        WHERE s.listing_id = ?
        ORDER BY s.successfulbid_datetime DESC
        LIMIT 1;
    `;

    connection.query(query, [listing_id], (err, results) => {
        if (err) {
             db.disconnectDB();
            return callback(err);
        }

        if (results.length > 0) {
            const { user_name, mail, successfulbid_amount, car_type, start_datetime } = results[0];

            const transporter = nodemailer.createTransport({
                service: mailservice, // 実際のメールサービスを指定してください
                auth: {
                    user: From_Email, // 送信元メールアドレスを指定
                    pass: Pass   // パスワードを指定
                }
            });

            const mailOptions = {
                from: From_Email, // 送信元メールアドレスを指定
                to: mail, // 送信先メールアドレスを指定
                subject: `HAL自動車オークション ${formatDate(today)} 送信`,
                text: `
                    ${user_name}様

                    おめでとうございます！
                    ${formatDate(start_datetime)}にて開催されたオークションにおいて「${car_type}」が落札されました。

                    ――――――――――――――――――――――――――――
                    落札情報
                    ――――――――――――――――――――――――――――

                    オークションID: ${auction_id}
                    出品ID: ${listing_id}
                    車種名: ${car_type}
                    落札価格: ${successfulbid_amount}

                    ――――――――――――――――――――――――――――
                    お支払い情報
                    ――――――――――――――――――――――――――――
                    ～
                    落札金額と送料を合わせて下記口座までお振込みください。
                    ～
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('メール送信に失敗しました:', error);
                     db.disconnectDB(); // データベース接続の終了
                    return callback(error);
                } else {
                    // console.log('メールが送信されました:', info.response);
                     db.disconnectDB(); // データベース接続の終了
                    return callback(null, info.response);
                }
            });
        } else {
            db.disconnectDB();
            return callback(new Error("指定された listing_id に対する落札情報が見つかりませんでした"));
        }
    });
};

module.exports = { getAuctionEnd, endAuction, successfulbid, sendMail };
