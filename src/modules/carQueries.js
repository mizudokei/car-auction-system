const mysql = require('mysql2');
const db = require('./db');

// 車両情報を全件あるいは検索条件に基づいて取得するメソッド
const getCars = (searchTerm, callback) => {
    const connection = db.connectDB();
    let sql = 'SELECT * FROM car_tbl';
    let params = [];

    if (searchTerm) {
        sql += ' WHERE car_type LIKE ?';
        params.push(`%${searchTerm}%`);
    }

    connection.query(sql, params, (err, results) => {
        if (err) {
            console.error('クエリ実行エラー：', err);
            callback(err, null);
        } else {
            callback(null, results);
        }
    });

    db.disconnectDB(connection);
};

// 車両情報をIDに基づいて取得するメソッド
const getCarById = (car_id, callback) => {
    const connection = db.connectDB();
    const sql = 'SELECT * FROM car_tbl WHERE car_id = ?';

    connection.query(sql, [car_id], (err, results) => {
        if (err) {
            console.error('クエリ実行エラー：', err);
            callback(err, null);
        } else {
            callback(null, results[0]); // 1件の結果を返す
        }
    });

    db.disconnectDB(connection);
};

// 車両情報を登録するメソッド
const addCar = (carData, callback) => {
    const connection = db.connectDB();
    const {
        car_type,
        car_manufacturer,
        car_year,
        car_mileage,
        car_color,
        car_image
    } = carData;

    const sql = 'INSERT INTO car_tbl (car_type, car_manufacturer, car_year, car_mileage, car_color, car_image, car_status) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const params = [
        car_type,
        car_manufacturer,
        car_year,
        car_mileage,
        car_color,
        car_image || null, // 画像がない場合はnull
        '在庫あり' // デフォルトのステータス
    ];

    connection.query(sql, params, (err, results) => {
        if (err) {
            console.error('クエリ実行エラー：', err);
            callback(err, null);
        } else {
            callback(null, results);
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

    const sql = car_image
        ? 'UPDATE car_tbl SET car_type = ?, car_manufacturer = ?, car_year = ?, car_mileage = ?, car_color = ?, car_image = ? WHERE car_id = ?'
        : 'UPDATE car_tbl SET car_type = ?, car_manufacturer = ?, car_year = ?, car_mileage = ?, car_color = ? WHERE car_id = ?';

    const params = car_image
        ? [car_type, car_manufacturer, car_year, car_mileage, car_color, car_image, car_id]
        : [car_type, car_manufacturer, car_year, car_mileage, car_color, car_id];

    connection.query(sql, params, (err, results) => {
        if (err) {
            console.error('クエリ実行エラー：', err);
            callback(err, null);
        } else {
            callback(null, results);
        }
    });

    db.disconnectDB(connection);
};

// 車両情報をIDに基づいて削除するメソッド
const deleteCarById = (car_id, callback) => {
    const connection = db.connectDB();
    const sql = 'DELETE FROM car_tbl WHERE car_id = ?';

    connection.query(sql, [car_id], (err, results) => {
        if (err) {
            console.error('クエリ実行エラー：', err);
            callback(err, null);
        } else {
            callback(null, results);
        }
    });

    db.disconnectDB(connection);
};

module.exports = {
    getCars,
    getCarById,
    addCar,
    updateCarById,
    deleteCarById
};
