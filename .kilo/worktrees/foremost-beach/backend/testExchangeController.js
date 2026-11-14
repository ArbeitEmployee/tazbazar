require("dotenv").config();
const mongoose = require("mongoose");
const { createExchangeOrder } = require("./src/modules/order/services/orderCore.service");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const Order = require("./src/models/Order");
  const originalOrder = await Order.findOne({ orderStatus: { $in: ["confirmed", "delivered", "shipped", "pending"] } });

  if (!originalOrder) {
    console.log("No order found");
    process.exit(0);
  }

  const Product = require("./src/models/Product");
  const product = await Product.findOne();

  const req = {
    body: {
      originalOrderId: originalOrder._id.toString(),
      returnedItems: [{ product: product._id, quantity: 1, price: 100 }],
      newItems: [{ product: product._id, quantity: 1, price: 200 }],
      exchangeFee: 50,
      adminNotes: "Test exchange"
    }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log("Status:", this.statusCode);
      console.log("Response:", JSON.stringify(data, null, 2));
    }
  };

  await createExchangeOrder(req, res);
  mongoose.connection.close();
}

run();
