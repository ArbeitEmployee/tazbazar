require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("./src/models/Order");

async function testExchange() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get an order
    const originalOrder = await Order.findOne();
    if (!originalOrder) {
      console.log("No orders found");
      process.exit(1);
    }

    const newExchangeOrder = new Order({
      orderNumber: "EX-123456",
      user: originalOrder.user,
      items: [{ product: new mongoose.Types.ObjectId(), quantity: 1, price: 100 }],
      shippingAddress: originalOrder.shippingAddress,
      subtotal: 100,
      shippingFee: 0,
      discount: 0,
      total: 100,
      paymentMethod: originalOrder.paymentMethod || "cash_on_delivery",
      paymentDetails: originalOrder.paymentDetails,
      orderStatus: "pending",
      paymentStatus: "completed",
      isExchange: true,
      exchangeRefOrder: originalOrder._id,
      exchangeReturnedItems: [],
      exchangeFee: 0,
    });

    await newExchangeOrder.save();
    console.log("Successfully saved exchange order!");
    
    await Order.findByIdAndDelete(newExchangeOrder._id);
  } catch (error) {
    console.error("Validation or save error:");
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}

testExchange();
