import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {User }from '../models/user.model.js'; // Adjust path to your User model
import "dotenv/config"; // Ensure environment variables are loaded



passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user );
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
export default passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            // User exists, return the user
            return done(null, user);
        }

        // Check if user exists with the same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // User exists with same email, link Google account
            user.googleId = profile.id;
            user.provider = 'google';
            // Optionally update profile info
            user.name = user.name || profile.displayName;
            user.profilePicture = user.profilePicture || profile.photos[0]?.value;
            await user.save();
            return done(null, user);
        }

        // Create new user
        user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            profilePicture: profile.photos[0]?.value,
            provider: 'google',
            isVerified: true // Google users are pre-verified
        });

        await user.save();
        return done(null, user);

    } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
    }
}));


