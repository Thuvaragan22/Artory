-- Migration to align course_enrollments with new enrollment modal design

ALTER TABLE course_enrollments
  ADD COLUMN country_code VARCHAR(10) AFTER email,
  RENAME COLUMN phone TO phone_number,
  RENAME COLUMN age_dob TO dob,
  ADD COLUMN age INT AFTER dob,
  DROP COLUMN location;

-- Ensure phone_number and dob have enough space and correct types if needed
ALTER TABLE course_enrollments
  MODIFY COLUMN phone_number VARCHAR(20),
  MODIFY COLUMN dob VARCHAR(20),
  MODIFY COLUMN country VARCHAR(100),
  MODIFY COLUMN city VARCHAR(100);
