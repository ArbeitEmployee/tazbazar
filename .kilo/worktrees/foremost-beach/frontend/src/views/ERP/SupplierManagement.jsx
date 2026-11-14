import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiPlus, FiPhone, FiMail, FiMapPin, FiBox } from "react-icons/fi";

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "", openingDue: 0 });
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await axios.get(`${baseUrl}/suppliers`);
      if (data?.success) setSuppliers(data.data);
    } catch (error) {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${baseUrl}/suppliers`, formData);
      if (data.success) {
        toast.success("Supplier added successfully!");
        setSuppliers([data.data, ...suppliers]);
        setShowAddForm(false);
        setFormData({ name: "", phone: "", email: "", address: "", openingDue: 0 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add supplier");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your inventory suppliers and track their dues.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors">
          <FiPlus /> Add Supplier
        </button>
      </div>

      {showAddForm && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6 animate-in slide-in-from-top-2">
          <h2 className="text-lg font-semibold mb-4">New Supplier</h2>
          <form onSubmit={handleAddSupplier} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Supplier Name *</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Opening Due (৳)</label>
              <input type="number" value={formData.openingDue} onChange={(e) => setFormData({...formData, openingDue: Number(e.target.value)})} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows="2" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-input bg-background rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">Save Supplier</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="h-40 flex items-center justify-center text-muted-foreground">Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center bg-card shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <FiBox className="text-primary w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Suppliers Found</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">You haven't added any suppliers yet. Add a supplier to start managing purchases and inventory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {suppliers.map(supplier => (
            <div key={supplier._id} className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{supplier.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Due</p>
                    <p className={`text-lg font-bold ${supplier.currentDue > 0 ? 'text-red-500' : 'text-green-500'}`}>৳ {supplier.currentDue.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-border">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FiPhone className="text-primary/70 shrink-0" /> {supplier.phone}
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FiMail className="text-primary/70 shrink-0" /> {supplier.email}
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FiMapPin className="text-primary/70 shrink-0" /> <span className="truncate">{supplier.address}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-muted/50 px-5 py-3 border-t border-border flex justify-between text-xs font-medium text-muted-foreground">
                <span>Total Paid: ৳ {supplier.totalPaid.toLocaleString()}</span>
                <button className="text-primary hover:underline">View Purchases →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
