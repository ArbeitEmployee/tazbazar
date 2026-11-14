"use client";

import React, { useMemo } from "react";
import { FiClipboard } from "react-icons/fi";
import { getOrderStatusTemplates } from "../../utils/orderProcessingNotes";

const ProcessingNotesQuickInsert = ({
  notes,
  status,
  onInsert,
  limit = 3,
}) => {
  const templates = useMemo(
    () => getOrderStatusTemplates(notes, status),
    [notes, status],
  );

  if (!templates.length) return null;

  const visible = templates.slice(0, limit);

  return (
    <div className="mt-2">
      <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        <FiClipboard className="h-3 w-3" /> Quick insert template
      </p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((template) => (
          <button
            key={template._id}
            type="button"
            onClick={() => onInsert(template.text)}
            title={`Insert: ${template.title || template.text}`}
            className="max-w-full truncate rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 transition hover:border-gray-400 hover:bg-white"
          >
            {template.title || template.text.slice(0, 40)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProcessingNotesQuickInsert;