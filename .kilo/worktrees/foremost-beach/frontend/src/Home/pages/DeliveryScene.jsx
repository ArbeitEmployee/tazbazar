"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiPackage,
  FiShield,
  FiTruck,
} from "react-icons/fi";

const DeliveryScene = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto py-6">
      {/* Glow Backdrop */}
      <div className="absolute -inset-4 bg-gradient-to-r from-amber-200/40 via-[#BF9B5C]/20 to-sky-200/30 rounded-3xl blur-2xl opacity-70 pointer-events-none" />

      {/* Main Glass Showcase Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-[#F0E4C8] bg-gradient-to-br from-white via-[#FFF9EF]/80 to-[#FFF3DE] p-8 shadow-[0_20px_50px_rgba(191,155,92,0.18)]">
        {/* Animated Background Rings */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-[#BF9B5C]/20 animate-pulse pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full border border-[#BF9B5C]/15 pointer-events-none" />

        {/* Central Graphic */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Main Delivery Icon Visual */}
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-[#BF9B5C] via-[#D9A63C] to-[#8A5A00] text-white shadow-[0_16px_36px_rgba(191,155,92,0.38)]"
          >
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            >
              <FiTruck className="h-14 w-14 drop-shadow-md" />
            </motion.div>

            {/* Pulsing Status Ping */}
            <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 border-2 border-white items-center justify-center">
                <FiCheckCircle className="h-3 w-3 text-white" />
              </span>
            </span>
          </motion.div>

          <h3 className="text-xl font-black tracking-tight text-[#201C14] sm:text-2xl">
            Nationwide Express Delivery
          </h3>
          <p className="mt-2 text-xs font-semibold text-[#6B6455] max-w-xs leading-relaxed sm:text-sm">
            Fast, reliable fulfillment right to your doorstep across 64 districts.
          </p>

          {/* Floating Metric Badges */}
          <div className="mt-8 grid w-full grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-3 rounded-2xl border border-[#F0E4C8] bg-white/90 p-3.5 shadow-sm backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-amber-50 text-[#8A5A00]">
                <FiClock className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#201C14]">24-72 Hours</p>
                <p className="text-[10px] text-[#6B6455]">Standard Transit</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-3 rounded-2xl border border-[#F0E4C8] bg-white/90 p-3.5 shadow-sm backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FiShield className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#201C14]">100% Insured</p>
                <p className="text-[10px] text-[#6B6455]">Safe Handover</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-3 rounded-2xl border border-[#F0E4C8] bg-white/90 p-3.5 shadow-sm backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <FiMapPin className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#201C14]">64 Districts</p>
                <p className="text-[10px] text-[#6B6455]">Full Coverage</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-3 rounded-2xl border border-[#F0E4C8] bg-white/90 p-3.5 shadow-sm backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <FiPackage className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#201C14]">Live Tracking</p>
                <p className="text-[10px] text-[#6B6455]">Real-time Updates</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryScene;

