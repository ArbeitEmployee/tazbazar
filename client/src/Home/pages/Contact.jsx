import React, { useMemo, useState } from "react";
import axios from "axios";
import {
  FiCheckCircle,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSend,
  FiUser,
  FiClock,
  FiHelpCircle,
  FiChevronDown,
  FiMessageCircle,
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiArrowRight,
} from "react-icons/fi";
import { FaFacebookF, FaWhatsapp, FaInstagram, FaYoutube } from "react-icons/fa";
import { toast } from "react-hot-toast";
import usePublicSettings from "../../hooks/usePublicSettings";
import { useThemeColors } from "../../hooks/useThemeColors";
import SearchableSelect from "../../components/SearchableSelect";
import { stripHtml } from "../../utils/richText";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const subjectOptions = [
  { value: "order_status", label: "Order Status & Delivery Update" },
  { value: "return_refund", label: "Return & Refund Inquiry" },
  { value: "product_inquiry", label: "Product Information & Availability" },
  { value: "technical_issue", label: "Website & Technical Issue" },
  { value: "partnership", label: "Wholesale & Business Inquiry" },
  { value: "other", label: "Other / General Inquiry" },
];

const faqs = [
  {
    question: "How long does delivery take after placing an order?",
    answer:
      "Inside Dhaka, orders are typically delivered within 24 to 48 hours. Outside Dhaka, nationwide delivery takes 2 to 4 business days.",
  },
  {
    question: "Can I inspect the product upon delivery?",
    answer:
      "Yes, you can inspect the package and check your items in front of the delivery partner before completing payment via Cash on Delivery.",
  },
  {
    question: "What is your exchange and return policy?",
    answer:
      "If you receive a defective item or need a different size, notify our support team within 7 days of delivery for a hassle-free exchange or replacement.",
  },
  {
    question: "What are your customer support working hours?",
    answer:
      "Our customer support team is active daily from 9:00 AM to 10:00 PM via live chat, WhatsApp, and hotline calls.",
  },
];

const withProtocol = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const fallbackMapUrl =
  "https://www.google.com/maps?q=Dhaka+Bangladesh&output=embed";

const getMapLinkUrl = (addressLink, address = "") => {
  const directLink = withProtocol(addressLink);
  if (directLink) return directLink;
  if (address) {
    return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  }
  return "https://maps.google.com";
};

const getMapEmbedUrl = (addressLink, address = "") => {
  const directLink = withProtocol(addressLink);
  const fallbackQuery = String(address || "").trim();

  const getCoordinateMatch = (value) => {
    const source = String(value || "");
    const atMatch = source.match(
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)z?)?/i,
    );
    if (atMatch) {
      return {
        lat: atMatch[1],
        lng: atMatch[2],
        zoom: atMatch[3] || "",
      };
    }

    const dataMatch = source.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i);
    if (dataMatch) {
      return {
        lat: dataMatch[1],
        lng: dataMatch[2],
        zoom: "",
      };
    }

    return null;
  };

  if (!directLink) {
    return fallbackQuery
      ? `https://www.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&output=embed`
      : fallbackMapUrl;
  }

  try {
    const url = new URL(directLink);
    const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (!hostname.includes("google.") && hostname !== "maps.app.goo.gl") {
      return directLink;
    }

    if (
      url.pathname.includes("/maps/embed") ||
      url.searchParams.get("output") === "embed"
    ) {
      return directLink;
    }

    const coordinates = getCoordinateMatch(directLink);
    if (coordinates?.lat && coordinates?.lng) {
      const query = `${coordinates.lat},${coordinates.lng}`;
      const zoomPart = coordinates.zoom
        ? `&z=${encodeURIComponent(coordinates.zoom)}`
        : "";
      return `https://www.google.com/maps?q=${encodeURIComponent(query)}${zoomPart}&output=embed`;
    }

    let query =
      url.searchParams.get("q") ||
      url.searchParams.get("query") ||
      url.searchParams.get("destination") ||
      "";

    if (!query && url.pathname.includes("/place/")) {
      query = decodeURIComponent(
        url.pathname.split("/place/")[1]?.split("/")[0] || "",
      ).replace(/\+/g, " ");
    }

    if (!query) {
      query = fallbackQuery;
    }

    if (query) {
      return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }

    return fallbackMapUrl;
  } catch {
    return fallbackQuery
      ? `https://www.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&output=embed`
      : fallbackMapUrl;
  }
};

const Contact = () => {
  const { settings } = usePublicSettings();
  const { themeColor, buttonTextColor } = useThemeColors();
  const website = settings?.website || {};
  const contact = settings?.contact || {};
  const social = settings?.social || {};
  const storeName =
    String(website?.storeName || "E-Commerce").trim() || "E-Commerce";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const contactInfo = useMemo(() => {
    const rawPhone1 = String(contact?.phone1 || "").trim() || "+880 1700-000000";
    const rawPhone2 = String(contact?.phone2 || "").trim();
    
    // Check if admin provided WhatsApp in social settings first, else fallback to phone
    const rawWhatsApp = String(social?.whatsapp || contact?.phone2 || contact?.phone1 || "").trim() || rawPhone1;
    const cleanWhatsApp = rawWhatsApp.replace(/[^0-9]/g, "");
    const waNumber = cleanWhatsApp.startsWith("88")
      ? cleanWhatsApp
      : cleanWhatsApp.startsWith("0")
        ? `88${cleanWhatsApp}`
        : cleanWhatsApp;

    const customMapEmbed = String(contact?.mapEmbedUrl || "").trim();
    const currentAddress = stripHtml(contact?.address) || "House #12, Road #05, Dhanmondi, Dhaka 1205, Bangladesh";

    return {
      email: String(contact?.email || "").trim() || "support@marketplace.com.bd",
      phone1: rawPhone1,
      phone2: rawPhone2,
      whatsappNumber: waNumber,
      displayWhatsApp: rawWhatsApp,
      address: currentAddress,
      addressLink: getMapLinkUrl(
        contact?.addressLink,
        currentAddress,
      ),
      mapUrl: customMapEmbed || getMapEmbedUrl(contact?.addressLink, currentAddress),
      hotlineTitle: String(contact?.hotlineTitle || "").trim() || "Hotline Support",
      hotlineSubtitle: String(contact?.hotlineSubtitle || "").trim() || "Speak directly with us",
      whatsappTitle: String(contact?.whatsappTitle || "").trim() || "WhatsApp Chat",
      whatsappSubtitle: String(contact?.whatsappSubtitle || "").trim() || "24/7 direct messaging",
      emailTitle: String(contact?.emailTitle || "").trim() || "Email Support",
      emailSubtitle: String(contact?.emailSubtitle || "").trim() || "Official inquiries",
      officeTitle: String(contact?.officeTitle || "").trim() || "Office & Showroom",
      officeSubtitle: String(contact?.officeSubtitle || "").trim() || "Visit our location",
      officeHours: String(contact?.officeHours || "").trim(),
      formTitle: String(contact?.formTitle || "").trim() || "Send Us a Message",
      formSubtitle: String(contact?.formSubtitle || "").trim() || "Fill out the form below and our customer support team will get back to you shortly.",
    };
  }, [contact, social]);

  const socialLinks = useMemo(() => {
    const formatUrl = (url, type) => {
      const raw = String(url || "").trim();
      if (!raw) return "";
      if (type === "whatsapp") {
        if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
        const digits = raw.replace(/[^0-9]/g, "");
        const fullNumber = digits.startsWith("88") ? digits : digits.startsWith("0") ? `88${digits}` : digits;
        return `https://wa.me/${fullNumber}`;
      }
      if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
      return `https://${raw}`;
    };

    const list = [];
    if (social?.facebook) {
      list.push({
        id: "facebook",
        label: "Facebook",
        url: formatUrl(social.facebook, "facebook"),
        icon: FaFacebookF,
        bgClass: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
      });
    }
    if (social?.whatsapp) {
      list.push({
        id: "whatsapp",
        label: "WhatsApp",
        url: formatUrl(social.whatsapp, "whatsapp"),
        icon: FaWhatsapp,
        bgClass: "hover:bg-[#25D366] hover:text-white hover:border-[#25D366]",
      });
    }
    if (social?.instagram) {
      list.push({
        id: "instagram",
        label: "Instagram",
        url: formatUrl(social.instagram, "instagram"),
        icon: FaInstagram,
        bgClass: "hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F]",
      });
    }
    if (social?.youtube) {
      list.push({
        id: "youtube",
        label: "YouTube",
        url: formatUrl(social.youtube, "youtube"),
        icon: FaYoutube,
        bgClass: "hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]",
      });
    }
    return list;
  }, [social]);

  const channels = [
    {
      id: "phone",
      badge: "Fastest Response",
      title: contactInfo.hotlineTitle,
      subtitle: contactInfo.hotlineSubtitle,
      value: contactInfo.phone1,
      actionText: "Call Now",
      href: `tel:${contactInfo.phone1.replace(/\s+/g, "")}`,
      icon: FiPhone,
      iconBg: "bg-blue-50 text-blue-600 border-blue-200/60",
      accentBorder: "hover:border-blue-400",
    },
    {
      id: "whatsapp",
      badge: "Instant Chat",
      title: contactInfo.whatsappTitle,
      subtitle: contactInfo.whatsappSubtitle,
      value: contactInfo.displayWhatsApp,
      actionText: "Chat on WhatsApp",
      href: `https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent(
        `Hello ${storeName}, I have an inquiry.`,
      )}`,
      icon: FiMessageCircle,
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
      accentBorder: "hover:border-emerald-400",
      isExternal: true,
    },
    {
      id: "email",
      badge: "Official Support",
      title: contactInfo.emailTitle,
      subtitle: contactInfo.emailSubtitle,
      value: contactInfo.email,
      actionText: "Send Email",
      href: `mailto:${contactInfo.email}`,
      icon: FiMail,
      iconBg: "bg-amber-50 text-amber-600 border-amber-200/60",
      accentBorder: "hover:border-amber-400",
    },
    {
      id: "location",
      badge: "Store / Office",
      title: contactInfo.officeTitle,
      subtitle: contactInfo.officeSubtitle,
      value: contactInfo.address,
      actionText: "Get Directions",
      href: contactInfo.addressLink,
      icon: FiMapPin,
      iconBg: "bg-rose-50 text-rose-600 border-rose-200/60",
      accentBorder: "hover:border-rose-400",
      isExternal: true,
    },
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...formData,
      name: String(formData.name || "").trim(),
      email: String(formData.email || "").trim(),
      phone: String(formData.phone || "").trim(),
      subject:
        subjectOptions.find((option) => option.value === formData.subject)
          ?.label || "General Inquiry",
      message: String(formData.message || "").trim(),
    };

    if (
      !payload.name ||
      !payload.email ||
      !payload.subject ||
      !stripHtml(payload.message)
    ) {
      toast.error("Name, email, subject, and message are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        `${baseUrl}/contact-submissions`,
        payload,
      );

      if (!response.data?.success) {
        toast.error("Failed to send your message. Please try again.");
        return;
      }

      toast.success("Your message has been sent successfully!");
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      window.setTimeout(() => setIsSubmitted(false), 6000);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to send your message. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#F8FAFC] py-8 sm:py-14 text-slate-800">
      <div className="site-shell max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        
        {/* ── 1. Hero Header ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 px-6 py-10 sm:px-12 sm:py-14 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide backdrop-blur-md border border-white/10 mb-4 text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              We&apos;re here to help you 24/7
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white mb-4">
              Get in Touch with Our Support Team
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Have questions about order tracking, delivery, returns, or products? Reach out to our dedicated team via call, WhatsApp, or message anytime.
            </p>

            {/* Quick trust metrics */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-400">
                  <FiClock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">9:00 AM - 10:00 PM</div>
                  <div className="text-[11px] text-slate-400">Support 7 Days a Week</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-400">
                  <FiTruck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Fast Nationwide Delivery</div>
                  <div className="text-[11px] text-slate-400">Cash on Delivery Available</div>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-400">
                  <FiRefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Easy Exchange Policy</div>
                  <div className="text-[11px] text-slate-400">7-Day Hassle-Free Returns</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Four Sleek Contact Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {channels.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.id}
                href={card.href}
                target={card.isExternal ? "_blank" : undefined}
                rel={card.isExternal ? "noopener noreferrer" : undefined}
                className={`group relative flex flex-col justify-between rounded-2xl bg-white p-5 border border-slate-200/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${card.accentBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${card.iconBg}`}
                    >
                      {card.badge}
                    </span>
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{card.subtitle}</p>

                  <p className="mt-3 text-sm font-semibold text-slate-800 line-clamp-2 select-all">
                    {card.value}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>{card.actionText}</span>
                  <FiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
            );
          })}
        </div>

        {/* ── 3. Main Split Section: Form on Left, Location & Office Info on Right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Contact Form (7 cols) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-sm flex flex-col h-full">
            <div className="mb-6 pb-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Direct Message
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  {contactInfo.formTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {contactInfo.formSubtitle}
                </p>
              </div>
              <div
                className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
                style={{
                  backgroundColor: themeColor || "#0f172a",
                  color: buttonTextColor || "#ffffff",
                }}
              >
                <FiSend className="h-5 w-5" />
              </div>
            </div>

            {isSubmitted ? (
              <div className="py-14 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm animate-bounce">
                  <FiCheckCircle className="text-3xl" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Thank You! Message Sent Successfully
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
                  We have received your message. A customer representative will contact you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow transition hover:bg-slate-800 cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700">
                      <FiUser className="text-slate-400" /> Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. John Doe"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700">
                      <FiPhone className="text-slate-400" /> Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="01XXXXXXXXX"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700">
                      <FiMail className="text-slate-400" /> Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Subject Dropdown */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700">
                      <FiHelpCircle className="text-slate-400" /> Subject <span className="text-rose-500">*</span>
                    </label>
                    <SearchableSelect
                      value={formData.subject}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, subject: value }))
                      }
                      options={[
                        { value: "", label: "Select a subject..." },
                        ...subjectOptions,
                      ]}
                      placeholder="Select a subject..."
                      searchable={false}
                      className="min-w-0"
                      buttonClassName="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      menuClassName="rounded-xl"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-between">
                    <span>Your Message <span className="text-rose-500">*</span></span>
                    <span className="text-[11px] text-slate-400 font-normal">Provide clear details</span>
                  </label>
                  <textarea
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Write your order ID, inquiry, or question in detail..."
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 leading-relaxed"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 px-6 text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer active:scale-[0.99]"
                    style={{
                      backgroundColor: themeColor || "#0f172a",
                      color: buttonTextColor || "#ffffff",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <FiSend className="h-4 w-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: Map Card (6 cols) - Perfectly matching Left Form Card height */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-5 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FiMapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Our Location
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Google Maps Live View</p>
                </div>
              </div>

              {contactInfo.addressLink ? (
                <a
                  href={contactInfo.addressLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200/60 transition hover:bg-blue-100/70"
                >
                  Open in Maps &rarr;
                </a>
              ) : null}
            </div>

            {/* Responsive Map iFrame filling remaining height */}
            <div className="relative w-full flex-1 min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
              <iframe
                title={`${storeName} map`}
                src={contactInfo.mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full grayscale-[0.05] contrast-[1.05]"
              />
            </div>

            {/* Address & Navigation Details bottom pinned */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-3 shrink-0">
              <FiMapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-900">Head Office & Dispatch:</strong>{" "}
                {contactInfo.address}
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Frequently Asked Questions (FAQ) Accordion ── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-200/60 mb-2">
              <FiHelpCircle className="h-3.5 w-3.5" /> Quick Answers
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Frequently Asked Questions (FAQ)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Find immediate answers to common questions below
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? "border-blue-200 bg-blue-50/20 shadow-xs"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer gap-4"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-800">
                      {faq.question}
                    </span>
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${
                        isOpen ? "rotate-180 bg-blue-600 text-white" : ""
                      }`}
                    >
                      <FiChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Contact;
