import {Router} from 'express';
import { User } from '../models/user.model.js'; 
import {checkSchema, matchedData, validationResult} from 'express-validator';
import { userValidationSchema } from '../utils/ValidationSchemas.js';
import { hashPassword, comparePassword } from '../utils/helpers.js';
import passport from 'passport';
import '../strategies/local-strategy.js'; 
import '../strategies/google-strategy.js';
import '../strategies/jwt-strategy.js'; // Ensure JWT strategy is imported
import "dotenv/config"; // Load environment variables
import jwt from 'jsonwebtoken';






const router = Router();

router.post('/register',checkSchema(userValidationSchema) ,async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
    }
    const data = matchedData(req);
    data.password = hashPassword(data.password);
    try {
        const { email, password, name } = data;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        const user = await User.create({
            email,
            password,
            name,
            provider: 'local'
        });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,    
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error });
    }
   
});
router.post('/login', 
    checkSchema(userValidationSchema),
    (req, res, next) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }
        
        passport.authenticate('local', { session: false }, (err, user, info) => {
            if (err) {
                return res.status(500).json({ message: "Error logging in", error: err });
            }
            if (!user) {
                return res.status(400).json({ message: info.message });
            }
    
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
    
            res.json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                }
            });
        })(req, res, next);
    }
);

router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    })
);

// Google OAuth callback route
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        // Redirect to frontend success page or dashboard
      const user = req.user; 
      // The user object is added to the request by passport
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        // Redirect to frontend callback with token
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    }
);

router.get('/me', (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ 
                error: 'Authentication error', 
                details: err.message 
            });
        }
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid or expired token',
                details: info ? info.message : 'No user found'
            });
        }

        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                picture: user.picture,
                provider: user.provider
            }
        });
    })(req, res, next);
});

// Logout route
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: 'Error destroying session' });
            }
            res.clearCookie('connect.sid'); // Clear session cookie
            res.json({ message: 'Logged out successfully' });
        });
    });
}
);

export default router;