import React from "react";
import { useSelector } from "react-redux";
import { FiMenu, FiBell } from "react-icons/fi";
import { isSuperAdminUser, resolveUserRole } from "../../utils/dashboardAccess";

const ROLE_TITLES = {
  admin: "Admin Console",
  user: "Customer Console",
};

const MobileHeader = ({ toggleSidebar, user, pageMeta }) => {
  const role = resolveUserRole(user);
  const isSuperAdmin = isSuperAdminUser(user);
  const consoleTitle =
    role === "admin" && isSuperAdmin
      ? "Super Admin Console"
      : ROLE_TITLES[role] || ROLE_TITLES.user;
  const title = pageMeta?.title || consoleTitle;
  const subtitle = pageMeta?.section || consoleTitle;

  const unreadNotificationsCount = useSelector(
    (state) =>
      state.notifications?.items?.filter((item) => !item.isRead)?.length || 0,
  );

  const openNotificationsTab = () => {
    window.dispatchEvent(
      new CustomEvent("dashboardTabChange", {
        detail: { tab: "notifications" },
      }),
    );
  };

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-black/10 bg-white/88 px-4 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
      <button
        onClick={toggleSidebar}
        className="rounded-xl border border-black/10 bg-white px-2.5 py-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-black"
        aria-label="Toggle menu"
      >
        <FiMenu className="w-6 h-6" />
      </button>
      <div className="flex flex-col items-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">
          {subtitle}
        </p>
        <h1 className="text-base font-bold text-black">{title}</h1>
      </div>
      <button
        onClick={openNotificationsTab}
        className="relative rounded-xl border border-black/10 bg-white p-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-black"
        aria-label="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
            {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default MobileHeader;
