const express = require('express');
const app = express();
const db = require('./modules/db');
const carQueries = require('./modules/carQueries');
const auctionQueries = require('./modules/auctionQueries');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');

// body-parser の設定
app.use(bodyParser.urlencoded({ extended: true }));  // URLエンコードされたデータを処理
app.use(bodyParser.json());  // JSON形式のデータを処理

// 車両画像アップロードの設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../resources/car-images'));
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
    const searchTerm = req.query.search || '';  // 検索キーワード（デフォルトは空文字）

    // 車両データの取得
    carQueries.getCars(searchTerm, (err, cars) => {
        if (err) {
            res.status(500).send("エラーが発生しました");
            return;
        }
        res.render('car-management', { title: '車両管理画面', cars });
    });
});

// 車両登録画面
app.get('/carRegistration', (req, res) => {
    res.render('car-registration', { title: '車両登録' });
});

// 車両登録処理
app.post('/carRegistration', upload.single('car_image'), (req, res) => {
    // フォームからの入力データ
    const { car_type, car_manufacturer, car_year, car_mileage, car_color } = req.body;

    // アップロードされた画像のパス
    const carImagePath = req.file ? `/resources/car-images/${req.file.filename}` : null;

    // データベースに登録
    carQueries.addCar({
        car_type,
        car_manufacturer,
        car_year,
        car_mileage,
        car_color,
        car_image: carImagePath,
        car_status: '在庫あり' // デフォルトで「在庫あり」
    }, (err) => {
        if (err) {
            console.error("登録エラー:", err);
            res.status(500).send("登録に失敗しました");
        } else {
            res.redirect('/carManagement'); // 登録後に車両管理画面へリダイレクト
        }
    });
});


// 車両情報編集画面
app.get('/editCar/:car_id', (req, res) => {
    const carId = req.params.car_id;  // :car_id を取得
    carQueries.getCarById(carId, (err, car) => {
        res.render('car-edit', { title: '車両情報編集ページ', car });
    });
});

// オークション管理画面へのルート
app.get('/auctionManagement', (req, res) => 
    { res.render('auction-management', { title: 'オークション管理画面' }); 
}); 

// 登録完了画面
app.get('/registrationComplete', (req, res) => 
    { res.render('registration-complete'); }
);

// 車両情報更新処理
app.post('/updateCar/:car_id', upload.single('car_image'), (req, res) => {
    const carId = req.params.car_id;

    // フォームからの入力データ
    const { car_type, car_manufacturer, car_year, car_mileage, car_color } = req.body;

    // アップロードされた画像のパス
    const newImagePath = req.file ? `/resources/car-images/${req.file.filename}` : null;

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

// 車両削除処理
app.post('/deleteCar/:car_id', (req, res) => {
    const carId = req.params.car_id;  // 削除対象の車両ID

    carQueries.deleteCarById(carId, (err) => {
        if (err) {
            console.error("削除エラー:", err);
            res.status(500).send("削除に失敗しました");
        } else {
            res.redirect('/carManagement');  // 削除後に車両管理画面へリダイレクト
        }
    });
});


// オークション作成処理 
app.post('/createAuction', (req, res) => 
    { const { start_datetime, end_datetime, auction_status, employee_id } = req.body; 
auctionQueries.createAuction({ 
    start_datetime, end_datetime, 
    auction_status, employee_id 
}, 
(err) => 
    { if (err) { console.error('オークション作成エラー:', err); 
        res.status(500).send('オークションの作成に失敗しました'); 
    } else { res.redirect('/registrationComplete');
         // 登録完了画面にリダイレクト 
         } }); });

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

// アプリケーション終了時にデータベース接続を切断
process.on('SIGINT', () => {
    db.disconnectDB();
    process.exit();
});
