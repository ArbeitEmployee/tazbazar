import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { 
  FiHome, FiShoppingCart, FiPackage, FiUsers, FiDollarSign, 
  FiBarChart2, FiSettings, FiChevronDown, FiChevronRight,
  FiMenu, FiX, FiLogOut, FiClipboard, FiBell
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";

const MENU_ITEMS = [
  {
    title: "Dashboard",
    icon: FiHome,
    items: [
      { name: "Analytics", tab: "dashboard" },
      { name: "Notifications", tab: "notifications" }
    ]
  },
  {
    title: "Website Setup",
    icon: FiSettings,
    items: [
      { name: "Header", tab: "module-website-setup" },
      { name: "Footer", tab: "website-footer" },
      { name: "About Us", tab: "website-about" },
      { name: "Contact", tab: "website-contact" },
      { name: "Theme & Buttons", tab: "website-theme" }
    ]
  },
  {
    title: "Setting and Configuration",
    icon: FiSettings,
    items: [
      { name: "Marketing", tab: "marketing" },
      { name: "Courier API", tab: "courier-settings" },
      { name: "Invoice Address", tab: "invoice-address" },
      { name: "Delivery Charge", tab: "shipping-zones" },
      { name: "Payment Setup", tab: "payment-methods" },
      { name: "Social Login", tab: "social-login" },
      { name: "SMS API", tab: "sms-api" },
      { name: "City", tab: "city" },
      { name: "Sub City", tab: "sub-city" }
    ]
  },
  {
    title: "Orders",
    icon: FiClipboard,
    items: [
      { name: "Order List", tab: "order-list" },
      { name: "Incomplete Orders", tab: "module-abandoned" },
      { name: "Add Order", tab: "add-order" },
      { name: "Manage Returns", tab: "manage-returns" },
      { name: "Order Processing Report", tab: "order-processing-report" }
    ]
  },
  {
    title: "Products",
    icon: FiPackage,
    items: [
      { name: "Manage Products", tab: "modify-product" },
      { name: "Add Product", tab: "create-product" },
      { name: "Attribute / Size", tab: "attribute-size" },
      { name: "Products Review", tab: "product-reviews" },
      { name: "Product View Report", tab: "product-view-report" },
      { name: "Product Stock Report", tab: "product-stock-report" },
      { name: "Damage Products", tab: "damage-products" }
    ]
  },
  {
    title: "Purchase",
    icon: FiShoppingCart,
    items: [
      { name: "Add Purchase", tab: "add-purchase" },
      { name: "Manage Purchase", tab: "manage-purchase" }
    ]
  },
  {
    title: "Category",
    icon: FiPackage,
    items: [
      { name: "Main Category", tab: "modify-category" },
      { name: "Sub Category", tab: "sub-category" },
      { name: "Sub Sub Category", tab: "sub-sub-category" }
    ]
  },
  {
    title: "Slider",
    icon: FiPackage,
    items: [
      { name: "Manage Sliders", tab: "modify-banner" },
      { name: "Add Slider", tab: "create-banner" },
      { name: "Store Popup Notice", tab: "store-popup" }
    ]
  },
  {
    title: "Brand",
    icon: FiPackage,
    items: [
      { name: "Manage Brands", tab: "module-brands" }
    ]
  },
  {
    title: "Accounts",
    icon: FiDollarSign,
    items: [
      { name: "Income", tab: "income" },
      { name: "Expense", tab: "expense" },
      { name: "Summary / Balance", tab: "balance" }
    ]
  },
  {
    title: "Admin",
    icon: FiUsers,
    items: [
      { name: "Add Admin", tab: "add-admin" },
      { name: "Manage Admin", tab: "module-admin-users" },
      { name: "Role", tab: "admin-role" },
      { name: "Permission", tab: "admin-permission" }
    ]
  },
  {
    title: "Customer",
    icon: FiUsers,
    items: [
      { name: "Customers", tab: "customers" },
      { name: "Customer Message", tab: "contacted-list" }
    ]
  },
  {
    title: "Report",
    icon: FiBarChart2,
    items: [
      { name: "Sales and Profit Report", tab: "profit-loss" },
      { name: "Product Stock Report", tab: "stock-report" },
      { name: "Order Summary Report", tab: "order-report" }
    ]
  },
  {
    title: "Landing Page",
    icon: FiPackage,
    items: [
      { name: "Manage Landing Page", tab: "manage-landing-page" },
      { name: "Add Landing Page", tab: "add-landing-page" }
    ]
  },
  {
    title: "Settings",
    icon: FiSettings,
    items: [
      { name: "General Settings", tab: "settings" }
    ]
  }
];

const SidebarContent = ({
  activeTab,
  handleTabChange,
  isMobile,
  setIsMobileOpen,
  sidebarOpen,
  toggleSidebar,
  handleLogout,
  openGroups,
  toggleGroup,
  user,
}) => {
  const navScrollRef = useRef(null);
  const lastNavScrollRef = useRef(0);

  const unreadNotificationsCount = useSelector(
    (state) =>
      state.notifications?.items?.filter((item) => !item.isRead)?.length || 0,
  );

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    const target = lastNavScrollRef.current;
    if (!target) return;
    const timer = setTimeout(() => {
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
      el.scrollTop = Math.min(target, maxScroll);
    }, 50);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleItemClick = (tab) => {
    lastNavScrollRef.current = navScrollRef.current?.scrollTop || 0;
    handleTabChange(tab);
    if (isMobile) setIsMobileOpen(false);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 transition-all duration-300 overflow-hidden">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
            A
          </div>
          {(sidebarOpen || isMobile) && (
            <span className="font-semibold text-lg whitespace-nowrap">Admin UI</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleItemClick("notifications")}
            className={`relative p-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "notifications"
                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
            title="Notifications"
          >
            <FiBell size={18} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
              </span>
            )}
          </button>
          {!isMobile && (
            <button 
              type="button"
              onClick={toggleSidebar} 
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              aria-label="Toggle sidebar"
            >
              <FiMenu size={20} />
            </button>
          )}
          {isMobile && (
            <button 
              type="button"
              onClick={() => setIsMobileOpen(false)} 
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              aria-label="Close menu"
            >
              <FiX size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div 
        ref={navScrollRef}
        className="flex-1 overflow-y-auto py-3 px-3 space-y-1 overscroll-contain touch-pan-y app-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {MENU_ITEMS.map((group) => {
          const isGroupActive = group.items?.some((item) => item.tab === activeTab);
          const isExpanded = Boolean(openGroups[group.title]);

          return (
            <div key={group.title} className="mb-1">
              <button 
                type="button"
                onClick={() => toggleGroup(group.title)}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                  isGroupActive 
                    ? "bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-semibold" 
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                } ${(sidebarOpen || isMobile) ? 'px-3' : 'justify-center'}`}
                title={(!sidebarOpen && !isMobile) ? group.title : ""}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <group.icon size={20} className={`shrink-0 ${isGroupActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  {(sidebarOpen || isMobile) && (
                    <span className="text-sm font-medium truncate">{group.title}</span>
                  )}
                </div>
                {(sidebarOpen || isMobile) && (
                  isExpanded ? <FiChevronDown size={16} className="text-slate-400 shrink-0" /> : <FiChevronRight size={16} className="text-slate-400 shrink-0" />
                )}
              </button>
              
              {/* Submenu */}
              <AnimatePresence initial={false}>
                {(isExpanded && (sidebarOpen || isMobile)) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-4 pl-4 border-l border-slate-200 dark:border-slate-800 mt-1 space-y-0.5"
                  >
                  {group.items.map(item => {
                    const isNotificationTab = item.tab === "notifications";
                    return (
                      <button
                        key={`${group.title}-${item.name}`}
                        type="button"
                        onClick={() => handleItemClick(item.tab)}
                        className={`w-full text-left py-2 px-3 rounded-md text-sm transition-colors cursor-pointer flex items-center justify-between ${
                          activeTab === item.tab 
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold" 
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        {isNotificationTab && unreadNotificationsCount > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white leading-none">
                            {unreadNotificationsCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer / User Profile */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-2 shrink-0">
        <a 
          href="/" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors ${(sidebarOpen || isMobile) ? '' : 'hidden'}`}
        >
          <FiHome size={16} />
          <span className="text-sm font-semibold">View Store</span>
        </a>
        <div className={`flex items-center ${(sidebarOpen || isMobile) ? 'justify-between' : 'justify-center'} gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
            {(sidebarOpen || isMobile) && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium truncate">{user?.name || "Admin User"}</span>
                <span className="text-xs text-slate-500 truncate">{user?.email || "admin@syndron.com"}</span>
              </div>
            )}
          </div>
          {(sidebarOpen || isMobile) && (
            <button 
              type="button"
              onClick={handleLogout} 
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
              aria-label="Logout"
            >
              <FiLogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({
  activeTab,
  handleTabChange,
  isMobile,
  isMobileOpen,
  setIsMobileOpen,
  sidebarOpen,
  toggleSidebar,
  handleLogout
}) => {
  const { user } = useAuth();
  const [openGroups, setOpenGroups] = useState({ Dashboard: true, "POS / Sale": true, Orders: true });

  useEffect(() => {
    if (!activeTab) return;
    const currentGroup = MENU_ITEMS.find((group) =>
      group.items?.some((item) => item.tab === activeTab)
    );
    if (currentGroup) {
      setOpenGroups((prev) => ({
        ...prev,
        [currentGroup.title]: true,
      }));
    }
  }, [activeTab]);

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const contentProps = {
    activeTab,
    handleTabChange,
    isMobile,
    setIsMobileOpen,
    sidebarOpen,
    toggleSidebar,
    handleLogout,
    openGroups,
    toggleGroup,
    user,
  };

  if (isMobile) {
    return (
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-[128000] pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileOpen(false)}
              className="app-layer-drawer-overlay fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: "-100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="app-layer-drawer fixed inset-y-0 left-0 w-72 max-w-[85vw] h-[100dvh] bg-white shadow-2xl flex flex-col z-[128000]"
            >
              <SidebarContent {...contentProps} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      className="h-screen shrink-0 z-20 sticky top-0"
    >
      <SidebarContent {...contentProps} />
    </motion.aside>
  );
};

export default Sidebar;