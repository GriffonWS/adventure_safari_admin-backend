import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import dbConnect from "./db/dbConnect.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import tripRoutes from "./routes/trip.routes.js";
import announcementRoutes from "./routes/announcementRoutes.js";

const app = express();

// CORS configuration
// CORS configuration
const corsOptions = {
  origin: [
    "https://admin.adventuresafarinetwork.com", // Previous deployment URL
    "https://adventure-safari-admin-frontend-k5u.vercel.app", // Your actual deployment URL
    "https://adventure-safari-admin-frontend.vercel.app", // Keep this if you plan to use it
    "http://localhost:3000", // For local development
    "http://localhost:5173", // If using Vite
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests explicitly
app.use(express.json());

const PORT = process.env.PORT || 5000;
dbConnect();

app.get("/", (req, res) => {
  res.send("Welcome to the Adventure_Safari_Admin_Backend");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/announcements", announcementRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
