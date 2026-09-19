-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 19, 2026 at 10:22 AM
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
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `conversationID` int(10) UNSIGNED NOT NULL,
  `rentID` int(10) UNSIGNED NOT NULL,
  `tenantUsername` varchar(50) NOT NULL,
  `landlordUsername` varchar(50) NOT NULL,
  `lastMessage` varchar(255) DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Favourite`
--

CREATE TABLE `Favourite` (
  `favourID` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `type` enum('house','community') NOT NULL DEFAULT 'house',
  `postId` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `messageID` int(10) UNSIGNED NOT NULL,
  `conversationID` int(10) UNSIGNED NOT NULL,
  `senderUsername` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(27, 'DevAcc', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 0, NULL, '2026-09-16 12:47:14');

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
  `gender` enum('Lelaki','Perempuan') DEFAULT 'Lelaki'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Rent`
--

INSERT INTO `Rent` (`rentID`, `username`, `title`, `description`, `totalOf_bedroom`, `totalOf_shower`, `img_url`, `price`, `dateCreated`, `latitud`, `longitud`, `location`, `target_institution`, `isAdminApprove`, `gender`) VALUES
(7, 'mirai1st', 'Rumah Sewa di Johor Bahru', 'Rumah Sewa Terbaik', 3, 2, '[\"/userdata/uploads/houses/1788878942902-427250649.jpg\",\"/userdata/uploads/houses/1788878942905-84822936.jpg\"]', 1000, '2026-09-08 14:49:02', NULL, NULL, '31 Jalan Maju Taman Maju, Batu Pahat, Johor, 83000, Malaysia', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Lelaki'),
(8, 'mirai1st', 'Villa Nabila', 'Bukan untuk sewa, tapi untuk adekparanormal, sebab dia ban aku fak', 1, 1, '[\"/userdata/uploads/houses/1788879110001-191706930.jpeg\",\"/userdata/uploads/houses/1788879110001-508819062.jpeg\",\"/userdata/uploads/houses/1788879110002-611089967.jpeg\"]', 2500, '2026-09-08 14:51:50', 1.45883300, 103.74400000, '20, Jalan Wisata, Straits View, 80200, Johor Bahru, Johor, Malaysia.', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Lelaki'),
(9, 'mirai1st', 'Rumah Teres Lorong Sungai Nipah', 'Nama: Rumah Teres 2 Tingkat Taman Balik Pulau\r\nJenis: Rumah Teres 2 Tingkat\r\nStatus: Untuk Disewa\r\nBilik Tidur: 4\r\nBilik Air: 4\r\nKeluasan: 1,400 kaki²\r\nHarga Sewa: RM1,800 / bulan (DM untuk negotiate)\r\nDeposit: 2 bulan + 1 bulan utiliti (DM)\r\nLokasi: Balik Pulau, Pulau Pinang\r\n\r\nKemudahan:\r\n\r\n🚗 2 tempat letak kereta\r\n🛋️ Ruang tamu yang luas\r\n🍳 Dapur dengan kabinet\r\n🛏️ 4 bilik tidur\r\n🚿 4 bilik air\r\n🌬️ Beberapa bilik dilengkapi kipas\r\n🔒 Kawasan perumahan yang tenang dan selamat\r\n\r\nLokasi Berdekatan:\r\n\r\n🎓 Politeknik Balik Pulau — jarak dekat, sesuai untuk pelajar dan pensyarah\r\n🕌 Masjid — mudah untuk solat dan aktiviti komuniti\r\n🏪 7-Eleven — keperluan harian mudah didapati\r\n🛒 Kedai makan dan kedai runcit berdekatan\r\n🏥 Kemudahan awam mudah diakses', 4, 4, '[\"/userdata/uploads/houses/1788879310277-367748290.jpeg\"]', 1800, '2026-09-08 14:55:10', 5.33408812, 100.21498591, '12, Lorong Sungai Nipah, Taman Desa Mutiara, Barat Daya, Pulau Pinang, 11020', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Lelaki');

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
  `role` enum('Admin','Pengguna','Tuan Rumah') NOT NULL DEFAULT 'Pengguna',
  `isAnonymous` tinyint(1) NOT NULL DEFAULT 0,
  `dateCreated` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`username`, `password`, `is_verified`, `verification_code`, `verification_expires`, `email`, `phoneNo`, `full_name`, `profileImg_url`, `role`, `isAnonymous`, `dateCreated`) VALUES
('DevAcc', '$2b$10$Ko9QF.tXLcFKPNqPIt4gkukVhu06T5nwTnzXrFIybMOGkl2CuJE7K', 1, NULL, NULL, 'oretachi099@gmail.com', NULL, NULL, NULL, 'Tuan Rumah', 0, '2026-09-16 12:47:14'),
('mirai1st', '$2b$10$BpdtOaTKJlLU3Y..Fzlmo.gOpN/GG1crolVw4d.TJmQAQ3vjQzs1.', 1, NULL, NULL, 'mirai1st04@gmail.com', '018-5799311', 'Mirai1st', '1789563402242-956447684.jpeg', 'Admin', 0, '2026-09-05 07:27:43');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Admin`
--
ALTER TABLE `Admin`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`conversationID`),
  ADD UNIQUE KEY `uniq_convo` (`rentID`,`tenantUsername`,`landlordUsername`),
  ADD KEY `tenantUsername` (`tenantUsername`),
  ADD KEY `landlordUsername` (`landlordUsername`);

--
-- Indexes for table `Favourite`
--
ALTER TABLE `Favourite`
  ADD PRIMARY KEY (`favourID`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`messageID`),
  ADD KEY `conversationID` (`conversationID`),
  ADD KEY `senderUsername` (`senderUsername`);

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
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `conversationID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Favourite`
--
ALTER TABLE `Favourite`
  MODIFY `favourID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `messageID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notificationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `Rent`
--
ALTER TABLE `Rent`
  MODIFY `rentID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `spComment`
--
ALTER TABLE `spComment`
  MODIFY `commentId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `spPost`
--
ALTER TABLE `spPost`
  MODIFY `spId` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`rentID`) REFERENCES `Rent` (`rentID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`tenantUsername`) REFERENCES `Users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`landlordUsername`) REFERENCES `Users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversationID`) REFERENCES `conversations` (`conversationID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`senderUsername`) REFERENCES `Users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;

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
