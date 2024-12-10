-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- ホスト: 127.0.0.1
-- 生成日時: 2024-12-09 03:19:26
-- サーバのバージョン： 10.4.25-MariaDB
-- PHP のバージョン: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- データベース: `auction_system_db`
--

-- --------------------------------------------------------

--
-- テーブルの構造 `auction_tbl`
--

CREATE TABLE `auction_tbl` (
  `auction_id` int(5) NOT NULL,
  `start_datetime` datetime(6) NOT NULL,
  `end_datetime` datetime(6) NOT NULL,
  `auction_status` varchar(10) NOT NULL,
  `employee_id` int(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- テーブルのデータのダンプ `auction_tbl`
--

INSERT INTO `auction_tbl` (`auction_id`, `start_datetime`, `end_datetime`, `auction_status`, `employee_id`) VALUES
(25, '2024-11-26 22:44:00.000000', '2024-12-06 22:44:00.000000', '終了', 1),
(32, '2024-12-08 18:47:00.000000', '2024-12-09 18:47:00.000000', '開催中', 10);

-- --------------------------------------------------------

--
-- テーブルの構造 `bid_tbl`
--

CREATE TABLE `bid_tbl` (
  `bid_id` int(5) NOT NULL,
  `user_id` int(5) NOT NULL,
  `listing_id` int(5) NOT NULL,
  `bid_datetime` datetime(6) NOT NULL,
  `bid_amount` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- テーブルのデータのダンプ `bid_tbl`
--

INSERT INTO `bid_tbl` (`bid_id`, `user_id`, `listing_id`, `bid_datetime`, `bid_amount`) VALUES
(3, 1, 27, '2024-12-08 18:54:12.705000', 150000);

-- --------------------------------------------------------

--
-- テーブルの構造 `car_tbl`
--

CREATE TABLE `car_tbl` (
  `car_id` int(5) NOT NULL,
  `car_type` varchar(20) NOT NULL,
  `manufacturer_id` int(5) NOT NULL,
  `car_year` year(4) NOT NULL,
  `car_mileage` int(10) NOT NULL,
  `car_color` varchar(20) NOT NULL,
  `car_image` varchar(255) NOT NULL,
  `purchase_date` date DEFAULT NULL,
  `car_status` varchar(10) NOT NULL,
  `employee_id` int(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- テーブルのデータのダンプ `car_tbl`
--

INSERT INTO `car_tbl` (`car_id`, `car_type`, `manufacturer_id`, `car_year`, `car_mileage`, `car_color`, `car_image`, `purchase_date`, `car_status`, `employee_id`) VALUES
(1, 'セレナ', 3, 2008, 74000, 'シルバー', '/resources/car-images/1732608807522_serena.webp', '2024-07-31', '出品中', 11),
(2, 'アルファード', 1, 2002, 127000, 'ブラック', '/resources/car-images/alphard.jpg', '2024-08-06', '在庫あり', 12),
(3, 'LC500パッケージ', 2, 2021, 47000, 'ホワイト', '/resources/car-images/LC500.jpg', '2024-08-06', '在庫あり', 13),
(4, 'シビック タイプR', 4, 2018, 29000, 'ホワイト', '/resources/car-images/sibiku.jpg', '2024-08-07', '在庫あり', 14),
(5, 'エクシーガ2.0GT', 6, 2008, 188000, 'ブラック', '/resources/car-images/exiga.jpg', '2024-08-07', '在庫あり', 15),
(6, 'ロードスター S', 5, 2019, 60000, 'ホワイト', '/resources/car-images/roadstar.jpg', '2024-08-08', '在庫あり', 11),
(7, 'アウトランダー', 8, 2022, 20000, 'ブラック', '/resources/car-images/out.jpg', '2024-08-08', '在庫あり', 12),
(8, 'ムーブ L SA', 9, 2013, 14000, 'シルバー', '/resources/car-images/move.jpg', '2024-08-11', '在庫あり', 13),
(12, 'CX-5', 4, 2017, 70000, 'レッド', '/resources/car-images/1732677580042_CX-5.jpg', '2024-11-01', '在庫あり', 11),
(13, 'リーフ', 3, 2022, 12000, 'ホワイト', '/resources/car-images/1732700918438_ãªã¼ã.jpg', NULL, '在庫あり', NULL),
(14, 'アウトバック', 6, 2021, 15000, 'カーキ', '/resources/car-images/1732769983253_ã¢ã¦ãããã¯.jpg', NULL, '在庫あり', NULL);

-- --------------------------------------------------------

--
-- テーブルの構造 `employee_tbl`
--

CREATE TABLE `employee_tbl` (
  `employee_id` int(5) NOT NULL,
  `employee_name` varchar(10) NOT NULL,
  `division_name` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- テーブルのデータのダンプ `employee_tbl`
--

INSERT INTO `employee_tbl` (`employee_id`, `employee_name`, `division_name`) VALUES
(1, '森下 佳織', '総務部'),
(2, '小川 健一', '総務部'),
(3, '大野 菜々', '総務部'),
(4, '田辺 勇太', '総務部'),
(5, '西村 美和', '総務部'),
(6, '松田 直人', '総務部'),
(7, '藤田 彩花', '総務部'),
(8, '木下 翼', '総務部'),
(9, '杉山 真理', '総務部'),
(10, '橋本 智子', '総務部'),
(11, '石田 竜也', '車両調達部'),
(12, '横山 佳奈', '車両調達部'),
(13, '川崎 秀一', '車両調達部'),
(14, '中西 諒', '車両調達部'),
(15, '永井 里奈', '車両調達部'),
(16, '近藤 海斗', '経理部'),
(17, '中川 美咲', '経理部'),
(18, '安藤 達也', '経理部'),
(19, '藤井 真央', '経理部'),
(20, '平野 剛', '経理部');

-- --------------------------------------------------------

--
-- テーブルの構造 `listing_tbl`
--

CREATE TABLE `listing_tbl` (
  `listing_id` int(5) NOT NULL,
  `car_id` int(5) NOT NULL,
  `starting_price` int(10) NOT NULL,
  `ending_price` int(10) NOT NULL,
  `current_price` int(10) NOT NULL,
  `auction_id` int(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- テーブルのデータのダンプ `listing_tbl`
--

INSERT INTO `listing_tbl` (`listing_id`, `car_id`, `starting_price`, `ending_price`, `current_price`, `auction_id`) VALUES
(27, 1, 100000, 0, 150000, 32);

-- --------------------------------------------------------

--
-- テーブルの構造 `manufacturer_tbl`
--

CREATE TABLE `manufacturer_tbl` (
  `manufacturer_id` int(5) NOT NULL,
  `manufacturer_name` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- テーブルのデータのダンプ `manufacturer_tbl`
--

INSERT INTO `manufacturer_tbl` (`manufacturer_id`, `manufacturer_name`) VALUES
(1, 'トヨタ'),
(2, 'レクサス'),
(3, '日産'),
(4, 'ホンダ'),
(5, 'マツダ'),
(6, 'スバル'),
(7, 'スズキ'),
(8, '三菱'),
(9, 'ダイハツ'),
(10, 'メルセデス・ベンツ'),
(11, 'BMW'),
(12, 'フォルクスワーゲン'),
(13, 'アウディ'),
(14, 'ポルシェ'),
(15, 'ミニ'),
(16, 'ジープ'),
(17, 'アルファロメオ'),
(18, 'フィアット'),
(19, 'ルノー'),
(20, 'ランドローバー'),
(21, 'アバルト'),
(22, 'テスラ');

-- --------------------------------------------------------

--
-- テーブルの構造 `successfulbid_tbl`
--

CREATE TABLE `successfulbid_tbl` (
  `successfulbid_id` int(5) NOT NULL,
  `user_id` int(5) NOT NULL,
  `listing_id` int(5) NOT NULL,
  `successfulbid_datetime` datetime(6) NOT NULL,
  `successfulbid_amount` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- テーブルの構造 `user_tbl`
--

CREATE TABLE `user_tbl` (
  `user_id` int(5) NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `mail` varchar(254) NOT NULL,
  `tel` varchar(15) NOT NULL,
  `address` varchar(200) NOT NULL,
  `pass` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- テーブルのデータのダンプ `user_tbl`
--

INSERT INTO `user_tbl` (`user_id`, `user_name`, `mail`, `tel`, `address`, `pass`) VALUES
(1, '佐藤 太郎', 'john.doe@example.com', '080-1234-5678', '東京都千代田区霞が関1丁目2-3', 'X7k9!Fg$T2'),
(2, '鈴木 花子', 'jane.smith@example.org', '090-0123-4567', '大阪府大阪市中央区本町4丁目5-6', 'P@1wB8q#Lc'),
(3, '高橋 一郎', 'user123@example.net', '090-8765-4321', '北海道札幌市中央区北1条西1丁目7-8', 'mK3&Qz$4Yf'),
(4, '田中 美咲', 'test.user@example.co.jp', '090-0123-4567', '福岡県福岡市博多区博多駅前3丁目9-10', 'dY6#N7h$Bg'),
(5, '伊藤 大輔', 'random.email@example.edu', '070-2345-6789', '愛知県名古屋市中区栄4丁目11-12', 'H9u!Vk2&Zr'),
(6, '渡辺 奈々子', 'sample.address@example.biz', '090-0123-4567', '神奈川県横浜市西区みなとみらい5丁目13-14', 'W2a*L3y^Fx'),
(7, '山本 翔太', 'demo.account@example.info', '080-3456-7890', '京都府京都市中京区御池通6丁目15-16', 'R@4tQ1p#Zd'),
(8, '中村 さくら', 'temp.user@example.us', '080-2345-6789', '広島県広島市中区紙屋町7丁目17-18', 'U8e%S5w&Kg'),
(9, '小林 健太', 'fake.email@example.co', '090-4567-8901', '宮城県仙台市青葉区中央8丁目19-20', 'jL2!xK7$Gh'),
(10, '加藤 由美', 'testmail@example.io', '090-3456-7890', '新潟県新潟市中央区万代9丁目21-22', 'V@3rB6z#Td'),
(11, '吉田 勇', 'user.test@example.ai', '070-5678-9012', '岡山県岡山市北区下石井10丁目23-24', 'bM7^cQ4&Yg'),
(12, '山田 杏奈', 'email.sample@example.tech', '070-4567-8901', '長野県長野市大字鶴賀11丁目25-26', 'T5u!L2*Vr'),
(13, '佐々木 昇', 'contact.me@example.com', '080-6789-0123', '熊本県熊本市中央区花畑町12丁目27-28', 'Z@9wP1y#Fg'),
(14, '松本 友美', 'hello.world@example.org', '080-5678-9012', '静岡県静岡市葵区追手町13丁目29-30', 'gK6!sD4^Xp'),
(15, '井上 海斗', 'mail.user@example.net', '090-7890-1234', '茨城県水戸市三の丸14丁目31-32', 'hY2&N3q$Jz'),
(16, '木村 真央', 'testaccount@example.co.jp', '070-7890-1234', '三重県津市大字広明町15丁目33-34', 'M1t@P9w#Xf'),
(17, '清水 遼', 'placeholder@example.edu', '070-8901-2345', '沖縄県那覇市久茂地16丁目35-36', 'cL4!vK7^Gt'),
(18, '山崎 優', 'testemail@example.biz', '080-8901-2345', '愛媛県松山市大街道17丁目37-38', 'J@8xB6y#Qd'),
(19, '池田 佳奈', 'user.address@example.info', '080-9012-3456', '群馬県前橋市大手町18丁目39-40', 'L9e%F2!Rg'),
(20, '橋本 龍', 'demo.mail@example.us', '090-9012-3456', '岩手県盛岡市大通19丁目41-42', 'V@2kL3!Jh');

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `auction_tbl`
--
ALTER TABLE `auction_tbl`
  ADD PRIMARY KEY (`auction_id`),
  ADD KEY `employee_id` (`employee_id`) USING BTREE;

--
-- テーブルのインデックス `bid_tbl`
--
ALTER TABLE `bid_tbl`
  ADD PRIMARY KEY (`bid_id`),
  ADD KEY `listing_id_fk` (`listing_id`),
  ADD KEY `user_id_fk` (`user_id`);

--
-- テーブルのインデックス `car_tbl`
--
ALTER TABLE `car_tbl`
  ADD PRIMARY KEY (`car_id`),
  ADD KEY `fk_employee_id` (`employee_id`),
  ADD KEY `manufacturer_id` (`manufacturer_id`);

--
-- テーブルのインデックス `employee_tbl`
--
ALTER TABLE `employee_tbl`
  ADD PRIMARY KEY (`employee_id`);

--
-- テーブルのインデックス `listing_tbl`
--
ALTER TABLE `listing_tbl`
  ADD PRIMARY KEY (`listing_id`),
  ADD KEY `auction_id` (`auction_id`),
  ADD KEY `car_id` (`car_id`) USING BTREE;

--
-- テーブルのインデックス `manufacturer_tbl`
--
ALTER TABLE `manufacturer_tbl`
  ADD PRIMARY KEY (`manufacturer_id`);

--
-- テーブルのインデックス `successfulbid_tbl`
--
ALTER TABLE `successfulbid_tbl`
  ADD PRIMARY KEY (`successfulbid_id`),
  ADD KEY `listing_id` (`listing_id`),
  ADD KEY `user_id` (`user_id`);

--
-- テーブルのインデックス `user_tbl`
--
ALTER TABLE `user_tbl`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `UNIQUE` (`mail`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `auction_tbl`
--
ALTER TABLE `auction_tbl`
  MODIFY `auction_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- テーブルの AUTO_INCREMENT `bid_tbl`
--
ALTER TABLE `bid_tbl`
  MODIFY `bid_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- テーブルの AUTO_INCREMENT `car_tbl`
--
ALTER TABLE `car_tbl`
  MODIFY `car_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- テーブルの AUTO_INCREMENT `employee_tbl`
--
ALTER TABLE `employee_tbl`
  MODIFY `employee_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- テーブルの AUTO_INCREMENT `listing_tbl`
--
ALTER TABLE `listing_tbl`
  MODIFY `listing_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- テーブルの AUTO_INCREMENT `manufacturer_tbl`
--
ALTER TABLE `manufacturer_tbl`
  MODIFY `manufacturer_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=216;

--
-- テーブルの AUTO_INCREMENT `successfulbid_tbl`
--
ALTER TABLE `successfulbid_tbl`
  MODIFY `successfulbid_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- テーブルの AUTO_INCREMENT `user_tbl`
--
ALTER TABLE `user_tbl`
  MODIFY `user_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `auction_tbl`
--
ALTER TABLE `auction_tbl`
  ADD CONSTRAINT `employee_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employee_tbl` (`employee_id`);

--
-- テーブルの制約 `bid_tbl`
--
ALTER TABLE `bid_tbl`
  ADD CONSTRAINT `listing_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `listing_tbl` (`listing_id`),
  ADD CONSTRAINT `user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`user_id`);

--
-- テーブルの制約 `car_tbl`
--
ALTER TABLE `car_tbl`
  ADD CONSTRAINT `car_tbl_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_tbl` (`employee_id`),
  ADD CONSTRAINT `car_tbl_ibfk_2` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturer_tbl` (`manufacturer_id`);

--
-- テーブルの制約 `listing_tbl`
--
ALTER TABLE `listing_tbl`
  ADD CONSTRAINT `listing_tbl_ibfk_1` FOREIGN KEY (`auction_id`) REFERENCES `auction_tbl` (`auction_id`);

--
-- テーブルの制約 `successfulbid_tbl`
--
ALTER TABLE `successfulbid_tbl`
  ADD CONSTRAINT `successfulbid_tbl_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `listing_tbl` (`listing_id`),
  ADD CONSTRAINT `successfulbid_tbl_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
