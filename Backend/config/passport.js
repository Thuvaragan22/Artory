const passport = require("passport");

exports.initPassport = () => {
  const GoogleStrategy = require("passport-google-oauth20").Strategy;
  const db = require("./db");

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Google OAuth not configured — skipping Google strategy.");
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const role = req.query.state || "learner"; // Get role from state
          const email = profile.emails[0].value;
          const username = profile.displayName;
          const googleId = profile.id;

          const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

          if (existing.length > 0) {
            const user = existing[0];
            if (!user.google_id) {
              await db.query("UPDATE users SET google_id = ? WHERE id = ?", [googleId, user.id]);
              user.google_id = googleId;
            }
            return done(null, user);
          }

          const [result] = await db.query(
            "INSERT INTO users (username, email, google_id, role, is_verified) VALUES (?, ?, ?, ?, ?)",
            [username, email, googleId, role, true]
          );
          return done(null, newUser[0]);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
      done(null, users[0] || false);
    } catch (err) {
      done(err, null);
    }
  });

  return passport;
};

module.exports = passport;