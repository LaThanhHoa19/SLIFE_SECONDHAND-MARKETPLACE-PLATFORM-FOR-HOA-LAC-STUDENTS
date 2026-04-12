-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: slife_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `address_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `location_name` varchar(200) NOT NULL,
  `address_text` text,
  `map_url` text,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`address_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,2,'Ky tuc xa Dom A','Phong 402, Dom A, DH FPT','https://www.google.com/maps/embed?pb=...',NULL,NULL,0,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(2,3,'Ky tuc xa Dom E','Phong 105, Dom E, DH FPT','https://www.google.com/maps/embed?pb=...',NULL,NULL,0,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(3,4,'Toa nha Alpha','Sanh tang 1, Toa Alpha','https://www.google.com/maps/embed?pb=...',NULL,NULL,0,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(4,1,'FPT Hoa Lac','T1',NULL,21.0130000,105.5250000,0,'2026-04-02 13:30:59','2026-04-02 13:30:59',NULL),(5,1,'FPT Hoa Lac','T1',NULL,21.0130000,105.5250000,0,'2026-04-02 13:35:56','2026-04-02 13:35:56',NULL),(6,2,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0481100,105.8540320,0,'2026-04-02 13:50:27','2026-04-02 13:50:27',NULL),(7,2,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0481100,105.8540320,0,'2026-04-02 13:50:39','2026-04-02 13:50:39',NULL),(8,1,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0458520,105.8471510,0,'2026-04-03 17:23:40','2026-04-03 17:23:40',NULL),(9,1,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0495040,105.8407950,0,'2026-04-03 17:29:22','2026-04-03 17:29:22',NULL),(10,1,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0461640,105.8497880,0,'2026-04-03 17:35:47','2026-04-03 17:35:47',NULL),(11,1,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0482070,105.8468690,0,'2026-04-04 18:16:46','2026-04-04 18:16:46',NULL),(12,4,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0483100,105.8490960,0,'2026-04-08 19:50:42','2026-04-08 19:50:42',NULL),(13,4,'d sadsa dsdssdsdsdssdds',NULL,NULL,21.0483100,105.8490960,0,'2026-04-08 19:51:37','2026-04-08 19:51:37',NULL),(14,4,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0471890,105.8470360,0,'2026-04-08 20:04:11','2026-04-08 20:04:11',NULL),(15,4,'do thanh an',NULL,NULL,21.0471890,105.8470360,0,'2026-04-08 20:05:03','2026-04-08 20:05:03',NULL),(16,4,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0448560,105.8490320,0,'2026-04-11 14:30:06','2026-04-11 14:30:06',NULL),(17,4,'asd da sdasdas asd asd sddsdadasdad',NULL,NULL,21.0448560,105.8490320,0,'2026-04-11 14:34:15','2026-04-11 14:34:15',NULL),(18,4,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0446910,105.8476050,0,'2026-04-11 14:42:18','2026-04-11 14:42:18',NULL),(19,4,'leu',NULL,NULL,21.0446910,105.8476050,0,'2026-04-11 14:52:08','2026-04-11 14:52:08',NULL),(20,4,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0456320,105.8466430,0,'2026-04-11 15:02:14','2026-04-11 15:02:14',NULL),(21,4,'d',NULL,NULL,21.0456320,105.8466430,0,'2026-04-11 15:03:20','2026-04-11 15:03:20',NULL),(22,4,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0476150,105.8463110,0,'2026-04-11 15:20:58','2026-04-11 15:20:58',NULL),(23,4,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0467960,105.8463920,0,'2026-04-11 15:49:17','2026-04-11 15:49:17',NULL),(24,2,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0457290,105.8495900,0,'2026-04-11 16:11:46','2026-04-11 16:11:46',NULL),(25,4,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0454860,105.8518050,0,'2026-04-11 17:09:54','2026-04-11 17:09:54',NULL),(26,4,'an an tét',NULL,NULL,21.0454860,105.8518050,0,'2026-04-11 17:13:44','2026-04-11 17:13:44',NULL),(27,2,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0472710,105.8484520,0,'2026-04-11 17:14:26','2026-04-11 17:14:26',NULL),(28,2,'Phường Quang Trung, Thành phố Hà Giang, Tỉnh Hà Giang',NULL,NULL,22.8360310,104.9799840,0,'2026-04-11 17:23:40','2026-04-11 17:23:40',NULL),(29,2,'Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội',NULL,NULL,21.0462010,105.8469880,0,'2026-04-11 17:35:13','2026-04-11 17:35:13',NULL);
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `audit_id` bigint NOT NULL AUTO_INCREMENT,
  `occurred_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actor_user_id` bigint DEFAULT NULL,
  `actor_type` varchar(32) NOT NULL DEFAULT 'ADMIN',
  `action` varchar(96) NOT NULL,
  `entity_type` varchar(48) NOT NULL,
  `entity_id` bigint DEFAULT NULL,
  `payload_json` text,
  PRIMARY KEY (`audit_id`),
  KEY `idx_audit_occurred` (`occurred_at` DESC),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `fk_audit_actor` (`actor_user_id`),
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,'2026-03-29 19:24:54.379871',1,'ADMIN','USER_BAN','USER',2,'{\"previousStatus\":\"ACTIVE\",\"newStatus\":\"BANNED\"}'),(2,'2026-03-29 19:24:54.658319',1,'ADMIN','USER_UNBAN','USER',2,'{\"previousStatus\":\"BANNED\",\"newStatus\":\"ACTIVE\"}'),(3,'2026-04-06 15:22:25.154738',1,'ADMIN','REPORT_APPROVE','REPORT',2,'{\"reportId\":2,\"targetId\":2,\"targetType\":\"LISTING\"}');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banned_keywords`
--

DROP TABLE IF EXISTS `banned_keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banned_keywords` (
  `banned_keyword_id` bigint NOT NULL AUTO_INCREMENT,
  `keyword` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`banned_keyword_id`),
  UNIQUE KEY `keyword` (`keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banned_keywords`
--

LOCK TABLES `banned_keywords` WRITE;
/*!40000 ALTER TABLE `banned_keywords` DISABLE KEYS */;
/*!40000 ALTER TABLE `banned_keywords` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blocks`
--

DROP TABLE IF EXISTS `blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blocks` (
  `blocker_id` bigint NOT NULL,
  `blocked_id` bigint NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`blocker_id`,`blocked_id`),
  KEY `blocked_id` (`blocked_id`),
  CONSTRAINT `blocks_ibfk_1` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `blocks_ibfk_2` FOREIGN KEY (`blocked_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blocks`
--

LOCK TABLES `blocks` WRITE;
/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
INSERT INTO `blocks` VALUES (4,1,'2026-04-11 16:10:49','2026-04-11 16:10:48',NULL);
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `parent_id` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `system_locked` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `name` (`name`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Giao trinh & Tai lieu','Sach, vo, giao trinh cac mon hoc tai FU',4,'2026-03-29 17:05:13','2026-03-29 17:05:15',NULL,0),(2,'Do dien tu','Laptop, chuot, ban phim, tai nghe',5,'2026-03-29 17:05:13','2026-03-29 17:05:15',NULL,0),(3,'Do dung KTX','Quat, am sieu toc, gia sach, den hoc',6,'2026-03-29 17:05:13','2026-03-29 17:05:15',NULL,0),(4,'Sách & tài liệu','Sách, giáo trình, tạp chí và tài liệu học tập',NULL,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0),(5,'Điện tử & công nghệ','Laptop, điện thoại, phụ kiện và thiết bị số',NULL,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0),(6,'Ký túc xá & đời sống','Đồ dùng sinh hoạt, nội thất mini cho KTX',NULL,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0),(7,'Sách luyện thi & ôn tập','Luyện IELTS, TOEIC, ôn thi các môn',4,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0),(8,'Vở, giấy & dụng cụ viết','Vở, giấy nháp, bút, highlight',4,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0),(9,'Laptop & máy tính bảng','Laptop, tablet, phụ kiện đi kèm',5,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0),(10,'Phụ kiện máy tính','Chuột, bàn phím, hub, túi chống sốc',5,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0),(11,'Âm thanh & tai nghe','Tai nghe, loa, mic',5,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0),(12,'Điện thoại & smartwatch','Điện thoại, đồng hồ thông minh, ốp lưng',5,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0),(13,'Thiết bị gia dụng nhỏ','Ấm siêu tốc, máy sấy tóc, ổ cắm',6,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0),(14,'Đèn & quạt','Đèn bàn, đèn ngủ, quạt mini',6,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0),(15,'Nội thất & sắp xếp','Kệ, móc treo, hộp đựng, gối',6,'2026-03-29 17:05:15','2026-03-29 17:05:15',NULL,0);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment_images`
--

DROP TABLE IF EXISTS `comment_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_images` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `comment_id` bigint NOT NULL,
  `image_url` varchar(2000) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`image_id`),
  KEY `comment_id` (`comment_id`),
  CONSTRAINT `comment_images_ibfk_1` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`comment_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_images`
--

LOCK TABLES `comment_images` WRITE;
/*!40000 ALTER TABLE `comment_images` DISABLE KEYS */;
INSERT INTO `comment_images` VALUES (1,1,'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800','2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(2,1,'https://images.unsplash.com/photo-1454165833267-02306283731c?q=80&w=800','2026-03-29 17:05:13','2026-03-29 17:05:13',NULL);
/*!40000 ALTER TABLE `comment_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `comment_id` bigint NOT NULL AUTO_INCREMENT,
  `content` text,
  `user_id` bigint NOT NULL,
  `listing_id` bigint NOT NULL,
  `parent_comment_id` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `hidden_at` timestamp(6) NULL DEFAULT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `user_id` (`user_id`),
  KEY `listing_id` (`listing_id`),
  KEY `parent_comment_id` (`parent_comment_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`),
  CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parent_comment_id`) REFERENCES `comments` (`comment_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (1,'Co ship sang Dom E khong chu thot?',3,1,NULL,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL,NULL),(2,'spam test 1',2,1,NULL,'2026-03-30 16:05:39',NULL,NULL,NULL),(3,'owner reply spam 1',2,1,1,'2026-03-30 16:09:39',NULL,NULL,NULL),(4,'dsadasdsa',1,9,NULL,'2026-04-03 19:03:20',NULL,NULL,NULL),(5,'đâs',1,9,4,'2026-04-03 19:03:23',NULL,NULL,NULL),(6,'đâsd',1,6,NULL,'2026-04-03 19:03:35',NULL,NULL,NULL),(7,'đá',1,6,6,'2026-04-03 19:15:04',NULL,NULL,NULL),(8,'lei',2,6,6,'2026-04-03 19:15:42',NULL,NULL,NULL),(9,'đsd',2,6,7,'2026-04-03 19:15:46',NULL,NULL,NULL),(10,'gif',2,9,5,'2026-04-04 14:07:11',NULL,NULL,NULL),(11,'kkk',2,8,NULL,'2026-04-04 14:07:33',NULL,NULL,NULL),(12,'đá sa',2,10,NULL,'2026-04-04 18:17:20',NULL,NULL,NULL),(13,'đâsasd',2,3,NULL,'2026-04-05 17:07:05',NULL,NULL,NULL);
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_post_comment_images`
--

DROP TABLE IF EXISTS `community_post_comment_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `community_post_comment_images` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `comment_id` bigint NOT NULL,
  `image_url` varchar(2000) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`image_id`),
  KEY `fk_cpci_comment` (`comment_id`),
  CONSTRAINT `fk_cpci_comment` FOREIGN KEY (`comment_id`) REFERENCES `community_post_comments` (`comment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_post_comment_images`
--

LOCK TABLES `community_post_comment_images` WRITE;
/*!40000 ALTER TABLE `community_post_comment_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_post_comment_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_post_comments`
--

DROP TABLE IF EXISTS `community_post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `community_post_comments` (
  `comment_id` bigint NOT NULL AUTO_INCREMENT,
  `content` text,
  `user_id` bigint NOT NULL,
  `post_id` bigint NOT NULL,
  `parent_comment_id` bigint DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `hidden_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `fk_cpc_user` (`user_id`),
  KEY `fk_cpc_parent` (`parent_comment_id`),
  KEY `idx_cpc_post_created` (`post_id`,`created_at`),
  CONSTRAINT `fk_cpc_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `community_post_comments` (`comment_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpc_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`post_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_post_comments`
--

LOCK TABLES `community_post_comments` WRITE;
/*!40000 ALTER TABLE `community_post_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_post_hashtags`
--

DROP TABLE IF EXISTS `community_post_hashtags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `community_post_hashtags` (
  `post_id` bigint NOT NULL,
  `hashtag_id` bigint NOT NULL,
  PRIMARY KEY (`post_id`,`hashtag_id`),
  KEY `fk_cph_hashtag` (`hashtag_id`),
  CONSTRAINT `fk_cph_hashtag` FOREIGN KEY (`hashtag_id`) REFERENCES `hashtags` (`hashtag_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cph_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`post_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_post_hashtags`
--

LOCK TABLES `community_post_hashtags` WRITE;
/*!40000 ALTER TABLE `community_post_hashtags` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_post_hashtags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_post_images`
--

DROP TABLE IF EXISTS `community_post_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `community_post_images` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint NOT NULL,
  `image_url` varchar(2000) NOT NULL,
  `display_order` int NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`image_id`),
  KEY `fk_cpi_post` (`post_id`),
  CONSTRAINT `fk_cpi_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`post_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_post_images`
--

LOCK TABLES `community_post_images` WRITE;
/*!40000 ALTER TABLE `community_post_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_post_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_post_likes`
--

DROP TABLE IF EXISTS `community_post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `community_post_likes` (
  `user_id` bigint NOT NULL,
  `post_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`,`post_id`),
  KEY `idx_cpl_post` (`post_id`),
  CONSTRAINT `fk_cpl_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`post_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpl_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_post_likes`
--

LOCK TABLES `community_post_likes` WRITE;
/*!40000 ALTER TABLE `community_post_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_posts`
--

DROP TABLE IF EXISTS `community_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `community_posts` (
  `post_id` bigint NOT NULL AUTO_INCREMENT,
  `author_id` bigint NOT NULL,
  `description` text,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `view_count` bigint NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` datetime(6) DEFAULT NULL,
  `hidden_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`post_id`),
  KEY `idx_community_posts_status_created` (`status`,`created_at`),
  KEY `idx_community_posts_author` (`author_id`),
  CONSTRAINT `fk_community_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_posts`
--

LOCK TABLES `community_posts` WRITE;
/*!40000 ALTER TABLE `community_posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configurations`
--

DROP TABLE IF EXISTS `configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configurations` (
  `config_id` bigint NOT NULL AUTO_INCREMENT,
  `config_name` varchar(200) NOT NULL,
  `config_value` varchar(2000) NOT NULL,
  `description` text,
  `updated_by` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `config_name` (`config_name`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `configurations_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configurations`
--

LOCK TABLES `configurations` WRITE;
/*!40000 ALTER TABLE `configurations` DISABLE KEYS */;
INSERT INTO `configurations` VALUES (1,'AUTO_HIDE_REPORT_THRESHOLD','1','Auto-hide listing (HIDDEN) or comment (hidden_at) when PENDING report count reaches this value',1,'2026-03-29 19:24:33','2026-04-02 12:13:00',NULL),(2,'MAX_IMAGES_PER_POST','1','restore',1,'2026-04-02 12:49:13','2026-04-02 13:49:42',NULL),(3,'LISTING_EXPIRATION','30','restore',1,'2026-04-02 13:30:58','2026-04-02 13:35:56',NULL),(4,'MAX_IMAGES','10','Giới hạn ảnh toàn hệ thống (trần trên cho mỗi tin).',NULL,'2026-04-02 13:42:55','2026-04-02 13:42:55',NULL),(5,'REPORT_THRESHOLD','3','Ngưỡng báo cáo để xử lý vi phạm.',NULL,'2026-04-02 13:42:55','2026-04-02 13:42:55',NULL),(6,'DEAL_TIMEOUT_DAYS','3','Số ngày timeout để tự động hoàn tất giao dịch.',NULL,'2026-04-02 13:42:55','2026-04-02 13:42:55',NULL),(7,'PICKUP_REMINDER_HOURS','2','Số giờ trước giờ nhận hàng (deal) để gửi email nhắc hai bên. Cron quét mỗi 5 phút, cửa sổ ±7 phút.',1,'2026-04-08 17:42:38','2026-04-08 17:54:54',NULL),(8,'MAX_ACTIVE_LISTINGS_PER_USER','0','Số tin ACTIVE tối đa mỗi người (0 = không giới hạn).',NULL,'2026-04-08 17:42:38','2026-04-08 17:42:38',NULL),(9,'LISTING_EXPIRING_SOON_HOURS_BEFORE','24','Gửi mail \"tin sắp hết hạn\" khi thời điểm hết hạn nằm trong khoảng [bây giờ + (N−1)h, bây giờ + N giờ] (cửa sổ 1 giờ, N giờ trước khi hết hạn).',NULL,'2026-04-08 17:42:38','2026-04-08 17:42:38',NULL),(10,'DEAL_TIMEOUT_UNIT','DAYS','Đơn vị thời gian cho DEAL_TIMEOUT_DAYS: DAYS hoặc MINUTES. Ví dụ: đặt DEAL_TIMEOUT_DAYS=5 + DEAL_TIMEOUT_UNIT=MINUTES để tự động chuyển sau 5 phút (dùng để test).',NULL,'2026-04-12 12:25:47','2026-04-12 12:25:47',NULL),(11,'REVIEW_TIMEOUT_VALUE','7','Thời gian tối đa buyer được phép gửi đánh giá kể từ khi deal hoàn tất (SUCCESS). Kết hợp với REVIEW_TIMEOUT_UNIT.',NULL,'2026-04-12 12:25:47','2026-04-12 12:25:47',NULL),(12,'REVIEW_TIMEOUT_UNIT','DAYS','Đơn vị thời gian cho REVIEW_TIMEOUT_VALUE: DAYS hoặc MINUTES.',NULL,'2026-04-12 12:25:47','2026-04-12 12:25:47',NULL);
/*!40000 ALTER TABLE `configurations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `conversation_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id1` bigint NOT NULL,
  `user_id2` bigint NOT NULL,
  `listing_id` bigint DEFAULT NULL,
  `last_message_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `session_uuid` varchar(36) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`conversation_id`),
  UNIQUE KEY `UK_conversations_session_uuid` (`session_uuid`),
  KEY `user_id1` (`user_id1`),
  KEY `user_id2` (`user_id2`),
  KEY `listing_id` (`listing_id`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`user_id1`) REFERENCES `users` (`user_id`),
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`user_id2`) REFERENCES `users` (`user_id`),
  CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,4,2,1,'2026-03-30 17:18:45','2026-03-29 17:05:13','2026-03-30 17:18:44',NULL,'73ead2f2-2b91-11f1-9c75-8a2555c73459','ACTIVE'),(2,2,1,5,'2026-04-03 18:28:02','2026-04-03 12:30:56','2026-04-03 18:28:02',NULL,'9635fbea-7902-4cc3-9d0c-9c3e97b5a411','ACTIVE'),(3,2,3,2,'2026-04-03 12:53:09','2026-04-03 12:39:14','2026-04-03 12:53:09',NULL,'14f611b2-9f14-4b9d-a147-e918723fc527','ACTIVE'),(4,2,4,3,'2026-04-03 12:52:46','2026-04-03 12:52:46','2026-04-03 12:52:46',NULL,'e84b2eed-c7d9-4d3a-bbd3-00e7eb51eec0','ACTIVE'),(5,2,1,4,'2026-04-03 17:22:28','2026-04-03 12:56:33','2026-04-03 17:22:28',NULL,'225af091-61bc-4b89-b4ed-ed71b609e4e3','ACTIVE'),(6,2,1,7,'2026-04-03 17:24:39','2026-04-03 17:23:57','2026-04-03 17:24:39',NULL,'b61e626b-b02a-4e90-84cc-fcafc7737a2d','ACTIVE'),(7,2,1,8,'2026-04-03 17:30:33','2026-04-03 17:29:35','2026-04-03 17:30:32',NULL,'bf6e1d6a-7d82-40a5-b84e-22736c558b5f','ACTIVE'),(8,2,1,9,'2026-04-03 18:37:56','2026-04-03 17:36:14','2026-04-03 18:37:56',NULL,'e327eb4d-a6e4-4aa3-bdfe-cab2e9dc2ffc','ACTIVE'),(9,2,1,10,'2026-04-08 18:36:59','2026-04-04 18:17:53','2026-04-08 18:36:59',NULL,'54a3a204-8fbe-4593-a4b1-fe865f338d07','ACTIVE'),(10,2,4,11,'2026-04-08 19:58:38','2026-04-08 19:51:04','2026-04-08 19:58:38',NULL,'7bf2c32d-505a-4bf3-a2e5-5e4733c4bf48','ACTIVE'),(11,2,4,12,'2026-04-08 20:05:28','2026-04-08 20:04:28','2026-04-08 20:05:28',NULL,'5dfa5ff2-aa17-416b-8be5-5a02d7218bc4','ACTIVE'),(12,2,4,13,'2026-04-11 14:34:23','2026-04-11 14:31:38','2026-04-11 14:34:22',NULL,'d7015ae5-23c4-4c70-aed5-dab6a3190038','ACTIVE'),(13,2,4,14,'2026-04-11 14:52:17','2026-04-11 14:42:29','2026-04-11 14:52:17',NULL,'66633505-a4c8-48c2-9d47-3822b56669b8','ACTIVE'),(14,2,4,15,'2026-04-11 15:03:22','2026-04-11 15:02:37','2026-04-11 15:03:22',NULL,'6d363c72-37ad-4fca-8ce6-5ecb6e0ecbf6','ACTIVE'),(15,2,4,16,'2026-04-11 15:38:23','2026-04-11 15:21:33','2026-04-11 15:38:22',NULL,'9a883970-a69a-4588-8df4-8d77c7df5be8','ACTIVE'),(16,2,4,17,'2026-04-11 15:51:28','2026-04-11 15:49:34','2026-04-11 15:51:28',NULL,'45638486-2a51-49e1-b437-8130ba08a79d','ACTIVE'),(17,4,2,18,'2026-04-11 16:19:57','2026-04-11 16:18:56','2026-04-11 16:19:56',NULL,'08c70aaa-aaf0-4fa0-9def-7b87616749ac','ACTIVE'),(18,2,1,19,NULL,'2026-04-11 17:07:12','2026-04-11 17:07:11',NULL,'41727518-945b-4f23-b8e2-c96d877aa622','ACTIVE'),(19,2,1,20,NULL,'2026-04-11 17:07:51','2026-04-11 17:07:50',NULL,'072e0f49-7aeb-419d-9e55-682a488b5efa','ACTIVE'),(20,2,4,21,'2026-04-11 17:13:48','2026-04-11 17:13:03','2026-04-11 17:13:48',NULL,'53ccbefd-4fef-4d5b-837c-1810c0be3aeb','ACTIVE'),(21,4,2,22,'2026-04-11 17:15:25','2026-04-11 17:14:41','2026-04-11 17:15:24',NULL,'08402aa1-c7ba-460d-bce3-daae26cebc9d','ACTIVE'),(22,4,2,23,'2026-04-11 17:25:15','2026-04-11 17:24:18','2026-04-11 17:25:14',NULL,'6ce29f05-ef94-4cb1-9c1f-da7f1548e3be','ACTIVE'),(23,4,2,24,'2026-04-11 17:36:33','2026-04-11 17:36:10','2026-04-11 17:36:32',NULL,'9c99944d-29b8-4e61-80ad-8a117b720614','ACTIVE');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deals`
--

DROP TABLE IF EXISTS `deals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deals` (
  `deal_id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint NOT NULL,
  `listing_id` bigint NOT NULL,
  `proposed_by_id` bigint NOT NULL,
  `offer_id` bigint DEFAULT NULL,
  `address_id` bigint DEFAULT NULL,
  `deal_price` decimal(12,2) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'PENDING',
  `confirmed_at` datetime DEFAULT NULL,
  `pickup_time` datetime DEFAULT NULL,
  `reminder_sent` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`deal_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `listing_id` (`listing_id`),
  KEY `proposed_by_id` (`proposed_by_id`),
  KEY `address_id` (`address_id`),
  KEY `offer_id` (`offer_id`),
  CONSTRAINT `deals_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`),
  CONSTRAINT `deals_ibfk_2` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`),
  CONSTRAINT `deals_ibfk_3` FOREIGN KEY (`proposed_by_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `deals_ibfk_4` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`),
  CONSTRAINT `deals_ibfk_5` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`offer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deals`
--

LOCK TABLES `deals` WRITE;
/*!40000 ALTER TABLE `deals` DISABLE KEYS */;
INSERT INTO `deals` VALUES (1,1,1,4,NULL,NULL,150000.00,'COMPLETED','2026-03-10 10:00:00','2026-03-31 09:00:00',1,'2026-03-29 17:05:13','2026-04-02 16:28:57',NULL),(2,2,5,2,NULL,NULL,100000.00,'COMPLETED',NULL,'2026-04-03 14:54:00',0,'2026-04-03 14:54:33','2026-04-03 14:55:06',NULL),(3,5,4,2,NULL,NULL,120000.00,'REJECTED',NULL,'2026-04-03 17:02:00',0,'2026-04-03 17:03:29','2026-04-03 17:22:28',NULL),(4,6,7,2,4,8,0.00,'COMPLETED',NULL,'2026-04-03 17:24:00',0,'2026-04-03 17:24:35','2026-04-03 17:24:39',NULL),(5,7,8,2,5,9,850000.00,'COMPLETED',NULL,'2026-04-03 17:29:00',0,'2026-04-03 17:30:13','2026-04-03 17:30:17',NULL),(6,8,9,2,7,10,850000.00,'COMPLETED',NULL,'2026-04-03 18:37:00',0,'2026-04-03 18:37:48','2026-04-03 18:37:56',NULL),(7,9,10,2,8,11,0.00,'REJECTED','2026-04-04 18:22:19','2026-04-04 18:21:00',0,'2026-04-04 18:21:58','2026-04-04 18:22:19',NULL),(8,9,10,2,8,11,0.00,'REJECTED','2026-04-04 18:38:09','2026-04-05 19:37:00',0,'2026-04-04 18:37:55','2026-04-04 18:38:09',NULL),(9,9,10,2,8,11,0.00,'PENDING ','2026-04-04 18:38:18','2026-04-08 22:00:00',0,'2026-04-04 18:38:14','2026-04-08 18:00:45',NULL),(10,9,10,2,NULL,NULL,123000.00,'PENDING',NULL,'2026-04-08 20:03:14',0,'2026-04-08 18:03:14','2026-04-08 18:03:14',NULL),(11,10,11,2,9,13,0.00,'COMPLETED','2026-04-09 02:57:07','2026-04-08 20:51:00',0,'2026-04-08 19:51:37','2026-04-09 02:57:07',NULL),(12,11,12,2,10,15,0.00,'REJECTED','2026-04-09 03:05:06','2026-04-09 03:06:00',0,'2026-04-09 03:05:03','2026-04-09 03:05:06',NULL),(13,11,12,2,10,14,0.00,'COMPLETED','2026-04-09 03:05:28','2026-04-09 04:05:00',0,'2026-04-09 03:05:18','2026-04-09 03:05:28',NULL),(14,12,13,2,11,17,170000.00,'COMPLETED','2026-04-11 21:34:23','2026-04-12 12:33:00',0,'2026-04-11 21:34:15','2026-04-11 21:34:23',NULL),(15,13,14,2,12,19,170000.00,'COMPLETED','2026-04-11 21:52:11','2026-04-12 12:53:00',0,'2026-04-11 21:52:08','2026-04-11 21:52:11',NULL),(16,14,15,2,14,21,90000.00,'COMPLETED','2026-04-11 22:03:22','2026-04-12 12:05:00',0,'2026-04-11 22:03:20','2026-04-11 22:03:22',NULL),(17,15,16,2,15,22,170000.00,'COMPLETED','2026-04-11 22:38:22','2026-04-12 00:27:00',1,'2026-04-11 22:25:55','2026-04-11 22:38:22',NULL),(18,16,17,2,16,23,170000.00,'COMPLETED','2026-04-11 22:51:28','2026-04-12 00:55:00',1,'2026-04-11 22:51:14','2026-04-11 22:55:06',NULL),(19,17,18,4,17,24,0.00,'COMPLETED','2026-04-11 23:19:57','2026-04-12 01:22:00',1,'2026-04-11 23:19:50','2026-04-11 23:20:07',NULL),(20,18,19,2,18,11,90000.00,'COMPLETED','2026-04-12 00:07:21',NULL,0,'2026-04-12 00:07:12','2026-04-12 00:07:21',NULL),(21,19,20,2,19,11,40000.00,'COMPLETED','2026-04-12 00:07:51',NULL,0,'2026-04-12 00:07:51','2026-04-12 00:07:51',NULL),(22,20,21,2,20,26,0.00,'COMPLETED','2026-04-12 00:13:48','2026-04-12 02:16:00',1,'2026-04-12 00:13:44','2026-04-12 00:15:06',NULL),(23,21,22,4,21,27,47180000.00,'REJECTED','2026-04-12 00:15:07','2026-04-12 01:14:00',0,'2026-04-12 00:15:03','2026-04-12 00:15:07',NULL),(24,21,22,4,21,27,47180000.00,'COMPLETED','2026-04-12 00:15:25','2026-04-12 01:15:00',1,'2026-04-12 00:15:14','2026-04-12 00:25:07',NULL),(25,22,23,4,23,28,52730000.00,'REJECTED','2026-04-12 00:25:05','2026-04-12 01:24:00',0,'2026-04-12 00:25:00','2026-04-12 00:25:05',NULL),(26,22,23,4,23,28,52730000.00,'COMPLETED','2026-04-12 00:25:15','2026-04-12 01:25:00',1,'2026-04-12 00:25:10','2026-04-12 00:30:07',NULL),(27,23,24,4,24,29,0.00,'COMPLETED','2026-04-12 00:36:33','2026-04-12 01:36:00',1,'2026-04-12 00:36:29','2026-04-12 00:40:07',NULL);
/*!40000 ALTER TABLE `deals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flyway_schema_history`
--

DROP TABLE IF EXISTS `flyway_schema_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `description` varchar(200) NOT NULL,
  `type` varchar(20) NOT NULL,
  `script` varchar(1000) NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flyway_schema_history`
--

LOCK TABLES `flyway_schema_history` WRITE;
/*!40000 ALTER TABLE `flyway_schema_history` DISABLE KEYS */;
INSERT INTO `flyway_schema_history` VALUES (1,'1','newdb','SQL','V1__newdb.sql',219416903,'slife','2026-03-29 17:05:13',3192,1),(2,'3','add chat columns','SQL','V3__add_chat_columns.sql',1436440993,'slife','2026-03-29 17:05:14',552,1),(3,'6','listing likes','SQL','V6__listing_likes.sql',-1118870313,'slife','2026-03-29 17:05:14',115,1),(4,'7','reply quote message','SQL','V7__reply_quote_message.sql',-772072049,'slife','2026-03-29 17:05:15',574,1),(5,'8','report comment message','SQL','V8__report_comment_message.sql',1922936740,'slife','2026-03-29 17:05:15',139,1),(6,'9','seed admin password','SQL','V9__seed_admin_password.sql',1147752852,'slife','2026-03-29 17:05:15',5,1),(7,'10','seed category hierachy','SQL','V10__seed_category_hierachy.sql',-1116987034,'slife','2026-03-29 17:05:15',72,1),(8,'11','user token revision','SQL','V11__user_token_revision.sql',-1491688436,'slife','2026-03-29 19:10:07',3438,1),(9,'12','audit log comment hidden','SQL','V12__audit_log_comment_hidden.sql',1161095222,'slife','2026-03-29 19:24:33',572,1),(10,'13','phone verification','SQL','V13__phone_verification.sql',1216209959,'slife','2026-03-31 14:58:46',232,1),(11,'14','ensure audit logs','SQL','V14__ensure_audit_logs.sql',109838846,'slife','2026-04-02 13:35:25',41,1),(12,'15','seed missing system config keys','SQL','V15__seed_missing_system_config_keys.sql',-935193762,'slife','2026-04-02 13:42:55',39,1),(13,'16','deals status add rejected','SQL','V16__deals_status_add_rejected.sql',525120190,'slife','2026-04-03 17:20:35',592,1),(14,'17','deals status to varchar','SQL','V17__deals_status_to_varchar.sql',1410877797,'slife','2026-04-03 17:20:35',472,1),(15,'18','community posts','SQL','V18__community_posts.sql',-1881179975,'slife','2026-04-05 17:23:03',1562,1),(16,'19','user welcome email sent','SQL','V19__user_welcome_email_sent.sql',-1641329778,'slife','2026-04-05 17:53:29',544,1),(17,'20','update user reputation default','SQL','V20__update_user_reputation_default.sql',-1198313666,'slife','2026-04-07 16:19:05',1316,1),(18,'21','moderation and scheduling config','SQL','V21__moderation_and_scheduling_config.sql',-552417245,'slife','2026-04-08 17:42:38',58,1),(19,'22','community posts title nullable','SQL','V22__community_posts_title_nullable.sql',-20352072,'slife','2026-04-11 14:22:54',310,1),(20,'23','saved community posts','SQL','V23__saved_community_posts.sql',-1520235518,'slife','2026-04-11 14:22:55',193,1),(21,'24','community posts drop title','SQL','V24__community_posts_drop_title.sql',-981975530,'slife','2026-04-11 14:22:55',237,1),(22,'25','deal timeout unit and review window','SQL','V25__deal_timeout_unit_and_review_window.sql',640214407,'slife','2026-04-12 12:25:47',42,1);
/*!40000 ALTER TABLE `flyway_schema_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follows`
--

DROP TABLE IF EXISTS `follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follows` (
  `follower_id` bigint NOT NULL,
  `followed_id` bigint NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follower_id`,`followed_id`),
  KEY `followed_id` (`followed_id`),
  CONSTRAINT `follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `follows_ibfk_2` FOREIGN KEY (`followed_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follows`
--

LOCK TABLES `follows` WRITE;
/*!40000 ALTER TABLE `follows` DISABLE KEYS */;
/*!40000 ALTER TABLE `follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hashtags`
--

DROP TABLE IF EXISTS `hashtags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hashtags` (
  `hashtag_id` bigint NOT NULL AUTO_INCREMENT,
  `tag` varchar(100) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`hashtag_id`),
  UNIQUE KEY `uq_hashtags_tag` (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hashtags`
--

LOCK TABLES `hashtags` WRITE;
/*!40000 ALTER TABLE `hashtags` DISABLE KEYS */;
/*!40000 ALTER TABLE `hashtags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listing_history`
--

DROP TABLE IF EXISTS `listing_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listing_history` (
  `history_id` bigint NOT NULL AUTO_INCREMENT,
  `listing_id` bigint NOT NULL,
  `changed_by` bigint DEFAULT NULL,
  `change_type` varchar(100) NOT NULL,
  `before_state` json DEFAULT NULL,
  `after_state` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`history_id`),
  KEY `listing_id` (`listing_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `listing_history_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`),
  CONSTRAINT `listing_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_history`
--

LOCK TABLES `listing_history` WRITE;
/*!40000 ALTER TABLE `listing_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `listing_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listing_images`
--

DROP TABLE IF EXISTS `listing_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listing_images` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `listing_id` bigint NOT NULL,
  `image_url` varchar(2000) NOT NULL,
  `display_order` int DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`image_id`),
  KEY `listing_id` (`listing_id`),
  CONSTRAINT `listing_images_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_images`
--

LOCK TABLES `listing_images` WRITE;
/*!40000 ALTER TABLE `listing_images` DISABLE KEYS */;
INSERT INTO `listing_images` VALUES (1,1,'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800',1,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(2,1,'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800',2,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(3,1,'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800',3,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(4,1,'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?q=80&w=800',4,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(5,2,'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800',1,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(6,2,'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=800',2,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(7,2,'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800',3,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(8,2,'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800',4,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(9,3,'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800',1,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(10,3,'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800',2,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(11,3,'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800',3,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(12,3,'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800',4,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(13,6,'/uploads/listings/6_1775137827208_1.jpg',1,'2026-04-02 13:50:27',NULL,NULL),(14,7,'/uploads/listings/7_1775237019806_1.jpg',1,'2026-04-03 17:23:40',NULL,NULL),(15,8,'/uploads/listings/8_1775237362144_1.jpg',1,'2026-04-03 17:29:22',NULL,NULL),(16,9,'/uploads/listings/9_1775237746933_1.jpg',1,'2026-04-03 17:35:47',NULL,NULL),(17,10,'/uploads/listings/10_1775326606544_1.jpg',1,'2026-04-04 18:16:47',NULL,NULL),(18,11,'/uploads/listings/11_1775677842545_1.jpg',1,'2026-04-08 19:50:43',NULL,NULL),(19,12,'/uploads/listings/12_1775678650918_1.jpg',1,'2026-04-08 20:04:11',NULL,NULL),(20,13,'/uploads/listings/13_1775917805736_1.jpg',1,'2026-04-11 14:30:06',NULL,NULL),(21,14,'/uploads/listings/14_1775918537910_1.jpg',1,'2026-04-11 14:42:18',NULL,NULL),(22,15,'/uploads/listings/15_1775919734492_1.jpg',1,'2026-04-11 15:02:14',NULL,NULL),(23,16,'/uploads/listings/16_1775920858393_1.jpg',1,'2026-04-11 15:20:58',NULL,NULL),(24,17,'/uploads/listings/17_1775922557608_1.jpg',1,'2026-04-11 15:49:18',NULL,NULL),(25,18,'/uploads/listings/18_1775923905682_1.jpg',1,'2026-04-11 16:11:46',NULL,NULL),(26,21,'/uploads/listings/21_1775927394192_1.jpg',1,'2026-04-11 17:09:54',NULL,NULL),(27,22,'/uploads/listings/22_1775927666267_1.jpg',1,'2026-04-11 17:14:26',NULL,NULL),(28,23,'/uploads/listings/23_1775928220333_1.jpg',1,'2026-04-11 17:23:40',NULL,NULL),(29,24,'/uploads/listings/24_1775928913587_1.jpg',1,'2026-04-11 17:35:14',NULL,NULL);
/*!40000 ALTER TABLE `listing_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listing_likes`
--

DROP TABLE IF EXISTS `listing_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listing_likes` (
  `user_id` bigint NOT NULL,
  `listing_id` bigint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`listing_id`),
  KEY `idx_listing_likes_listing_id` (`listing_id`),
  CONSTRAINT `fk_listing_likes_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_listing_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_likes`
--

LOCK TABLES `listing_likes` WRITE;
/*!40000 ALTER TABLE `listing_likes` DISABLE KEYS */;
INSERT INTO `listing_likes` VALUES (2,5,'2026-04-02 13:53:17'),(2,6,'2026-04-02 13:53:16'),(2,10,'2026-04-04 18:17:25');
/*!40000 ALTER TABLE `listing_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listings`
--

DROP TABLE IF EXISTS `listings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listings` (
  `listing_id` bigint NOT NULL AUTO_INCREMENT,
  `seller_id` bigint NOT NULL,
  `category_id` bigint DEFAULT NULL,
  `pickup_address_id` bigint DEFAULT NULL,
  `title` varchar(300) NOT NULL,
  `description` text,
  `price` decimal(12,2) DEFAULT '0.00',
  `item_condition` enum('NEW','USED_LIKE_NEW','USED_GOOD','USED_FAIR') DEFAULT 'USED_GOOD',
  `status` enum('DRAFT','ACTIVE','HIDDEN','SOLD','GIVEN_AWAY','BANNED','DELETED') DEFAULT 'DRAFT',
  `purpose` enum('SALE','GIVEAWAY','FLASH') DEFAULT 'SALE',
  `is_giveaway` tinyint(1) DEFAULT '0',
  `expiration_date` datetime DEFAULT NULL,
  `view_count` bigint DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`listing_id`),
  KEY `seller_id` (`seller_id`),
  KEY `category_id` (`category_id`),
  KEY `pickup_address_id` (`pickup_address_id`),
  CONSTRAINT `listings_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `listings_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`),
  CONSTRAINT `listings_ibfk_3` FOREIGN KEY (`pickup_address_id`) REFERENCES `addresses` (`address_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listings`
--

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` VALUES (1,2,1,1,'Giao trinh MAD101 & OSG202',NULL,150000.00,'USED_GOOD','SOLD','SALE',0,NULL,0,'2026-03-29 17:05:13','2026-03-30 16:22:26',NULL),(2,3,2,2,'Chuot Logitech G304 cu',NULL,300000.00,'USED_GOOD','HIDDEN','SALE',0,NULL,0,'2026-03-29 17:05:13','2026-04-06 15:22:25',NULL),(3,4,3,3,'Am sieu toc 1.8L con moi',NULL,0.00,'USED_GOOD','ACTIVE','SALE',0,NULL,0,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(4,1,1,4,'API-CONFIG-TEST-1775136658','test listing expiration config',120000.00,'USED_GOOD','ACTIVE','SALE',0,NULL,0,'2026-04-02 13:30:59','2026-04-02 13:30:59',NULL),(5,1,1,5,'API-CONFIG-TEST2-1775136955','test listing expiration config v2',123000.00,'USED_GOOD','HIDDEN','SALE',0,'2026-04-07 13:35:56',0,'2026-04-02 13:35:56','2026-04-07 22:20:41',NULL),(6,2,1,7,'đđasadsa đá ádas dsad ádasd đđasadsa đá ádas dsad','đđasadsa đá ádas dsad ádasdđđasadsa đá ádas dsad ádasdđđasadsa đá ádas dsad ádasdđđasadsa đá ádas dsad ádasd',55500000.00,'USED_GOOD','HIDDEN','SALE',0,'2026-05-02 13:50:27',0,'2026-04-02 13:50:27','2026-04-04 14:13:34',NULL),(7,1,7,8,'đá sad sad ád sd sad đá sad sad ád sd sadđá sad sa','đâsd sadsa đâsd sadsa đâsd sadsa đâsd sadsa đâsd sadsa',0.00,'NEW','ACTIVE','GIVEAWAY',1,'2026-05-03 17:23:40',0,'2026-04-03 17:23:40','2026-04-03 17:23:40',NULL),(8,1,7,9,'đâsd sd adsad ád áds da đa á dđâsd sd adsad ád áds','đâsd sd adsad ád áds da đa á dđâsd sd adsad ád áds da đa á dđâsd sd adsad ád áds da đa á dđâsd sd adsad ád áds da đa á dđâsd sd adsad ád áds da đa á d',1000000.00,'NEW','ACTIVE','SALE',0,'2026-05-03 17:29:22',0,'2026-04-03 17:29:22','2026-04-03 17:29:22',NULL),(9,1,1,10,'an test','an testan testan testan testan testan test an testan testan test',1000000.00,'NEW','ACTIVE','SALE',0,'2026-05-03 17:35:47',0,'2026-04-03 17:35:47','2026-04-03 17:35:47',NULL),(10,1,7,11,'test deal_id = 3, 4; người mua nhấn chấp nhận giao','đá ádsa dsa d đá sad ádas ddsadasd ád ád áádasd ád',0.00,'USED_GOOD','ACTIVE','GIVEAWAY',1,'2026-05-04 18:16:47',0,'2026-04-04 18:16:47','2026-04-04 18:16:47',NULL),(11,4,9,12,'dasd sad asd asd asd asd sa das','dasd asd sad asd sad asd as dasd asd asd as dasd asd asd as das das das dsa',0.00,'NEW','HIDDEN','GIVEAWAY',1,'2026-05-08 19:50:43',0,'2026-04-08 19:50:43','2026-04-08 20:03:06',NULL),(12,4,11,14,'sad  sad sad sad as dasdas das','sad asdas das das das  dsad asd asd as da sdas d as',0.00,'NEW','ACTIVE','GIVEAWAY',1,'2026-05-08 20:04:11',0,'2026-04-08 20:04:11','2026-04-08 20:04:11',NULL),(13,4,7,16,'das sa sad as','das sa sad asdas sa sad asdas sa sad asdas sa sad asdas sa sad asdas sa sad asdas sa sad asdas sa sad asdas sa sad asdas sa sad asdas sa sad asdas sa sad asdas sa sad asdas sa sad as',200000.00,'NEW','ACTIVE','SALE',0,'2026-05-11 14:30:06',0,'2026-04-11 14:30:06','2026-04-11 14:30:06',NULL),(14,4,8,18,'zzzzz','zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz  zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz  zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz  zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz  zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz  zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz  zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz  zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz  zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz  zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz  zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',200000.00,'NEW','ACTIVE','SALE',0,'2026-05-11 14:42:18',0,'2026-04-11 14:42:18','2026-04-11 14:42:18',NULL),(15,4,1,20,'dsad á sd sd','dsad á sd sddsad á sd sddsad á sd sddsad á sd sddsad á sd sddsad á sd sddsad á sd sddsad á sd sddsad á sd sddsad á sd sddsad á sd sd',111111.00,'NEW','ACTIVE','SALE',0,'2026-05-11 15:02:14',0,'2026-04-11 15:02:14','2026-04-11 15:02:14',NULL),(16,4,1,22,'sad ads sad ád á a á','sad ads sad ád á a ásad ads sad ád á a ásad ads sad ád á a ásad ads sad ád á a ásad ads sad ád á a ásad ads sad ád á a ásad ads sad ád á a ásad ads sad ád á a ásad ads sad ád á a ásad ads sad ád á a á',200000.00,'NEW','ACTIVE','SALE',0,'2026-05-11 15:20:58',0,'2026-04-11 15:20:58','2026-04-11 15:20:58',NULL),(17,4,7,23,'112333','dsadas đá sad á dsadas đá sad á dsadas đá sad á dsadas đá sad á dsadas đá sad á dsadas đá sad á 123',200000.00,'NEW','ACTIVE','SALE',0,'2026-05-11 15:49:18',0,'2026-04-11 15:49:18','2026-04-11 15:49:18',NULL),(18,2,1,24,'dá dsad ád ád ádasd ád ád a','dsad  dsad dsad dsad dsad dsad dsad dsad dsad dsad dsad dsad dsad dsad dsad',0.00,'NEW','ACTIVE','GIVEAWAY',1,'2026-05-11 16:11:46',0,'2026-04-11 16:11:46','2026-04-11 16:11:46',NULL),(19,1,7,11,'race test listing','concurrent deal test',100000.00,'USED_GOOD','ACTIVE','SALE',0,'2026-05-11 17:07:05',0,'2026-04-11 17:07:05','2026-04-11 17:07:05',NULL),(20,1,7,11,'race2','t',50000.00,'USED_GOOD','ACTIVE','SALE',0,'2026-05-11 17:07:51',0,'2026-04-11 17:07:51','2026-04-11 17:07:51',NULL),(21,4,7,25,'ád áádasdas d ádas dâs sa','sad ádas dá đá ád áádasdas d ád ád á đá a',0.00,'NEW','ACTIVE','GIVEAWAY',1,'2026-05-11 17:09:54',0,'2026-04-11 17:09:54','2026-04-11 17:09:54',NULL),(22,2,7,27,'dá dsad sd sd sd sd s sd ds','Gửi ảnh thất bại: Internal server error: could not execute statement [Connection is read-only. Queries leading to data modification are not allowed] [insert into conversations (created_at,last_message_at,listing_id,session_uuid,status,user_id1,user_id2) values (?,?,?,?,?,?,?)]Gửi ảnh thất bại: Internal server error: could not execute statement [Connection is read-only. Queries leading to data modification are not allowed] [insert into conversations (created_at,last_message_at,listing_id,session_uuid,status,user_id1,user_id2) values (?,?,?,?,?,?,?)]Gửi ảnh thất bại: Internal server error: could not execute statement [Connection is read-only. Queries leading to data modification are not allowed] [insert into conversations (created_at,last_message_at,listing_id,session_uuid,status,user_id1,user_id2) values (?,?,?,?,?,?,?)]',55500000.00,'NEW','ACTIVE','SALE',0,'2026-05-11 17:14:26',0,'2026-04-11 17:14:26','2026-04-11 17:14:26',NULL),(23,2,7,28,'dđđasadasdas đâs đâs đá ád ádas dá','ádd ádas đđđâsdasd áda sd adasd a ád ád ád ád',55500000.00,'NEW','ACTIVE','SALE',0,'2026-05-11 17:23:40',0,'2026-04-11 17:23:40','2026-04-11 17:23:40',NULL),(24,2,7,29,'an 123','dsad sad ad ád ádsad sad á  dsad sad ad ád ádsad sad á dsad sad ad ád ádsad sad á dsad sad ad ád ádsad sad á dsad sad ad ád ádsad sad á',0.00,'NEW','ACTIVE','GIVEAWAY',1,'2026-05-11 17:35:14',0,'2026-04-11 17:35:14','2026-04-11 17:35:14',NULL);
/*!40000 ALTER TABLE `listings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_images`
--

DROP TABLE IF EXISTS `message_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_images` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `message_id` bigint NOT NULL,
  `image_url` varchar(2000) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`image_id`),
  KEY `message_id` (`message_id`),
  CONSTRAINT `message_images_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`message_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_images`
--

LOCK TABLES `message_images` WRITE;
/*!40000 ALTER TABLE `message_images` DISABLE KEYS */;
INSERT INTO `message_images` VALUES (1,5,'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800','2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(2,5,'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=800','2026-03-29 17:05:13','2026-03-29 17:05:13',NULL);
/*!40000 ALTER TABLE `message_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `message_id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint NOT NULL,
  `sender_id` bigint NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `sent_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `message_type` varchar(30) NOT NULL DEFAULT 'TEXT',
  `file_url` varchar(1000) DEFAULT NULL,
  `reply_to_message_id` bigint DEFAULT NULL,
  `quote_message_id` bigint DEFAULT NULL,
  PRIMARY KEY (`message_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sender_id` (`sender_id`),
  KEY `idx_messages_reply_to` (`reply_to_message_id`),
  KEY `idx_messages_quote` (`quote_message_id`),
  CONSTRAINT `fk_messages_quote` FOREIGN KEY (`quote_message_id`) REFERENCES `messages` (`message_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_messages_reply_to` FOREIGN KEY (`reply_to_message_id`) REFERENCES `messages` (`message_id`) ON DELETE SET NULL,
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`),
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,4,'Chao ban, giao trinh MAD con moi khong a?',1,'2026-03-29 17:05:13','2026-03-29 17:38:09',NULL,'TEXT',NULL,NULL,NULL),(2,1,2,'Chao ban, sach minh moi dung 1 ky, khong viet ve gi vao dau.',1,'2026-03-29 17:05:13','2026-04-11 14:28:17',NULL,'TEXT',NULL,NULL,NULL),(3,1,4,'Oki ban, 120k duoc khong minh qua Dom A lay luon?',1,'2026-03-29 17:05:13','2026-03-29 17:38:09',NULL,'TEXT',NULL,NULL,NULL),(4,1,2,'Thoi minh de dung 150k ban nhe, sach hiem a.',1,'2026-03-29 17:05:13','2026-04-11 14:28:17',NULL,'TEXT',NULL,NULL,NULL),(5,1,4,'Vang the ban gui minh anh thuc te voi.',1,'2026-03-29 17:05:13','2026-03-29 17:38:09',NULL,'TEXT',NULL,NULL,NULL),(6,1,2,'Chào bạn, mình vẫn còn hàng nhé.',1,'2026-03-29 17:38:13','2026-04-11 14:28:17',NULL,'TEXT',NULL,NULL,NULL),(7,1,2,'alo',1,'2026-03-29 17:38:22','2026-04-11 14:28:17',NULL,'TEXT',NULL,NULL,NULL),(8,1,2,'💰 Trả giá: 20000đ',1,'2026-03-30 17:18:45','2026-04-11 14:28:17',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(9,2,2,'Mình chốt nhé, giữ giúp mình.',1,'2026-04-03 12:31:03','2026-04-03 14:44:02',NULL,'TEXT',NULL,NULL,NULL),(10,4,2,'/',1,'2026-04-03 12:52:46','2026-04-08 19:47:59',NULL,'TEXT',NULL,NULL,NULL),(11,3,2,'đâsdasdas',0,'2026-04-03 12:53:09',NULL,NULL,'TEXT',NULL,NULL,NULL),(12,2,2,'[curl-test] tin dau tien listingId-only',1,'2026-04-03 12:56:33','2026-04-03 14:44:02',NULL,'TEXT',NULL,NULL,NULL),(13,5,2,'💰 Trả giá: 99000đ',1,'2026-04-03 12:56:33','2026-04-03 17:02:24',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(14,2,2,'[curl-test] tin thu 2 sau rate limit',1,'2026-04-03 12:56:44','2026-04-03 14:44:02',NULL,'TEXT',NULL,NULL,NULL),(15,2,2,'[Hinh anh]',1,'2026-04-03 12:56:46','2026-04-03 14:44:02',NULL,'IMAGE','/uploads/chats/9635fbea-7902-4cc3-9d0c-9c3e97b5a411/4edc960c-0d75-41be-b61b-299f89c74e18.png',NULL,NULL),(16,2,2,'💰 Trả giá: 100000đ',1,'2026-04-03 14:42:53','2026-04-03 14:44:02',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(17,2,2,'alo',1,'2026-04-03 14:43:00','2026-04-03 14:44:02',NULL,'TEXT',NULL,16,NULL),(18,2,1,'✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.',1,'2026-04-03 14:45:11','2026-04-03 14:49:36',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(19,2,1,'🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: API-CONFIG-TEST2-1775136955\n- Giá thỏa thuận: 100.000 ₫\n- Thời gian nhận hàng: 21:54 03/04/2026\n- Địa điểm nhận hàng: FPT Hoa Lac — T1\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-03 14:54:33','2026-04-03 14:55:03',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(20,2,2,'✅ Mình đồng ý với thông tin giao dịch trên.',1,'2026-04-03 14:55:06','2026-04-03 17:48:08',NULL,'TEXT',NULL,19,NULL),(21,5,2,'đa',1,'2026-04-03 17:02:17','2026-04-03 17:02:24',NULL,'TEXT',NULL,NULL,NULL),(22,5,1,'🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: API-CONFIG-TEST-1775136658\n- Giá thỏa thuận: 120.000 ₫\n- Thời gian nhận hàng: 00:02 04/04/2026\n- Địa điểm nhận hàng: FPT Hoa Lac — T1\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-03 17:03:29','2026-04-03 17:12:11',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(23,5,2,',',1,'2026-04-03 17:12:37','2026-04-03 17:24:11',NULL,'TEXT',NULL,NULL,NULL),(24,5,2,'❌ Mình không đồng ý / hủy giao dịch này.',1,'2026-04-03 17:22:28','2026-04-03 17:24:11',NULL,'TEXT',NULL,22,NULL),(25,6,2,'cho e xin tiền',1,'2026-04-03 17:23:57','2026-04-03 17:24:13',NULL,'TEXT',NULL,NULL,NULL),(26,6,1,'🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: đá sad sad ád sd sad đá sad sad ád sd sadđá sad sa\n- Giá thỏa thuận: 0 ₫\n- Thời gian nhận hàng: 00:24 04/04/2026\n- Địa điểm nhận hàng: đỗ thành an\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-03 17:24:35','2026-04-03 17:27:29',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(27,6,2,'✅ Mình đồng ý với thông tin giao dịch trên.',1,'2026-04-03 17:24:39','2026-04-03 17:27:26',NULL,'TEXT',NULL,26,NULL),(28,7,2,'💰 Trả giá: 850000đ',1,'2026-04-03 17:29:35','2026-04-03 17:29:41',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(29,7,1,'✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.',1,'2026-04-03 17:29:48','2026-04-03 17:34:15',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(30,7,1,'🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: đâsd sd adsad ád áds da đa á dđâsd sd adsad ád áds\n- Giá thỏa thuận: 850.000 ₫\n- Thời gian nhận hàng: 00:29 04/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-03 17:30:13','2026-04-03 17:34:15',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(31,7,2,'✅ Mình đồng ý với thông tin giao dịch trên.',1,'2026-04-03 17:30:17','2026-04-03 17:48:01',NULL,'TEXT',NULL,30,NULL),(32,7,2,'💰 Trả giá: 850000đ',1,'2026-04-03 17:30:24','2026-04-03 17:48:01',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(33,7,1,'✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.',1,'2026-04-03 17:30:33','2026-04-03 17:34:15',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(34,8,2,'ds',1,'2026-04-03 17:36:14','2026-04-03 17:47:52',NULL,'TEXT',NULL,NULL,NULL),(35,2,1,'đâsd',1,'2026-04-03 18:27:48','2026-04-04 18:10:07',NULL,'TEXT',NULL,NULL,NULL),(36,2,1,'đá',1,'2026-04-03 18:27:49','2026-04-04 18:10:07',NULL,'TEXT',NULL,NULL,NULL),(37,2,1,'đasa',1,'2026-04-03 18:27:51','2026-04-04 18:10:07',NULL,'TEXT',NULL,NULL,NULL),(38,2,1,'đasadddasdas',1,'2026-04-03 18:27:53','2026-04-04 18:10:07',NULL,'TEXT',NULL,NULL,NULL),(39,2,1,'sadddasdasdsada',1,'2026-04-03 18:27:54','2026-04-04 18:10:07',NULL,'TEXT',NULL,NULL,NULL),(40,2,1,'đâsdasdasd',1,'2026-04-03 18:27:56','2026-04-04 18:10:07',NULL,'TEXT',NULL,NULL,NULL),(41,2,1,'đasadadassd',1,'2026-04-03 18:27:58','2026-04-04 18:10:07',NULL,'TEXT',NULL,NULL,NULL),(42,2,1,'đâsdasd',1,'2026-04-03 18:28:00','2026-04-04 18:10:07',NULL,'TEXT',NULL,NULL,NULL),(43,2,1,'đasadadas',1,'2026-04-03 18:28:02','2026-04-04 18:10:07',NULL,'TEXT',NULL,NULL,NULL),(44,8,2,'💰 Trả giá: 850000đ',1,'2026-04-03 18:37:28','2026-04-03 18:37:33',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(45,8,1,'✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.',1,'2026-04-03 18:37:37','2026-04-04 18:09:59',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(46,8,1,'🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: an test\n- Giá thỏa thuận: 850.000 ₫\n- Thời gian nhận hàng: 01:37 04/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-03 18:37:48','2026-04-04 18:09:59',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(47,8,2,'✅ Mình đồng ý với thông tin giao dịch trên.',1,'2026-04-03 18:37:56','2026-04-04 18:26:20',NULL,'TEXT',NULL,46,NULL),(48,9,2,'a',1,'2026-04-04 18:17:53','2026-04-04 18:18:02',NULL,'TEXT',NULL,NULL,NULL),(49,9,1,'cc j',1,'2026-04-04 18:18:06','2026-04-04 18:18:17',NULL,'TEXT',NULL,NULL,NULL),(50,9,2,'s',1,'2026-04-04 18:18:43','2026-04-04 18:19:03',NULL,'TEXT',NULL,NULL,NULL),(51,9,2,'ds',1,'2026-04-04 18:19:10','2026-04-04 18:21:04',NULL,'TEXT',NULL,NULL,NULL),(52,9,1,'d',1,'2026-04-04 18:21:06','2026-04-04 18:28:21',NULL,'TEXT',NULL,NULL,NULL),(53,9,1,'🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: test deal_id = 3, 4; người mua nhấn chấp nhận giao\n- Giá thỏa thuận: 0 ₫\n- Thời gian nhận hàng: 01:21 05/04/2026\n- Địa điểm nhận hàng: đâsdadsadasdasdasdasdasdadada\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-04 18:21:58','2026-04-04 18:28:21',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(54,9,2,'❌ Mình không đồng ý / hủy giao dịch này.',1,'2026-04-04 18:22:19','2026-04-04 18:26:23',NULL,'TEXT',NULL,53,NULL),(55,9,1,'d',1,'2026-04-04 18:33:58','2026-04-04 18:45:58',NULL,'TEXT',NULL,NULL,NULL),(56,9,1,'🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: test deal_id = 3, 4; người mua nhấn chấp nhận giao\n- Giá thỏa thuận: 0 ₫\n- Thời gian nhận hàng: 02:37 06/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-04 18:37:55','2026-04-04 18:45:58',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(57,9,2,'❌ Mình không đồng ý / hủy giao dịch này.',1,'2026-04-04 18:38:09','2026-04-04 18:44:02',NULL,'TEXT',NULL,56,NULL),(58,9,1,'🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: test deal_id = 3, 4; người mua nhấn chấp nhận giao\n- Giá thỏa thuận: 0 ₫\n- Thời gian nhận hàng: 02:37 06/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-04 18:38:14','2026-04-04 18:45:58',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(59,9,2,'✅ Mình đồng ý với thông tin giao dịch trên.',1,'2026-04-04 18:38:18','2026-04-04 18:44:02',NULL,'TEXT',NULL,58,NULL),(60,9,1,'d',1,'2026-04-04 18:45:50','2026-04-04 18:45:58',NULL,'TEXT',NULL,NULL,NULL),(61,9,1,'d',1,'2026-04-04 18:46:02','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(62,9,2,'d',1,'2026-04-04 18:46:06','2026-04-04 18:53:44',NULL,'TEXT',NULL,NULL,NULL),(63,9,1,'df d',1,'2026-04-04 18:50:07','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(64,9,1,'fdfdfdfdfdfd',1,'2026-04-04 18:50:10','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(65,9,1,'fdfdfdfdfdf',1,'2026-04-04 18:50:12','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(66,9,1,'fdf',1,'2026-04-04 18:50:14','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(67,9,1,'f',1,'2026-04-04 18:50:15','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(68,9,1,'f',1,'2026-04-04 18:50:16','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(69,9,1,'f',1,'2026-04-04 18:50:17','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(70,9,1,'ff',1,'2026-04-04 18:50:18','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(71,9,1,'f',1,'2026-04-04 18:50:19','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(72,9,1,'fff',1,'2026-04-04 18:50:21','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(73,9,1,'f',1,'2026-04-04 18:50:26','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(74,9,1,'f',1,'2026-04-04 18:50:27','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(75,9,1,'f',1,'2026-04-04 18:50:28','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(76,9,1,'f',1,'2026-04-04 18:50:30','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(77,9,1,'f',1,'2026-04-04 18:50:31','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(78,9,1,'f',1,'2026-04-04 18:50:32','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(79,9,1,'f',1,'2026-04-04 18:50:34','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(80,9,1,'ff',1,'2026-04-04 18:50:35','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(81,9,1,'f',1,'2026-04-04 18:50:36','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(82,9,1,'f',1,'2026-04-04 18:50:37','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(83,9,1,'f',1,'2026-04-04 18:50:38','2026-04-04 18:54:31',NULL,'TEXT',NULL,NULL,NULL),(84,9,2,'.',0,'2026-04-08 18:36:54',NULL,NULL,'TEXT',NULL,NULL,NULL),(85,9,2,'.',0,'2026-04-08 18:36:56',NULL,NULL,'TEXT',NULL,NULL,NULL),(86,9,2,'.',0,'2026-04-08 18:36:58',NULL,NULL,'TEXT',NULL,NULL,NULL),(87,9,2,'.',0,'2026-04-08 18:36:59',NULL,NULL,'TEXT',NULL,NULL,NULL),(88,10,2,'dasd sad',1,'2026-04-08 19:51:04','2026-04-08 19:51:11',NULL,'TEXT',NULL,NULL,NULL),(89,10,2,'dasd',1,'2026-04-08 19:51:16','2026-04-08 19:58:24',NULL,'TEXT',NULL,NULL,NULL),(90,10,4,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: dasd sad asd asd asd asd sa das\n- Giá thỏa thuận: 0 ₫\n- Thời gian nhận hàng: 03:51 09/04/2026\n- Địa điểm nhận hàng: d sadsa dsdssdsdsdssdds\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-08 19:51:37','2026-04-08 19:57:04',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(91,10,2,'✅ Mình đồng ý với thông tin thỏa thuận trên.',1,'2026-04-08 19:57:07','2026-04-08 19:58:24',NULL,'TEXT',NULL,90,NULL),(92,10,4,'ok',1,'2026-04-08 19:58:38','2026-04-08 19:59:10',NULL,'TEXT',NULL,91,NULL),(93,11,2,'dasd sad',1,'2026-04-08 20:04:28','2026-04-08 20:04:34',NULL,'TEXT',NULL,NULL,NULL),(94,11,4,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: sad  sad sad sad as dasdas das\n- Giá thỏa thuận: 0 ₫\n- Thời gian nhận hàng: 03:06 09/04/2026\n- Địa điểm nhận hàng: do thanh an\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-08 20:05:03','2026-04-11 14:27:03',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(95,11,2,'❌ Mình không đồng ý / hủy thỏa thuận này.',1,'2026-04-08 20:05:06','2026-04-11 14:28:03',NULL,'TEXT',NULL,94,NULL),(96,11,4,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: sad  sad sad sad as dasdas das\n- Giá thỏa thuận: 0 ₫\n- Thời gian nhận hàng: 04:05 09/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-08 20:05:18','2026-04-11 14:27:03',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(97,11,2,'✅ Mình đồng ý với thông tin thỏa thuận trên.',1,'2026-04-08 20:05:28','2026-04-11 14:28:03',NULL,'TEXT',NULL,96,NULL),(98,12,2,'💰 Trả giá: 170000đ',1,'2026-04-11 14:31:38','2026-04-11 14:32:03',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(99,12,4,'✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.',0,'2026-04-11 14:32:05',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(100,12,4,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: das sa sad as\n- Giá thỏa thuận: 170.000 ₫\n- Thời gian nhận hàng: 12:33 12/04/2026\n- Địa điểm nhận hàng: asd da sdasdas asd asd sddsdadasdad\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',0,'2026-04-11 14:34:15',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(101,12,2,'✅ Mình đồng ý với thông tin thỏa thuận trên.',1,'2026-04-11 14:34:23','2026-04-11 14:34:39',NULL,'TEXT',NULL,100,NULL),(102,13,2,'💰 Trả giá: 170000đ',1,'2026-04-11 14:42:29','2026-04-11 14:42:36',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(103,13,4,'✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.',0,'2026-04-11 14:42:39',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(104,13,4,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: zzzzz\n- Giá thỏa thuận: 170.000 ₫\n- Thời gian nhận hàng: 12:53 12/04/2026\n- Địa điểm nhận hàng: leu\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',0,'2026-04-11 14:52:08',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(105,13,2,'✅ Mình đồng ý với thông tin thỏa thuận trên.',0,'2026-04-11 14:52:11',NULL,NULL,'TEXT',NULL,104,NULL),(106,13,2,'okk ban nhe',0,'2026-04-11 14:52:17',NULL,NULL,'TEXT',NULL,NULL,NULL),(107,14,2,'💰 Trả giá: 100000đ',1,'2026-04-11 15:02:37','2026-04-11 15:02:41',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(108,14,4,'❌ Offer bị từ chối.',1,'2026-04-11 15:02:44','2026-04-11 15:19:55',NULL,'TEXT',NULL,NULL,NULL),(109,14,2,'💰 Trả giá: 90000đ',1,'2026-04-11 15:02:48','2026-04-11 15:19:30',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(110,14,4,'✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.',1,'2026-04-11 15:02:49','2026-04-11 15:19:55',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(111,14,4,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: dsad á sd sd\n- Giá thỏa thuận: 90.000 ₫\n- Thời gian nhận hàng: 12:05 12/04/2026\n- Địa điểm nhận hàng: d\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-11 15:03:20','2026-04-11 15:19:55',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(112,14,2,'✅ Mình đồng ý với thông tin thỏa thuận trên.',1,'2026-04-11 15:03:22','2026-04-11 15:19:30',NULL,'TEXT',NULL,111,NULL),(113,15,2,'💰 Trả giá: 170000đ',1,'2026-04-11 15:21:33','2026-04-11 15:21:51',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(114,15,4,'✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.',1,'2026-04-11 15:21:59','2026-04-11 15:49:25',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(115,15,4,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: sad ads sad ád á a á\n- Giá thỏa thuận: 170.000 ₫\n- Thời gian nhận hàng: 00:27 12/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-11 15:25:55','2026-04-11 15:49:25',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(116,15,2,'✅ Mình đồng ý với thông tin thỏa thuận trên.',0,'2026-04-11 15:38:23',NULL,NULL,'TEXT',NULL,115,NULL),(117,16,2,'💰 Trả giá: 170000đ',1,'2026-04-11 15:49:34','2026-04-11 15:49:42',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(118,16,2,'dá đđđâsdasd',1,'2026-04-11 15:49:36','2026-04-11 15:49:42',NULL,'TEXT',NULL,NULL,NULL),(119,16,4,'✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.',0,'2026-04-11 15:49:44',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(120,16,4,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: 112333\n- Giá thỏa thuận: 170.000 ₫\n- Thời gian nhận hàng: 00:55 12/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',0,'2026-04-11 15:51:14',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(121,16,2,'✅ Mình đồng ý với thông tin thỏa thuận trên.',0,'2026-04-11 15:51:28',NULL,NULL,'TEXT',NULL,120,NULL),(122,17,4,'ddsaasd',1,'2026-04-11 16:18:56','2026-04-11 16:19:17',NULL,'TEXT',NULL,NULL,NULL),(123,17,4,'alo 1 2 3 4',1,'2026-04-11 16:19:01','2026-04-11 16:19:17',NULL,'TEXT',NULL,NULL,NULL),(124,17,2,'kkkkkkkkkkkk',1,'2026-04-11 16:19:22','2026-04-11 17:09:09',NULL,'TEXT',NULL,NULL,NULL),(125,17,2,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: dá dsad ád ád ádasd ád ád a\n- Giá thỏa thuận: 0 ₫\n- Thời gian nhận hàng: 01:22 12/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',1,'2026-04-11 16:19:51','2026-04-11 17:09:09',NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(126,17,4,'✅ Mình đồng ý với thông tin thỏa thuận trên.',1,'2026-04-11 16:19:57','2026-04-11 16:51:37',NULL,'TEXT',NULL,125,NULL),(127,20,2,'[Hình ảnh]',1,'2026-04-11 17:13:03','2026-04-11 17:13:11',NULL,'IMAGE','/uploads/chats/53ccbefd-4fef-4d5b-837c-1810c0be3aeb/924a18e6-d5db-42a4-bd79-ee7c66d99c0c.jpg',NULL,NULL),(128,20,4,'Cảm ơn bạn đã quan tâm tin nhé!',0,'2026-04-11 17:13:19',NULL,NULL,'TEXT',NULL,NULL,NULL),(129,20,4,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: ád áádasdas d ádas dâs sa\n- Giá thỏa thuận: 0 ₫\n- Thời gian nhận hàng: 02:16 12/04/2026\n- Địa điểm nhận hàng: an an tét\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',0,'2026-04-11 17:13:44',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(130,20,2,'✅ Mình đồng ý với thông tin thỏa thuận trên.',0,'2026-04-11 17:13:48',NULL,NULL,'TEXT',NULL,129,NULL),(131,21,4,'[Hình ảnh]',1,'2026-04-11 17:14:41','2026-04-11 17:14:50',NULL,'IMAGE','/uploads/chats/08402aa1-c7ba-460d-bce3-daae26cebc9d/db4aac0c-e835-4e42-a25d-3a8b5a5600df.jpg',NULL,NULL),(132,21,4,'💰 Trả giá: 47180000đ',1,'2026-04-11 17:14:45','2026-04-11 17:14:50',NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(133,21,2,'✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.',0,'2026-04-11 17:14:53',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(134,21,2,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: dá dsad sd sd sd sd s sd ds\n- Giá thỏa thuận: 47.180.000 ₫\n- Thời gian nhận hàng: 01:14 12/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',0,'2026-04-11 17:15:03',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(135,21,4,'❌ Mình không đồng ý / hủy thỏa thuận này.',0,'2026-04-11 17:15:07',NULL,NULL,'TEXT',NULL,134,NULL),(136,21,2,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: dá dsad sd sd sd sd s sd ds\n- Giá thỏa thuận: 47.180.000 ₫\n- Thời gian nhận hàng: 01:15 12/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',0,'2026-04-11 17:15:14',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(137,21,2,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: dá dsad sd sd sd sd s sd ds\n- Giá thỏa thuận: 47.180.000 ₫\n- Thời gian nhận hàng: 01:15 12/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',0,'2026-04-11 17:15:15',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(138,21,4,'✅ Mình đồng ý với thông tin thỏa thuận trên.',0,'2026-04-11 17:15:25',NULL,NULL,'TEXT',NULL,136,NULL),(139,22,4,'[Hình ảnh]',1,'2026-04-11 17:24:18','2026-04-11 17:24:26',NULL,'IMAGE','/uploads/chats/6ce29f05-ef94-4cb1-9c1f-da7f1548e3be/55dd9624-4ad1-4792-ba99-0e27b5dea5e2.jpg',NULL,NULL),(140,22,4,'d ssadasdasd ád',1,'2026-04-11 17:24:21','2026-04-11 17:24:26',NULL,'TEXT',NULL,NULL,NULL),(141,22,4,'💰 Trả giá: 47180000đ',0,'2026-04-11 17:24:35',NULL,NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(142,22,2,'❌ Offer bị từ chối.',0,'2026-04-11 17:24:37',NULL,NULL,'TEXT',NULL,NULL,NULL),(143,22,4,'💰 Trả giá: 52730000đ',0,'2026-04-11 17:24:48',NULL,NULL,'OFFER_PROPOSAL',NULL,NULL,NULL),(144,22,2,'✅ Deal Confirmed! Vui lòng hẹn gặp tại Hoa Lac Campus.',0,'2026-04-11 17:24:50',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(145,22,2,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: dđđasadasdas đâs đâs đá ád ádas dá\n- Giá thỏa thuận: 52.730.000 ₫\n- Thời gian nhận hàng: 01:24 12/04/2026\n- Địa điểm nhận hàng: Phường Quang Trung, Thành phố Hà Giang, Tỉnh Hà Giang\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',0,'2026-04-11 17:25:00',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(146,22,4,'❌ Mình không đồng ý / hủy thỏa thuận này.',0,'2026-04-11 17:25:05',NULL,NULL,'TEXT',NULL,145,NULL),(147,22,2,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: dđđasadasdas đâs đâs đá ád ádas dá\n- Giá thỏa thuận: 52.730.000 ₫\n- Thời gian nhận hàng: 01:25 12/04/2026\n- Địa điểm nhận hàng: Phường Quang Trung, Thành phố Hà Giang, Tỉnh Hà Giang\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',0,'2026-04-11 17:25:10',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(148,22,4,'✅ Mình đồng ý với thông tin thỏa thuận trên.',0,'2026-04-11 17:25:15',NULL,NULL,'TEXT',NULL,147,NULL),(149,23,4,'[Hình ảnh]',1,'2026-04-11 17:36:11','2026-04-11 17:36:19',NULL,'IMAGE','/uploads/chats/9c99944d-29b8-4e61-80ad-8a117b720614/8021490b-ff87-46e1-85fc-df55423deb64.jpg',NULL,NULL),(150,23,2,'🧾 XÁC NHẬN THỎA THUẬN\n\n- Tin đăng: an 123\n- Giá thỏa thuận: 0 ₫\n- Thời gian nhận hàng: 01:36 12/04/2026\n- Địa điểm nhận hàng: Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội\n\nVui lòng chọn: Chấp nhận hoặc Hủy.',0,'2026-04-11 17:36:29',NULL,NULL,'DEAL_CONFIRMATION',NULL,NULL,NULL),(151,23,4,'✅ Mình đồng ý với thông tin thỏa thuận trên.',0,'2026-04-11 17:36:33',NULL,NULL,'TEXT',NULL,150,NULL);
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `type` enum('MESSAGE','DEAL','FOLLOW','SYSTEM','REPORT') NOT NULL,
  `ref_type` varchar(50) DEFAULT NULL,
  `ref_id` bigint DEFAULT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=171 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,4,'MESSAGE','MESSAGE',6,'Do Thanh An (K18 HL): Chào bạn, mình vẫn còn hàng nhé.',0,'2026-03-29 17:38:13',NULL,NULL),(2,4,'MESSAGE','MESSAGE',7,'Do Thanh An (K18 HL): alo',0,'2026-03-29 17:38:22',NULL,NULL),(3,4,'SYSTEM','LISTING',1,'Do Thanh An (K18 HL) đề xuất giá 20000đ',0,'2026-03-30 17:18:45',NULL,NULL),(4,4,'MESSAGE','MESSAGE',8,'Do Thanh An (K18 HL): 💰 Trả giá: 20000đ',0,'2026-03-30 17:18:45',NULL,NULL),(5,3,'REPORT','LISTING',2,'Tin đăng \"Chuot Logitech G304 cu\" của bạn đã bị báo cáo bởi Do Thanh An (K18 HL)',0,'2026-03-30 17:36:53',NULL,NULL),(6,1,'MESSAGE','MESSAGE',9,'Do Thanh An (K18 HL): Mình chốt nhé, giữ giúp mình.',1,'2026-04-03 12:31:03','2026-04-06 15:02:57',NULL),(7,4,'MESSAGE','MESSAGE',10,'Do Thanh An (K18 HL): /',0,'2026-04-03 12:52:46',NULL,NULL),(8,3,'MESSAGE','MESSAGE',11,'Do Thanh An (K18 HL): đâsdasdas',0,'2026-04-03 12:53:09',NULL,NULL),(9,1,'MESSAGE','MESSAGE',12,'Do Thanh An (K18 HL): [curl-test] tin dau tien listingId-only',1,'2026-04-03 12:56:33','2026-04-06 15:02:57',NULL),(10,1,'SYSTEM','LISTING',4,'Do Thanh An (K18 HL) đề xuất giá 99000đ',1,'2026-04-03 12:56:33','2026-04-06 15:02:57',NULL),(11,1,'MESSAGE','MESSAGE',13,'Do Thanh An (K18 HL): 💰 Trả giá: 99000đ',1,'2026-04-03 12:56:33','2026-04-06 15:02:57',NULL),(12,1,'MESSAGE','MESSAGE',14,'Do Thanh An (K18 HL): [curl-test] tin thu 2 sau rate limit',1,'2026-04-03 12:56:44','2026-04-06 15:02:57',NULL),(13,1,'MESSAGE','MESSAGE',15,'Do Thanh An (K18 HL): [Hinh anh]',1,'2026-04-03 12:56:46','2026-04-06 15:02:57',NULL),(14,1,'SYSTEM','LISTING',5,'Do Thanh An (K18 HL) đề xuất giá 100000đ',1,'2026-04-03 14:42:53','2026-04-06 15:02:57',NULL),(15,1,'MESSAGE','MESSAGE',16,'Do Thanh An (K18 HL): 💰 Trả giá: 100000đ',1,'2026-04-03 14:42:53','2026-04-06 15:02:57',NULL),(16,1,'MESSAGE','MESSAGE',17,'Do Thanh An (K18 HL): alo',1,'2026-04-03 14:43:00','2026-04-06 15:02:57',NULL),(17,2,'DEAL','LISTING',5,'Deal đã được xác nhận cho: API-CONFIG-TEST2-1775136955',1,'2026-04-03 14:45:11','2026-04-04 14:13:19',NULL),(18,1,'DEAL','LISTING',5,'Deal đã được xác nhận cho: API-CONFIG-TEST2-1775136955',1,'2026-04-03 14:45:11','2026-04-06 15:02:57',NULL),(19,2,'MESSAGE','MESSAGE',19,'Lai Thi Thanh Hoa: 🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: API-CONFIG-TEST2-17751369…',1,'2026-04-03 14:54:33','2026-04-04 14:13:19',NULL),(20,1,'MESSAGE','MESSAGE',20,'Do Thanh An (K18 HL): ✅ Mình đồng ý với thông tin giao dịch trên.',1,'2026-04-03 14:55:06','2026-04-06 15:02:57',NULL),(21,1,'MESSAGE','MESSAGE',21,'Do Thanh An (K18 HL): đa',1,'2026-04-03 17:02:17','2026-04-06 15:02:57',NULL),(22,2,'MESSAGE','MESSAGE',22,'Lai Thi Thanh Hoa: 🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: API-CONFIG-TEST-177513665…',1,'2026-04-03 17:03:29','2026-04-04 14:13:19',NULL),(23,1,'MESSAGE','MESSAGE',23,'Do Thanh An (K18 HL): ,',1,'2026-04-03 17:12:37','2026-04-06 15:02:57',NULL),(24,1,'MESSAGE','MESSAGE',24,'Do Thanh An (K18 HL): ❌ Mình không đồng ý / hủy giao dịch này.',1,'2026-04-03 17:22:28',NULL,NULL),(25,1,'MESSAGE','MESSAGE',25,'Do Thanh An (K18 HL): cho e xin tiền',1,'2026-04-03 17:23:57','2026-04-06 15:02:57',NULL),(26,2,'MESSAGE','MESSAGE',26,'Lai Thi Thanh Hoa: 🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: đá sad sad ád sd sad đá s…',1,'2026-04-03 17:24:35','2026-04-04 14:13:19',NULL),(27,1,'MESSAGE','MESSAGE',27,'Do Thanh An (K18 HL): ✅ Mình đồng ý với thông tin giao dịch trên.',1,'2026-04-03 17:24:39','2026-04-06 15:02:57',NULL),(28,1,'SYSTEM','LISTING',8,'Do Thanh An (K18 HL) đề xuất giá 850000đ',1,'2026-04-03 17:29:35','2026-04-06 15:02:57',NULL),(29,1,'MESSAGE','MESSAGE',28,'Do Thanh An (K18 HL): 💰 Trả giá: 850000đ',1,'2026-04-03 17:29:35',NULL,NULL),(30,2,'DEAL','LISTING',8,'Deal đã được xác nhận cho: đâsd sd adsad ád áds da đa á dđâsd sd adsad ád áds',1,'2026-04-03 17:29:48','2026-04-04 14:13:19',NULL),(31,1,'DEAL','LISTING',8,'Deal đã được xác nhận cho: đâsd sd adsad ád áds da đa á dđâsd sd adsad ád áds',1,'2026-04-03 17:29:48','2026-04-06 15:02:57',NULL),(32,2,'MESSAGE','MESSAGE',30,'Lai Thi Thanh Hoa: 🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: đâsd sd adsad ád áds da đ…',1,'2026-04-03 17:30:13','2026-04-04 14:13:19',NULL),(33,1,'MESSAGE','MESSAGE',31,'Do Thanh An (K18 HL): ✅ Mình đồng ý với thông tin giao dịch trên.',1,'2026-04-03 17:30:17','2026-04-06 15:02:57',NULL),(34,1,'SYSTEM','LISTING',8,'Do Thanh An (K18 HL) đề xuất giá 850000đ',1,'2026-04-03 17:30:24','2026-04-06 15:02:57',NULL),(35,1,'MESSAGE','MESSAGE',32,'Do Thanh An (K18 HL): 💰 Trả giá: 850000đ',1,'2026-04-03 17:30:24','2026-04-06 15:02:57',NULL),(36,2,'DEAL','LISTING',8,'Deal đã được xác nhận cho: đâsd sd adsad ád áds da đa á dđâsd sd adsad ád áds',1,'2026-04-03 17:30:33','2026-04-04 14:13:19',NULL),(37,1,'DEAL','LISTING',8,'Deal đã được xác nhận cho: đâsd sd adsad ád áds da đa á dđâsd sd adsad ád áds',1,'2026-04-03 17:30:33','2026-04-06 15:02:57',NULL),(38,1,'MESSAGE','MESSAGE',34,'Do Thanh An (K18 HL): ds',1,'2026-04-03 17:36:14','2026-04-06 15:02:57',NULL),(39,2,'MESSAGE','MESSAGE',35,'Lai Thi Thanh Hoa: đâsd',1,'2026-04-03 18:27:48','2026-04-04 14:13:19',NULL),(40,2,'MESSAGE','MESSAGE',36,'Lai Thi Thanh Hoa: đá',1,'2026-04-03 18:27:49','2026-04-04 14:13:19',NULL),(41,2,'MESSAGE','MESSAGE',37,'Lai Thi Thanh Hoa: đasa',1,'2026-04-03 18:27:51','2026-04-04 14:13:19',NULL),(42,2,'MESSAGE','MESSAGE',38,'Lai Thi Thanh Hoa: đasadddasdas',1,'2026-04-03 18:27:53','2026-04-04 14:13:19',NULL),(43,2,'MESSAGE','MESSAGE',39,'Lai Thi Thanh Hoa: sadddasdasdsada',1,'2026-04-03 18:27:54','2026-04-04 14:13:19',NULL),(44,2,'MESSAGE','MESSAGE',40,'Lai Thi Thanh Hoa: đâsdasdasd',1,'2026-04-03 18:27:56','2026-04-04 14:13:19',NULL),(45,2,'MESSAGE','MESSAGE',41,'Lai Thi Thanh Hoa: đasadadassd',1,'2026-04-03 18:27:58','2026-04-04 14:13:19',NULL),(46,2,'MESSAGE','MESSAGE',42,'Lai Thi Thanh Hoa: đâsdasd',1,'2026-04-03 18:28:00','2026-04-04 14:13:19',NULL),(47,2,'MESSAGE','MESSAGE',43,'Lai Thi Thanh Hoa: đasadadas',1,'2026-04-03 18:28:02','2026-04-04 14:13:19',NULL),(48,1,'SYSTEM','LISTING',9,'Do Thanh An (K18 HL) đề xuất giá 850000đ',1,'2026-04-03 18:37:28','2026-04-06 15:02:57',NULL),(49,1,'MESSAGE','MESSAGE',44,'Do Thanh An (K18 HL): 💰 Trả giá: 850000đ',1,'2026-04-03 18:37:28','2026-04-06 15:02:57',NULL),(50,2,'DEAL','LISTING',9,'Deal đã được xác nhận cho: an test',1,'2026-04-03 18:37:37','2026-04-04 14:13:19',NULL),(51,1,'DEAL','LISTING',9,'Deal đã được xác nhận cho: an test',1,'2026-04-03 18:37:37','2026-04-06 15:02:57',NULL),(52,2,'MESSAGE','MESSAGE',46,'Lai Thi Thanh Hoa: 🧾 XÁC NHẬN GIAO DỊCH\n\n- Tin đăng: an test\n- Giá thỏa thuận:…',1,'2026-04-03 18:37:48','2026-04-04 14:13:19',NULL),(53,1,'MESSAGE','MESSAGE',47,'Do Thanh An (K18 HL): ✅ Mình đồng ý với thông tin giao dịch trên.',1,'2026-04-03 18:37:56','2026-04-06 15:02:57',NULL),(54,2,'MESSAGE','LISTING',6,'Lai Thi Thanh Hoa đã bình luận trên tin \"đđasadsa đá ádas dsad ádasd đđasadsa đá …\"',1,'2026-04-03 19:03:35','2026-04-04 14:13:19',NULL),(55,2,'MESSAGE','LISTING',6,'Lai Thi Thanh Hoa đã bình luận trên tin \"đđasadsa đá ádas dsad ádasd đđasadsa đá …\"',1,'2026-04-03 19:15:04','2026-04-04 14:13:19',NULL),(56,1,'MESSAGE','LISTING',9,'Do Thanh An (K18 HL) đã bình luận trên tin \"an test\"',1,'2026-04-04 14:07:11','2026-04-06 15:02:57',NULL),(57,1,'MESSAGE','LISTING',8,'Do Thanh An (K18 HL) đã bình luận trên tin \"đâsd sd adsad ád áds da đa á dđâsd sd ad…\"',1,'2026-04-04 14:07:33','2026-04-06 15:02:57',NULL),(58,1,'MESSAGE','LISTING',10,'Do Thanh An (K18 HL) đã bình luận trên tin \"test deal_id = 3, 4; người mua nhấn chấp…\"',1,'2026-04-04 18:17:20','2026-04-06 15:02:57',NULL),(59,1,'MESSAGE','MESSAGE',48,'Tin nhắn mới từ Do Thanh An (K18 HL) · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:17:53','2026-04-06 15:02:57',NULL),(60,2,'MESSAGE','MESSAGE',49,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:18:06','2026-04-04 19:59:50',NULL),(61,1,'MESSAGE','MESSAGE',50,'Tin nhắn mới từ Do Thanh An (K18 HL) · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:18:43','2026-04-06 15:02:57',NULL),(62,1,'MESSAGE','MESSAGE',51,'Tin nhắn mới từ Do Thanh An (K18 HL) · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:19:10','2026-04-06 15:02:57',NULL),(63,2,'MESSAGE','MESSAGE',52,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:21:06','2026-04-04 19:59:50',NULL),(64,2,'MESSAGE','MESSAGE',53,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:21:58','2026-04-04 19:59:50',NULL),(65,1,'MESSAGE','MESSAGE',54,'Tin nhắn mới từ Do Thanh An (K18 HL) · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:22:19','2026-04-06 15:02:57',NULL),(66,2,'MESSAGE','MESSAGE',55,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:33:58','2026-04-04 19:59:50',NULL),(67,2,'MESSAGE','MESSAGE',56,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:37:55','2026-04-04 19:59:50',NULL),(68,1,'MESSAGE','MESSAGE',57,'Tin nhắn mới từ Do Thanh An (K18 HL) · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:38:09','2026-04-06 15:02:57',NULL),(69,2,'MESSAGE','MESSAGE',58,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:38:14','2026-04-04 19:59:50',NULL),(70,1,'MESSAGE','MESSAGE',59,'Tin nhắn mới từ Do Thanh An (K18 HL) · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:38:18','2026-04-06 15:02:57',NULL),(71,2,'MESSAGE','MESSAGE',60,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:45:50','2026-04-04 19:59:50',NULL),(72,2,'MESSAGE','MESSAGE',61,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:46:02','2026-04-04 19:59:50',NULL),(73,1,'MESSAGE','MESSAGE',62,'Tin nhắn mới từ Do Thanh An (K18 HL) · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:46:06','2026-04-06 15:02:57',NULL),(74,2,'MESSAGE','MESSAGE',63,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:07','2026-04-04 19:59:50',NULL),(75,2,'MESSAGE','MESSAGE',64,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:10','2026-04-04 19:59:50',NULL),(76,2,'MESSAGE','MESSAGE',65,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:12','2026-04-04 19:59:50',NULL),(77,2,'MESSAGE','MESSAGE',66,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:14','2026-04-04 19:59:50',NULL),(78,2,'MESSAGE','MESSAGE',67,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:15','2026-04-04 19:59:50',NULL),(79,2,'MESSAGE','MESSAGE',68,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:16','2026-04-04 19:59:50',NULL),(80,2,'MESSAGE','MESSAGE',69,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:17','2026-04-04 19:59:50',NULL),(81,2,'MESSAGE','MESSAGE',70,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:18','2026-04-04 19:59:50',NULL),(82,2,'MESSAGE','MESSAGE',71,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:19','2026-04-04 19:59:50',NULL),(83,2,'MESSAGE','MESSAGE',72,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:21','2026-04-04 19:59:50',NULL),(84,2,'MESSAGE','MESSAGE',73,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:26','2026-04-04 19:59:50',NULL),(85,2,'MESSAGE','MESSAGE',74,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:27','2026-04-04 19:59:50',NULL),(86,2,'MESSAGE','MESSAGE',75,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:28','2026-04-04 19:59:50',NULL),(87,2,'MESSAGE','MESSAGE',76,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:30','2026-04-04 19:59:50',NULL),(88,2,'MESSAGE','MESSAGE',77,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:31','2026-04-04 19:59:50',NULL),(89,2,'MESSAGE','MESSAGE',78,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:32','2026-04-04 19:59:50',NULL),(90,2,'MESSAGE','MESSAGE',79,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:34','2026-04-04 19:59:50',NULL),(91,2,'MESSAGE','MESSAGE',80,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:35','2026-04-04 19:59:50',NULL),(92,2,'MESSAGE','MESSAGE',81,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:36','2026-04-04 19:59:50',NULL),(93,2,'MESSAGE','MESSAGE',82,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:37','2026-04-04 19:59:50',NULL),(94,2,'MESSAGE','MESSAGE',83,'Tin nhắn mới từ Lai Thi Thanh Hoa · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',1,'2026-04-04 18:50:38','2026-04-04 19:59:50',NULL),(95,4,'MESSAGE','LISTING',3,'Do Thanh An (K18 HL) đã bình luận trên tin \"Am sieu toc 1.8L con moi\"',0,'2026-04-05 17:07:05',NULL,NULL),(96,1,'MESSAGE','MESSAGE',84,'Tin nhắn mới từ Do Thanh An (K18 HL) · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',0,'2026-04-08 18:36:54',NULL,NULL),(97,1,'MESSAGE','MESSAGE',85,'Tin nhắn mới từ Do Thanh An (K18 HL) · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',0,'2026-04-08 18:36:56',NULL,NULL),(98,1,'MESSAGE','MESSAGE',86,'Tin nhắn mới từ Do Thanh An (K18 HL) · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',0,'2026-04-08 18:36:58',NULL,NULL),(99,1,'MESSAGE','MESSAGE',87,'Tin nhắn mới từ Do Thanh An (K18 HL) · test deal_id = 3, 4; người mua nhấn chấp nhận gi…',0,'2026-04-08 18:36:59',NULL,NULL),(100,4,'MESSAGE','MESSAGE',88,'Tin nhắn mới từ Do Thanh An (K18 HL) · dasd sad asd asd asd asd sa das',0,'2026-04-08 19:51:04',NULL,NULL),(101,4,'MESSAGE','MESSAGE',89,'Tin nhắn mới từ Do Thanh An (K18 HL) · dasd sad asd asd asd asd sa das',0,'2026-04-08 19:51:16',NULL,NULL),(102,2,'MESSAGE','MESSAGE',90,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dasd sad asd asd asd asd sa das',1,'2026-04-08 19:51:37','2026-04-11 17:02:05',NULL),(103,4,'MESSAGE','MESSAGE',91,'Tin nhắn mới từ Do Thanh An (K18 HL) · dasd sad asd asd asd asd sa das',0,'2026-04-08 19:57:07',NULL,NULL),(104,2,'MESSAGE','MESSAGE',92,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dasd sad asd asd asd asd sa das',1,'2026-04-08 19:58:38','2026-04-08 19:59:09',NULL),(105,4,'MESSAGE','MESSAGE',93,'Tin nhắn mới từ Do Thanh An (K18 HL) · sad  sad sad sad as dasdas das',0,'2026-04-08 20:04:28',NULL,NULL),(106,2,'MESSAGE','MESSAGE',94,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · sad  sad sad sad as dasdas das',1,'2026-04-08 20:05:03','2026-04-11 17:02:05',NULL),(107,4,'MESSAGE','MESSAGE',95,'Tin nhắn mới từ Do Thanh An (K18 HL) · sad  sad sad sad as dasdas das',0,'2026-04-08 20:05:06',NULL,NULL),(108,2,'MESSAGE','MESSAGE',96,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · sad  sad sad sad as dasdas das',1,'2026-04-08 20:05:18','2026-04-11 17:02:05',NULL),(109,4,'MESSAGE','MESSAGE',97,'Tin nhắn mới từ Do Thanh An (K18 HL) · sad  sad sad sad as dasdas das',0,'2026-04-08 20:05:28',NULL,NULL),(110,4,'SYSTEM','LISTING',13,'Do Thanh An (K18 HL) đề xuất giá 170000đ cho sản phẩm «das sa sad as» — mở chat để xem chi tiết.',0,'2026-04-11 14:31:38',NULL,NULL),(111,2,'DEAL','CONVERSATION',12,'Người bán đã chấp nhận mức giá bạn đề xuất cho «das sa sad as» — tiếp tục trao đổi trong chat.',1,'2026-04-11 14:32:05','2026-04-11 17:02:05',NULL),(112,4,'DEAL','CONVERSATION',12,'Do Thanh An (K18 HL) đã được bạn chấp nhận trả giá cho «das sa sad as» — mở chat để chốt giao dịch.',0,'2026-04-11 14:32:05',NULL,NULL),(113,2,'MESSAGE','MESSAGE',100,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · das sa sad as',1,'2026-04-11 14:34:15','2026-04-11 17:02:05',NULL),(114,4,'MESSAGE','MESSAGE',101,'Tin nhắn mới từ Do Thanh An (K18 HL) · das sa sad as',0,'2026-04-11 14:34:23',NULL,NULL),(115,4,'SYSTEM','LISTING',14,'Do Thanh An (K18 HL) đề xuất giá 170000đ cho sản phẩm «zzzzz» — mở chat để xem chi tiết.',0,'2026-04-11 14:42:29',NULL,NULL),(116,2,'DEAL','CONVERSATION',13,'Người bán đã chấp nhận mức giá bạn đề xuất cho «zzzzz» — tiếp tục trao đổi trong chat.',1,'2026-04-11 14:42:39','2026-04-11 17:02:05',NULL),(117,4,'DEAL','CONVERSATION',13,'Do Thanh An (K18 HL) đã được bạn chấp nhận trả giá cho «zzzzz» — mở chat để chốt giao dịch.',0,'2026-04-11 14:42:39',NULL,NULL),(118,2,'MESSAGE','MESSAGE',104,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · zzzzz',1,'2026-04-11 14:52:08','2026-04-11 17:02:05',NULL),(119,4,'MESSAGE','MESSAGE',105,'Tin nhắn mới từ Do Thanh An (K18 HL) · zzzzz',0,'2026-04-11 14:52:11',NULL,NULL),(120,4,'MESSAGE','MESSAGE',106,'Tin nhắn mới từ Do Thanh An (K18 HL) · zzzzz',0,'2026-04-11 14:52:17',NULL,NULL),(121,4,'SYSTEM','LISTING',15,'Do Thanh An (K18 HL) đề xuất giá 100000đ cho sản phẩm «dsad á sd sd» — mở chat để xem chi tiết.',0,'2026-04-11 15:02:37',NULL,NULL),(122,2,'SYSTEM','OFFER_REJECT',14,'Người bán đã từ chối mức giá 100000.00đ bạn đề xuất cho «dsad á sd sd» — có thể trao đổi thêm trong chat.',1,'2026-04-11 15:02:44','2026-04-11 17:02:05',NULL),(123,4,'SYSTEM','OFFER',14,'Do Thanh An (K18 HL) đề xuất giá 90000đ cho sản phẩm «dsad á sd sd» — mở chat để xem chi tiết.',0,'2026-04-11 15:02:48',NULL,NULL),(124,2,'DEAL','CONVERSATION',14,'Người bán đã chấp nhận mức giá bạn đề xuất cho «dsad á sd sd» — tiếp tục trao đổi trong chat.',1,'2026-04-11 15:02:49','2026-04-11 17:02:05',NULL),(125,4,'DEAL','CONVERSATION',14,'Do Thanh An (K18 HL) đã được bạn chấp nhận trả giá cho «dsad á sd sd» — mở chat để chốt giao dịch.',0,'2026-04-11 15:02:49',NULL,NULL),(126,2,'MESSAGE','MESSAGE',111,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dsad á sd sd',1,'2026-04-11 15:03:20','2026-04-11 17:02:05',NULL),(127,4,'MESSAGE','MESSAGE',112,'Tin nhắn mới từ Do Thanh An (K18 HL) · dsad á sd sd',0,'2026-04-11 15:03:22',NULL,NULL),(128,4,'SYSTEM','LISTING',16,'Do Thanh An (K18 HL) đề xuất giá 170000đ cho sản phẩm «sad ads sad ád á a á» — mở chat để xem chi tiết.',0,'2026-04-11 15:21:33',NULL,NULL),(129,2,'DEAL','CONVERSATION',15,'Người bán đã chấp nhận mức giá bạn đề xuất cho «sad ads sad ád á a á» — tiếp tục trao đổi trong chat.',1,'2026-04-11 15:21:59','2026-04-11 17:02:05',NULL),(130,4,'DEAL','CONVERSATION',15,'Do Thanh An (K18 HL) đã được bạn chấp nhận trả giá cho «sad ads sad ád á a á» — mở chat để chốt giao dịch.',0,'2026-04-11 15:21:59',NULL,NULL),(131,2,'MESSAGE','MESSAGE',115,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · sad ads sad ád á a á',1,'2026-04-11 15:25:55','2026-04-11 17:02:05',NULL),(132,4,'MESSAGE','MESSAGE',116,'Tin nhắn mới từ Do Thanh An (K18 HL) · sad ads sad ád á a á',0,'2026-04-11 15:38:23',NULL,NULL),(133,4,'SYSTEM','LISTING',17,'Do Thanh An (K18 HL) đề xuất giá 170000đ cho sản phẩm «112333» — mở chat để xem chi tiết.',0,'2026-04-11 15:49:34',NULL,NULL),(134,4,'MESSAGE','MESSAGE',118,'Tin nhắn mới từ Do Thanh An (K18 HL) · 112333',0,'2026-04-11 15:49:37',NULL,NULL),(135,2,'DEAL','CONVERSATION',16,'Người bán đã chấp nhận mức giá bạn đề xuất cho «112333» — tiếp tục trao đổi trong chat.',1,'2026-04-11 15:49:44','2026-04-11 17:02:05',NULL),(136,4,'DEAL','CONVERSATION',16,'Do Thanh An (K18 HL) đã được bạn chấp nhận trả giá cho «112333» — mở chat để chốt giao dịch.',0,'2026-04-11 15:49:44',NULL,NULL),(137,2,'MESSAGE','MESSAGE',120,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · 112333',1,'2026-04-11 15:51:14','2026-04-11 17:02:05',NULL),(138,4,'MESSAGE','MESSAGE',121,'Tin nhắn mới từ Do Thanh An (K18 HL) · 112333',0,'2026-04-11 15:51:28',NULL,NULL),(139,2,'MESSAGE','MESSAGE',122,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dá dsad ád ád ádasd ád ád a',1,'2026-04-11 16:18:56','2026-04-11 17:02:05',NULL),(140,2,'MESSAGE','MESSAGE',123,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dá dsad ád ád ádasd ád ád a',1,'2026-04-11 16:19:01','2026-04-11 17:02:05',NULL),(141,4,'MESSAGE','MESSAGE',124,'Tin nhắn mới từ Do Thanh An (K18 HL) · dá dsad ád ád ádasd ád ád a',0,'2026-04-11 16:19:22',NULL,NULL),(142,4,'MESSAGE','MESSAGE',125,'Tin nhắn mới từ Do Thanh An (K18 HL) · dá dsad ád ád ádasd ád ád a',0,'2026-04-11 16:19:51',NULL,NULL),(143,2,'MESSAGE','MESSAGE',126,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dá dsad ád ád ádasd ád ád a',1,'2026-04-11 16:19:57','2026-04-11 17:02:05',NULL),(144,4,'MESSAGE','MESSAGE',127,'Tin nhắn mới từ Do Thanh An (K18 HL) · ád áádasdas d ádas dâs sa',0,'2026-04-11 17:13:03',NULL,NULL),(145,2,'MESSAGE','MESSAGE',128,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · ád áádasdas d ádas dâs sa',0,'2026-04-11 17:13:19',NULL,NULL),(146,2,'MESSAGE','MESSAGE',129,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · ád áádasdas d ádas dâs sa',0,'2026-04-11 17:13:44',NULL,NULL),(147,4,'MESSAGE','MESSAGE',130,'Tin nhắn mới từ Do Thanh An (K18 HL) · ád áádasdas d ádas dâs sa',0,'2026-04-11 17:13:48',NULL,NULL),(148,2,'MESSAGE','MESSAGE',131,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dá dsad sd sd sd sd s sd ds',0,'2026-04-11 17:14:41',NULL,NULL),(149,2,'SYSTEM','OFFER',21,'Tran Thi Ngoc Anh (K18 HL) đề xuất giá 47180000đ cho sản phẩm «dá dsad sd sd sd sd s sd ds» — mở chat để xem chi tiết.',0,'2026-04-11 17:14:45',NULL,NULL),(150,4,'DEAL','CONVERSATION',21,'Người bán đã chấp nhận mức giá bạn đề xuất cho «dá dsad sd sd sd sd s sd ds» — tiếp tục trao đổi trong chat.',0,'2026-04-11 17:14:53',NULL,NULL),(151,2,'DEAL','CONVERSATION',21,'Tran Thi Ngoc Anh (K18 HL) đã được bạn chấp nhận trả giá cho «dá dsad sd sd sd sd s sd ds» — mở chat để chốt giao dịch.',0,'2026-04-11 17:14:53',NULL,NULL),(152,4,'MESSAGE','MESSAGE',134,'Tin nhắn mới từ Do Thanh An (K18 HL) · dá dsad sd sd sd sd s sd ds',0,'2026-04-11 17:15:03',NULL,NULL),(153,2,'MESSAGE','MESSAGE',135,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dá dsad sd sd sd sd s sd ds',0,'2026-04-11 17:15:07',NULL,NULL),(154,4,'MESSAGE','MESSAGE',136,'Tin nhắn mới từ Do Thanh An (K18 HL) · dá dsad sd sd sd sd s sd ds',0,'2026-04-11 17:15:14',NULL,NULL),(155,4,'MESSAGE','MESSAGE',137,'Tin nhắn mới từ Do Thanh An (K18 HL) · dá dsad sd sd sd sd s sd ds',0,'2026-04-11 17:15:15',NULL,NULL),(156,2,'MESSAGE','MESSAGE',138,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dá dsad sd sd sd sd s sd ds',0,'2026-04-11 17:15:25',NULL,NULL),(157,2,'MESSAGE','MESSAGE',139,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dđđasadasdas đâs đâs đá ád ádas dá',0,'2026-04-11 17:24:18',NULL,NULL),(158,2,'MESSAGE','MESSAGE',140,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dđđasadasdas đâs đâs đá ád ádas dá',0,'2026-04-11 17:24:21',NULL,NULL),(159,2,'SYSTEM','OFFER',22,'Tran Thi Ngoc Anh (K18 HL) đề xuất giá 47180000đ cho sản phẩm «dđđasadasdas đâs đâs đá ád ádas dá» — mở chat để xem chi tiết.',0,'2026-04-11 17:24:35',NULL,NULL),(160,4,'SYSTEM','OFFER_REJECT',22,'Người bán đã từ chối mức giá 47180000.00đ bạn đề xuất cho «dđđasadasdas đâs đâs đá ád ádas dá» — có thể trao đổi thêm trong chat.',0,'2026-04-11 17:24:37',NULL,NULL),(161,2,'SYSTEM','OFFER',22,'Tran Thi Ngoc Anh (K18 HL) đề xuất giá 52730000đ cho sản phẩm «dđđasadasdas đâs đâs đá ád ádas dá» — mở chat để xem chi tiết.',0,'2026-04-11 17:24:48',NULL,NULL),(162,4,'DEAL','CONVERSATION',22,'Người bán đã chấp nhận mức giá bạn đề xuất cho «dđđasadasdas đâs đâs đá ád ádas dá» — tiếp tục trao đổi trong chat.',0,'2026-04-11 17:24:50',NULL,NULL),(163,2,'DEAL','CONVERSATION',22,'Tran Thi Ngoc Anh (K18 HL) đã được bạn chấp nhận trả giá cho «dđđasadasdas đâs đâs đá ád ádas dá» — mở chat để chốt giao dịch.',0,'2026-04-11 17:24:50',NULL,NULL),(164,4,'MESSAGE','MESSAGE',145,'Tin nhắn mới từ Do Thanh An (K18 HL) · dđđasadasdas đâs đâs đá ád ádas dá',0,'2026-04-11 17:25:00',NULL,NULL),(165,2,'MESSAGE','MESSAGE',146,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dđđasadasdas đâs đâs đá ád ádas dá',0,'2026-04-11 17:25:05',NULL,NULL),(166,4,'MESSAGE','MESSAGE',147,'Tin nhắn mới từ Do Thanh An (K18 HL) · dđđasadasdas đâs đâs đá ád ádas dá',0,'2026-04-11 17:25:10',NULL,NULL),(167,2,'MESSAGE','MESSAGE',148,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · dđđasadasdas đâs đâs đá ád ádas dá',0,'2026-04-11 17:25:15',NULL,NULL),(168,2,'MESSAGE','MESSAGE',149,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · an 123',0,'2026-04-11 17:36:11',NULL,NULL),(169,4,'MESSAGE','MESSAGE',150,'Tin nhắn mới từ Do Thanh An (K18 HL) · an 123',0,'2026-04-11 17:36:29',NULL,NULL),(170,2,'MESSAGE','MESSAGE',151,'Tin nhắn mới từ Tran Thi Ngoc Anh (K18 HL) · an 123',0,'2026-04-11 17:36:33',NULL,NULL);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offers`
--

DROP TABLE IF EXISTS `offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offers` (
  `offer_id` bigint NOT NULL AUTO_INCREMENT,
  `listing_id` bigint NOT NULL,
  `buyer_id` bigint NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`offer_id`),
  KEY `listing_id` (`listing_id`),
  KEY `buyer_id` (`buyer_id`),
  CONSTRAINT `offers_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`),
  CONSTRAINT `offers_ibfk_2` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offers`
--

LOCK TABLES `offers` WRITE;
/*!40000 ALTER TABLE `offers` DISABLE KEYS */;
INSERT INTO `offers` VALUES (1,1,2,20000.00,'PENDING','2026-03-30 17:18:45','2026-03-30 17:18:45',NULL),(2,4,2,99000.00,'PENDING','2026-04-03 12:56:33','2026-04-03 12:56:33',NULL),(3,5,2,100000.00,'ACCEPTED','2026-04-03 14:42:53','2026-04-03 14:45:11',NULL),(4,7,2,0.00,'PENDING','2026-04-03 17:24:35','2026-04-03 17:24:35',NULL),(5,8,2,850000.00,'ACCEPTED','2026-04-03 17:29:35','2026-04-03 17:29:48',NULL),(6,8,2,850000.00,'ACCEPTED','2026-04-03 17:30:24','2026-04-03 17:30:33',NULL),(7,9,2,850000.00,'ACCEPTED','2026-04-03 18:37:27','2026-04-03 18:37:37',NULL),(8,10,2,0.00,'PENDING','2026-04-04 18:21:58','2026-04-04 18:21:58',NULL),(9,11,2,0.00,'PENDING','2026-04-08 19:51:37','2026-04-08 19:51:37',NULL),(10,12,2,0.00,'PENDING','2026-04-08 20:05:03','2026-04-08 20:05:03',NULL),(11,13,2,170000.00,'ACCEPTED','2026-04-11 14:31:38','2026-04-11 14:32:05',NULL),(12,14,2,170000.00,'ACCEPTED','2026-04-11 14:42:29','2026-04-11 14:42:39',NULL),(13,15,2,100000.00,'REJECTED','2026-04-11 15:02:37','2026-04-11 15:02:44',NULL),(14,15,2,90000.00,'ACCEPTED','2026-04-11 15:02:48','2026-04-11 15:02:49',NULL),(15,16,2,170000.00,'ACCEPTED','2026-04-11 15:21:33','2026-04-11 15:21:59',NULL),(16,17,2,170000.00,'ACCEPTED','2026-04-11 15:49:34','2026-04-11 15:49:44',NULL),(17,18,4,0.00,'PENDING','2026-04-11 16:19:50','2026-04-11 16:19:50',NULL),(18,19,2,90000.00,'PENDING','2026-04-11 17:07:12','2026-04-11 17:07:12',NULL),(19,20,2,40000.00,'PENDING','2026-04-11 17:07:51','2026-04-11 17:07:51',NULL),(20,21,2,0.00,'PENDING','2026-04-11 17:13:43','2026-04-11 17:13:43',NULL),(21,22,4,47180000.00,'ACCEPTED','2026-04-11 17:14:45','2026-04-11 17:14:53',NULL),(22,23,4,47180000.00,'REJECTED','2026-04-11 17:24:35','2026-04-11 17:24:37',NULL),(23,23,4,52730000.00,'ACCEPTED','2026-04-11 17:24:48','2026-04-11 17:24:50',NULL),(24,24,4,0.00,'PENDING','2026-04-11 17:36:29','2026-04-11 17:36:29',NULL);
/*!40000 ALTER TABLE `offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_images`
--

DROP TABLE IF EXISTS `report_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_images` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `report_id` bigint NOT NULL,
  `image_url` varchar(2000) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`image_id`),
  KEY `report_id` (`report_id`),
  CONSTRAINT `report_images_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `reports` (`report_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_images`
--

LOCK TABLES `report_images` WRITE;
/*!40000 ALTER TABLE `report_images` DISABLE KEYS */;
INSERT INTO `report_images` VALUES (1,1,'https://images.unsplash.com/photo-1557180295-76eee20ae8aa?q=80&w=800','2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(2,1,'https://images.unsplash.com/photo-1579389083046-e3df9c2b3325?q=80&w=800','2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(3,1,'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800','2026-03-29 17:05:13','2026-03-29 17:05:13',NULL);
/*!40000 ALTER TABLE `report_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `report_id` bigint NOT NULL AUTO_INCREMENT,
  `reporter_id` bigint NOT NULL,
  `target_type` enum('USER','LISTING','COMMENT','MESSAGE','COMMUNITY_POST','COMMUNITY_POST_COMMENT') NOT NULL,
  `target_id` bigint NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','RESOLVED','REJECTED') DEFAULT 'PENDING',
  `admin_note` text,
  `handled_by` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`report_id`),
  KEY `reporter_id` (`reporter_id`),
  KEY `handled_by` (`handled_by`),
  KEY `idx_reports_target` (`target_type`,`target_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`handled_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES (1,4,'USER',5,'Gui link lua dao trong chat','RESOLVED',NULL,NULL,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(2,2,'LISTING',2,'leu leu','RESOLVED',NULL,1,'2026-03-30 17:36:53','2026-04-06 15:22:25',NULL);
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_images`
--

DROP TABLE IF EXISTS `review_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_images` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `review_id` bigint NOT NULL,
  `image_url` varchar(2000) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`image_id`),
  KEY `review_id` (`review_id`),
  CONSTRAINT `review_images_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`review_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_images`
--

LOCK TABLES `review_images` WRITE;
/*!40000 ALTER TABLE `review_images` DISABLE KEYS */;
INSERT INTO `review_images` VALUES (1,1,'https://images.unsplash.com/photo-1627933604052-a058e0345204?q=80&w=800','2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(2,1,'https://images.unsplash.com/photo-1566417713040-083f24a03761?q=80&w=800','2026-03-29 17:05:13','2026-03-29 17:05:13',NULL),(3,1,'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800','2026-03-29 17:05:13','2026-03-29 17:05:13',NULL);
/*!40000 ALTER TABLE `review_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `review_id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint NOT NULL,
  `reviewer_id` bigint NOT NULL,
  `reviewee_id` bigint NOT NULL,
  `rating` tinyint NOT NULL,
  `comment` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`review_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `reviewer_id` (`reviewer_id`),
  KEY `reviewee_id` (`reviewee_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`),
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,1,4,2,5,'Nguoi ban nhiet tinh, sach dung nhu mo ta!','2026-03-29 17:05:13','2026-03-29 17:05:13',NULL);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_community_posts`
--

DROP TABLE IF EXISTS `saved_community_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_community_posts` (
  `user_id` bigint NOT NULL,
  `post_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`,`post_id`),
  KEY `idx_scp_post` (`post_id`),
  CONSTRAINT `fk_scp_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`post_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_scp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_community_posts`
--

LOCK TABLES `saved_community_posts` WRITE;
/*!40000 ALTER TABLE `saved_community_posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_community_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_listings`
--

DROP TABLE IF EXISTS `saved_listings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_listings` (
  `user_id` bigint NOT NULL,
  `listing_id` bigint NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`listing_id`),
  KEY `listing_id` (`listing_id`),
  CONSTRAINT `saved_listings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `saved_listings_ibfk_2` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_listings`
--

LOCK TABLES `saved_listings` WRITE;
/*!40000 ALTER TABLE `saved_listings` DISABLE KEYS */;
INSERT INTO `saved_listings` VALUES (2,2,'2026-03-30 17:37:06'),(2,10,'2026-04-04 18:17:22'),(4,2,'2026-03-29 17:05:13');
/*!40000 ALTER TABLE `saved_listings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `full_name` varchar(200) NOT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `phone_verified_at` datetime DEFAULT NULL,
  `avatar_url` varchar(1000) DEFAULT NULL,
  `cover_image_url` varchar(1000) DEFAULT NULL,
  `bio` text,
  `role` enum('ADMIN','USER') DEFAULT 'USER',
  `status` enum('ACTIVE','BANNED','RESTRICTED','DELETED') DEFAULT 'ACTIVE',
  `reputation_score` decimal(3,2) NOT NULL DEFAULT '0.00',
  `violation_count` int DEFAULT '0',
  `token_revision` bigint NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `welcome_email_sent_at` datetime(6) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@fpt.edu.vn','$2b$10$6Q2NcrgxvXMbUXOoRln/x.PMBTCZ1Tf.E.ID8Zqj8eWx0DCf2XqvG','Lai Thi Thanh Hoa',NULL,NULL,NULL,NULL,NULL,'ADMIN','ACTIVE',5.00,0,0,'2026-03-29 17:05:13','2026-03-29 17:05:15',NULL,NULL),(2,'andthe180695@fpt.edu.vn',NULL,'Do Thanh An (K18 HL)','0349544953','2026-04-03 13:40:09','https://lh3.googleusercontent.com/a/ACg8ocKyFajHyNTl5k8R37AeOFr6YBDUrRj2QRH_c8I7YtaNwqrw0x4=s96-c',NULL,'ds','USER','ACTIVE',4.80,0,3,'2026-03-29 17:05:13','2026-04-08 18:30:23','2026-04-08 18:30:23.359713',NULL),(3,'vietldhe180008@fpt.edu.vn',NULL,'Le Duc Viet',NULL,NULL,NULL,NULL,NULL,'USER','ACTIVE',4.50,0,0,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL,NULL),(4,'anhttnhe186474@fpt.edu.vn',NULL,'Tran Thi Ngoc Anh (K18 HL)',NULL,'2026-04-03 13:40:09','https://lh3.googleusercontent.com/a/ACg8ocI9zJSndKLHKsEc1bCv_G1tV1ostLp_5X4AGzJfwCfks46lGdo=s96-c',NULL,NULL,'USER','ACTIVE',4.90,0,0,'2026-03-29 17:05:13','2026-04-11 14:28:08','2026-04-11 14:28:08.137895',NULL),(5,'tuhahe173373@fpt.edu.vn',NULL,'Hoang Anh Tu',NULL,NULL,NULL,NULL,NULL,'USER','RESTRICTED',3.00,0,0,'2026-03-29 17:05:13','2026-03-29 17:05:13',NULL,NULL),(6,'andth sd sde180695@fpt.edu.vn',NULL,'Do Thanh An (K18 HL)',NULL,NULL,'https://lh3.googleusercontent.com/a/ACg8ocKyFajHyNTl5k8R37AeOFr6YBDUrRj2QRH_c8I7YtaNwqrw0x4=s96-c',NULL,NULL,'USER','ACTIVE',5.00,0,0,'2026-04-05 17:57:13','2026-04-08 17:21:37',NULL,NULL),(7,'anddsad ád á the180695@fpt.edu.vn',NULL,'Do Thanh An (K18 HL)',NULL,NULL,'https://lh3.googleusercontent.com/a/ACg8ocKyFajHyNTl5k8R37AeOFr6YBDUrRj2QRH_c8I7YtaNwqrw0x4=s96-c',NULL,NULL,'USER','ACTIVE',5.00,0,0,'2026-04-05 18:02:20','2026-04-05 18:06:13',NULL,NULL),(8,'andthedadasd 180695@fpt.edu.vn',NULL,'Do Thanh An (K18 HL)',NULL,NULL,'https://lh3.googleusercontent.com/a/ACg8ocKyFajHyNTl5k8R37AeOFr6YBDUrRj2QRH_c8I7YtaNwqrw0x4=s96-c',NULL,NULL,'USER','ACTIVE',5.00,0,0,'2026-04-05 18:06:22','2026-04-05 18:55:35',NULL,NULL),(9,'andtdsds he180695@fpt.edu.vn',NULL,'Do Thanh An (K18 HL)',NULL,NULL,'https://lh3.googleusercontent.com/a/ACg8ocKyFajHyNTl5k8R37AeOFr6YBDUrRj2QRH_c8I7YtaNwqrw0x4=s96-c',NULL,NULL,'USER','ACTIVE',5.00,0,0,'2026-04-05 18:55:53','2026-04-05 19:07:44','2026-04-05 18:55:56.043611',NULL),(10,'andtdsa dáhe180695@fpt.edu.vn',NULL,'Do Thanh An (K18 HL)',NULL,NULL,'https://lh3.googleusercontent.com/a/ACg8ocKyFajHyNTl5k8R37AeOFr6YBDUrRj2QRH_c8I7YtaNwqrw0x4=s96-c',NULL,NULL,'USER','ACTIVE',5.00,0,0,'2026-04-05 19:07:55','2026-04-05 19:10:22',NULL,NULL),(11,'andthe180695@fpt. sad edu.vn',NULL,'Do Thanh An (K18 HL)','+84967851513','2026-04-06 14:58:52','https://lh3.googleusercontent.com/a/ACg8ocKyFajHyNTl5k8R37AeOFr6YBDUrRj2QRH_c8I7YtaNwqrw0x4=s96-c',NULL,NULL,'USER','ACTIVE',5.00,0,0,'2026-04-05 19:10:48','2026-04-08 17:19:51','2026-04-05 19:10:50.673048',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'slife_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-12 14:36:30
