import pkg from 'passport-jwt';
import passport from 'passport';
import 'dotenv/config';
import { User } from '../models/user.model.js';

// Fix the destructuring - it should be Strategy, not JwtStrategy
const { Strategy: JwtStrategy, ExtractJwt } = pkg;

export default passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
    try {
        const user = await User.findById(payload.userId);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        return done(error, false);
    }
}));