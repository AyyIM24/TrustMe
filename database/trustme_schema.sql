-- ==============================================================================
-- TrustMe AI — Production MySQL Database Schema
-- Database: trustme_db
-- Compatibility: MySQL 8.0+ / MySQL 9.0+ / MariaDB 10.4+
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `trustme_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `trustme_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Table: users
-- Core authentication table supporting standard JWT credentials and profile state
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(80) NOT NULL,
  `email` VARCHAR(120) NOT NULL,
  `password_hash` VARCHAR(256) NOT NULL,
  `role` ENUM('user', 'analyst', 'admin') DEFAULT 'user',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) DEFAULT 1,
  `avatar_url` VARCHAR(512) DEFAULT NULL,
  `last_login` DATETIME DEFAULT NULL,
  `google_id` VARCHAR(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `ix_users_username` (`username`),
  KEY `ix_users_email` (`email`),
  KEY `ix_users_google_id` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: user_faces
-- Biometric facial verification templates linked 1-to-1 with users
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `user_faces`;
CREATE TABLE `user_faces` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `face_data` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_faces_user_id` (`user_id`),
  CONSTRAINT `fk_user_faces_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: analyses
-- Historical health claim verification runs, veracity predictions, and metrics
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `analyses`;
CREATE TABLE `analyses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL,
  `input_text` MEDIUMTEXT NOT NULL,
  `title` VARCHAR(500) DEFAULT NULL,
  `source_url` VARCHAR(1000) DEFAULT NULL,
  `prediction` ENUM('fake', 'real') NOT NULL,
  `confidence` FLOAT NOT NULL,
  `credibility_score` INT DEFAULT NULL,
  `model_version` VARCHAR(20) DEFAULT 'v1',
  `word_count` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_analyses_user_id` (`user_id`),
  KEY `ix_analyses_prediction` (`prediction`),
  KEY `ix_analyses_created_at` (`created_at`),
  CONSTRAINT `fk_analyses_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: feedback
-- User feedback on veracity predictions for human-in-the-loop ML refinement
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `analysis_id` INT NOT NULL,
  `user_id` INT DEFAULT NULL,
  `is_correct` TINYINT(1) NOT NULL,
  `comment` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_feedback_analysis_id` (`analysis_id`),
  KEY `ix_feedback_user_id` (`user_id`),
  CONSTRAINT `fk_feedback_analysis_id` FOREIGN KEY (`analysis_id`)
    REFERENCES `analyses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: trending_topics
-- Aggregated veracity metrics across healthcare misinformation topics
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `trending_topics`;
CREATE TABLE `trending_topics` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `keyword` VARCHAR(200) NOT NULL,
  `fake_count` INT DEFAULT 0,
  `real_count` INT DEFAULT 0,
  `last_updated` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_trending_topics_keyword` (`keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: bulk_jobs
-- Asynchronous batch analysis processing tracking
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `bulk_jobs`;
CREATE TABLE `bulk_jobs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `status` ENUM('queued', 'processing', 'done', 'failed') DEFAULT 'queued',
  `total_items` INT DEFAULT NULL,
  `processed` INT DEFAULT 0,
  `result_path` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_bulk_jobs_user_id` (`user_id`),
  CONSTRAINT `fk_bulk_jobs_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- Initial Seed Data: Default Demo User & Trending Topics
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `is_active`)
VALUES (
  1,
  'demo_user',
  'demo@trustme.ai',
  '$2b$12$K1r6fQZ66Y5uKzH3x4nKSeJz9LzH3x4nKSeJz9LzH3x4nKSeJz9L2', -- Password123!
  'user',
  1
);

INSERT INTO `trending_topics` (`keyword`, `fake_count`, `real_count`) VALUES
  ('mRNA Vaccine Immunity', 12, 89),
  ('Miracle Fruit Cancer Cure', 64, 3),
  ('Colloidal Silver Detox', 41, 2),
  ('Intermittent Fasting & Longevity', 8, 52),
  ('Alkaline Water Health Benefits', 35, 9),
  ('Vitamin D & Respiratory Health', 14, 78)
ON DUPLICATE KEY UPDATE `last_updated` = CURRENT_TIMESTAMP;
