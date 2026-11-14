"use client";

export const ORDER_PROCESSING_NOTE_STATUSES = [
  { value: "general", label: "General" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

export const ORDER_PROCESSING_NOTE_STATUS_COLORS = {
  general: "bg-slate-100 text-slate-700",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-cyan-100 text-cyan-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
};

export const getProcessingNoteStatusLabel = (status) => {
  const entry = ORDER_PROCESSING_NOTE_STATUSES.find(
    (item) => item.value === String(status || "").trim(),
  );
  return entry?.label || String(status || "general");
};

export const getProcessingNoteStatusColor = (status) =>
  ORDER_PROCESSING_NOTE_STATUS_COLORS[String(status || "")
    .trim()] || ORDER_PROCESSING_NOTE_STATUS_COLORS.general;

export const filterProcessingNotesByStatus = (notes, status) =>
  (Array.isArray(notes) ? notes : []).filter(
    (note) => note?.isActive !== false && note?.text?.trim(),
  );

export const getOrderStatusTemplates = (notes, orderStatus) => {
  const normalizedStatus = String(orderStatus || "")
    .trim()
    .toLowerCase();
  const list = filterProcessingNotesByStatus(notes);
  const direct =
    normalizedStatus === "general" || !normalizedStatus
      ? list.filter((note) => note.status === "general")
      : list.filter((note) => note.status === normalizedStatus);
  if (direct.length) return direct;
  return list.filter((note) => note.status === "general");
};

export const safeNoteText = (text) => String(text || "").trim();