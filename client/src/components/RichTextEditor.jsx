import React, { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { normalizeRichTextValue } from "../utils/richText";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: 180 }} className="flex items-center justify-center text-gray-400">
      Loading editor...
    </div>
  ),
});

const defaultModules = {
  toolbar: [
    [{ header: [false, 2, 3] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link"],
  ],
  clipboard: {
    matchVisual: false,
  },
};

const defaultFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "blockquote",
  "link",
];

const RichTextEditor = memo(({
  value = "",
  onChange,
  placeholder = "",
  className = "",
  minHeight = 180,
}) => {
  const normalizedValue = useMemo(() => normalizeRichTextValue(value), [value]);

  return (
    <div className={`app-richtext ${className}`.trim()}>
      <ReactQuill
        theme="snow"
        value={normalizedValue}
        onChange={(nextValue) => {
          const norm = normalizeRichTextValue(nextValue);
          if (norm !== normalizedValue) {
            onChange?.(norm);
          }
        }}
        placeholder={placeholder}
        modules={defaultModules}
        formats={defaultFormats}
        style={{ minHeight }}
      />
    </div>
  );
});

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
