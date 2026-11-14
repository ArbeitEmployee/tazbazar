const Supplier = require("../../models/Supplier");
const { isAdmin, getVendorForUser } = require("../../utils/marketplaceAccess");

const resolveScope = async (req, res) => {
  if (isAdmin(req.user)) {
    return { admin: true, vendorId: null };
  }
  const access = await getVendorForUser(req.user, { approvedOnly: false });
  if (!access?.vendor) {
    res.status(403).json({ success: false, message: "Vendor or admin access required" });
    return null;
  }
  return { admin: false, vendorId: access.vendor._id };
};

exports.createSupplier = async (req, res) => {
  try {
    const scope = await resolveScope(req, res);
    if (!scope) return;

    const newSupplier = new Supplier({
      ...req.body,
      vendor: scope.vendorId,
      createdBy: req.user.id
    });
    
    const saved = await newSupplier.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const scope = await resolveScope(req, res);
    if (!scope) return;
    
    const query = scope.vendorId ? { vendor: scope.vendorId } : { vendor: null };
    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
