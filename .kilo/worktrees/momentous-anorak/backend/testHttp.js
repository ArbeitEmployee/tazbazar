require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find an admin user
    const User = require("./src/models/User");
    const admin = await User.findOne({ role: "admin" }) || await User.findOne();
    if (!admin) throw new Error("No user found");
    
    // Generate token
    const token = jwt.sign(
      { id: admin._id, role: admin.role || "admin", phone: admin.phone },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );
    
    console.log("Got token");

    // Get an order
    const Order = require("./src/models/Order");
    const originalOrder = await Order.findOne({ orderStatus: { $in: ["confirmed", "delivered", "shipped"] } });
    if (!originalOrder) throw new Error("No order found");

    // Get a product
    const Product = require("./src/models/Product");
    const product = await Product.findOne();

    // Call API via HTTP
    const payload = {
      originalOrderId: originalOrder._id.toString(),
      returnedItems: [{ product: product._id, quantity: 1, price: 100 }],
      newItems: [{ product: product._id, quantity: 1, price: 200 }],
      exchangeFee: 50,
      adminNotes: "HTTP Test"
    };

    console.log("Calling API...");
    const res = await axios.post("http://localhost:4000/api/orders/admin/exchange", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Success:", res.data);
  } catch (err) {
    console.error("HTTP Error:", err.response ? err.response.data : err.message);
  } finally {
    mongoose.connection.close();
  }
}
run();
