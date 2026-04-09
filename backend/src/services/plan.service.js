const PLAN_LIMITS = require("../utils/planLimits");

/**
 * Get Stripe Price ID by role and plan type.
 * Plan types: 'trial' | 'premium'
 */
const getPriceIdByPlan = (planType) => {
    if (planType === "free") return null;

    const map = {
        trial: process.env.STRIPE_PRICE_TRIAL,
        premium: process.env.STRIPE_PRICE_PREMIUM,
    };

    return map[planType] || null;
};

/**
 * Get plan limits for a given role and plan_type.
 * role: 'guide' | 'learner'
 * planType: 'free' | 'trial' | 'premium'
 */
const getPlanLimits = (role, planType) => {
    const type = (planType || "free").toLowerCase();
    return PLAN_LIMITS?.[type]?.[role] || PLAN_LIMITS.free[role];
};

module.exports = {
    getPriceIdByPlan,
    getPlanLimits,
};
