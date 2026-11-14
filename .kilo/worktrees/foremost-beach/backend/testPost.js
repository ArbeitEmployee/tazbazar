require("dotenv").config();
const mongoose = require("mongoose");
const { createExchangeOrder } = require("./src/modules/order/services/orderCore.service");
const Order = require("./src/models/Order");
const Product = require("./src/models/Product");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const originalOrder = await Order.findOne({ orderStatus: { $in: ["confirmed", "delivered", "shipped"] } });
  const product = await Product.findOne();

  const req = {
    body: {
      originalOrderId: originalOrder._id.toString(),
      returnedItems: [
        { product: product._id.toString(), quantity: 1, price: 100 }
      ],
      newItems: [
        { product: product._id.toString(), quantity: 1, price: 200 }
      ],
      exchangeFee: 50,
      adminNotes: "test"
    }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log("Response:", JSON.stringify(data, null, 2));
    }
  };

  await createExchangeOrder(req, res);
  process.exit(0);
}
run();
