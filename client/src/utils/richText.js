export const cleanHtml = (value) => String(value || "");

export const normalizeRichTextValue = (value) => {
  const raw = String(value || "");
  if (!raw || raw.trim() === "" || raw === "<p><br></p>") return "";
  return raw;
};

export const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const hasHtmlContent = (value) => /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
