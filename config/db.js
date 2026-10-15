const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/maktab");
  isConnected = true;
  console.log("MongoDB connected:", mongoose.connection.host);
}

module.exports = connectDB;
