const db = require('./db'); // データベース接続モジュールをインポート

const addUser = (userData, callback) => {
    const { user_name, mail, tel, address, pass } = userData;
    const sql = 'INSERT INTO user_tbl (user_name, mail, tel, address, pass) VALUES (?, ?, ?, ?, ?)';

    db.connectDB().query(sql, [user_name, mail, tel, address, pass], (err, results) => {
        if (err) {
            console.error('ユーザー登録エラー:', err);
            return callback(err);
        }
        callback(null, results);
    });
};

const isEmailUnique = (mail, callback) => {
    const sql = 'SELECT COUNT(*) AS count FROM user_tbl WHERE mail = ?';
    db.connectDB().query(sql, [mail], (err, results) => {
        if (err) {
            console.error('メールアドレスの一意性チェックエラー:', err);
            return callback(err);
        }
        callback(null, results[0].count === 0); // 一意であればtrueを返す
    });
};

const findUserByEmail = (email, callback) => {
    const connection = db.connectDB();
    const query = 'SELECT * FROM user_tbl WHERE mail = ?'; // mailカラムを使用
    connection.query(query, [email], (err, results) => {
        db.disconnectDB();
        if (err) {
            return callback(err);
        }
        callback(null, results[0]); // ユーザーが見つかった場合はその情報を返す
    });
};

const updateUser = (userId, userData, callback) => {
    const connection = db.connectDB();
    const { user_name, email, tel, address } = userData;
    const query = `
        UPDATE user_tbl 
        SET user_name = ?, mail = ?, tel = ?, address = ? 
        WHERE user_id = ?;
    `;

    connection.query(query, [user_name, email, tel, address, userId], (err, results) => {
        db.disconnectDB();
        if (err) {
            return callback(err);
        }
        callback(null, results);
    });
};

const updatePassword = (userId, newPassword, callback) => {
    const connection = db.connectDB();
    const query = 'UPDATE user_tbl SET pass = ? WHERE user_id = ?';

    connection.query(query, [newPassword, userId], (err, results) => {
        db.disconnectDB();
        if (err) {
            return callback(err);
        }
        callback(null, results);
    });
};

module.exports = {
    addUser,
    isEmailUnique,
    findUserByEmail,
    updateUser,
    updatePassword,
};
