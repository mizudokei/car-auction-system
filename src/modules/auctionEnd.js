const db = require('./db');
const nodemailer = require('nodemailer'); //nodemailer(メール送信に使うライブラリ)のインポート

//------------------------------メール送信に使うメアドとパスワードの入力場所------------------------------
mailservice = "gmail" //利用するメールサービス
From_Email = "" //メールアドレス
Pass       = "" //パスワード
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

const endAuction = (auction_id, callback) => {
    const connection = db.connectDB();
    const updateQuery = "UPDATE `auction_tbl` SET `auction_status` = '終了' WHERE `auction_id` = ?;";
    console.log("auction_id:" + auction_id + " オークション終了");

    connection.query(updateQuery, [auction_id], (err, results) => {
        if (err) {
            db.disconnectDB();
            return callback(err);
        }

        const selectListingQuery = "SELECT listing_id FROM `listing_tbl` WHERE auction_id = ?";
        connection.query(selectListingQuery, [auction_id], (err, listingResults) => {
            if (err) {
                db.disconnectDB();
                return callback(err);
            }

            const successfulBids = [];

            const processListing = (index) => {
                if (index >= listingResults.length) {
                    db.disconnectDB();
                    return callback(null, successfulBids);
                }

                const listing = listingResults[index];
                const selectBidQuery = "SELECT user_id, bid_amount, bid_datetime FROM `bid_tbl` WHERE listing_id = ? ORDER BY bid_amount DESC LIMIT 1";
                connection.query(selectBidQuery, [listing.listing_id], (err, bidResults) => {
                    if (err) {
                        db.disconnectDB();
                        return callback(err);
                    }

                    if (bidResults.length > 0) {
                        const { user_id, bid_amount, bid_datetime } = bidResults[0];
                        const insertQuery = "INSERT INTO `successfulbid_tbl` (user_id, listing_id, successfulbid_datetime, successfulbid_amount) VALUES (?, ?, ?, ?)";
                        connection.query(insertQuery, [user_id, listing.listing_id, bid_datetime, bid_amount], (err, insertResults) => {
                            if (err) {
                                db.disconnectDB();
                                return callback(err);
                            }
                            console.log(`auction_id: ${auction_id} listing_id: ${listing.listing_id} の落札処理が完了しました。`);
                            successfulBids.push({ user_id, listing_id: listing.listing_id, bid_datetime, bid_amount });

                            processListing(index + 1);
                        });
                    } else {
                        processListing(index + 1);
                    }
                });
            };
            processListing(0);
        });
    });
};

//メール送る関数
const sendMail = (auction_id, results, callback) => {
    console.log("送信するデータ:", auction_id, results);
    const formattedResults = results.map(result => {
        return {
            userId: result.user_id,
            listingId: result.listing_id,
            bidDatetime: new Date(result.bid_datetime),
            bidAmount: result.bid_amount
        };
    });

    console.log(formattedResults);

    const nodemailer = require('nodemailer');

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
    const formattoday = formatDate(today);

    const connection = db.connectDB();
    const { userId } = formattedResults[0]; // formattedResultsの最初の要素からuserIdを取得

    connection.query('SELECT user_name, mail FROM user_tbl WHERE user_id = ?', [userId], (err, userResults) => {
        if (err) {
            console.error('ユーザー情報の取得に失敗しました:', err);
            if (callback) return callback(err);
            return;
        }

        const { user_name, mail } = userResults[0];
        connection.query('SELECT start_datetime FROM auction_tbl WHERE auction_id = ?', [auction_id], (err, auctionResults) => {
            if (err) {
                console.error('オークション情報の取得に失敗しました:', err);
                if (callback) return callback(err);
                return;
            }

            const { start_datetime } = auctionResults[0];
            connection.query('SELECT listing_id, car_id FROM listing_tbl WHERE auction_id = ?', [auction_id], (err, listingResults) => {
                if (err) {
                    console.error('リスティング情報の取得に失敗しました:', err);
                    if (callback) return callback(err);
                    return;
                }

                const { listing_id, car_id } = listingResults[0];
                connection.query('SELECT car_type FROM car_tbl WHERE car_id = ?', [car_id], (err, carResults) => {
                    if (err) {
                        console.error('車情報の取得に失敗しました:', err);
                        if (callback) return callback(err);
                        return;
                    }

                    const { car_type } = carResults[0];

                    // メール関連
                    const transporter = nodemailer.createTransport({
                        service: `${mailservice}`,         //メールの種類
                        auth: {
                            user: `${From_Email}`,// 送信元メールを入力
                            pass: `${Pass}`       // アプリパスワードを使用
                        }
                    });

                    const mailOptions = {
                        from: `${From_Email}`, //送信元メールを入力
                        to: mail, // 送信先メールアドレス
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
                            落札価格: ${formattedResults[0].bidAmount}

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
                            if (callback) return callback(error);
                        } else {
                            console.log('メールが送信されました:', info.response);
                            if (callback) return callback(null, info.response);
                        }
                    });
                });
            });
        });
    });
};



module.exports = { getAuctionEnd, endAuction, sendMail };
