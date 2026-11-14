const OrderSource = require("../../models/OrderSource");

const createOrderSource = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: "Order source name is required" });
    }

    const newSource = await OrderSource.create({
      name,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ success: true, message: "Order source created successfully", data: newSource });
  } catch (error) {
    console.error("Error creating order source:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Order source already exists" });
    }
    res.status(500).json({ success: false, message: "Server error creating order source" });
  }
};

const getAllOrderSources = async (req, res) => {
  try {
    const sources = await OrderSource.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: sources });
  } catch (error) {
    console.error("Error fetching order sources:", error);
    res.status(500).json({ success: false, message: "Server error fetching order sources" });
  }
};

const updateOrderSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const source = await OrderSource.findById(id);
    if (!source) {
      return res.status(404).json({ success: false, message: "Order source not found" });
    }

    if (name !== undefined) source.name = name;
    if (isActive !== undefined) source.isActive = isActive;

    await source.save();

    res.status(200).json({ success: true, message: "Order source updated successfully", data: source });
  } catch (error) {
    console.error("Error updating order source:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Order source name already exists" });
    }
    res.status(500).json({ success: false, message: "Server error updating order source" });
  }
};

const deleteOrderSource = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSource = await OrderSource.findByIdAndDelete(id);

    if (!deletedSource) {
      return res.status(404).json({ success: false, message: "Order source not found" });
    }

    res.status(200).json({ success: true, message: "Order source deleted successfully" });
  } catch (error) {
    console.error("Error deleting order source:", error);
    res.status(500).json({ success: false, message: "Server error deleting order source" });
  }
};

module.exports = {
  createOrderSource,
  getAllOrderSources,
  updateOrderSource,
  deleteOrderSource
};
