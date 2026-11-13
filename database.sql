CREATE DATABASE IF NOT EXISTS `scriptorium` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `scriptorium`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `username` VARCHAR(60) NOT NULL UNIQUE,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `faculty` VARCHAR(120) NOT NULL DEFAULT '',
  `batch` VARCHAR(20) NOT NULL DEFAULT '',
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('member', 'admin') NOT NULL DEFAULT 'member',
  `status` ENUM('active', 'suspended', 'banned') NOT NULL DEFAULT 'active',
  `suspended_until` BIGINT NULL DEFAULT NULL,
  `bio` VARCHAR(300) NOT NULL DEFAULT '',
  `avatar` LONGTEXT NULL DEFAULT NULL,
  `created_at` BIGINT NOT NULL,
  `last_active_at` BIGINT NOT NULL,
  INDEX `idx_role` (`role`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `label` VARCHAR(100) NOT NULL,
  `plural` VARCHAR(100) NOT NULL,
  `type` ENUM('image', 'text') NOT NULL DEFAULT 'image',
  `description` VARCHAR(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `posts` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `author_id` VARCHAR(64) NOT NULL,
  `author_name` VARCHAR(60) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `text` MEDIUMTEXT NULL,
  `image` VARCHAR(255) NULL,
  `created_at` BIGINT NOT NULL,
  `status` ENUM('pending', 'approved', 'disapproved') NOT NULL DEFAULT 'pending',
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `review_note` TEXT NULL,
  `reviewed_at` BIGINT NULL DEFAULT NULL,
  `reviewed_by` VARCHAR(64) NULL DEFAULT NULL,
  INDEX `idx_status` (`status`),
  INDEX `idx_category` (`category`),
  INDEX `idx_author` (`author_id`),
  INDEX `idx_created` (`created_at`),
  CONSTRAINT `fk_posts_category` FOREIGN KEY (`category`) REFERENCES `categories` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `events` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `kind` ENUM('Exhibition', 'Event', 'Notice') NOT NULL DEFAULT 'Event',
  `title` VARCHAR(200) NOT NULL,
  `venue` VARCHAR(200) NOT NULL,
  `date` BIGINT NOT NULL,
  `description` TEXT NOT NULL,
  `register_by` BIGINT NULL DEFAULT NULL,
  `created_at` BIGINT NOT NULL,
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_registrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `created_at` BIGINT NOT NULL,
  UNIQUE KEY `uk_event_user` (`event_id`, `user_id`),
  CONSTRAINT `fk_reg_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reg_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `post_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `created_at` BIGINT NOT NULL,
  UNIQUE KEY `uk_post_user` (`post_id`, `user_id`),
  CONSTRAINT `fk_likes_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comments` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `post_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `text` VARCHAR(300) NOT NULL,
  `created_at` BIGINT NOT NULL,
  INDEX `idx_post_comments` (`post_id`),
  CONSTRAINT `fk_comments_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `follows` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `follower_id` VARCHAR(64) NOT NULL,
  `followee_id` VARCHAR(64) NOT NULL,
  `created_at` BIGINT NOT NULL,
  UNIQUE KEY `uk_follower_followee` (`follower_id`, `followee_id`),
  CONSTRAINT `fk_follows_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_follows_followee` FOREIGN KEY (`followee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `type` ENUM('approved', 'disapproved', 'info') NOT NULL DEFAULT 'info',
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `post_id` VARCHAR(64) NULL DEFAULT NULL,
  `created_at` BIGINT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  INDEX `idx_user_notes` (`user_id`),
  CONSTRAINT `fk_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `log_date` DATE NOT NULL PRIMARY KEY,
  `view_count` INT NOT NULL DEFAULT 0,
  `login_count` INT NOT NULL DEFAULT 0,
  `post_count` INT NOT NULL DEFAULT 0,
  `register_count` INT NOT NULL DEFAULT 0,
  `signup_count` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
