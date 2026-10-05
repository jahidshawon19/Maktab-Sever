require("dotenv").config();
const readline = require("readline");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

function arg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  let fullName = arg("name");
  let phone = arg("phone");
  let password = arg("password");

  if (!fullName || !phone || !password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    fullName = fullName || (await ask(rl, "Full name: "));
    phone = phone || (await ask(rl, "Phone number: "));
    password = password || (await ask(rl, "Password: "));
    rl.close();
  }

  if (!fullName || !phone || !password) {
    console.error("Full name, phone and password are all required");
    process.exit(1);
  }

  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/maktab"
  );

  const existing = await User.findOne({ phone });
  if (existing) {
    console.error(`A user with phone ${phone} already exists`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await User.create({
    fullName,
    phone,
    password: hashedPassword,
    role: "admin",
  });

  console.log(`Admin created: ${admin.fullName} (${admin.phone})`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
