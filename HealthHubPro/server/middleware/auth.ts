import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Middleware to validate and set the session user
export const validateAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        // Invalid user ID in session, clear session
        req.session.userId = undefined;
      }
    } catch (error) {
      console.error("Auth validation error:", error);
      // Clear session on error
      req.session.userId = undefined;
    }
  }
  
  next();
};

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  next();
};
