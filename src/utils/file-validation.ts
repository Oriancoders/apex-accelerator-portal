/**
 * Shared file validation constants and helpers.
 */
import { toast } from "sonner";

export const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_NAME_LENGTH = 180;
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

function hasAllowedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

function hasUnsafeFileNameChar(fileName: string) {
  return [...fileName].some((char) => {
    const code = char.charCodeAt(0);
    return code === 0 || '<>:"\\|?*'.includes(char);
  });
}

/**
 * Validate a list of files and return only the valid ones.
 * Shows toast errors for invalid files.
 */
export function validateFiles(files: File[]): File[] {
  const valid: File[] = [];

  for (const f of files) {
    if (!f.name || f.name.length > MAX_FILE_NAME_LENGTH || hasUnsafeFileNameChar(f.name)) {
      toast.error(`File "${f.name || "unnamed"}" has an unsafe file name.`);
      continue;
    }
    if (!hasAllowedExtension(f.name)) {
      toast.error(`File "${f.name}" must use PDF, JPG, JPEG, or PNG extension.`);
      continue;
    }
    if (!ALLOWED_FILE_TYPES.includes(f.type)) {
      toast.error(`File "${f.name}" is not allowed. Use PDF, JPG, or PNG only.`);
      continue;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error(`File "${f.name}" exceeds the 10MB limit.`);
      continue;
    }
    valid.push(f);
  }

  if (files.length > 0 && valid.length === 0) {
    toast.error("No valid files selected. Allowed: PDF, JPG, PNG up to 10MB.");
  }

  return valid;
}
