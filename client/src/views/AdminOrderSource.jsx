"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiInbox } from "react-icons/fi";
import ConfirmModal from "../components/ConfirmModal";
import {
  dashboardFormSurfaceClass,
  dashboardFieldClass,
  dashboardLabelClass,
} from "../utils/dashboardFormStyles";
import { useThemeColors } from "../hooks/useThemeColors";
import { useAuth } from "../hooks/useAuth";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const AdminOrderSource = () => {
  const { themeColor, buttonTextColor } = useThemeColors();
  const { user } = useAuth();
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Form State
  const [sourceName, setSourceName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const isAdmin = useMemo(
    () => String(user?.userType || "").toLowerCase() === "admin",
    [user?.userType],
  );

  useEffect(() => {
    if (isAdmin) fetchSources();
  }, [isAdmin]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSources = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${baseUrl}/order-sources`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        setSources(response.data.data || []);
      } else {
        toast.error(response.data?.message || "Failed to load order sources");
      }
    } catch (error) {
      console.error("Error fetching order sources:", error);
      toast.error("Failed to load order sources");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = sourceName.trim();
    if (!trimmed) {
      toast.error("Source name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await axios.put(
          `${baseUrl}/order-sources/${editingId}`,
          { name: trimmed },
          { headers: getAuthHeaders() },
        );
        toast.success("Order source updated successfully");
      } else {
        await axios.post(
          `${baseUrl}/order-sources`,
          { name: trimmed },
          { headers: getAuthHeaders() },
        );
        toast.success("Order source created successfully");
      }

      setSourceName("");
      setEditingId(null);
      fetchSources();
    } catch (error) {
      console.error("Error saving order source:", error);
      toast.error(
        error.response?.data?.message || "Failed to save order source",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (source) => {
    setSourceName(source.name);
    setEditingId(source._id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSourceName("");
  };

  const requestDelete = (source) => {
    setConfirmDelete(source);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete._id);
    try {
      await axios.delete(`${baseUrl}/order-sources/${confirmDelete._id}`, {
        headers: getAuthHeaders(),
      });
      toast.success("Order source deleted");
      setConfirmDelete(null);
      fetchSources();
    } catch (error) {
      console.error("Error deleting order source:", error);
      toast.error(error.response?.data?.message || "Failed to delete order source");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(
        `${baseUrl}/order-sources/${id}`,
        { isActive: !currentStatus },
        { headers: getAuthHeaders() },
      );
      toast.success(`Source ${!currentStatus ? "activated" : "deactivated"}`);
      fetchSources();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  const activeCount = useMemo(
    () => sources.filter((source) => source.isActive).length,
    [sources],
  );
  const inactiveCount = sources.length - activeCount;

  if (!isAdmin) {
    return (
      <div className="app-panel p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-black">
          Admin Access Required
        </h2>
        <p className="text-gray-600">
          Only admin can manage order sources.
        </p>
      </div>
    );
  }

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan="4" className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black mx-auto" />
          </td>
        </tr>
      );
    }

    if (sources.length === 0) {
      return (
        <tr>
          <td colSpan="4" className="text-center py-12 text-gray-500">
            <FiInbox className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            No order sources yet. Add one above.
          </td>
        </tr>
      );
    }

    return sources.map((source) => (
      <tr
        key={source._id}
        className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors"
      >
        <td className="py-4 px-4 sm:px-6 text-sm font-medium text-gray-900">
          <div className="flex items-center gap-2">
            {source.name}
            {editingId === source._id ? (
              <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                Editing
              </span>
            ) : null}
          </div>
        </td>
        <td className="py-4 px-4 sm:px-6 text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleStatus(source._id, source.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                source.isActive ? "bg-green-500" : "bg-gray-200"
              }`}
              title={source.isActive ? "Deactivate" : "Activate"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  source.isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-xs font-semibold ${
                source.isActive ? "text-green-600" : "text-gray-400"
              }`}
            >
              {source.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </td>
        <td className="py-4 px-4 sm:px-6 text-sm text-gray-500">
          {new Date(source.createdAt).toLocaleDateString()}
        </td>
        <td className="py-4 px-4 sm:px-6 text-sm text-right">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleEdit(source)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Edit"
            >
              <FiEdit2 size={18} />
            </button>
            <button
              onClick={() => requestDelete(source)}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Delete"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6 pb-20"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-gray-800">
          Order Source Settings
        </h2>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-green-700">
            {activeCount} Active
          </span>
          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            {inactiveCount} Inactive
          </span>
          <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-white">
            {sources.length} Total
          </span>
        </div>
      </div>

      <div className={`${dashboardFormSurfaceClass} p-6`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="sourceName" className={dashboardLabelClass}>
              {editingId ? "Edit Source Name" : "New Source Name"}
            </label>
            <input
              type="text"
              id="sourceName"
              className={dashboardFieldClass}
              placeholder="e.g., Facebook, Website, Affiliate"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !sourceName.trim()}
              style={{ backgroundColor: themeColor, color: buttonTextColor }}
              className="h-[42px] px-6 rounded-lg font-medium shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : editingId ? (
                <FiEdit2 size={18} />
              ) : (
                <FiPlus size={18} />
              )}
              {editingId ? "Update" : "Add Source"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="h-[42px] px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <FiX size={16} /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={`${dashboardFormSurfaceClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-600">
                  Source Name
                </th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-600">
                  Added On
                </th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>{renderTableBody()}</tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        title="Delete order source?"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDanger
        isLoading={Boolean(deletingId)}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </motion.div>
  );
};

export default AdminOrderSource;