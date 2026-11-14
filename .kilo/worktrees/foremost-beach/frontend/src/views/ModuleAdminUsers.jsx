import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiChevronDown, FiRefreshCw, FiSave } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { useThemeColors } from "../hooks/useThemeColors";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ROLE_OPTIONS = ["admin", "user"];
const STATUS_OPTIONS = ["active", "pending", "inactive", "suspended"];
const ADMIN_PERMISSION_OPTIONS = [
  { key: "manageOrders", label: "Orders" },
  { key: "manageProducts", label: "Products" },
  { key: "manageUsers", label: "Users" },
  { key: "manageReports", label: "Reports" },
  { key: "manageWebsite", label: "Website" },
];

const RoleSelect = ({ value, onChange, disabled = false, className = "h-9" }) => (
  <div className="relative w-full">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`${className} w-full appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-sm font-medium text-black transition hover:border-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 cursor-pointer capitalize shadow-2xs`}
    >
      {ROLE_OPTIONS.map((role) => (
        <option key={role} value={role} className="capitalize py-1">
          {role}
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
      className={`${className} w-full appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-sm font-medium text-black transition hover:border-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 cursor-pointer capitalize shadow-2xs`}
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status} className="capitalize py-1">
          {status}
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
    className={`flex items-center gap-2 text-xs text-gray-700 select-none ${
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
    <span className="leading-tight truncate">{label}</span>
  </label>
);

const ModuleAdminUsers = () => {
  const { themeColor, buttonTextColor } = useThemeColors();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [search, setSearch] = useState("");

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
      const rows = (Array.isArray(response.data) ? response.data : []).filter(
        (row) => row?.adminSettings?.isSuperAdmin !== true,
      );
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
    const term = String(search || "")
      .trim()
      .toLowerCase();
    if (!term) return users;
    return users.filter((row) =>
      [row?.name, row?.email, row?.phone, row?.userType, row?.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [users, search]);

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
      toast.success("User updated");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update user");
    } finally {
      setSavingId("");
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-black mb-2">
          Admin Access Required
        </h2>
        <p className="text-gray-600">
          Only admin can manage user access levels.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-users-fluid-height w-full max-w-full space-y-4 sm:space-y-6">
      <div className="bg-linear-to-r from-zinc-900 to-black rounded-xl p-5 md:p-8 text-white">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
          Admin User Management
        </h1>
        <p className="text-zinc-200 mt-1.5 text-xs sm:text-sm">
          Manage admin access, user status, and permission duties.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4">
          <p className="text-xs text-gray-500">Total Users</p>
          <p className="text-lg sm:text-xl font-bold text-black mt-0.5 sm:mt-1">{summary.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4">
          <p className="text-xs text-gray-500">Admins</p>
          <p className="text-lg sm:text-xl font-bold text-black mt-0.5 sm:mt-1">{summary.admins}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-black">
            Users ({filteredUsers.length})
          </h2>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone, role"
              className="h-10 w-full px-3 text-xs sm:text-sm border border-gray-300 rounded-lg sm:min-w-[240px]"
            />
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--brand-theme-color)] bg-white px-4 text-xs sm:text-sm font-semibold text-[var(--brand-theme-color)] transition hover:bg-[var(--brand-theme-color)] hover:text-[var(--brand-button-text-color)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <>
            <div className="grid gap-3 lg:hidden w-full max-w-full">
              {filteredUsers.map((row) => {
                const userId = String(row._id);
                const draft = drafts[userId] || initDraft(row);
                const rowSaving = savingId === userId;

                return (
                  <div
                    key={userId}
                    className="rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] w-full max-w-full overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-black">
                          {row.name}
                        </p>
                        <p className="mt-0.5 break-all text-xs text-gray-500">
                          {row.email}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {row.phone || "-"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => saveUser(row)}
                        disabled={rowSaving}
                        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--brand-theme-color)] bg-[var(--brand-theme-color)] px-3 text-xs font-semibold text-[var(--brand-button-text-color)] shadow-[0_12px_24px_var(--brand-theme-shadow)] transition hover:opacity-95 disabled:opacity-60"
                      >
                        <FiSave className="h-3.5 w-3.5" />
                        {rowSaving ? "Saving..." : "Save"}
                      </button>
                    </div>

                    <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Role
                        </p>
                        <RoleSelect
                          value={draft.userType}
                          onChange={(value) =>
                            updateDraft(userId, "userType", value)
                          }
                          className="h-9 sm:h-10"
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Status
                        </p>
                        <StatusSelect
                          value={draft.status}
                          onChange={(value) =>
                            updateDraft(userId, "status", value)
                          }
                          className="h-9 sm:h-10"
                        />
                      </div>
                    </div>

                    <div className="mt-3.5">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Permissions
                      </p>
                      {draft.userType === "admin" ||
                      draft.userType === "staff" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ADMIN_PERMISSION_OPTIONS.map((permission) => (
                            <ThemedToggle
                              key={permission.key}
                              checked={Boolean(
                                draft.adminPermissions?.[permission.key],
                              )}
                              onChange={(checked) =>
                                updatePermissionDraft(
                                  userId,
                                  permission.key,
                                  checked,
                                )
                              }
                              label={permission.label}
                              themeColor={themeColor}
                              buttonTextColor={buttonTextColor}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">N/A</p>
                      )}
                    </div>

                    <div className="mt-3.5">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Notes
                      </p>
                      <textarea
                        value={draft.adminNotes}
                        onChange={(event) =>
                          updateDraft(userId, "adminNotes", event.target.value)
                        }
                        rows={2}
                        className="admin-users-notes-field w-full rounded-lg border border-gray-300 p-2 text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="admin-users-desktop-table hidden overflow-x-auto w-full max-w-full lg:block">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Permissions</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((row) => {
                    const userId = String(row._id);
                    const draft = drafts[userId] || initDraft(row);
                    const rowSaving = savingId === userId;

                    return (
                      <tr
                        key={userId}
                        className="border-b border-gray-100 align-top"
                      >
                        <td className="admin-users-table-cell py-3 pr-3 min-w-[220px]">
                          <p className="font-medium text-black">{row.name}</p>
                          <p className="text-xs text-gray-500">{row.email}</p>
                          <p className="text-xs text-gray-500">
                            {row.phone || "-"}
                          </p>
                        </td>
                        <td className="admin-users-table-cell py-3 pr-3 min-w-[150px]">
                          <RoleSelect
                            value={draft.userType}
                            onChange={(value) =>
                              updateDraft(userId, "userType", value)
                            }
                            className="h-9"
                          />
                        </td>
                        <td className="admin-users-table-cell py-3 pr-3 min-w-[150px]">
                          <StatusSelect
                            value={draft.status}
                            onChange={(value) =>
                              updateDraft(userId, "status", value)
                            }
                            className="h-9"
                          />
                        </td>
                        <td className="admin-users-table-cell py-3 pr-3 min-w-[220px]">
                          {draft.userType === "admin" ||
                          draft.userType === "staff" ? (
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              {ADMIN_PERMISSION_OPTIONS.map((permission) => (
                                <ThemedToggle
                                  key={permission.key}
                                  checked={Boolean(
                                    draft.adminPermissions?.[permission.key],
                                  )}
                                  onChange={(checked) =>
                                    updatePermissionDraft(
                                      userId,
                                      permission.key,
                                      checked,
                                    )
                                  }
                                  label={permission.label}
                                  themeColor={themeColor}
                                  buttonTextColor={buttonTextColor}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">N/A</p>
                          )}
                        </td>
                        <td className="admin-users-table-cell py-3 pr-3 min-w-[220px]">
                          <textarea
                            value={draft.adminNotes}
                            onChange={(event) =>
                              updateDraft(
                                userId,
                                "adminNotes",
                                event.target.value,
                              )
                            }
                            rows={1}
                            className="admin-users-notes-field admin-users-compact-notes w-full rounded-lg border border-gray-300 p-2 text-xs"
                          />
                        </td>
                        <td className="admin-users-table-cell py-3 pr-3 min-w-[110px]">
                          <button
                            type="button"
                            onClick={() => saveUser(row)}
                            disabled={rowSaving}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--brand-theme-color)] bg-[var(--brand-theme-color)] px-3 text-xs font-semibold text-[var(--brand-button-text-color)] shadow-[0_12px_24px_var(--brand-theme-shadow)] transition hover:opacity-95 disabled:opacity-60"
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
          </>
        )}
      </div>
    </div>
  );
};

export default ModuleAdminUsers;
