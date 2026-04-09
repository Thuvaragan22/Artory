// Plan limits keyed by plan_type (matches DB ENUM: 'free', 'trial', 'premium')
const PLAN_LIMITS = {
    free: {
        guide: {
            canUploadArtwork: true,
            canSellArtworks: false,
            maxArtworkUploads: -1,   // unlimited uploads, no selling
            maxCourseCreations: 1,   // 1 free course to get started
        },
        learner: {
            canUploadPractice: true,
            maxPracticeUploads: -1,
            maxCourseJoins: 1,       // can join 1 course on free plan
        },
    },

    trial: {
        guide: {
            canUploadArtwork: true,
            canSellArtworks: true,
            maxArtworkUploads: 10,
            maxCourseCreations: 3,
        },
        learner: {
            canUploadPractice: true,
            maxPracticeUploads: 20,
            maxCourseJoins: 5,
        },
    },

    premium: {
        guide: {
            canUploadArtwork: true,
            canSellArtworks: true,
            maxArtworkUploads: -1,
            maxCourseCreations: -1,
        },
        learner: {
            canUploadPractice: true,
            maxPracticeUploads: -1,
            maxCourseJoins: -1,
        },
    },
};

module.exports = PLAN_LIMITS;
