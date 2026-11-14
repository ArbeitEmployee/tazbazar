import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/routing";
import LandingSectionProductCard from "./LandingSectionProductCard";
import { fetchHomeCatalog } from "../../utils/homeCatalog";
const INITIAL_VISIBLE_PRODUCTS = 4;

const SECTION_THEMES = {
  popular: {
    sectionClassName: "relative overflow-hidden bg-white py-12 sm:py-16 border-t border-slate-100",
    contentShellClassName: "home-showcase-section-shell",
    headerWrapClassName: "mb-8 sm:mb-10 text-center",
    eyebrowClassName:
      "inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-bold text-blue-600 border border-blue-100 uppercase tracking-wider",
    titleClassName:
      "mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900",
    descriptionClassName: "mx-auto mt-2 max-w-xl text-xs sm:text-sm text-slate-500 font-medium",
    tabsWrapClassName: "mb-8 flex flex-wrap justify-center gap-2",
    activeTabClassName: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20",
    inactiveTabClassName:
      "border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-slate-50/50",
    buttonClassName:
      "rounded-xl bg-slate-900 hover:bg-blue-600 text-white border-transparent shadow-md hover:shadow-lg transition-all",
    buttonWrapClassName: "justify-center",
  },
  "hot-deals": {
    sectionClassName: "bg-white py-12 sm:py-16 border-t border-slate-100",
    contentShellClassName: "home-showcase-section-shell",
    headerWrapClassName: "mb-8 sm:mb-10 text-center",
    eyebrowClassName:
      "inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-100 uppercase tracking-wider",
    titleClassName:
      "mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900",
    descriptionClassName: "mx-auto mt-2 max-w-xl text-xs sm:text-sm text-slate-500 font-medium",
    tabsWrapClassName: "mb-8 flex flex-wrap justify-center gap-2",
    activeTabClassName:
      "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20",
    inactiveTabClassName:
      "border-slate-200 bg-white text-slate-600 hover:border-rose-400 hover:text-rose-600 hover:bg-slate-50/50",
    buttonClassName:
      "rounded-xl bg-slate-900 hover:bg-rose-600 text-white border-transparent shadow-md hover:shadow-lg transition-all",
    buttonWrapClassName: "justify-center",
  },
  featured: {
    sectionClassName: "bg-white py-12 sm:py-16 border-t border-slate-100",
    contentShellClassName: "home-showcase-section-shell home-showcase-section-shell--featured",
    headerWrapClassName: "mb-8 sm:mb-10 text-left",
    eyebrowClassName:
      "inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-[11px] font-bold text-indigo-600 border border-indigo-100 uppercase tracking-wider",
    titleClassName:
      "mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900",
    descriptionClassName: "mt-2 max-w-xl text-xs sm:text-sm text-slate-500 font-medium",
    tabsWrapClassName: "mb-8 flex flex-wrap gap-2",
    activeTabClassName:
      "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20",
    inactiveTabClassName:
      "border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-slate-50/50",
    buttonClassName:
      "rounded-xl bg-slate-900 hover:bg-indigo-600 text-white border-transparent shadow-md hover:shadow-lg transition-all",
    buttonWrapClassName: "justify-start",
  },
  "best-selling": {
    sectionClassName: "bg-white py-12 sm:py-16 border-t border-slate-100",
    contentShellClassName: "home-showcase-section-shell",
    headerWrapClassName: "mb-8 sm:mb-10 text-left",
    eyebrowClassName:
      "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-100 uppercase tracking-wider",
    titleClassName:
      "mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900",
    descriptionClassName: "mt-2 max-w-xl text-xs sm:text-sm text-slate-500 font-medium",
    tabsWrapClassName: "mb-8 flex flex-wrap gap-2",
    activeTabClassName:
      "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20",
    inactiveTabClassName:
      "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-slate-50/50",
    buttonClassName:
      "rounded-xl bg-slate-900 hover:bg-emerald-600 text-white border-transparent shadow-md hover:shadow-lg transition-all",
    buttonWrapClassName: "justify-start",
  },
  latest: {
    sectionClassName: "relative overflow-hidden bg-white py-12 sm:py-16 border-t border-slate-100",
    contentShellClassName: "home-showcase-section-shell",
    headerWrapClassName: "mb-8 sm:mb-10 text-center",
    eyebrowClassName:
      "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1 text-[11px] font-bold text-amber-600 border border-amber-100 uppercase tracking-wider",
    titleClassName: "mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900",
    descriptionClassName: "mx-auto mt-2 max-w-xl text-xs sm:text-sm text-slate-500 font-medium",
    tabsWrapClassName: "mb-8 flex flex-wrap justify-center gap-2",
    activeTabClassName:
      "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20",
    inactiveTabClassName:
      "border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:text-amber-600 hover:bg-slate-50/50",
    buttonClassName:
      "rounded-xl bg-slate-900 hover:bg-blue-600 text-white border-transparent shadow-md hover:shadow-lg transition-all",
    buttonWrapClassName: "justify-center",
  },
};

const groupProductsByCategory = (products) => {
  const grouped = {};

  products.forEach((product) => {
    const productCategory = product?.category;
    let categoryId = "general";
    let categoryName = "General";

    if (typeof productCategory === "object" && productCategory?._id) {
      categoryId = productCategory._id;
      categoryName = productCategory.name || categoryName;
    } else if (typeof productCategory === "string" && productCategory.trim()) {
      categoryId = productCategory;
    }

    if (!grouped[categoryId]) {
      grouped[categoryId] = {
        categoryName,
        products: [],
      };
    }

    grouped[categoryId].products.push(product);
  });

  return grouped;
};

const resolveSectionProducts = (section) => {
  if (!section || !Array.isArray(section.categories)) {
    return [];
  }

  return section.categories.flatMap((category) =>
    Array.isArray(category?.products) ? category.products : [],
  );
};

const normalizeProducts = (products) =>
  Array.isArray(products) ? products.filter(Boolean) : [];

const ProductShowcaseSection = ({
  sectionId,
  productType,
  products,
  eyebrow,
  title,
  description,
  badgeText = "",
  loadingTitle,
  loadingDescription = "Organizing by categories...",
  emptyTitle,
  emptyDescription = "Please check back soon for more products.",
  viewAllNoun = "Products",
  containerClassName = "product-rail-shell",
  variant = "popular",
}) => {
  const navigate = useNavigate();
  const [groupedProducts, setGroupedProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  const theme = SECTION_THEMES[variant] || SECTION_THEMES.popular;

  useEffect(() => {
    let ignore = false;

    const applyProductState = (products) => {
      const grouped = groupProductsByCategory(products);
      const categoryIds = Object.keys(grouped);

      setGroupedProducts(grouped);
      setExpandedCategories(
        categoryIds.reduce((acc, categoryId) => {
          acc[categoryId] = false;
          return acc;
        }, {}),
      );
      setActiveCategory(categoryIds[0] || null);
    };

    const fetchProducts = async () => {
      try {
        setLoading(true);
        if (Array.isArray(products)) {
          applyProductState(normalizeProducts(products));
          return;
        }

        const catalog = await fetchHomeCatalog();
        if (ignore) return;

        const section = catalog?.sections?.[productType];
        const resolvedProducts = resolveSectionProducts(section);

        if (ignore) return;
        applyProductState(normalizeProducts(resolvedProducts));
      } catch (error) {
        console.error(`Error fetching ${productType} products:`, error);
        if (!ignore) {
          setGroupedProducts({});
          setActiveCategory(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      ignore = true;
    };
  }, [productType, products, title]);

  const categories = useMemo(() => Object.keys(groupedProducts), [groupedProducts]);
  const currentCategory = activeCategory ? groupedProducts[activeCategory] : null;
  const isExpanded = activeCategory ? expandedCategories[activeCategory] : false;
  const visibleProducts = useMemo(() => {
    if (!currentCategory) return [];
    if (isExpanded) return currentCategory.products;
    return currentCategory.products.slice(0, INITIAL_VISIBLE_PRODUCTS);
  }, [currentCategory, isExpanded]);

  if (!loading && (!categories.length || !currentCategory)) {
    return null;
  }

  const toggleExpanded = () => {
    if (!activeCategory) return;
    setExpandedCategories((prev) => ({
      ...prev,
      [activeCategory]: !prev[activeCategory],
    }));
  };

  const handleViewDetails = (product) => {
    navigate(`/product/${product?._id || product?.id}`);
  };

  const renderEmptyState = (titleText, copyText) => (
    <div className="py-12 text-center">
      <h3 className={theme.titleClassName}>{titleText}</h3>
      <p className={`${theme.descriptionClassName} mt-3`}>{copyText}</p>
    </div>
  );

  return (
    <section id={sectionId} className={`${theme.sectionClassName} home-showcase-font`}>
      <div className={`${containerClassName} relative z-10`}>
        <div className={theme.contentShellClassName}>
          <div className={theme.headerWrapClassName}>
            <div>
              <span className={theme.eyebrowClassName}>{eyebrow}</span>
              <h2 className={theme.titleClassName}>{title}</h2>
              {description ? (
                <p className={theme.descriptionClassName}>{description}</p>
              ) : null}
            </div>
          </div>

          {loading
            ? renderEmptyState(loadingTitle || `Loading ${title}`, loadingDescription)
            : null}

          {!loading && categories.length && currentCategory ? (
            <>
              <div className={theme.tabsWrapClassName}>
                {categories.map((categoryId) => {
                  const category = groupedProducts[categoryId];
                  const isActive = activeCategory === categoryId;

                  return (
                    <button
                      key={categoryId}
                      type="button"
                      onClick={() => setActiveCategory(categoryId)}
                      className={`home-showcase-label rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] transition-all duration-200 ${
                        isActive ? theme.activeTabClassName : theme.inactiveTabClassName
                      }`}
                    >
                      {category.categoryName}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-1 flex-col overflow-visible">
                <div className="home-showcase-grid">
                  {visibleProducts.map((product) => (
                    <LandingSectionProductCard
                      key={product?._id || product?.id}
                      product={product}
                      variant={variant}
                      badgeText={badgeText}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>

                {currentCategory.products.length > INITIAL_VISIBLE_PRODUCTS ? (
                  <div className={`mt-12 flex ${theme.buttonWrapClassName}`}>
                    <button
                      type="button"
                      onClick={toggleExpanded}
                      className={`home-showcase-label inline-flex items-center gap-3 rounded-full border px-6 py-3 text-[11px] font-bold uppercase tracking-[0.28em] transition-all duration-300 ${theme.buttonClassName}`}
                    >
                      <span>
                        {isExpanded
                          ? "Show Less"
                          : variant === "latest"
                            ? `Explore ${viewAllNoun}`
                            : `View All ${viewAllNoun}`}
                      </span>
                      {variant === "latest" ? <span aria-hidden="true">-&gt;</span> : null}
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcaseSection;
