/**
 * Module registry.
 *
 * Each mounted module exports its configured API path prefix and router.
 * Modules listed here are wired into the app. Shared, cross-cutting modules
 * (payment, vendorEngagement, productEngagement) are pulled in by the modules
 * that depend on them and do not mount their own top-level routes.
 */
const modules = [
  {
    path: "/api/auth",
    name: "auth",
    routes: require("./auth/routes"),
  },
  {
    path: "/api/categories",
    name: "category",
    routes: require("./category/routes"),
  },
  {
    path: "/api/products",
    name: "product",
    routes: require("./product/routes"),
  },
  {
    path: "/api/cart",
    name: "cart",
    routes: require("./cart/routes"),
  },
  {
    path: "/api/orders",
    name: "order",
    routes: require("./order/routes"),
  },
  {
    path: "/api/coupons",
    name: "coupon",
    routes: require("./coupon/routes"),
  },
  {
    path: "/api/banners",
    name: "banner",
    routes: require("./banner/routes"),
  },
  {
    path: "/api/shipping",
    name: "shipping",
    routes: require("./shipping/routes"),
  },
  {
    path: "/api/wishlist",
    name: "wishlist",
    routes: require("./wishlist/routes"),
  },
  {
    path: "/api/accounts",
    name: "account",
    routes: require("./account/routes"),
  },
  {
    path: "/api/landing-pages",
    name: "landingPage",
    routes: require("./landingPage/routes"),
  },
  {
    path: "/api/abandoned-orders",
    name: "abandonedOrder",
    routes: require("./abandonedOrder/routes"),
  },
  {
    path: "/api/reports",
    name: "report",
    routes: require("./report/routes"),
  },
  {
    path: "/api/brands",
    name: "brand",
    routes: require("./brand/routes"),
  },
  {
    path: "/api/contact-submissions",
    name: "contact",
    routes: require("./contact/routes"),
  },
  {
    path: "/api/pos",
    name: "pos",
    routes: require("./pos/routes"),
  },
  {
    path: "/api/suppliers",
    name: "supplier",
    routes: require("./supplier/routes"),
  },
  {
    path: "/api/purchases",
    name: "purchase",
    routes: require("./purchase/routes"),
  },
  {
    path: "/api/campaigns",
    name: "campaign",
    routes: require("./campaign/routes"),
  },
  {
    path: "/api/damage-products",
    name: "damageProduct",
    routes: require("./damageProduct/routes"),
  },
  {
    path: "/api/withdraw-requests",
    name: "withdrawRequest",
    routes: require("./withdrawRequest/routes"),
  },
  {
    path: "/api/order-sources",
    name: "orderSource",
    routes: require("./orderSource/routes"),
  },
  {
    path: "/api/support-tickets",
    name: "supportTicket",
    routes: require("./supportTicket/routes"),
  },
  {
    path: "/api/sms",
    name: "sms",
    routes: require("./sms/routes"),
  },
];

module.exports = { modules };
