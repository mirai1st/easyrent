-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 31, 2026 at 01:55 PM
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
-- Table structure for table `CommunityPost`
--

CREATE TABLE `CommunityPost` (
  `postId` int(10) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL,
  `postcontent` text NOT NULL,
  `isImage` tinyint(1) NOT NULL DEFAULT 0,
  `img_url` varchar(255) DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  `like_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `comment_count` int(10) UNSIGNED NOT NULL DEFAULT 0
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
(4, 'mirai1st', 'system', 'Akaun anda telah diaktifkan!', 'Terima kasih kerana menggunakan perkhidmatan EasyRent.', 1, 1, '2026-08-20 15:56:35'),
(16, 'Naim', 'system', 'Akaun anda telah didaftarkan!', 'Sila sahkan email anda untuk mengaktifkan akaun EasyRent anda.', 0, NULL, '2026-08-23 08:59:56'),
(17, 'Naimi', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 1, NULL, '2026-08-23 09:01:42'),
(18, 'mirai2nd', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 0, NULL, '2026-08-23 09:42:10'),
(19, 'Naimah', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 0, NULL, '2026-08-24 14:27:27'),
(21, 'IJMAL', 'system', 'Akaun anda telah diaktifkan!', 'Akaun anda telah pun diaktifkan! Terima kasih kerana menggunakan perkhidmatan EasyRent.', 1, NULL, '2026-08-24 15:38:03');

-- --------------------------------------------------------

--
-- Table structure for table `PostComments`
--

CREATE TABLE `PostComments` (
  `commentID` int(10) UNSIGNED NOT NULL,
  `postId` int(10) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL,
  `commentContent` text NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `rating` decimal(2,1) DEFAULT 0.0,
  `dateCreated` timestamp NOT NULL DEFAULT current_timestamp(),
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `isAdminApprove` enum('false','true') NOT NULL DEFAULT 'false'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Rent`
--

INSERT INTO `Rent` (`rentID`, `username`, `title`, `description`, `totalOf_bedroom`, `totalOf_shower`, `img_url`, `rating`, `dateCreated`, `latitud`, `longitud`, `location`, `isAdminApprove`) VALUES
(1, 'mirai1st', 'Contoh', 'dsfdfdsfsdfsdf', 1, 1, '[\"/uploads/houses/1787218772048-994286978.png\"]', 0.0, '2026-08-20 09:39:32', NULL, NULL, 'sdfdsf', 'false'),
(4, 'IJMAL', 'sungai nipah', 'mencari dua orang pelajar', 3, 2, '[\"/uploads/houses/1787586244757-835166239.png\"]', 0.0, '2026-08-24 15:44:04', NULL, NULL, 'sungai nipah', 'false');

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
  `role` enum('normal_user','tenant','landlord','admin') NOT NULL DEFAULT 'normal_user',
  `isAnonymous` tinyint(1) NOT NULL DEFAULT 0,
  `dateCreated` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`username`, `password`, `is_verified`, `verification_code`, `verification_expires`, `email`, `phoneNo`, `full_name`, `profileImg_url`, `role`, `isAnonymous`, `dateCreated`) VALUES
('IJMAL', '$2b$10$TEMRWw4mOn0c6eoLmdOnG.2lMTcWrMm5W0SlwGb3.a1j3yQ8bqGHu', 1, NULL, NULL, 'qianderated1130@gmail.com', '0132146078', 'ijmalaiman', NULL, 'normal_user', 0, '2026-08-24 15:38:03'),
('mirai1st', '$2b$10$xM6F2xwWpZ2Sc9NRKEMzBOYrwpkmnE78xV4GWEQaWfUZOO1V8YoHe', 1, NULL, NULL, 'mirai1st04@gmail.com', '018-5799 311', 'Mirai1st', 'mirai-image.jpg', 'admin', 0, '2026-08-13 16:00:00'),
('mirai2nd', '$2b$10$kvVwruBSVh9GEp0LMgqNGe9FqmhfdAPxI3iYPC63oHUd.n3fmI3Nm', 1, NULL, NULL, 'amirulabpt099@gmail.com', NULL, NULL, NULL, 'normal_user', 0, '2026-08-23 09:42:10'),
('Naim', '$2b$10$dBvYquHMH83j5j4qfvMbEuPG7H0t/fgusPUjoxhWhM42LkKTxG03e', 0, '538159', '2026-08-23 17:10:34', 'cerosky04@gmail.com', NULL, NULL, NULL, 'normal_user', 0, '2026-08-23 08:59:56'),
('Naimah', '$2b$10$qHWpcbl9NcEU0j6M3Pwxrejo1HVD522AUUoRqXFhqY9qd94qsa216', 0, '761724', '2026-08-24 22:37:27', 'malaun1130@gmail.com', NULL, NULL, NULL, 'normal_user', 0, '2026-08-24 14:27:27'),
('Naimi', '$2b$10$2oP.wEUWnsBAy4nyVuuYe.20wWsKBDs8rOK6Hl57XcLSZUqJEVrZK', 1, NULL, NULL, 'madxainz@gmail.com', NULL, NULL, 'naim-image.jpg', 'normal_user', 0, '2026-08-23 09:01:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Admin`
--
ALTER TABLE `Admin`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `CommunityPost`
--
ALTER TABLE `CommunityPost`
  ADD PRIMARY KEY (`postId`),
  ADD KEY `username` (`username`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`conversationID`),
  ADD UNIQUE KEY `uniq_convo` (`rentID`,`tenantUsername`,`landlordUsername`),
  ADD KEY `tenantUsername` (`tenantUsername`),
  ADD KEY `landlordUsername` (`landlordUsername`);

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
-- Indexes for table `PostComments`
--
ALTER TABLE `PostComments`
  ADD PRIMARY KEY (`commentID`),
  ADD KEY `postId` (`postId`),
  ADD KEY `username` (`username`);

--
-- Indexes for table `Rent`
--
ALTER TABLE `Rent`
  ADD PRIMARY KEY (`rentID`),
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
-- AUTO_INCREMENT for table `CommunityPost`
--
ALTER TABLE `CommunityPost`
  MODIFY `postId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `conversationID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `messageID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notificationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `PostComments`
--
ALTER TABLE `PostComments`
  MODIFY `commentID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Rent`
--
ALTER TABLE `Rent`
  MODIFY `rentID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `CommunityPost`
--
ALTER TABLE `CommunityPost`
  ADD CONSTRAINT `CommunityPost_ibfk_1` FOREIGN KEY (`username`) REFERENCES `Users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;

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
-- Constraints for table `PostComments`
--
ALTER TABLE `PostComments`
  ADD CONSTRAINT `PostComments_ibfk_1` FOREIGN KEY (`postId`) REFERENCES `CommunityPost` (`postId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PostComments_ibfk_2` FOREIGN KEY (`username`) REFERENCES `Users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Rent`
--
ALTER TABLE `Rent`
  ADD CONSTRAINT `Rent_ibfk_1` FOREIGN KEY (`username`) REFERENCES `Users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
