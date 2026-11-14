import React from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { normalizeRichTextValue } from "../utils/richText";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div style={{ minHeight: 180 }} className="flex items-center justify-center text-gray-400">Loading editor...</div>,
});

const modules = {
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

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "blockquote",
  "link",
];

const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "",
  className = "",
  minHeight = 180,
}) => (
  <div className={`app-richtext ${className}`.trim()}>
    <ReactQuill
      theme="snow"
      value={normalizeRichTextValue(value)}
      onChange={(nextValue) => onChange?.(normalizeRichTextValue(nextValue))}
      placeholder={placeholder}
      modules={modules}
      formats={formats}
      style={{ minHeight }}
    />
  </div>
);

export default RichTextEditor;
