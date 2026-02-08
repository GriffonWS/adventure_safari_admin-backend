// Simple admin authentication middleware
export default function adminAuth(req, res, next) {
  // Example: check for admin token in headers (customize as needed)
  const token = req.headers["authorization"];
  if (!token || token !== "admin-token") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
