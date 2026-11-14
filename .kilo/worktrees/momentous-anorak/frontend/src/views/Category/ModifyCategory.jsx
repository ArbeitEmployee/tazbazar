/* eslint-disable no-unused-vars */
// ModifyCategory.jsx
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import ConfirmModal from "../../components/ConfirmModal";
import SearchableSelect from "../../components/SearchableSelect";
import RichTextEditor from "../../components/RichTextEditor";
import { stripHtml } from "../../utils/richText";
import { useThemeColors } from "../../hooks/useThemeColors";
import {
  dashboardFieldClass,
  dashboardFormSurfaceClass,
  dashboardPrimaryButtonClass,
  dashboardSecondaryButtonClass,
} from "../../utils/dashboardFormStyles";
import {
  loadAdminSettings,
  saveAdminSettings,
  selectAdminSettingsDraft,
  selectPublicSettingsState,
} from "../../store/publicSettingsSlice";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const CATEGORY_TYPES = [
  "General",
  "Popular",
  "Hot deals",
  "Best Selling",
  "Latest",
];

const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
  label,
  activeText = "On",
  inactiveText = "Off",
  themeColor = "#000000",
  buttonTextColor = "#ffffff",
}) => (
  <div className="flex items-center gap-3">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`app-toggle-switch focus:outline-none ${checked ? "is-on" : ""}`}
      style={{
        backgroundColor: checked ? themeColor : "rgba(226, 232, 240, 1)",
        borderColor: checked ? themeColor : "rgba(203, 213, 225, 1)",
      }}
    >
      <span
        className="app-toggle-switch__knob"
        style={{
          backgroundColor: checked ? buttonTextColor : "#ffffff",
        }}
      />
    </button>
    <span className="app-toggle-switch__label">
      {checked ? activeText : inactiveText}
    </span>
  </div>
);

function ModifyCategory() {
  const dispatch = useDispatch();
  const { themeColor, buttonTextColor } = useThemeColors();
  const settings = useSelector(selectAdminSettingsDraft);
  const { adminStatus, saveStatus } = useSelector(selectPublicSettingsState);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("General");
  const [editDescription, setEditDescription] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("General");
  const [createDescription, setCreateDescription] = useState("");
  const [createImageFile, setCreateImageFile] = useState(null);
  const [createImagePreview, setCreateImagePreview] = useState("");
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const categoryTypeOptions = useMemo(
    () => [
      { value: "", label: "All category types" },
      ...CATEGORY_TYPES.map((type) => ({
        value: type,
        label: type,
      })),
    ],
    [],
  );

  const visibleCategories = useMemo(() => {
    const normalizedSearch = String(searchQuery || "").trim().toLowerCase();
    const normalizedType = String(filterType || "").trim().toLowerCase();

    return categories.filter((category) => {
      const name = String(category?.name || "").toLowerCase();
      const description = stripHtml(category?.description || "").toLowerCase();
      const type = String(category?.type || "General").trim().toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        `${name} ${description} ${type}`.includes(normalizedSearch);
      const matchesType = !normalizedType || type === normalizedType;

      return matchesSearch && matchesType;
    });
  }, [categories, searchQuery, filterType]);

  const hasActiveFilters = Boolean(
    String(searchQuery || "").trim() || String(filterType || "").trim(),
  );

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("");
  };

  const handleEditImageChange = (event) => {
    const file = event.target.files?.[0];
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
      event.target.value = "";
      return;
    }

    setEditImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditImagePreview(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const clearEditImageSelection = () => {
    setEditImageFile(null);
    setEditImagePreview("");
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      const response = await axios.get(`${baseUrl}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    dispatch(loadAdminSettings()).catch(() => undefined);
  }, [dispatch]);

  const showCategoryMarquee =
    settings?.storefront?.showCategoryMarquee !== false;
  const storefrontSaving = saveStatus === "loading";

  const handleToggleCategoryMarquee = async () => {
    try {
      const payload = {
        storefront: {
          ...(settings?.storefront || {}),
          showCategoryMarquee: !showCategoryMarquee,
        },
      };
      const result = await dispatch(saveAdminSettings(payload)).unwrap();
      toast.success(
        result?.message || "Category marquee visibility updated",
      );
    } catch (error) {
      toast.error(error || "Failed to update category marquee visibility");
    }
  };

  const handleDelete = (category) => {
    setDeleteConfirm(category);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.delete(
        `${baseUrl}/categories/${deleteConfirm._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCategories(
          categories.filter((category) => category._id !== deleteConfirm._id)
        );
        toast.success("Category deleted successfully!");

        // Dispatch event for navbar update
        window.dispatchEvent(new CustomEvent("categoryDeleted"));
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to delete category";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const startEditing = (category) => {
    setEditingId(category._id);
    setEditName(category.name);
    setEditType(category.type || "General");
    setEditDescription(category.description || "");
    setEditImageFile(null);
    setEditImagePreview(category.image || "");
    setEditIsActive(category.isActive !== false);
    setEditError("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditType("General");
    setEditDescription("");
    setEditImageFile(null);
    setEditImagePreview("");
    setEditIsActive(true);
    setEditError("");
  };

  const startCreating = () => {
    cancelEditing();
    setCreating(true);
    setCreateName("");
    setCreateType("General");
    setCreateDescription("");
    setCreateImageFile(null);
    setCreateImagePreview("");
    setCreateIsActive(true);
    setCreateError("");
  };

  const cancelCreating = () => {
    setCreating(false);
    setCreateName("");
    setCreateType("General");
    setCreateDescription("");
    setCreateImageFile(null);
    setCreateImagePreview("");
    setCreateIsActive(true);
    setCreateError("");
  };

  const handleCreateImageChange = (event) => {
    const file = event.target.files?.[0];
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
      event.target.value = "";
      return;
    }

    setCreateImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setCreateImagePreview(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const clearCreateImageSelection = () => {
    setCreateImageFile(null);
    setCreateImagePreview("");
  };

  const handleCreate = async () => {
    setCreateError("");

    if (!createName.trim()) {
      const message = "Category name cannot be empty";
      setCreateError(message);
      toast.error(message);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      const formData = new FormData();
      formData.append("name", createName);
      formData.append("type", createType);
      formData.append("description", createDescription);
      formData.append("isActive", String(createIsActive));

      if (createImageFile) {
        formData.append("image", createImageFile);
      }

      setIsCreating(true);
      const response = await axios.post(`${baseUrl}/categories`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        cancelCreating();
        toast.success("Category created successfully!");
        // Notify this page (and the storefront nav) to refresh the list.
        window.dispatchEvent(
          new CustomEvent("categoryCreated", {
            detail: response.data.category,
          })
        );
      }
    } catch (err) {
      console.error("Error creating category:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to create category";
      setCreateError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id) => {
    // Clear previous error
    setEditError("");

    // Validate input
    if (!editName.trim()) {
      setEditError("Category name cannot be empty");
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("name", editName);
      formData.append("type", editType);
      formData.append("description", editDescription);
      formData.append("isActive", String(editIsActive));

      if (editImageFile) {
        formData.append("image", editImageFile);
      }

      const response = await axios.put(`${baseUrl}/categories/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setCategories(
          categories.map((category) =>
            category._id === id ? response.data.category : category
          )
        );
        setEditingId(null);
        setEditName("");
        setEditType("General");
        setEditDescription("");
        setEditImageFile(null);
        setEditImagePreview("");
        setEditIsActive(true);
        toast.success("Category updated successfully!");

        // Dispatch event for navbar update
        window.dispatchEvent(new CustomEvent("categoryUpdated"));
      }
    } catch (err) {
      console.error("Error updating category:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to update category";
      setEditError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleToggleVisibility = async (category) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required. Please login again.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", category?.name || "");
      formData.append("type", category?.type || "General");
      formData.append("description", category?.description || "");
      formData.append("isActive", String(!(category?.isActive !== false)));

      const response = await axios.put(
        `${baseUrl}/categories/${category._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        setCategories((prev) =>
          prev.map((row) =>
            row._id === category._id ? response.data.category : row,
          ),
        );
        toast.success("Category visibility updated");
        window.dispatchEvent(new CustomEvent("categoryUpdated"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update category");
    }
  };

  const handleRefresh = () => {
    fetchCategories();
    toast.success("Categories refreshed!");
  };

  // Listen for category creation events
  useEffect(() => {
    const handleCategoryCreated = () => {
      fetchCategories();
      toast.success("New category detected! List updated.");
    };

    window.addEventListener("categoryCreated", handleCategoryCreated);
    return () => {
      window.removeEventListener("categoryCreated", handleCategoryCreated);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-2 border-t-black rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      <div className="w-full">
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Home Page Categories
              </p>
              <h2 className="mt-2 text-lg font-semibold text-black">
                Category marquee visibility
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Control whether the category sliding section appears on the public home page.
              </p>
            </div>

            <div className="flex flex-col items-start gap-2">
              <ToggleSwitch
                checked={showCategoryMarquee}
                onChange={handleToggleCategoryMarquee}
                disabled={adminStatus === "loading" || storefrontSaving}
                label="Toggle category marquee visibility"
                activeText={storefrontSaving ? "Saving..." : "Public"}
                inactiveText={storefrontSaving ? "Saving..." : "Private"}
                themeColor={themeColor}
                buttonTextColor={buttonTextColor}
              />
              <p className="text-xs text-gray-500">
                Status:{" "}
                {showCategoryMarquee
                  ? "Visible on storefront"
                  : "Hidden from storefront"}
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={`${dashboardFormSurfaceClass} p-4 md:p-8`}
        >
          <div className="py-1 border-b border-gray-100 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Category Library
                </p>
                <h2 className="mt-1 text-lg font-semibold text-black">
                  Manage categories
                </h2>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {visibleCategories.length} / {categories.length} categories
                </span>
                <button
                  type="button"
                  onClick={startCreating}
                  disabled={creating}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200"
                  title="Add a new main category"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="ml-2 hidden md:inline">Add Category</span>
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  title="Refresh categories"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="ml-2 hidden md:inline">Refresh</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search categories"
                className="min-h-[46px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:border-black focus:outline-none"
              />
              <SearchableSelect
                value={filterType}
                onChange={setFilterType}
                options={categoryTypeOptions}
                placeholder="All category types"
                searchPlaceholder="Search category types"
                emptyLabel="No category type found"
                clearable
              />
            </div>

            {hasActiveFilters ? (
              <div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:border-black hover:text-black transition-colors duration-200"
                >
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>

          {creating ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 md:p-5 mt-4 md:mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    New Category
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-black">
                    Add main category
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category name *
                  </label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => {
                      setCreateName(e.target.value);
                      if (createError) setCreateError("");
                    }}
                    placeholder="e.g., Men's Fashion"
                    className={`${dashboardFieldClass} ${
                      createError
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category type
                  </label>
                  <SearchableSelect
                    value={createType}
                    onChange={setCreateType}
                    options={CATEGORY_TYPES.map((type) => ({
                      value: type,
                      label: type,
                    }))}
                    placeholder="Category type"
                    emptyLabel="No category type found"
                    className="min-w-0"
                    buttonClassName={dashboardFieldClass}
                    menuClassName="rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <RichTextEditor
                  value={createDescription}
                  onChange={setCreateDescription}
                  placeholder="Optional category description"
                  minHeight={140}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category image
                  </label>
                  <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-4 py-4 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-100">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleCreateImageChange}
                    />
                    Upload image
                  </label>
                  {createImagePreview ? (
                    <div className="mt-3 flex items-start gap-3">
                      <div className="h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <img
                          src={createImagePreview}
                          alt="Category preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={clearCreateImageSelection}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:border-black hover:text-black transition-colors duration-200"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreateIsActive((prev) => !prev)}
                    className={`${dashboardFieldClass} flex items-center justify-between hover:border-gray-400 transition-colors duration-200`}
                  >
                    <span className="text-sm font-semibold text-black">
                      Visibility
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        createIsActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {createIsActive ? "Public" : "Hidden"}
                    </span>
                  </button>
                </div>
              </div>

              {createError ? (
                <p className="mt-3 text-sm text-red-600 font-medium">
                  {createError}
                </p>
              ) : null}

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating}
                  className={`${dashboardPrimaryButtonClass} disabled:opacity-50`}
                >
                  {isCreating ? "Creating..." : "Create category"}
                </button>
                <button
                  type="button"
                  onClick={cancelCreating}
                  className={dashboardSecondaryButtonClass}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {categories.length === 0 ? (
            <div className="py-8 md:py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No categories
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new category.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={startCreating}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors duration-200"
                >
                  Create your first category
                </button>
              </div>
            </div>
          ) : visibleCategories.length === 0 ? (
            <div className="py-8 md:py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M10 6h10M10 12h10M10 18h10M4 6h.01M4 12h.01M4 18h.01"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No categories match your filters
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try another search term or category type.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors duration-200"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 mt-4 md:mt-6">
              {visibleCategories.map((category) => (
                <div
                  key={category._id}
                  className="py-4 hover:bg-gray-50 transition-colors duration-150"
                >
                  {editingId === category._id ? (
                    <div>
                      <div className="flex flex-col gap-3 mb-3">
                        <div className="w-full">
                          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-100">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                              className="hidden"
                              onChange={handleEditImageChange}
                            />
                            Upload new image
                          </label>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => {
                                setEditName(e.target.value);
                                if (editError) setEditError("");
                              }}
                              className={`${dashboardFieldClass} ${
                                editError
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                  : ""
                              }`}
                              placeholder="Category name"
                              autoFocus
                            />
                            <RichTextEditor
                              value={editDescription}
                              onChange={setEditDescription}
                              placeholder="Optional category description"
                              minHeight={180}
                            />
                          </div>
                          <div className="w-full md:w-auto">
                            <SearchableSelect
                              value={editType}
                              onChange={setEditType}
                              options={CATEGORY_TYPES.map((type) => ({
                                value: type,
                                label: type,
                              }))}
                              placeholder="Category type"
                              searchable={false}
                              className="min-w-0"
                              buttonClassName={`${dashboardFieldClass} w-full md:w-auto`}
                              menuClassName="rounded-xl"
                            />
                          </div>
                          <div className="w-full md:w-auto">
                            <button
                              type="button"
                              onClick={() => setEditIsActive((prev) => !prev)}
                              className={`inline-flex h-12 w-full items-center justify-between gap-3 rounded-xl border px-4 text-sm font-semibold transition md:w-48 ${
                                editIsActive
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-gray-200 bg-gray-50 text-gray-700"
                              }`}
                            >
                              <span>Visibility</span>
                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] uppercase tracking-widest">
                                {editIsActive ? "Public" : "Hidden"}
                              </span>
                            </button>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <button
                              onClick={() => handleUpdate(category._id)}
                              className={dashboardPrimaryButtonClass}
                            >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className={dashboardSecondaryButtonClass}
                          >
                            Cancel
                          </button>
                          </div>
                        </div>
                        {editImagePreview ? (
                          <div className="flex items-start gap-3">
                            <div className="h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                              <img
                                src={editImagePreview}
                                alt={`${editName || category.name} preview`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            {editImageFile ? (
                              <button
                                type="button"
                                onClick={clearEditImageSelection}
                                className={dashboardSecondaryButtonClass}
                              >
                                Remove selection
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      {/* Red error text under the edit input */}
                      {editError && (
                        <p className="text-sm text-red-600 font-medium mt-1 ml-1">
                          {editError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        {category.image ? (
                          <div className="h-12 w-12 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shrink-0">
                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 shrink-0">
                            <span className="text-sm font-medium text-gray-600">
                              {category.name.charAt(0).toUpperCase()}
                            </span>
                          </span>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-1 sm:gap-0">
                          <span className="text-base font-medium text-gray-900 wrap-break-word">
                            {category.name}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 self-start sm:self-center">
                            {category.type || "General"}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold self-start sm:self-center ${
                              category.isActive !== false
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {category.isActive !== false ? "Public" : "Hidden"}
                          </span>
                        </div>
                      </div>
                      {category.description ? (
                        <p className="mt-2 text-sm text-gray-500 sm:pl-[3.75rem]">
                          {stripHtml(category.description)}
                        </p>
                      ) : null}
                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(category)}
                          className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-sm leading-4 font-medium rounded-lg transition-colors duration-200 ${
                            category.isActive !== false
                              ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                              : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          }`}
                        >
                          {category.isActive !== false ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => startEditing(category)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(category)
                          }
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
        <ConfirmModal
          isOpen={Boolean(deleteConfirm)}
          title="Delete category"
          message={
            deleteConfirm?.name
              ? `Delete "${deleteConfirm.name}" category?`
              : "Delete this category?"
          }
          confirmLabel="Delete"
          isDanger
          isLoading={isDeleting}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={confirmDeleteCategory}
        />
      </div>
    </motion.div>
  );
}

export default ModifyCategory;
