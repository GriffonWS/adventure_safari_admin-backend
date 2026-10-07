import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... node utils/seedAdmin.js
const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

const seedAdmin = async () => {
  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("❌ MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = await Admin.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      { email: ADMIN_EMAIL, password: hashedPassword },
      { upsert: true, new: true }
    );

    console.log("✅ Admin password set for:", admin.email);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();
