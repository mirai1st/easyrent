-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 22, 2026 at 07:48 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `easyrent`
--

-- --------------------------------------------------------

--
-- Table structure for table `Admin`
--

CREATE TABLE `Admin` (
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `conversation`
--

CREATE TABLE `conversation` (
  `conversation_id` int(11) NOT NULL,
  `user1` varchar(255) NOT NULL,
  `user2` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conversation`
--

INSERT INTO `conversation` (`conversation_id`, `user1`, `user2`, `created_at`) VALUES
(1, 'DevAcc', 'mirai1st', '2026-09-22 15:44:23'),
(2, 'mirai1st', 'naim', '2026-09-22 15:58:37');

-- --------------------------------------------------------

--
-- Table structure for table `Favourite`
--

CREATE TABLE `Favourite` (
  `favourID` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `type` enum('house','community') NOT NULL DEFAULT 'house',
  `postId` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Favourite`
--

INSERT INTO `Favourite` (`favourID`, `username`, `type`, `postId`) VALUES
(37, 'DevAcc', 'house', 17),
(11, 'mirai1st', 'house', 9),
(27, 'mirai1st', 'community', 6),
(26, 'mirai1st', 'community', 7),
(25, 'mirai1st', 'community', 12),
(34, 'mirai1st', 'community', 13),
(33, 'mirai1st', 'community', 14),
(14, 'naim', 'house', 9),
(36, 'naim', 'house', 17);

-- --------------------------------------------------------

--
-- Table structure for table `message`
--

CREATE TABLE `message` (
  `message_id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `sender` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `message`
--

INSERT INTO `message` (`message_id`, `conversation_id`, `sender`, `message`, `sent_at`) VALUES
(1, 1, 'DevAcc', 'helo', '2026-09-22 15:50:43'),
(2, 1, 'mirai1st', 'pebende ko', '2026-09-22 15:51:03'),
(3, 1, 'DevAcc', 'helep', '2026-09-22 15:52:28'),
(4, 1, 'mirai1st', 'Apo', '2026-09-22 15:52:32'),
(5, 2, 'mirai1st', 'Hai', '2026-09-22 15:58:49'),
(6, 2, 'mirai1st', 'Hai', '2026-09-22 15:58:49'),
(7, 2, 'mirai1st', 'Hai', '2026-09-22 15:59:02'),
(8, 2, 'mirai1st', 'Hai', '2026-09-22 15:59:02'),
(9, 2, 'mirai1st', 'Hai', '2026-09-22 15:59:02'),
(10, 2, 'naim', 'Skit ii dh la comey', '2026-09-22 15:59:09'),
(11, 2, 'mirai1st', 'Hai', '2026-09-22 15:59:10'),
(12, 2, 'mirai1st', 'Hai', '2026-09-22 15:59:10'),
(13, 2, 'mirai1st', 'Byt', '2026-09-22 15:59:43'),
(14, 1, 'mirai1st', 'Oi', '2026-09-22 16:31:57'),
(15, 1, 'DevAcc', 'aik', '2026-09-22 16:32:02'),
(16, 1, 'DevAcc', 'tolong aku', '2026-09-22 16:49:29'),
(17, 1, 'mirai1st', 'Kenapa ko ni', '2026-09-22 16:49:36'),
(18, 1, 'DevAcc', 'tak ada orang kacau aku ni ha', '2026-09-22 16:49:46'),
(19, 1, 'mirai1st', 'Wtf?', '2026-09-22 16:49:49'),
(20, 1, 'DevAcc', 'sape pulak', '2026-09-22 16:49:55'),
(21, 1, 'mirai1st', 'Tak tau', '2026-09-22 16:50:01'),
(22, 1, 'DevAcc', 'ish', '2026-09-22 16:50:06');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notificationID` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `type` enum('rent','message','community','system') NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `related_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notificationID`, `username`, `type`, `title`, `message`, `is_read`, `related_id`, `created_at`) VALUES
(22, 'mirai1st', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 1, NULL, '2026-09-05 07:27:43'),
(27, 'DevAcc', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 0, NULL, '2026-09-16 12:47:14'),
(28, 'nordnorazmi04', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 0, NULL, '2026-09-19 09:28:46'),
(29, 'ipe', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 1, NULL, '2026-09-19 14:58:47'),
(30, 'ammarsyakir', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 0, NULL, '2026-09-19 14:59:09'),
(31, 'naim', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 1, NULL, '2026-09-20 09:10:12'),
(34, 'asanatika', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 0, NULL, '2026-09-22 12:48:36');

-- --------------------------------------------------------

--
-- Table structure for table `Rent`
--

CREATE TABLE `Rent` (
  `rentID` int(10) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `totalOf_bedroom` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `totalOf_shower` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `img_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`img_url`)),
  `price` int(11) DEFAULT NULL,
  `dateCreated` timestamp NOT NULL DEFAULT current_timestamp(),
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `target_institution` varchar(255) DEFAULT NULL,
  `isAdminApprove` enum('false','true') NOT NULL DEFAULT 'false',
  `gender` enum('Lelaki','Perempuan','Semua') DEFAULT 'Semua'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Rent`
--

INSERT INTO `Rent` (`rentID`, `username`, `title`, `description`, `totalOf_bedroom`, `totalOf_shower`, `img_url`, `price`, `dateCreated`, `latitud`, `longitud`, `location`, `target_institution`, `isAdminApprove`, `gender`) VALUES
(7, 'mirai1st', 'Rumah Sewa di Johor Bahru', 'Rumah Sewa Terbaik', 3, 2, '[\"/userdata/uploads/houses/1788878942902-427250649.jpg\",\"/userdata/uploads/houses/1788878942905-84822936.jpg\"]', 1000, '2026-09-08 14:49:02', NULL, NULL, '31 Jalan Maju Taman Maju, Batu Pahat, Johor, 83000, Malaysia', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Lelaki'),
(8, 'mirai1st', 'Villa Nabila', 'Bukan untuk sewa, tapi untuk adekparanormal, sebab dia ban aku fak', 1, 1, '[\"/userdata/uploads/houses/1788879110001-191706930.jpeg\",\"/userdata/uploads/houses/1788879110001-508819062.jpeg\",\"/userdata/uploads/houses/1788879110002-611089967.jpeg\"]', 2500, '2026-09-08 14:51:50', 1.45883300, 103.74400000, '20, Jalan Wisata, Straits View, 80200, Johor Bahru, Johor, Malaysia.', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Perempuan'),
(9, 'mirai1st', 'Rumah Teres Lorong Sungai Nipah', 'Nama: Rumah Teres 2 Tingkat Taman Balik Pulau\r\nJenis: Rumah Teres 2 Tingkat\r\nStatus: Untuk Disewa\r\nBilik Tidur: 4\r\nBilik Air: 4\r\nKeluasan: 1,400 kaki²\r\nHarga Sewa: RM1,800 / bulan (DM untuk negotiate)\r\nDeposit: 2 bulan + 1 bulan utiliti (DM)\r\nLokasi: Balik Pulau, Pulau Pinang\r\n\r\nKemudahan:\r\n\r\n🚗 2 tempat letak kereta\r\n🛋️ Ruang tamu yang luas\r\n🍳 Dapur dengan kabinet\r\n🛏️ 4 bilik tidur\r\n🚿 4 bilik air\r\n🌬️ Beberapa bilik dilengkapi kipas\r\n🔒 Kawasan perumahan yang tenang dan selamat\r\n\r\nLokasi Berdekatan:\r\n\r\n🎓 Politeknik Balik Pulau — jarak dekat, sesuai untuk pelajar dan pensyarah\r\n🕌 Masjid — mudah untuk solat dan aktiviti komuniti\r\n🏪 7-Eleven — keperluan harian mudah didapati\r\n🛒 Kedai makan dan kedai runcit berdekatan\r\n🏥 Kemudahan awam mudah diakses', 4, 4, '[\"/userdata/uploads/houses/1788879310277-367748290.jpeg\"]', 1800, '2026-09-08 14:55:10', 5.33408812, 100.21498591, '12, Lorong Sungai Nipah, Taman Desa Mutiara, Barat Daya, Pulau Pinang, 11020', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Semua'),
(16, 'naim', 'Rumah lan corner', 'Rumah ni mantap Dan bertenaga', 3, 3, '[\"/userdata/uploads/houses/1789895868117-517279245.jpg\"]', 1500, '2026-09-20 09:17:54', 4.80604270, 100.73192410, 'Lorong 30, Taman Kaya Fasa 3, Kampung Pak Darus, Taiping, Larut, Matang and Selama, Perak, 34700, Malaysia', 'Politeknik Balik Pulau, Pulau Pinang', 'false', 'Semua'),
(17, 'naim', 'Rumah sewa', 'Rumah lawa', 3, 2, '[\"/userdata/uploads/houses/1790092566068-227299978.png\",\"/userdata/uploads/houses/1790092572883-133700153.jpg\",\"/userdata/uploads/houses/1790092573284-876043555.png\",\"/userdata/uploads/houses/1790092580019-970550087.jpg\"]', 1500, '2026-09-22 15:56:20', NULL, NULL, 'No 24, No 24 LORONG 43 Taman Kaya Fasa 3', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Semua');

-- --------------------------------------------------------

--
-- Table structure for table `spComment`
--

CREATE TABLE `spComment` (
  `commentId` int(11) NOT NULL,
  `spId` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `imgFile` longtext NOT NULL,
  `commentCount` int(11) NOT NULL,
  `likeCount` int(11) NOT NULL,
  `replyTo` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `spComment`
--

INSERT INTO `spComment` (`commentId`, `spId`, `username`, `content`, `imgFile`, `commentCount`, `likeCount`, `replyTo`) VALUES
(8, 7, 'DevAcc', 'Ni gambar google ni 😒', '[]', 0, 0, ''),
(9, 7, 'mirai1st', 'wat', '[]', 0, 0, ''),
(10, 6, 'mirai1st', 'Mende siak ni', '[]', 0, 0, ''),
(11, 13, 'ammarsyakir', 'For real', '[]', 0, 0, ''),
(12, 12, 'mirai1st', 'Awat ada gambar laptop sini?', '[]', 0, 0, ''),
(13, 14, 'mirai1st', 'Comey naim', '[]', 0, 0, ''),
(14, 14, 'naim', 'Comey ijmal aka miraist🤣', '[]', 0, 0, '');

-- --------------------------------------------------------

--
-- Table structure for table `spPost`
--

CREATE TABLE `spPost` (
  `spId` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `imgFile` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`imgFile`)),
  `commentCount` int(11) NOT NULL,
  `likeCount` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `spPost`
--

INSERT INTO `spPost` (`spId`, `username`, `content`, `imgFile`, `commentCount`, `likeCount`) VALUES
(6, 'nordnorazmi04', 'MIRAI CHAN KAWAII', '[\"/userdata/uploads/sp/1789810210892-571597367.jpeg\"]', 1, 42),
(7, 'mirai1st', 'RUMAH NI LAWA GAK', '[\"/userdata/uploads/sp/1789810350169-215718007.jpeg\"]', 2, 26),
(12, 'ammarsyakir', '', '[\"/userdata/uploads/sp/1789830106930-224006031.jpg\"]', 1, 110),
(13, 'ipe', 'sumpah laaaaaa mahal nye semua rumah', '[]', 1, 4),
(14, 'naim', 'Hi', '[]', 2, 27);

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_code` varchar(6) DEFAULT NULL,
  `verification_expires` datetime DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phoneNo` varchar(20) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `profileImg_url` varchar(255) DEFAULT NULL,
  `role` enum('Admin','Pengguna','Tuan Rumah','Ejen Hartanah') NOT NULL DEFAULT 'Pengguna',
  `isAnonymous` tinyint(1) NOT NULL DEFAULT 0,
  `dateCreated` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`username`, `password`, `is_verified`, `verification_code`, `verification_expires`, `email`, `phoneNo`, `full_name`, `profileImg_url`, `role`, `isAnonymous`, `dateCreated`) VALUES
('ammarsyakir', '$2b$10$zC8wv7DqRnQ42K36hS1krOMslxNKGclc7DoFh/cUfYs/mTbXzkZdC', 1, NULL, NULL, 'ammarsyakir890@gmail.com', '01170195954', 'Callmeshark', '1789830085357-857051506.jpg', 'Pengguna', 0, '2026-09-19 14:59:09'),
('asanatika', '$2b$10$oiS92hi9N0CTCyliWXMmEuGReLTYObmIqtiTQL1M7lEVZP6v7nmUS', 1, NULL, NULL, 'amirrulashraf099@gmail.com', NULL, NULL, NULL, 'Pengguna', 0, '2026-09-22 12:48:36'),
('DevAcc', '$2b$10$Ko9QF.tXLcFKPNqPIt4gkukVhu06T5nwTnzXrFIybMOGkl2CuJE7K', 1, NULL, NULL, 'oretachi099@gmail.com', '-', '-', '1790095866644-937562289.png', 'Tuan Rumah', 0, '2026-09-16 12:47:14'),
('ipe', '$2b$10$j1Bgk8mec4JVFnhssShvjumf5OEugqzMJUUY58dEdAQqK6ia5XkZO', 1, NULL, NULL, 'mi9162970@gmail.com', '-999', '-ipang paruk', NULL, 'Pengguna', 0, '2026-09-19 14:58:47'),
('mirai1st', '$2b$10$BpdtOaTKJlLU3Y..Fzlmo.gOpN/GG1crolVw4d.TJmQAQ3vjQzs1.', 1, NULL, NULL, 'mirai1st04@gmail.com', '018-5799311', 'Mirai1st', '1789893056777-978345455.jpg', 'Admin', 0, '2026-09-05 07:27:43'),
('naim', '$2b$10$z7aCcHUY3OjV9B0GhtO4N.5WixsXqvyvaKNDJcHWz1xzB7m/wI822', 1, NULL, NULL, 'munawwarnaim04@gmail.com', '782935', 'Naim', '1789895573693-950981489.jpg', 'Pengguna', 0, '2026-09-20 09:10:12'),
('nordnorazmi04', '$2b$10$2iI0M5nBZNJ3pC3VEOO3C.eF30Dx15hVLbBC0fiXMKz/85un5i2ka', 1, NULL, NULL, 'nordnorazmi04@gmail.com', NULL, NULL, NULL, 'Pengguna', 0, '2026-09-19 09:28:46');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Admin`
--
ALTER TABLE `Admin`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `conversation`
--
ALTER TABLE `conversation`
  ADD PRIMARY KEY (`conversation_id`),
  ADD UNIQUE KEY `unique_conversation` (`user1`,`user2`),
  ADD KEY `user2` (`user2`);

--
-- Indexes for table `Favourite`
--
ALTER TABLE `Favourite`
  ADD PRIMARY KEY (`favourID`),
  ADD UNIQUE KEY `uniq_favourite` (`username`,`type`,`postId`),
  ADD KEY `username` (`username`);

--
-- Indexes for table `message`
--
ALTER TABLE `message`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `sender` (`sender`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notificationID`),
  ADD KEY `notifications_ibfk_1` (`username`);

--
-- Indexes for table `Rent`
--
ALTER TABLE `Rent`
  ADD PRIMARY KEY (`rentID`),
  ADD KEY `username` (`username`);

--
-- Indexes for table `spComment`
--
ALTER TABLE `spComment`
  ADD PRIMARY KEY (`commentId`),
  ADD KEY `spId` (`spId`),
  ADD KEY `username` (`username`);

--
-- Indexes for table `spPost`
--
ALTER TABLE `spPost`
  ADD PRIMARY KEY (`spId`),
  ADD KEY `username` (`username`);

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`username`),
  ADD UNIQUE KEY `uniq_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `conversation`
--
ALTER TABLE `conversation`
  MODIFY `conversation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `Favourite`
--
ALTER TABLE `Favourite`
  MODIFY `favourID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `message`
--
ALTER TABLE `message`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notificationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `Rent`
--
ALTER TABLE `Rent`
  MODIFY `rentID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `spComment`
--
ALTER TABLE `spComment`
  MODIFY `commentId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `spPost`
--
ALTER TABLE `spPost`
  MODIFY `spId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `conversation`
--
ALTER TABLE `conversation`
  ADD CONSTRAINT `conversation_ibfk_1` FOREIGN KEY (`user1`) REFERENCES `Users` (`username`),
  ADD CONSTRAINT `conversation_ibfk_2` FOREIGN KEY (`user2`) REFERENCES `Users` (`username`);

--
-- Constraints for table `message`
--
ALTER TABLE `message`
  ADD CONSTRAINT `message_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`conversation_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_ibfk_2` FOREIGN KEY (`sender`) REFERENCES `Users` (`username`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`username`) REFERENCES `Users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Rent`
--
ALTER TABLE `Rent`
  ADD CONSTRAINT `Rent_ibfk_1` FOREIGN KEY (`username`) REFERENCES `Users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `spComment`
--
ALTER TABLE `spComment`
  ADD CONSTRAINT `spComment_ibfk_1` FOREIGN KEY (`spId`) REFERENCES `spPost` (`spId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `spComment_ibfk_2` FOREIGN KEY (`username`) REFERENCES `Users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `spPost`
--
ALTER TABLE `spPost`
  ADD CONSTRAINT `spPost_ibfk_1` FOREIGN KEY (`username`) REFERENCES `Users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
