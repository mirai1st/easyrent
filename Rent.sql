-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 19, 2026 at 09:30 PM
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
(10, 'mirai1st', 'Test', 'wqqwefasfasf', 3, 3, '[\"/userdata/uploads/houses/1789845810262-314564205.jpg\"]', 3000, '2026-09-19 19:23:30', 4.21805040, 100.68909860, 'asf', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Lelaki'),
(11, 'mirai1st', 'sasfasfasfasf', 'asdasdasdasdasdasda', 1, 1, '[\"/userdata/uploads/houses/1789845875398-639800401.png\"]', 123123123, '2026-09-19 19:24:35', 4.30259110, 101.08067930, 'asf', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Lelaki'),
(12, 'mirai1st', 'sdfdsfsdfsdf', '2qe324324324324', 1, 1, '[\"/userdata/uploads/houses/1789845989693-450040597.png\"]', 3000, '2026-09-19 19:26:29', 4.73191650, 101.47603870, 'asf', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Perempuan');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Rent`
--
ALTER TABLE `Rent`
  ADD PRIMARY KEY (`rentID`),
  ADD KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Rent`
--
ALTER TABLE `Rent`
  MODIFY `rentID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Rent`
--
ALTER TABLE `Rent`
  ADD CONSTRAINT `Rent_ibfk_1` FOREIGN KEY (`username`) REFERENCES `Users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
