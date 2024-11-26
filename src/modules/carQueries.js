const mysql = require('mysql2');
const db = require('./db');

// 車両情報を全件取得するメソッド
const getAllCars = (callback) => {
    const connection = db.connectDB();
    const sql = 'SELECT * FROM car_tbl'
    connection.query(sql, (err, results) => {
        if (err) {
            console.error("✅ クエリ実行エラー：\n", err);
            callback(err, null);
            return;
        }
        callback(null, results);
    });

    db.disconnectDB(connection);
};

// 車両情報をIDに基づいて取得するメソッド
const getCarById = (car_id, callback) => {
    const connection = db.connectDB();
    const sql = 'SELECT * FROM car_tbl WHERE car_id = ?';
    connection.query(sql, [car_id], (err, results) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, results[0]);  // 1件の結果を返す
        }
    });

    db.disconnectDB(connection);
};

// 車両情報をIDに基づいて更新するメソッド
const updateCarById = (car_id, carData, callback) => {
    const connection = db.connectDB();
    const {
        car_type,
        car_manufacturer,
        car_year,
        car_mileage,
        car_color,
        car_image
    } = carData;

    // 画像がアップロードされていない場合は現在の画像を維持
    const sql = car_image
        ? 'UPDATE car_tbl SET car_type = ?, car_manufacturer = ?, car_year = ?, car_mileage = ?, car_color = ?, car_image = ? WHERE car_id = ?'
        : 'UPDATE car_tbl SET car_type = ?, car_manufacturer = ?, car_year = ?, car_mileage = ?, car_color = ? WHERE car_id = ?';

    const params = car_image
        ? [car_type, car_manufacturer, car_year, car_mileage, car_color, car_image, car_id]
        : [car_type, car_manufacturer, car_year, car_mileage, car_color, car_id];

    connection.query(sql, params, (err, results) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, results);
        }
    });

    db.disconnectDB(connection);
};

module.exports = {
    getAllCars,
    getCarById,
    updateCarById
};
