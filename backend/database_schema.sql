-- Artory Platform Consolidated Database Schema
-- Last Updated: 2026-04-05

CREATE DATABASE IF NOT EXISTS art_platform;
USE art_platform;

-- 1. Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        ENUM('Free', 'Trial', 'Premium') NOT NULL,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  features    TEXT          NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO subscription_plans (id, name, price, features) VALUES
(1, 'Free', 0.00, 'Basic access, limited uploads'),
(2, 'Trial', 0.00, 'One-month full access trial'),
(3, 'Premium', 29.99, 'Unlimited access and monetization');

-- 2. Users Table (Auth and Roles)
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password      VARCHAR(255)  NULL,
  role          ENUM('admin','learner','guide') NOT NULL DEFAULT 'learner',
  google_id     VARCHAR(255)  NULL UNIQUE,
  is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
  refresh_token TEXT          NULL,
  reset_token   VARCHAR(255)  NULL,
  reset_token_expires DATETIME NULL,
  subscription_plan_id INT DEFAULT 1,
  subscription_expires_at DATETIME NULL,
  profile_image_url VARCHAR(500) NULL,
  bio           TEXT          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_subscription FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- 3. Artworks Table (Created by Guides)
CREATE TABLE IF NOT EXISTS artworks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  guide_id    INT           NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NULL,
  detailed_content TEXT      NULL,
  image_url   VARCHAR(500)  NOT NULL,
  medium      VARCHAR(100)  NULL,
  category    VARCHAR(100)  NULL,
  tags        VARCHAR(255)  NULL,
  is_for_sale BOOLEAN       NOT NULL DEFAULT FALSE,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_artwork_guide FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_artworks_guide_id ON artworks(guide_id);

-- 4. Practice Works Table (Uploaded by Learners)
CREATE TABLE IF NOT EXISTS practice_works (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  learner_id  INT           NOT NULL,
  guide_id    INT           NULL,
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NULL,
  image_url   VARCHAR(500)  NOT NULL,
  medium      VARCHAR(100)  NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_practice_learner FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_practice_guide FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_practice_learner_id ON practice_works(learner_id);

-- 5. Courses Table (Workshops by Guides)
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

-- 6. Course Enrollments Table (Detailed Applicant Profile)
CREATE TABLE IF NOT EXISTS course_enrollments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  course_id     INT           NOT NULL,
  learner_id    INT           NOT NULL,
  full_name     VARCHAR(255)  NULL, -- Custom name for application
  email         VARCHAR(255)  NULL, -- Contact email
  country_code  VARCHAR(10)   NULL,
  phone_number  VARCHAR(20)   NULL,
  dob           DATE          NULL, -- Date of Birth
  age           INT           NULL,
  gender        VARCHAR(50)   NULL,
  country       VARCHAR(100)  NULL,
  city          VARCHAR(100)  NULL,
  status        ENUM('requested', 'approved', 'rejected') NOT NULL DEFAULT 'requested',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_learner FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_enroll_course_id ON course_enrollments(course_id);
CREATE INDEX idx_enroll_learner_id ON course_enrollments(learner_id);

-- 7. Orders Table (Transactions)
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

-- 8. Payments Table
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

-- 9. Social: Likes & Comments
CREATE TABLE IF NOT EXISTS likes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  artwork_id  INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_like_artwork FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (user_id, artwork_id)
);

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

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  type        VARCHAR(50) NOT NULL, -- e.g., 'enroll_request', 'like', 'comment'
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  link        VARCHAR(255) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
