const db = require('./db');
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

const getbit = (userId, callback) => {
    const connection = db.connectDB();
    const query = `
        SELECT
            a.auction_id,
            l.listing_id,
            b.bid_id,
            c.car_type,
            b.bid_datetime,
            b.bid_amount,
            a.end_datetime,
            a.auction_status
        FROM
            bid_tbl b
        JOIN
            listing_tbl l ON b.listing_id = l.listing_id
        JOIN
            car_tbl c ON l.car_id = c.car_id
        JOIN
            auction_tbl a ON l.auction_id = a.auction_id
        WHERE
            b.user_id = 1;
    `;
    connection.query(query, [userId], (err, results) => {
        if (err) {
            db.disconnectDB();
            return callback(err);
        }
        db.disconnectDB();
        const formatresults = results.map(result => ({
            auction_id: result.auction_id,
            listing_id: result.listing_id,
            bid_id: result.bid_id,
            car_type: result.car_type,
            bid_datetime: formatDate(result.bid_datetime),
            bid_amount: result.bid_amount,
            end_datetime: formatDate(result.end_datetime),
            auction_status: result.auction_status
        }));
        callback(null, formatresults);
    });
};

const getsuccessfulbid = (userId, callback) => {
    const connection = db.connectDB();
    const query = `
        SELECT
            a.auction_id,
            s.successfulbid_id AS bid_id,
            l.listing_id,
            c.car_type,
            s.successfulbid_amount,
            s.successfulbid_datetime
        FROM
            successfulbid_tbl s
        JOIN
            listing_tbl l ON s.listing_id = l.listing_id
        JOIN
            car_tbl c ON l.car_id = c.car_id
        JOIN
            auction_tbl a ON l.auction_id = a.auction_id
        WHERE
            s.user_id = ?;
    `;
    connection.query(query, [userId], (err, results) => {
        if (err) {
            db.disconnectDB(connection);
            return callback(err);
        }

        // 結果を配列に格納
        const successfulBids = results.map(result => ({
            auction_id: result.auction_id,
            bid_id: result.bid_id,
            listing_id: result.listing_id,
            car_type: result.car_type,
            successfulbid_amount: result.successfulbid_amount,
            successfulbid_datetime: formatDate(result.successfulbid_datetime)
        }));

        db.disconnectDB(connection);
        callback(null, successfulBids);
    });
};

module.exports = { getsuccessfulbid, getbit };