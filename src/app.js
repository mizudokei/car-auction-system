const express = require('express');
const app = express();
const db = require('./modules/db');
const auctionService = require('./modules/auctionService');
const bidQueries = require('./modules/bidQueries');
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
    auctionService.getAuctionData((err, data) => {
        if (err) {
            console.error("オークションデータの取得エラー:", err);
            return res.status(500).send("データの取得に失敗しました");
        }
        res.render('index', { title: 'トップページ', auctionData: data });
    });
});
// 入札画面
app.get('/bid', (req, res) => {
    const auctionId = req.query.auction_id;
    const carId = req.query.car_id;
    const listingId = req.query.listing_id;
    const auctionend = req.query.end_datetime;

    // end_datetime と今日の日付の差を計算
    const endDate = new Date(auctionend);
    const currentDate = new Date();
    const timeDiff = endDate - currentDate;
    
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hoursDiff = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsDiff = Math.floor((timeDiff % (1000 * 60)) / 1000);

    const timeRemaining = `${daysDiff}日 ${hoursDiff}時間 ${minutesDiff}分 ${secondsDiff}秒`;

    bidQueries.getCarDetails(carId, (err, carDetails) => {
        if (err) {
            console.error("車データの取得エラー:", err);
            return res.status(500).send("データの取得に失敗しました");
        }

        bidQueries.getCurrentPrice(auctionId, (err, currentPrice) => {
            if (err) {
                console.error("車価格の取得エラー:", err);
                return res.status(500).send("データの取得に失敗しました");
            }
            bidQueries.getBidDetails(auctionId, (err, bidDetails) => {
                if (err) {
                    console.error("入札履歴の取得エラー:", err);
                    return res.status(500).send("データの取得に失敗しました");
                }
                res.render('bid', { 
                    auction_id: auctionId, 
                    car_id: carId, 
                    listing_id: listingId, 
                    carDetails: carDetails, 
                    current_price: currentPrice, 
                    end_datetime: auctionend, 
                    time_remaining: timeRemaining,
                    bid_details: bidDetails,
                });
            });
        });
    });
});

// 入札確認
app.get('/submit-bid', (req, res) => {
    const auctionId = req.query.auction_id;
    const auctionend = req.query.end_datetime;
    const carId = req.query.car_id;
    const listingId = req.query.listing_id;
    const bidAmount = req.query.bidAmount;
    const bidDatetime = new Date();
    const userId = "1";

    if (!auctionId || !carId || !bidAmount) {
        console.error("必要なデータが不足しています");
        return res.status(400).send("必要なデータが不足しています");
    }
    const endDate = new Date(auctionend);
    const currentDate = new Date();
    const timeDiff = endDate - currentDate;
    
    bidQueries.getCarDetails(carId, (err, carDetails) => {
        if (err) {
            console.error("車データの取得エラー:", err);
            return res.status(500).send("データの取得に失敗しました");
        }
        if(timeDiff < 0){
            const text = "このオークションは終了済みです"
            res.render('confirm-bid', { text });
        }
        res.render('submit-bid', { title: '入札確認画面', carDetails, bidAmount, auctionId, listingId });
    });
});

// 入札処理
app.get('/confirmbid', (req, res) => {
    const auctionId = req.query.auction_id;
    const carId = req.query.car_id;
    const listingId = req.query.listing_id;
    const bidAmount = req.query.bidAmount;
    const bidDatetime = new Date();
    const userId = "1";
    const text = "入札完了"
    
    if (!auctionId || !listingId || !bidAmount) {
        console.error("必要なデータが不足しています");
        return res.status(400).send("必要なデータが不足しています");
    }

    bidQueries.addbit(auctionId, listingId, userId, bidDatetime, bidAmount, (err) => {
        if (err) {
            console.error("入札額の更新エラー:", err);
            return res.status(500).send("入札額の更新に失敗しました");
        }

        // carDetailsを取得するための関数呼び出しを追加
        bidQueries.getCarDetails(carId, (err, carDetails) => {
            if (err) {
                console.error("車データの取得エラー:", err);
                return res.status(500).send("データの取得に失敗しました");
            }
            // 正しくcarDetailsをテンプレートに渡す
            res.render('confirm-bid', { 
                title: '入札確認画面', 
                carDetails: carDetails, 
                bidAmount: bidAmount,
                text:text
            });
        });
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
