// auctionQueries.js
const { connectDB } = require('./db');  // db接続をインポート

const executeQuery = (query, params) => {
    const db = connectDB();  // データベース接続を取得
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

const createAuction = async (auctionData, callback) => {
    const { start_datetime, end_datetime, auction_status, employee_id } = auctionData;

    const query = `
        INSERT INTO auction_tbl (start_datetime, end_datetime, auction_status, employee_id)
        VALUES (?, ?, ?, ?)
    `;

    try {
        const results = await executeQuery(query, [start_datetime, end_datetime, auction_status, employee_id]);
        callback(null, results);
    } catch (err) {
        console.error('オークション作成エラー:', err);
        callback(err);
    }
};

module.exports = {
    createAuction
};
