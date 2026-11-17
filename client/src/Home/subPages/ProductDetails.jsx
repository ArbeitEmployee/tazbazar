/* eslint-disable no-constant-condition */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaHeart,
  FaShare,
  FaFacebookF,
  FaTwitter,
  FaWhatsapp,
  FaLink,
  FaPaperPlane,
  FaStar,
  FaYoutube,
  FaChevronLeft,
  FaChevronRight,
  FaTruck,
  FaUndo,
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiHeart,
  FiShare2,
  FiShuffle,
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiCreditCard,
  FiMaximize2,
  FiTag,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiEye,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import SearchableSelect from "../../components/SearchableSelect";
import { useNavigate, useParams } from "@/lib/routing";
import axios from "axios";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../hooks/useAuth";
import usePublicSettings from "../../hooks/usePublicSettings";
import StorefrontProductCard from "../components/StorefrontProductCard";
import ProductReviewsPanel from "../components/ProductReviewsPanel";
import {
  COMPARE_LIMIT_MESSAGE,
  MAX_COMPARE_ITEMS,
  toggleCompareItem,
} from "../../store/compareSlice";
import { addRecentlyViewedItem } from "../../store/recentlyViewedSlice";
import { trackProductView, trackWishlistAdd } from "../../utils/userPreferences";
import {
  selectWishlistPendingIds,
  toggleWishlistItem,
} from "../../store/wishlistSlice";
import {
  buildDataLayerItem,
  getDataLayerCurrency,
} from "../../utils/marketingDataLayer";
import { trackViewContent } from "../../utils/analyticsTracker";
import { createProductSnapshot } from "../../utils/productSnapshot";
import { isPublicStockVisible } from "../../utils/publicProduct";
import { applySeoMetadata } from "../../utils/seoManager";
import {
  applyMarketingTemplate,
  getActiveMarketingEntry,
} from "../../utils/marketingProfiles";
import {
  buildSelectedVariantLabel,
  getEffectiveProductPricing,
  getReadableColorLabel,
  getReadableVariantOptionLabel,
  getResolvedSelectedVariants,
  normalizeProductVariantDefinitions,
  normalizeSelectedVariantsPayload,
} from "../../utils/productVariants";
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  normalizeProductVideoEntries,
  normalizeProductYouTubeUrls,
} from "../../utils/productMedia";
import { hasHtmlContent, stripHtml } from "../../utils/richText";
import { setBuyNowItem } from "../../utils/buyNowStorage";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
const VALID_PRODUCT_TABS = new Set(["description", "additional", "reviews"]);
const THUMBNAIL_VISIBLE_COUNT = 4;

const normalizeProductTabValue = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return VALID_PRODUCT_TABS.has(normalized) ? normalized : "";
};

const getStoredProductTab = (productId) => {
  if (typeof window === "undefined" || !productId) return "";

  try {
    // Check localStorage first (persists across reloads)
    const localStorageTab = normalizeProductTabValue(
      localStorage.getItem(`productTab_${productId}`),
    );
    if (localStorageTab) return localStorageTab;

    // Fallback to sessionStorage
    return normalizeProductTabValue(
      window.sessionStorage.getItem(`product-detail-tab:${productId}`),
    );
  } catch {
    return "";
  }
};

const resolveImageValue = (value) => {
  if (!value) return "";

  if (typeof value === "string") return value;
  if (Array.isArray(value)) return resolveImageValue(value[0]);

  if (typeof value === "object") {
    return (
      value.data ||
      value.url ||
      value.secure_url ||
      value.src ||
      value.path ||
      ""
    );
  }

  return "";
};

// Helper function to get full image URL
const getFullImageUrl = (imagePath) => {
  const resolvedPath = resolveImageValue(imagePath);
  if (!resolvedPath) return null;

  if (
    resolvedPath.startsWith("http://") ||
    resolvedPath.startsWith("https://") ||
    resolvedPath.startsWith("data:")
  ) {
    return resolvedPath;
  }

  if (resolvedPath.startsWith("/")) {
    return baseUrl ? `${baseUrl}${resolvedPath}` : resolvedPath;
  }

  return baseUrl
    ? `${baseUrl}/uploads/products/${resolvedPath}`
    : `/uploads/products/${resolvedPath}`;
};

// Simple fallback image component
const FallbackImage = ({ className, alt }) => (
  <div className={`${className} bg-gray-100 flex items-center justify-center`}>
    <svg
      className="w-12 h-12 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
    <span className="sr-only">{alt || "No image available"}</span>
  </div>
);

// Image component with proper fallback
const ProductImage = ({ src, alt, className, isCurrent = false }) => {
  const [imgSrc, setImgSrc] = useState(getFullImageUrl(src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(getFullImageUrl(src));
    setHasError(false);
  }, [src]);

  const handleError = () => {
    setHasError(true);
    if (typeof src === "string" && src.startsWith("/uploads/products/")) {
      const altUrl = `${baseUrl}${src}`;
      if (altUrl !== imgSrc) {
        setImgSrc(altUrl);
        setHasError(false);
      }
    }
  };

  if (hasError || !imgSrc) {
    return <FallbackImage className={className} alt={alt} />;
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading={isCurrent ? "eager" : "lazy"}
      decoding="async"
      crossOrigin={
        imgSrc?.startsWith("http://") || imgSrc?.startsWith("https://")
          ? "anonymous"
          : undefined
      }
    />
  );
};

const ProductDetails = () => {
  const { id } = useParams();
  const buildEmptyReviewForm = () => ({
    rating: 0,
    title: "",
    comment: "",
    reviewerName: "",
    reviewerEmail: "",
  });
  const normalizeReviewSummary = (summary, fallbackReviews = []) => {
    const fallbackList = Array.isArray(fallbackReviews) ? fallbackReviews : [];
    const explicitCount = Number(summary?.ratingCount);
    const explicitAverage = Number(summary?.ratingAverage);
    const fallbackCount = fallbackList.length;
    const fallbackAverage =
      fallbackCount > 0
        ? fallbackList.reduce(
            (sum, entry) => sum + Number(entry?.rating || 0),
            0,
          ) / fallbackCount
        : 0;

    return {
      ratingAverage:
        Number.isFinite(explicitAverage) && explicitAverage >= 0
          ? explicitAverage
          : fallbackAverage,
      ratingCount:
        Number.isFinite(explicitCount) && explicitCount >= 0
          ? explicitCount
          : fallbackCount,
    };
  };
  const [selectedImage, setSelectedImage] = useState(0);
  const [variantMediaOverride, setVariantMediaOverride] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedVariantOptions, setSelectedVariantOptions] = useState({});
  const [selectedVariationId, setSelectedVariationId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({
    ratingAverage: 0,
    ratingCount: 0,
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [myReview, setMyReview] = useState(null);
  const [reviewForm, setReviewForm] = useState(buildEmptyReviewForm);
  const [hoverRating, setHoverRating] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDeleting, setReviewDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState(
    () => getStoredProductTab(id) || "description",
  );
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);
  const [relatedCarouselHasOverflow, setRelatedCarouselHasOverflow] =
    useState(false);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(true);
  const { addToCart, isLoading: cartLoading } = useCart();
  const { user } = useAuth();
  const { settings, loaded: settingsLoaded } = usePublicSettings();
  const dispatch = useDispatch();
  const compareItems = useSelector((state) => state.compare.items || []);
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const wishlistPendingIds = useSelector(selectWishlistPendingIds);
  const recentlyViewedItems = useSelector((state) => state.recentlyViewed?.items || []);

  const sideRecentlyViewed = useMemo(() => {
    const currentId = String(product?._id || "").trim();
    const filtered = (recentlyViewedItems || []).filter(
      (item) => item && item._id && String(item._id).trim() !== currentId
    );
    if (filtered.length > 0) {
      return filtered.slice(0, 5);
    }
    return (relatedProducts || []).slice(0, 4);
  }, [recentlyViewedItems, product?._id, relatedProducts]);
  const navigate = useNavigate();
  const relatedCarouselRef = useRef(null);
  const productRef = useRef(null);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = product?.title || "Product";
  const shareText = product?.description
    ? stripHtml(product.description).slice(0, 140)
    : "Check this product";
  const productMediaItems = useMemo(() => {
    const imageItems = Array.isArray(product?.images)
      ? product.images
          .map((image, index) => ({
            key: `image-${index}`,
            type: "image",
            src: image,
            thumbnailSrc: image,
            alt: `${product?.title || "Product"} - ${index + 1}`,
          }))
          .filter((item) => Boolean(getFullImageUrl(item.src)))
      : [];

    const uploadedVideoItem = normalizeProductVideoEntries(product).map(
      (video, index) => ({
        key: `video-upload-${index}`,
        type: "video",
        src: getFullImageUrl(video.url),
        thumbnailSrc: getFullImageUrl(video.url),
        alt: `${product?.title || "Product"} video ${index + 1}`,
      }),
    );

    const youtubeItem = normalizeProductYouTubeUrls(product)
      .map((videoUrl, index) => {
        const youtubeThumbnail = getYouTubeThumbnailUrl(videoUrl);
        const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl);
        if (!youtubeEmbedUrl || !youtubeThumbnail) return null;

        return {
          key: `video-youtube-${index}`,
          type: "youtube",
          src: youtubeEmbedUrl,
          thumbnailSrc: youtubeThumbnail,
          alt: `${product?.title || "Product"} YouTube video ${index + 1}`,
        };
      })
      .filter(Boolean);

    return [...imageItems, ...uploadedVideoItem, ...youtubeItem];
  }, [product]);
  const currentMediaItem =
    variantMediaOverride ||
    productMediaItems[selectedImage] ||
    productMediaItems[0] ||
    null;
  const currentModalMediaItem =
    variantMediaOverride ||
    productMediaItems[currentImageIndex] ||
    productMediaItems[0] ||
    null;
  const maxThumbnailStartIndex = Math.max(
    productMediaItems.length - THUMBNAIL_VISIBLE_COUNT,
    0,
  );
  const visibleThumbnailItems = useMemo(
    () =>
      productMediaItems
        .slice(
          thumbnailStartIndex,
          thumbnailStartIndex + THUMBNAIL_VISIBLE_COUNT,
        )
        .map((mediaItem, offset) => ({
          mediaItem,
          index: thumbnailStartIndex + offset,
        })),
    [productMediaItems, thumbnailStartIndex],
  );
  const hasThumbnailPagination =
    productMediaItems.length > THUMBNAIL_VISIBLE_COUNT;
  const canShowPreviousThumbnailPage = thumbnailStartIndex > 0;
  const canShowNextThumbnailPage = thumbnailStartIndex < maxThumbnailStartIndex;
  const isCompared = compareItems.some(
    (item) => String(item?._id || "") === String(product?._id || ""),
  );
  const isWishlisted = wishlistItems.some(
    (item) => String(item?._id || "") === String(product?._id || ""),
  );
  const wishlistLoading = wishlistPendingIds.includes(
    String(product?._id || ""),
  );
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleBackNavigation = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/shop");
  };

  useEffect(() => {
    const maxIndex = Math.max(productMediaItems.length - 1, 0);
    setSelectedImage((prev) => Math.min(prev, maxIndex));
    setCurrentImageIndex((prev) => Math.min(prev, maxIndex));
  }, [productMediaItems.length]);

  useEffect(() => {
    setThumbnailStartIndex((currentStart) => {
      if (selectedImage < currentStart) {
        return selectedImage;
      }

      if (selectedImage >= currentStart + THUMBNAIL_VISIBLE_COUNT) {
        return Math.max(
          Math.min(
            selectedImage - THUMBNAIL_VISIBLE_COUNT + 1,
            maxThumbnailStartIndex,
          ),
          0,
        );
      }

      return Math.min(currentStart, maxThumbnailStartIndex);
    });
  }, [maxThumbnailStartIndex, selectedImage]);

  useEffect(() => {
    setThumbnailStartIndex((currentStart) =>
      Math.min(currentStart, maxThumbnailStartIndex),
    );
  }, [maxThumbnailStartIndex]);

  useEffect(() => {
    setThumbnailStartIndex(0);
  }, [product?._id]);
  // Switch product image when a selected variant option has an associated image
  useEffect(() => {
    // Check selected variant options for an image
    const selectedOptionsList = Object.values(selectedVariantOptions || {});
    let targetImageUrl = "";
    let targetLabel = "";

    for (const opt of selectedOptionsList) {
      const candidate = String(opt?.imageUrl || opt?.image || "").trim();
      if (candidate) {
        targetImageUrl = candidate;
        targetLabel = String(opt?.label || opt?.value || "").trim();
        break;
      }
    }

    if (!targetImageUrl) {
      setVariantMediaOverride(null);
      return;
    }

    // Set variant media override so main preview immediately switches to this variant image
    setVariantMediaOverride({
      key: `variant-preview-${targetImageUrl.slice(0, 32)}`,
      type: "image",
      src: targetImageUrl,
      thumbnailSrc: targetImageUrl,
      alt: `${product?.title || "Product"} - ${targetLabel || "Variant"}`,
    });
  }, [selectedVariantOptions, product?.title]);

  useEffect(() => {
    const container = relatedCarouselRef.current;
    if (!container) {
      setRelatedCarouselHasOverflow(false);
      return undefined;
    }

    const updateOverflow = () => {
      const node = relatedCarouselRef.current;
      if (!node) return;
      setRelatedCarouselHasOverflow(node.scrollWidth > node.clientWidth + 2);
    };

    updateOverflow();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateOverflow());
      observer.observe(container);
      return () => observer.disconnect();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateOverflow);
      return () => window.removeEventListener("resize", updateOverflow);
    }

    return undefined;
  }, [relatedProductsLoading, relatedProducts.length]);

  const handleScrollToReviews = () => {
    if (typeof document === "undefined") return;
    setActiveTab("reviews");

    setTimeout(() => {
      const reviewSection = document.getElementById("reviews");
      if (reviewSection) {
        reviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 0);
  };

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // Fetch product reviews in parallel with the product details request.
  // The reviews endpoint does not depend on the product payload, so waiting
  // for `productLoading` only added latency.
  useEffect(() => {
    if (!id) return undefined;

    let cancelled = false;

    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        const response = await axios.get(
          `${baseUrl}/products/public/${id}/reviews`,
        );
        if (cancelled) return;
        const nextReviews = Array.isArray(response.data?.reviews)
          ? response.data.reviews
          : [];
        setReviews(nextReviews);
        setReviewSummary(
          normalizeReviewSummary(response.data?.summary, nextReviews),
        );
      } catch (_error) {
        if (cancelled) return;
        const currentProduct = productRef.current;
        setReviews([]);
        setReviewSummary(
          normalizeReviewSummary({
            ratingAverage: Number(currentProduct?.ratingAverage || 0),
            ratingCount: Number(currentProduct?.ratingCount || 0),
          }),
        );
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    productRef.current = product;
  }, [product]);

  useEffect(() => {
    if (!id || !isLoggedIn) {
      setMyReview(null);
      setReviewForm(buildEmptyReviewForm());
      return;
    }

    const loadMyReview = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/products/${id}/reviews/me`,
          {
            headers: getAuthHeaders(),
          },
        );
        const review = response.data?.review || null;
        setMyReview(review);
        if (review) {
          setReviewForm({
            rating: Number(review.rating || 0),
            title: review.title || "",
            comment: review.comment || "",
            reviewerName: review.reviewerName || user?.name || "",
            reviewerEmail: review.reviewerEmail || user?.email || "",
          });
        } else {
          setReviewForm({
            ...buildEmptyReviewForm(),
            reviewerName: user?.name || "",
            reviewerEmail: user?.email || "",
          });
        }
      } catch (_error) {
        setMyReview(null);
        setReviewForm(buildEmptyReviewForm());
      }
    };

    loadMyReview();
  }, [id, isLoggedIn, user?.email, user?.name]);

  // Fetch product details
  useEffect(() => {
    // Reset states immediately when ID changes so stale product or previous page doesn't linger
    setProduct(null);
    setProductLoading(true);
    setSelectedVariantOptions({});
    setSelectedColor("");
    setVariantMediaOverride(null);
    setSelectedVariationId("");
    setSelectedImage(0);

    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }

    let isCurrent = true;

    const fetchProduct = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/products/public/${encodeURIComponent(id)}`
        );

        if (!isCurrent) return;

        const productData =
          response.data.product || response.data.data || response.data;

        if (productData) {
          const normalizedId = productData._id || productData.id;
          setProduct(
            normalizedId
              ? { ...productData, _id: normalizedId }
              : productData,
          );

          if (
            productData.marketplaceType === "variable" &&
            Array.isArray(productData.variations) &&
            productData.variations.length > 0
          ) {
            setSelectedVariationId("");
          }
        }
      } catch (err) {
        if (!isCurrent) return;
        console.error("Error fetching product:", err);
        toast.error("Failed to load product details", {
          autoClose: 3000,
        });
      } finally {
        if (isCurrent) {
          setProductLoading(false);
        }
      }
    };

    if (id) {
      fetchProduct();
    }

    return () => {
      isCurrent = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product?._id) return;

    const hasAdditionalInfo = Boolean(
      (Array.isArray(product.specifications) &&
        product.specifications.length > 0) ||
      product.brand ||
      product.weight ||
      product.dimensions,
    );

    const availableTabs = [
      product.description ? "description" : null,
      hasAdditionalInfo ? "additional" : null,
      "reviews",
    ].filter(Boolean);

    const storedTab = getStoredProductTab(product._id);

    setActiveTab((currentTab) => {
      if (availableTabs.includes(storedTab)) {
        return storedTab;
      }

      if (availableTabs.includes(currentTab)) {
        return currentTab;
      }

      return availableTabs[0] || "reviews";
    });
  }, [
    product?._id,
    product?.brand,
    product?.description,
    product?.dimensions,
    product?.weight,
    product?.specifications,
  ]);

  useEffect(() => {
    if (!product?._id) return;
    const snapshot = createProductSnapshot(product);
    if (!snapshot) return;
    dispatch(addRecentlyViewedItem(snapshot));
    // Track preference for "Just for You" recommendations
    trackProductView(product);
  }, [dispatch, product]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!product?._id) return;
    window.__CURRENT_PRODUCT_ID__ = String(product._id || "").trim();
    window.dispatchEvent(new Event("marketing:product-context"));
    return () => {
      if (window.__CURRENT_PRODUCT_ID__ === String(product._id || "").trim()) {
        window.__CURRENT_PRODUCT_ID__ = "";
        window.dispatchEvent(new Event("marketing:product-context"));
      }
    };
  }, [product?._id]);

  useEffect(() => {
    if (!id) {
      setRelatedProducts([]);
      return undefined;
    }

    let cancelled = false;

    const resolveCategoryId = (value) => {
      if (!value) return "";
      if (typeof value === "string") return value;
      return value?._id ? String(value._id) : "";
    };

    const rankRelatedProducts = (entries = []) => {
      const currentProduct = productRef.current;
      const currentId = String(currentProduct?._id || id || "");
      const others = entries.filter(
        (entry) => String(entry?._id || "") !== currentId,
      );
      const categoryId = resolveCategoryId(currentProduct?.category);
      const productType = String(currentProduct?.productType || "").trim();

      const sameCategory = categoryId
        ? others.filter(
            (entry) => resolveCategoryId(entry.category) === categoryId,
          )
        : [];
      const sameType = productType
        ? others.filter(
            (entry) => String(entry?.productType || "").trim() === productType,
          )
        : [];

      const rankedById = new Map();
      [...sameCategory, ...sameType, ...others].forEach((entry) => {
        const key = String(entry?._id || "");
        if (key && !rankedById.has(key)) rankedById.set(key, entry);
      });
      return Array.from(rankedById.values()).slice(0, 8);
    };

    const fetchRelatedProducts = async () => {
      try {
        setRelatedProductsLoading(true);
        const response = await axios.get(
          `${baseUrl}/products/public/${encodeURIComponent(id)}/related`,
          { params: { limit: 8 }, timeout: 15000 },
        );
        if (cancelled) return;
        const payload =
          response.data?.products || response.data?.data || response.data;
        setRelatedProducts(Array.isArray(payload) ? payload : []);
      } catch (_error) {
        if (cancelled) return;

        // Graceful fallback for older servers that do not expose the
        // /related endpoint yet: fetch the catalog and rank client-side,
        // which is what this page did before.
        try {
          const fallback = await axios.get(`${baseUrl}/products/public`, {
            timeout: 15000,
          });
          if (cancelled) return;
          const payload =
            fallback.data?.products || fallback.data?.data || fallback.data;
          setRelatedProducts(
            rankRelatedProducts(Array.isArray(payload) ? payload : []),
          );
        } catch (_fallbackError) {
          if (!cancelled) setRelatedProducts([]);
        }
      } finally {
        if (!cancelled) setRelatedProductsLoading(false);
      }
    };

    // Keyed on the route id, not the product payload: the request can start in
    // parallel with the product details request instead of after it.
    fetchRelatedProducts();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!settingsLoaded || !product?._id || typeof window === "undefined") {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      const resolvedPrice =
        Number(product?.salePrice ?? product?.price ?? 0) > 0
          ? Number(product?.salePrice ?? product?.price ?? 0)
          : Number(product?.price || 0);

      trackViewContent({
        ecommerce: {
          currency: getDataLayerCurrency(),
          value: Number.isFinite(resolvedPrice) ? resolvedPrice : 0,
          items: [
            buildDataLayerItem({
              productId: product._id,
              title: product.title,
              price: resolvedPrice,
              category:
                product?.category?.name ||
                product?.category ||
                product?.productType ||
                "",
              brand: product?.brand || "",
            }),
          ],
        },
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    settingsLoaded,
    product?._id,
    product?.brand,
    product?.category,
    product?.category?.name,
    product?.price,
    product?.productType,
    product?.salePrice,
    product?.title,
  ]);

  useEffect(() => {
    if (!product?._id) return;

    const website = settings?.website || {};
    const seo = settings?.seo || {};
    const pageSeo = settings?.seoAnalytics?.pages?.productDetails || {};
    const hasExplicitEntries = Boolean(
      settings?.seoAnalytics?.hasExplicitEntries,
    );
    const storeName =
      String(website.storeName || "E-Commerce").trim() || "E-Commerce";
    const seoEntry = getActiveMarketingEntry(settings, {
      type: "seo",
      pathname: `/product/${product._id}`,
      productId: product._id,
    });
    const templateReplacements = {
      storeName,
      pageName: product?.title || "Product",
      productName: product?.title || "Product",
      productCategory:
        product?.category?.name ||
        product?.category ||
        product?.productType ||
        "",
      productDescription: stripHtml(product?.description || ""),
    };
    const seoTitle = String(
      applyMarketingTemplate(seoEntry?.metaTitle, templateReplacements) ||
        product?.seoTitle ||
        product?.title ||
        "Product",
    ).trim();
    const seoDescription = String(
      applyMarketingTemplate(seoEntry?.metaDescription, templateReplacements) ||
        product?.seoDescription ||
        stripHtml(product?.description || "") ||
        (!hasExplicitEntries ? pageSeo.metaDescription : "") ||
        (!hasExplicitEntries ? seo.metaDescription : "") ||
        "",
    ).trim();
    const seoImage =
      getFullImageUrl(product?.images?.[0] || product?.image || "") ||
      String(
        applyMarketingTemplate(
          seoEntry?.openGraphImage,
          templateReplacements,
        ) ||
          (!hasExplicitEntries ? pageSeo.openGraphImage : "") ||
          (!hasExplicitEntries ? seo.openGraphImage : "") ||
          website.headerIconUrl ||
          website.logoUrl ||
          "",
      ).trim();

    applySeoMetadata({
      title: seoTitle,
      description: seoDescription,
      keywords: String(
        applyMarketingTemplate(seoEntry?.metaKeywords, templateReplacements) ||
          (!hasExplicitEntries ? pageSeo.metaKeywords : "") ||
          (!hasExplicitEntries ? seo.metaKeywords : "") ||
          "",
      ).trim(),
      image: seoImage,
      url: typeof window !== "undefined" ? window.location.href : "",
      siteName: storeName,
      type: "product",
    });
  }, [
    product?._id,
    product?.description,
    product?.image,
    product?.images,
    product?.title,
    settings,
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const normalizedTab =
        normalizeProductTabValue(activeTab) || "description";
      localStorage.setItem(`productTab_${id}`, normalizedTab);
      // Also save to sessionStorage for backward compatibility
      try {
        window.sessionStorage.setItem(
          `product-detail-tab:${id}`,
          normalizedTab,
        );
      } catch (e) {
        // sessionStorage might be disabled, ignore
      }
    }
  }, [activeTab, id]);

  const marketplaceType = String(product?.marketplaceType || "simple");
  const priceType = String(product?.priceType || "single");
  const isTbaPrice = priceType === "tba";
  const isRecurringProduct = Boolean(product?.isRecurring);
  const showPublicStock = isPublicStockVisible(product, settings);
  const productVariantDefinitions = useMemo(
    () => normalizeProductVariantDefinitions(product || {}),
    [product],
  );
  const hasColorVariantDefinition = productVariantDefinitions.some(
    (definition) =>
      definition.preset === "color" ||
      definition.name.toLowerCase() === "color",
  );
  const legacyColorOptions =
    !hasColorVariantDefinition && Array.isArray(product?.colors)
      ? product.colors
      : [];
  const selectedVariation =
    marketplaceType === "variable"
      ? (product?.variations || []).find(
          (variation) =>
            String(variation?._id || "") === String(selectedVariationId || ""),
        ) || null
      : null;
  const selectedVariantSelections = useMemo(
    () =>
      productVariantDefinitions
        .map((definition, index) => {
          const selected = selectedVariantOptions[index];
          if (!selected) return null;

          return {
            name: definition.name,
            preset: definition.preset,
            label: selected.label || selected.value || "",
            value: selected.value || selected.label || "",
            colorHex: selected.colorHex || "",
            priceMode: selected.priceMode || "default",
            price: selected.price,
            comparePrice: selected.comparePrice,
          };
        })
        .filter(Boolean),
    [productVariantDefinitions, selectedVariantOptions],
  );
  const hasAllVariantSelections = useMemo(
    () =>
      productVariantDefinitions.every((_, index) =>
        Boolean(selectedVariantOptions[index]),
      ),
    [productVariantDefinitions, selectedVariantOptions],
  );
  const resolvedSelectedVariants = useMemo(
    () =>
      hasAllVariantSelections
        ? getResolvedSelectedVariants(product || {}, selectedVariantSelections)
        : normalizeSelectedVariantsPayload(selectedVariantSelections),
    [hasAllVariantSelections, product, selectedVariantSelections],
  );
  const selectedVariantLabel = useMemo(
    () => buildSelectedVariantLabel(resolvedSelectedVariants),
    [resolvedSelectedVariants],
  );
  const resolvedSelectedColor = useMemo(() => {
    const colorDefinitionIndex = productVariantDefinitions.findIndex(
      (definition) =>
        definition.preset === "color" ||
        definition.name.toLowerCase() === "color",
    );

    if (colorDefinitionIndex >= 0) {
      const selectedOption = selectedVariantOptions[colorDefinitionIndex];
      return String(
        selectedOption?.colorHex ||
          selectedOption?.value ||
          selectedColor ||
          "",
      )
        .trim()
        .toLowerCase();
    }

    return String(selectedColor || "")
      .trim()
      .toLowerCase();
  }, [productVariantDefinitions, selectedColor, selectedVariantOptions]);
  const currentPricing = useMemo(() => {
    if (!product) {
      return {
        currentPrice: 0,
        previousPrice: null,
      };
    }

    if (marketplaceType === "variable" && selectedVariation) {
      const hasVariationSalePrice =
        selectedVariation?.salePrice !== null &&
        selectedVariation?.salePrice !== undefined &&
        String(selectedVariation.salePrice).trim() !== "";
      const salePrice = hasVariationSalePrice
        ? Number(selectedVariation.salePrice)
        : null;
      const regularPrice = Number(selectedVariation.price);

      return getEffectiveProductPricing({
        basePrice:
          Number.isFinite(salePrice) && salePrice >= 0
            ? salePrice
            : regularPrice,
        baseComparePrice:
          Number.isFinite(salePrice) &&
          salePrice >= 0 &&
          Number.isFinite(regularPrice) &&
          regularPrice > salePrice
            ? regularPrice
            : null,
        selectedVariants: resolvedSelectedVariants,
      });
    }

    const hasSalePrice =
      String(product?.priceType || "single") === "best" &&
      product?.salePrice !== null &&
      product?.salePrice !== undefined &&
      String(product.salePrice).trim() !== "";
    const salePrice = hasSalePrice ? Number(product.salePrice) : null;
    const regularPrice = Number(product.price);

    return getEffectiveProductPricing({
      basePrice:
        Number.isFinite(salePrice) && salePrice >= 0 ? salePrice : regularPrice,
      baseComparePrice:
        Number.isFinite(salePrice) &&
        salePrice >= 0 &&
        Number.isFinite(regularPrice) &&
        regularPrice > salePrice
          ? regularPrice
          : null,
      selectedVariants: resolvedSelectedVariants,
    });
  }, [marketplaceType, product, resolvedSelectedVariants, selectedVariation]);

  const getCurrentPrice = () => Number(currentPricing.currentPrice || 0);

  const getCurrentStock = () => {
    if (!product) return 0;
    if (marketplaceType === "variable") {
      return Number(selectedVariation?.stock || 0);
    }
    return Number(product.stock || 0);
  };

  const isInStock = () => {
    if (!product) return false;
    if (product.allowBackorder) return true;
    return getCurrentStock() > 0;
  };

  // Handle quantity changes
  const increaseQuantity = () =>
    setQuantity((prev) => {
      if (product?.allowBackorder) return prev + 1;
      const maxStock = getCurrentStock();
      if (!maxStock) return 1;
      return Math.min(prev + 1, maxStock);
    });
  const decreaseQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product) return;

    if (isTbaPrice) {
      toast.error("This product price is TBA and cannot be purchased now.");
      return;
    }

    if (marketplaceType === "grouped") {
      toast.error("Please add individual grouped items from below.");
      return;
    }

    if (marketplaceType === "variable" && !selectedVariationId) {
      toast.error("Please select a size");
      return;
    }

    if (!isInStock()) {
      toast.error("This item is currently out of stock");
      return;
    }

    setLoading(true);

    try {
      const combinedVariationLabel = [
        String(selectedVariation?.label || "").trim(),
        selectedVariantLabel,
      ]
        .filter(Boolean)
        .join(" | ");
      const result = await addToCart(
        product,
        quantity,
        resolvedSelectedColor,
        "",
        {
          variationId: selectedVariationId || "",
          variationLabel: combinedVariationLabel,
          selectedVariants: resolvedSelectedVariants,
          unitPrice: getCurrentPrice(),
        },
      );
      if (!result?.success) {
        toast.error(result?.error || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error("Failed to add to cart", {
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle buy now (direct checkout without affecting persistent cart)
  const handleBuyNow = async () => {
    if (isTbaPrice) {
      toast.error("This product price is TBA and cannot be purchased now.");
      return;
    }

    if (marketplaceType === "grouped") {
      toast.error("Please add individual grouped items from below.");
      return;
    }

    try {
      if (marketplaceType === "variable" && !selectedVariationId) {
        toast.error("Please select a size");
        return;
      }

      if (!isInStock()) {
        toast.error("This item is currently out of stock");
        return;
      }

      const combinedVariationLabel = [
        String(selectedVariation?.label || "").trim(),
        selectedVariantLabel,
      ]
        .filter(Boolean)
        .join(" | ");

      const buyNowPayload = {
        productId: product?._id,
        product,
        quantity: Math.max(Number(quantity || 1), 1),
        price: getCurrentPrice(),
        color: resolvedSelectedColor || "",
        dimensions: "",
        variationId: selectedVariationId || "",
        variationLabel: combinedVariationLabel,
        selectedVariants: resolvedSelectedVariants || [],
        image:
          product?.images?.[0] ||
          product?.image ||
          "",
        title: product?.title || "",
      };

      setBuyNowItem(buyNowPayload);
      navigate("/checkout");
    } catch (err) {
      console.error("Error in buy now:", err);
      toast.error("Failed to proceed", {
        autoClose: 3000,
      });
    }
  };

  const renderStars = (rating = 0) =>
    Array.from({ length: 5 }).map((_, index) => (
      <FaStar
        key={`star-${index}`}
        className={`w-4 h-4 ${
          index < Math.round(Number(rating || 0))
            ? "text-yellow-500 fill-yellow-500"
            : "text-gray-300"
        }`}
      />
    ));

  const refreshReviews = async () => {
    if (!id) return;
    try {
      const response = await axios.get(
        `${baseUrl}/products/public/${id}/reviews`,
      );
      const nextReviews = Array.isArray(response.data?.reviews)
        ? response.data.reviews
        : [];
      setReviews(nextReviews);
      setReviewSummary(
        normalizeReviewSummary(response.data?.summary, nextReviews),
      );
    } catch (_error) {
      // Keep the current UI state if refresh fails.
    }
  };

  const handleToggleWishlist = async () => {
    if (!product?._id) return;

    try {
      await dispatch(toggleWishlistItem(product)).unwrap();
      toast.success(
        isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      );
      // Track wishlist add for "Just for You" recommendations
      if (!isWishlisted) trackWishlistAdd(product);
    } catch (error) {
      toast.error(error || "Failed to update wishlist");
    }
  };

  const handleToggleCompare = () => {
    if (!product?._id) return;
    const snapshot = createProductSnapshot(product);
    if (!snapshot) return;
    const exists = compareItems.some(
      (item) => String(item?._id || "") === String(snapshot._id),
    );
    if (!exists && compareItems.length >= MAX_COMPARE_ITEMS) {
      toast.error(COMPARE_LIMIT_MESSAGE);
      return;
    }
    dispatch(toggleCompareItem(snapshot));
    toast.success(exists ? "Removed from compare" : "Added to compare");
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toast.success("Product link copied");
    } catch (_error) {
      toast.error("Failed to copy product link");
    }
  };

  const handleSharePlatform = (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`${shareTitle} - ${shareText}`);
    const platformUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    };

    const targetUrl = platformUrls[platform];
    if (!targetUrl) return;
    window.open(
      targetUrl,
      "_blank",
      "noopener,noreferrer,width=640,height=640",
    );
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied");
    } catch (_error) {
      toast.error("Failed to copy link");
    }
  };

  const handleNavigateToProduct = (productId) => {
    const resolvedId = String(productId || "").trim();
    if (!resolvedId) return;
    navigate(`/product/${resolvedId}`);
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  };

  const scrollRelatedCarousel = (direction) => {
    const container = relatedCarouselRef.current;
    if (!container) return;
    const delta = Math.max(240, container.clientWidth);
    container.scrollBy({
      left: direction * delta,
      behavior: "smooth",
    });
  };

  const getRelatedProductPricing = (entry) => {
    const formatPrice = (value) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return null;
      return `${Math.round(parsed)} Tk`;
    };

    const priceType = String(entry?.priceType || "single")
      .trim()
      .toLowerCase();
    if (priceType === "tba") {
      return {
        isTba: true,
        isRange: false,
        hasDiscount: false,
        currentValue: null,
        previousValue: null,
        currentText: "TBA",
        previousText: null,
      };
    }

    const marketplaceType = String(entry?.marketplaceType || "simple")
      .trim()
      .toLowerCase();

    if (
      marketplaceType === "variable" &&
      Array.isArray(entry?.variations) &&
      entry.variations.length > 0
    ) {
      const prices = entry.variations
        .filter((variation) => variation?.isActive !== false)
        .map((variation) => {
          const hasSalePrice =
            variation?.salePrice !== null &&
            variation?.salePrice !== undefined &&
            String(variation.salePrice).trim() !== "";
          const salePrice = hasSalePrice ? Number(variation.salePrice) : NaN;
          const regularPrice = Number(variation?.price);

          if (Number.isFinite(salePrice) && salePrice >= 0) return salePrice;
          if (Number.isFinite(regularPrice) && regularPrice >= 0)
            return regularPrice;
          return null;
        })
        .filter((price) => price !== null);

      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const currentText =
          min !== max
            ? `${formatPrice(min) || ""} - ${formatPrice(max) || ""}`.trim()
            : formatPrice(min) || "";

        return {
          isTba: false,
          isRange: min !== max,
          hasDiscount: false,
          currentValue: Number.isFinite(min) ? min : null,
          previousValue: null,
          currentText,
          previousText: null,
        };
      }
    }

    const regularPrice = Number(entry?.price);
    const normalizedRegularPrice =
      Number.isFinite(regularPrice) && regularPrice >= 0 ? regularPrice : 0;

    const hasSalePrice =
      priceType === "best" &&
      entry?.salePrice !== null &&
      entry?.salePrice !== undefined &&
      String(entry.salePrice).trim() !== "";
    const salePrice = hasSalePrice ? Number(entry.salePrice) : NaN;
    const normalizedSalePrice =
      Number.isFinite(salePrice) && salePrice >= 0 ? salePrice : null;

    const hasDiscount =
      normalizedSalePrice !== null &&
      normalizedSalePrice < normalizedRegularPrice;

    const currentValue = hasDiscount
      ? normalizedSalePrice
      : normalizedRegularPrice;

    return {
      isTba: false,
      isRange: false,
      hasDiscount,
      currentValue,
      previousValue: normalizedRegularPrice,
      currentText: formatPrice(currentValue) || "",
      previousText: hasDiscount ? formatPrice(normalizedRegularPrice) : null,
    };
  };

  const handleRelatedWishlist = async (entry) => {
    if (!entry?._id) return;

    const alreadyWishlisted = wishlistItems.some(
      (item) => String(item?._id || "") === String(entry._id || ""),
    );

    try {
      await dispatch(toggleWishlistItem(entry)).unwrap();
      toast.success(
        alreadyWishlisted ? "Removed from wishlist" : "Added to wishlist",
      );
    } catch (error) {
      toast.error(error || "Failed to update wishlist");
    }
  };

  const handleRelatedCompare = (event, entry) => {
    event.stopPropagation();
    const snapshot = createProductSnapshot(entry);
    if (!snapshot) return;

    const exists = compareItems.some(
      (item) => String(item?._id || "") === String(snapshot._id || ""),
    );
    if (!exists && compareItems.length >= MAX_COMPARE_ITEMS) {
      toast.error(COMPARE_LIMIT_MESSAGE);
      return;
    }
    dispatch(toggleCompareItem(snapshot));
    toast.success(exists ? "Removed from compare" : "Added to compare");
  };

  const handleRelatedAddToCart = async (event, entry) => {
    event.stopPropagation();

    if (!entry?._id) return;

    const priceType = String(entry?.priceType || "single")
      .trim()
      .toLowerCase();
    if (priceType === "tba") {
      toast.error(
        "This product price is TBA and cannot be purchased right now",
      );
      return;
    }

    const marketplaceType = String(entry?.marketplaceType || "simple")
      .trim()
      .toLowerCase();

    if (
      marketplaceType === "variable" &&
      Array.isArray(entry?.variations) &&
      entry.variations.length > 0
    ) {
      handleNavigateToProduct(entry._id);
      return;
    }

    if (marketplaceType === "grouped") {
      handleNavigateToProduct(entry._id);
      return;
    }

    try {
      await addToCart(entry, 1);
    } catch (_error) {
      // addToCart already handles toast
    }
  };

  const handleRelatedBuyNow = async (event, entry) => {
    event.stopPropagation();

    if (!entry?._id) return;

    const priceType = String(entry?.priceType || "single")
      .trim()
      .toLowerCase();
    if (priceType === "tba") {
      toast.error(
        "This product price is TBA and cannot be purchased right now",
      );
      return;
    }

    const marketplaceType = String(entry?.marketplaceType || "simple")
      .trim()
      .toLowerCase();

    if (marketplaceType === "variable" || marketplaceType === "grouped") {
      handleNavigateToProduct(entry._id);
      return;
    }

    if (!entry.allowBackorder && Number(entry.stock || 0) <= 0) {
      toast.error("This item is currently out of stock");
      return;
    }

    try {
      const price = entry?.priceType === "best" && entry?.salePrice
        ? Number(entry.salePrice)
        : Number(entry?.price || 0);

      const buyNowPayload = {
        productId: entry?._id,
        product: entry,
        quantity: 1,
        price,
        color: "",
        dimensions: "",
        variationId: "",
        variationLabel: "",
        selectedVariants: [],
        image: entry?.images?.[0] || entry?.image || "",
        title: entry?.title || "",
      };

      setBuyNowItem(buyNowPayload);
      navigate("/checkout");
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    } catch (_error) {
      toast.error("Failed to proceed with Buy Now");
    }
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!reviewForm.comment.trim()) {
      toast.error("Please write your review comment");
      return;
    }

    if (Number(reviewForm.rating || 0) < 1) {
      toast.error("Please choose a star rating");
      return;
    }

    if (!isLoggedIn && !String(reviewForm.reviewerName || "").trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (
      !isLoggedIn &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(reviewForm.reviewerEmail || "").trim(),
      )
    ) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setReviewSubmitting(true);
      const endpoint = isLoggedIn
        ? `${baseUrl}/products/${id}/reviews`
        : `${baseUrl}/products/public/${id}/reviews`;
      const response = await axios.post(
        endpoint,
        {
          rating: Number(reviewForm.rating || 0),
          title: String(reviewForm.title || "").trim(),
          comment: String(reviewForm.comment || "").trim(),
          reviewerName: String(reviewForm.reviewerName || "").trim(),
          reviewerEmail: String(reviewForm.reviewerEmail || "").trim(),
        },
        isLoggedIn ? { headers: getAuthHeaders() } : undefined,
      );

      if (isLoggedIn && response.data?.review) {
        setMyReview(response.data.review);
      }
      if (response.data?.summary) {
        setReviewSummary(normalizeReviewSummary(response.data.summary));
      }

      setReviewForm(
        isLoggedIn
          ? {
              ...buildEmptyReviewForm(),
              reviewerName: user?.name || "",
              reviewerEmail: user?.email || "",
            }
          : buildEmptyReviewForm(),
      );
      setHoverRating(null);
      toast.success("Review submitted");
      await refreshReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!id) return;

    try {
      setReviewDeleting(true);
      const response = await axios.delete(
        `${baseUrl}/products/${id}/reviews/me`,
        {
          headers: getAuthHeaders(),
        },
      );
      setMyReview(null);
      setReviewForm({
        ...buildEmptyReviewForm(),
        reviewerName: user?.name || "",
        reviewerEmail: user?.email || "",
      });
      if (response.data?.summary) {
        setReviewSummary(normalizeReviewSummary(response.data.summary));
      }
      toast.success(response.data?.message || "Review deleted");
      await refreshReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    } finally {
      setReviewDeleting(false);
    }
  };

  // Image modal navigation
  const nextImage = () => {
    if (!productMediaItems.length) return;
    setCurrentImageIndex((prev) =>
      prev === productMediaItems.length - 1 ? 0 : prev + 1,
    );
  };

  const prevImage = () => {
    if (!productMediaItems.length) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? productMediaItems.length - 1 : prev - 1,
    );
  };

  const nextSelectedImage = () => {
    if (!productMediaItems.length) return;
    setSelectedImage((prev) =>
      prev === productMediaItems.length - 1 ? 0 : prev + 1,
    );
  };

  const prevSelectedImage = () => {
    if (!productMediaItems.length) return;
    setSelectedImage((prev) =>
      prev === 0 ? productMediaItems.length - 1 : prev - 1,
    );
  };

  const showPreviousThumbnailPage = () => {
    setThumbnailStartIndex((prev) => Math.max(prev - 1, 0));
  };

  const showNextThumbnailPage = () => {
    setThumbnailStartIndex((prev) =>
      Math.min(prev + 1, maxThumbnailStartIndex),
    );
  };

  const currentPrice = Number(currentPricing.currentPrice || 0);
  const currentStock = getCurrentStock();
  const recurringInterval = String(product?.recurringInterval || "monthly");
  const recurringIntervalCount = Math.max(
    1,
    Number(product?.recurringIntervalCount || 1),
  );
  const recurringTotalCycles = Math.max(
    0,
    Number(product?.recurringTotalCycles || 0),
  );
  const recurringTrialDays = Math.max(
    0,
    Number(product?.recurringTrialDays || 0),
  );
  const regularPriceForDisplay =
    currentPricing.previousPrice !== null
      ? Number(currentPricing.previousPrice || 0)
      : marketplaceType === "variable"
        ? Number(selectedVariation?.price || currentPrice || 0)
        : Number(product?.price || currentPrice || 0);
  const hasDiscountPrice =
    !isTbaPrice &&
    Number.isFinite(regularPriceForDisplay) &&
    regularPriceForDisplay > Number(currentPrice || 0);
  const discountPercentForDisplay =
    hasDiscountPrice && regularPriceForDisplay > 0
      ? Math.round(
          ((regularPriceForDisplay - Number(currentPrice || 0)) /
            regularPriceForDisplay) *
            100,
        )
      : null;
  const variationPriceBounds = (() => {
    if (marketplaceType !== "variable" || !Array.isArray(product?.variations))
      return null;
    const prices = product.variations
      .filter((variation) => variation?.isActive !== false)
      .map((variation) => {
        const hasSalePrice =
          variation?.salePrice !== null &&
          variation?.salePrice !== undefined &&
          String(variation.salePrice).trim() !== "";
        const salePrice = hasSalePrice ? Number(variation.salePrice) : NaN;
        const regularPrice = Number(variation?.price);
        if (Number.isFinite(salePrice) && salePrice >= 0) return salePrice;
        if (Number.isFinite(regularPrice) && regularPrice >= 0)
          return regularPrice;
        return NaN;
      })
      .filter((value) => Number.isFinite(value));
    if (!prices.length) return null;
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  })();
  const showVariationPriceRange = Boolean(
    !selectedVariationId &&
    variationPriceBounds &&
    variationPriceBounds.min !== variationPriceBounds.max,
  );
  const categoryLabel = String(
    typeof product?.category === "object"
      ? product?.category?.name || ""
      : product?.category || "",
  ).trim();
  const brandLabel = String(product?.brand || "").trim();
  const recurringIntervalLabel = (
    {
      daily: "day",
      weekly: "week",
      monthly: "month",
      yearly: "year",
    }[recurringInterval] || recurringInterval
  ).trim();
  const recurringLabel = isRecurringProduct
    ? `Renews every ${recurringIntervalCount > 1 ? `${recurringIntervalCount} ` : ""}${recurringIntervalLabel}${recurringIntervalCount > 1 ? "s" : ""}${
        recurringTrialDays > 0 ? ` after a ${recurringTrialDays}-day trial` : ""
      }${recurringTotalCycles > 0 ? ` for ${recurringTotalCycles} cycles` : ""}`
    : "";
  const publicStockText =
    showPublicStock && currentStock > 0 ? `${currentStock} in stock` : "";
  const availabilityBadge = (() => {
    if (isTbaPrice) {
      return {
        label: "Price pending",
        className: "border border-gray-200 bg-gray-50 text-gray-700",
      };
    }

    if (
      marketplaceType === "variable" &&
      Array.isArray(product?.variations) &&
      product.variations.length > 0 &&
      !selectedVariationId
    ) {
      return {
        label: "Select size",
        className: "border border-gray-200 bg-white text-gray-700",
      };
    }

    if (product?.allowBackorder && currentStock <= 0) {
      return {
        label: "Backorder available",
        className: "border border-gray-200 bg-white text-gray-700",
      };
    }

    if (!isInStock()) {
      return {
        label: "Out of stock",
        className: "bg-rose-50 text-rose-700",
      };
    }

    if (publicStockText) {
      return {
        label: publicStockText,
        className: "bg-emerald-50 text-emerald-700",
      };
    }

    return null;
  })();
  const purchaseActionDisabled =
    loading ||
    cartLoading ||
    !isInStock() ||
    (marketplaceType === "variable" &&
      Array.isArray(product?.variations) &&
      product.variations.length > 0 &&
      !selectedVariationId);
  const quantityStatusText =
    currentStock > 0
      ? publicStockText
      : product?.allowBackorder
        ? "Backorders allowed"
        : "Out of stock";
  const quantityStatusToneClass =
    currentStock > 0
      ? "bg-emerald-50 text-emerald-700"
      : product?.allowBackorder
        ? "bg-white text-gray-700 shadow-sm"
        : "bg-rose-50 text-rose-600";
  const summaryHighlights = [
    categoryLabel ? { label: "Category", value: categoryLabel } : null,
    brandLabel ? { label: "Brand", value: brandLabel } : null,
    {
      label: "Delivery",
      value:
        Number(product?.deliveryMaxDays || 0) > 0
          ? Number(product?.deliveryMinDays || 0) > 0
            ? `${product.deliveryMinDays}-${product.deliveryMaxDays} days`
            : `${product.deliveryMaxDays} days`
          : "Shown at checkout",
    },
    {
      label: isRecurringProduct ? "Plan" : "Pricing",
      value: isRecurringProduct
        ? recurringLabel
        : priceType === "best"
          ? "Offer pricing"
          : priceType === "tba"
            ? "TBA"
            : "Standard price",
    },
  ].filter(Boolean);
  const additionalInfoRows = (() => {
    const rows = [];

    if (Array.isArray(product?.specifications)) {
      product.specifications.forEach((spec) => {
        const label = String(spec?.key || "").trim();
        const value = String(spec?.value || "").trim();
        if (!label || !value) return;
        rows.push({ label, value });
      });
    }

    if (String(product?.brand || "").trim()) {
      const hasBrandRow = rows.some(
        (row) =>
          String(row.label || "")
            .trim()
            .toLowerCase() === "brand",
      );
      if (!hasBrandRow) {
        rows.unshift({ label: "Brand", value: String(product.brand).trim() });
      }
    }

    if (Number(product?.weight || 0) > 0) {
      rows.push({ label: "Weight", value: `${Number(product.weight)}KG` });
    }

    if (String(product?.dimensions || "").trim()) {
      rows.push({
        label: "Dimensions",
        value: String(product.dimensions).trim(),
      });
    }

    return rows;
  })();
  const featureColumns = (() => {
    const items = Array.isArray(product?.features)
      ? product.features
          .map((feature) => String(feature || "").trim())
          .filter(Boolean)
      : [];
    if (!items.length) return [];
    const midpoint = Math.ceil(items.length / 2);
    return [items.slice(0, midpoint), items.slice(midpoint)].filter(
      (column) => column.length,
    );
  })();
  // Instant skeleton loading state (shows immediately while fetching product details)
  if (productLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image skeleton */}
            <div className="space-y-4">
              <div className="aspect-square w-full animate-pulse rounded-2xl bg-gray-100" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 w-16 animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            </div>
            {/* Info skeleton */}
            <div className="space-y-4 pt-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-8 w-3/4 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-px w-full bg-gray-100 my-4" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100 mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/shop")}
            className="px-8 py-3.5 bg-black text-white rounded-lg hover:bg-gray-900 font-medium transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* High-Resolution Media Lightbox Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-skip-scroll-top
            className="fixed inset-0 app-layer-modal bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => setShowImageModal(false)}
          >
            <div
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <span>Close</span>
                <span className="text-base leading-none">&times;</span>
              </button>

              <div className="relative overflow-hidden rounded-2xl bg-black/40 flex items-center justify-center min-h-[300px] max-h-[85vh]">
                {currentModalMediaItem?.type === "video" ? (
                  <video
                    src={currentModalMediaItem.src}
                    className="w-full max-h-[80vh] rounded-2xl bg-black object-contain"
                    controls
                    autoPlay
                    controlsList="nodownload"
                    preload="metadata"
                  />
                ) : currentModalMediaItem?.type === "youtube" ? (
                  <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
                    <iframe
                      src={currentModalMediaItem.src}
                      title={currentModalMediaItem.alt}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <ProductImage
                    src={currentModalMediaItem?.src}
                    alt={currentModalMediaItem?.alt || product.title}
                    className="w-full h-auto max-h-[82vh] object-contain rounded-2xl"
                  />
                )}

                {productMediaItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-lg"
                      aria-label="Previous image"
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-lg"
                      aria-label="Next image"
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="site-shell py-6 sm:py-8 lg:py-10">
        <div id="product-top" className="scroll-mt-storefront" />

        {/* Top Breadcrumb & Back Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button
              type="button"
              data-no-scroll-top
              onClick={handleBackNavigation}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-slate-400 hover:text-black"
            >
              <FiArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              data-no-scroll-top
              onClick={() => navigate("/")}
              className="hover:text-slate-900 transition-colors"
            >
              Home
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              data-no-scroll-top
              onClick={() => navigate("/shop")}
              className="hover:text-slate-900 transition-colors"
            >
              Shop
            </button>
            {product.category ? (
              <>
                <span className="text-slate-300">/</span>
                {typeof product.category === "object" && product.category?._id ? (
                  <button
                    type="button"
                    data-no-scroll-top
                    onClick={() => navigate(`/shop?category=${product.category._id}`)}
                    className="hover:text-slate-900 font-bold transition-colors text-slate-700"
                  >
                    {product.category?.name || "Category"}
                  </button>
                ) : (
                  <span className="text-slate-700 font-bold">
                    {typeof product.category === "object" ? product.category?.name || "Category" : product.category}
                  </span>
                )}
              </>
            ) : null}
          </nav>

          {product.sku ? (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>SKU:</span>
              <span className="text-slate-900">{product.sku}</span>
            </div>
          ) : null}
        </div>

        {/* Product Showcase: Believers-Style Layout (Left: Vertical Thumbnails + Main Big Image, Right: Details + Actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
          {/* GALLERY: Left 7 Columns */}
          <div className="lg:col-span-7 xl:col-span-7">
            <div className="lg:sticky lg:top-24 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
              {/* Vertical Thumbnails Strip (Desktop / Tablet: sm:flex) */}
              {productMediaItems.length > 1 ? (
                <div className="hidden sm:flex flex-col gap-2.5 w-16 sm:w-20 shrink-0 max-h-[620px] overflow-y-auto scrollbar-none py-0.5">
                  {productMediaItems.map((mediaItem, index) => (
                    <button
                      key={mediaItem.key}
                      type="button"
                      data-no-scroll-top
                      onClick={() => {
                        setSelectedImage(index);
                        setVariantMediaOverride(null);
                      }}
                      className={`relative aspect-square w-full shrink-0 overflow-hidden rounded-md border-2 transition-all duration-150 cursor-pointer ${
                        !variantMediaOverride && selectedImage === index
                          ? "border-slate-950 shadow-sm"
                          : "border-slate-200 bg-white opacity-80 hover:opacity-100 hover:border-slate-400"
                      }`}
                    >
                      {mediaItem.type === "youtube" ? (
                        <div className="relative h-full w-full bg-black">
                          <img
                            src={mediaItem.thumbnailSrc}
                            alt={mediaItem.alt}
                            className="h-full w-full object-cover"
                          />
                          <FaYoutube className="absolute inset-0 m-auto text-red-600 h-4 w-4" />
                        </div>
                      ) : mediaItem.type === "video" ? (
                        <div className="relative h-full w-full bg-black">
                          <video
                            src={mediaItem.src}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/70 text-white px-1 rounded">
                            Vid
                          </span>
                        </div>
                      ) : (
                        <ProductImage
                          src={mediaItem.src}
                          alt={mediaItem.alt}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Main Showcase Big Image */}
              <div className="flex-1 w-full min-w-0">
                <div className="relative aspect-[4/5] max-h-[640px] w-full overflow-hidden rounded-xl border-0 bg-transparent group flex items-center justify-center">
                  {/* Floating Zoom / Lightbox Trigger */}
                  <button
                    type="button"
                    data-no-scroll-top
                    onClick={() => {
                      setCurrentImageIndex(selectedImage);
                      setShowImageModal(true);
                    }}
                    className="absolute top-3 right-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-black hover:scale-110 active:scale-95 cursor-pointer"
                    aria-label="Expand image"
                    title="Click to view full image"
                  >
                    <FiMaximize2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Main Media Viewport */}
                  <div
                    onClick={() => {
                      setCurrentImageIndex(selectedImage);
                      setShowImageModal(true);
                    }}
                    className="flex h-full w-full cursor-zoom-in items-center justify-center overflow-hidden"
                  >
                    {currentMediaItem?.type === "video" ? (
                      <video
                        src={currentMediaItem.src}
                        className="h-full w-full object-contain bg-black"
                        controls
                        controlsList="nodownload"
                        preload="metadata"
                      />
                    ) : currentMediaItem?.type === "youtube" ? (
                      <div className="aspect-video w-full overflow-hidden bg-black">
                        <iframe
                          src={currentMediaItem.src}
                          title={currentMediaItem.alt}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <ProductImage
                        src={currentMediaItem?.src}
                        alt={currentMediaItem?.alt || product.title}
                        isCurrent
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>

                  {/* Chevrons for Prev / Next */}
                  {productMediaItems.length > 1 ? (
                    <>
                      <button
                        type="button"
                        data-no-scroll-top
                        onClick={(event) => {
                          event.stopPropagation();
                          setVariantMediaOverride(null);
                          prevSelectedImage();
                        }}
                        className="absolute left-2.5 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-800 shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Previous image"
                      >
                        <FaChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        data-no-scroll-top
                        onClick={(event) => {
                          event.stopPropagation();
                          setVariantMediaOverride(null);
                          nextSelectedImage();
                        }}
                        className="absolute right-2.5 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-800 shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Next image"
                      >
                        <FaChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : null}

                  {/* Counter Badge */}
                  {productMediaItems.length > 1 ? (
                    <div className="absolute bottom-2.5 right-2.5 z-20 rounded-md bg-slate-900/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white tracking-wider">
                      {selectedImage + 1} / {productMediaItems.length}
                    </div>
                  ) : null}
                </div>

                {/* Mobile Horizontal Thumbnails (< sm) */}
                {productMediaItems.length > 1 ? (
                  <div className="flex sm:hidden items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
                    {productMediaItems.map((mediaItem, index) => (
                      <button
                        key={mediaItem.key}
                        type="button"
                        data-no-scroll-top
                        onClick={() => {
                          setSelectedImage(index);
                          setVariantMediaOverride(null);
                        }}
                        className={`relative aspect-square w-14 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                          !variantMediaOverride && selectedImage === index
                            ? "border-slate-950 ring-1 ring-slate-950"
                            : "border-slate-200 bg-white opacity-80"
                        }`}
                      >
                        <ProductImage
                          src={mediaItem.src}
                          alt={mediaItem.alt}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* PRODUCT DETAILS & ACTIONS: Right 5 Columns */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">
            {/* Badges Bar: Category, In Stock, Rating */}
            <div className="flex flex-wrap items-center gap-2">
              {categoryLabel ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  <FiTag className="h-3 w-3" />
                  {categoryLabel}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-md bg-[#eaf4fe] px-2.5 py-0.5 text-[11px] font-bold text-[#1a73e8]">
                {availabilityBadge?.label || "In Stock"}
              </span>
              <div
                onClick={() => {
                  setActiveTab("reviews");
                  if (typeof document !== "undefined") {
                    document.getElementById("product-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/70 px-2 py-0.5 text-amber-800 text-[11px] cursor-pointer hover:bg-amber-100 transition"
              >
                <FaStar className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="font-extrabold text-slate-900">
                  {Number(reviewSummary.ratingAverage || 0) > 0 ? Number(reviewSummary.ratingAverage).toFixed(1) : "5.0"}
                </span>
                <span className="text-slate-500">({reviewSummary.ratingCount || 0})</span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
              {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {isTbaPrice ? (
                  "TBA"
                ) : showVariationPriceRange ? (
                  <>
                    <span>৳{variationPriceBounds.min.toLocaleString()}</span>
                    <span className="mx-1 text-slate-400 font-light">-</span>
                    <span>৳{variationPriceBounds.max.toLocaleString()}</span>
                  </>
                ) : (
                  <>৳{currentPrice.toLocaleString()}</>
                )}
              </span>
              {!isTbaPrice && !showVariationPriceRange && hasDiscountPrice ? (
                <span className="text-base font-semibold text-slate-400 line-through">
                  ৳{regularPriceForDisplay.toLocaleString()}
                </span>
              ) : null}
            </div>

            {/* Summary Highlights Grid (Category, Brand, Delivery, Pricing) */}
            {summaryHighlights.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {summaryHighlights.map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-slate-900 truncate">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Delivery Service Banner */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <FiTruck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Fast express delivery available nationwide</span>
            </div>

            {/* Product Variation Selectors (Size, Color, etc.) */}
            <div className="space-y-4 pt-1">
              {marketplaceType === "variable" &&
              Array.isArray(product.variations) &&
              product.variations.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Select Size:
                    </label>
                    {selectedVariationId ? (
                      <button
                        type="button"
                        data-no-scroll-top
                        onClick={() => setSelectedVariationId("")}
                        className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-black transition"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.variations
                      .filter((v) => v?.isActive !== false)
                      .map((variation) => {
                        const isSelected = selectedVariationId === String(variation?._id || "");
                        return (
                          <button
                            key={variation._id}
                            type="button"
                            data-no-scroll-top
                            onClick={() => {
                              setSelectedVariationId(isSelected ? "" : String(variation._id));
                              setQuantity(1);
                            }}
                            className={`min-w-[44px] px-3.5 py-2 rounded border text-xs font-bold uppercase transition cursor-pointer ${
                              isSelected
                                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                                : "border-slate-300 bg-white text-slate-800 hover:border-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            {variation.label}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ) : null}

              {/* Dynamic Variant Definitions (Color, Size, Custom) */}
              {productVariantDefinitions.length > 0 ? (
                <div className="space-y-3">
                  {productVariantDefinitions.map((definition, definitionIndex) => {
                    const selectedOption = selectedVariantOptions[definitionIndex];
                    const isColorDefinition =
                      definition.preset === "color" ||
                      definition.name.toLowerCase() === "color";

                    return (
                      <div key={`variant-definition-${definitionIndex}`}>
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <label className="text-xs font-bold text-slate-800">
                            {definition.name || "Option"}:{" "}
                            {selectedOption ? (
                              <span className="font-semibold text-slate-600">
                                {selectedOption?.label || selectedOption?.value}
                              </span>
                            ) : null}
                          </label>
                          {selectedOption ? (
                            <button
                              type="button"
                              data-no-scroll-top
                              onClick={() => {
                                setSelectedVariantOptions((prev) => {
                                  const next = { ...prev };
                                  delete next[definitionIndex];
                                  return next;
                                });
                                if (isColorDefinition) {
                                  setSelectedColor("");
                                }
                              }}
                              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-black transition"
                            >
                              Clear
                            </button>
                          ) : null}
                        </div>

                        {isColorDefinition ? (
                          <div className="flex flex-wrap gap-2.5" role="radiogroup">
                            {definition.options.map((option, optionIndex) => {
                              const optionColor = String(option?.colorHex || option?.value || "").trim().toLowerCase();
                              const isSelected =
                                String(selectedOption?.colorHex || selectedOption?.value || "").trim().toLowerCase() === optionColor;

                              return (
                                <button
                                  key={`variant-color-${definitionIndex}-${optionIndex}`}
                                  type="button"
                                  data-no-scroll-top
                                  onClick={() => {
                                    setSelectedVariantOptions((prev) => {
                                      const currentValue = String(prev?.[definitionIndex]?.colorHex || prev?.[definitionIndex]?.value || "").trim().toLowerCase();
                                      if (currentValue === optionColor) {
                                        const next = { ...prev };
                                        delete next[definitionIndex];
                                        return next;
                                      }
                                      return { ...prev, [definitionIndex]: option };
                                    });
                                    setSelectedColor((prev) =>
                                      String(prev || "").trim().toLowerCase() === optionColor ? "" : optionColor
                                    );
                                  }}
                                  className={`group shrink-0 rounded-full outline-none transition-all ${
                                    isSelected
                                      ? "ring-2 ring-slate-900 ring-offset-2 scale-110"
                                      : "hover:scale-105 opacity-80 hover:opacity-100"
                                  }`}
                                  title={option?.label || option?.value}
                                >
                                  <div className="relative h-7 w-7 rounded-full border border-slate-300 shadow-2xs">
                                    <div
                                      className="absolute inset-0.5 rounded-full"
                                      style={{ backgroundColor: optionColor }}
                                    />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {definition.options.map((option, optionIndex) => {
                              const optionValue = String(option?.label || option?.value || "").trim();
                              const isSelected =
                                String(selectedOption?.label || selectedOption?.value || "").trim() === optionValue;

                              return (
                                <button
                                  key={`variant-option-${definitionIndex}-${optionIndex}`}
                                  type="button"
                                  data-no-scroll-top
                                  onClick={() =>
                                    setSelectedVariantOptions((prev) => {
                                      const currentValue = String(prev?.[definitionIndex]?.label || prev?.[definitionIndex]?.value || "").trim();
                                      if (currentValue === optionValue) {
                                        const next = { ...prev };
                                        delete next[definitionIndex];
                                        return next;
                                      }
                                      return { ...prev, [definitionIndex]: option };
                                    })
                                  }
                                  className={`min-w-[44px] px-3.5 py-2 rounded border text-xs font-bold uppercase transition cursor-pointer ${
                                    isSelected
                                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                                      : "border-slate-300 bg-white text-slate-800 hover:border-slate-800 hover:bg-slate-50"
                                  }`}
                                >
                                  {optionValue}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Legacy Color Options */}
              {legacyColorOptions && legacyColorOptions.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Color:{" "}
                      <span className="font-semibold text-slate-600">
                        {selectedColor || "Select"}
                      </span>
                    </label>
                    {selectedColor ? (
                      <button
                        type="button"
                        data-no-scroll-top
                        onClick={() => setSelectedColor("")}
                        className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-black transition"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2.5" role="radiogroup">
                    {legacyColorOptions.map((color, index) => {
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={`${color}-${index}`}
                          type="button"
                          data-no-scroll-top
                          onClick={() =>
                            setSelectedColor((prev) =>
                              String(prev || "").trim().toLowerCase() === String(color || "").trim().toLowerCase()
                                ? ""
                                : color
                            )
                          }
                          className={`group shrink-0 rounded-full outline-none transition-all ${
                            isSelected
                              ? "ring-2 ring-slate-900 ring-offset-2 scale-110"
                              : "hover:scale-105 opacity-80 hover:opacity-100"
                          }`}
                        >
                          <div className="relative h-7 w-7 rounded-full border border-slate-300 shadow-2xs">
                            <div
                              className="absolute inset-0.5 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Brand */}
            {brandLabel ? (
              <p className="text-sm text-slate-700 pt-1">
                <span className="text-slate-500">Brand:</span>{" "}
                <span className="font-semibold text-slate-900">{brandLabel}</span>
              </p>
            ) : null}

            {/* Quantity Label & Selector + Add To Cart Button row */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-800">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                {/* [- 1 +] box */}
                <div className="flex items-center rounded-lg border border-slate-300 bg-[#f8f9fa] overflow-hidden">
                  <button
                    type="button"
                    data-no-scroll-top
                    onClick={decreaseQuantity}
                    className="px-3.5 py-3 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <FaMinus className="h-3 w-3" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-900 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    data-no-scroll-top
                    onClick={increaseQuantity}
                    disabled={!product.allowBackorder && quantity >= currentStock}
                    className="px-3.5 py-3 text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <FaPlus className="h-3 w-3" />
                  </button>
                </div>

                {/* Add To Cart button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={purchaseActionDisabled}
                  className="flex-1 inline-flex items-center justify-center rounded-lg bg-[#0b1320] hover:bg-black text-white font-extrabold text-sm py-3.5 px-6 uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaShoppingCart className="h-4 w-4 mr-2" />
                  <span>{loading || cartLoading ? "Adding..." : "Add To Cart"}</span>
                </button>
              </div>
            </div>

            {/* Buy Now button: Full Width */}
            <button
              type="button"
              data-no-scroll-top
              onClick={handleBuyNow}
              disabled={purchaseActionDisabled}
              className="w-full inline-flex items-center justify-center rounded-lg bg-[#0b1320] hover:bg-black text-white font-extrabold text-sm py-3.5 px-6 uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy Now
            </button>

            {/* Secondary Actions: Wishlist, Compare, Share */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                data-no-scroll-top
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer ${
                  isWishlisted
                    ? "border-rose-300 bg-rose-50 text-rose-600 shadow-2xs font-black"
                    : "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-600"
                }`}
              >
                {isWishlisted ? (
                  <FaHeart className="h-3.5 w-3.5 fill-rose-600 text-rose-600" />
                ) : (
                  <FiHeart className="h-3.5 w-3.5" />
                )}
                <span>{isWishlisted ? "Saved" : "Wishlist"}</span>
              </button>

              <button
                type="button"
                data-no-scroll-top
                onClick={handleToggleCompare}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isCompared
                    ? "border-blue-600 bg-blue-50 text-blue-600 font-black shadow-2xs"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                <FiShuffle className="h-3.5 w-3.5" />
                <span>{isCompared ? "Compared" : "Compare"}</span>
              </button>

              <button
                type="button"
                data-no-scroll-top
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 cursor-pointer"
                title="Share product"
              >
                <FiShare2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Information Section: Modern Segmented Tabs */}
        <div id="product-tabs-section" className="mt-16 sm:mt-20 scroll-mt-24">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
            {/* Tabs Header */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-5">
              <button
                type="button"
                data-no-scroll-top
                id="product-tab-description"
                role="tab"
                aria-selected={activeTab === "description"}
                aria-controls="product-tabpanel-description"
                tabIndex={activeTab === "description" ? 0 : -1}
                onClick={() => setActiveTab("description")}
                className={`rounded-2xl px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === "description"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                Description
              </button>
              <button
                type="button"
                data-no-scroll-top
                id="product-tab-additional"
                role="tab"
                aria-selected={activeTab === "additional"}
                aria-controls="product-tabpanel-additional"
                tabIndex={activeTab === "additional" ? 0 : -1}
                onClick={() => setActiveTab("additional")}
                className={`rounded-2xl px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === "additional"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                Specifications & Details
              </button>
              <button
                type="button"
                data-no-scroll-top
                id="product-tab-reviews"
                role="tab"
                aria-selected={activeTab === "reviews"}
                aria-controls="product-tabpanel-reviews"
                tabIndex={activeTab === "reviews" ? 0 : -1}
                onClick={() => setActiveTab("reviews")}
                className={`rounded-2xl px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === "reviews"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                Customer Reviews ({Number(reviewSummary.ratingCount || 0)})
              </button>
            </div>

            {/* Tabs Content */}
            <div className="pt-8">
              {/* Description Tab Panel */}
              {activeTab === "description" ? (
                <div
                  id="product-tabpanel-description"
                  role="tabpanel"
                  aria-labelledby="product-tab-description"
                  className="space-y-10"
                >
                  {product.description ? (
                    hasHtmlContent(product.description) ? (
                      <div
                        className="prose prose-slate max-w-4xl text-slate-600 leading-relaxed *:wrap-break-word"
                        dangerouslySetInnerHTML={{
                          __html: product.description,
                        }}
                      />
                    ) : (
                      <div className="max-w-4xl whitespace-pre-line text-base leading-8 text-slate-600">
                        {product.description}
                      </div>
                    )
                  ) : (
                    <p className="text-slate-500">No description available for this product.</p>
                  )}

                  {featureColumns.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pt-6 border-t border-slate-100">
                      {featureColumns.map((column, columnIndex) => (
                        <div key={`feature-column-${columnIndex}`}>
                          <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
                            {columnIndex === 0 ? "Core Technologies" : "Key Product Highlights"}
                          </h3>
                          <div className="space-y-3">
                            {column.map((feature) => (
                              <div
                                key={`${columnIndex}-${feature}`}
                                className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-colors hover:border-slate-300"
                              >
                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                                <span className="text-xs sm:text-sm font-bold text-slate-800">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {marketplaceType === "grouped" &&
                  Array.isArray(product.groupedProducts) &&
                  product.groupedProducts.length > 0 ? (
                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="mb-5 text-sm font-black uppercase tracking-wider text-slate-900">
                        Included Products in this Group
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {product.groupedProducts.map((groupedProduct) => {
                          const groupedPriceType = String(groupedProduct?.priceType || "single");
                          const groupedPrice =
                            Number(groupedProduct?.salePrice) > 0
                              ? Number(groupedProduct.salePrice)
                              : Number(groupedProduct?.price || 0);

                          return (
                            <div
                              key={groupedProduct._id}
                              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-400 transition"
                            >
                              <ProductImage
                                src={groupedProduct?.images?.[0]}
                                alt={groupedProduct?.title}
                                className="h-16 w-16 rounded-xl bg-slate-50 object-contain p-2"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-slate-900">
                                  {groupedProduct?.title}
                                </p>
                                <p className="mt-0.5 text-xs font-semibold text-blue-600">
                                  {groupedPriceType === "tba"
                                    ? "TBA"
                                    : Number.isFinite(groupedPrice)
                                    ? `৳${groupedPrice.toFixed(2)}`
                                    : "Price TBA"}
                                </p>
                              </div>
                              <button
                                type="button"
                                data-no-scroll-top
                                onClick={() => navigate(`/product/${groupedProduct._id}`)}
                                className="rounded-xl bg-slate-900 hover:bg-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition"
                              >
                                View
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Additional Information Tab Panel */}
              {activeTab === "additional" ? (
                <div
                  id="product-tabpanel-additional"
                  role="tabpanel"
                  aria-labelledby="product-tab-additional"
                >
                  {additionalInfoRows.length > 0 ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xs">
                      <table className="min-w-full text-sm divide-y divide-slate-200">
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {additionalInfoRows.map((row, idx) => (
                            <tr
                              key={`${row.label}-${row.value}`}
                              className={idx % 2 === 0 ? "bg-slate-50/40" : "bg-white"}
                            >
                              <th
                                scope="row"
                                className="w-1/3 px-5 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500"
                              >
                                {row.label}
                              </th>
                              <td className="px-5 py-4 text-xs sm:text-sm font-medium text-slate-800 whitespace-pre-line">
                                {row.value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No additional specifications available.</p>
                  )}
                </div>
              ) : null}

              {/* Customer Reviews Tab Panel */}
              {activeTab === "reviews" ? (
                <div
                  id="product-tabpanel-reviews"
                  role="tabpanel"
                  aria-labelledby="product-tab-reviews"
                >
                  <section id="reviews" data-review-section className="scroll-mt-storefront">
                    <ProductReviewsPanel
                      isLoggedIn={isLoggedIn}
                      myReview={myReview}
                      productTitle={product?.title || "Product"}
                      reviewSummary={reviewSummary}
                      reviews={reviews}
                      reviewsLoading={reviewsLoading}
                      reviewForm={reviewForm}
                      hoverRating={hoverRating}
                      reviewSubmitting={reviewSubmitting}
                      reviewDeleting={reviewDeleting}
                      user={user}
                      onLoginNavigate={() => navigate("/login")}
                      onFieldChange={(field, value) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          [field]: value,
                        }))
                      }
                      onHoverRatingChange={setHoverRating}
                      onRatingChange={(rating) =>
                        setReviewForm((prev) => ({ ...prev, rating }))
                      }
                      onSubmitReview={handleSubmitReview}
                      onDeleteReview={handleDeleteReview}
                      onEditReview={(review) => {
                        setMyReview(review);
                        setReviewForm({
                          rating: Number(review.rating || 0),
                          title: review.title || "",
                          comment: review.comment || "",
                          reviewerName: review.reviewerName || user?.name || "",
                          reviewerEmail: review.reviewerEmail || user?.email || "",
                        });
                        if (typeof document !== "undefined") {
                          document.getElementById("review-form")?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }}
                    />
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Recently Viewed Products Grid Section */}
        {sideRecentlyViewed.length > 0 ? (
          <section className="mt-16 sm:mt-20 pb-4 border-t border-slate-200/80 pt-10">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FiClock className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Recently Viewed Products
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {sideRecentlyViewed.length} {sideRecentlyViewed.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sideRecentlyViewed.map((recentItem) => {
                const recentImg = Array.isArray(recentItem.images)
                  ? recentItem.images[0]
                  : recentItem.image || "";
                const recentPrice =
                  Number(recentItem.salePrice) > 0
                    ? Number(recentItem.salePrice)
                    : Number(recentItem.price || 0);
                const recentRegularPrice = Number(recentItem.regularPrice || 0);
                const hasRecentDiscount =
                  recentRegularPrice > recentPrice && recentPrice > 0;

                return (
                  <div
                    key={recentItem._id}
                    onClick={() => handleNavigateToProduct(recentItem._id)}
                    className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-md hover:border-slate-400 transition-all cursor-pointer"
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-50 p-2">
                      <ProductImage
                        src={recentImg}
                        alt={recentItem.title}
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="mt-2.5 flex-1 flex flex-col justify-between">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 line-clamp-1 transition-colors">
                        {recentItem.title}
                      </p>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xs font-black text-slate-900">
                          ৳{recentPrice.toLocaleString()}
                        </span>
                        {hasRecentDiscount ? (
                          <span className="text-[10px] text-slate-400 line-through">
                            ৳{recentRegularPrice.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Related Products Carousel / Grid */}
        {relatedProductsLoading || relatedProducts.length > 0 ? (
          <section className="mt-20 sm:mt-24 pb-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Curated For You
                </span>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Related Products
                </h2>
              </div>
              <button
                type="button"
                data-no-scroll-top
                onClick={() => {
                  const categoryId =
                    product?.category && typeof product.category === "object"
                      ? String(product.category?._id || "").trim()
                      : "";
                  navigate(categoryId ? `/shop?category=${categoryId}` : "/shop");
                  if (typeof window !== "undefined") window.scrollTo(0, 0);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-2xs transition hover:border-slate-400 hover:text-black hover:bg-slate-50"
              >
                <span>View Full Collection</span>
                <span>&rarr;</span>
              </button>
            </div>

            <div className="storefront-card-grid">
              {relatedProductsLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`related-skeleton-${index}`}
                      className="storefront-card-grid__item animate-pulse"
                    >
                      <div className="storefront-product-card rounded-3xl border border-slate-100 bg-white p-3.5 shadow-sm">
                        <div className="aspect-square rounded-2xl bg-slate-100" />
                        <div className="mt-4 space-y-3">
                          <div className="h-3 w-24 rounded bg-slate-100" />
                          <div className="h-4 w-4/5 rounded bg-slate-100" />
                          <div className="h-10 w-full rounded bg-slate-100" />
                        </div>
                      </div>
                    </div>
                  ))
                : relatedProducts.map((entry) => (
                    <div key={entry._id} className="storefront-card-grid__item">
                      <StorefrontProductCard
                        product={entry}
                        className="h-full"
                        onViewDetails={() => handleNavigateToProduct(entry._id)}
                      />
                    </div>
                  ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default ProductDetails;
