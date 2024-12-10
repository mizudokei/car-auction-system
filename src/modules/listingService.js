// listingService.js
const db = require('./db');

const getActiveAuctionEvents = async () => {
	try {
		const connection = db.connectDB();
		const query = `
			SELECT auction_id, start_datetime, end_datetime
			FROM auction_tbl
			WHERE auction_status != '終了'
			`;
		return new Promise((resolve, reject) => {
			connection.query(query, (err, results) => {
				if (err) {
					console.error('クエリエラー:', err);
					return reject(err);
				}
				resolve(results);
			});
		});
	} catch (err) {
		console.error('データベース接続エラー:', err);
		throw err;
	}
};

const getAvailableCars = async () => {
	const connection = db.connectDB(); // 接続を取得
	const query = `
		SELECT c.car_id, c.car_type, m.manufacturer_name, c.car_year, c.car_mileage, c.car_color, c.car_image
		FROM car_tbl c
		JOIN manufacturer_tbl m ON c.manufacturer_id = m.manufacturer_id
		WHERE c.car_status = '在庫あり';
		`;
	return new Promise((resolve, reject) => {
		connection.query(query, (err, results) => {
			if (err) {
				return reject(err);
			}
			resolve(results);
		});
	});
};

const registerListings = async (auction_id, formData) => {
	const selectedCars = formData.selectedCars || [];
	const connection = db.connectDB();  // データベース接続を取得
	console.log('Processing auction_id:', auction_id); // デバッグ用ログ
	console.log('Selected cars:', selectedCars); // デバッグ用ログ
	for (const carId of selectedCars) {
		const startingPrice = formData[`startingPrice_${carId}`];
		console.log(`Processing car_id: ${carId}, startingPrice: ${startingPrice}`); // デバッグ用ログ
		if (!startingPrice || startingPrice <= 0) {
			throw new Error(`車両ID ${carId} の開始価格が無効です。`);
		}
		// 出品情報を登録
		const insertQuery = `
			INSERT INTO listing_tbl (car_id, starting_price, current_price, auction_id)
			VALUES (${carId}, ${startingPrice}, ${startingPrice}, ${auction_id});
		`;
		await new Promise((resolve, reject) => {
			connection.query(insertQuery, (err, results) => {
				if (err) {
					return reject(err);
				}
				resolve(results);
			});
		});
		// オークションステータス更新
		const auctionQuery = "UPDATE `auction_tbl` SET `auction_status` = '開催中' WHERE `auction_id` = ?";
		await new Promise((resolve, reject) => {
			connection.query(auctionQuery, [auction_id], (err, results) => {  // プレースホルダーに渡す値を配列として渡す
				if (err) {
					return reject(err);
				}
				resolve(results);
			});
		});
		
		// 車両ステータスを更新
		const updateQuery = `
			UPDATE car_tbl
			SET car_status = "出品中"
			WHERE car_id = ${carId};
			`;
		await new Promise((resolve, reject) => {
			connection.query(updateQuery, (err, results) => {
				if (err) {
					return reject(err);
				}
				resolve(results);
			});
		});
	}
};

// 出品登録済みの車両データを取得するメソッド
const getListedCars = async () => {
	const connection = db.connectDB();
	const query = `
		SELECT c.car_id, c.car_type, m.manufacturer_name, c.car_year, c.car_mileage, c.car_color, c.car_image
		FROM car_tbl c
		JOIN manufacturer_tbl m ON c.manufacturer_id = m.manufacturer_id
		WHERE c.car_status = '出品中';
		`;
	return new Promise((resolve, reject) => {
		connection.query(query, (err, results) => {
			if (err) {
				return reject(err);
			}
			resolve(results);
		});
	});
};

const stopListings = async (carIds) => {
	const connection = db.connectDB();
	for (const carId of carIds) {
		const updateQuery = `
			UPDATE car_tbl
			SET car_status = "在庫あり"
			WHERE car_id = ${carId} AND car_id IN (
			SELECT car_id FROM listing_tbl WHERE auction_id IN (
			SELECT auction_id FROM auction_tbl WHERE auction_status != '開催中'
			)
			);
			`;
		await new Promise((resolve, reject) => {
			connection.query(updateQuery, (err, results) => {
				if (err) {
					return reject(err);
				}
				resolve(results);
			});
		});
	}
};

module.exports = {
	getActiveAuctionEvents,
	getAvailableCars,
	registerListings,
	stopListings,
	getListedCars
};
