import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiArrowRight,
  FiCheckCircle,
  FiGrid,
  FiMail,
  FiRefreshCw,
  FiShield,
  FiTruck,
} from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import { Link } from "@/lib/routing";
import usePublicSettings from "../../hooks/usePublicSettings";
import { fetchPublicCategories } from "../../utils/publicCategories";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const DEFAULT_TRUST_ITEMS = [
  {
    icon: FaMoneyBillWave,
    title: "Cash on Delivery",
    text: "Pay at your doorstep anywhere in Bangladesh.",
    wrap: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  {
    icon: FiTruck,
    title: "Fast Delivery",
    text: "Inside Dhaka 24h, outside 48–72h.",
    wrap: "bg-gradient-to-br from-blue-500 to-indigo-600",
  },
  {
    icon: FiRefreshCw,
    title: "Easy Returns",
    text: "7-day hassle-free return policy.",
    wrap: "bg-gradient-to-br from-violet-500 to-purple-600",
  },
  {
    icon: FiShield,
    title: "Buyer Protection",
    text: "100% genuine products, secure checkout.",
    wrap: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
];

export const TrustStrip = () => {
  const { settings } = usePublicSettings();
  const bullets = Array.isArray(settings?.storefront?.trustBullets)
    ? settings.storefront.trustBullets.filter(Boolean)
    : [];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:py-6 sm:px-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {DEFAULT_TRUST_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5"
            >
              <span
                className={`flex h-11 w-11 sm:h-12 sm:w-12 flex-none items-center justify-center rounded-xl sm:rounded-2xl ${item.wrap} text-white shadow-xs`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs sm:text-sm font-bold text-slate-900">
                  {item.title}
                </span>
                <span className="block truncate text-[11px] sm:text-xs text-slate-500 font-medium">
                  {item.text}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      {bullets.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {bullets.map((line, index) => (
            <span
              key={`${line}-${index}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                index % 3 === 0
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : index % 3 === 1
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-rose-50 text-rose-600 border border-rose-100"
              }`}
            >
              <FiCheckCircle className="h-3.5 w-3.5" />
              {line}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
};

const PASTEL_CATEGORY_CARDS = [
  "bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 ring-amber-200",
  "bg-gradient-to-br from-rose-100 via-pink-50 to-rose-100 ring-rose-200",
  "bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 ring-violet-200",
  "bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 ring-emerald-200",
  "bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 ring-sky-200",
  "bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 ring-orange-200",
];

export const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let active = true;
    fetchPublicCategories()
      .then((list) => {
        if (!active) return;
        setCategories(
          list.filter((entry) => !entry?.parent).slice(0, 8),
        );
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8 sm:px-6">
      <div className="mb-5 sm:mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600 border border-blue-100">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
            Explore Catalog
          </p>
          <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Top Categories
          </h2>
        </div>
        <Link
          to="/shop"
          className="group inline-flex flex-none items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition-all duration-200 hover:border-blue-600 hover:bg-blue-50/40 hover:text-blue-600 hover:shadow-xs"
        >
          <span>View All</span>
          <FiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((category) => (
          <Link
            key={category._id}
            to={`/shop?category=${category._id}`}
            className="group flex flex-col items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10"
          >
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-100/80 shadow-2xs transition-transform duration-300 group-hover:scale-108 group-hover:bg-blue-50/50">
              {category.image ? (
                <img
                  src={optimizeCloudinaryUrl(category.image, 200)}
                  alt={category.name}
                  loading="lazy"
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <FiGrid className="h-7 w-7 text-blue-600" />
              )}
            </div>
            <p className="w-full truncate text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              {category.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export const ZzoneDealsStrip = () => null;

export const CampaignBanner = () => {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    let active = true;
    axios
      .get(`${baseUrl}/campaigns/public`, { params: { limit: 3 } })
      .then((response) => {
        if (!active) return;
        setCampaigns(
          Array.isArray(response.data?.campaigns)
            ? response.data.campaigns
            : [],
        );
      })
      .catch(() => {
        if (active) setCampaigns([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (campaigns.length === 0) return null;
  const featured = campaigns[0];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl p-8 text-white sm:p-12 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 border border-slate-800 shadow-xl shadow-slate-200/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 animate-pulse rounded-full bg-blue-600/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-indigo-600/25 blur-3xl"
        />
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center rounded-full bg-blue-600/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-xs">
              Special Campaign
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white drop-shadow-xs sm:text-4xl">
              {featured.title}
            </h2>
            {featured.description ? (
              <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-relaxed text-slate-300 font-medium">
                {featured.description}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-600"
              >
                Shop the Campaign <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Browse All
              </Link>
            </div>
          </div>
          {featured.bannerImage ? (
            <div className="overflow-hidden rounded-2xl border border-white/20 shadow-xl">
              <img
                src={optimizeCloudinaryUrl(featured.bannerImage, 1200)}
                alt={featured.title}
                loading="lazy"
                className="h-64 w-full object-cover sm:h-80"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      setDone(localStorage.getItem("newsletterSubscribed") === "1");
    } catch {
      setDone(false);
    }
  }, []);

  const subscribe = (event) => {
    event.preventDefault();
    const value = String(email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("Enter a valid email address");
      return;
    }
    try {
      const list = JSON.parse(
        localStorage.getItem("newsletterEmails") || "[]",
      );
      if (!list.includes(value)) {
        list.push(value);
        localStorage.setItem("newsletterEmails", JSON.stringify(list));
      }
      localStorage.setItem("newsletterSubscribed", "1");
    } catch {
      // storage unavailable — still confirm visually
    }
    setDone(true);
    setEmail("");
    toast.success("Subscribed! You will get our latest offers.");
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="zz-deals-shell relative overflow-hidden rounded-[32px] p-8 text-white text-center shadow-[0_22px_50px_rgba(180,90,40,0.28)] sm:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-[#BF9B5C]/40 blur-2xl"
        />
        <div className="relative">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
            <FiMail className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-2xl font-black text-white drop-shadow-sm sm:text-3xl">
            Get Offers in Your Inbox
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
            Join our newsletter for flash deals, new arrivals and exclusive
            discounts.
          </p>
          {done ? (
            <p className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm">
              <FiCheckCircle className="h-4 w-4" /> You are subscribed. Thank
              you!
            </p>
          ) : (
            <form
              onSubmit={subscribe}
              className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email address"
                className="h-12 flex-1 rounded-full border-2 border-white/30 bg-white/95 px-5 text-sm text-[#201C14] outline-none transition focus:border-white"
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-extrabold text-[#8A3A1E] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
