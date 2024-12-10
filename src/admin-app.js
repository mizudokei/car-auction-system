const express = require('express');
const router = express.Router();
const app = express();
const db = require('./modules/db');
const carQueries = require('./modules/carQueries');
const manufacturerQueries = require('./modules/manufacturerQueries');
const auctionQueries = require('./modules/auctionQueries');
const listingService = require('./modules/listingService');
const auctionEnd = require('./modules/auctionEnd');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');

// body-parser の設定
app.use(bodyParser.urlencoded({ extended: true }));  // URLエンコードされたデータを処理
app.use(bodyParser.json());  // JSON形式のデータを処理

// サーバーが起動するときに実行する処理
const initializeServer = () => {
    auctionEnd.getAuctionEnd((err, AuctionEnd) => {
        if (err) {
            console.error("オークション終了データの取得エラー:", err);
            return;
        }
        AuctionEnd.forEach(auction => {
            const endDate = new Date(auction.end_datetime);
            const currentDate = new Date();
            const timeDiff = endDate - currentDate;
            console.log(`オークションID: ${auction.auction_id}, 残り時間: ${timeDiff}`);

            setTimeout(() => {
                auctionEnd.endAuction(auction.auction_id, (err, results) => {//オークションを終了。終了したオークションのlisting_idを取得
                    if (err) {
                        console.error(`オークションID ${auction.auction_id} の終了処理でエラーが発生しました:`, err);
                    } else {
                        console.log(`オークションID ${auction.auction_id} の終了処理が成功しました:`, results);
                        results.forEach((result) => {
                            auctionEnd.successfulbid(result.listing_id, (err, bidder) => {//落札処理
                                if (err) {
                                    console.error(`オークションID ${auction.auction_id}, リスティングID ${result.listing_id} の落札処理でエラーが発生しました:`, err);
                                } else {
                                    if (bidder === "y") { //落札者がいるか
                                        auctionEnd.sendMail(auction.auction_id, result.listing_id, (err) => {//メール送信
                                            if (err) {
                                                console.error(`オークションID ${auction.auction_id}, リスティングID ${result.listing_id} のメール送信でエラーが発生しました:`, err);
                                            } else {
                                                console.log(`オークションID ${auction.auction_id}, リスティングID ${result.listing_id} のメール送信が成功しました`);
                                            }
                                        });
                                    }
                                }
                            });                            
                        });
                    }
                });                
            }, timeDiff);            
        });
    });
};
initializeServer();

// 車両画像アップロードの設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../resources/car-images'));
    },
    filename: (req, file, cb) => {
        const formattedFileName = Buffer.from(file.originalname, 'utf-8').toString('utf-8');
        cb(null, `${Date.now()}_${formattedFileName}`);
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
    manufacturerQueries.getManufacturers((err, manufacturers) => {
        if (err) {
            return res.status(500).send("メーカー情報の取得に失敗しました");
        }
        res.render('car-registration', { title: '車両登録', manufacturers });
    });
});

// 車両登録処理
app.post('/carRegistration', upload.single('car_image'), (req, res) => {
    const { car_type, car_manufacturer, car_year, car_mileage, car_color } = req.body;

    // アップロードされた画像のパス
    const carImagePath = req.file ? `/resources/car-images/${req.file.filename}` : null;

    // データベースに登録
    carQueries.addCar({
        car_type,
        car_manufacturer, // manufacturer_id を使用
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
        if (err) {
            return res.status(500).send("車両情報の取得に失敗しました");
        }
        manufacturerQueries.getManufacturers((err, manufacturers) => {
            if (err) {
                return res.status(500).send("メーカー情報の取得に失敗しました");
            }
            res.render('car-edit', { title: '車両情報編集ページ', car, manufacturers });
        });
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

// 出品登録画面の表示
app.get('/car-listing', async (req, res) => {
    try {
        const events = await listingService.getActiveAuctionEvents();
        const cars = await listingService.getAvailableCars();
        const listedCars = await listingService.getListedCars(); // 出品登録済みの車両を取得
        res.render('car-listing', { title: '出品登録ページ', events, cars, listedCars });
    } catch (err) {
        console.error('エラーが発生しました:', err.message);
        res.status(500).send('エラーが発生しました');
    }
});

// 出品停止処理
app.post('/car-listing/stop', async (req, res) => {
    try {
        const { stopCars } = req.body;
        if (!stopCars || stopCars.length === 0) {
            return res.status(400).send('選択された車両がありません');
        }
        const carIds = Array.isArray(stopCars) ? stopCars : [stopCars];
        await listingService.stopListings(carIds);
        res.redirect('/car-listing');
    } catch (err) {
        console.error('エラーが発生しました:', err.message);
        res.status(500).send('エラーが発生しました');
    }
});

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
        car_manufacturer, // manufacturer_id を使用
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

//出品登録処理
app.post('/car-listing/register', async (req, res) => {
    try {
        const { auction_id, selectedCars } = req.body;

        // `selectedCars`が存在しない場合、エラーを返す
        if (!selectedCars || selectedCars.length === 0) {
            return res.status(400).send('選択された車両がありません');
        }

        // 配列形式に強制変換 (チェックボックスが1つだけ選択されている場合は文字列で渡されることがある)
        const carIds = Array.isArray(selectedCars) ? selectedCars : [selectedCars];

        // 各車両の開始価格を取得
        const formData = { selectedCars: carIds };
        carIds.forEach(carId => {
            formData[`startingPrice_${carId}`] = req.body[`startingPrice_${carId}`];
        });

        console.log('Form data:', formData); // デバッグ用ログ

        await listingService.registerListings(auction_id, formData);

        res.redirect('/car-listing');
    } catch (err) {
        console.error('エラーが発生しました:', err.message);
        res.status(500).send('エラーが発生しました');
    }
});



// アプリケーション終了時にデータベース接続を切断
process.on('SIGINT', () => {
    db.disconnectDB();
    process.exit();
});
