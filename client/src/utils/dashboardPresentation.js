const TAB_META = {
  settings: {
    section: "Account",
    title: "Settings",
    description: "Manage your profile, password, and account preferences.",
  },
  "payment-methods": {
    section: "Commerce",
    title: "Payment Methods",
    description: "Configure the payment options customers can use at checkout.",
  },
  notifications: {
    section: "Updates",
    title: "Notifications",
    description:
      "Review live order, payment, review, and contact updates from one place.",
  },
  "create-category": {
    section: "Catalog & Inventory",
    title: "Create Category",
    description:
      "Add a new catalog category and organize the storefront structure.",
  },
  "modify-category": {
    section: "Catalog & Inventory",
    title: "Modify Categories",
    description: "Update category names, hierarchy, and storefront visibility.",
  },
  "create-banner": {
    section: "Brand & Storefront",
    title: "Create Slider Banner",
    description: "Publish new hero slides and storefront promotion banners.",
  },
  "modify-banner": {
    section: "Brand & Storefront",
    title: "Manage Slider Banners",
    description: "Edit existing hero slides and storefront promotion banners.",
  },
  "store-popup": {
    section: "Brand & Storefront",
    title: "Store Popup Notice",
    description: "Manage welcome, promotional or thank-you popup dialog shown on homepage.",
  },
  "highlight-text": {
    section: "Brand & Storefront",
    title: "Highlight Text",
    description: "Manage homepage slider highlight message.",
  },
  "create-product": {
    section: "Catalog & Inventory",
    title: "Create Product",
    description:
      "Add a new product with pricing, stock, media, and marketplace details.",
  },
  "modify-product": {
    section: "Catalog & Inventory",
    title: "Manage Products",
    description:
      "Update product listings, pricing modes, stock, and approval status.",
  },
  "product-approvals": {
    section: "Catalog & Inventory",
    title: "Product Approvals",
    description: "Approve or reject submitted products before they go live.",
  },
  "order-list": {
    section: "Commerce",
    title: "Order List",
    description:
      "Monitor order flow, update statuses, and review payment details.",
  },
  "add-order": {
    section: "Commerce",
    title: "Add Order",
    description: "Create manual orders directly from the dashboard workspace.",
    hideShellHeader: true,
  },
  coupons: {
    section: "Commerce",
    title: "Coupons",
    description: "Create discount codes and control promotional redemptions.",
  },
  "shipping-zones": {
    section: "Commerce",
    title: "Shipping Zones",
    description: "Define delivery regions, rates, and shipping rules.",
  },
  "courier-settings": {
    section: "Commerce",
    title: "Courier Setup",
    description: "Configure courier provider credentials and delivery APIs.",
  },
  "product-reports": {
    section: "Reports & Insights",
    title: "Product Reports",
    description:
      "Review catalog sales, conversion, and product-level performance.",
  },
  "product-reviews": {
    section: "Catalog & Inventory",
    title: "Product Reviews",
    description:
      "Approve, reject, and monitor product review submissions before they go live.",
  },
  "customer-risk": {
    section: "Reports & Insights",
    title: "Customer Risk",
    description: "Inspect high-risk customers and suspicious order behavior.",
  },
  customers: {
    section: "Commerce",
    title: "Customers",
    description: "Review customer profiles, activity, and order relationships.",
  },
  "my-orders": {
    section: "Orders & Lists",
    title: "My Orders",
    description:
      "Track your orders, statuses, payments, and delivery progress.",
  },
  "my-order-tracking": {
    section: "Orders & Lists",
    title: "Order Tracking",
    description:
      "Review a single order's delivery progress, payment details, and cancellation state inside the dashboard.",
  },
  wishlist: {
    section: "Orders & Lists",
    title: "My Wishlist",
    description: "Keep saved products ready for later purchase decisions.",
  },
  "my-addresses": {
    section: "Orders & Lists",
    title: "Saved Addresses",
    description: "Manage delivery locations for faster checkout.",
  },
  "module-subscriptions": {
    section: "Advanced Modules",
    title: "Subscriptions",
    description: "Manage seller or service subscription plans and limits.",
  },
  "module-staff": {
    section: "Advanced Modules",
    title: "Staff Roles",
    description: "Control internal access, assignments, and staff permissions.",
  },
  "module-verifications": {
    section: "Advanced Modules",
    title: "Verification",
    description: "Review KYC and seller verification requests from one queue.",
  },
  "module-abandoned": {
    section: "Advanced Modules",
    title: "Abandoned Orders",
    description:
      "Review recovery opportunities for incomplete checkouts and orders.",
  },
  "module-inventory": {
    section: "Catalog & Inventory",
    title: "Inventory Center",
    description:
      "Control stock levels, low-stock alerts, and public stock visibility.",
  },
  "module-accounts": {
    section: "Operations",
    title: "Accounts",
    description:
      "Track business accounts, ledger movement, and financial records.",
  },
  "module-brands": {
    section: "Catalog & Inventory",
    title: "Brands",
    description: "Create and maintain brand entities used across the catalog.",
  },
  "module-admin-users": {
    section: "Administration",
    title: "Admin Users",
    description:
      "Create and manage admin accounts from the super-admin console.",
  },
  "module-super-admin": {
    section: "Administration",
    title: "Super Admin Control",
    description:
      "Control system-wide marketplace mode and super-admin settings.",
  },
  "module-business-reports": {
    section: "Reports & Insights",
    title: "Business Reports",
    description:
      "Review revenue, operations, and commerce performance metrics.",
  },
  "contacted-list": {
    section: "Support",
    title: "Contacted Users",
    description:
      "Review public contact submissions, follow-up status, and saved admin notes.",
  },
  "module-website-setup": {
    section: "Brand & Storefront",
    title: "Website Header",
    description:
      "Manage the store name, tagline, and navbar logo shown in the site header.",
  },
  "website-footer": {
    section: "Brand & Storefront",
    title: "Website Footer",
    description:
      "Manage contact details, social links, policies, and the footer caption.",
  },
  "website-theme": {
    section: "Brand & Storefront",
    title: "Website Theme Color",
    description:
      "Customize button colors, brand accents, and the browser icon.",
  },
  "website-font": {
    section: "Brand & Storefront",
    title: "Website Font Family",
    description: "Pick the typeface used across the public storefront.",
  },
  "website-pages": {
    section: "Brand & Storefront",
    title: "Website Pages",
    description:
      "Control the About page content and order cancellation rules.",
  },
  "website-template": {
    section: "Brand & Storefront",
    title: "Website Template",
    description: "Choose the storefront home page layout style.",
  },
  "module-seo-analytics": {
    section: "Brand & Storefront",
    title: "SEO & Analytics",
    description:
      "Configure SEO metadata, Facebook Pixel, and Google Analytics for each page.",
  },
  // Setting & Configuration
  marketing: {
    section: "Setting & Configuration",
    title: "Marketing",
    description: "Configure Meta Pixel, Google Analytics, GTM, and TikTok IDs.",
  },
  "invoice-address": {
    section: "Setting & Configuration",
    title: "Invoice Address",
    description: "Set the company details printed on invoices.",
  },
  "social-login": {
    section: "Setting & Configuration",
    title: "Social Login",
    description: "Configure Google and Facebook OAuth credentials.",
  },
  "sms-api": {
    section: "Setting & Configuration",
    title: "SMS API",
    description: "Configure the SMS gateway used for order notifications.",
  },
  city: {
    section: "Setting & Configuration",
    title: "City",
    description: "Manage the supported delivery cities.",
  },
  "sub-city": {
    section: "Setting & Configuration",
    title: "Sub City",
    description: "Manage supported sub cities / areas.",
  },
  "domain-setup": {
    section: "Setting & Configuration",
    title: "Domain Setup",
    description: "Configure custom domain and default site metadata.",
  },
  "free-delivery-products": {
    section: "Campaign / Offer",
    title: "Free Delivery Products",
    description: "Create free-delivery offers on selected products.",
  },
  // Admin access
  "add-admin": {
    section: "Administration",
    title: "Add Admin",
    description: "Create admin accounts and assign roles and permissions.",
  },
  "admin-role": {
    section: "Administration",
    title: "Admin Role",
    description: "Review and update admin role assignments.",
  },
  "admin-permission": {
    section: "Administration",
    title: "Admin Permission",
    description: "Control which modules each admin account can access.",
  },
  // Merchant / Reseller
  "manage-merchant": {
    section: "Merchant / Reseller",
    title: "Manage Merchant",
    description: "Review merchants selling on the platform.",
  },
  "add-merchant": {
    section: "Merchant / Reseller",
    title: "Add Merchant",
    description: "Create a new merchant / vendor account.",
  },
  "manage-reseller": {
    section: "Merchant / Reseller",
    title: "Manage Reseller",
    description: "Review resellers with discounted pricing privileges.",
  },
  "add-reseller": {
    section: "Merchant / Reseller",
    title: "Add Reseller",
    description: "Create a new reseller account.",
  },
  "withdraw-request": {
    section: "Merchant / Reseller",
    title: "Withdraw Requests",
    description: "Review and process merchant / reseller withdrawal requests.",
  },
  "payment-invoice": {
    section: "Merchant / Reseller",
    title: "Payment Invoice",
    description: "Sales are invoiced here from orders and sales records.",
  },
  // Reports
  "profit-loss": {
    section: "Reports",
    title: "Profit / Loss Report",
    description: "Review revenue, expenses, and net profit over a period.",
  },
  "product-stock-profit": {
    section: "Reports",
    title: "Product Stock and Profit",
    description: "Stock position and profit per product.",
  },
  "order-report": {
    section: "Reports",
    title: "Order Report",
    description: "Review order volume and value over a period.",
  },
  "office-sale-report": {
    section: "Reports",
    title: "Office Sale Report",
    description: "Review office sale transactions.",
  },
  "order-profit": {
    section: "Reports",
    title: "Order Profit",
    description: "Profit earned across orders.",
  },
  "sale-profit": {
    section: "Reports",
    title: "Sale Profit",
    description: "Profit earned across sales.",
  },
  "purchase-report": {
    section: "Reports",
    title: "Purchase Report",
    description: "Review purchase transactions over a period.",
  },
  "supplier-report": {
    section: "Reports",
    title: "Supplier Report",
    description: "Review supplier-wise purchase activity.",
  },
  "stock-report": {
    section: "Reports",
    title: "Stock Report",
    description: "Review current stock levels across products.",
  },
  "account-report": {
    section: "Reports",
    title: "Account Report",
    description: "Review ledger and account movement.",
  },
  // Landing page
  "manage-landing-page": {
    section: "Landing Page",
    title: "Manage Landing Page",
    description: "Review and edit campaign-style landing pages.",
  },
  "add-landing-page": {
    section: "Landing Page",
    title: "Add Landing Page",
    description: "Create a new campaign-style landing page.",
  },
};

const toStartCase = (value) =>
  String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

export const getDashboardTabMeta = (tab, user) => {
  const normalizedTab = String(tab || "dashboard").trim();
  if (
    !normalizedTab ||
    normalizedTab === "dashboard" ||
    normalizedTab === "home"
  ) {
    const role = resolveUserRole(user);
    if (role === "admin") {
      return {
        section: "Overview",
        title: isSuperAdminUser(user)
          ? "Super Admin Dashboard"
          : "Admin Dashboard",
        description:
          "See a complete operational view of orders, catalog, inventory, and store activity.",
      };
    }

    return {
      section: "Overview",
      title: "Customer Dashboard",
      description:
        "Manage your orders, wishlist, addresses, and account activity from one dashboard.",
    };
  }

  return (
    TAB_META[normalizedTab] || {
      section: "Workspace",
      title: toStartCase(normalizedTab),
      description:
        "Manage this dashboard module from the same organized workspace.",
    }
  );
};
import { isSuperAdminUser, resolveUserRole } from "./dashboardAccess";
