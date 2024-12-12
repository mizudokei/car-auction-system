const db = require('./db');

const getCarDetails = (listingId, callback) => {
    const connection = db.connectDB();
    const query = `
        SELECT c.*, m.manufacturer_name 
        FROM car_tbl c
        JOIN listing_tbl l ON c.car_id = l.car_id
        JOIN manufacturer_tbl m ON c.manufacturer_id = m.manufacturer_id
        WHERE l.listing_id = ?;
    `;
    
    connection.query(query, [listingId], (err, results) => {
        db.disconnectDB();
        if (err) {
            return callback(err);
        }
        callback(null, results[0]); // 単一の結果を返す
    });
};

const getCurrentPrice = (listingId, callback) => {
    const connection = db.connectDB();
    const query = 'SELECT current_price FROM listing_tbl WHERE listing_id = ?';
    
    connection.query(query, [listingId], (err, results) => {
        db.disconnectDB();
        if (err) {
            return callback(err);
        }
        callback(null, results[0] ? results[0].current_price : null); // 結果が存在しない場合はnullを返す
    });
};

const getBidDetails = (auctionId, callback) => {
    const connection = db.connectDB();
    const query = `
        SELECT bid_datetime, bid_amount, bid_id, user_id
        FROM bid_tbl
        WHERE listing_id = ?
        ORDER BY bid_datetime DESC
        LIMIT 10;
    `;
    
    connection.query(query, [auctionId], (err, results) => {
        db.disconnectDB();
        if (err) {
            return callback(err);
        }

        // 日付をフォーマットする
        function formatDate(dateString) {
            const date = new Date(dateString);
        
            // 日付部分のフォーマット
            const year = date.getFullYear();
            const month = ('0' + (date.getMonth() + 1)).slice(-2);
            const day = ('0' + date.getDate()).slice(-2);
            const hours = ('0' + date.getHours()).slice(-2);
            const minutes = ('0' + date.getMinutes()).slice(-2);
        
            // 曜日部分の取得
            const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
            const weekday = weekdays[date.getDay()];
        
            return `${year}/${month}/${day} ${hours}:${minutes} (${weekday})`;
        }
        const formatteddetails = results.map(detail => ({
            bid_datetime: formatDate(detail.bid_datetime),
            bid_amount: detail.bid_amount,
            bid_id: detail.bid_id,
            user_id: detail.user_id
        }));

        callback(null, formatteddetails);
    });
};


const addbit = (auctionId, listingId, userId, bidDatetime, bidAmount, callback) => {
    const connection = db.connectDB();

    connection.beginTransaction((err) => {
        if (err) {
            return callback(err);
        }

        // 入札履歴追加
        const query1 = 'INSERT INTO `bid_tbl` (`user_id`, `listing_id`, `bid_datetime`, `bid_amount`) VALUES (?, ?, ?, ?)';
        connection.query(query1, [userId, listingId, bidDatetime, bidAmount, auctionId], (err, results) => {
            if (err) {
                return connection.rollback(() => {
                    callback(err);
                });
            }

            // 現在価格更新
            const query2 = 'UPDATE `listing_tbl` SET `current_price` = ? WHERE `listing_id` = ?';
            connection.query(query2, [bidAmount, auctionId], (err, results) => {
                if (err) {
                    return connection.rollback(() => {
                        callback(err);
                    });
                }

                // トランザクションをコミット
                connection.commit((err) => {
                    db.disconnectDB();
                    if (err) {
                        return connection.rollback(() => {
                            callback(err);
                        });
                    }
                    callback(null);
                });
            });
        });
    });
};

module.exports = { getCarDetails, getBidDetails, getCurrentPrice, addbit};
