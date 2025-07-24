import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: "Access denied. No token provided." 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Fix: Set req.user instead of req.userId to match controller expectations
        req.user = { 
            id: decoded.userId,
            ...decoded // Include other user data if needed
        };
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(403).json({ 
            success: false,
            message: "Invalid token" 
        });
    }
};