-- ============================================================
-- Artory Database Migration V2
-- Adds Subscriptions, Likes, Comments, and Notifications
-- ============================================================

-- 1. Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        ENUM('Free', 'Trial', 'Premium') NOT NULL,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  features    TEXT          NULL, -- JSON string or description
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Plans
INSERT IGNORE INTO subscription_plans (id, name, price, features) VALUES
(1, 'Free', 0.00, 'Basic access, limited uploads'),
(2, 'Trial', 0.00, 'One-month full access trial'),
(3, 'Premium', 29.99, 'Unlimited access and monetization');

-- 2. Update Users table for Subscriptions
-- First check if they exist to avoid errors in repeated runs
SET @col1 = (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_plan_id');
SET @sql1 = IF(@col1 = 0, 'ALTER TABLE users ADD COLUMN subscription_plan_id INT DEFAULT 1 AFTER role', 'SELECT "Column subscription_plan_id already exists"');
PREPARE stmt1 FROM @sql1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

SET @col2 = (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_expires_at');
SET @sql2 = IF(@col2 = 0, 'ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME NULL AFTER subscription_plan_id', 'SELECT "Column subscription_expires_at already exists"');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- Safely add FK if not exists
SET @fk = (SELECT COUNT(*) FROM information_schema.key_column_usage WHERE table_name = 'users' AND constraint_name = 'fk_user_subscription');
SET @sqlfk = IF(@fk = 0, 'ALTER TABLE users ADD CONSTRAINT fk_user_subscription FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL', 'SELECT "FK already exists"');
PREPARE stmtfk FROM @sqlfk; EXECUTE stmtfk; DEALLOCATE PREPARE stmtfk;

-- 3. Social: Likes
CREATE TABLE IF NOT EXISTS likes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  artwork_id  INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_like_artwork FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (user_id, artwork_id)
);

-- 4. Social: Comments
CREATE TABLE IF NOT EXISTS comments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  artwork_id  INT NOT NULL,
  content     TEXT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_artwork FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- 5. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  type        VARCHAR(50) NOT NULL, -- 'enroll_request', 'enroll_approved', 'like', 'comment'
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  link        VARCHAR(255) NULL, -- URL to redirect when clicked
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Enhance Practice Works (link to guide)
SET @col3 = (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'practice_works' AND column_name = 'guide_id');
SET @sql3 = IF(@col3 = 0, 'ALTER TABLE practice_works ADD COLUMN guide_id INT NULL AFTER learner_id', 'SELECT "Column guide_id already exists"');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

SET @col4 = (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'practice_works' AND column_name = 'medium');
SET @sql4 = IF(@col4 = 0, 'ALTER TABLE practice_works ADD COLUMN medium VARCHAR(100) NULL AFTER image_url', 'SELECT "Column medium already exists"');
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

SET @fk2 = (SELECT COUNT(*) FROM information_schema.key_column_usage WHERE table_name = 'practice_works' AND constraint_name = 'fk_practice_guide');
SET @sqlfk2 = IF(@fk2 = 0, 'ALTER TABLE practice_works ADD CONSTRAINT fk_practice_guide FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE SET NULL', 'SELECT "FK already exists"');
PREPARE stmtfk2 FROM @sqlfk2; EXECUTE stmtfk2; DEALLOCATE PREPARE stmtfk2;

-- 7. Enhance Artworks (more metadata)
SET @col5 = (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'artworks' AND column_name = 'medium');
SET @sql5 = IF(@col5 = 0, 'ALTER TABLE artworks ADD COLUMN medium VARCHAR(100) NULL AFTER image_url', 'SELECT "Column medium already exists"');
PREPARE stmt5 FROM @sql5; EXECUTE stmt5; DEALLOCATE PREPARE stmt5;

SET @col6 = (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'artworks' AND column_name = 'detailed_content');
SET @sql6 = IF(@col6 = 0, 'ALTER TABLE artworks ADD COLUMN detailed_content TEXT NULL AFTER description', 'SELECT "Column detailed_content already exists"');
PREPARE stmt6 FROM @sql6; EXECUTE stmt6; DEALLOCATE PREPARE stmt6;

SET @col7 = (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'artworks' AND column_name = 'tags');
SET @sql7 = IF(@col7 = 0, 'ALTER TABLE artworks ADD COLUMN tags VARCHAR(255) NULL AFTER category', 'SELECT "Column tags already exists"');
PREPARE stmt7 FROM @sql7; EXECUTE stmt7; DEALLOCATE PREPARE stmt7;
