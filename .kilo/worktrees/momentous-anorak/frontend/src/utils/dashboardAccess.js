const ADMIN_PERMISSION_KEYS = [
  "manageOrders",
  "manageProducts",
  "manageUsers",
  "manageReports",
  "manageWebsite",
];

export const normalizeMarketplaceMode = () => "single";

export const resolveUserRole = (user) => {
  const role = String(user?.userType || "user")
    .trim()
    .toLowerCase();
  return role === "admin" ? "admin" : "user";
};

const hasAnyAdminPermissionConfigured = (permissions) =>
  ADMIN_PERMISSION_KEYS.some((key) =>
    Object.prototype.hasOwnProperty.call(permissions || {}, key),
  );

export const isSuperAdminUser = (user) => {
  const role = resolveUserRole(user);
  if (role !== "admin") return false;
  return user?.adminSettings?.isSuperAdmin === true;
};

export const hasAdminPermission = (user, key) => {
  if (resolveUserRole(user) !== "admin") return false;
  if (!key) return true;

  const permissions =
    user?.adminSettings?.permissions &&
    typeof user.adminSettings.permissions === "object"
      ? user.adminSettings.permissions
      : {};

  if (!hasAnyAdminPermissionConfigured(permissions)) {
    return true;
  }

  return Boolean(permissions[key]);
};

const ADMIN_ALLOWED_TABS = new Set([
  "dashboard",
  "settings",
  "pos",
  "manage-office-sale",
  "company-sale",
  "reseller-sale",
  "sale-exchange",
  "supplier-management",
  "home",
  "notifications",
  "add-order",
  "manage-exchange",
  "add-exchange-order",
  "manage-returns",
  "order-processing-report",
  "order-source",
  "order-processing-note",
  "order-list",
  "shipping-zones",
  "payment-methods",
  "courier-settings",
  "coupons",
  "customers",
  "product-reviews",
  "create-category",
  "modify-category",
  "create-product",
  "modify-product",
  "create-banner",
  "modify-banner",
  "module-brands",
  "module-inventory",
  "module-accounts",
  "product-reports",
  "module-business-reports",
  "customer-risk",
  "contacted-list",
  "module-website-setup",
  "website-footer",
  "website-theme",
  "website-font",
  "website-pages",
  "website-template",
  "module-seo-analytics",
  "module-admin-users",
  "module-super-admin",
  "module-abandoned",
  // Products (extended)
  "attribute-size",
  "variant",
  "product-view-report",
  "product-stock-report",
  "damage-products",
  // Purchase
  "add-purchase",
  "manage-purchase",
  "variant-purchase",
  "fabrics-purchase",
  // Supplier
  "add-supplier",
  "supplier-due",
  "supplier-purchase-report",
  // Category hierarchy
  "sub-category",
  "sub-sub-category",
  // Brand
  "add-brand",
  // Accounts ledger
  "income",
  "expense",
  "due",
  "balance",
  "fund-transfer",
  "account-purpose",
  "employee-salary",
  "bill-statements",
  "loan",
  "withdrawal",
  // Setting & Configuration
  "marketing",
  "invoice-address",
  "social-login",
  "sms-api",
  "city",
  "sub-city",
  "domain-setup",
  // Campaign / Offer
  "campaign-list",
  "campaign-image",
  "campaign-slider",
  "combo-products",
  "free-delivery-products",
  // Admin
  "add-admin",
  "admin-role",
  "admin-permission",
  // Merchant / Reseller
  "manage-merchant",
  "add-merchant",
  "manage-reseller",
  "add-reseller",
  "withdraw-request",
  "payment-invoice",
  // Reports
  "profit-loss",
  "product-stock-profit",
  "order-report",
  "office-sale-report",
  "order-profit",
  "sale-profit",
  "purchase-report",
  "supplier-report",
  "stock-report",
  "account-report",
  // Landing page
  "manage-landing-page",
  "add-landing-page",
]);

const USER_ALLOWED_TABS = new Set([
  "dashboard",
  "settings",
  "home",
  "notifications",
  "my-orders",
  "my-order-tracking",
  "my-addresses",
  "wishlist",
]);

const ADMIN_TAB_PERMISSION_MAP = {
  "add-order": "manageOrders",
  "order-list": "manageOrders",
  "shipping-zones": "manageOrders",
  "payment-methods": "manageOrders",
  "courier-settings": "manageOrders",
  "create-product": "manageProducts",
  "modify-product": "manageProducts",
  "create-category": "manageProducts",
  "modify-category": "manageProducts",
  "module-brands": "manageProducts",
  "module-inventory": "manageProducts",
  customers: "manageUsers",
  "product-reviews": "manageProducts",
  "module-admin-users": "manageUsers",
  "product-reports": "manageReports",
  "module-business-reports": "manageReports",
  "customer-risk": "manageReports",
  "create-banner": "manageWebsite",
  "modify-banner": "manageWebsite",
  "module-website-setup": "manageWebsite",
  "website-footer": "manageWebsite",
  "website-theme": "manageWebsite",
  "website-font": "manageWebsite",
  "website-pages": "manageWebsite",
  "website-template": "manageWebsite",
  "module-seo-analytics": "manageWebsite",
  "contacted-list": "manageWebsite",
  // Products (extended)
  "attribute-size": "manageProducts",
  variant: "manageProducts",
  "product-view-report": "manageReports",
  "product-stock-report": "manageReports",
  "damage-products": "manageProducts",
  // Purchase
  "add-purchase": "manageProducts",
  "manage-purchase": "manageProducts",
  "variant-purchase": "manageProducts",
  "fabrics-purchase": "manageProducts",
  // Supplier reports
  "supplier-due": "manageReports",
  "supplier-purchase-report": "manageReports",
  // Accounts ledger
  income: "manageReports",
  expense: "manageReports",
  due: "manageReports",
  balance: "manageReports",
  "fund-transfer": "manageReports",
  "account-purpose": "manageReports",
  "employee-salary": "manageReports",
  "bill-statements": "manageReports",
  loan: "manageReports",
  withdrawal: "manageReports",
  // Setting & Configuration
  marketing: "manageWebsite",
  "invoice-address": "manageWebsite",
  "social-login": "manageWebsite",
  "sms-api": "manageWebsite",
  city: "manageWebsite",
  "sub-city": "manageWebsite",
  "domain-setup": "manageWebsite",
  // Campaign / Offer
  "campaign-list": "manageWebsite",
  "campaign-image": "manageWebsite",
  "campaign-slider": "manageWebsite",
  // Admin
  "add-admin": "manageUsers",
  "admin-role": "manageUsers",
  "admin-permission": "manageUsers",
  // Merchant / Reseller
  "manage-merchant": "manageUsers",
  "add-merchant": "manageUsers",
  "manage-reseller": "manageUsers",
  "add-reseller": "manageUsers",
  "withdraw-request": "manageUsers",
  "payment-invoice": "manageUsers",
  // Reports
  "profit-loss": "manageReports",
  "product-stock-profit": "manageReports",
  "order-report": "manageReports",
  "office-sale-report": "manageReports",
  "order-profit": "manageReports",
  "sale-profit": "manageReports",
  "purchase-report": "manageReports",
  "supplier-report": "manageReports",
  "stock-report": "manageReports",
  "account-report": "manageReports",
  // Landing page
  "manage-landing-page": "manageWebsite",
  "add-landing-page": "manageWebsite",
};

export const canAccessDashboardTab = ({ user, tab }) => {
  const role = resolveUserRole(user);
  const normalizedTab = String(tab || "").trim();

  if (!normalizedTab) return false;

  if (role === "admin") {
    if (!ADMIN_ALLOWED_TABS.has(normalizedTab)) return false;

    if (
      normalizedTab === "module-super-admin"
    ) {
      return isSuperAdminUser(user);
    }

    const requiredPermission = ADMIN_TAB_PERMISSION_MAP[normalizedTab];
    if (!requiredPermission) return true;

    return hasAdminPermission(user, requiredPermission);
  }

  return USER_ALLOWED_TABS.has(normalizedTab);
};
