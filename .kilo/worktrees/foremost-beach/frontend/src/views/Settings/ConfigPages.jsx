import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiPlus, FiRefreshCw, FiSave, FiTrash2 } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MODE_META = {
  marketing: { title: "Marketing", description: "Marketing / analytics integration IDs.", fields: [
    { key: "metaPixelId", label: "Meta (Facebook) Pixel ID", placeholder: "123456789012345" },
    { key: "googleAnalyticsId", label: "Google Analytics ID", placeholder: "G-XXXXXXX" },
    { key: "gtmId", label: "Google Tag Manager ID", placeholder: "GTM-XXXXXXX" },
    { key: "tiktokPixelId", label: "TikTok Pixel ID", placeholder: "TikTok Pixel" },
  ] },
  "invoice-address": { title: "Invoice Address", description: "Store address shown on invoices.", fields: [
    { key: "companyName", label: "Company / Store Name", placeholder: "Your Store Ltd." },
    { key: "addressLine", label: "Address", placeholder: "House 12, Road 5, Dhanmondi" },
    { key: "city", label: "City", placeholder: "Dhaka" },
    { key: "postalCode", label: "Postal Code", placeholder: "1205" },
    { key: "country", label: "Country", placeholder: "Bangladesh" },
    { key: "phone", label: "Phone", placeholder: "+8801XXXXXXXXX" },
  ] },
  "social-login": { title: "Social Login", description: "Google / Facebook OAuth credentials.", fields: [
    { key: "googleClientId", label: "Google Client ID", placeholder: "xxxx.apps.googleusercontent.com" },
    { key: "googleClientSecret", label: "Google Client Secret", placeholder: "••••••••" },
    { key: "facebookAppId", label: "Facebook App ID", placeholder: "1234567890" },
    { key: "facebookAppSecret", label: "Facebook App Secret", placeholder: "••••••••" },
  ] },
  "sms-api": { title: "SMS API", description: "SMS gateway credentials used for order notifications.", fields: [
    { key: "smsProvider", label: "SMS Provider", placeholder: "e.g. Twilio, BongoSDK, Custom" },
    { key: "smsApiKey", label: "API Key", placeholder: "••••••••" },
    { key: "smsSenderId", label: "Sender ID", placeholder: "Your Brand" },
    { key: "smsPhoneNumber", label: "Registered Phone / SID", placeholder: "+8801XXXXXXXXX" },
    { key: "smsApiBaseUrl", label: "Gateway Base URL (optional)", placeholder: "https://provider.com/smsapi or root of the cron-form API" },
  ] },
  city: { title: "City", description: "Manage supported cities (merged with shipping zones).", listField: true, fieldLabel: "City Name", fieldPlaceholder: "Dhaka, Chattogram, ...", sectionKey: "cities" },
  "sub-city": { title: "Sub City", description: "Manage supported sub cities / areas (merged with shipping zones).", listField: true, fieldLabel: "Sub City / Area Name", fieldPlaceholder: "Dhanmondi, Uttara, ...", sectionKey: "subCities" },
  "domain-setup": { title: "Domain Setup", description: "Custom domain and site URL configuration.", fields: [
    { key: "siteUrl", label: "Site URL", placeholder: "https://yourdomain.com" },
    { key: "adminEmail", label: "Admin Email", placeholder: "admin@yourdomain.com" },
    { key: "metaTitle", label: "Default Meta Title", placeholder: "Your Store" },
    { key: "metaDescription", label: "Default Meta Description", placeholder: "Best online shopping in Bangladesh" },
  ] },
};

const ConfigPages = ({ initialMode = "marketing" }) => {
  const meta = MODE_META[initialMode] || MODE_META.marketing;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [listItems, setListItems] = useState([]);
  const [newItem, setNewItem] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/auth/admin/settings`, { headers: getAuthHeaders() });
      const settingsData = data?.settings || data?.data || {};
      setSettings(settingsData);
      if (meta.listField) {
        const section = settingsData?.[meta.sectionKey];
        setListItems(Array.isArray(section) ? section : []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [meta.listField, meta.sectionKey]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { ...settings };
      if (meta.listField) payload[meta.sectionKey] = listItems;
      const { data } = await axios.put(`${baseUrl}/auth/admin/settings`, payload, { headers: getAuthHeaders() });
      if (data?.message || data?.success) toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addListItem = (event) => {
    event.preventDefault();
    const value = newItem.trim();
    if (!value) return;
    setListItems((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setNewItem("");
  };

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSettings} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50">
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleSave} disabled={saving || loading} className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50">
            <FiSave size={14} /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-slate-400">Loading settings...</p>
      ) : meta.listField ? (
        <form onSubmit={addListItem} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-end gap-3">
            <div className="min-w-64 flex-1">
              <label className="mb-1 block text-sm font-medium">{meta.fieldLabel}</label>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder={meta.fieldPlaceholder}
              />
            </div>
            <button type="submit" className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
              <FiPlus size={14} /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {listItems.length === 0 ? (
              <p className="py-4 text-sm text-slate-400">No entries yet.</p>
            ) : (
              listItems.map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                  {item}
                  <button
                    type="button"
                    onClick={() => setListItems((prev) => prev.filter((entry) => entry !== item))}
                    className="rounded-full p-0.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Remove"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </span>
              ))
            )}
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2">
          {meta.fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium">{field.label}</label>
              <input
                type="text"
                value={settings?.[field.key] || ""}
                onChange={(e) => setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConfigPages;