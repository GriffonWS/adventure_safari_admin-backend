import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const MONGO_URI =
  "mongodb+srv://mdanish:vPEXpmvLiQiwgfn1@griffon.dhrrsbo.mongodb.net/adventureSafari?retryWrites=true&w=majority&appName=griffon";

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const email = "adventuresafari@gmail.com"; // your admin email
    const password = "Adventure@123"; // your admin password

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert or update admin
    const admin = await Admin.findOneAndUpdate(
      { email },
      { email, password: hashedPassword },
      { upsert: true, new: true } // update if exists, insert if not
    );

    console.log("✅ Admin user ensured:", admin);
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    mongoose.connection.close();
  }
};

seedAdmin();
