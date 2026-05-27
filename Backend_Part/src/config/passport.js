const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const logger = require("../utils/logger");

const googleOAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

if (googleOAuthEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = String(profile.emails?.[0]?.value || "").trim().toLowerCase();
          const avatarUrl = String(profile.photos?.[0]?.value || "").trim() || null;

          if (!email) {
            return done(new Error("Google account email is required"), null);
          }

          const existingUser = await User.findOne({
            googleId: profile.id
          });

          if (existingUser) {
            if (avatarUrl && existingUser.avatarUrl !== avatarUrl) {
              existingUser.avatarUrl = avatarUrl;
              await existingUser.save();
            }

            return done(null, existingUser);
          }

          const existingEmailUser = await User.findOne({ email });

          if (existingEmailUser) {
            existingEmailUser.googleId = profile.id;
            if (avatarUrl) {
              existingEmailUser.avatarUrl = avatarUrl;
            }
            if (!existingEmailUser.name && profile.displayName) {
              existingEmailUser.name = profile.displayName;
            }

            await existingEmailUser.save();
            return done(null, existingEmailUser);
          }

          const user = await User.create({
            googleId: profile.id,
            name: profile.displayName || email.split("@")[0],
            email,
            avatarUrl
          });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  logger.warn("Google OAuth is disabled: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.");
}

passport.googleOAuthEnabled = googleOAuthEnabled;

module.exports = passport;
