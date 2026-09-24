-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 23, 2026 at 07:21 PM
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
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_code` varchar(6) DEFAULT NULL,
  `verification_expires` datetime DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `description` text NOT NULL,
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

INSERT INTO `Users` (`username`, `password`, `is_verified`, `verification_code`, `verification_expires`, `email`, `address`, `description`, `phoneNo`, `full_name`, `profileImg_url`, `role`, `isAnonymous`, `dateCreated`) VALUES
('ammarsyakir', '$2b$10$zC8wv7DqRnQ42K36hS1krOMslxNKGclc7DoFh/cUfYs/mTbXzkZdC', 1, NULL, NULL, 'ammarsyakir890@gmail.com', '', '', '01170195954', 'Callmeshark', '1789830085357-857051506.jpg', 'Pengguna', 0, '2026-09-19 14:59:09'),
('asanatika', '$2b$10$oiS92hi9N0CTCyliWXMmEuGReLTYObmIqtiTQL1M7lEVZP6v7nmUS', 1, NULL, NULL, 'amirrulashraf099@gmail.com', '', '', NULL, NULL, NULL, 'Pengguna', 0, '2026-09-22 12:48:36'),
('DevAcc', '$2b$10$Ko9QF.tXLcFKPNqPIt4gkukVhu06T5nwTnzXrFIybMOGkl2CuJE7K', 1, NULL, NULL, 'oretachi099@gmail.com', '', '', '-', '-', '1790161616560-783996945.jpg', 'Tuan Rumah', 0, '2026-09-16 12:47:14'),
('ipe', '$2b$10$j1Bgk8mec4JVFnhssShvjumf5OEugqzMJUUY58dEdAQqK6ia5XkZO', 1, NULL, NULL, 'mi9162970@gmail.com', '', '', '-999', '-ipang paruk', NULL, 'Pengguna', 0, '2026-09-19 14:58:47'),
('mirai1st', '$2b$10$BpdtOaTKJlLU3Y..Fzlmo.gOpN/GG1crolVw4d.TJmQAQ3vjQzs1.', 1, NULL, NULL, 'mirai1st04@gmail.com', '', '', '018-5799311', 'Mirai1st', '1789893056777-978345455.jpg', 'Admin', 0, '2026-09-05 07:27:43'),
('naim', '$2b$10$z7aCcHUY3OjV9B0GhtO4N.5WixsXqvyvaKNDJcHWz1xzB7m/wI822', 1, NULL, NULL, 'munawwarnaim04@gmail.com', '', '', '782935', 'Naim', '1789895573693-950981489.jpg', 'Pengguna', 0, '2026-09-20 09:10:12'),
('nordnorazmi04', '$2b$10$2iI0M5nBZNJ3pC3VEOO3C.eF30Dx15hVLbBC0fiXMKz/85un5i2ka', 1, NULL, NULL, 'nordnorazmi04@gmail.com', '', '', NULL, NULL, NULL, 'Pengguna', 0, '2026-09-19 09:28:46');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`username`),
  ADD UNIQUE KEY `uniq_email` (`email`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
