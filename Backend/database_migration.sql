-- ============================================================
-- Art Platform Database Migration
-- Run this SQL to update your existing schema
-- ============================================================

-- Create users table (or alter existing)
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password      VARCHAR(255)  NULL,           -- NULL for Google-only accounts
  role          ENUM('admin','learner','guide') NOT NULL DEFAULT 'learner',
  google_id     VARCHAR(255)  NULL UNIQUE,    -- For Google OAuth
  is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
  refresh_token TEXT          NULL,           -- Stored refresh token
  reset_token   VARCHAR(255)  NULL,           -- Hashed reset token
  reset_token_expires DATETIME NULL,          -- Reset token expiry
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- If you already have the users table, run these ALTER statements instead:
-- ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER role;
-- ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER google_id;
-- ALTER TABLE users ADD COLUMN refresh_token TEXT NULL AFTER is_verified;
-- ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL AFTER refresh_token;
-- ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL AFTER reset_token;
-- ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;

-- Index for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_reset_token ON users(reset_token);
CREATE INDEX idx_users_google_id ON users(google_id);

-- ============================================================
-- Artworks table (created by Guides)
-- ============================================================
CREATE TABLE IF NOT EXISTS artworks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  guide_id    INT           NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NULL,
  image_url   VARCHAR(500)  NOT NULL,
  category    VARCHAR(100)  NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_artwork_guide FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_artworks_guide_id ON artworks(guide_id);

-- ============================================================
-- Practice works table (uploaded by Learners)
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_works (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  learner_id  INT           NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NULL,
  image_url   VARCHAR(500)  NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_practice_learner FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_practice_learner_id ON practice_works(learner_id);

-- ============================================================
-- Sample admin user (password: Admin@1234)
-- ============================================================
-- INSERT INTO users (username, email, password, role, is_verified)
-- VALUES ('Admin', 'admin@artplatform.com', '$2a$12$...hashedpassword...', 'admin', true);
