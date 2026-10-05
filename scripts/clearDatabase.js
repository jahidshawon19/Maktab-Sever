require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Recording = require("../models/Recording");

async function clearDatabase() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/maktab"
    );

    console.log("Clearing database...");

    const usersDeleted = await User.deleteMany({});
    console.log(`✓ Deleted ${usersDeleted.deletedCount} users`);

    const recordingsDeleted = await Recording.deleteMany({});
    console.log(`✓ Deleted ${recordingsDeleted.deletedCount} recordings`);

    console.log("\n✓ Database cleared successfully");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error clearing database:", error.message);
    process.exit(1);
  }
}

clearDatabase();
