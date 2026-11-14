"use client";
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "@/lib/routing";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiMail,
  FiLock,
  FiUser,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiArrowRight,
} from "react-icons/fi";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import usePublicSettings from "../hooks/usePublicSettings";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const AuthModal = ({ isOpen, onClose, initialView = "login" }) => {
  const [activeTab, setActiveTab] = useState(initialView); // "login" | "register"
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { settings } = usePublicSettings();
  const website = settings?.website || {};
  const brandName = website?.storeName || "Clotya";

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin },
    setValue: setLoginValue,
    reset: resetLoginForm,
  } = useForm();

  // Register form
  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: errorsSignup },
    setError: setSignupError,
    reset: resetSignupForm,
  } = useForm();

  useEffect(() => {
    setActiveTab(initialView);
  }, [initialView, isOpen]);

  // Load rememberMe
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLoginId = localStorage.getItem("rememberedLoginId");
      const savedRememberMe = localStorage.getItem("rememberMe") === "true";
      if (savedRememberMe && savedLoginId) {
        setRememberMe(true);
        setLoginValue("loginId", savedLoginId);
      }
    }
  }, [setLoginValue]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Login
  const onLoginSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        loginId: data.loginId,
        password: data.password,
      };

      const response = await axios.post(`${baseUrl}/auth/login`, payload);

      if (rememberMe) {
        localStorage.setItem("rememberedLoginId", data.loginId);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedLoginId");
        localStorage.removeItem("rememberMe");
      }

      await login(response.data.user, response.data.token);
      toast.success("Welcome back!");
      onClose();
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Invalid credentials. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register
  const onSignupSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        accountType: "user",
      };

      await axios.post(`${baseUrl}/auth/register`, payload);
      toast.success("Account created successfully! Please sign in.");
      resetSignupForm();
      setActiveTab("login");
      setLoginValue("loginId", data.email || data.phone);
    } catch (error) {
      const message =
        error.response?.data?.error || "Registration failed. Please try again.";
      if (/email already in use/i.test(message)) {
        setSignupError("email", { type: "server", message: "Email already in use" });
      } else if (/phone number already in use/i.test(message)) {
        setSignupError("phone", { type: "server", message: "Phone number already in use" });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startSocialLogin = (provider) => {
    const normalized = String(provider || "").toLowerCase();
    if (!["google", "facebook"].includes(normalized)) return;
    window.location.href = `${baseUrl}/auth/social/${normalized}`;
  };

  return (
    <div className="fixed inset-0 z-[150000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-10 max-h-[92vh] overflow-y-auto custom-scrollbar"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>

        {/* Brand & Tab Toggle */}
        <div className="text-center mb-6">
          <span className="text-xl font-black tracking-tight text-gray-900 block mb-3">
            {brandName}
          </span>
          <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`py-2 rounded-lg transition cursor-pointer ${
                activeTab === "login"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`py-2 rounded-lg transition cursor-pointer ${
                activeTab === "register"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* TAB 1: SIGN IN */}
        {activeTab === "login" ? (
          <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email or Phone
              </label>
              <div className="relative flex items-center">
                <FiMail className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  {...registerLogin("loginId", { required: "Email or phone is required" })}
                  placeholder="name@example.com / 01XXXXXXXXX"
                  className={`w-full rounded-xl bg-gray-50 border ${
                    errorsLogin.loginId ? "border-rose-400" : "border-gray-200"
                  } pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition`}
                />
              </div>
              {errorsLogin.loginId && (
                <p className="mt-1 text-[11px] text-rose-500">{errorsLogin.loginId.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <Link
                  to="/forgot-password"
                  onClick={onClose}
                  className="text-xs text-gray-500 hover:text-black transition"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative flex items-center">
                <FiLock className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...registerLogin("password", { required: "Password is required" })}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl bg-gray-50 border ${
                    errorsLogin.password ? "border-rose-400" : "border-gray-200"
                  } pl-10 pr-10 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {errorsLogin.password && (
                <p className="mt-1 text-[11px] text-rose-500">{errorsLogin.password.message}</p>
              )}
            </div>

            <div className="flex items-center pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black accent-black"
                />
                <span className="text-xs text-gray-600">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition shadow-sm disabled:opacity-50 cursor-pointer mt-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>

            {/* Social Logins */}
            {(settings?.integrations?.enableGoogleLogin || settings?.integrations?.enableFacebookLogin) && (
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                {settings?.integrations?.enableGoogleLogin && (
                  <button
                    type="button"
                    onClick={() => startSocialLogin("google")}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <FaGoogle className="h-3.5 w-3.5 text-rose-500" />
                    <span>Continue with Google</span>
                  </button>
                )}
                {settings?.integrations?.enableFacebookLogin && (
                  <button
                    type="button"
                    onClick={() => startSocialLogin("facebook")}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <FaFacebook className="h-3.5 w-3.5 text-blue-600" />
                    <span>Continue with Facebook</span>
                  </button>
                )}
              </div>
            )}
          </form>
        ) : (
          /* TAB 2: SIGN UP */
          <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <div className="relative flex items-center">
                <FiUser className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  {...registerSignup("name", { required: "Full name is required" })}
                  placeholder="e.g. John Doe"
                  className={`w-full rounded-xl bg-gray-50 border ${
                    errorsSignup.name ? "border-rose-400" : "border-gray-200"
                  } pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition`}
                />
              </div>
              {errorsSignup.name && (
                <p className="mt-1 text-[11px] text-rose-500">{errorsSignup.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative flex items-center">
                <FiMail className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  {...registerSignup("email", {
                    required: "Email is required",
                    pattern: {
                      value: EMAIL_PATTERN,
                      message: "Valid email required",
                    },
                  })}
                  placeholder="name@example.com"
                  className={`w-full rounded-xl bg-gray-50 border ${
                    errorsSignup.email ? "border-rose-400" : "border-gray-200"
                  } pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition`}
                />
              </div>
              {errorsSignup.email && (
                <p className="mt-1 text-[11px] text-rose-500">{errorsSignup.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <div className="relative flex items-center">
                <FiPhone className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  {...registerSignup("phone", {
                    required: "Phone is required",
                    minLength: {
                      value: 11,
                      message: "At least 11 digits",
                    },
                  })}
                  placeholder="01XXXXXXXXX"
                  className={`w-full rounded-xl bg-gray-50 border ${
                    errorsSignup.phone ? "border-rose-400" : "border-gray-200"
                  } pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition`}
                />
              </div>
              {errorsSignup.phone && (
                <p className="mt-1 text-[11px] text-rose-500">{errorsSignup.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative flex items-center">
                <FiLock className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...registerSignup("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Minimum 6 characters",
                    },
                  })}
                  placeholder="Minimum 6 characters"
                  className={`w-full rounded-xl bg-gray-50 border ${
                    errorsSignup.password ? "border-rose-400" : "border-gray-200"
                  } pl-10 pr-10 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {errorsSignup.password && (
                <p className="mt-1 text-[11px] text-rose-500">{errorsSignup.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition shadow-sm disabled:opacity-50 cursor-pointer mt-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default AuthModal;
