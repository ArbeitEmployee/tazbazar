"use client";
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "@/lib/routing";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
} from "react-icons/fi";
import usePublicSettings from "../hooks/usePublicSettings";
import { loadPublicSettings } from "../store/publicSettingsSlice";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const Registration = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { settings } = usePublicSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const website = settings?.website || {};
  const brandName = website?.storeName || "Clotya";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm({
    mode: "onBlur",
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        accountType: "user",
      };

      const response = await axios.post(`${baseUrl}/auth/register`, payload);
      toast.success("Account created successfully! Please sign in.");
      dispatch(loadPublicSettings({ force: true }));
      navigate("/login", { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to create account. Please try again.";

      if (/email already in use/i.test(message)) {
        setError("email", { type: "server", message: "Email already in use" });
      } else if (/phone number already in use/i.test(message)) {
        setError("phone", {
          type: "server",
          message: "Phone number already in use",
        });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center px-4 py-12 bg-white font-sans">
      <div className="w-full max-w-[440px] mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block text-2xl font-black tracking-tight text-gray-900 mb-2">
            {brandName}
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
          <p className="text-xs text-gray-500 mt-1">
            Fill in your details to get started
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white p-7 sm:p-8 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Full Name
              </label>
              <div className="relative flex items-center">
                <FiUser className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  {...register("name", { required: "Full name is required" })}
                  placeholder="e.g. John Doe"
                  className={`w-full rounded-xl bg-gray-50 border ${
                    errors.name ? "border-rose-400" : "border-gray-200"
                  } pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <FiMail className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  {...register("email", {
                    required: "Email address is required",
                    pattern: {
                      value: EMAIL_PATTERN,
                      message: "Please enter a valid email address",
                    },
                  })}
                  placeholder="name@example.com"
                  className={`w-full rounded-xl bg-gray-50 border ${
                    errors.email ? "border-rose-400" : "border-gray-200"
                  } pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <FiPhone className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  {...register("phone", {
                    required: "Phone number is required",
                    minLength: {
                      value: 11,
                      message: "Phone number must be at least 11 digits",
                    },
                  })}
                  placeholder="01XXXXXXXXX"
                  className={`w-full rounded-xl bg-gray-50 border ${
                    errors.phone ? "border-rose-400" : "border-gray-200"
                  } pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <FiLock className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  placeholder="Minimum 6 characters"
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
                  <span>Create Account</span>
                  <FiArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Login redirect */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-black hover:underline transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Registration;
