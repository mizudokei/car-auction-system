// auctionService.js
const db = require('./db'); // dbモジュールのインポート

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

// オークションデータと関連する車情報を取得する関数
const getAuctionData = (callback) => {
    const connection = db.connectDB(); // 接続を確立
    const today = new Date();

    const query = `
        SELECT auction_id, start_datetime, end_datetime
        FROM auction_tbl
        WHERE auction_status = '開催中' 
        AND start_datetime <= ?
        AND end_datetime >= ?;
    `;
    
    connection.query(query, [today, today], (err, auctions) => {
        if (err) return callback(err, null);

        const auctionIds = auctions.map(auction => auction.auction_id);
        if (auctionIds.length === 0) {
            return callback(null, []);
        }

        // 開始、終了日時のフォーマット
        const formattedAuctions = auctions.map(auction => ({
            auction_id: auction.auction_id,
            start_datetime: formatDate(auction.start_datetime),
            end_datetime: formatDate(auction.end_datetime)
        }));

        const carQuery = `
            SELECT l.listing_id, c.car_id, c.car_type, c.car_manufacturer, l.current_price, l.auction_id, c.car_image, c.car_year, c.car_mileage, c.car_color
            FROM listing_tbl l
            JOIN car_tbl c ON l.car_id = c.car_id
            WHERE l.auction_id IN (?);
        `;
        
        connection.query(carQuery, [auctionIds], (err, carDetails) => {
            if (err) return callback(err, null);

            // 車情報があるオークションのみフィルタリング
            const auctionData = formattedAuctions.map(auction => {
                const cars = carDetails.filter(car => car.auction_id === auction.auction_id);
                // 車情報がないオークションは除外
                if (cars.length > 0) {
                    return {
                        ...auction,
                        cars: cars
                    };
                }
                return null; // 車情報がない場合はnullを返す
            }).filter(auction => auction !== null);  // null を除外

            callback(null, auctionData);
        });
    });
};


module.exports = { getAuctionData };