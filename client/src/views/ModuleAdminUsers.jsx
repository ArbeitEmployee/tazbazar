import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiChevronDown,
  FiEye,
  FiEyeOff,
  FiFilter,
  FiLock,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { useThemeColors } from "../hooks/useThemeColors";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff / Moderator" },
  { value: "user", label: "Regular User" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const ADMIN_PERMISSION_OPTIONS = [
  { key: "manageOrders", label: "Orders Management", desc: "View, update and manage customer orders and shipments" },
  { key: "manageProducts", label: "Product Catalog", desc: "Add, edit, inventory manage products and categories" },
  { key: "manageUsers", label: "User & Admin Management", desc: "Manage customer profiles, admin roles and access permissions" },
  { key: "manageReports", label: "Reports & Financials", desc: "Access sales, profit & loss, inventory and order analytics" },
  { key: "manageWebsite", label: "Website Configuration", desc: "Customize landing pages, headers, footers and site settings" },
];

const DEFAULT_ADMIN_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  status: "active",
  adminPermissions: {
    manageOrders: true,
    manageProducts: true,
    manageUsers: false,
    manageReports: true,
    manageWebsite: true,
  },
};

const RoleSelect = ({ value, onChange, disabled = false, className = "h-9" }) => (
  <div className="relative w-full">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`${className} w-full appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-xs sm:text-sm font-medium text-black transition hover:border-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 cursor-pointer shadow-xs`}
    >
      {ROLE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="py-1">
          {opt.label}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500">
      <FiChevronDown className="h-4 w-4" />
    </div>
  </div>
);

const StatusSelect = ({ value, onChange, disabled = false, className = "h-9" }) => (
  <div className="relative w-full">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`${className} w-full appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-xs sm:text-sm font-medium text-black transition hover:border-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 cursor-pointer shadow-xs`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="py-1">
          {opt.label}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500">
      <FiChevronDown className="h-4 w-4" />
    </div>
  </div>
);

const ThemedToggle = ({
  checked,
  onChange,
  disabled = false,
  label,
  themeColor,
  buttonTextColor,
}) => (
  <label
    className={`flex items-center gap-2 text-xs sm:text-sm text-gray-700 select-none ${
      disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
    }`}
  >
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`app-toggle-switch focus:outline-none shrink-0 ${checked ? "is-on" : ""}`}
      style={{
        backgroundColor: checked
          ? themeColor || "var(--brand-theme-color)"
          : "rgba(226, 232, 240, 1)",
        borderColor: checked
          ? themeColor || "var(--brand-theme-color)"
          : "rgba(203, 213, 225, 1)",
      }}
    >
      <span
        className="app-toggle-switch__knob"
        style={{
          backgroundColor: checked
            ? buttonTextColor || "var(--brand-button-text-color)"
            : "#ffffff",
        }}
      />
    </button>
    <span className="leading-tight truncate font-medium">{label}</span>
  </label>
);

const ModuleAdminUsers = ({ initialMode = "manage-admin" }) => {
  const { themeColor, buttonTextColor } = useThemeColors();
  const { user } = useAuth();

  // Mode mapping: "add-admin", "manage-admin", "admin-role", "admin-permission"
  const [activeTab, setActiveTab] = useState(() => {
    if (initialMode === "add-admin") return "add-admin";
    if (initialMode === "admin-role") return "admin-role";
    if (initialMode === "admin-permission") return "admin-permission";
    return "manage-admin";
  });

  useEffect(() => {
    if (initialMode === "add-admin") setActiveTab("add-admin");
    else if (initialMode === "admin-role") setActiveTab("admin-role");
    else if (initialMode === "admin-permission") setActiveTab("admin-permission");
    else setActiveTab("manage-admin");
  }, [initialMode]);

  const [users, setUsers] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Create admin form state
  const [adminForm, setAdminForm] = useState(DEFAULT_ADMIN_FORM);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isAdmin = String(user?.userType || "").toLowerCase() === "admin";

  const initDraft = (row) => ({
    userType: String(row?.userType || "user").toLowerCase(),
    status: String(row?.status || "active").toLowerCase(),
    adminNotes: String(row?.adminNotes || ""),
    adminPermissions: ADMIN_PERMISSION_OPTIONS.reduce((acc, permission) => {
      acc[permission.key] = Boolean(
        row?.adminSettings?.permissions?.[permission.key],
      );
      return acc;
    }, {}),
  });

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/auth/admin/all-users`, {
        headers: getAuthHeaders(),
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      setUsers(rows);
      setDrafts(
        rows.reduce((acc, row) => {
          acc[String(row._id)] = initDraft(row);
          return acc;
        }, {}),
      );
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load users");
      setUsers([]);
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    let baseList = users;
    // In admin-role or admin-permission tabs, prioritize admins and staff by default if roleFilter is "all"
    if ((activeTab === "admin-role" || activeTab === "admin-permission") && roleFilter === "all") {
      baseList = users.filter((u) => u.userType === "admin" || u.userType === "staff");
    }
    if (roleFilter !== "all") {
      baseList = baseList.filter(
        (u) => String(u?.userType || "").toLowerCase() === roleFilter.toLowerCase(),
      );
    }
    if (!term) return baseList;
    return baseList.filter((row) =>
      [row?.name, row?.email, row?.phone, row?.userType, row?.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [users, search, activeTab, roleFilter]);

  const summary = useMemo(
    () => ({
      total: users.length,
      admins: users.filter(
        (row) => String(row?.userType || "").toLowerCase() === "admin",
      ).length,
    }),
    [users],
  );

  const updateDraft = (userId, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [key]: value,
      },
    }));
  };

  const updatePermissionDraft = (userId, permissionKey, checked) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        adminPermissions: {
          ...((prev[userId] || {}).adminPermissions || {}),
          [permissionKey]: checked,
        },
      },
    }));
  };

  const saveUser = async (row) => {
    const userId = String(row?._id || "");
    if (!userId) return;

    const payload = drafts[userId];
    if (!payload) return;

    try {
      setSavingId(userId);
      const response = await axios.patch(
        `${baseUrl}/auth/admin/users/${userId}`,
        payload,
        {
          headers: getAuthHeaders(),
        },
      );

      const updated = response.data?.user;
      if (updated) {
        setUsers((prev) =>
          prev.map((item) => (String(item._id) === userId ? updated : item)),
        );
        setDrafts((prev) => ({
          ...prev,
          [userId]: initDraft(updated),
        }));
      }
      toast.success("User updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update user");
    } finally {
      setSavingId("");
    }
  };

  const handleCreateAdmin = async (e) => {
    if (e) e.preventDefault();
    if (!adminForm.name || !adminForm.email || !adminForm.phone || !adminForm.password) {
      toast.error("Name, email, phone and password are required");
      return;
    }
    if (adminForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      setCreatingAdmin(true);
      await axios.post(
        `${baseUrl}/auth/admin/create-admin`,
        {
          name: adminForm.name.trim(),
          email: adminForm.email.trim(),
          phone: adminForm.phone.trim(),
          password: adminForm.password,
          status: adminForm.status,
          adminPermissions: adminForm.adminPermissions,
        },
        { headers: getAuthHeaders() },
      );

      toast.success("New admin account created successfully!");
      setAdminForm(DEFAULT_ADMIN_FORM);
      setActiveTab("manage-admin");
      await fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create admin account");
    } finally {
      setCreatingAdmin(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-black mb-2">Admin Access Required</h2>
        <p className="text-gray-600">Only authorized admins can manage administrative access.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-5">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-zinc-900 via-slate-900 to-black rounded-2xl p-5 md:p-8 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-2.5">
              <FiShield className="w-3.5 h-3.5" />
              <span>Admin Access & Security</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              {activeTab === "add-admin" && "Add New Admin"}
              {activeTab === "manage-admin" && "Manage Admin Accounts"}
              {activeTab === "admin-role" && "Admin Roles & Hierarchy"}
              {activeTab === "admin-permission" && "Admin Permissions & Access Control"}
            </h1>
            <p className="text-zinc-300 mt-1.5 text-xs sm:text-sm">
              {activeTab === "add-admin" && "Create a new admin or moderator account with specific credentials and privileges."}
              {activeTab === "manage-admin" && "View all administrators, edit status, phone numbers, and administrative notes."}
              {activeTab === "admin-role" && "Assign and update roles (Super Admin, Admin, Staff, User) for each member."}
              {activeTab === "admin-permission" && "Enable or revoke granular permissions (Orders, Products, Website, Reports) per admin."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Tab Buttons Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("add-admin")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "add-admin"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <FiUserPlus className="w-4 h-4" />
            Add Admin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manage-admin")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "manage-admin"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <FiUsers className="w-4 h-4" />
            Manage Admin ({summary.admins})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("admin-role")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "admin-role"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <FiUserCheck className="w-4 h-4" />
            Role
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("admin-permission")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "admin-permission"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <FiLock className="w-4 h-4" />
            Permission
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <p className="text-xs text-gray-500 font-medium">Total Administrators</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{summary.admins}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <p className="text-xs text-gray-500 font-medium">All User Accounts</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{summary.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <p className="text-xs text-gray-500 font-medium">System Role</p>
          <p className="text-xl sm:text-2xl font-bold text-indigo-600 mt-1">Super Admin</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <p className="text-xs text-gray-500 font-medium">Active Status</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">Online</p>
        </div>
      </div>

      {/* VIEW 1: ADD ADMIN FORM */}
      {activeTab === "add-admin" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-xs">
          <div className="border-b border-gray-100 pb-4 mb-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <FiUserPlus className="text-indigo-600" />
              Create New Admin Account
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Enter admin details, set a secure password, and select granted module permissions.
            </p>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="e.g. Arif Hossain"
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="e.g. admin@tazbazar.com"
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-gray-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Initial Permissions Assignment */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5 mt-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                Assign Module Permissions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ADMIN_PERMISSION_OPTIONS.map((perm) => (
                  <div
                    key={perm.key}
                    onClick={() =>
                      setAdminForm({
                        ...adminForm,
                        adminPermissions: {
                          ...adminForm.adminPermissions,
                          [perm.key]: !adminForm.adminPermissions[perm.key],
                        },
                      })
                    }
                    className={`cursor-pointer p-3 rounded-xl border transition-all ${
                      adminForm.adminPermissions[perm.key]
                        ? "bg-white border-indigo-400 shadow-xs"
                        : "bg-white/60 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <ThemedToggle
                      checked={Boolean(adminForm.adminPermissions[perm.key])}
                      onChange={(checked) =>
                        setAdminForm({
                          ...adminForm,
                          adminPermissions: {
                            ...adminForm.adminPermissions,
                            [perm.key]: checked,
                          },
                        })
                      }
                      label={perm.label}
                      themeColor={themeColor}
                      buttonTextColor={buttonTextColor}
                    />
                    <p className="text-[11px] text-gray-500 mt-1 pl-7">{perm.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={creatingAdmin}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gray-900 px-6 font-semibold text-white transition hover:bg-black disabled:opacity-60 shadow-sm"
              >
                <FiUserPlus className="w-4 h-4" />
                {creatingAdmin ? "Creating Admin..." : "Save Admin Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 2: MANAGE ADMIN (USER STATUS, DETAILS, AND NOTES) */}
      {activeTab === "manage-admin" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Administrator Accounts ({filteredUsers.length})
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Manage accounts, update status and contact information.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-xl px-2.5 h-10 w-full sm:w-auto">
                <FiFilter className="text-gray-500 w-4 h-4 shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-medium text-gray-700 outline-none cursor-pointer pr-2"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff / Moderator</option>
                  <option value="user">Regular User</option>
                </select>
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search admin name, email, phone..."
                className="h-10 flex-1 sm:w-64 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading administrators...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-500 border border-dashed rounded-xl">
              No administrator accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-600 border-b border-gray-200 bg-gray-50/70">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Administrator</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Admin Notes</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((row) => {
                    const userId = String(row._id);
                    const draft = drafts[userId] || initDraft(row);
                    const rowSaving = savingId === userId;

                    return (
                      <tr key={userId} className="hover:bg-gray-50/50 transition">
                        <td className="py-3.5 px-4 min-w-[220px]">
                          <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                            {row.name}
                            {row?.adminSettings?.isSuperAdmin && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-full font-bold">
                                Super Admin
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{row.email}</p>
                          <p className="text-xs text-gray-500">{row.phone || "No phone"}</p>
                        </td>
                        <td className="py-3.5 px-4 min-w-[150px]">
                          <RoleSelect
                            value={draft.userType}
                            onChange={(value) => updateDraft(userId, "userType", value)}
                          />
                        </td>
                        <td className="py-3.5 px-4 min-w-[140px]">
                          <StatusSelect
                            value={draft.status}
                            onChange={(value) => updateDraft(userId, "status", value)}
                          />
                        </td>
                        <td className="py-3.5 px-4 min-w-[220px]">
                          <textarea
                            value={draft.adminNotes}
                            onChange={(e) => updateDraft(userId, "adminNotes", e.target.value)}
                            placeholder="Add notes..."
                            rows={1}
                            className="w-full rounded-lg border border-gray-300 p-2 text-xs outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => saveUser(row)}
                            disabled={rowSaving}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gray-900 px-4 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-60 shadow-xs"
                          >
                            <FiSave className="w-3.5 h-3.5" />
                            {rowSaving ? "Saving..." : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: ADMIN ROLE MANAGEMENT */}
      {activeTab === "admin-role" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiUserCheck className="text-indigo-600" />
                Role Configuration & Assignment ({filteredUsers.length})
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Change user roles between Super Admin, Admin, Staff / Moderator and Regular Users.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-xl px-2.5 h-10 w-full sm:w-auto">
                <FiFilter className="text-gray-500 w-4 h-4 shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-medium text-gray-700 outline-none cursor-pointer pr-2"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff / Moderator</option>
                  <option value="user">Regular User</option>
                </select>
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, phone..."
                className="h-10 flex-1 sm:w-64 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
              <h3 className="font-bold text-indigo-900 text-sm">Super Admin</h3>
              <p className="text-xs text-indigo-700 mt-1">
                Full unrestricted control across all settings, user roles, marketplace and payment gateways.
              </p>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
              <h3 className="font-bold text-teal-900 text-sm">Admin</h3>
              <p className="text-xs text-teal-700 mt-1">
                Full operational management over orders, products, customers, and standard platform features.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <h3 className="font-bold text-amber-900 text-sm">Staff / Moderator</h3>
              <p className="text-xs text-amber-700 mt-1">
                Restricted access strictly based on the granted module permissions checklist.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading roles...
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-600 border-b border-gray-200 bg-gray-50/70">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User Details</th>
                    <th className="py-3 px-4 font-semibold">Current Role</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Update Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((row) => {
                    const userId = String(row._id);
                    const draft = drafts[userId] || initDraft(row);
                    const rowSaving = savingId === userId;

                    return (
                      <tr key={userId} className="hover:bg-gray-50/50 transition">
                        <td className="py-3.5 px-4 min-w-[240px]">
                          <p className="font-semibold text-gray-900">{row.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{row.email}</p>
                          <p className="text-xs text-gray-500">{row.phone || "-"}</p>
                        </td>
                        <td className="py-3.5 px-4 min-w-[180px]">
                          <RoleSelect
                            value={draft.userType}
                            onChange={(value) => updateDraft(userId, "userType", value)}
                          />
                        </td>
                        <td className="py-3.5 px-4 min-w-[140px]">
                          <StatusSelect
                            value={draft.status}
                            onChange={(value) => updateDraft(userId, "status", value)}
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => saveUser(row)}
                            disabled={rowSaving}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gray-900 px-4 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-60 shadow-xs"
                          >
                            <FiSave className="w-3.5 h-3.5" />
                            {rowSaving ? "Saving..." : "Apply Role"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: ADMIN PERMISSION MANAGEMENT */}
      {activeTab === "admin-permission" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiLock className="text-indigo-600" />
                Granular Permission Control ({filteredUsers.length})
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Toggle specific dashboard module permissions (Orders, Products, Reports, Website) for each account.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-xl px-2.5 h-10 w-full sm:w-auto">
                <FiFilter className="text-gray-500 w-4 h-4 shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-medium text-gray-700 outline-none cursor-pointer pr-2"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff / Moderator</option>
                  <option value="user">Regular User</option>
                </select>
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, phone..."
                className="h-10 flex-1 sm:w-64 px-3.5 text-xs sm:text-sm border border-gray-300 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading permissions...
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((row) => {
                const userId = String(row._id);
                const draft = drafts[userId] || initDraft(row);
                const rowSaving = savingId === userId;

                return (
                  <div
                    key={userId}
                    className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs transition hover:border-gray-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base">{row.name}</h3>
                          <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full capitalize">
                            {draft.userType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{row.email} • {row.phone || "No phone"}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => saveUser(row)}
                        disabled={rowSaving}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gray-900 px-5 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-60 shadow-xs"
                      >
                        <FiSave className="w-3.5 h-3.5" />
                        {rowSaving ? "Saving..." : "Save Permissions"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ADMIN_PERMISSION_OPTIONS.map((permission) => (
                        <div
                          key={permission.key}
                          onClick={() =>
                            updatePermissionDraft(
                              userId,
                              permission.key,
                              !Boolean(draft.adminPermissions?.[permission.key]),
                            )
                          }
                          className={`cursor-pointer p-3 rounded-xl border transition-all ${
                            draft.adminPermissions?.[permission.key]
                              ? "bg-indigo-50/40 border-indigo-300 shadow-2xs"
                              : "bg-gray-50/50 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <ThemedToggle
                            checked={Boolean(draft.adminPermissions?.[permission.key])}
                            onChange={(checked) =>
                              updatePermissionDraft(userId, permission.key, checked)
                            }
                            label={permission.label}
                            themeColor={themeColor}
                            buttonTextColor={buttonTextColor}
                          />
                          <p className="text-[11px] text-gray-500 mt-1 pl-7">{permission.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleAdminUsers;
