// db.js
const mysql = require('mysql2');

// データベース接続情報
const dbConfig = {
	host: 'localhost',
	user: 'py24user',
	password: 'py24pass',
	database: 'auction_system_db'
};

// 接続の作成
const connection = mysql.createConnection(dbConfig);

// データベース接続
const connectDB = () => {
	connection.connect((err) => {
		if (err) {
			console.error('❌【データベース接続エラー】\n', err.stack);
			return;
		}
		console.log('データベース接続');
		return connection;
	});
};

// データベース切断
const disconnectDB = () => {
	connection.end((err) => {
		if (err) {
			console.error('❌【データベース切断エラー】\n', err.stack);
			return;
		}
		console.log('データベース切断');	
	});
};

// モジュールのエクスポート
module.exports = {
	connectDB,
	disconnectDB,
};
