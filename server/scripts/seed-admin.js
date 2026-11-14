require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");

async function seedAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin12345";
    const adminPhone = process.env.ADMIN_PHONE || "01711111111";
    const adminName = process.env.ADMIN_NAME || "System Admin";

    // Seed / Reset Super Admin
    let superAdmin = await User.findOne({ email: "mehekmart1@gmail.com" });
    if (!superAdmin) {
      superAdmin = new User({
        name: "Super Admin",
        email: "mehekmart1@gmail.com",
        phone: "01843104251",
        password: "superadmin123",
        userType: "admin",
        status: "active",
      });
      await superAdmin.save();
    } else {
      superAdmin.name = "Super Admin";
      superAdmin.phone = "01843104251";
      superAdmin.password = "superadmin123";
      superAdmin.userType = "admin";
      superAdmin.status = "active";
      await superAdmin.save();
    }

    // Seed / Reset Standard Admin
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = new User({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        userType: "admin",
        status: "active",
      });
      await admin.save();
      console.log(`Created new admin user: ${adminEmail}`);
    } else {
      admin.name = adminName;
      admin.phone = adminPhone;
      admin.password = adminPassword;
      admin.userType = "admin";
      admin.status = "active";
      await admin.save();
      console.log(`Updated existing admin user: ${adminEmail}`);
    }

    // Verify credentials
    await User.findByCredentials("mehekmart1@gmail.com", "superadmin123");
    await User.findByCredentials(adminEmail, adminPassword);

    console.log("Credentials verification successful!");
    console.log("-----------------------------------------");
    console.log("👑 SUPER ADMIN:");
    console.log("Email / ID : mehekmart1@gmail.com");
    console.log("Phone      : 01843104251");
    console.log("Password   : superadmin123");
    console.log("-----------------------------------------");
    console.log("👤 SYSTEM ADMIN:");
    console.log(`Email / ID : ${adminEmail}`);
    console.log(`Phone      : ${adminPhone}`);
    console.log(`Password   : ${adminPassword}`);
    console.log("-----------------------------------------");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin user:", error.message);
    process.exit(1);
  }
}

seedAdmin();
