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
import passportRoutes from "./routes/passport.routes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import colorSettingsRoutes from "./routes/colorSettingsRoutes.js";
import tripService from "./services/trip.service.js";

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    "https://admin.adventuresafarietwork.com", // Current deployment URL
    "https://admin.adventuresafarinetwork.com", // Alternative spelling
    "https://adventure-safari-admin-frontend-k5u.vercel.app", // Vercel deployment
    "https://adventure-safari-admin-frontend.vercel.app", // Alternative Vercel
    "http://localhost:3000", // Local development
    "http://localhost:5173", // Vite development
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests explicitly
app.use(express.json());

const PORT = process.env.PORT || 5000;
dbConnect().catch(err => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});

app.get("/", (req, res) => {
  res.send("Welcome to the Adventure_Safari_Admin_Backend");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/passports", passportRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/settings/colors", colorSettingsRoutes);

// Trips with an end date retire themselves the day after they finish, so the
// list does not fill up with safaris that have already run. Trips with no end
// date are untouched and are still deactivated by hand.
//
// The sweep runs on boot — which catches anything that ended while the server
// was down — and then every six hours, so a trip is retired within a few hours
// of midnight rather than only at the next restart.
const TRIP_SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;

const sweepFinishedTrips = async () => {
  try {
    const backfilled = await tripService.backfillTripStatus();
    if (backfilled > 0) {
      console.log(`Set status on ${backfilled} older trip(s)`);
    }

    const retired = await tripService.deactivateFinishedTrips();
    if (retired > 0) {
      console.log(`Marked ${retired} finished trip(s) inactive`);
    }

    const archived = await tripService.archiveFinishedTrips();
    if (archived > 0) {
      console.log(`Archived ${archived} trip(s) at month end`);
    }
  } catch (error) {
    // A failed sweep must never take the server down with it — the next run
    // picks up whatever this one missed.
    console.error("Error deactivating finished trips:", error);
  }
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  sweepFinishedTrips();
  setInterval(sweepFinishedTrips, TRIP_SWEEP_INTERVAL_MS);
});
