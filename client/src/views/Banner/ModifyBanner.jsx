/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import ConfirmModal from "../../components/ConfirmModal";
import RichTextEditor from "../../components/RichTextEditor";
import { stripHtml } from "../../utils/richText";
import { useThemeColors } from "../../hooks/useThemeColors";
import {
  dashboardFieldClass,
  dashboardFormSurfaceClass,
  dashboardLabelClass,
  dashboardSecondaryButtonClass,
} from "../../utils/dashboardFormStyles";
import {
  FiEdit2,
  FiTrash2,
  FiImage,
  FiRefreshCw,
  FiArrowLeft,
  FiType,
  FiFileText,
  FiX,
  FiPlus,
} from "react-icons/fi";

function ModifyBanner() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const { themeColor, buttonTextColor } = useThemeColors();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [thumbFile, setThumbFile] = useState(null);
  const [currentImage, setCurrentImage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all"); // 'all', 'hero', 'promotional'

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    buttonLabel: "",
    buttonLink: "",
    type: "hero",
  });

  // Filter banners based on selected tab/type (Always call hooks at top level)
  const heroBanners = useMemo(
    () => banners.filter((b) => b.type !== "promotional"),
    [banners],
  );
  const promotionalBanners = useMemo(
    () => banners.filter((b) => b.type === "promotional"),
    [banners],
  );

  const displayedBanners = useMemo(() => {
    if (selectedFilter === "hero") return heroBanners;
    if (selectedFilter === "promotional") return promotionalBanners;
    return banners;
  }, [selectedFilter, banners, heroBanners, promotionalBanners]);

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
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

    if (imagePath && !imagePath.startsWith("/")) {
      return baseUrl
        ? `${baseUrl}/uploads/banners/${imagePath}`
        : `/uploads/banners/${imagePath}`;
    }

    return null;
  };

  const FallbackImage = ({ className, alt }) => (
    <div
      className={`${className} bg-gray-200 flex items-center justify-center rounded-lg`}
    >
      <FiImage className="text-gray-400 text-2xl" />
      <span className="sr-only">{alt || "No image available"}</span>
    </div>
  );

  const BannerImage = ({ src, alt, className }) => {
    const [imgSrc, setImgSrc] = useState(getFullImageUrl(src));
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      setImgSrc(getFullImageUrl(src));
      setHasError(false);
    }, [src]);

    const handleError = () => {
      setHasError(true);
      if (src && src.startsWith("/uploads/banners/")) {
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
        crossOrigin={
          imgSrc?.startsWith("http://") || imgSrc?.startsWith("https://")
            ? "anonymous"
            : undefined
        }
      />
    );
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/banners`, {
        headers: getAuthHeaders(),
      });

      let bannersData = [];
      if (response.data.success) {
        bannersData = response.data.banners || [];
      } else if (Array.isArray(response.data)) {
        bannersData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        bannersData = response.data.data;
      }

      setBanners(bannersData);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to load banners"
      );

      if (err.response?.status === 401) {
        toast.error("Please login again");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error("Please login first");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return;
    }

    fetchBanners();

    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${baseUrl}/categories/public`);
        const all = res.data?.categories || [];
        const mainCategories = all.filter((cat) => !cat.parent);
        setCategories(mainCategories);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    fetchCategories();

    const handleBannerCreated = () => {
      fetchBanners();
    };

    window.addEventListener("bannerCreated", handleBannerCreated);
    return () => {
      window.removeEventListener("bannerCreated", handleBannerCreated);
    };
  }, [baseUrl]);

  const handleDelete = (banner) => {
    setDeleteConfirm(banner);
  };

  const confirmDeleteBanner = async () => {
    if (!deleteConfirm) return;
    const deletedId = deleteConfirm._id;
    setIsDeleting(true);
    const toastId = toast.loading("Deleting banner...");
    try {
      await axios.delete(`${baseUrl}/banners/${deletedId}`, {
        headers: getAuthHeaders(),
      });
      // Instant optimistic UI update
      setBanners((prev) => prev.filter((b) => String(b?._id || "") !== String(deletedId)));
      toast.success("Banner deleted successfully", { id: toastId });
      fetchBanners();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to delete banner",
        { id: toastId }
      );
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchBanners();
    toast.success("Banners refreshed!");
  };

  const resetForm = (targetType) => {
    setForm({
      title: "",
      description: "",
      buttonLabel: "",
      buttonLink: "",
      type: targetType || (selectedFilter === "promotional" ? "promotional" : "hero"),
      category: "",
    });
    setImageFile(null);
    setImagePreview("");
    setThumbFile(null);
    setCurrentImage("");
    setEditingId(null);
  };

  const startCreating = (targetType) => {
    resetForm(targetType);
    setShowForm(true);
  };

  const startEditing = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/banners/${id}`, {
        headers: getAuthHeaders(),
      });

      const bannerData =
        response.data.banner || response.data.data || response.data;

      // Set form data
      setForm({
        title: bannerData.title || "",
        description: bannerData.description || "",
        buttonLabel: bannerData.buttonLabel || "",
        buttonLink: bannerData.buttonLink || "",
        type: bannerData.type || "hero",
        category: bannerData.category?._id || bannerData.category || "",
      });

      if (bannerData.image || bannerData.thumb) {
        const imageUrl =
          getFullImageUrl(bannerData.image) ||
          getFullImageUrl(bannerData.thumb) ||
          bannerData.image ||
          bannerData.thumb;
        setCurrentImage(imageUrl);
      } else {
        setCurrentImage("");
      }

      setImageFile(null);
      setImagePreview("");
      setEditingId(id);
      setShowForm(true);
    } catch (err) {
      toast.error("Failed to load banner data");
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const compressImage = (file, options = {}) => {
    const {
      maxWidth = 1600,
      maxHeight = 900,
      quality = 0.85,
      mimeType = "image/jpeg",
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio, 1);

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Image compression failed"));
            const compressedFile = new File([blob], file.name, {
              type: blob.type,
            });
            resolve(compressedFile);
          },
          mimeType,
          quality,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image load failed"));
      };
      img.src = url;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "image/gif",
    ];

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPG, PNG, WebP, GIF allowed.");
      return;
    }

    Promise.all([
      compressImage(file, {
        maxWidth: 1600,
        maxHeight: 900,
        quality: 0.85,
        mimeType: "image/jpeg",
      }),
      compressImage(file, {
        maxWidth: 800,
        maxHeight: 450,
        quality: 0.7,
        mimeType: "image/jpeg",
      }),
    ])
      .then(([compressed, thumb]) => {
        setImageFile(compressed);
        setThumbFile(thumb);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(compressed);
      })
      .catch(() => {
        toast.error("Failed to process image. Please try another.");
      });
  };

  const removeImage = () => {
    if (imagePreview) {
      setImageFile(null);
      setImagePreview("");
      setThumbFile(null);
    } else if (currentImage) {
      setCurrentImage("");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    const toastId = toast.loading(
      editingId ? "Updating banner..." : "Creating banner..."
    );

    try {
      const token = getToken();
      if (!token) {
        toast.error("Authentication required. Please login again.", {
          id: toastId,
        });
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("buttonLabel", form.buttonLabel.trim());
      formData.append("buttonLink", form.buttonLink.trim());
      formData.append("type", form.type || "hero");
      if (form.category) {
        formData.append("category", form.category);
      }

      // Append new image if exists
      if (imageFile) {
        formData.append("image", imageFile);
      }
      if (thumbFile) {
        formData.append("thumb", thumbFile);
      }

      if (editingId) {
        await axios.put(`${baseUrl}/banners/${editingId}`, formData, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        });

        toast.success("Banner updated successfully!", { id: toastId });
      } else {
        await axios.post(`${baseUrl}/banners`, formData, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        });

        toast.success("Banner created successfully!", { id: toastId });
      }

      cancelForm();
      fetchBanners();
      window.dispatchEvent(new CustomEvent("bannerCreated"));
    } catch (err) {
      let errorMessage = editingId
        ? "Failed to update banner"
        : "Failed to create banner";

      if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (err.response?.status === 413) {
        errorMessage = "Image upload failed (file too large)";
      } else if (err.response?.status === 415) {
        errorMessage = "Unsupported file type";
      } else if (err.response?.data?.message) {
        errorMessage = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(", ")
          : err.response.data.message;
      }

      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !showForm) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] w-full">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-2 border-t-black rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading banners...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
        <div className="w-full">
        <div className="mb-4">
          <button
            onClick={cancelForm}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to banners
          </button>
        </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
              {/* Left Column - Form */}
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={dashboardFormSurfaceClass}
                >
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center">
                    <FiType className="mr-2" /> Banner Information
                  </h2>

                  <div className="space-y-4 md:space-y-6">
                    {/* Banner Type */}
                    <div>
                      <label className="block">
                        <span className={dashboardLabelClass}>Banner Position / Type</span>
                      </label>
                      <select
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className={`${dashboardFieldClass} text-sm md:text-base cursor-pointer`}
                      >
                        <option value="hero">Main Slider Banner (Hero)</option>
                        <option value="promotional">Side Offer Banner (Promotional)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Choose &quot;Side Offer Banner&quot; to place it in the side offer card on the homepage.
                      </p>
                    </div>

                    {/* Main Category Dropdown when Side Offer Banner is selected */}
                    {form.type === "promotional" && (
                      <div>
                        <label className="block">
                          <span className={dashboardLabelClass}>
                            Select Main Category <span className="text-rose-500 font-bold">*</span>
                          </span>
                        </label>
                        <select
                          name="category"
                          value={form.category}
                          onChange={handleChange}
                          className={`${dashboardFieldClass} text-sm md:text-base cursor-pointer`}
                          required
                        >
                          <option value="">-- Select Main Category --</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          When visitors click this side offer banner, they will see products from this category.
                        </p>
                      </div>
                    )}

                    {/* Title */}
                    <div>
                      <label className="block">
                        <span className={dashboardLabelClass}>Title</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Enter banner title"
                        className={`${dashboardFieldClass} text-sm md:text-base`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Title will be displayed if provided
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block">
                        <span className={dashboardLabelClass}>Description</span>
                      </label>
                      <RichTextEditor
                        value={form.description}
                        onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
                        placeholder="Enter banner description"
                        minHeight={180}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Description will be displayed if provided
                      </p>
                    </div>


                  </div>
                </motion.div>
              </div>

              {/* Right Column - Image */}
              <div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={dashboardFormSurfaceClass}
                >
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4 flex items-center">
                    <FiImage className="mr-2" /> Banner Image
                  </h2>

                  {/* Image Upload/Preview Area */}
                  <div className="mb-3 md:mb-4">
                    <label className="block">
                      <span className={dashboardLabelClass}>
                        {imagePreview
                          ? "New Image Preview"
                          : currentImage
                            ? "Current Image"
                            : "Banner Image"}
                      </span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 md:p-6 text-center hover:border-gray-500 transition-colors">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="New banner preview"
                            className="w-full h-48 md:h-64 object-contain rounded-lg mx-auto"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                          >
                            <FiX size={14} />
                          </button>
                          <div className="text-xs text-gray-500 mt-2 text-center">
                            New Image Preview
                          </div>
                        </div>
                      ) : currentImage ? (
                        <div className="relative">
                          <BannerImage
                            src={currentImage}
                            alt="Current banner"
                            className="w-full h-48 md:h-64 object-contain rounded-lg mx-auto"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                          >
                            <FiX size={14} />
                          </button>
                          <div className="text-xs text-gray-500 mt-2 text-center">
                            Current Image
                          </div>
                        </div>
                      ) : (
                        <>
                          <FiImage className="mx-auto text-gray-400 text-2xl md:text-3xl mb-2" />
                          <p className="text-gray-600 mb-2 text-sm md:text-base">
                            Click to upload banner image
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="banner-image-upload"
                          />
                          <label
                            htmlFor="banner-image-upload"
                          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 md:text-base"
                          >
                            <FiImage /> Upload Image
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            JPG, PNG, WebP, GIF (auto-optimized on upload)
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                    <h3 className="text-sm font-medium text-gray-800 mb-1">
                      Note
                    </h3>
                    <p className="text-xs text-gray-700">
                      You can update the banner with just an image, just text,
                      or both. Remove the current image to delete it.
                    </p>
                  </div>

                  {/* Submit & Cancel Buttons */}
                  <div className="space-y-2 md:space-y-3">
                    <button
                      type="button"
                      onClick={cancelForm}
                      className={`${dashboardSecondaryButtonClass} w-full text-sm md:text-base`}
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-slate-900/15 transition-colors duration-200 md:text-base disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        backgroundColor: themeColor,
                        color: buttonTextColor,
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingId ? "Updating..." : "Creating..."}
                        </>
                      ) : editingId ? (
                        "Update Banner"
                      ) : (
                        "Create Banner"
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="w-full space-y-4">
        {/* Top Filter Buttons & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-2xs">
          {/* Tabs: All, Main Slider, Side Offer */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                selectedFilter === "all"
                  ? "bg-gray-900 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Banners
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${selectedFilter === "all" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800"}`}>
                {banners.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter("hero")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                selectedFilter === "hero"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80"
              }`}
            >
              Main Sliders
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${selectedFilter === "hero" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"}`}>
                {heroBanners.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter("promotional")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                selectedFilter === "promotional"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100/80"
              }`}
            >
              Side Offers
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${selectedFilter === "promotional" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"}`}>
                {promotionalBanners.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => startCreating(selectedFilter === "promotional" ? "promotional" : "hero")}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-black transition-colors shadow-xs"
            >
              <FiPlus className="w-4 h-4" />
              <span>{selectedFilter === "promotional" ? "Add Side Offer" : "Add Banner"}</span>
            </button>
          </div>
        </div>

        {/* Banners List */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-2xs"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                {selectedFilter === "all" && "All Banners & Offers"}
                {selectedFilter === "hero" && "Main Hero Sliders"}
                {selectedFilter === "promotional" && "Side Offer Banners"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedFilter === "promotional"
                  ? "Showing all promotional offer cards featured on the side of the homepage."
                  : selectedFilter === "hero"
                    ? "Showing all main sliding banners displayed on the homepage hero section."
                    : "Manage and preview all sliding hero banners and promotional side cards."}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
              {displayedBanners.length} {displayedBanners.length === 1 ? "item" : "items"}
            </span>
          </div>

          {displayedBanners.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
              <FiImage className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-base font-bold text-gray-800">
                {selectedFilter === "promotional"
                  ? "No side offer banners found"
                  : selectedFilter === "hero"
                    ? "No main sliders found"
                    : "No banners found"}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                {selectedFilter === "promotional"
                  ? "Create side offer banner to feature special category deals."
                  : "Get started by adding your first banner."}
              </p>
              <button
                type="button"
                onClick={() => startCreating(selectedFilter === "promotional" ? "promotional" : "hero")}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-black transition-colors"
              >
                <FiPlus className="w-4 h-4" />
                {selectedFilter === "promotional" ? "Create Side Offer" : "Create Banner"}
              </button>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:gap-4">
              {displayedBanners.map((banner) => (
                <motion.div
                  key={banner._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs hover:border-gray-300 hover:shadow-xs transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Banner Image Preview */}
                    <div className="shrink-0">
                      <div className="relative w-36 h-24 sm:w-44 sm:h-28 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center">
                        {banner.image ? (
                          <BannerImage
                            src={banner.thumb || banner.image}
                            alt={banner.title || "Banner"}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <FiImage className="text-gray-400 text-2xl" />
                        )}
                      </div>
                    </div>

                    {/* Banner Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            banner.type === "promotional"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {banner.type === "promotional" ? "Side Offer" : "Hero Slider"}
                        </span>
                        {banner.category?.name && (
                          <span className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            Category: {banner.category.name}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                        {banner.title || (banner.type === "promotional" ? "Side Offer Promotion" : "Slider Banner")}
                      </h3>

                      {banner.description && (
                        <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                          {stripHtml(banner.description)}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
                        <span>
                          Created: {banner.createdAt ? new Date(banner.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                        {banner.updatedAt && (
                          <span>
                            Updated: {new Date(banner.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(banner._id)}
                        className="p-2 text-gray-600 hover:text-indigo-600 rounded-xl hover:bg-gray-100 transition"
                        title="Edit Banner"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(banner)}
                        className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                        title="Delete Banner"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <ConfirmModal
            isOpen={Boolean(deleteConfirm)}
            title="Delete banner"
            message={
              deleteConfirm?.title
                ? `Delete "${deleteConfirm.title}" banner?`
                : "Delete this banner?"
            }
            confirmLabel="Delete"
            isDanger
            isLoading={isDeleting}
            onCancel={() => setDeleteConfirm(null)}
            onConfirm={confirmDeleteBanner}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ModifyBanner;
