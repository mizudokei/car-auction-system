const express = require('express');
const app = express();
const db = require('./db')
const path = require('path');

// データベース接続
db.connectDB();

// viewsフォルダを正しく指定
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index', { title: 'トップページ' });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});


// アプリケーション終了時にデータベース接続を切断
process.on('SIGINT', () => {
    db.disconnectDB();
    process.exit();
});
