-- Refined migration to align course_enrollments with new enrollment modal design
-- Handle cases where columns might already exist

-- 1. Rename columns if they exist with old names
DROP PROCEDURE IF EXISTS RenameEnrollmentColumns;
DELIMITER //
CREATE PROCEDURE RenameEnrollmentColumns()
BEGIN
    -- Rename phone to phone_number if it exists
    IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = 'art_platform' AND table_name = 'course_enrollments' AND column_name = 'phone_number') THEN
        IF EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = 'art_platform' AND table_name = 'course_enrollments' AND column_name = 'phone') THEN
            ALTER TABLE course_enrollments RENAME COLUMN phone TO phone_number;
        END IF;
    END IF;

    -- Rename age_dob to dob_raw if we want to keep it or just drop it
    -- We already have a 'dob' DATE column. Let's drop 'age_dob' if it exists.
    IF EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = 'art_platform' AND table_name = 'course_enrollments' AND column_name = 'age_dob') THEN
        ALTER TABLE course_enrollments DROP COLUMN age_dob;
    END IF;

    -- Drop location if it exists
    IF EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = 'art_platform' AND table_name = 'course_enrollments' AND column_name = 'location') THEN
        ALTER TABLE course_enrollments DROP COLUMN location;
    END IF;

    -- Ensure 'age' exists
    IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = 'art_platform' AND table_name = 'course_enrollments' AND column_name = 'age') THEN
        ALTER TABLE course_enrollments ADD COLUMN age INT AFTER dob;
    END IF;

    -- Ensure 'country_code' exists (it does, but just in case)
    IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = 'art_platform' AND table_name = 'course_enrollments' AND column_name = 'country_code') THEN
        ALTER TABLE course_enrollments ADD COLUMN country_code VARCHAR(10) AFTER email;
    END IF;
END //
DELIMITER ;

CALL RenameEnrollmentColumns();
DROP PROCEDURE RenameEnrollmentColumns;

-- 2. Final tweaks to data types
ALTER TABLE course_enrollments
  MODIFY COLUMN phone_number VARCHAR(20),
  MODIFY COLUMN dob DATE,
  MODIFY COLUMN country VARCHAR(100),
  MODIFY COLUMN city VARCHAR(100),
  MODIFY COLUMN country_code VARCHAR(10);
