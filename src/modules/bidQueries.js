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

const updateCurrentPrice = (auctionId, carId, bidAmount, callback) => {
    const connection = db.connectDB();
    const query = 'UPDATE listing_tbl SET current_price = ? WHERE auction_id = ?';

    connection.query(query, [bidAmount, auctionId, carId], (err, results) => {
        db.disconnectDB();
        if (err) {
            return callback(err);
        }
        callback(null);
    });
};

module.exports = { getCarDetails, getCurrentPrice, updateCurrentPrice };
