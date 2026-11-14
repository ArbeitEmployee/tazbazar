"use client";
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "@/lib/routing";
import axios from "axios";
import toast from "react-hot-toast";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import usePublicSettings from "../hooks/usePublicSettings";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [socialProviders, setSocialProviders] = useState({
    google: false,
    facebook: false,
  });

  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { settings } = usePublicSettings();

  const website = settings?.website || {};
  const brandName = website?.storeName || "Clotya";

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  useEffect(() => {
    const savedLoginId = localStorage.getItem("rememberedLoginId");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";

    if (savedRememberMe && savedLoginId) {
      setRememberMe(true);
      setValue("loginId", savedLoginId);
    }
  }, [setValue]);

  useEffect(() => {
    setSocialProviders({
      google: Boolean(settings?.integrations?.enableGoogleLogin),
      facebook: Boolean(settings?.integrations?.enableFacebookLogin),
    });
  }, [settings]);

  const onSubmit = async (data) => {
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
      toast.success("Login successful!");
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Invalid login credentials. Please try again.";
      toast.error(errorMessage);
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
    <div className="min-h-[85vh] w-full flex items-center justify-center px-4 py-12 bg-white">
      <div className="w-full max-w-[420px] mx-auto">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block text-2xl font-black tracking-tight text-gray-900 mb-2">
            {brandName}
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="text-xs text-gray-500 mt-1">
            Please enter your registered details to continue
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white p-7 sm:p-8 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Login ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email or Phone
              </label>
              <div className="relative flex items-center">
                <FiMail className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  {...register("loginId", { required: "Email or phone is required" })}
                  placeholder="name@example.com / 01XXXXXXXXX"
                  className={`w-full rounded-xl bg-gray-50 border ${
                    errors.loginId ? "border-rose-400" : "border-gray-200"
                  } pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition`}
                />
              </div>
              {errors.loginId && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.loginId.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-gray-500 hover:text-black transition"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative flex items-center">
                <FiLock className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", { required: "Password is required" })}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl bg-gray-50 border ${
                    errors.password ? "border-rose-400" : "border-gray-200"
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
              {errors.password && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
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

            {/* Submit */}
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
          </form>

          {/* Social Logins */}
          {(socialProviders.google || socialProviders.facebook) && (
            <div className="mt-5 space-y-2.5">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-gray-100 w-full" />
                <span className="bg-white px-2 text-[10px] text-gray-400 uppercase tracking-wider">
                  or
                </span>
                <div className="border-t border-gray-100 w-full" />
              </div>

              {socialProviders.google && (
                <button
                  type="button"
                  onClick={() => startSocialLogin("google")}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  <FaGoogle className="h-3.5 w-3.5 text-rose-500" />
                  <span>Google</span>
                </button>
              )}
              {socialProviders.facebook && (
                <button
                  type="button"
                  onClick={() => startSocialLogin("facebook")}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  <FaFacebook className="h-3.5 w-3.5 text-blue-600" />
                  <span>Facebook</span>
                </button>
              )}
            </div>
          )}

          {/* Create Account link */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-bold text-black hover:underline transition">
                Create account
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
