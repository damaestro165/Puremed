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
        req.user = { 
            id: decoded.userId,
            role: decoded.role,
            ...decoded
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

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to perform this action.'
        });
    }

    next();
};
