import { z } from "zod";

const PHONE_CHARS = /^[+()\-\s.\d]{7,30}$/;

function stripControlChars(value: string) {
  return [...value].filter((char) => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join("");
}

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .refine((value) => value === "" || emailSchema.safeParse(value).success, "Invalid email");

export const safeTextSchema = (max: number, min = 0) =>
  z
    .string()
    .transform((value) => stripControlChars(value).replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min).max(max));

export const safeMultilineTextSchema = (max: number, min = 0) =>
  z
    .string()
    .transform((value) => stripControlChars(value).replace(/\r\n/g, "\n").trim())
    .pipe(z.string().min(min).max(max));

export const phoneSchema = z
  .string()
  .transform((value) => stripControlChars(value).trim())
  .refine((value) => value === "" || PHONE_CHARS.test(value), "Invalid phone number");

export const urlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Invalid URL");

export const boundedNumberSchema = (min: number, max: number) =>
  z.coerce.number().finite().min(min).max(max);

export const integerIndexSchema = (maxExclusive: number) =>
  z.coerce.number().int().min(0).max(Math.max(0, maxExclusive - 1));

export function parseOrError<T>(schema: z.ZodType<T>, value: unknown, fallback = "Invalid input") {
  const parsed = schema.safeParse(value);
  if (parsed.success) return { ok: true as const, data: parsed.data };
  return { ok: false as const, error: parsed.error.issues[0]?.message || fallback };
}
