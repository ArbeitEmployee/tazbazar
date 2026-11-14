/* eslint-disable no-unused-vars */
import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useDispatch } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "@/lib/routing";
import { toast } from "react-hot-toast";
import {
  fetchNotifications,
  startNotificationStream,
  stopNotificationStream,
} from "../store/notificationsSlice";

// Components
import Sidebar from "../components/Dashboard/Sidebar";
import MobileHeader from "../components/Dashboard/MobileHeader";
import usePublicSettings from "../hooks/usePublicSettings";
import {
  canAccessDashboardTab,
  isSuperAdminUser,
  normalizeMarketplaceMode,
} from "../utils/dashboardAccess";
import { getDashboardTabMeta } from "../utils/dashboardPresentation";
import DashboardHome from "./DashboardHome";

const TabLoadingFallback = () => (
  <div className="app-panel-soft flex min-h-65 items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-black" />
  </div>
);

// Helper: client-only tab chunks with a loading UI and chunk load recovery.
const dynamicTab = (loader) =>
  dynamic(
    () =>
      loader().catch((err) => {
        console.warn("Retrying chunk load:", err);
        return new Promise((resolve) => setTimeout(resolve, 300)).then(() =>
          loader(),
        );
      }),
    { ssr: false, loading: TabLoadingFallback },
  );

const Settings = dynamicTab(() => import("../components/Dashboard/Settings"));
const AdminPaymentMethods = dynamicTab(() => import("./AdminPaymentMethods"));
const AdminAddOrder = dynamicTab(() => import("./AdminAddOrder"));
const CreateCategory = dynamicTab(() => import("./Category/CreateCategory"));
const ModifyCategory = dynamicTab(() => import("./Category/ModifyCategory"));
const ProductModify = dynamicTab(() => import("./Product/ProductModify"));
const CreateBanner = dynamicTab(() => import("./Banner/CreateBanner"));
const ModifyBanner = dynamicTab(() => import("./Banner/ModifyBanner"));
const HighlightTextManager = dynamicTab(() => import("./Banner/HighlightTextManager"));
const StorePopupManager = dynamicTab(() => import("./Banner/StorePopupManager"));
const AdminOrderList = dynamicTab(() => import("./AdminOrderList"));
const AdminCourierSettings = dynamicTab(() => import("./AdminCourierSettings"));
const UserOrders = dynamicTab(() => import("./UserOrders"));
const OrderTracking = dynamicTab(() => import("./OrderTracking"));
const AdminCoupons = dynamicTab(() => import("./AdminCoupons"));
const AdminProductApprovals = dynamicTab(
  () => import("./AdminProductApprovals"),
);
const AdminShippingZones = dynamicTab(() => import("./AdminShippingZones"));
const AdminProductReviews = dynamicTab(() => import("./AdminProductReviews"));
const AdminProductReports = dynamicTab(() => import("./AdminProductReports"));
const AdminCustomerRisk = dynamicTab(() => import("./AdminCustomerRisk"));
const MyAddresses = dynamicTab(() => import("./MyAddresses"));
const MyWishlist = dynamicTab(() => import("./MyWishlist"));
const ModuleAbandonedOrders = dynamicTab(
  () => import("./ModuleAbandonedOrders"),
);
const ModuleInventoryCenter = dynamicTab(
  () => import("./ModuleInventoryCenter"),
);
const ModuleAccounts = dynamicTab(() => import("./ModuleAccounts"));
const ModuleBrands = dynamicTab(() => import("./ModuleBrands"));
const ModuleBusinessReports = dynamicTab(
  () => import("./ModuleBusinessReports"),
);
const ModuleWebsiteSetup = dynamicTab(() => import("./ModuleWebsiteSetup"));
const ModuleSeoAnalytics = dynamicTab(() => import("./ModuleSeoAnalytics"));
const ModuleAdminUsers = dynamicTab(() => import("./ModuleAdminUsers"));
const ModuleSuperAdminControl = dynamicTab(
  () => import("./ModuleSuperAdminControl"),
);
const AdminContactedUsers = dynamicTab(() => import("./AdminContactedUsers"));
const NotificationsCenter = dynamicTab(() => import("./NotificationsCenter"));
const PointOfSale = dynamicTab(() => import("./POS/PointOfSale"));
const SupplierManagement = dynamicTab(() => import("./ERP/SupplierManagement"));

const AdminAddExchangeOrder = dynamicTab(() => import("./AdminAddExchangeOrder"));
const AdminManageExchange = dynamicTab(() => import("./AdminManageExchange"));
const AdminManageReturns = dynamicTab(() => import("./AdminManageReturns"));
const AdminOrderProcessingReport = dynamicTab(() => import("./AdminOrderProcessingReport"));
const AdminOrderSource = dynamicTab(() => import("./AdminOrderSource"));
const AdminOrderProcessingNote = dynamicTab(() => import("./AdminOrderProcessingNote"));

const AdminManageOfficeSale = dynamicTab(() => import("./AdminManageOfficeSale"));
const AdminCompanySale = dynamicTab(() => import("./AdminCompanySale"));
const AdminResellerSale = dynamicTab(() => import("./AdminResellerSale"));
const AdminSaleExchange = dynamicTab(() => import("./AdminSaleExchange"));

const PurchaseManager = dynamicTab(() => import("./Purchase/PurchaseManager"));
const CategoryLevels = dynamicTab(() => import("./Category/CategoryLevels"));
const AccountsLedger = dynamicTab(() => import("./Accounts/AccountsLedger"));
const AccountPurposes = dynamicTab(() => import("./Accounts/AccountPurposes"));
const SupplierDues = dynamicTab(() => import("./ERP/SupplierDues"));
const SupplierPurchaseReport = dynamicTab(() => import("./ERP/SupplierPurchaseReport"));
const ProductStockReport = dynamicTab(() => import("./Product/ProductStockReport"));
const ProductViewReport = dynamicTab(() => import("./Product/ProductViewReport"));
const DamageProducts = dynamicTab(() => import("./Product/DamageProducts"));
const ProductAttributeManager = dynamicTab(() => import("./Product/ProductAttributeManager"));
const CampaignManagement = dynamicTab(() => import("./Campaign/CampaignManagement"));
const LandingPageManager = dynamicTab(() => import("./LandingPage/LandingPageManager"));
const WithdrawRequestManager = dynamicTab(() => import("./Merchant/WithdrawRequestManager"));
const MerchantResellerManager = dynamicTab(() => import("./Merchant/MerchantResellerManager"));
const ReportCenter = dynamicTab(() => import("./Report/ReportCenter"));
const ConfigPages = dynamicTab(() => import("./Settings/ConfigPages"));
const Customers = dynamicTab(() => import("./Customers"));

const getValidDashboardTab = ({ user, tab, marketplaceMode }) => {
  const normalizedTab = String(tab || "").trim();

  if (
    normalizedTab &&
    normalizedTab !== "home" &&
    canAccessDashboardTab({
      user,
      tab: normalizedTab,
      marketplaceMode,
    })
  ) {
    return normalizedTab;
  }

  return "dashboard";
};

// Memoized content components
const TabContent = React.memo(
  ({
    activeTab,
    user,
    onTabChange,
    onMarketplaceModeChange,
    marketplaceMode,
    dashboardTrackOrderNumber,
  }) => {
    if (
      activeTab !== "dashboard" &&
      !canAccessDashboardTab({
        user,
        tab: activeTab,
        marketplaceMode,
      })
    ) {
      return (
        <div className="app-panel p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-black">
            Access Restricted
          </h2>
          <p className="text-gray-600">
            You do not have permission to access this module.
          </p>
        </div>
      );
    }

    if (user?.userType === "admin" && activeTab === "dashboard") {
      return <DashboardHome user={user} onTabChange={onTabChange} />;
    }

    if (user?.userType !== "admin" && activeTab === "dashboard") {
      return <DashboardHome user={user} onTabChange={onTabChange} />;
    }

    switch (activeTab) {
      case "settings":
        return <Settings user={user} />;
      case "payment-methods":
        return user?.userType === "admin" ? <AdminPaymentMethods /> : null;
      case "pos":
        return user?.userType === "admin" ? <PointOfSale /> : null;
      case "manage-office-sale":
        return user?.userType === "admin" ? <AdminManageOfficeSale /> : null;
      case "company-sale":
        return user?.userType === "admin" ? <AdminCompanySale /> : null;
      case "reseller-sale":
        return user?.userType === "admin" ? <AdminResellerSale /> : null;
      case "sale-exchange":
        return user?.userType === "admin" ? <AdminSaleExchange /> : null;
      case "supplier-management":
        return user?.userType === "admin" ? <SupplierManagement /> : null;
      case "notifications":
        return <NotificationsCenter user={user} onNavigate={onTabChange} />;
      case "create-category":
        return user?.userType === "admin" ? <CreateCategory /> : null;
      case "modify-category":
        return user?.userType === "admin" ? <ModifyCategory /> : null;
      case "create-banner":
        return user?.userType === "admin" ? <CreateBanner /> : null;
      case "modify-banner":
        return user?.userType === "admin" ? <ModifyBanner /> : null;
      case "store-popup":
        return user?.userType === "admin" ? <StorePopupManager /> : null;
      case "highlight-text":
        return user?.userType === "admin" ? <HighlightTextManager /> : null;
      case "create-product":
        return user?.userType === "admin" ? (
          <ProductModify initialMode="create" />
        ) : null;
      case "modify-product":
        return user?.userType === "admin" ? (
          <ProductModify initialMode="list" />
        ) : null;
      case "product-approvals":
        return user?.userType === "admin" ? <AdminProductApprovals /> : null;
      case "order-list":
        return user?.userType === "admin" ? <AdminOrderList /> : null;
      case "add-order":
        return user?.userType === "admin" ? <AdminAddOrder /> : null;
      case "manage-exchange":
        return user?.userType === "admin" ? <AdminManageExchange /> : null;
      case "add-exchange-order":
        return user?.userType === "admin" ? <AdminAddExchangeOrder /> : null;
      case "manage-returns":
        return user?.userType === "admin" ? <AdminManageReturns /> : null;
      case "order-processing-report":
        return user?.userType === "admin" ? <AdminOrderProcessingReport /> : null;
      case "order-source":
        return user?.userType === "admin" ? <AdminOrderSource /> : null;
      case "order-processing-note":
        return user?.userType === "admin" ? <AdminOrderProcessingNote /> : null;
      case "courier-settings":
        return user?.userType === "admin" ? <AdminCourierSettings /> : null;
      case "coupons":
        return user?.userType === "admin" ? <AdminCoupons /> : null;
      case "shipping-zones":
        return user?.userType === "admin" ? <AdminShippingZones /> : null;
      case "product-reports":
        return user?.userType === "admin" ? <AdminProductReports /> : null;
      case "product-reviews":
        return user?.userType === "admin" ? <AdminProductReviews /> : null;
      case "customer-risk":
        return user?.userType === "admin" ? <AdminCustomerRisk /> : null;
      case "my-orders":
        return user?.userType !== "admin" ? (
          <UserOrders
            onTrackOrder={(orderNumber) => {
              if (!orderNumber) return;
              window.dispatchEvent(
                new CustomEvent("dashboardTrackOrderOpen", {
                  detail: { orderNumber },
                }),
              );
            }}
          />
        ) : null;
      case "my-order-tracking":
        return user?.userType !== "admin" ? (
          <OrderTracking
            variant="dashboard"
            orderNumber={dashboardTrackOrderNumber}
            onBack={() => onTabChange("my-orders")}
          />
        ) : null;
      case "wishlist":
        return user?.userType === "user" ? (
          <MyWishlist variant="dashboard" />
        ) : null;
      case "my-addresses":
        return user?.userType === "user" ? <MyAddresses /> : null;
      case "module-abandoned":
        return user?.userType === "admin" ? <ModuleAbandonedOrders /> : null;
      case "module-inventory":
        return user?.userType === "admin" ? <ModuleInventoryCenter /> : null;
      case "module-accounts":
        return user?.userType === "admin" ? <ModuleAccounts /> : null;
      case "module-brands":
        return user?.userType === "admin" ? <ModuleBrands /> : null;
      case "module-admin-users":
        return user?.userType === "admin" ? (
          <ModuleAdminUsers initialMode="manage-admin" />
        ) : null;
      case "module-super-admin":
        return user?.userType === "admin" && isSuperAdminUser(user) ? (
          <ModuleSuperAdminControl
            onMarketplaceModeChange={onMarketplaceModeChange}
          />
        ) : null;
      case "module-business-reports":
        return user?.userType === "admin" ? <ModuleBusinessReports /> : null;
      case "module-website-setup":
        return user?.userType === "admin" ? <ModuleWebsiteSetup initialSection="brand" /> : null;
      case "website-footer":
        return user?.userType === "admin" ? <ModuleWebsiteSetup initialSection="footer" /> : null;
      case "website-about":
        return user?.userType === "admin" ? <ModuleWebsiteSetup initialSection="about" /> : null;
      case "website-contact":
        return user?.userType === "admin" ? <ModuleWebsiteSetup initialSection="contact" /> : null;
      case "website-theme":
        return user?.userType === "admin" ? <ModuleWebsiteSetup initialSection="theme" /> : null;
      case "website-font":
        return user?.userType === "admin" ? <ModuleWebsiteSetup initialSection="font" /> : null;
      case "website-pages":
        return user?.userType === "admin" ? <ModuleWebsiteSetup initialSection="pages" /> : null;
      case "website-template":
        return user?.userType === "admin" ? <ModuleWebsiteSetup initialSection="template" /> : null;
      case "module-seo-analytics":
        return user?.userType === "admin" ? <ModuleSeoAnalytics /> : null;
      case "contacted-list":
        return user?.userType === "admin" ? <AdminContactedUsers /> : null;
      // === Purchase (4 tabs) ===
      case "add-purchase":
        return user?.userType === "admin" ? <PurchaseManager initialMode="add" /> : null;
      case "manage-purchase":
        return user?.userType === "admin" ? <PurchaseManager initialMode="manage" /> : null;
      case "variant-purchase":
        return user?.userType === "admin" ? <PurchaseManager initialMode="variant" /> : null;
      case "fabrics-purchase":
        return user?.userType === "admin" ? <PurchaseManager initialMode="fabric" /> : null;
      // === Category hierarchy (2 tabs) ===
      case "sub-category":
        return user?.userType === "admin" ? <CategoryLevels level="sub" /> : null;
      case "sub-sub-category":
        return user?.userType === "admin" ? <CategoryLevels level="subsub" /> : null;
      case "add-brand":
        return user?.userType === "admin" ? <ModuleBrands /> : null;
      // === Account ledger tabs (9) ===
      case "income":
        return user?.userType === "admin" ? <AccountsLedger initialMode="income" /> : null;
      case "expense":
        return user?.userType === "admin" ? <AccountsLedger initialMode="expense" /> : null;
      case "due":
        return user?.userType === "admin" ? <AccountsLedger initialMode="due" /> : null;
      case "balance":
        return user?.userType === "admin" ? <AccountsLedger initialMode="balance" /> : null;
      case "fund-transfer":
        return user?.userType === "admin" ? <AccountsLedger initialMode="fund-transfer" /> : null;
      case "employee-salary":
        return user?.userType === "admin" ? <AccountsLedger initialMode="employee-salary" /> : null;
      case "bill-statements":
        return user?.userType === "admin" ? <AccountsLedger initialMode="bill-statements" /> : null;
      case "loan":
        return user?.userType === "admin" ? <AccountsLedger initialMode="loan" /> : null;
      case "withdrawal":
        return user?.userType === "admin" ? <AccountsLedger initialMode="withdrawal" /> : null;
      case "account-purpose":
        return user?.userType === "admin" ? <AccountPurposes /> : null;
      // === Supplier (2 tabs) ===
      case "add-supplier":
        return user?.userType === "admin" ? <SupplierManagement /> : null;
      case "supplier-due":
        return user?.userType === "admin" ? <SupplierDues /> : null;
      case "supplier-purchase-report":
        return user?.userType === "admin" ? <SupplierPurchaseReport /> : null;
      // === Product reports (3 tabs) ===
      case "product-stock-report":
        return user?.userType === "admin" ? <ProductStockReport /> : null;
      case "product-view-report":
        return user?.userType === "admin" ? <ProductViewReport /> : null;
      case "damage-products":
        return user?.userType === "admin" ? <DamageProducts /> : null;
      case "attribute-size":
        return user?.userType === "admin" ? <ProductAttributeManager initialMode="attribute" /> : null;
      // === Campaign / Offer (4 tabs) ===
      case "campaign-list":
        return user?.userType === "admin" ? <CampaignManagement initialMode="list" /> : null;
      case "campaign-image":
        return user?.userType === "admin" ? <CampaignManagement initialMode="image" /> : null;
      case "campaign-slider":
        return user?.userType === "admin" ? <CampaignManagement initialMode="slider" /> : null;
      case "combo-products":
        return user?.userType === "admin" ? <AdminCoupons initialOfferType="combo" /> : null;
      case "landing-pages":
        return user?.userType === "admin" ? <LandingPageManager /> : null;
      case "withdraw-requests":
        return user?.userType === "admin" ? <WithdrawRequestManager /> : null;
      case "merchant-reseller":
        return user?.userType === "admin" ? <MerchantResellerManager /> : null;
      case "report-center":
        return user?.userType === "admin" ? <ReportCenter /> : null;
      case "config-pages":
        return user?.userType === "admin" ? <ConfigPages /> : null;
      // === Setting & Configuration (7 tabs) ===
      case "marketing":
        return user?.userType === "admin" ? <ConfigPages initialMode="marketing" /> : null;
      case "invoice-address":
        return user?.userType === "admin" ? <ConfigPages initialMode="invoice-address" /> : null;
      case "social-login":
        return user?.userType === "admin" ? <ConfigPages initialMode="social-login" /> : null;
      case "sms-api":
        return user?.userType === "admin" ? <ConfigPages initialMode="sms-api" /> : null;
      case "city":
        return user?.userType === "admin" ? <ConfigPages initialMode="city" /> : null;
      case "sub-city":
        return user?.userType === "admin" ? <ConfigPages initialMode="sub-city" /> : null;
      case "domain-setup":
        return user?.userType === "admin" ? <ConfigPages initialMode="domain-setup" /> : null;
      // === Admin access (add / role / permission) ===
      case "add-admin":
        return user?.userType === "admin" ? (
          <ModuleAdminUsers initialMode="add-admin" />
        ) : null;
      case "admin-role":
        return user?.userType === "admin" ? (
          <ModuleAdminUsers initialMode="admin-role" />
        ) : null;
      case "admin-permission":
        return user?.userType === "admin" ? (
          <ModuleAdminUsers initialMode="admin-permission" />
        ) : null;
      case "module-admin-users":
        return user?.userType === "admin" ? (
          <ModuleAdminUsers initialMode="manage-admin" />
        ) : null;
      // === Merchant / Reseller (5 tabs) ===
      case "manage-merchant":
        return user?.userType === "admin" ? <MerchantResellerManager initialMode="manage-merchant" /> : null;
      case "add-merchant":
        return user?.userType === "admin" ? <MerchantResellerManager initialMode="add-merchant" /> : null;
      case "manage-reseller":
        return user?.userType === "admin" ? <MerchantResellerManager initialMode="manage-reseller" /> : null;
      case "add-reseller":
        return user?.userType === "admin" ? <MerchantResellerManager initialMode="add-reseller" /> : null;
      case "payment-invoice":
        return user?.userType === "admin" ? <MerchantResellerManager initialMode="payment-invoice" /> : null;
      case "withdraw-request":
        return user?.userType === "admin" ? <WithdrawRequestManager /> : null;
      // === Free delivery (reuses coupon offer type) ===
      case "free-delivery-products":
        return user?.userType === "admin" ? <AdminCoupons initialOfferType="free_shipping" /> : null;
      // === Reports (10 tabs) ===
      case "profit-loss":
        return user?.userType === "admin" ? <ReportCenter initialMode="profit-loss" /> : null;
      case "product-stock-profit":
        return user?.userType === "admin" ? <ReportCenter initialMode="product-stock-profit" /> : null;
      case "order-report":
        return user?.userType === "admin" ? <ReportCenter initialMode="order-report" /> : null;
      case "office-sale-report":
        return user?.userType === "admin" ? <ReportCenter initialMode="office-sale-report" /> : null;
      case "order-profit":
        return user?.userType === "admin" ? <ReportCenter initialMode="order-profit" /> : null;
      case "sale-profit":
        return user?.userType === "admin" ? <ReportCenter initialMode="sale-profit" /> : null;
      case "purchase-report":
        return user?.userType === "admin" ? <ReportCenter initialMode="purchase-report" /> : null;
      case "supplier-report":
        return user?.userType === "admin" ? <ReportCenter initialMode="supplier-report" /> : null;
      case "stock-report":
        return user?.userType === "admin" ? <ReportCenter initialMode="stock-report" /> : null;
      case "account-report":
        return user?.userType === "admin" ? <ReportCenter initialMode="account-report" /> : null;
      // === Landing page (2 tabs) ===
      case "manage-landing-page":
        return user?.userType === "admin" ? <LandingPageManager initialMode="manage" /> : null;
      case "add-landing-page":
        return user?.userType === "admin" ? <LandingPageManager initialMode="add" /> : null;
      // === Customers (separate from risk) ===
      case "customers":
        return user?.userType === "admin" ? <Customers /> : null;
      default:
        return <DashboardHome user={user} onTabChange={onTabChange} />;
    }
  },
);
TabContent.displayName = "TabContent";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { marketplaceMode, setMarketplaceMode } = usePublicSettings();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("dashboardActiveTab");
      return savedTab || "dashboard";
    }
    return "dashboard";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dashboardTrackOrderNumber, setDashboardTrackOrderNumber] =
    useState(null);
  const contentScrollRef = useRef(null);
  const scrollMemoryRef = useRef({});
  const lastScrollRef = useRef(0);

  const pageMeta = getDashboardTabMeta(activeTab, user);
  const showShellHeader = activeTab !== "dashboard";

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
      dispatch(startNotificationStream());
    }
    return () => {
      dispatch(stopNotificationStream());
    };
  }, [dispatch, user]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Set default tab based on user status on mount / user change
  useEffect(() => {
    if (user) {
      const savedTab = localStorage.getItem("dashboardActiveTab");
      const nextTab = getValidDashboardTab({
        user,
        tab: savedTab,
        marketplaceMode,
      });

      if (nextTab !== activeTab) {
        setActiveTab(nextTab);
      }
      localStorage.setItem("dashboardActiveTab", nextTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Update localStorage whenever activeTab changes
  useEffect(() => {
    if (activeTab && activeTab !== "home") {
      localStorage.setItem("dashboardActiveTab", activeTab);
    }
  }, [activeTab]);

  const handleTabChange = useCallback(
    (tab) => {
      // If it's "home" tab, navigate to homepage
      if (tab === "home") {
        navigate("/");
        return;
      }

      if (
        !canAccessDashboardTab({
          user,
          tab,
          marketplaceMode,
        })
      ) {
        if (tab === "module-super-admin") {
          toast.error("Super admin access required");
        } else {
          toast.error("You do not have access to this module");
        }
        return;
      }

      // Remember where the user was on the current tab before switching.
      try {
        const el = contentScrollRef.current;
        if (el) {
          scrollMemoryRef.current[activeTab] = el.scrollTop;
          lastScrollRef.current = el.scrollTop;
        }
      } catch {
        /* ignore */
      }

      setActiveTab(tab);
      if (isMobile) {
        setIsMobileOpen(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMobile, marketplaceMode, navigate, user, activeTab],
  );

  // Restore the saved scroll position after switching tabs
  useEffect(() => {
    const el = contentScrollRef.current;
    if (!el) return;
    const saved = scrollMemoryRef.current[activeTab];
    if (typeof saved !== "number") {
      el.scrollTop = 0;
      return;
    }

    const timer = setTimeout(() => {
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
      el.scrollTop = Math.min(saved, maxScroll);
    }, 50);

    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    const handleDashboardTabChange = (event) => {
      const tab = String(event?.detail?.tab || "").trim();
      if (!tab) return;
      handleTabChange(tab);
    };

    window.addEventListener("dashboardTabChange", handleDashboardTabChange);
    return () => {
      window.removeEventListener(
        "dashboardTabChange",
        handleDashboardTabChange,
      );
    };
  }, [handleTabChange]);

  useEffect(() => {
    const handleDashboardTrackOrderOpen = (event) => {
      const orderNumber = String(event?.detail?.orderNumber || "").trim();
      if (!orderNumber) return;
      setDashboardTrackOrderNumber(orderNumber);
      handleTabChange("my-order-tracking");
    };

    window.addEventListener(
      "dashboardTrackOrderOpen",
      handleDashboardTrackOrderOpen,
    );
    return () => {
      window.removeEventListener(
        "dashboardTrackOrderOpen",
        handleDashboardTrackOrderOpen,
      );
    };
  }, [handleTabChange]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Dismiss any existing toasts first
    toast.dismiss();

    setActiveTab("dashboard");
    localStorage.removeItem("dashboardActiveTab");
    logout();
    setShowLogoutConfirm(false);
  };

  return (
    <div className="dashboard-ui app-shell dashboard-mobile-shell relative">
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          toggleSidebar={toggleSidebar}
          user={user}
          pageMeta={pageMeta}
        />
      )}

      {/* Content */}
      <div
        className={`app-frame flex relative ${
          isMobile
            ? "dashboard-mobile-frame mt-14 h-[calc(100vh-3.5rem)]"
            : "h-screen rounded-none border-none shadow-none"
        }`}
      >
        <Sidebar
          isMobile={isMobile}
          isMobileOpen={isMobileOpen}
          sidebarOpen={sidebarOpen}
          activeTab={activeTab}
          user={user}
          handleTabChange={handleTabChange}
          toggleSidebar={toggleSidebar}
          setIsMobileOpen={setIsMobileOpen}
          handleLogout={handleLogout}
          isHovered={isHovered}
          setIsHovered={setIsHovered}
        />

        {/* Main Content Area */}
        <div ref={contentScrollRef} className="app-scrollbar relative h-full min-w-0 flex-1 overflow-auto bg-linear-to-br from-slate-50 via-white to-slate-100">
          {/* Rendered Content */}
          <div className="dashboard-content-shell w-full p-3 sm:p-4">
            <div className="dashboard-page-shell w-full min-w-0 space-y-4 sm:space-y-6">
              {showShellHeader ? (
                <div className="dashboard-page-bar app-panel-soft w-full px-4 py-4 sm:px-5 sm:py-5 md:px-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div className="min-w-0">
                      <p className="app-kicker">{pageMeta.section}</p>
                      <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                        {pageMeta.title}
                      </h1>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-[0.95rem]">
                        {pageMeta.description}
                      </p>
                    </div>
                    <div className="app-panel-muted inline-flex w-full items-center justify-center rounded-[22px] px-4 py-3 text-center text-sm font-medium text-slate-600 xl:w-auto xl:text-left">
                      Active module:{" "}
                      <span className="ml-2 font-semibold text-slate-950">
                        {pageMeta.title}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
              <Suspense fallback={<TabLoadingFallback />}>
                <TabContent
                  activeTab={activeTab}
                  user={user}
                  onTabChange={handleTabChange}
                  marketplaceMode={marketplaceMode}
                  dashboardTrackOrderNumber={dashboardTrackOrderNumber}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 app-layer-modal bg-black/40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="app-panel w-full max-w-md overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-black mb-4">
                  <FiLogOut className="h-5 w-5 text-white" />
                </div>

                <h3 className="text-lg font-medium text-black mb-2">
                  Ready to leave?
                </h3>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to sign out of your account?
                </p>

                <div className="flex justify-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmLogout}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg bg-black text-white hover:bg-gray-800 transition-all"
                  >
                    Logout
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
