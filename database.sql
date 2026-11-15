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

INSERT INTO `categories` (`id`, `label`, `plural`, `type`, `description`) VALUES
('artwork', 'Artwork', 'Artworks', 'image', 'Paintings and drawings'),
('artcraft', 'Artcraft', 'Artcrafts', 'image', 'Handmade crafts'),
('photography', 'Photography', 'Photography', 'image', 'Photographs'),
('poem', 'Poem', 'Poems', 'text', 'Poems and verse')
ON DUPLICATE KEY UPDATE `label`=VALUES(`label`);

INSERT INTO `users` (`id`, `full_name`, `username`, `email`, `faculty`, `batch`, `password_hash`, `role`, `status`, `bio`, `created_at`, `last_active_at`) VALUES
('u_admin', 'Scriptorium Admin', 'admin', 'admin@scriptorium.lk', 'Faculty of IT / Computing', '2022', '$2y$10$E/9qvAeODWF4xacEjGrLBeVpuMaapw1luFQOx4dHY8D/PTNVpS/xW', 'admin', 'active', 'Site administrator.', 1762580000000, 1762584000000)
ON DUPLICATE KEY UPDATE `email`=VALUES(`email`);

INSERT INTO `users` (`id`, `full_name`, `username`, `email`, `faculty`, `batch`, `password_hash`, `role`, `status`, `suspended_until`, `bio`, `created_at`, `last_active_at`) VALUES
('seed-nethmi', 'Nethmi Silva', 'nethmi_silva', 'nethmi@example.com', 'Faculty of Fine Arts & Design', '2024', '$2y$10$E/9qvAeODWF4xacEjGrLBeVpuMaapw1luFQOx4dHY8D/PTNVpS/xW', 'member', 'active', NULL, 'Painter & digital artist.', 1757580000000, 1762580000000),
('seed-kavindu', 'Kavindu Fernando', 'kavindu_f', 'kavindu@example.com', 'Faculty of Arts', '2023', '$2y$10$E/9qvAeODWF4xacEjGrLBeVpuMaapw1luFQOx4dHY8D/PTNVpS/xW', 'member', 'active', NULL, 'Poet & literature student.', 1758180000000, 1762530000000),
('seed-ishara', 'Ishara Jayasuriya', 'ishara_j', 'ishara@example.com', 'Faculty of Humanities & Social Sciences', '2024', '$2y$10$E/9qvAeODWF4xacEjGrLBeVpuMaapw1luFQOx4dHY8D/PTNVpS/xW', 'member', 'active', NULL, 'Sculpture and paper crafts.', 1758780000000, 1762470000000),
('seed-dilan', 'Dilan Perera', 'dilan_p', 'dilan@example.com', 'Faculty of IT / Computing', '2022', '$2y$10$E/9qvAeODWF4xacEjGrLBeVpuMaapw1luFQOx4dHY8D/PTNVpS/xW', 'member', 'active', NULL, 'Street and urban photographer.', 1759380000000, 1762310000000),
('seed-sanduni', 'Sanduni Wickrama', 'sanduni_w', 'sanduni@example.com', 'Faculty of Fine Arts & Design', '2025', '$2y$10$E/9qvAeODWF4xacEjGrLBeVpuMaapw1luFQOx4dHY8D/PTNVpS/xW', 'member', 'active', NULL, 'Traditional watercolorist.', 1760080000000, 1762560000000),
('seed-ayesha', 'Ayesha Khan', 'ayesha_k', 'ayesha@example.com', 'Faculty of Management & Commerce', '2024', '$2y$10$E/9qvAeODWF4xacEjGrLBeVpuMaapw1luFQOx4dHY8D/PTNVpS/xW', 'member', 'suspended', 1762840000000, 'Student artist.', 1760770000000, 1762150000000),
('seed-chamath', 'Chamath Rajapaksa', 'chamath_r', 'chamath@example.com', 'Faculty of Engineering', '2023', '$2y$10$E/9qvAeODWF4xacEjGrLBeVpuMaapw1luFQOx4dHY8D/PTNVpS/xW', 'member', 'banned', NULL, 'Past contributor.', 1761290000000, 1761140000000)
ON DUPLICATE KEY UPDATE `email`=VALUES(`email`);

INSERT INTO `posts` (`id`, `author_id`, `author_name`, `category`, `title`, `description`, `text`, `image`, `created_at`, `status`, `featured`) VALUES
('p_seed_art1', 'seed-nethmi', 'nethmi_silva', 'artwork', 'Blue Blossom', 'A sample artwork from the Scriptorium community.', '', 'images/gallery/art1.jpg', 1762493600000, 'approved', 1),
('p_seed_art2', 'seed-kavindu', 'kavindu_f', 'artwork', 'The Dancer', 'A sample artwork from the Scriptorium community.', '', 'images/gallery/art2.jpg', 1762381200000, 'approved', 1),
('p_seed_art3', 'seed-ishara', 'ishara_j', 'artwork', 'Garden Wanderer', 'A sample artwork from the Scriptorium community.', '', 'images/gallery/art3.jpg', 1762268800000, 'approved', 1),
('p_seed_art4', 'seed-dilan', 'dilan_p', 'artwork', 'Lighthouse Swirl', 'A sample artwork from the Scriptorium community.', '', 'images/gallery/art4.jpg', 1762156400000, 'approved', 1),
('p_seed_art5', 'seed-sanduni', 'sanduni_w', 'artwork', 'Skeleton Bouquet', 'A sample artwork from the Scriptorium community.', '', 'images/gallery/art5.jpg', 1762044000000, 'approved', 1),
('p_seed_art6', 'seed-nethmi', 'nethmi_silva', 'artwork', 'Eiffel at Night', 'A sample artwork from the Scriptorium community.', '', 'images/gallery/art6.jpg', 1761931600000, 'approved', 1),
('p_seed_art7', 'seed-kavindu', 'kavindu_f', 'artwork', 'Self-Portrait with Violinist', 'A sample artwork from the Scriptorium community.', '', 'images/gallery/art7.jpg', 1761819200000, 'approved', 1),
('p_seed_art8', 'seed-ishara', 'ishara_j', 'artwork', 'Mona Lisa, Reimagined', 'A sample artwork from the Scriptorium community.', '', 'images/gallery/art8.jpg', 1761706800000, 'approved', 1),
('p_seed_art9', 'seed-dilan', 'dilan_p', 'artwork', 'Shadows Below', 'A sample artwork from the Scriptorium community.', '', 'images/gallery/art9.jpg', 1761594400000, 'approved', 1),
('p_seed_art10', 'seed-sanduni', 'sanduni_w', 'artwork', 'Koi Pond', 'A sample artwork from the Scriptorium community.', '', 'images/gallery/art10.jpg', 1761482000000, 'approved', 1),
('p_seed_art11', 'seed-nethmi', 'nethmi_silva', 'artwork', 'Painted Earth', 'A sample artwork from the Scriptorium community.', '', 'images/gallery/art11.jpg', 1761369600000, 'approved', 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

INSERT INTO `posts` (`id`, `author_id`, `author_name`, `category`, `title`, `description`, `text`, `image`, `created_at`, `status`, `featured`) VALUES
('p_seed_poem1', 'seed-ishara', 'ishara_j', 'poem', 'Monsoon Window', '', 'The rain writes slow letters on the glass,\nand I read each one aloud —\nsmall rivers learning how to leave.', '', 1762536800000, 'approved', 0),
('p_seed_poem2', 'seed-dilan', 'dilan_p', 'poem', 'Ink', '', 'I borrowed the night to write with,\nbut the morning kept asking\nfor its colours back.', '', 1762364000000, 'approved', 0),
('p_seed_poem3', 'seed-sanduni', 'sanduni_w', 'poem', 'Home Is a Verb', '', 'Not the roof, not the road —\nthe way your name sounds\nwhen someone calls it kindly.', '', 1762191200000, 'approved', 0),
('p_seed_poem4', 'seed-nethmi', 'nethmi_silva', 'poem', 'Brushstroke', '', 'One line, and the blank page\nstops being afraid of itself.', '', 1762018400000, 'approved', 0)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

INSERT INTO `posts` (`id`, `author_id`, `author_name`, `category`, `title`, `description`, `text`, `image`, `created_at`, `status`, `featured`) VALUES
('p_seed_pend1', 'seed-kavindu', 'kavindu_f', 'poem', 'Rain on Tin Roofs', '', 'Every drop knocks twice —\nonce on the roof, once on memory.', '', 1762562000000, 'pending', 0),
('p_seed_pend2', 'seed-sanduni', 'sanduni_w', 'poem', 'Sunday Market', '', 'Mangoes stacked like small suns,\nthe vendor counts change in a song.', '', 1762544000000, 'pending', 0)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

INSERT INTO `events` (`id`, `kind`, `title`, `venue`, `date`, `description`, `register_by`, `created_at`) VALUES
('e1', 'Exhibition', 'Scriptorium Annual Art Exhibition', 'University Main Hall', 1764394400000, 'Our yearly showcase of student paintings, crafts and photography. Selected pieces will be displayed and open to the public.', 1763789600000, 1762580000000),
('e2', 'Event', 'Open Mic Poetry Evening', 'Library Auditorium', 1763357600000, 'Read your own poems or just come to listen. Sign up for a 5-minute slot.', 1763184800000, 1762580000000),
('e3', 'Event', 'Photography Walk – Old Town', 'Meet at the main gate', 1763098400000, 'A guided golden-hour walk with tips on composition. Bring any camera, phones are welcome.', 1762925600000, 1762580000000),
('e4', 'Event', 'Artcraft Workshop: Paper & Clay', 'Fine Arts Studio 2', 1765172000000, 'A hands-on workshop for beginners. Materials are provided. Limited seats.', 1764653600000, 1762580000000),
('n1', 'Notice', 'Submissions open for the E-Chapbook', 'Online', 1762752800000, 'Share your poems and short prose through Create Post. Selected work will be featured in the next digital chapbook.', NULL, 1762580000000)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

