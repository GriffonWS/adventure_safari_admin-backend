import Trip from "../models/Trip.js";

const sampleTrips = [
  {
    name: "Botswana Elephant Safari",
    destination: "Botswana",
    price: 2500,
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop"
  },
  {
    name: "Okavango Delta Adventure",
    destination: "Okavango Delta",
    price: 3200,
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&h=600&fit=crop"
  },
  {
    name: "Kalahari Desert Experience",
    destination: "Kalahari Desert",
    price: 2800,
    image: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=600&fit=crop"
  },
  {
    name: "Zimbabwe Wildlife Tour",
    destination: "Zimbabwe",
    price: 2200,
    image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&h=600&fit=crop"
  },
  {
    name: "Zambia River Safari",
    destination: "Zambia",
    price: 2600,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
  },
  {
    name: "Serengeti Migration Safari",
    destination: "Tanzania",
    price: 3500,
    image: "https://images.unsplash.com/photo-1549366021-9f761d040a94?w=800&h=600&fit=crop"
  },
  {
    name: "Masai Mara Big Five Safari",
    destination: "Kenya",
    price: 3000,
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&h=600&fit=crop"
  },
  {
    name: "Kruger National Park Safari",
    destination: "South Africa",
    price: 1800,
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop"
  },
  {
    name: "Namibian Desert Safari",
    destination: "Namibia",
    price: 2700,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
  },
  {
    name: "Uganda Gorilla Trekking",
    destination: "Uganda",
    price: 4000,
    image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&h=600&fit=crop"
  }
];


import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const MONGO_URI =
  "mongodb+srv://mdanish:vPEXpmvLiQiwgfn1@griffon.dhrrsbo.mongodb.net/adventureSafari?retryWrites=true&w=majority&appName=griffon";

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);

   
    await seedTrips();

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    mongoose.connection.close();
  }
};

export const seedTrips = async () => {
  try {
    // Check if trips already exist
    const existingTrips = await Trip.countDocuments();
    
    if (existingTrips > 0) {
      console.log("Trips already exist in database. Skipping seed.");
      return;
    }

    // Insert sample trips
    const trips = await Trip.insertMany(sampleTrips);
    console.log(`Successfully seeded ${trips.length} trips!`);
    
    return trips;
  } catch (error) {
    console.error("Error seeding trips:", error);
    throw error;
  }
};

export const clearTrips = async () => {
  try {
    await Trip.deleteMany({});
    console.log("All trips cleared from database");
  } catch (error) {
    console.error("Error clearing trips:", error);
    throw error;
  }
};

seedAdmin();