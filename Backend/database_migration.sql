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
  is_for_sale BOOLEAN       NOT NULL DEFAULT FALSE,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
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
-- Courses table
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  guide_id      INT           NOT NULL,
  title         VARCHAR(255)  NOT NULL,
  description   TEXT          NULL,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  level         ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
  thumbnail_url VARCHAR(500)  NULL,
  methods_doc_url VARCHAR(500) NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_course_guide FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_courses_guide_id ON courses(guide_id);

-- ============================================================
-- Orders table (for artwork or course)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  learner_id    INT           NOT NULL,
  artwork_id    INT           NULL,
  course_id     INT           NULL,
  status        ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  amount        DECIMAL(10,2) NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_learner FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_artwork FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE SET NULL,
  CONSTRAINT fk_order_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

CREATE INDEX idx_orders_learner_id ON orders(learner_id);

-- ============================================================
-- Payments table
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT           NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(100)  NULL,
  status        ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(255)  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_order_id ON payments(order_id);

-- ============================================================
-- Course Enrollments/Requests
-- ============================================================
CREATE TABLE IF NOT EXISTS course_enrollments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  course_id     INT           NOT NULL,
  learner_id    INT           NOT NULL,
  status        ENUM('requested', 'approved', 'rejected') NOT NULL DEFAULT 'requested',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_learner FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_enroll_course_id ON course_enrollments(course_id);
CREATE INDEX idx_enroll_learner_id ON course_enrollments(learner_id);
