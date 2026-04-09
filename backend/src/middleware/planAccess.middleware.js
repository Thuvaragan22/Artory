const db = require("../config/db");
const { getPlanLimits } = require("../services/plan.service");

/**
 * Check if a user is grandfathered (existing user before plan system was introduced).
 * Grandfathered users have unlimited access to all features.
 */
async function isGrandfathered(userId) {
    try {
        const [rows] = await db.query(
            `SELECT is_grandfathered FROM users WHERE id = ? LIMIT 1`,
            [userId]
        );
        return rows[0]?.is_grandfathered === 1;
    } catch (_) {
        return false;
    }
}

/**
 * Helper: fetch user's current plan_type from DB.
 * Falls back to 'free' if migration columns don't exist yet.
 */
async function getUserPlanType(userId) {
    try {
        const [rows] = await db.query(
            `SELECT plan_type FROM users WHERE id = ? LIMIT 1`,
            [userId]
        );
        return (rows[0]?.plan_type || "free").toLowerCase();
    } catch (_) {
        return "free";
    }
}

/**
 * Guard: guide must have trial or premium to sell artworks.
 * Grandfathered users bypass this check.
 */
exports.canSellArtwork = async (req, res, next) => {
    try {
        if (await isGrandfathered(req.user.id)) return next();

        const planType = await getUserPlanType(req.user.id);
        const limits = getPlanLimits(req.user.role, planType);

        if (!limits?.canSellArtworks) {
            return res.status(403).json({
                success: false,
                message: "Selling artworks requires a Trial or Premium plan. Please upgrade.",
            });
        }
        next();
    } catch (error) {
        console.error("canSellArtwork error:", error);
        return res.status(500).json({ success: false, message: "Plan validation failed" });
    }
};

/**
 * Guard: guide must be within course creation limit.
 * Grandfathered users bypass this check (unlimited).
 */
exports.canCreateCourse = async (req, res, next) => {
    try {
        if (await isGrandfathered(req.user.id)) return next();

        const planType = await getUserPlanType(req.user.id);
        const limits = getPlanLimits(req.user.role, planType);

        if (limits.maxCourseCreations === -1) return next();

        const [rows] = await db.query(
            `SELECT COUNT(*) AS total FROM courses WHERE guide_id = ?`,
            [req.user.id]
        );

        if (rows[0].total >= limits.maxCourseCreations) {
            return res.status(403).json({
                success: false,
                message: `You have reached your course limit (${limits.maxCourseCreations}) on the ${planType} plan. Please upgrade to create more courses.`,
            });
        }

        next();
    } catch (error) {
        console.error("canCreateCourse error:", error);
        return res.status(500).json({ success: false, message: "Plan validation failed" });
    }
};

/**
 * Guard: learner must be within course join limit.
 * Grandfathered users bypass this check (unlimited).
 */
exports.canJoinCourse = async (req, res, next) => {
    try {
        if (await isGrandfathered(req.user.id)) return next();

        const planType = await getUserPlanType(req.user.id);
        const limits = getPlanLimits(req.user.role, planType);

        if (limits.maxCourseJoins === -1) return next();

        const [rows] = await db.query(
            `SELECT COUNT(*) AS total FROM course_enrollments WHERE learner_id = ?`,
            [req.user.id]
        );

        if (rows[0].total >= limits.maxCourseJoins) {
            return res.status(403).json({
                success: false,
                message: `You have reached your course enrollment limit (${limits.maxCourseJoins}) on the ${planType} plan. Please upgrade to join more courses.`,
            });
        }

        next();
    } catch (error) {
        console.error("canJoinCourse error:", error);
        return res.status(500).json({ success: false, message: "Plan validation failed" });
    }
};

/**
 * Guard: learner must be within practice upload limit.
 * Grandfathered users bypass this check (unlimited).
 */
exports.canUploadPractice = async (req, res, next) => {
    try {
        if (await isGrandfathered(req.user.id)) return next();

        const planType = await getUserPlanType(req.user.id);
        const limits = getPlanLimits(req.user.role, planType);

        if (limits?.maxPracticeUploads === -1 || limits?.maxPracticeUploads === undefined) {
            return next();
        }

        const [rows] = await db.query(
            `SELECT COUNT(*) AS total FROM practice_works WHERE learner_id = ?`,
            [req.user.id]
        );

        if (rows[0].total >= limits.maxPracticeUploads) {
            return res.status(403).json({
                success: false,
                message: `You have reached your practice upload limit (${limits.maxPracticeUploads}) on the ${planType} plan. Please upgrade.`,
            });
        }

        next();
    } catch (error) {
        console.error("canUploadPractice error:", error);
        return res.status(500).json({ success: false, message: "Plan validation failed" });
    }
};
