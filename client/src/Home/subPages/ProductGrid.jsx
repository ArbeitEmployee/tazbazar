/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "@/lib/routing";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiFilter,
  FiX,
  FiEye,
  FiHeart,
  FiGrid,
  FiList,
  FiShoppingBag,
  FiShuffle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { FaImage } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import usePublicSettings from "../../hooks/usePublicSettings";
import {
  formatDocumentTitle,
  getDefaultPublicSettings,
} from "../../utils/publicSettings";
import { applySeoMetadata } from "../../utils/seoManager";
import {
  applyMarketingTemplate,
  getActiveMarketingEntry,
} from "../../utils/marketingProfiles";
import {
  buildCatalogDataLayerPayload,
  pushDataLayerEvent,
} from "../../utils/marketingDataLayer";
import {
  selectWishlistPendingIds,
  toggleWishlistItem,
} from "../../store/wishlistSlice";
import {
  getPublicStockBadgeText,
  isPublicStockVisible,
} from "../../utils/publicProduct";
import { hasVariantOptionPricing } from "../../utils/productVariants";
import {
  COMPARE_LIMIT_MESSAGE,
  MAX_COMPARE_ITEMS,
  toggleCompareItem,
} from "../../store/compareSlice";
import { createProductSnapshot } from "../../utils/productSnapshot";
import { getProductLink } from "../../utils/productUrl";
import SearchableSelect from "../../components/SearchableSelect";
import StorefrontProductCard from "../components/StorefrontProductCard";
import LandingSectionProductCard from "../components/LandingSectionProductCard";
import { getFullImageUrl } from "../../utils/cloudinary";
import { buildCategoryTree, getCategoryDescendantIds } from "../../utils/publicCategories";
import { useCart } from "../../context/CartContext";
const INITIAL_DISPLAY_LIMIT = 20;

const DEFAULT_STOREFRONT = getDefaultPublicSettings().storefront;

const applyTemplate = (value, replacements = {}) => {
  let resolved = String(value || "").trim();
  Object.entries(replacements).forEach(([key, replacement]) => {
    resolved = resolved.replaceAll(
      `{${key}}`,
      String(replacement || "").trim(),
    );
  });
  return resolved;
};

const getSafeStoreName = (value) => {
  const normalized = String(value || "").trim();
  return normalized.length > 1 ? normalized : "E-Commerce";
};

const stripHtml = (html) => {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, "...")
    .replace(/\s+/g, " ")
    .trim();
};

const ProductGrid = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isProductInCart: isProductInCartById, toggleProductInCart } =
    useCart();
  const compareItems = useSelector((state) => state.compare.items || []);
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const wishlistPendingIds = useSelector(selectWishlistPendingIds);
  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name", label: "Name: A to Z" },
  ];
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCategoryType, setSelectedCategoryType] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState(new Set());
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [collectionType, setCollectionType] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);
  const [allProductsVisible, setAllProductsVisible] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "grid";
    try {
      const savedViewMode = localStorage.getItem("shopViewMode");
      return savedViewMode || "grid"; // Default to grid if nothing saved
    } catch {
      return "grid";
    }
  });
  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [expandedFilters, setExpandedFilters] = useState({
    categories: true,
    price: true,
    brands: true,
    colors: true,
    sizes: true,
    status: true,
  });

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (selectedCategory && selectedCategory !== "all") count += 1;
    if (selectedBrand) count += 1;
    if (selectedColor) count += 1;
    if (selectedSize) count += 1;
    if (inStockOnly) count += 1;
    if (onSaleOnly) count += 1;
    if (searchTerm) count += 1;
    if (sortBy && sortBy !== "featured") count += 1;
    return count;
  }, [
    selectedCategory,
    selectedBrand,
    selectedColor,
    selectedSize,
    inStockOnly,
    onSaleOnly,
    searchTerm,
    sortBy,
  ]);
  const { settings, loaded: settingsLoaded } = usePublicSettings();
  const branding = React.useMemo(
    () => ({
      storeName: getSafeStoreName(settings?.website?.storeName),
      tagline: String(settings?.website?.tagline || "").trim(),
    }),
    [settings],
  );
  const storefront = React.useMemo(
    () => ({
      ...DEFAULT_STOREFRONT,
      ...(settings?.storefront || {}),
    }),
    [settings],
  );
  // Dynamic Color palette extraction from products & variantDefinitions
  const availableColors = React.useMemo(() => {
    const colorMap = new Map();
    const FALLBACK_COLOR_MAP = {
      black: "#000000",
      white: "#FFFFFF",
      red: "#DC2626",
      "apple red": "#8B1E3F",
      blue: "#3B82F6",
      "bio blue": "#1E3A8A",
      green: "#15803D",
      pink: "#E5989B",
      yellow: "#FDE047",
      "sweet orange": "#E07A5F",
      orange: "#F97316",
      gray: "#6B7280",
      grey: "#6B7280",
      purple: "#8B5CF6",
    };

    products.forEach((prod) => {
      const prodColors = new Set();
      // From variantDefinitions
      (prod.variantDefinitions || []).forEach((def) => {
        const isColorPreset =
          String(def.preset || "").toLowerCase() === "color" ||
          /color/i.test(def.name);
        if (isColorPreset && Array.isArray(def.options)) {
          def.options.forEach((opt) => {
            const name = String(opt.label || opt.value || "").trim();
            if (name) {
              const hex =
                opt.colorHex ||
                FALLBACK_COLOR_MAP[name.toLowerCase()] ||
                "#cbd5e1";
              prodColors.add(JSON.stringify({ name, hex }));
            }
          });
        }
      });
      // From colors array
      (prod.colors || []).forEach((c) => {
        const name = String(c || "").trim();
        if (name) {
          const hex = FALLBACK_COLOR_MAP[name.toLowerCase()] || "#cbd5e1";
          prodColors.add(JSON.stringify({ name, hex }));
        }
      });

      prodColors.forEach((str) => {
        const { name, hex } = JSON.parse(str);
        const key = name.toLowerCase();
        if (!colorMap.has(key)) {
          colorMap.set(key, { name, hex, count: 0 });
        }
        colorMap.get(key).count += 1;
      });
    });

    return Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  // Dynamic Size extraction from products & variantDefinitions
  const availableSizes = React.useMemo(() => {
    const sizeMap = new Map();
    const SIZE_ORDER = ["xxs", "xs", "s", "m", "l", "xl", "xxl", "3xl", "4xl", "free size"];

    products.forEach((prod) => {
      const prodSizes = new Set();
      (prod.variantDefinitions || []).forEach((def) => {
        const isSizePreset =
          String(def.preset || "").toLowerCase() === "size" ||
          /size/i.test(def.name);
        if (isSizePreset && Array.isArray(def.options)) {
          def.options.forEach((opt) => {
            const name = String(opt.label || opt.value || "").trim();
            if (name) {
              prodSizes.add(name);
            }
          });
        }
      });

      prodSizes.forEach((name) => {
        const key = name.toLowerCase();
        if (!sizeMap.has(key)) {
          sizeMap.set(key, { name, count: 0 });
        }
        sizeMap.get(key).count += 1;
      });
    });

    return Array.from(sizeMap.values()).sort((a, b) => {
      const idxA = SIZE_ORDER.indexOf(a.name.toLowerCase());
      const idxB = SIZE_ORDER.indexOf(b.name.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products]);

  // Dynamic Stock Status counts
  const stockCounts = React.useMemo(() => {
    let inStock = 0;
    let onSale = 0;

    products.forEach((prod) => {
      const hasStock =
        Number(prod.stock ?? prod.quantity ?? 0) > 0 ||
        (Array.isArray(prod.variations) &&
          prod.variations.some((v) => Number(v.stock || 0) > 0));
      if (hasStock) inStock++;

      const isDiscounted =
        (String(prod.priceType || "single") === "best" &&
          Number(prod.salePrice) > 0 &&
          Number(prod.salePrice) < Number(prod.price)) ||
        (Array.isArray(prod.variations) &&
          prod.variations.some(
            (v) => Number(v.salePrice) > 0 && Number(v.salePrice) < Number(v.price),
          ));
      if (isDiscounted) onSale++;
    });

    return { inStock, onSale };
  }, [products]);

  const catalogBrands = React.useMemo(() => {
    const mergedBrands = [];
    const seen = new Set();

    const addBrand = (brand) => {
      const name = String(brand?.name || brand?.brand || "").trim();
      if (!name) return;

      const key = name.toLowerCase();
      if (seen.has(key)) return;

      seen.add(key);
      mergedBrands.push({
        _id: String(brand?._id || brand?.id || name).trim(),
        name,
        slug: String(brand?.slug || "").trim(),
        description: String(brand?.description || "").trim(),
        logoUrl: String(brand?.logoUrl || brand?.logo || "").trim(),
      });
    };

    (Array.isArray(brands) ? brands : []).forEach(addBrand);
    products.forEach((product) => addBrand({ name: product?.brand || "" }));

    return mergedBrands;
  }, [brands, products]);
  const catalogDataLayerSignatureRef = React.useRef("");

  React.useEffect(() => {
    if (!settings) return;

    const website = settings?.website || {};
    const seo = settings?.seo || {};
    const pageSeo = settings?.seoAnalytics?.pages?.shop || {};
    const hasExplicitEntries = Boolean(
      settings?.seoAnalytics?.hasExplicitEntries,
    );
    const seoEntry = getActiveMarketingEntry(settings, {
      type: "seo",
      pathname: "/shop",
    });
    const storeName =
      String(website.storeName || "E-Commerce").trim() || "E-Commerce";
    const shopTitle = String(
      applyMarketingTemplate(seoEntry?.metaTitle, {
        storeName,
        pageName: "Shop",
      }) ||
        (!hasExplicitEntries ? pageSeo.metaTitle : "") ||
        (!hasExplicitEntries ? seo.metaTitle : "") ||
        storefront?.catalogTitle ||
        "Shop",
    ).trim();
    const shopDescription = String(
      applyMarketingTemplate(seoEntry?.metaDescription, {
        storeName,
        pageName: "Shop",
      }) ||
        (!hasExplicitEntries ? pageSeo.metaDescription : "") ||
        (!hasExplicitEntries ? seo.metaDescription : "") ||
        storefront?.catalogDescription ||
        "",
    ).trim();

    applySeoMetadata({
      title: formatDocumentTitle(settings, shopTitle || "Shop"),
      description: shopDescription,
      keywords: String(
        applyMarketingTemplate(seoEntry?.metaKeywords, {
          storeName,
          pageName: "Shop",
        }) ||
          (!hasExplicitEntries ? pageSeo.metaKeywords : "") ||
          (!hasExplicitEntries ? seo.metaKeywords : "") ||
          "",
      ).trim(),
      image: String(
        applyMarketingTemplate(seoEntry?.openGraphImage, {
          storeName,
          pageName: "Shop",
        }) ||
          (!hasExplicitEntries ? pageSeo.openGraphImage : "") ||
          (!hasExplicitEntries ? seo.openGraphImage : "") ||
          website.headerIconUrl ||
          website.logoUrl ||
          "",
      ).trim(),
      url: typeof window !== "undefined" ? window.location.href : "",
      siteName: storeName,
    });
  }, [settings, storefront?.catalogDescription, storefront?.catalogTitle]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const persistCurrentShopScroll = React.useCallback(() => {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      `shop-scroll:${location.pathname}${location.search}`,
      String(window.scrollY || window.pageYOffset || 0),
    );
  }, [location.pathname, location.search]);

  const getCategoryIdFromProduct = (product) => {
    if (!product?.category) return null;
    return typeof product.category === "string"
      ? product.category
      : product.category._id || null;
  };
  const getProductDisplayPrice = (product) => {
    if (!product) return 0;
    if (String(product.priceType || "single") === "tba") return 0;

    if (
      String(product.marketplaceType || "simple") === "variable" &&
      Array.isArray(product.variations) &&
      product.variations.length > 0
    ) {
      const variationPrices = product.variations
        .filter((variation) => variation?.isActive !== false)
        .map((variation) => {
          const hasSalePrice =
            variation?.salePrice !== null &&
            variation?.salePrice !== undefined &&
            String(variation.salePrice).trim() !== "";
          if (hasSalePrice) {
            const salePrice = Number(variation.salePrice);
            if (Number.isFinite(salePrice) && salePrice >= 0) return salePrice;
          }
          const regularPrice = Number(variation?.price);
          return Number.isFinite(regularPrice) && regularPrice >= 0
            ? regularPrice
            : null;
        })
        .filter((price) => price !== null);

      if (variationPrices.length > 0) {
        return Math.min(...variationPrices);
      }
    }

    const hasSalePrice =
      String(product?.priceType || "single") === "best" &&
      product?.salePrice !== null &&
      product?.salePrice !== undefined &&
      String(product.salePrice).trim() !== "";
    if (hasSalePrice) {
      const salePrice = Number(product.salePrice);
      if (Number.isFinite(salePrice) && salePrice >= 0) return salePrice;
    }

    const regularPrice = Number(product.price);
    if (Number.isFinite(regularPrice) && regularPrice >= 0) return regularPrice;

    return 0;
  };
  const getProductPricing = (product) => {
    const priceType = String(product?.priceType || "single");
    if (priceType === "tba") {
      return {
        priceType,
        isTba: true,
        currentPrice: null,
        previousPrice: null,
        hasDiscount: false,
      };
    }

    const currentPrice = getProductDisplayPrice(product);
    const previousPrice = Number(product?.price || currentPrice || 0);
    const hasDiscount =
      priceType === "best" &&
      Number.isFinite(previousPrice) &&
      previousPrice > Number(currentPrice || 0) &&
      Number(currentPrice || 0) > 0;

    return {
      priceType,
      isTba: false,
      currentPrice,
      previousPrice,
      hasDiscount,
    };
  };
  const getProductCardMetaLine = (product) =>
    product?.dimensions ? `Dim: ${product.dimensions}` : "";
  const visibleProducts = React.useMemo(() => products, [products]);

  const currentCategoryObj = React.useMemo(() => {
    if (!selectedCategory || selectedCategory === "all") return null;
    return (
      categories.find(
        (c) =>
          String(c._id) === String(selectedCategory) ||
          String(c.slug || "").toLowerCase() === String(selectedCategory).toLowerCase() ||
          String(c.name || "").toLowerCase() === String(selectedCategory).toLowerCase()
      ) || null
    );
  }, [categories, selectedCategory]);
  // Calculate product count for each category including all its descendants
  const getCategoryTotalProductCount = React.useCallback(
    (categoryId) => {
      const descendantIds = getCategoryDescendantIds(categoryId, categories);
      return visibleProducts.filter((p) => {
        const prodCatId = getCategoryIdFromProduct(p);
        return descendantIds.includes(String(prodCatId));
      }).length;
    },
    [categories, visibleProducts],
  );

  // Full Hierarchical Category Tree (Root -> Sub -> Sub-Sub)
  const categoryTree = React.useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  // Toggle category tree nodes
  const toggleCategoryExpand = (catId, e) => {
    if (e) e.stopPropagation();
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const visibleCategories = React.useMemo(() => {
    return categories.filter((category) => {
      const hasProduct = visibleProducts.some(
        (product) => getCategoryIdFromProduct(product) === category._id,
      );
      return hasProduct;
    });
  }, [categories, visibleProducts]);
  const visibleCategoryTypes = React.useMemo(() => {
    const types = [];
    visibleCategories.forEach((category) => {
      if (category.type && !types.includes(category.type)) {
        types.push(category.type);
      }
    });
    return types;
  }, [visibleCategories]);

  const isProductCompared = React.useCallback(
    (productId) =>
      compareItems.some(
        (item) => String(item?._id || "") === String(productId || ""),
      ),
    [compareItems],
  );

  const isProductWishlisted = React.useCallback(
    (productId) =>
      wishlistItems.some(
        (item) => String(item?._id || "") === String(productId || ""),
      ),
    [wishlistItems],
  );

  const isProductInCart = React.useCallback(
    (productId) => isProductInCartById(productId),
    [isProductInCartById],
  );

  const handleToggleCompare = React.useCallback(
    (product) => {
      const snapshot = createProductSnapshot(product);
      if (!snapshot) return;
      const exists = compareItems.some(
        (item) => String(item?._id || "") === String(snapshot._id || ""),
      );
      if (!exists && compareItems.length >= MAX_COMPARE_ITEMS) {
        toast.error(COMPARE_LIMIT_MESSAGE);
        return;
      }
      dispatch(toggleCompareItem(snapshot));
    },
    [compareItems, dispatch],
  );

  const handleToggleCart = React.useCallback(
    async (product) => {
      const marketplaceType = String(product?.marketplaceType || "simple")
        .trim()
        .toLowerCase();

      if (["variable", "grouped"].includes(marketplaceType)) {
        persistCurrentShopScroll();
        navigate(getProductLink(product));
        return;
      }

      await toggleProductInCart(product, 1);
    },
    [navigate, persistCurrentShopScroll, toggleProductInCart],
  );

  const handleToggleWishlist = React.useCallback(
    async (product) => {
      await dispatch(toggleWishlistItem(product));
    },
    [dispatch],
  );

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("shopViewMode", mode);
  };
  const collectionLabel =
    collectionType === "deals"
      ? "Daily Deals"
      : collectionType === "new-arrivals"
        ? "New Arrivals"
        : "";
  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    const typeParam = params.get("type");
    const brandParam = params.get("brand");
    const searchParam = params.get("search");
    const collectionParam = String(params.get("collection") || "all")
      .trim()
      .toLowerCase();
    const sortParam = String(params.get("sort") || "")
      .trim()
      .toLowerCase();

    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory("all");
    }

    if (typeParam) {
      setSelectedCategoryType(typeParam);
    } else {
      setSelectedCategoryType("all");
    }

    if (brandParam) {
      setSelectedBrand(String(brandParam).trim());
    } else {
      setSelectedBrand("");
    }

    if (searchParam) {
      setSearchTerm(searchParam);
    } else {
      setSearchTerm("");
    }

    if (["deals", "new-arrivals"].includes(collectionParam)) {
      setCollectionType(collectionParam);
      setSortBy(collectionParam === "new-arrivals" ? "newest" : "featured");
    } else {
      setCollectionType("all");
      if (
        ["featured", "price-low", "price-high", "name", "newest"].includes(
          sortParam,
        )
      ) {
        setSortBy(sortParam);
      } else {
        setSortBy("featured");
      }
    }
  }, [location.search]);

  // Fetch products and categories. Abort the StrictMode duplicate request.
  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    fetchCategories(controller.signal);
    fetchBrands(controller.signal);
    return () => controller.abort();
  }, []);

  // Filter products when dependencies change
  useEffect(() => {
    if (products.length > 0) {
      filterProducts();
    }
  }, [
    products,
    selectedCategory,
    selectedCategoryType,
    selectedBrand,
    selectedColor,
    selectedSize,
    inStockOnly,
    onSaleOnly,
    searchTerm,
    collectionType,
    categories,
    sortBy,
    priceRange,
    visibleProducts,
  ]);
  useEffect(() => {
    // Reset display limit when filters change
    if (!allProductsVisible) {
      setDisplayLimit(INITIAL_DISPLAY_LIMIT);
    }
  }, [
    selectedCategory,
    selectedCategoryType,
    selectedBrand,
    selectedColor,
    selectedSize,
    inStockOnly,
    onSaleOnly,
    searchTerm,
    collectionType,
    priceRange,
    sortBy,
  ]);

  useEffect(() => {
    if (
      !settingsLoaded ||
      !products.length ||
      !categories.length ||
      typeof window === "undefined"
    ) {
      return undefined;
    }

    const visibleCatalogProducts = filteredProducts.slice(0, displayLimit);
    const pagePath = `${location.pathname}${location.search || ""}`;
    const normalizeListKey = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const itemListId = collectionLabel
      ? `collection:${normalizeListKey(collectionType)}`
      : selectedBrand
        ? `brand:${normalizeListKey(selectedBrand)}`
        : selectedCategory !== "all"
          ? `category:${normalizeListKey(selectedCategory)}`
          : "shop";
    const itemListName = collectionLabel
      ? collectionLabel
      : selectedBrand
        ? `${selectedBrand} Products`
        : selectedCategory !== "all" && categoryName
          ? `${categoryName} Products`
          : "All Products";

    const currentSignature = JSON.stringify({
      pageKey: "shop",
      pagePath,
      selectedCategory,
      selectedCategoryType,
      selectedBrand,
      collectionType,
      searchTerm,
      sortBy,
      displayLimit,
      categoryIds: categories.map((category) => String(category?._id || "")),
      brandNames: catalogBrands.map((brand) => String(brand?.name || "")),
      productIds: visibleCatalogProducts.map((product) =>
        String(product?._id || product?.id || ""),
      ),
    });

    if (catalogDataLayerSignatureRef.current === currentSignature) {
      return;
    }

    catalogDataLayerSignatureRef.current = currentSignature;

    const frame = window.requestAnimationFrame(() => {
      pushDataLayerEvent(
        "view_item_list",
        buildCatalogDataLayerPayload({
          pageKey: "shop",
          pagePath,
          itemListId,
          itemListName,
          selectedCategoryId:
            selectedCategory === "all" ? "" : selectedCategory,
          selectedCategoryName:
            selectedCategory === "all" ? "" : categoryName,
          selectedCategoryType,
          selectedBrand,
          collectionType,
          searchTerm,
          sortBy,
          categories,
          brands: catalogBrands,
          catalogProducts: filteredProducts,
          items: visibleCatalogProducts,
        }),
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    categories,
    catalogBrands,
    categoryName,
    collectionLabel,
    collectionType,
    displayLimit,
    filteredProducts,
    location.pathname,
    location.search,
    products.length,
    searchTerm,
    selectedBrand,
    selectedCategory,
    selectedCategoryType,
    settingsLoaded,
    sortBy,
  ]);

  const fetchProducts = async (signal) => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/products/public`, { signal });
      if (response.data.success) {
        const productsData = response.data.products || [];
        setProducts(productsData);

        // Set initial price range based on products
        const prices = productsData.map((p) => getProductDisplayPrice(p));
        const maxPrice = Math.max(...prices) > 0 ? Math.max(...prices) : 10000;
        setPriceRange([0, maxPrice]);
      }
    } catch (error) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") return;
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (signal) => {
    try {
      const response = await axios.get(`${baseUrl}/categories/public`, { signal });
      if (response.data.success) {
        const categoriesData = response.data.categories || [];
        setCategories(categoriesData);

        const params = new URLSearchParams(location.search);
        const categoryParam = params.get("category");

        if (categoryParam) {
          const selectedCat = categoriesData.find(
            (cat) => cat._id === categoryParam,
          );
          if (selectedCat) {
            setCategoryName(selectedCat.name);
          } else {
            setCategoryName("");
          }
        } else {
          setCategoryName("");
        }
      }
    } catch (error) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") return;
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBrands = async (signal) => {
    try {
      const response = await axios.get(`${baseUrl}/brands/public`, { signal });
      if (response.data.success) {
        setBrands(
          Array.isArray(response.data.brands) ? response.data.brands : [],
        );
      }
    } catch (error) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") return;
      console.error("Error fetching brands:", error);
      setBrands([]);
    }
  };

  const filterProducts = () => {
    let filtered = [...visibleProducts];

    // Filter by category (Matches category itself OR any of its sub/sub-sub categories)
    if (selectedCategory !== "all") {
      const matchingCatIds = getCategoryDescendantIds(selectedCategory, categories);

      filtered = filtered.filter((product) => {
        if (!product.category) return false;

        let categoryId;
        if (typeof product.category === "string") {
          categoryId = product.category;
        } else if (product.category._id) {
          categoryId = product.category._id;
        } else {
          return false;
        }

        return matchingCatIds.includes(String(categoryId));
      });

      const selectedCat = categories.find(
        (cat) =>
          cat._id === selectedCategory ||
          cat.slug === selectedCategory ||
          cat.name === selectedCategory,
      );
      setCategoryName(selectedCat?.name || "");
    } else {
      setCategoryName("");
    }

    // Filter by category type
    if (selectedCategoryType !== "all") {
      filtered = filtered.filter((product) => {
        let category = null;
        if (product.category) {
          if (typeof product.category === "string") {
            category = categories.find((cat) => cat._id === product.category);
          } else if (product.category._id) {
            category = categories.find(
              (cat) => cat._id === product.category._id,
            );
          }
        }

        return category && category.type === selectedCategoryType;
      });
    }

    const normalizedBrand = String(selectedBrand || "")
      .trim()
      .toLowerCase();
    if (normalizedBrand) {
      filtered = filtered.filter(
        (product) =>
          String(product?.brand || "")
            .trim()
            .toLowerCase() === normalizedBrand,
      );
    }

    // Filter by Color
    if (selectedColor) {
      const targetColor = selectedColor.toLowerCase();
      filtered = filtered.filter((product) => {
        const matchesColorArray = (product.colors || []).some(
          (c) => String(c).trim().toLowerCase() === targetColor,
        );
        if (matchesColorArray) return true;

        const matchesDef = (product.variantDefinitions || []).some((def) => {
          const isColorPreset =
            String(def.preset || "").toLowerCase() === "color" ||
            /color/i.test(def.name);
          return (
            isColorPreset &&
            (def.options || []).some(
              (opt) =>
                String(opt.label || opt.value || "").trim().toLowerCase() ===
                targetColor,
            )
          );
        });
        return matchesDef;
      });
    }

    // Filter by Size
    if (selectedSize) {
      const targetSize = selectedSize.toLowerCase();
      filtered = filtered.filter((product) => {
        return (product.variantDefinitions || []).some((def) => {
          const isSizePreset =
            String(def.preset || "").toLowerCase() === "size" ||
            /size/i.test(def.name);
          return (
            isSizePreset &&
            (def.options || []).some(
              (opt) =>
                String(opt.label || opt.value || "").trim().toLowerCase() ===
                targetSize,
            )
          );
        });
      });
    }

    // Filter by Product Status: In Stock
    if (inStockOnly) {
      filtered = filtered.filter((product) => {
        const stockQty = Number(product.stock ?? product.quantity ?? 0);
        const hasVariationStock =
          Array.isArray(product.variations) &&
          product.variations.some((v) => Number(v.stock || 0) > 0);
        return stockQty > 0 || hasVariationStock;
      });
    }

    // Filter by Product Status: On Sale
    if (onSaleOnly) {
      filtered = filtered.filter((product) => {
        const pricing = getProductPricing(product);
        return pricing.hasDiscount;
      });
    }

    // Filter by search term
    const trimmedSearch = (searchTerm || "").trim().toLowerCase();
    if (trimmedSearch) {
      filtered = filtered.filter((product) => {
        const title = (product.title || "").toLowerCase();
        const description = (product.description || "").toLowerCase();
        const brand = (product.brand || "").toLowerCase();
        const productType = (product.productType || "").toLowerCase();
        const marketplaceType = (product.marketplaceType || "").toLowerCase();
        const categoryNameText =
          (typeof product.category === "object"
            ? product.category?.name
            : "") || "";

        return (
          title.includes(trimmedSearch) ||
          description.includes(trimmedSearch) ||
          brand.includes(trimmedSearch) ||
          productType.includes(trimmedSearch) ||
          marketplaceType.includes(trimmedSearch) ||
          categoryNameText.toLowerCase().includes(trimmedSearch)
        );
      });
    }

    if (collectionType === "deals") {
      filtered = filtered.filter(
        (product) => getProductPricing(product).hasDiscount,
      );
    }

    // Filter by price range
    filtered = filtered.filter((product) => {
      if (String(product?.priceType || "single") === "tba") return true;
      const price = getProductDisplayPrice(product);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort products
    switch (sortBy) {
      case "price-low":
        filtered.sort(
          (a, b) => getProductDisplayPrice(a) - getProductDisplayPrice(b),
        );
        break;
      case "price-high":
        filtered.sort(
          (a, b) => getProductDisplayPrice(b) - getProductDisplayPrice(a),
        );
        break;
      case "name":
        filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b?.createdAt || 0).getTime() -
            new Date(a?.createdAt || 0).getTime(),
        );
        break;
      case "featured":
      default:
        if (collectionType === "new-arrivals") {
          filtered.sort(
            (a, b) =>
              new Date(b?.createdAt || 0).getTime() -
              new Date(a?.createdAt || 0).getTime(),
          );
        }
        break;
    }

    setFilteredProducts(filtered);
  };

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://") ||
      imagePath.startsWith("data:")
    ) {
      return imagePath;
    }
    if (imagePath.startsWith("/")) {
      return baseUrl ? `${baseUrl}${imagePath}` : imagePath;
    }
    return baseUrl
      ? `${baseUrl}/uploads/products/${imagePath}`
      : `/uploads/products/${imagePath}`;
  };

  // Helper function to get category type for a product
  const getCategoryTypeForProduct = (product) => {
    if (!product.category) return null;

    let category = null;
    if (typeof product.category === "string") {
      category = categories.find((cat) => cat._id === product.category);
    } else if (product.category._id) {
      category = categories.find((cat) => cat._id === product.category._id);
    }

    return category?.type || null;
  };

  // Helper function to get category name for a product
  const getCategoryNameForProduct = (product) => {
    if (!product.category) return null;

    let category = null;
    if (typeof product.category === "string") {
      category = categories.find((cat) => cat._id === product.category);
    } else if (product.category._id) {
      category = categories.find((cat) => cat._id === product.category._id);
    }

    return category?.name || null;
  };

  const highlightText = (text, term) => {
    if (!text || !term) return text;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = String(text).split(regex);
    return parts.map((part, idx) =>
      regex.test(part) ? (
        <span key={idx} className="bg-yellow-200 text-black px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedCategoryType("all");
    setSelectedBrand("");
    setSelectedColor("");
    setSelectedSize("");
    setInStockOnly(false);
    setOnSaleOnly(false);
    setCategoryName("");
    setSearchTerm("");
    setSortBy("featured");

    // Reset price range to initial values
    const prices = products.map((p) => getProductDisplayPrice(p));
    const maxPrice = Math.max(...prices) > 0 ? Math.max(...prices) : 10000;
    setPriceRange([0, maxPrice]);

    // Clear URL parameters
    navigate("/shop", { replace: true });
  };

  const toggleFilterSection = (section) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const ProductImage = ({ src, alt, className = "" }) => {
    const [imgSrc, setImgSrc] = useState(getFullImageUrl(src));
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      setImgSrc(getFullImageUrl(src));
      setHasError(false);
    }, [src]);

    const handleError = () => {
      setHasError(true);
      if (src && src.startsWith("/uploads/products/")) {
        const altUrl = `${baseUrl}${src}`;
        if (altUrl !== imgSrc) {
          setImgSrc(altUrl);
          setHasError(false);
        }
      }
    };

    if (hasError || !imgSrc) {
      return (
        <div
          className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        >
          <FaImage className="text-2xl mb-2" />
          <span className="text-xs">No Image</span>
        </div>
      );
    }

    const isRemote =
      imgSrc?.startsWith("http://") || imgSrc?.startsWith("https://");

    return (
      <img
        src={imgSrc}
        alt={alt}
        className={`object-cover ${className}`}
        onError={handleError}
        loading="lazy"
        decoding="async"
        crossOrigin={isRemote ? "anonymous" : undefined}
      />
    );
  };
  const handleViewMore = () => {
    if (!allProductsVisible) {
      // Show all products
      setAllProductsVisible(true);
      setDisplayLimit(filteredProducts.length);
    } else {
      // Reset to initial shelf size
      setAllProductsVisible(false);
      setDisplayLimit(INITIAL_DISPLAY_LIMIT);
    }
  };
  const LoadingSkeleton = () => (
    <section className="bg-[#f5f5f5] py-4 md:py-8 lg:py-12">
      <div className="site-shell">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Desktop Filters Skeleton */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-100 animate-pulse rounded-2xl h-48"
                ></div>
              ))}
            </div>
          </div>

          {/* Products Grid Skeleton */}
          <div className="lg:col-span-3">
            <div className="storefront-card-grid">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="storefront-card-grid__item bg-gray-100 animate-pulse rounded-2xl h-64 sm:h-72 md:h-80"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  if (loading) return <LoadingSkeleton />;

  const publicStockSummaryEnabled = Boolean(
    settings?.publicStockSummaryEnabled ??
    settings?.marketplace?.publicStockSummaryEnabled,
  );
  const catalogProductCount = products.length;
  const catalogDealCount = products.filter(
    (product) => getProductPricing(product).hasDiscount,
  ).length;
  const catalogStockUnits = products.reduce((total, product) => {
    if (String(product?.priceType || "single").toLowerCase() === "tba") {
      return total;
    }

    const stock = Number(product?.stock || 0);
    return stock > 0 ? total + stock : total;
  }, 0);
  const totalCategoryCount = visibleCategories.length;
  const tbaProductCount = filteredProducts.filter(
    (product) => String(product?.priceType || "single").toLowerCase() === "tba",
  ).length;
  const storeName = getSafeStoreName(branding.storeName);
  const tagline = String(branding.tagline || "").trim();
  const catalogTitle =
    applyTemplate(storefront?.catalogTitle, { storeName }) ||
    applyTemplate(DEFAULT_STOREFRONT.catalogTitle, { storeName });
  const catalogDescription =
    String(
      storefront?.catalogDescription || DEFAULT_STOREFRONT.catalogDescription,
    ).trim() || DEFAULT_STOREFRONT.catalogDescription;

  const renderFilterContent = (isMobile = false) => (
    <div className="space-y-6">
      {/* Product Categories Section with Hierarchical Sub & Sub-Sub Accordions */}
      <div className="border-b border-slate-200/80 pb-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => toggleFilterSection("categories")}
            className="flex-1 flex items-center justify-between text-left cursor-pointer group py-1"
          >
            <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-black">
              Product Categories
            </h3>
            <span className="p-1 rounded-md text-slate-400 group-hover:text-black transition-colors">
              {expandedFilters.categories ? (
                <FiChevronUp className="w-4 h-4" />
              ) : (
                <FiChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>
          {selectedCategory !== "all" && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                navigate("/shop");
                if (isMobile) setShowMobileFilters(false);
              }}
              className="ml-2 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {expandedFilters.categories && (
          <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar mt-3">
            {/* All Categories Option */}
            <button
              onClick={() => {
                setSelectedCategory("all");
                navigate("/shop");
                if (isMobile) setShowMobileFilters(false);
              }}
              className={`group flex w-full items-center justify-between py-2 px-2.5 rounded-xl text-sm transition-colors text-left cursor-pointer ${
                selectedCategory === "all"
                  ? "font-bold text-black bg-slate-100"
                  : "text-slate-600 hover:text-black hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    selectedCategory === "all"
                      ? "bg-black"
                      : "bg-transparent group-hover:bg-slate-300"
                  }`}
                />
                All Categories
              </span>
            </button>

            {/* Hierarchical Tree Render */}
            {categoryTree.map((mainCat) => {
              const isMainSelected =
                selectedCategory === mainCat._id ||
                selectedCategory === mainCat.name ||
                selectedCategory === mainCat.slug;
              const hasSub =
                Array.isArray(mainCat.children) && mainCat.children.length > 0;
              const isExpanded = expandedCategoryIds.has(mainCat._id);

              return (
                <div key={mainCat._id} className="flex flex-col">
                  {/* Main Category Row */}
                  <div
                    className={`group flex items-center justify-between py-2 px-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                      isMainSelected
                        ? "font-bold text-black bg-slate-100"
                        : "text-slate-700 hover:text-black hover:bg-slate-50"
                    }`}
                  >
                    <div
                      onClick={() => {
                        setSelectedCategory(mainCat._id);
                        navigate(`/shop?category=${mainCat._id}`);
                        if (isMobile) setShowMobileFilters(false);
                      }}
                      className="flex items-center gap-2 truncate flex-1 pr-2"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          isMainSelected
                            ? "bg-black"
                            : "bg-transparent group-hover:bg-slate-300"
                        }`}
                      />
                      <span className="truncate">{mainCat.name}</span>
                    </div>

                    {hasSub && (
                      <button
                        type="button"
                        onClick={(e) => toggleCategoryExpand(mainCat._id, e)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
                        title={
                          isExpanded
                            ? "Collapse subcategories"
                            : "Expand subcategories"
                        }
                      >
                        <FiChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-black font-bold" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Level 2: Subcategories */}
                  {hasSub && isExpanded && (
                    <div className="pl-4 ml-3 border-l-2 border-slate-200/90 space-y-1 my-1.5">
                      {mainCat.children.map((subCat) => {
                        const isSubSelected =
                          selectedCategory === subCat._id ||
                          selectedCategory === subCat.name ||
                          selectedCategory === subCat.slug;
                        const hasSubSub =
                          Array.isArray(subCat.children) &&
                          subCat.children.length > 0;
                        const isSubExpanded = expandedCategoryIds.has(
                          subCat._id,
                        );

                        return (
                          <div key={subCat._id} className="flex flex-col">
                            <div
                              className={`group/sub flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer ${
                                isSubSelected
                                  ? "font-bold text-black bg-slate-100"
                                  : "text-slate-600 hover:text-black hover:bg-slate-50"
                              }`}
                            >
                              <div
                                onClick={() => {
                                  setSelectedCategory(subCat._id);
                                  navigate(`/shop?category=${subCat._id}`);
                                  if (isMobile) setShowMobileFilters(false);
                                }}
                                className="flex items-center gap-2 truncate flex-1 pr-2"
                              >
                                <span className="text-slate-300 group-hover/sub:text-slate-500 font-mono">
                                  ↳
                                </span>
                                <span className="truncate">{subCat.name}</span>
                              </div>

                              {hasSubSub && (
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    toggleCategoryExpand(subCat._id, e)
                                  }
                                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200/80 text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
                                  title={isSubExpanded ? "Collapse" : "Expand"}
                                >
                                  <FiChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      isSubExpanded ? "rotate-180 text-black" : ""
                                    }`}
                                  />
                                </button>
                              )}
                            </div>

                            {/* Level 3: Sub-Subcategories */}
                            {hasSubSub && isSubExpanded && (
                              <div className="pl-4 ml-3 border-l-2 border-slate-200/80 space-y-0.5 my-1">
                                {subCat.children.map((subSubCat) => {
                                  const isSubSubSelected =
                                    selectedCategory === subSubCat._id ||
                                    selectedCategory === subSubCat.name ||
                                    selectedCategory === subSubCat.slug;

                                  return (
                                    <button
                                      key={subSubCat._id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedCategory(subSubCat._id);
                                        navigate(
                                          `/shop?category=${subSubCat._id}`,
                                        );
                                        if (isMobile)
                                          setShowMobileFilters(false);
                                      }}
                                      className={`group/subsub flex w-full items-center justify-between py-1.5 px-2 rounded-md text-[11px] text-left transition-colors cursor-pointer ${
                                        isSubSubSelected
                                          ? "font-bold text-black bg-slate-100"
                                          : "text-slate-500 hover:text-black hover:bg-slate-50"
                                      }`}
                                    >
                                      <span className="flex items-center gap-2 truncate">
                                        <span className="h-1 w-1 rounded-full bg-slate-300 group-hover/subsub:bg-black" />
                                        <span className="truncate">
                                          {subSubCat.name}
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter by Price */}
      <div className="border-b border-slate-200/80 pb-4">
        <button
          type="button"
          onClick={() => toggleFilterSection("price")}
          className="w-full flex items-center justify-between text-left py-1 cursor-pointer group"
        >
          <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-black">
            Filter by price
          </h3>
          <span className="p-1 rounded-md text-slate-400 group-hover:text-black transition-colors">
            {expandedFilters.price ? (
              <FiChevronUp className="w-4 h-4" />
            ) : (
              <FiChevronDown className="w-4 h-4" />
            )}
          </span>
        </button>

        {expandedFilters.price && (
          <div className="space-y-4 mt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>৳{priceRange[0]}</span>
              <span>৳{priceRange[1]}</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(10000, ...products.map((p) => getProductDisplayPrice(p)))}
              step="50"
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange([priceRange[0], Number(e.target.value)])
              }
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                Price:{" "}
                <strong className="text-black">
                  ৳{priceRange[0]} — ৳{priceRange[1]}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  filterProducts();
                  if (isMobile) setShowMobileFilters(false);
                }}
                className="rounded-md bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-800 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
              >
                Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Brands Filter */}
      {catalogBrands.length > 0 && (
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => toggleFilterSection("brands")}
              className="flex-1 flex items-center justify-between text-left cursor-pointer group py-1"
            >
              <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-black">
                Filter by Brand
              </h3>
              <span className="p-1 rounded-md text-slate-400 group-hover:text-black transition-colors">
                {expandedFilters.brands ? (
                  <FiChevronUp className="w-4 h-4" />
                ) : (
                  <FiChevronDown className="w-4 h-4" />
                )}
              </span>
            </button>
            {selectedBrand && (
              <button
                onClick={() => setSelectedBrand("")}
                className="ml-2 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {expandedFilters.brands && (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar mt-3">
              {catalogBrands.map((brand) => (
                <button
                  key={brand._id || brand.name}
                  onClick={() => {
                    setSelectedBrand(
                      selectedBrand === brand.name ? "" : brand.name,
                    );
                  }}
                  className={`flex w-full items-center justify-between py-1.5 px-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                    selectedBrand === brand.name
                      ? "font-bold text-black bg-slate-100"
                      : "text-slate-600 hover:text-black hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{brand.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Filter by Color */}
      {availableColors.length > 0 && (
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => toggleFilterSection("colors")}
              className="flex-1 flex items-center justify-between text-left cursor-pointer group py-1"
            >
              <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-black">
                Filter by Color
              </h3>
              <span className="p-1 rounded-md text-slate-400 group-hover:text-black transition-colors">
                {expandedFilters.colors ? (
                  <FiChevronUp className="w-4 h-4" />
                ) : (
                  <FiChevronDown className="w-4 h-4" />
                )}
              </span>
            </button>
            {selectedColor && (
              <button
                onClick={() => setSelectedColor("")}
                className="ml-2 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {expandedFilters.colors && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar mt-3">
              {availableColors.map((color) => {
                const isSelected =
                  selectedColor.toLowerCase() === color.name.toLowerCase();
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() =>
                      setSelectedColor(isSelected ? "" : color.name)
                    }
                    className={`group flex w-full items-center justify-between py-1 px-1.5 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "font-bold text-black bg-slate-100"
                        : "text-slate-700 hover:text-black hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-sm">{color.name}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      ({color.count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Filter by Size */}
      {availableSizes.length > 0 && (
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => toggleFilterSection("sizes")}
              className="flex-1 flex items-center justify-between text-left cursor-pointer group py-1"
            >
              <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-black">
                Filter by Size
              </h3>
              <span className="p-1 rounded-md text-slate-400 group-hover:text-black transition-colors">
                {expandedFilters.sizes ? (
                  <FiChevronUp className="w-4 h-4" />
                ) : (
                  <FiChevronDown className="w-4 h-4" />
                )}
              </span>
            </button>
            {selectedSize && (
              <button
                onClick={() => setSelectedSize("")}
                className="ml-2 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {expandedFilters.sizes && (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar mt-3">
              {availableSizes.map((size) => {
                const isSelected =
                  selectedSize.toLowerCase() === size.name.toLowerCase();
                return (
                  <button
                    key={size.name}
                    type="button"
                    onClick={() =>
                      setSelectedSize(isSelected ? "" : size.name)
                    }
                    className={`group flex w-full items-center justify-between py-1.5 px-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "font-bold text-black bg-slate-100"
                        : "text-slate-700 hover:text-black hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
                          isSelected
                            ? "bg-black border-black text-white"
                            : "border-slate-300 bg-white group-hover:border-slate-400"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                      <span className="text-sm">{size.name}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      ({size.count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Product Status */}
      <div className="border-b border-slate-200/80 pb-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => toggleFilterSection("status")}
            className="flex-1 flex items-center justify-between text-left cursor-pointer group py-1"
          >
            <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-black">
              Product Status
            </h3>
            <span className="p-1 rounded-md text-slate-400 group-hover:text-black transition-colors">
              {expandedFilters.status ? (
                <FiChevronUp className="w-4 h-4" />
              ) : (
                <FiChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>
          {(inStockOnly || onSaleOnly) && (
            <button
              onClick={() => {
                setInStockOnly(false);
                setOnSaleOnly(false);
              }}
              className="ml-2 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {expandedFilters.status && (
          <div className="space-y-2 mt-3">
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`group flex w-full items-center justify-between py-1.5 px-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                inStockOnly
                  ? "font-bold text-black bg-slate-100"
                  : "text-slate-700 hover:text-black hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
                    inStockOnly
                      ? "bg-black border-black text-white"
                      : "border-slate-300 bg-white group-hover:border-slate-400"
                  }`}
                >
                  {inStockOnly ? "✓" : ""}
                </span>
                <span>In Stock</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({stockCounts.inStock})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOnSaleOnly(!onSaleOnly)}
              className={`group flex w-full items-center justify-between py-1.5 px-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                onSaleOnly
                  ? "font-bold text-black bg-slate-100"
                  : "text-slate-700 hover:text-black hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
                    onSaleOnly
                      ? "bg-black border-black text-white"
                      : "border-slate-300 bg-white group-hover:border-slate-400"
                  }`}
                >
                  {onSaleOnly ? "✓" : ""}
                </span>
                <span>On Sale</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({stockCounts.onSale})
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Reset All Filters Button */}
      {(selectedCategory !== "all" ||
        selectedBrand ||
        selectedColor ||
        selectedSize ||
        inStockOnly ||
        onSaleOnly ||
        searchTerm ||
        sortBy !== "featured") && (
        <button
          onClick={() => {
            resetFilters();
            if (isMobile) setShowMobileFilters(false);
          }}
          className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );

  return (
    <section className="min-h-screen bg-[#fafafa]">
      {/* Main Content with Left Sidebar & Right Products Area */}
      <div className="site-shell pt-6 sm:pt-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-10">
          
          {/* =========================================================================
              LEFT SIDEBAR: Product Categories, Price, Brands (Matching Clotya Layout)
             ========================================================================= */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="storefront-sticky-offset sticky space-y-8 pr-2">
              {renderFilterContent(false)}
            </div>
          </div>

          {/* =========================================================================
              RIGHT AREA: Category Hero Banner on Top + Controls + Product Grid
             ========================================================================= */}
          <div className="lg:col-span-3 flex flex-col min-w-0">
            
            {/* Clotya-Style Category Banner (Right on top of products) */}
            <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs">
              {currentCategoryObj && currentCategoryObj.image ? (
                /* Banner with Category Image */
                <div className="relative h-48 sm:h-60 md:h-72 w-full overflow-hidden flex items-center justify-between bg-slate-100">
                  <div className="relative z-10 max-w-[55%] sm:max-w-[50%] p-6 sm:p-10 md:p-12 flex flex-col justify-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                      {currentCategoryObj.name}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {currentCategoryObj.description || "Discover the latest collection and handpicked styles curated for you."}
                    </p>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-[55%] sm:w-[60%] overflow-hidden pointer-events-none select-none">
                    <img
                      src={getFullImageUrl(currentCategoryObj.image, 1200)}
                      alt={currentCategoryObj.name}
                      className="h-full w-full object-cover object-center [mask-image:linear-gradient(to_left,black_75%,transparent_100%)]"
                    />
                  </div>
                </div>
              ) : currentCategoryObj ? (
                /* Banner without Category Image */
                <div className="p-8 sm:p-10 md:p-12 bg-gradient-to-r from-slate-100 via-slate-50 to-amber-50/40">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Category
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 mt-1">
                    {currentCategoryObj.name}
                  </h2>
                  <p className="mt-2 max-w-xl text-xs sm:text-sm text-slate-600 line-clamp-2">
                    {currentCategoryObj.description || "Browse top products and exclusive collections in this category."}
                  </p>
                </div>
              ) : (
                /* Default Banner for All Products (Matching Clotya Aesthetic) */
                <div className="relative h-48 sm:h-60 md:h-72 w-full overflow-hidden flex items-center justify-between bg-gradient-to-r from-[#f7f5f0] via-[#f1eee6] to-[#e8e2d5] p-6 sm:p-10 md:p-12">
                  <div className="relative z-10 max-w-md">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800/80">
                      Exclusive Collection
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight mt-1">
                      {storeName} Store
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {tagline || "Discover top trending items, premium selections, and everyday essentials curated for you."}
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end justify-center pr-4 z-10">
                    <span className="text-3xl font-black text-slate-900">
                      {filteredProducts.length}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                      Total Items
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <div className="lg:hidden mb-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 cursor-pointer"
              >
                <FiFilter className="h-4 w-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white px-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Sorting & Results Bar (Exact Clotya Layout: Grid Icons + Showing X-Y + Sort by) */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
              {/* Left: Grid/List switch + Showing results count */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSetViewMode("grid")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-slate-900 text-white"
                        : "text-slate-400 hover:text-slate-900"
                    }`}
                    title="Grid View"
                  >
                    <FiGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleSetViewMode("list")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === "list"
                        ? "bg-slate-900 text-white"
                        : "text-slate-400 hover:text-slate-900"
                    }`}
                    title="List View"
                  >
                    <FiList className="h-4 w-4" />
                  </button>
                </div>

                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  Showing 1–{Math.min(displayLimit, filteredProducts.length)} of {filteredProducts.length} results
                </span>
              </div>

              {/* Right: Sort Dropdown */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
                <div className="w-[180px]">
                  <SearchableSelect
                    value={sortBy}
                    onChange={setSortBy}
                    options={sortOptions}
                    placeholder="Sort by"
                    searchable={false}
                    className="min-w-0"
                    buttonClassName="h-9 rounded-xl border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs"
                    menuClassName="rounded-xl border-slate-200 p-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Product Grid Area */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  No Products Found
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  Try adjusting your filters or check back later.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid View with Home Page Product Card */
              <>
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-5">
                  {filteredProducts.slice(0, displayLimit).map((product) => (
                    <LandingSectionProductCard
                      key={product._id}
                      product={product}
                      onViewDetails={() => {
                        persistCurrentShopScroll();
                        navigate(getProductLink(product));
                      }}
                    />
                  ))}
                </div>

                {filteredProducts.length > INITIAL_DISPLAY_LIMIT && (
                  <div className="text-center mt-10">
                    <button
                      onClick={handleViewMore}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold hover:bg-black transition-colors text-xs shadow-xs cursor-pointer"
                    >
                      {allProductsVisible ? (
                        <>
                          <FiChevronUp className="inline mr-1.5" />
                          Show Less
                        </>
                      ) : (
                        <>
                          Load More Products ({filteredProducts.length - displayLimit} more)
                          <FiChevronDown className="inline ml-1.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* List (Row) View - Fully Responsive & Overflow Proof */
              <div className="flex flex-col gap-4 min-w-0">
                {filteredProducts.slice(0, displayLimit).map((product) => {
                  const pricing = getProductPricing(product);
                  const productId = product._id || product.id;
                  const isWishlisted = isProductWishlisted(productId);
                  const inCart = isProductInCart(productId);
                  const ratingValue = Number(product?.ratingAverage || product?.rating || 5.0);
                  const reviewCount = Number(product?.ratingCount || product?.numReviews || 1);
                  const cleanDesc = stripHtml(product.description);
                  const discountLabel =
                    pricing.hasDiscount && pricing.previousPrice > pricing.currentPrice
                      ? `${Math.round(((pricing.previousPrice - pricing.currentPrice) / pricing.previousPrice) * 100)}% OFF`
                      : "";

                  return (
                    <article
                      key={product._id}
                      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all duration-300 p-3 sm:p-4.5 flex flex-col sm:flex-row gap-4 sm:gap-5 relative overflow-hidden min-w-0"
                    >
                      {/* Product Image */}
                      <Link
                        to={getProductLink(product)}
                        onClick={persistCurrentShopScroll}
                        className="relative h-48 sm:h-40 w-full sm:w-44 rounded-xl overflow-hidden bg-slate-100 shrink-0 select-none block"
                      >
                        <img
                          src={getFullImageUrl(product.images?.[0] || product.image, 600)}
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        {discountLabel && (
                          <span className="absolute top-2 left-2 z-10 rounded-md bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase shadow-xs">
                            {discountLabel}
                          </span>
                        )}
                      </Link>

                      {/* Product Details (min-w-0 flex-1 so text never overflows) */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                              {product.category?.name || "General"}
                            </span>

                            {/* Rating */}
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-amber-400 text-xs">★</span>
                              <span className="text-xs font-bold text-slate-700">
                                {ratingValue.toFixed(1)}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                ({reviewCount})
                              </span>
                            </div>
                          </div>

                          <Link
                            to={getProductLink(product)}
                            onClick={persistCurrentShopScroll}
                            className="block"
                          >
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 line-clamp-1 hover:text-blue-600 transition-colors break-words">
                              {product.title}
                            </h3>
                          </Link>

                          {cleanDesc && (
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed break-words">
                              {cleanDesc}
                            </p>
                          )}

                          {/* Brand / Stock meta */}
                          {product.brand && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                                {product.brand}
                              </span>
                              {product.stock <= 5 && product.stock > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-[10px] font-bold text-amber-700">
                                  Only {product.stock} left
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Pricing & Actions */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base sm:text-lg font-black text-slate-900">
                              ৳{pricing.currentPrice}
                            </span>
                            {pricing.hasDiscount && pricing.previousPrice > pricing.currentPrice && (
                              <span className="text-xs text-slate-400 line-through font-medium">
                                ৳{pricing.previousPrice}
                              </span>
                            )}
                          </div>

                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleWishlist(product)}
                              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                              className={`p-2 rounded-xl border border-slate-200 hover:border-black transition-colors cursor-pointer ${
                                isWishlisted
                                  ? "text-rose-500 bg-rose-50 border-rose-200"
                                  : "text-slate-600 hover:text-black"
                              }`}
                            >
                              <FiHeart
                                className={`h-4 w-4 ${isWishlisted ? "fill-rose-500" : ""}`}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleCart(product)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                inCart
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-slate-900 hover:bg-black text-white"
                              }`}
                            >
                              <FiShoppingBag className="h-3.5 w-3.5" />
                              <span>{inCart ? "In Cart" : "Add to Cart"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* =========================================================================
          MOBILE FILTER DRAWER (Slides in from Left on Mobile)
         ========================================================================= */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 z-[129000] bg-black/50 backdrop-blur-xs lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-[130000] w-[320px] max-w-[85vw] bg-white flex flex-col justify-between shadow-2xl lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FiFilter className="h-4 w-4 text-slate-900" />
                  <h2 className="text-base font-bold text-slate-900">Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black text-[10px] font-bold text-white px-1">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Filter Controls */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {renderFilterContent(true)}
              </div>

              {/* Sticky Drawer Footer */}
              <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    setShowMobileFilters(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-colors shadow-xs cursor-pointer"
                >
                  Apply ({filteredProducts.length})
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProductGrid;
