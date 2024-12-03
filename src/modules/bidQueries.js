const db = require('./db');

const getCarDetails = (carId, callback) => {
    const connection = db.connectDB();
    const query = 'SELECT * FROM car_tbl WHERE car_id = ?';
    
    connection.query(query, [carId], (err, results) => {
        db.disconnectDB();
        if (err) {
            return callback(err);
        }
        callback(null, results[0]); // 単一の結果を返す
    });
};

const getCurrentPrice = (auctionId, callback) => {
    const connection = db.connectDB();
    const query = 'SELECT current_price FROM listing_tbl WHERE auction_id = ?';
    
    connection.query(query, [auctionId], (err, results) => {
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
        SELECT bid_datetime, bid_amount 
        FROM bid_tbl
        WHERE auction_id = ?;
    `;
    
    connection.query(query, [auctionId], (err, results) => {
        db.disconnectDB();
        if (err) {
            return callback(err);
        }
        callback(null, results); // 結果が存在しない場合はnullを返す
    });
};

const addbit = (auctionId, listingId, userId, bidDatetime, bidAmount, callback) => {
    const connection = db.connectDB();

    connection.beginTransaction((err) => {
        if (err) {
            return callback(err);
        }

        // 入札履歴追加
        const query1 = 'INSERT INTO `bid_tbl` (`user_id`, `listing_id`, `bid_datetime`, `bid_amount`, `auction_id`) VALUES (?, ?, ?, ?, ?)';
        connection.query(query1, [userId, listingId, bidDatetime, bidAmount, auctionId], (err, results) => {
            if (err) {
                return connection.rollback(() => {
                    callback(err);
                });
            }

            // 現在価格更新
            const query2 = 'UPDATE `listing_tbl` SET `current_price` = ? WHERE `auction_id` = ?';
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


module.exports = { getCarDetails, getBidDetails, getCurrentPrice, addbit };
