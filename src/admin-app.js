const express = require('express');
const app = express();
const db = require('./modules/db');
const carQueries = require('./modules/carQueries');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');

// body-parser の設定
app.use(bodyParser.urlencoded({ extended: true }));  // URLエンコードされたデータを処理
app.use(bodyParser.json());  // JSON形式のデータを処理

// アップロードの設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../resources/car_images'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// 静的ファイル
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/resources', express.static(path.join(__dirname, '../resources')));
app.set('view engine', 'ejs');

// トップページ
app.get('/', (req, res) => {
    res.render('admin-index', { title: '管理者用トップページ' });
});

// 車両管理画面
app.get('/carManagement', (req, res) => {
    carQueries.getAllCars((err, cars) => {
        res.render('car-management', { title: '車両管理画面', cars });
    });
});

// 車両情報編集画面
app.get('/editCar/:car_id', (req, res) => {
    const carId = req.params.car_id;  // :car_id を取得
    carQueries.getCarById(carId, (err, car) => {
        res.render('car-edit', { title: '車両情報編集ページ', car });
    });
});

// 車両情報更新処理
app.post('/updateCar/:car_id', upload.single('car_image'), (req, res) => {
    const carId = req.params.car_id;

    // フォームからの入力データ
    const { car_type, car_manufacturer, car_year, car_mileage, car_color } = req.body;

    // アップロードされた画像のパス
    const newImagePath = req.file ? `/resources/car_images/${req.file.filename}` : null;

    // 車両情報を更新する
    carQueries.updateCarById(carId, {
        car_type,
        car_manufacturer,
        car_year,
        car_mileage,
        car_color,
        car_image: newImagePath // 新しい画像パス（選択されなかった場合は null）
    }, (err) => {
        if (err) {
            console.error("更新エラー:", err);
            res.status(500).send("更新に失敗しました");
        } else {
            res.redirect('/carManagement');
        }
    });
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

// アプリケーション終了時にデータベース接続を切断
process.on('SIGINT', () => {
    db.disconnectDB();
    process.exit();
});
