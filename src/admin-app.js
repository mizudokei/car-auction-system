const express = require('express');
const app = express();
const db = require('./modules/db')
const path = require('path');
const mysql = require('mysql');
const { title } = require('process');
const { connect } = require('http2');

// 静的ファイル
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/resources', express.static(path.join(__dirname, '../resources')));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    db.connectDB();
    res.render('admin-index', { title: 'トップページ' });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
// アプリケーション終了時にデータベース接続を切断
process.on('SIGINT', () => {
    db.disconnectDB();
    process.exit();
});
