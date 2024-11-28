// auctionService.js
const db = require('./db'); // dbモジュールのインポート

// オークションデータと関連する車情報を取得する関数
const getAuctionData = (callback) => {
    const connection = db.connectDB(); // 接続を確立

    const query = `
        SELECT auction_id, start_datetime, end_datetime
        FROM auction_tbl
        WHERE auction_status = '開催中';
    `;
    
    connection.query(query, [], (err, auctions) => {
        if (err) return callback(err, null);

        const auctionIds = auctions.map(auction => auction.auction_id);
        if (auctionIds.length === 0) {
            return callback(null, []);
        }

        const carQuery = `
            SELECT l.listing_id, c.car_type, c.car_manufacturer, l.current_price, l.auction_id, c.car_image
            FROM listing_tbl l
            JOIN car_tbl c ON l.car_id = c.car_id
            WHERE l.auction_id IN (?);

        `;
        
        connection.query(carQuery, [auctionIds], (err, carDetails) => {
            if (err) return callback(err, null);

            // 車情報があるオークションのみフィルタリング
            const auctionData = auctions.map(auction => {
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
