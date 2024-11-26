const mysql = require('mysql2');

// データベース接続情報
const dbConfig = {
    host: 'localhost',
    user: 'py24user',
    password: 'py24pass',
    database: 'auction_system_db'
};

// 接続オブジェクトをモジュールスコープで管理
let connection;

// データベース接続
const connectDB = () => {
    if (!connection) {  // すでに接続されていない場合のみ新しく接続
        connection = mysql.createConnection(dbConfig);
        connection.connect((err) => {
            if (err) {
                console.error('⛔ データベース接続エラー：\n', err.stack);
                return;
            }
            console.log('✅ データベース接続');
        });
    }
    return connection;
};

// データベース切断
const disconnectDB = () => {
    if (connection) {
        connection.end((err) => {
            if (err) {
                console.error('⛔ データベース切断エラー：\n', err.stack);
                return;
            }
            console.log('✅ データベース切断');
        });
        connection = null; // 接続オブジェクトをnullにリセット
    }
};

module.exports = {
    connectDB,
    disconnectDB,
};
