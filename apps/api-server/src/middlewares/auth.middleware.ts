import { Request, Response, NextFunction } from "express";

// Simple admin authentication - in production, use proper JWT/OAuth
// For Phase 3, we'll use a simple admin token check
export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    
    console.log("[AUTH] Received token:", token ? `"${token}"` : "MISSING");
    console.log("[AUTH] Authorization header:", req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Missing admin token" });
    }

    // Simple admin token validation
    // In production, this should verify against a proper admin management system
    const validAdminTokens = process.env.ADMIN_TOKENS?.split(",") || ["dev-admin-token"];
    
    console.log("[AUTH] Valid tokens:", validAdminTokens);
    console.log("[AUTH] Token match:", validAdminTokens.includes(token.trim()));
    
    if (!validAdminTokens.map(t => t.trim()).includes(token.trim())) {
      return res.status(403).json({ success: false, message: "Invalid admin credentials" });
    }

    // Set admin context
    req.user = {
      id: "admin",
      role: "admin",
    };

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ success: false, message: "Authentication failed" });
  }
}
