export const dashboardFormSurfaceClass =
  "dashboard-form-surface rounded-md border border-slate-200 bg-white p-4 shadow-sm md:p-5";

export const dashboardFormSectionClass =
  "rounded-md border border-slate-200 bg-slate-50 p-4 shadow-sm md:p-5";

export const dashboardFieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white focus:outline-none";

export const dashboardLabelClass =
  "dashboard-form-label mb-1.5 block text-xs font-semibold uppercase text-slate-600";

export const dashboardInlineToggleClass = (active = false) =>
  `inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-bold uppercase transition ${
    active
      ? "!border-[var(--brand-theme-color)] !bg-[var(--brand-theme-color)] !text-[var(--brand-button-text-color)] shadow-sm"
      : "border-slate-300 bg-white text-slate-700 hover:!border-[var(--brand-theme-color)] hover:!text-[var(--brand-theme-color)]"
  }`;

export const dashboardPrimaryButtonClass =
  "inline-flex items-center justify-center rounded-md bg-[var(--brand-theme-color)] px-5 py-2 text-sm font-bold text-[var(--brand-button-text-color)] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

export const dashboardSecondaryButtonClass =
  "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-black";
