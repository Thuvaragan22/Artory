const db = require('../../config/db.js');
const emailService = require('../../services/emailService');

// ─── POST /api/courses — Create Course (Guide only) ───────────────────────────
exports.createCourse = async (req, res) => {
    try {
        const { title, description, price, level } = req.body;
        const guideId = req.user.id;

        let thumbnail_url = null;
        let methods_doc_url = null;

        if (req.files) {
            if (req.files.thumbnail) {
                thumbnail_url = req.files.thumbnail[0].path; // full Cloudinary URL
            }
            if (req.files.methods_doc) {
                methods_doc_url = req.files.methods_doc[0].path; // full Cloudinary URL
            }
        }

        if (!title) {
            return res.status(400).json({ message: "Title is required." });
        }

        const [result] = await db.query(
            `INSERT INTO courses (guide_id, title, description, price, level, thumbnail_url, methods_doc_url, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [guideId, title, description || null, price || 0, level || 'Beginner', thumbnail_url, methods_doc_url]
        );

        const [course] = await db.query("SELECT * FROM courses WHERE id = ?", [result.insertId]);

        res.status(201).json({ message: "Course created successfully.", course: course[0] });
    } catch (error) {
        console.error("Create course error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── GET /api/courses — Get all courses (Public) ──────────────────────────────
exports.getAllCourses = async (req, res) => {
    try {
        const [courses] = await db.query(
            `SELECT c.*, u.username AS guide_name, u.profile_image_url AS guide_profile_image_url,
                    (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id AND status = 'approved') as student_count
             FROM courses c
             JOIN users u ON u.id = c.guide_id
             ORDER BY c.created_at DESC`
        );
        res.status(200).json({ message: "List of courses.", total: courses.length, courses });
    } catch (error) {
        console.error("Get all courses error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── GET /api/courses/:id — Get course details (Public) ───────────────────────
exports.getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const [courses] = await db.query(
            `SELECT c.*, u.username AS guide_name, u.profile_image_url AS guide_profile_image_url,
                    (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id AND status = 'approved') as student_count
             FROM courses c
             JOIN users u ON u.id = c.guide_id
             WHERE c.id = ?`,
            [id]
        );

        if (courses.length === 0) {
            return res.status(404).json({ message: "Course not found." });
        }

        res.status(200).json({ message: "Course details.", course: courses[0] });
    } catch (error) {
        console.error("Get course by id error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── PUT /api/courses/:id — Update course (Guide owner only) ──────────────────
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, level } = req.body;
        const userId = req.user.id;

        const [existing] = await db.query("SELECT * FROM courses WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Course not found." });
        }

        if (String(existing[0].guide_id) !== String(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden. Not course owner." });
        }

        let thumbnail_url = existing[0].thumbnail_url;
        let methods_doc_url = existing[0].methods_doc_url;

        if (req.files) {
            if (req.files.thumbnail) {
                thumbnail_url = req.files.thumbnail[0].path; // Cloudinary URL
            }
            if (req.files.methods_doc) {
                methods_doc_url = req.files.methods_doc[0].path; // Cloudinary URL
            }
        }

        await db.query(
            `UPDATE courses SET title = ?, description = ?, price = ?, level = ?, thumbnail_url = ?, methods_doc_url = ?, updated_at = NOW()
             WHERE id = ?`,
            [title || existing[0].title, description || existing[0].description, price ?? existing[0].price, level || existing[0].level, thumbnail_url, methods_doc_url, id]
        );

        const [updated] = await db.query("SELECT * FROM courses WHERE id = ?", [id]);
        res.status(200).json({ message: "Course updated.", course: updated[0] });
    } catch (error) {
        console.error("Update course error:", error.message, error.code);
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── POST /api/courses/:id/enroll — Join a course (Learner only) ───────────────
exports.enrollCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const learnerId = req.user.id;

        // Check if course exists
        const [course] = await db.query("SELECT * FROM courses WHERE id = ?", [courseId]);
        if (course.length === 0) {
            return res.status(404).json({ message: "Course not found." });
        }

        // Check if already enrolled
        const [existing] = await db.query("SELECT * FROM course_enrollments WHERE course_id = ? AND learner_id = ?", [courseId, learnerId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Already enrolled or requested." });
        }

        const { full_name, email, country_code, phone_number, dob, age, gender, country, city } = req.body;

        await db.query(
            `INSERT INTO course_enrollments (course_id, learner_id, full_name, email, country_code, phone_number, dob, age, gender, country, city, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested', NOW(), NOW())`,
            [courseId, learnerId, full_name || null, email || null, country_code || null, phone_number || null, dob || null, age || null, gender || null, country || null, city || null]
        );

        // Send email notification to the guide (fire-and-forget)
        try {
            const [learnerRows] = await db.query("SELECT username, email FROM users WHERE id = ?", [learnerId]);
            const [guideRows] = await db.query("SELECT username, email FROM users WHERE id = ?", [course[0].guide_id]);
            if (learnerRows.length > 0 && guideRows.length > 0) {
                const learner = learnerRows[0];
                const guide = guideRows[0];
                const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                emailService.sendEnrollmentRequestEmail({
                    guideEmail: guide.email,
                    guideName: guide.username,
                    learnerName: learner.username,
                    learnerEmail: learner.email,
                    courseTitle: course[0].title,
                    dashboardLink: `${clientUrl}/guide/dashboard`,
                    details: { full_name, email, country_code, phone_number, dob, age, gender, country, city }
                }).catch(err => console.error('Guide email send failed:', err));
            }
        } catch (emailErr) {
            console.error('Email preparation error:', emailErr);
        }

        res.status(201).json({ message: "Enrollment request sent. Waiting for guide approval." });
    } catch (error) {
        console.error("Enroll course error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── GET /api/courses/enrollments — Get enrollments (Guide/Learner) ────────────
exports.getEnrollments = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let query = "";
        let params = [];

        if (role === 'guide') {
            query = `SELECT ce.*, c.title AS course_title, c.price AS course_price, u.username AS learner_name, u.email AS learner_user_email
                     FROM course_enrollments ce
                     JOIN courses c ON c.id = ce.course_id
                     JOIN users u ON u.id = ce.learner_id
                     WHERE c.guide_id = ?`;
            params = [userId];
        } else {
            query = `SELECT ce.*, c.title AS course_title, c.price AS course_price, u.username AS guide_name
                     FROM course_enrollments ce
                     JOIN courses c ON c.id = ce.course_id
                     JOIN users u ON u.id = c.guide_id
                     WHERE ce.learner_id = ?`;
            params = [userId];
        }

        const [enrollments] = await db.query(query, params);
        res.status(200).json({ message: "List of enrollments.", enrollments });
    } catch (error) {
        console.error("Get enrollments error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── PUT /api/courses/enrollments/:id — Approve/Reject Enrollment (Guide only) ──
exports.updateEnrollmentStatus = async (req, res) => {
    try {
        const enrollmentId = req.params.id;
        const { status } = req.body; // 'approved' or 'rejected'
        const userId = req.user.id;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        // Verify guide owns the course
        const [enrollment] = await db.query(
            `SELECT ce.*, c.guide_id FROM course_enrollments ce
             JOIN courses c ON c.id = ce.course_id
             WHERE ce.id = ?`,
            [enrollmentId]
        );

        if (enrollment.length === 0) {
            return res.status(404).json({ message: "Enrollment not found." });
        }

        if (enrollment[0].guide_id !== userId) {
            return res.status(403).json({ message: "Forbidden. Not course owner." });
        }

        await db.query(
            "UPDATE course_enrollments SET status = ?, updated_at = NOW() WHERE id = ?",
            [status, enrollmentId]
        );

        // Send approval email to the learner (fire-and-forget)
        if (status === 'approved') {
            try {
                const [learnerRows] = await db.query("SELECT username, email FROM users WHERE id = ?", [enrollment[0].learner_id]);
                const [guideRows] = await db.query("SELECT username FROM users WHERE id = ?", [userId]);
                const [courseRows] = await db.query("SELECT title FROM courses WHERE id = ?", [enrollment[0].course_id]);
                if (learnerRows.length > 0 && courseRows.length > 0) {
                    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                    emailService.sendEnrollmentApprovalEmail({
                        learnerEmail: learnerRows[0].email,
                        learnerName: learnerRows[0].username,
                        courseTitle: courseRows[0].title,
                        guideName: guideRows[0]?.username || 'your guide',
                        dashboardLink: `${clientUrl}/learner/dashboard`,
                    }).catch(err => console.error('Learner approval email send failed:', err));
                }
            } catch (emailErr) {
                console.error('Approval email preparation error:', emailErr);
            }
        }

        res.status(200).json({ message: `Enrollment ${status}.` });
    } catch (error) {
        console.error("Update enrollment status error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── DELETE /api/courses/:id — Delete course (Guide owner / Admin) ─────────────
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [existing] = await db.query("SELECT * FROM courses WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Course not found." });
        }

        if (String(existing[0].guide_id) !== String(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden. Not course owner." });
        }

        // Null out orders referencing this course (belt-and-suspenders for FK)
        await db.query("UPDATE orders SET course_id = NULL WHERE course_id = ?", [id]);
        // course_enrollments cascade automatically
        await db.query("DELETE FROM courses WHERE id = ?", [id]);

        res.status(200).json({ message: "Course deleted successfully." });
    } catch (error) {
        console.error("Delete course error:", error.message, error.code);
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};
