import jwt from "jsonwebtoken";
import User from "../models/Admin.js";

const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        message: "Access denied. No token provided or invalid format." 
      });
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      return res.status(401).json({ 
        message: "Access denied. User not found." 
      });
    }

    // Add user to request object
    req.user = user;
    
    // Continue to next middleware/route handler
    next();
    
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        message: "Access denied. Invalid token." 
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        message: "Access denied. Token expired." 
      });
    } else {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ 
        message: "Server error during authentication." 
      });
    }
  }
};

export default adminAuth;