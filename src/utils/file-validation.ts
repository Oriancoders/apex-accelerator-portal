/**
 * Shared file validation constants and helpers.
 */
import { toast } from "sonner";

export const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validate a list of files and return only the valid ones.
 * Shows toast errors for invalid files.
 */
export function validateFiles(files: File[]): File[] {
  return files.filter((f) => {
    if (!ALLOWED_FILE_TYPES.includes(f.type)) {
      toast.error(`File "${f.name}" has an unsupported type.`);
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error(`File "${f.name}" exceeds the 10MB limit.`);
      return false;
    }
    return true;
  });
}
