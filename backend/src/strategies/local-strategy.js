import passport from 'passport';
import { Strategy} from 'passport-local';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js'; // Adjust path to your User model`
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

// Local Strategy
export default passport.use(new Strategy(
    { usernameField: 'email' },
    async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            
            if (!user) throw new Error('User not found');
            if (!user.password) throw new Error('Login with Google instead');

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) throw new Error('Invalid credentials');

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
));