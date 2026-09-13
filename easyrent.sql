-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 13, 2026 at 12:22 PM
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
  `gender` enum('Lelaki','Perempuan') DEFAULT 'Lelaki'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Rent`
--

INSERT INTO `Rent` (`rentID`, `username`, `title`, `description`, `totalOf_bedroom`, `totalOf_shower`, `img_url`, `price`, `dateCreated`, `latitud`, `longitud`, `location`, `target_institution`, `isAdminApprove`, `gender`) VALUES
(7, 'mirai1st', 'Rumah Sewa di Johor Bahru', 'Rumah Sewa Terbaik', 3, 2, '[\"/userdata/uploads/houses/1788878942902-427250649.jpg\",\"/userdata/uploads/houses/1788878942905-84822936.jpg\"]', 1000, '2026-09-08 14:49:02', NULL, NULL, '31 Jalan Maju Taman Maju, Batu Pahat, Johor, 83000, Malaysia', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Lelaki'),
(8, 'mirai1st', 'Villa Nabila', 'Bukan untuk sewa, tapi untuk adekparanormal, sebab dia ban aku fak', 1, 1, '[\"/userdata/uploads/houses/1788879110001-191706930.jpeg\",\"/userdata/uploads/houses/1788879110001-508819062.jpeg\",\"/userdata/uploads/houses/1788879110002-611089967.jpeg\"]', 2500, '2026-09-08 14:51:50', NULL, NULL, '20, Jalan Wisata, Straits View, 80200, Johor Bahru, Johor, Malaysia.', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Lelaki'),
(9, 'mirai1st', 'Rumah Sewa Moden', 'Besar do, moden plak tu. Mahal la tapi', 1, 1, '[\"/userdata/uploads/houses/1788879310277-367748290.jpeg\"]', 5000, '2026-09-08 14:55:10', NULL, NULL, 'Mk 13, Daerah Timur Laut Pulau Jerejak, Bayan Lepas, Pulau Pinang, 11900, Malaysia', 'Politeknik Balik Pulau, Pulau Pinang', 'true', 'Lelaki');

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
  MODIFY `rentID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
