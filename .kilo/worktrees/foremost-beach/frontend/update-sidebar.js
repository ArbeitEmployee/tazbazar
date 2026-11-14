const fs = require('fs');

const menuItemsStr = `const MENU_ITEMS = [
  {
    title: "Dashboard",
    icon: FiHome,
    items: [
      { name: "Analytics", tab: "dashboard" }
    ]
  },
  {
    title: "POS / Sale",
    icon: FiShoppingCart,
    items: [
      { name: "Add Sale", tab: "pos" },
      { name: "Manage Office Sale", tab: "manage-office-sale" },
      { name: "Company Sale", tab: "company-sale" },
      { name: "Reseller Sale", tab: "reseller-sale" },
      { name: "Sale Exchange", tab: "sale-exchange" }
    ]
  },
  {
    title: "Orders",
    icon: FiClipboard,
    items: [
      { name: "Manage Order", tab: "order-list" },
      { name: "Add Order", tab: "add-order" },
      { name: "Add Exchange Order", tab: "add-exchange-order" },
      { name: "Order Processing Report", tab: "order-processing-report" },
      { name: "Order Source", tab: "order-source" },
      { name: "Order Processing Note", tab: "order-processing-note" },
      { name: "Courier", tab: "courier-settings" }
    ]
  },
  {
    title: "Products",
    icon: FiPackage,
    items: [
      { name: "Manage Products", tab: "modify-product" },
      { name: "Add Product", tab: "create-product" },
      { name: "Attribute / Size", tab: "attribute-size" },
      { name: "Variant", tab: "variant" },
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
      { name: "Manage Purchase", tab: "manage-purchase" },
      { name: "Variant Purchase", tab: "variant-purchase" },
      { name: "Fabrics Purchase", tab: "fabrics-purchase" }
    ]
  },
  {
    title: "Supplier",
    icon: FiUsers,
    items: [
      { name: "Add Supplier", tab: "add-supplier" },
      { name: "Manage Supplier", tab: "supplier-management" },
      { name: "Supplier Due", tab: "supplier-due" },
      { name: "Supplier Purchase Report", tab: "supplier-purchase-report" }
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
      { name: "Add Slider", tab: "create-banner" }
    ]
  },
  {
    title: "Brand",
    icon: FiPackage,
    items: [
      { name: "Manage Brands", tab: "module-brands" },
      { name: "Add Brand", tab: "add-brand" }
    ]
  },
  {
    title: "Accounts",
    icon: FiDollarSign,
    items: [
      { name: "Income", tab: "income" },
      { name: "Expense", tab: "expense" },
      { name: "Due", tab: "due" },
      { name: "Balance", tab: "balance" },
      { name: "Fund Transfer", tab: "fund-transfer" },
      { name: "Account Purpose", tab: "account-purpose" },
      { name: "Employee Salary", tab: "employee-salary" },
      { name: "Bill Statements", tab: "bill-statements" },
      { name: "Loan", tab: "loan" },
      { name: "Withdrawal", tab: 'withdrawal' }
    ]
  },
  {
    title: "Website Setup",
    icon: FiSettings,
    items: [
      { name: "Header", tab: "module-website-setup" },
      { name: "Footer", tab: "footer-setup" },
      { name: "Theme Color", tab: "theme-color" },
      { name: "Font Family", tab: "font-family" },
      { name: "Pages", tab: "pages-setup" },
      { name: "Template", tab: "template-setup" }
    ]
  },
  {
    title: "Setting & Configuration",
    icon: FiSettings,
    items: [
      { name: "Marketing", tab: "marketing" },
      { name: "Courier API", tab: "courier-api" },
      { name: "Invoice Address", tab: "invoice-address" },
      { name: "Delivery Charge", tab: "delivery-charge" },
      { name: "Payment Setup", tab: "payment-methods" },
      { name: "Social Login", tab: "social-login" },
      { name: "SMS API", tab: "sms-api" },
      { name: "City", tab: "city" },
      { name: "Sub City", tab: "sub-city" },
      { name: "Domain Setup", tab: "domain-setup" }
    ]
  },
  {
    title: "Campaign / Offer",
    icon: FiPackage,
    items: [
      { name: "Offer Banner", tab: "offer-banner" },
      { name: "Campaign", tab: "campaign-list" },
      { name: "Campaign Image", tab: "campaign-image" },
      { name: "Campaign Slider", tab: "campaign-slider" },
      { name: "Combo Products", tab: "combo-products" },
      { name: "Free Delivery Products", tab: "free-delivery-products" },
      { name: "Coupon", tab: "coupons" }
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
      { name: "Customer Message", tab: "contacted-list" },
      { name: "Customer Review", tab: "customer-review" }
    ]
  },
  {
    title: "Merchant / Reseller",
    icon: FiUsers,
    items: [
      { name: "Manage Merchant", tab: "manage-merchant" },
      { name: "Add Merchant", tab: "add-merchant" },
      { name: "Manage Reseller", tab: "manage-reseller" },
      { name: "Add Reseller", tab: "add-reseller" },
      { name: "Withdraw Request", tab: 'withdraw-request' },
      { name: "Payment Invoice", tab: "payment-invoice" }
    ]
  },
  {
    title: "Report",
    icon: FiBarChart2,
    items: [
      { name: "Profit / Loss Report", tab: "profit-loss" },
      { name: "Product Stock and Profit", tab: "product-stock-profit" },
      { name: "Order Report", tab: 'order-report' },
      { name: "Office Sale Report", tab: "office-sale-report" },
      { name: "Order Profit", tab: "order-profit" },
      { name: "Sale Profit", tab: "sale-profit" },
      { name: "Purchase Report", tab: "purchase-report" },
      { name: "Supplier Report", tab: "supplier-report" },
      { name: "Stock Report", tab: "stock-report" },
      { name: "Account Report", tab: "account-report" }
    ]
  },
  {
    title: "Landing Page",
    icon: FiPackage,
    items: [
      { name: "Manage Landing Page", tab: "manage-landing-page" },
      { name: "Add Landing Page", tab: "add-landing-page" }
    ]
  }
];`;

let sidebar = fs.readFileSync('src/components/Dashboard/Sidebar.jsx', 'utf8');

// Replace the existing MENU_ITEMS array
const regex = /const MENU_ITEMS = \[\s*\{[\s\S]*?\n\];/;
sidebar = sidebar.replace(regex, menuItemsStr);

fs.writeFileSync('src/components/Dashboard/Sidebar.jsx', sidebar);
console.log('Sidebar updated successfully');
