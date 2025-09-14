import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    // Check if the request has an authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization header is missing" });
    }

    // Extract the token from the "Bearer <token>" format
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Token is missing" });
    }

    try {
        // Verify the token using the JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach the user's ID to the request object
        req.user = { id: decoded.id };
        
        // Pass the request to the next middleware or controller
        next();
    } catch (error) {
        // If the token is invalid or expired
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export default authMiddleware;
