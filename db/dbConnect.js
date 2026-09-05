import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function dbConnect() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ Successfully connected to MongoDB Atlas at ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ Unable to connect to MongoDB Atlas!");
    console.error(error.message);
    throw error;
  }
}

export default dbConnect;
