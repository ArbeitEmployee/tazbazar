"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiRefreshCw, FiSearch } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const STATUS_BADGE = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  inactive: "border-slate-200 bg-slate-100 text-slate-600",
  suspended: "border-rose-200 bg-rose-50 text-rose-700",
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/auth/admin/all-users`, {
        headers: getAuthHeaders(),
      });
      const rows = Array.isArray(data) ? data : [];
      setCustomers(
        rows.filter(
          (row) =>
            String(row?.userType || "").toLowerCase() !== "admin",
        ),
      );
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filtered = useMemo(() => {
    const term = String(search || "")
      .trim()
      .toLowerCase();
    if (!term) return customers;
    return customers.filter((row) =>
      [row?.name, row?.email, row?.phone, row?.originalPhone, row?.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [customers, search]);

  const summary = useMemo(
    () => ({
      total: customers.length,
      active: customers.filter(
        (row) => String(row?.status || "").toLowerCase() === "active",
      ).length,
      pending: customers.filter(
        (row) => String(row?.status || "").toLowerCase() === "pending",
      ).length,
    }),
    [customers],
  );

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">
            Customers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review registered customer accounts, status, and signup dates.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchCustomers}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total customers</p>
          <p className="mt-1 text-2xl font-bold text-black">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {summary.active}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {summary.pending}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, phone, or status"
          className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Last login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Loading customers...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No customers found.
                </td>
              </tr>
            ) : (
              filtered.map((customer) => {
                const status = String(customer?.status || "active").toLowerCase();
                return (
                  <tr key={customer._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-black">
                        {customer.name || "Unnamed"}
                      </p>
                      <p className="text-xs text-slate-500">{customer.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {customer.phone || customer.originalPhone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                          STATUS_BADGE[status] || STATUS_BADGE.inactive
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(customer.lastLogin)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;