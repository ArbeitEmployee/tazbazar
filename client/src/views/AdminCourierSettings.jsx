"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiTruck,
  FiSave,
  FiSettings,
  FiToggleLeft,
  FiToggleRight,
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  loadAdminSettings,
  saveAdminSettings,
  selectAdminSettingsDraft,
  selectPublicSettingsState,
  updateAdminField,
} from "../store/publicSettingsSlice";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const baseProviderOrder = [
  "steadfast",
  "pathao",
  "ecourier",
  "carrybee",
  "redx",
];
const COURIER_PROVIDER_DEFINITIONS = {
  steadfast: {
    label: "Steadfast",
    defaultBaseUrl: "https://portal.packzy.com",
    defaultConsignmentPath: "/api/v1/create_order",
    defaultTrackingPath: "/api/v1/status_by_cid",
    pingPath: "/api/v1/ping",
  },
  pathao: {
    label: "Pathao",
    defaultBaseUrl: "https://api-hermes.pathao.com",
    defaultConsignmentPath: "/aladdin/api/v1/orders",
    pingPath: "/aladdin/api/v1/cities",
  },
  ecourier: {
    label: "eCourier",
    defaultBaseUrl: "https://staging.ecourier.com.bd",
    defaultConsignmentPath: "/api/order-place",
    pingPath: "/api/city-list",
  },
  carrybee: {
    label: "CarryBee",
    defaultBaseUrl: "https://api.carrybee.com.bd",
    defaultConsignmentPath: "/api/v1/orders",
    pingPath: "/api/v1/ping",
  },
  redx: {
    label: "RedX",
    defaultBaseUrl: "https://openapi.redx.com.bd",
    defaultConsignmentPath: "/v1.0.0/parcels",
    pingPath: "/v1.0.0/areas",
  },
};

const sectionClass = "app-panel space-y-4 p-5 md:p-6";
const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-black";

const defaultCourierConfig = (key = "", label) => {
  const meta = COURIER_PROVIDER_DEFINITIONS[key] || {};
  return {
    providerName: label,
    enabled: false,
    apiBaseUrl: meta.defaultBaseUrl || "",
    apiToken: "",
    apiKey: "",
    apiSecret: "",
    consignmentPath: meta.defaultConsignmentPath || "/consignments",
    trackingPath: meta.defaultTrackingPath || "/track",
    labelPath: "/label",
    pingPath: meta.pingPath || "/api/v1/ping",
    timeoutMs: 12000,
  };
};

const slugifyCourierKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const TEST_INITIAL = { state: "idle", detail: "" };

const AdminCourierSettings = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const settings = useSelector(selectAdminSettingsDraft);
  const { adminStatus, saveStatus } = useSelector(selectPublicSettingsState);
  const loading = adminStatus === "idle" || adminStatus === "loading";
  const saving = saveStatus === "loading";

  const [testStatus, setTestStatus] = useState({});
  const [expanded, setExpanded] = useState({});
  const [showAdvanced, setShowAdvanced] = useState({});
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newBase, setNewBase] = useState("custom");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const expandedInitRef = useRef(false);

  const isAdmin = useMemo(
    () => String(user?.userType || "").toLowerCase() === "admin",
    [user?.userType],
  );

  useEffect(() => {
    if (!isAdmin) return;

    dispatch(loadAdminSettings())
      .unwrap()
      .catch((message) => {
        toast.error(message || "Failed to load courier settings");
      });
  }, [dispatch, isAdmin]);

  const courierMap = useMemo(() => {
    const current =
      settings?.couriers && typeof settings.couriers === "object"
        ? settings.couriers
        : {};

    const map = {};
    baseProviderOrder.forEach((providerKey) => {
      const label =
        COURIER_PROVIDER_DEFINITIONS[providerKey]?.label || providerKey;
      const currentConfig = current[providerKey] || {};
      const defaults = defaultCourierConfig(providerKey, label);
      map[providerKey] = {
        ...defaults,
        ...currentConfig,
        providerName: String(currentConfig.providerName || label).trim(),
        enabled: Boolean(currentConfig.enabled),
        timeoutMs: Math.max(1000, parseInt(currentConfig.timeoutMs, 10) || 12000),
        apiBaseUrl: String(currentConfig.apiBaseUrl || defaults.apiBaseUrl).trim(),
        consignmentPath: String(
          currentConfig.consignmentPath || defaults.consignmentPath,
        ).trim(),
        trackingPath: String(
          currentConfig.trackingPath || defaults.trackingPath,
        ).trim(),
        pingPath: String(currentConfig.pingPath || defaults.pingPath).trim(),
      };
    });

    // Custom couriers saved by admin (keys not in the built-in list).
    Object.entries(current).forEach(([rawKey, config]) => {
      if (!config || typeof config !== "object") return;
      const key = slugifyCourierKey(rawKey);
      if (!key || map[key]) return;
const label =
      String(config.providerName || rawKey || "Custom Courier").trim() ||
      "Custom Courier";
      map[key] = {
        ...defaultCourierConfig(slugifyCourierKey(rawKey), label),
        ...config,
        providerName: label,
        enabled: Boolean(config.enabled),
        timeoutMs: Math.max(
          1000,
          parseInt(config.timeoutMs, 10) || 12000,
        ),
      };
    });

    return map;
  }, [settings?.couriers]);

  const providerOrder = useMemo(
    () => Object.keys(courierMap),
    [courierMap],
  );

  const isCustomProvider = (providerKey) =>
    !baseProviderOrder.includes(providerKey);

  // Auto-expand enabled providers on first load so the page stays compact.
  useEffect(() => {
    if (expandedInitRef.current) return;
    if (adminStatus !== "succeeded") return;
    expandedInitRef.current = true;
    const initial = {};
    providerOrder.forEach((providerKey) => {
      if (courierMap[providerKey]?.enabled) initial[providerKey] = true;
    });
    setExpanded(initial);
  }, [adminStatus, providerOrder, courierMap]);

  const enabledCouriers = useMemo(
    () =>
      providerOrder.filter((providerKey) => courierMap[providerKey]?.enabled),
    [courierMap, providerOrder],
  );

  const toggleExpanded = (providerKey) => {
    setExpanded((prev) => ({ ...prev, [providerKey]: !prev[providerKey] }));
  };

  const commitCouriers = (nextMap) => {
    dispatch(updateAdminField({ key: "couriers", value: nextMap }));
  };

  const updateCourier = (providerKey, key, value) => {
    const nextConfig = {
      ...courierMap[providerKey],
      [key]: key === "enabled" ? Boolean(value) : value,
    };

    if (key === "timeoutMs") {
      nextConfig.timeoutMs = Math.max(1000, parseInt(value, 10) || 12000);
    }

    commitCouriers({ ...courierMap, [providerKey]: nextConfig });

    // Invalidate a cached test result when configuration changes.
    setTestStatus((prev) => ({
      ...prev,
      [providerKey]: { ...TEST_INITIAL, state: "idle" },
    }));
  };

  // Extra account of a built-in provider (e.g. second Steadfast key),
  // or a fully custom courier.
  const resolveBaseProvider = (providerKey, config) => {
    const stored = String(config?.baseProvider || "").trim().toLowerCase();
    if (stored && baseProviderOrder.includes(stored)) return stored;
    const prefix = String(providerKey || "").toLowerCase();
    return (
      baseProviderOrder.find(
        (builtIn) =>
          prefix !== builtIn && prefix.startsWith(`${builtIn}-`),
      ) || ""
    );
  };

  const handleAddCourier = (event) => {
    event.preventDefault();
    const label = String(newName || "").trim();
    if (!label) {
      toast.error("Give the courier a name first");
      return;
    }

    const base =
      newBase !== "custom" && baseProviderOrder.includes(newBase)
        ? newBase
        : "";
    const nameSlug = slugifyCourierKey(label);

    let key;
    if (base) {
      // e.g. Steadfast "Dhaka" -> steadfast-dhaka, fallback steadfast-2
      key = nameSlug && nameSlug !== base ? `${base}-${nameSlug}` : `${base}-2`;
      key = key.slice(0, 48);
      let suffix = 2;
      const stem = key.replace(/-\d+$/, "");
      while (courierMap[key]) {
        suffix += 1;
        key = `${stem}-${suffix}`.slice(0, 48);
      }
    } else {
      let baseKey = nameSlug ? `custom-${nameSlug}` : "custom-courier";
      baseKey = baseKey.slice(0, 48);
      key = baseKey;
      let suffix = 2;
      while (courierMap[key]) {
        key = `${baseKey}-${suffix}`.slice(0, 48);
        suffix += 1;
      }
    }

    commitCouriers({
      ...courierMap,
      [key]: {
        ...defaultCourierConfig(base || key, label),
        baseProvider: base,
        apiBaseUrl:
          String(newUrl || "").trim() ||
          defaultCourierConfig(base || key, label).apiBaseUrl,
      },
    });
    setExpanded((prev) => ({ ...prev, [key]: true }));
    setSelectedProvider(key);
    setNewName("");
    setNewUrl("");
    setNewBase("custom");
    setShowAddForm(false);
    toast.success(`${label} added — fill credentials and save`);
  };

  const handleDeleteCourier = (providerKey) => {
    if (!isCustomProvider(providerKey)) return;
    const label =
      courierMap[providerKey]?.providerName || providerKey;
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    const nextMap = { ...courierMap };
    delete nextMap[providerKey];
    commitCouriers(nextMap);
    setSelectedProvider((prev) => (prev === providerKey ? null : prev));
    setTestStatus((prev) => {
      const next = { ...prev };
      delete next[providerKey];
      return next;
    });
    toast.success(`${label} removed — press Save to apply`);
  };

  const hasReachableUrl = (courier) => {
    try {
      const url = new URL(courier?.apiBaseUrl || "");
      return /^https?:$/.test(url.protocol);
    } catch {
      return false;
    }
  };

  const hasCredentials = (courier) =>
    Boolean(
      courier?.apiToken?.trim() ||
        courier?.apiKey?.trim() ||
        courier?.apiSecret?.trim(),
    );

  const runConnectionTest = async (providerKey) => {
    const courier = courierMap[providerKey];
    if (!hasReachableUrl(courier)) {
      setTestStatus((prev) => ({
        ...prev,
        [providerKey]: {
          state: "fail",
          detail: "Enter a valid HTTP(S) API base URL first",
        },
      }));
      return;
    }

    setTestStatus((prev) => ({
      ...prev,
      [providerKey]: { state: "testing", detail: "Testing connection..." },
    }));

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${baseUrl}/auth/admin/settings/couriers/test`,
        { courierKey: providerKey, config: courier },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: (courier?.timeoutMs || 12000) + 5000,
        },
      );
      const payload = response?.data || {};
      setTestStatus((prev) => ({
        ...prev,
        [providerKey]: {
          state: payload.connected ? "ok" : "fail",
          connected: Boolean(payload.connected),
          status: payload.status,
          latencyMs: payload.latencyMs,
          targetUrl: payload.targetUrl,
          bodyPreview: payload.bodyPreview,
          note: payload.note || "",
          detail: payload.connected
            ? `Connected — HTTP ${payload.status}${payload.latencyMs != null ? ` in ${payload.latencyMs}ms` : ""}`
            : payload.note || `Connection failed (HTTP ${payload.status || "?"})`,
        },
      }));
    } catch (error) {
      const detail =
        error?.code === "ECONNABORTED"
          ? `Timed out after ${(courier?.timeoutMs || 12000) + 5000}ms`
          : error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "Connection test failed";
      setTestStatus((prev) => ({
        ...prev,
        [providerKey]: { state: "fail", detail },
      }));
    }
  };

  const validateBeforeSave = (payload) => {
    const errors = [];
    for (const providerKey of providerOrder) {
      const courier = payload.couriers?.[providerKey];
      if (!courier?.enabled) continue;
      if (!hasReachableUrl(courier)) {
        errors.push(
          `${courier.providerName || providerKey}: valid API base URL required`,
        );
      }
      if (!hasCredentials(courier)) {
        errors.push(
          `${courier.providerName || providerKey}: at least one credential required`,
        );
      }
    }
    return errors;
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const payload = {
      couriers: courierMap,
      courier: { ...(settings?.courier || {}) },
    };

    const validationErrors = validateBeforeSave(payload);
    if (validationErrors.length) {
      validationErrors.forEach((message) => toast.error(message));
      return;
    }

    try {
      await dispatch(saveAdminSettings(payload)).unwrap();
      toast.success("Courier settings saved");
    } catch (error) {
      toast.error(error || "Failed to save courier settings");
    }
  };

  if (!isAdmin) {
    return (
      <div className="app-panel p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-black">
          Admin Access Required
        </h2>
        <p className="text-gray-600">Only admin can manage courier settings.</p>
      </div>
    );
  }

  const renderTestResult = (providerKey) => {
    const result = testStatus[providerKey] || TEST_INITIAL;
    if (result.state === "idle") return null;
    if (result.state === "testing") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-200 border-t-black" />
          Testing...
        </span>
      );
    }
    if (result.state === "ok") {
      return (
        <span className="inline-flex items-start gap-1.5 text-xs font-semibold text-emerald-700">
          <FiCheckCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>
            <span className="block">{result.detail}</span>
            {result.targetUrl ? (
              <span className="block break-all font-mono text-[11px] text-emerald-600/70">
                {result.targetUrl}
              </span>
            ) : null}
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-start gap-1.5 text-xs font-semibold text-red-600">
        <FiXCircle className="mt-0.5 h-4 w-4 flex-none" />
        <span>
          <span className="block">{result.detail}</span>
          {result.targetUrl ? (
            <span className="block break-all font-mono text-[11px] text-red-500/70">
              {result.targetUrl}
            </span>
          ) : null}
          {result.bodyPreview ? (
            <span className="mt-1 block max-w-md truncate rounded bg-red-50 px-2 py-1 font-mono text-[11px] text-red-700">
              {result.bodyPreview}
            </span>
          ) : null}
        </span>
      </span>
    );
  };

  const StatusChip = ({ ok, label }) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {ok ? <FiCheckCircle className="h-3 w-3" /> : <FiXCircle className="h-3 w-3" />}
      {label}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="app-hero p-6 md:p-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <FiTruck className="h-6 w-6" />
        </div>
        <p className="app-kicker text-white/65!">Courier setup</p>
        <h1 className="mt-3 text-2xl font-black md:text-3xl">Courier Setup</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-200 md:text-base">
          Configure the courier providers used for order handoff and tracking.
          Enable only the couriers you want available in the order lifecycle.
        </p>
      </div>

      {/* Sub-navigation — each courier opens its own page */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setSelectedProvider(null)}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            !selectedProvider
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All Couriers
        </button>
        {providerOrder.map((providerKey) => {
          const courier = courierMap[providerKey];
          const isEnabled = courier?.enabled;
          const active = selectedProvider === providerKey;
          return (
            <button
              key={providerKey}
              type="button"
              onClick={() =>
                setSelectedProvider(active ? null : providerKey)
              }
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-black text-white"
                  : isEnabled
                    ? "bg-emerald-50 text-emerald-700 hover:opacity-80"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {courier?.providerName || providerKey}
              {isEnabled && !active ? <FiCheckCircle className="h-3 w-3" /> : null}
            </button>
          );
        })}
        <span className="ml-auto text-xs font-medium text-gray-500">
          {enabledCouriers.length > 0
            ? `${enabledCouriers.length} enabled — these are selectable when handing orders to a courier`
            : "No courier enabled yet — orders will not offer courier handoff"}
        </span>
      </div>

      {enabledCouriers.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <FiAlertCircle className="h-5 w-5 flex-none" />
          Enable at least one courier provider and fill its credentials so the
          order lifecycle can create consignments.
        </div>
      ) : null}

      <form onSubmit={handleSave} className="space-y-4">
        {selectedProvider && courierMap[selectedProvider] ? (
          <button
            type="button"
            onClick={() => setSelectedProvider(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 transition hover:text-black"
          >
            ← Back to all couriers
          </button>
        ) : null}
        {providerOrder.map((providerKey) => {
          if (selectedProvider && providerKey !== selectedProvider) return null;
          const courier = courierMap[providerKey];
          const providerLabel =
            courier?.providerName ||
            COURIER_PROVIDER_DEFINITIONS[providerKey]?.label ||
            providerKey;
          const isOpen =
            selectedProvider === providerKey
              ? true
              : Boolean(expanded[providerKey]);
          const showAdv = Boolean(showAdvanced[providerKey]);
          const custom = isCustomProvider(providerKey);
          const baseOf = custom ? resolveBaseProvider(providerKey, courier) : "";
          const baseLabel = baseOf
            ? COURIER_PROVIDER_DEFINITIONS[baseOf]?.label || baseOf
            : "";
          const urlOk = hasReachableUrl(courier);
          const credsOk = hasCredentials(courier);

          return (
            <section key={providerKey} className="app-panel overflow-hidden">
              {/* Collapsed header — everything visible at a glance */}
              <div className="flex flex-wrap items-center gap-3 p-4 md:p-5">
                <button
                  type="button"
                  onClick={() => toggleExpanded(providerKey)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <FiChevronDown
                    className={`h-4 w-4 flex-none text-gray-400 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-base font-semibold text-black">
                        {providerLabel}
                      </span>
                      {custom ? (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                          {baseLabel ? `${baseLabel} account` : "Custom"}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusChip ok={courier?.enabled} label={courier?.enabled ? "Enabled" : "Disabled"} />
                      <StatusChip ok={urlOk} label={urlOk ? "URL set" : "No URL"} />
                      <StatusChip ok={credsOk} label={credsOk ? "Creds set" : "No creds"} />
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateCourier(providerKey, "enabled", !courier?.enabled)
                  }
                  className={`inline-flex flex-none items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    courier?.enabled
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {courier?.enabled ? (
                    <FiToggleRight className="h-4 w-4" />
                  ) : (
                    <FiToggleLeft className="h-4 w-4" />
                  )}
                  {courier?.enabled ? "Enabled" : "Disabled"}
                </button>
                {custom ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteCourier(providerKey)}
                    title={`Delete ${providerLabel}`}
                    className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                ) : null}
              </div>

              {/* Expanded form */}
              {isOpen ? (
                <div className="space-y-4 border-t border-gray-100 p-4 md:p-5">
                  {courier?.enabled && (!urlOk || !credsOk) ? (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <FiAlertCircle className="h-3.5 w-3.5" />
                      {!urlOk
                        ? "Valid API base URL is required before saving."
                        : "At least one credential (token, key, or secret) is required."}
                    </p>
                  ) : null}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      value={courier?.providerName || ""}
                      onChange={(event) =>
                        updateCourier(providerKey, "providerName", event.target.value)
                      }
                      placeholder="Provider name"
                      className={inputClass}
                    />
                    <input
                      value={courier?.apiBaseUrl || ""}
                      onChange={(event) =>
                        updateCourier(providerKey, "apiBaseUrl", event.target.value)
                      }
                      placeholder="API base URL (https://...)"
                      className={`${inputClass} ${courier?.enabled && !urlOk ? "border-red-300" : ""}`}
                    />
                    <input
                      value={courier?.apiToken || ""}
                      onChange={(event) =>
                        updateCourier(providerKey, "apiToken", event.target.value)
                      }
                      placeholder="API token"
                      className={inputClass}
                      autoComplete="off"
                    />
                    <input
                      value={courier?.apiKey || ""}
                      onChange={(event) =>
                        updateCourier(providerKey, "apiKey", event.target.value)
                      }
                      placeholder="API key"
                      className={inputClass}
                      autoComplete="off"
                    />
                    <input
                      value={courier?.apiSecret || ""}
                      onChange={(event) =>
                        updateCourier(providerKey, "apiSecret", event.target.value)
                      }
                      placeholder="API secret"
                      className={inputClass}
                      autoComplete="off"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowAdvanced((prev) => ({ ...prev, [providerKey]: !prev[providerKey] }))
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 transition hover:text-black"
                  >
                    <FiSettings className="h-3.5 w-3.5" />
                    {showAdv ? "Hide advanced endpoints" : "Show advanced endpoints"}
                    <FiChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdv ? "" : "-rotate-90"}`} />
                  </button>

                  {showAdv ? (
                    <div className="grid grid-cols-1 gap-3 rounded-2xl bg-gray-50 p-4 md:grid-cols-2">
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        value={courier?.timeoutMs || 12000}
                        onChange={(event) =>
                          updateCourier(providerKey, "timeoutMs", event.target.value)
                        }
                        placeholder="Timeout (ms)"
                        className={inputClass}
                      />
                      <input
                        value={courier?.consignmentPath || ""}
                        onChange={(event) =>
                          updateCourier(providerKey, "consignmentPath", event.target.value)
                        }
                        placeholder="Consignment path"
                        className={inputClass}
                      />
                      <input
                        value={courier?.trackingPath || ""}
                        onChange={(event) =>
                          updateCourier(providerKey, "trackingPath", event.target.value)
                        }
                        placeholder="Tracking path"
                        className={inputClass}
                      />
                      <input
                        value={courier?.pingPath || ""}
                        onChange={(event) =>
                          updateCourier(providerKey, "pingPath", event.target.value)
                        }
                        placeholder="Ping / test path"
                        className={inputClass}
                      />
                      <input
                        value={courier?.labelPath || ""}
                        onChange={(event) =>
                          updateCourier(providerKey, "labelPath", event.target.value)
                        }
                        placeholder="Label path"
                        className={inputClass}
                      />
                    </div>
                  ) : null}

                  {!showAdv ? (
                    <p className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                      Ping path: {courier?.pingPath || "/api/v1/ping"}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onClick={() => runConnectionTest(providerKey)}
                        disabled={testStatus[providerKey]?.state === "testing"}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-2 text-xs font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
                      >
                        <FiActivity className="h-3.5 w-3.5" />
                        {testStatus[providerKey]?.state === "testing"
                          ? "Testing..."
                          : "Test Connection"}
                      </button>
                      {renderTestResult(providerKey)}
                    </div>
                </div>
              ) : null}
            </section>
          );
        })}

        {/* Add custom courier */}
        {!selectedProvider ? (
        <section className={sectionClass}>
          {showAddForm ? (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-black">
                <FiPlus className="h-5 w-5" /> Add Courier Account
              </h2>
              <p className="text-xs text-gray-500">
                Add another account of Steadfast / Pathao / eCourier — or a
                fully custom courier.
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select
                  value={newBase}
                  onChange={(event) => setNewBase(event.target.value)}
                  className={inputClass}
                >
                  <option value="custom">Custom courier</option>
                  {baseProviderOrder.map((builtIn) => (
                    <option key={builtIn} value={builtIn}>
                      Extra {COURIER_PROVIDER_DEFINITIONS[builtIn]?.label || builtIn} account
                    </option>
                  ))}
                </select>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder={
                    newBase === "custom"
                      ? "Courier name (e.g. DHL Express)"
                      : "Account name (e.g. Steadfast Dhaka)"
                  }
                  className={inputClass}
                />
                <input
                  value={newUrl}
                  onChange={(event) => setNewUrl(event.target.value)}
                  placeholder="API base URL (optional for now)"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddCourier}
                  className="app-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
                >
                  <FiPlus className="h-4 w-4" />
                  Add Courier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewName("");
                    setNewUrl("");
                    setNewBase("custom");
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-black"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-4 text-sm font-semibold text-gray-600 transition hover:border-black hover:text-black"
            >
              <FiPlus className="h-4 w-4" />
              Add Courier (extra Steadfast / Pathao account or custom)
            </button>
          )}
        </section>
        ) : null}

        <div className="sticky bottom-3 z-50">
          <div className="rounded-2xl border border-black/10 bg-white/90 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.10)] backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || loading}
                className="app-btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-md transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 md:px-5"
              >
                <FiSave className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Courier Setup"}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminCourierSettings;
