import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiCheck, FiSearch, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { dashboardFormSurfaceClass, dashboardFieldClass } from "../utils/dashboardFormStyles";
import { useThemeColors } from "../hooks/useThemeColors";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const AdminAddExchangeOrder = () => {
  const { themeColor, buttonTextColor } = useThemeColors();
  
  // Orders State
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnedItems, setReturnedItems] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Products State (Mini POS)
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [exchangeCart, setExchangeCart] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Summary State
  const [exchangeFee, setExchangeFee] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem("token");
      setIsLoadingOrders(true);
      setIsLoadingProducts(true);

      // Fetch confirmed orders (we assume we can get all and filter, or just fetch recent ones)
      const ordersRes = await axios.get(`${baseUrl}/orders/admin/all?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (ordersRes.data.success) {
        // Filter orders that can be exchanged (e.g., delivered or confirmed)
        const validOrders = ordersRes.data.orders.filter(
          o => o.orderStatus === 'delivered' || o.orderStatus === 'confirmed' || o.orderStatus === 'shipped'
        );
        setConfirmedOrders(validOrders);
      }

      // Fetch products for the mini POS
      const productsRes = await axios.get(`${baseUrl}/products?limit=50`);
      if (productsRes.data.success) {
        setProducts(productsRes.data.products || productsRes.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setIsLoadingOrders(false);
      setIsLoadingProducts(false);
    }
  };

  // --- Order Selection Logic ---
  const handleSelectOrder = async (order) => {
    try {
      const token = localStorage.getItem("token");
      const orderRes = await axios.get(`${baseUrl}/orders/${order._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (orderRes.data.success) {
        setSelectedOrder(orderRes.data.order);
        setReturnedItems([]); // Reset returns when selecting new order
      } else {
        toast.error("Failed to load order details");
      }
    } catch (error) {
      console.error("Failed to load full order details:", error);
      toast.error("Error loading order details");
    }
  };

  const toggleReturnItem = (item) => {
    const exists = returnedItems.find(r => r._id === item._id);
    if (exists) {
      setReturnedItems(returnedItems.filter(r => r._id !== item._id));
    } else {
      setReturnedItems([...returnedItems, item]);
    }
  };

  // --- Mini POS Cart Logic ---
  const filteredProducts = products.filter(p => 
    p.title?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addToExchangeCart = (product) => {
    const exists = exchangeCart.find(item => item.product._id === product._id);
    if (exists) {
      setExchangeCart(exchangeCart.map(item => 
        item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setExchangeCart([...exchangeCart, { product, quantity: 1, price: product.price }]);
    }
  };

  const updateCartQuantity = (productId, change) => {
    setExchangeCart(exchangeCart.map(item => {
      if (item.product._id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + change) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setExchangeCart(exchangeCart.filter(item => item.product._id !== productId));
  };

  // --- Calculations & Submit ---
  const returnedTotal = returnedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const newItemsTotal = exchangeCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const finalTotal = newItemsTotal + Number(exchangeFee || 0) - returnedTotal;

  const handleSubmitExchange = async () => {
    if (!selectedOrder) {
      toast.error("Please select an original order");
      return;
    }
    if (returnedItems.length === 0 && exchangeCart.length === 0) {
      toast.error("Please select items to return or add new items from cart");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        originalOrderId: selectedOrder._id,
        returnedItems: returnedItems.map(item => ({
          product: item.product._id || item.product,
          quantity: item.quantity,
          price: item.price
        })),
        newItems: exchangeCart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price
        })),
        exchangeFee: Number(exchangeFee),
        adminNotes
      };

      const res = await axios.post(`${baseUrl}/orders/admin/exchange`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success("Exchange order created successfully!");
        // Reset Everything
        setSelectedOrder(null);
        setReturnedItems([]);
        setExchangeCart([]);
        setExchangeFee(0);
        setAdminNotes('');
      }
    } catch (error) {
      console.error("Create exchange error:", error);
      toast.error(error.response?.data?.message || "Failed to create exchange");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full flex flex-col gap-4">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">Exchange Order</h2>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-4 min-h-0">
        
        {/* LEFT PANEL: Original Order Selection */}
        <div className="w-full xl:w-1/3 flex flex-col gap-4">
          <div className="bg-white border border-gray-200 shadow-sm p-4 flex flex-col h-[400px]">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider shrink-0 border-b pb-2">1. Select Order</h3>
            <div className="overflow-y-auto flex-1 pr-2 space-y-2 mt-2">
              {isLoadingOrders ? (
                <p className="text-sm text-gray-500">Loading orders...</p>
              ) : confirmedOrders.length === 0 ? (
                <p className="text-sm text-gray-500">No confirmed orders found.</p>
              ) : (
                confirmedOrders.map(order => (
                  <div 
                    key={order._id}
                    onClick={() => handleSelectOrder(order)}
                    className={`p-3 border cursor-pointer transition-colors ${selectedOrder?._id === order._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-900">{order.orderNumber}</span>
                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 font-medium uppercase">{order.orderStatus}</span>
                    </div>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">Total: ৳{order.total}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Returned Items Selection */}
          <div className={`bg-white border border-gray-200 shadow-sm p-4 flex flex-col h-[300px] ${!selectedOrder ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider shrink-0 border-b pb-2">2. Return Items</h3>
            <div className="overflow-y-auto flex-1 pr-2 space-y-2 mt-2">
              {!selectedOrder ? (
                <p className="text-sm text-gray-500">Select an order above first.</p>
              ) : (
                selectedOrder.items.map((item, idx) => {
                  const isSelected = returnedItems.find(r => r._id === item._id);
                  return (
                    <div 
                      key={item._id || idx}
                      onClick={() => toggleReturnItem(item)}
                      className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-400'}`}
                    >
                      <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border ${isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-gray-400'}`}>
                        {isSelected && <FiCheck size={14} strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">
                           {item.product?.title || (typeof item.product === 'string' ? "Product not found" : "Unknown Product")}
                        </p>
                        <p className="text-xs text-gray-600 font-medium mt-1">Qty: {item.quantity} × ৳{item.price}</p>
                      </div>
                      <span className="font-bold text-sm text-gray-900">৳{item.quantity * item.price}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE PANEL: Mini POS / Product Catalog */}
        <div className={`w-full xl:w-1/3 bg-white border border-gray-200 shadow-sm p-4 flex flex-col min-h-[600px]`}>
          <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider shrink-0 border-b pb-2">3. New Products</h3>
          <div className="relative mb-4 mt-2 shrink-0">
            <FiSearch className="absolute left-3 top-3.5 text-gray-500" />
            <input
              type="text"
              className={`w-full border border-gray-300 px-4 py-2.5 pl-10 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none`}
              placeholder="Search product name..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {isLoadingProducts ? (
              <p className="text-sm text-gray-500">Loading products...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No products found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-4">
                {filteredProducts.map(product => (
                  <div 
                    key={product._id} 
                    onClick={() => addToExchangeCart(product)}
                    className="border border-gray-200 p-2 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group bg-white"
                  >
                    <div className="aspect-square bg-gray-100 mb-2 overflow-hidden border border-gray-100">
                      <img src={product.images?.[0]?.url || '/placeholder.png'} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">{product.title}</p>
                    <p className="text-sm font-bold text-blue-600">৳{product.price}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Exchange Cart & Summary */}
        <div className={`w-full xl:w-1/3 bg-white border border-gray-200 shadow-sm p-4 flex flex-col min-h-[600px]`}>
          <div className="flex items-center justify-between mb-3 shrink-0 border-b pb-2">
            <div className="flex items-center gap-2">
              <FiShoppingCart className="text-gray-800" size={18} />
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Exchange Cart</h3>
            </div>
            <span className="bg-gray-200 text-gray-800 text-xs font-bold px-2 py-0.5 rounded">{exchangeCart.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4 mt-2">
            {exchangeCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <FiShoppingCart size={48} className="mb-2 opacity-20" />
                <p>Cart is empty</p>
              </div>
            ) : (
              exchangeCart.map(item => (
                <div key={item.product._id} className="flex flex-col gap-2 p-3 border border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-sm text-gray-800 line-clamp-2 pr-2">{item.product.title}</p>
                    <button onClick={() => removeFromCart(item.product._id)} className="text-gray-400 hover:text-red-600 shrink-0 transition-colors">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm font-bold text-blue-600">৳{item.price}</p>
                    <div className="flex items-center border border-gray-300 bg-white shadow-sm">
                      <button onClick={() => updateCartQuantity(item.product._id, -1)} className="px-2.5 py-1 hover:bg-gray-100 text-gray-600 font-medium">-</button>
                      <span className="px-3 py-1 border-x border-gray-300 text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.product._id, 1)} className="px-2.5 py-1 hover:bg-gray-100 text-gray-600 font-medium">+</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary Footer */}
          <div className="pt-4 border-t-2 border-gray-200 space-y-3 shrink-0 bg-white">
            <div className="flex justify-between text-sm text-gray-700 font-medium">
              <span>Returned Value</span>
              <span className="text-red-500">- ৳{returnedTotal}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700 font-medium">
              <span>New Items Value</span>
              <span className="text-blue-600">+ ৳{newItemsTotal}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-700 font-medium">
              <span>Exchange/Shipping Fee</span>
              <div className="flex items-center border border-gray-300 px-2 py-1 bg-white">
                <span className="text-gray-500 mr-1">৳</span>
                <input
                  type="number"
                  min="0"
                  className="w-16 text-right focus:outline-none font-semibold text-gray-900"
                  value={exchangeFee}
                  onChange={(e) => setExchangeFee(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-3 border-t">
              <span className="uppercase tracking-wide">Total Due</span>
              <span className={finalTotal < 0 ? 'text-red-500' : ''}>
                ৳{finalTotal} {finalTotal < 0 && '(Refund)'}
              </span>
            </div>

            <button
              onClick={handleSubmitExchange}
              disabled={isSubmitting || !selectedOrder || (returnedItems.length === 0 && exchangeCart.length === 0)}
              style={{ backgroundColor: themeColor, color: buttonTextColor }}
              className="w-full py-3.5 mt-2 font-bold uppercase tracking-wider text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                "Create Exchange Order"
              )}
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default AdminAddExchangeOrder;
