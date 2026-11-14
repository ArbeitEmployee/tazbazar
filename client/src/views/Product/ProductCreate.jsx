/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import axios from "axios";
import RichTextEditor from "../../components/RichTextEditor";
import SearchableSelect from "../../components/SearchableSelect";
import { useThemeColors } from "../../hooks/useThemeColors";
import { stripHtml } from "../../utils/richText";
import {
  isAllowedProductVideoType,
  MAX_PRODUCT_VIDEO_UPLOADS,
  MAX_PRODUCT_VIDEO_SIZE_BYTES,
} from "../../utils/productMedia";
import {
  FiImage,
  FiUpload,
  FiType,
  FiFileText,
  FiDollarSign,
  FiTag,
  FiPackage,
  FiBox,
  FiLayers,
  FiTruck,
  FiX,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiChevronDown,
  FiList,
  FiVideo,
  FiSliders,
  FiEye,
} from "react-icons/fi";

const ProductCreate = () => {
  const { themeColor } = useThemeColors();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // Active navigation tab for a clean, organized dashboard experience
  const [activeTab, setActiveTab] = useState("basic"); // basic | media | variants | specs

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Main and Gallery Images
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // Video & YouTube
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [youtubeVideoUrls, setYoutubeVideoUrls] = useState([""]);

  // Form Basic & Inventory State
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    salePrice: "",
    sku: "",
    stock: "0",
    lowStockThreshold: "5",
    allowBackorder: false,
    category: "",
    productType: "General",
    brand: "",
    weight: "",
    dimensions: "",
    deliveryMinDays: "2",
    deliveryMaxDays: "5",
    colors: [],
  });

  const [errors, setErrors] = useState({});
  const [customColorValue, setCustomColorValue] = useState("#2563eb");
  const [brandOptions, setBrandOptions] = useState([]);

  // Dynamic Product Variant Definitions (Size, Color, Custom with Image Assignment)
  const createVariantOption = (preset = "custom") => ({
    label: preset === "color" ? "Black" : "",
    value: preset === "color" ? "#000000" : "",
    colorHex: preset === "color" ? "#000000" : "",
    priceMode: "default",
    price: "",
    comparePrice: "",
    imageUrl: "",
  });

  const createVariantDefinition = (preset = "size") => ({
    preset,
    name: preset === "size" ? "Size" : preset === "color" ? "Color" : "Option",
    options: [createVariantOption(preset)],
  });

  const [variantDefinitions, setVariantDefinitions] = useState([
    {
      preset: "size",
      name: "Size",
      options: [
        { label: "M", value: "M", colorHex: "", priceMode: "default", price: "", comparePrice: "", imageUrl: "" },
        { label: "L", value: "L", colorHex: "", priceMode: "default", price: "", comparePrice: "", imageUrl: "" },
        { label: "XL", value: "XL", colorHex: "", priceMode: "default", price: "", comparePrice: "", imageUrl: "" },
      ],
    },
  ]);

  const [features, setFeatures] = useState([""]);
  const [specifications, setSpecifications] = useState([
    { key: "", value: "" },
  ]);

  const productTypes = [
    "General",
    "Popular",
    "Hot deals",
    "Best Selling",
    "Latest",
  ];

  const presetColorPalette = [
    { name: "Black", value: "#000000" },
    { name: "White", value: "#ffffff" },
    { name: "Red", value: "#dc2626" },
    { name: "Blue", value: "#2563eb" },
    { name: "Green", value: "#16a34a" },
    { name: "Yellow", value: "#ca8a04" },
    { name: "Purple", value: "#9333ea" },
    { name: "Gray", value: "#6b7280" },
    { name: "Orange", value: "#ea580c" },
    { name: "Navy", value: "#1e3a8a" },
  ];

  const getToken = () => localStorage.getItem("token");
  const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const brandSelectOptions = useMemo(
    () =>
      brandOptions.map((brand) => ({
        value: String(brand?.name || "").trim(),
        label: String(brand?.name || "").trim(),
        description: "Catalog brand",
      })),
    [brandOptions],
  );

  // Combined list of all available uploaded images for instant variant option selection
  const allAvailableImages = useMemo(() => {
    const items = [];
    if (mainImagePreview) {
      items.push({ id: "main-0", label: "Main Image", src: mainImagePreview, isMain: true });
    }
    galleryPreviews.forEach((preview, idx) => {
      items.push({ id: `gallery-${idx}`, label: `Gallery #${idx + 1}`, src: preview });
    });
    return items;
  }, [mainImagePreview, galleryPreviews]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${baseUrl}/categories`, {
        headers: getAuthHeaders(),
      });

      let categoriesData = [];
      if (response.data.success) {
        categoriesData = response.data.categories || [];
      } else if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      }

      setCategories(categoriesData);
    } catch (err) {
      toast.error("Failed to load category options");
      if (err.response?.status === 401) {
        toast.error("Please login again");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandOptions = async () => {
    try {
      const response = await axios.get(`${baseUrl}/brands/public`);
      const rows = Array.isArray(response.data?.brands)
        ? response.data.brands
        : [];
      setBrandOptions(rows);
    } catch (_error) {
      setBrandOptions([]);
    }
  };

  const normalizeTypeKey = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

  const resolveCategoryTypeLabel = (value) => {
    const key = normalizeTypeKey(value);
    if (!key) return "General";
    const match = productTypes.find((label) => normalizeTypeKey(label) === key);
    return match || String(value || "").trim() || "General";
  };

  const resolveCategoryTypeKey = (category) => {
    const rawType = category?.type ?? category?.categoryType ?? category?.productType;
    const key = normalizeTypeKey(rawType);
    return key || "general";
  };

  const filterCategoriesByType = (type, list = categories) => {
    if (!list.length) {
      setFilteredCategories([]);
      return;
    }
    const targetTypeKey = normalizeTypeKey(type) || "general";
    const filtered = list.filter(
      (cat) => resolveCategoryTypeKey(cat) === targetTypeKey,
    );
    setFilteredCategories(filtered);
    if (form.category && !filtered.find((cat) => cat._id === form.category)) {
      setForm((prev) => ({ ...prev, category: "" }));
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBrandOptions();
  }, []);

  useEffect(() => {
    if (!categories.length) {
      setFilteredCategories([]);
      return;
    }
    filterCategoriesByType(form.productType, categories);
  }, [categories, form.productType]);

  useEffect(
    () => () => {
      videoPreviews.forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview);
      });
    },
    [videoPreviews],
  );

  const handleProductTypeChange = (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, productType: value, category: "" }));
    filterCategoriesByType(value);
  };

  // Image Upload Handlers
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPG, PNG, WebP, GIF allowed.");
      return;
    }

    setMainImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMainImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryChange = (e) => {
    const filesArray = Array.from(e.target.files);
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];

    const validFiles = filesArray.filter((file) => {
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only JPG, PNG, WebP, GIF allowed.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newFiles = [...galleryFiles, ...validFiles].slice(0, 8);
      setGalleryFiles(newFiles);

      const newPreviews = [...galleryPreviews];
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          if (newPreviews.length === newFiles.length) {
            setGalleryPreviews(newPreviews.slice(0, 8));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview("");
  };

  const removeGalleryImage = (index) => {
    const newFiles = galleryFiles.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryFiles(newFiles);
    setGalleryPreviews(newPreviews);
  };

  const handleVideoChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const availableSlots = Math.max(0, MAX_PRODUCT_VIDEO_UPLOADS - videoFiles.length);
    if (availableSlots <= 0) {
      toast.error(`You can upload up to ${MAX_PRODUCT_VIDEO_UPLOADS} videos.`);
      e.target.value = "";
      return;
    }

    const nextFiles = [];
    const nextPreviews = [];

    selectedFiles.slice(0, availableSlots).forEach((file) => {
      if (!isAllowedProductVideoType(file)) {
        toast.error("Only MP4, WebM, OGG, or MOV videos are allowed.");
        return;
      }

      if (file.size > MAX_PRODUCT_VIDEO_SIZE_BYTES) {
        toast.error("Each product video must be 9 MB or smaller.");
        return;
      }

      nextFiles.push(file);
      nextPreviews.push(URL.createObjectURL(file));
    });

    if (nextFiles.length > 0) {
      setVideoFiles((prev) => [...prev, ...nextFiles].slice(0, MAX_PRODUCT_VIDEO_UPLOADS));
      setVideoPreviews((prev) => [...prev, ...nextPreviews].slice(0, MAX_PRODUCT_VIDEO_UPLOADS));
    }
  };

  const removeVideo = (index) => {
    if (videoPreviews[index]) {
      URL.revokeObjectURL(videoPreviews[index]);
    }
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleYoutubeUrlChange = (index, value) => {
    setYoutubeVideoUrls((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addYoutubeUrlField = () => {
    setYoutubeVideoUrls((prev) => [...prev, ""]);
  };

  const removeYoutubeUrlField = (index) => {
    setYoutubeVideoUrls((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  };

  // Form Field Validation & Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      validateField(name, type === "checkbox" ? checked : value);
    }
  };

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "title":
        if (!value.trim()) error = "Title is required";
        else if (value.trim().length < 3) error = "Title must be at least 3 characters";
        break;
      case "description":
        if (!stripHtml(value).trim()) error = "Description is required";
        break;
      case "price":
        if (!value) error = "Price is required";
        else if (isNaN(value) || parseFloat(value) <= 0) error = "Valid positive price required";
        break;
      case "category":
        if (!value) error = "Category is required";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  // Variant Definition Handlers (Size, Color, Custom)
  const handleVariantDefinitionAdd = (preset = "size") => {
    setVariantDefinitions((prev) => [...prev, createVariantDefinition(preset)]);
  };

  const handleVariantDefinitionRemove = (index) => {
    setVariantDefinitions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantDefinitionChange = (index, field, value) => {
    setVariantDefinitions((prev) =>
      prev.map((def, i) => (i === index ? { ...def, [field]: value } : def))
    );
  };

  const handleVariantOptionAdd = (defIndex) => {
    setVariantDefinitions((prev) =>
      prev.map((def, i) =>
        i === defIndex
          ? { ...def, options: [...def.options, createVariantOption(def.preset)] }
          : def
      )
    );
  };

  const handleVariantOptionRemove = (defIndex, optIndex) => {
    setVariantDefinitions((prev) =>
      prev.map((def, i) =>
        i === defIndex
          ? { ...def, options: def.options.filter((_, oi) => oi !== optIndex) }
          : def
      )
    );
  };

  const handleVariantOptionChange = (defIndex, optIndex, field, value) => {
    setVariantDefinitions((prev) =>
      prev.map((def, i) => {
        if (i !== defIndex) return def;
        const newOptions = def.options.map((opt, oi) => {
          if (oi !== optIndex) return opt;
          return { ...opt, [field]: value };
        });
        return { ...def, options: newOptions };
      })
    );
  };

  // Assign specific image to an option
  const handleVariantOptionImageAssign = (defIndex, optIndex, imageUrl) => {
    handleVariantOptionChange(defIndex, optIndex, "imageUrl", imageUrl);
  };

  // Features & Specifications
  const handleFeatureAdd = () => setFeatures([...features, ""]);
  const handleFeatureChange = (index, value) => {
    const copy = [...features];
    copy[index] = value;
    setFeatures(copy);
  };
  const handleFeatureRemove = (index) => {
    if (features.length > 1) setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSpecificationAdd = () => setSpecifications([...specifications, { key: "", value: "" }]);
  const handleSpecificationChange = (index, field, value) => {
    const copy = [...specifications];
    copy[index][field] = value;
    setSpecifications(copy);
  };
  const handleSpecificationRemove = (index) => {
    if (specifications.length > 1) setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    let isValid = true;
    isValid = validateField("title", form.title) && isValid;
    isValid = validateField("description", form.description) && isValid;
    isValid = validateField("price", form.price) && isValid;
    isValid = validateField("category", form.category) && isValid;

    if (!mainImagePreview) {
      toast.error("Main product image is required (under Media tab)");
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in required fields (Title, Price, Category, Main Image)");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Creating product with variants & media...");

    try {
      const token = getToken();
      if (!token) {
        toast.error("Authentication required. Please login again.", { id: toastId });
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("price", form.price);
      if (form.salePrice) formData.append("salePrice", form.salePrice);
      formData.append("sku", form.sku.trim());
      formData.append("stock", form.stock || "0");
      formData.append("lowStockThreshold", form.lowStockThreshold || "5");
      formData.append("allowBackorder", String(Boolean(form.allowBackorder)));
      formData.append("category", form.category);
      formData.append("productType", form.productType);
      formData.append("brand", form.brand.trim());
      formData.append("weight", form.weight || "0");
      formData.append("dimensions", form.dimensions.trim());
      formData.append("deliveryMinDays", form.deliveryMinDays || "2");
      formData.append("deliveryMaxDays", form.deliveryMaxDays || "5");
      formData.append(
        "youtubeVideoUrls",
        JSON.stringify(youtubeVideoUrls.map((val) => val.trim()).filter(Boolean)),
      );

      // Clean and normalize variant definitions with assigned images
      const cleanedVariantDefs = variantDefinitions
        .filter((def) => def.name.trim() && def.options.length > 0)
        .map((def) => ({
          preset: def.preset,
          name: def.name.trim(),
          options: def.options
            .filter((opt) => opt.label.trim() || opt.value.trim() || opt.colorHex)
            .map((opt) => ({
              label: opt.label.trim() || opt.value.trim() || opt.colorHex,
              value: opt.value.trim() || opt.label.trim() || opt.colorHex,
              colorHex: def.preset === "color" ? opt.colorHex || opt.value || "#000000" : "",
              priceMode: opt.priceMode || "default",
              price: opt.price ? Number(opt.price) : null,
              comparePrice: opt.comparePrice ? Number(opt.comparePrice) : null,
              imageUrl: String(opt.imageUrl || "").trim(),
            })),
        }));

      formData.append("variantDefinitions", JSON.stringify(cleanedVariantDefs));

      // Extract colors for legacy colors field
      const colorDefs = cleanedVariantDefs.filter((d) => d.preset === "color");
      const derivedColors = colorDefs.flatMap((d) => d.options.map((o) => o.colorHex || o.value)).filter(Boolean);
      formData.append("colors", JSON.stringify(derivedColors));

      formData.append("features", JSON.stringify(features.filter((f) => f.trim())));
      formData.append(
        "specifications",
        JSON.stringify(specifications.filter((s) => s.key.trim() && s.value.trim()))
      );
      formData.append("isActive", "true");

      // Append files
      if (mainImageFile) {
        formData.append("images", mainImageFile);
      }
      galleryFiles.forEach((image) => {
        formData.append("images", image);
      });
      videoFiles.forEach((video) => {
        formData.append("videos", video);
      });

      const response = await axios.post(`${baseUrl}/products`, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("Product created successfully with variants & media!", { id: toastId });

        // Reset state
        setForm({
          title: "",
          description: "",
          price: "",
          salePrice: "",
          sku: "",
          stock: "0",
          lowStockThreshold: "5",
          allowBackorder: false,
          category: "",
          productType: "General",
          brand: "",
          weight: "",
          dimensions: "",
          deliveryMinDays: "2",
          deliveryMaxDays: "5",
          colors: [],
        });
        setFeatures([""]);
        setSpecifications([{ key: "", value: "" }]);
        setMainImageFile(null);
        setMainImagePreview("");
        setGalleryFiles([]);
        setGalleryPreviews([]);
        setVideoFiles([]);
        setVideoPreviews([]);
        setYoutubeVideoUrls([""]);
        setErrors({});

        window.dispatchEvent(
          new CustomEvent("productCreated", {
            detail: response.data.product,
          })
        );
      }
    } catch (err) {
      let errorMessage = "Failed to create product";
      if (err.response?.data?.message) {
        errorMessage = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(", ")
          : err.response.data.message;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] w-full">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-slate-500 font-semibold">Loading catalog data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-16">
      
      {/* ── Page Header & Action Bar ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Create New Product
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Add a new item to your store catalog with multi-variant images, pricing, and specs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Creating Product...</span>
              </>
            ) : (
              <>
                <FiPlus className="h-4 w-4" />
                <span>Publish Product</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Visual Navigation Tabs ── */}
      <div className="mb-6 flex overflow-x-auto border-b border-slate-200 no-scrollbar">
        {[
          { id: "basic", label: "Basic Info & Pricing", icon: FiPackage },
          { id: "media", label: "Product Media (Images & Videos)", icon: FiImage },
          { id: "variants", label: "Color & Size Variants (With Image Link)", icon: FiSliders },
          { id: "specs", label: "Specs & Delivery Info", icon: FiList },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-slate-900 text-slate-900 bg-slate-100/60 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon className={isActive ? "text-slate-900" : "text-slate-400"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Form Container ── */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── TAB 1: BASIC INFO & PRICING ── */}
        {activeTab === "basic" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Cols: Title, Description, Category, Brand */}
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FiType className="text-blue-600" /> General Details
                </h2>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Product Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    onBlur={() => validateField("title", form.title)}
                    placeholder="e.g. As-Shabab Premium Silk Panjabi"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                      errors.title ? "border-rose-500 focus:ring-rose-100" : "border-slate-200 focus:border-slate-900 focus:ring-slate-100"
                    }`}
                  />
                  {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Product Description <span className="text-rose-500">*</span>
                  </label>
                  <RichTextEditor
                    value={form.description}
                    onChange={(val) => {
                      setForm((prev) => ({ ...prev, description: val }));
                      if (errors.description) validateField("description", val);
                    }}
                    placeholder="Write detailed product description, fabric details, care instructions..."
                    minHeight={220}
                  />
                  {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description}</p>}
                </div>
              </div>

              {/* Pricing & Inventory Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FiDollarSign className="text-emerald-600" /> Pricing & Stock
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Regular Price (৳) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      onBlur={() => validateField("price", form.price)}
                      placeholder="1890"
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
                        errors.price ? "border-rose-500" : "border-slate-200 focus:border-slate-900 focus:ring-slate-100"
                      }`}
                    />
                    {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Sale / Discount Price (Optional) (৳)
                    </label>
                    <input
                      type="number"
                      name="salePrice"
                      value={form.salePrice}
                      onChange={handleChange}
                      placeholder="Leave empty if no discount"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="50"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      SKU (Stock Keeping Unit)
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={form.sku}
                      onChange={handleChange}
                      placeholder="e.g. SHB-PANJ-09"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm uppercase focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Category, Brand, Product Type */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FiTag className="text-amber-600" /> Category & Brand
                </h2>

                {/* Product Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Catalog Section / Type
                  </label>
                  <select
                    name="productType"
                    value={form.productType}
                    onChange={handleProductTypeChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
                  >
                    {productTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    value={form.category}
                    onChange={(val) => {
                      setForm((prev) => ({ ...prev, category: val }));
                      if (errors.category) validateField("category", val);
                    }}
                    options={filteredCategories.map((c) => ({
                      value: c._id,
                      label: c.name,
                    }))}
                    placeholder="Select category..."
                    searchable={true}
                    buttonClassName="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
                    menuClassName="rounded-xl shadow-xl border border-slate-200"
                  />
                  {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Brand Name
                  </label>
                  <SearchableSelect
                    value={form.brand}
                    onChange={(val) => setForm((prev) => ({ ...prev, brand: val }))}
                    options={brandSelectOptions}
                    placeholder="Select or enter brand..."
                    searchable={true}
                    buttonClassName="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
                    menuClassName="rounded-xl shadow-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: PRODUCT MEDIA (IMAGES & VIDEOS) ── */}
        {activeTab === "media" && (
          <div className="space-y-6">
            
            {/* Main Primary Image */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FiImage className="text-blue-600" /> Main Primary Product Image <span className="text-rose-500">*</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This is the default image shown on product cards, category grid, and initial details load.
                  </p>
                </div>
              </div>

              {mainImagePreview ? (
                <div className="relative inline-block rounded-2xl border border-slate-200 overflow-hidden group">
                  <img
                    src={mainImagePreview}
                    alt="Main Preview"
                    className="h-56 w-56 object-cover bg-slate-50"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={removeMainImage}
                      className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-rose-700 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl bg-slate-50/50 cursor-pointer transition">
                  <FiUpload className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">Click to upload Main Image</span>
                  <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, WebP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Gallery Images (Color-assignable) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FiLayers className="text-purple-600" /> Gallery Images (Side Views, Color Variations)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload additional angles, folded views, and different color variations here.
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer">
                  <FiPlus /> Add Gallery Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryChange}
                    className="hidden"
                  />
                </label>
              </div>

              {galleryPreviews.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {galleryPreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50"
                    >
                      <img
                        src={preview}
                        alt={`Gallery ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow hover:bg-rose-700 cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="p-1.5 text-center text-[10px] font-bold text-slate-500 bg-white border-t border-slate-100">
                        Gallery #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  No additional gallery images added yet. Click &quot;Add Gallery Images&quot; above.
                </div>
              )}
            </div>

            {/* Video & YouTube Support */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <FiVideo className="text-rose-600" /> Video & YouTube Links (Optional)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Upload Short MP4 Video (Max 9MB)
                  </label>
                  <label className="flex flex-col items-center justify-center h-28 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 cursor-pointer hover:border-slate-400 transition">
                    <FiVideo className="h-6 w-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-600">Select MP4/WebM file</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </label>

                  {videoPreviews.length > 0 ? (
                    <div className="mt-3 flex gap-2">
                      {videoPreviews.map((preview, index) => (
                        <div key={index} className="relative h-20 w-24 rounded-lg overflow-hidden border">
                          <video src={preview} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeVideo(index)}
                            className="absolute top-1 right-1 h-5 w-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    YouTube Video URL
                  </label>
                  {youtubeVideoUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleYoutubeUrlChange(index, e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-none focus:border-slate-900"
                      />
                      {youtubeVideoUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeYoutubeUrlField(index)}
                          className="h-8 w-8 rounded-lg border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-50"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addYoutubeUrlField}
                    className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <FiPlus /> Add another YouTube link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: COLOR & SIZE VARIANTS (WITH ASSIGNED IMAGES) ── */}
        {activeTab === "variants" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FiSliders className="text-emerald-600" /> Color, Size & Attribute Variants
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Connect each color or size option with a specific uploaded photo. Clicking that color on the storefront will automatically switch the photo!
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVariantDefinitionAdd("size")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                  >
                    <FiPlus /> Add Size Type
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVariantDefinitionAdd("color")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                  >
                    <FiPlus /> Add Color Type
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVariantDefinitionAdd("custom")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                  >
                    <FiPlus /> Add Custom Type
                  </button>
                </div>
              </div>

              {/* Notice regarding image assignment */}
              {allAvailableImages.length === 0 ? (
                <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-800 flex items-center gap-2">
                  <span>⚠️ Upload your product photos in the <strong>Product Media</strong> tab first to link photos with colors/sizes.</span>
                </div>
              ) : null}

              {/* Variant Definitions List */}
              <div className="space-y-6">
                {variantDefinitions.map((def, defIndex) => {
                  const isColor = def.preset === "color";
                  return (
                    <div
                      key={defIndex}
                      className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5 space-y-4"
                    >
                      {/* Variant Type Header */}
                      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 pb-3">
                        <div className="flex items-center gap-3 flex-1 max-w-sm">
                          <span className="rounded-lg bg-slate-900 text-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
                            {def.preset}
                          </span>
                          <input
                            type="text"
                            value={def.name}
                            onChange={(e) => handleVariantDefinitionChange(defIndex, "name", e.target.value)}
                            placeholder="e.g. Size or Color"
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleVariantDefinitionRemove(defIndex)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                        >
                          Delete Type
                        </button>
                      </div>

                      {/* Options Grid */}
                      <div className="space-y-3">
                        {def.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-wrap lg:flex-nowrap items-center gap-3.5 shadow-2xs"
                          >
                            {/* Color picker if color preset */}
                            {isColor && (
                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  type="color"
                                  value={opt.colorHex || "#000000"}
                                  onChange={(e) => handleVariantOptionChange(defIndex, optIndex, "colorHex", e.target.value)}
                                  className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                                />
                              </div>
                            )}

                            {/* Label Input */}
                            <div className="flex-1 min-w-[140px]">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                {isColor ? "Color Name" : "Option Name"}
                              </label>
                              <input
                                type="text"
                                value={opt.label}
                                onChange={(e) => handleVariantOptionChange(defIndex, optIndex, "label", e.target.value)}
                                placeholder={isColor ? "e.g. Navy Blue" : "e.g. M, L, XL"}
                                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900"
                              />
                            </div>

                            {/* Optional Price Adjustment */}
                            <div className="w-32 shrink-0">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Extra Price (৳)
                              </label>
                              <input
                                type="number"
                                value={opt.price}
                                onChange={(e) => handleVariantOptionChange(defIndex, optIndex, "price", e.target.value)}
                                placeholder="Same price"
                                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-slate-900"
                              />
                            </div>

                            {/* ── IMAGE LINK / PICKER SELECTOR ── */}
                            <div className="flex-1 min-w-[220px]">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Linked Image (Switch on click)
                              </label>
                              
                              <div className="flex items-center gap-2">
                                {opt.imageUrl ? (
                                  <div className="relative h-9 w-9 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-50">
                                    <img src={opt.imageUrl} alt="Assigned" className="h-full w-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => handleVariantOptionImageAssign(defIndex, optIndex, "")}
                                      className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px]"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ) : (
                                  <div className="h-9 w-9 rounded-lg border border-dashed border-slate-300 shrink-0 flex items-center justify-center text-slate-300 text-xs">
                                    <FiImage />
                                  </div>
                                )}

                                <select
                                  value={opt.imageUrl || ""}
                                  onChange={(e) => handleVariantOptionImageAssign(defIndex, optIndex, e.target.value)}
                                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
                                >
                                  <option value="">-- No image attached --</option>
                                  {allAvailableImages.map((img) => (
                                    <option key={img.id} value={img.src}>
                                      {img.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Remove Option Button */}
                            <button
                              type="button"
                              onClick={() => handleVariantOptionRemove(defIndex, optIndex)}
                              className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer shrink-0"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleVariantOptionAdd(defIndex)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:border-slate-900 hover:bg-slate-50 transition cursor-pointer"
                        >
                          <FiPlus /> Add Another {def.name || "Option"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: SPECS & DELIVERY INFO ── */}
        {activeTab === "specs" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 6 Cols: Specifications */}
            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FiList className="text-blue-600" /> Technical Specifications
                  </h2>
                  <button
                    type="button"
                    onClick={handleSpecificationAdd}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FiPlus /> Add Row
                  </button>
                </div>

                <div className="space-y-3">
                  {specifications.map((spec, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleSpecificationChange(index, "key", e.target.value)}
                        placeholder="e.g. Fabric, Fit, Weight"
                        className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleSpecificationChange(index, "value", e.target.value)}
                        placeholder="e.g. 100% Jacquard Cotton"
                        className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
                      />
                      {specifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleSpecificationRemove(index)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Features Bullet points */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FiCheck className="text-emerald-600" /> Key Features & Highlights
                  </h2>
                  <button
                    type="button"
                    onClick={handleFeatureAdd}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FiPlus /> Add Bullet
                  </button>
                </div>

                <div className="space-y-2.5">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder="e.g. Breathable cotton blend with embroidered collar"
                        className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
                      />
                      {features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleFeatureRemove(index)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Delivery & Shipping details */}
            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FiTruck className="text-indigo-600" /> Shipping & Delivery Time
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Min Estimated Days
                    </label>
                    <input
                      type="number"
                      name="deliveryMinDays"
                      value={form.deliveryMinDays}
                      onChange={handleChange}
                      placeholder="2"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Max Estimated Days
                    </label>
                    <input
                      type="number"
                      name="deliveryMaxDays"
                      value={form.deliveryMaxDays}
                      onChange={handleChange}
                      placeholder="5"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={form.weight}
                      onChange={handleChange}
                      placeholder="0.5"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Dimensions (L x W x H)
                    </label>
                    <input
                      type="text"
                      name="dimensions"
                      value={form.dimensions}
                      onChange={handleChange}
                      placeholder="10 x 8 x 2 inches"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── Sticky Bottom Submit Bar ── */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Make sure to complete all required details before publishing.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Publishing Product...</span>
                </>
              ) : (
                <>
                  <FiPlus className="h-4 w-4" />
                  <span>Publish Product</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default ProductCreate;
