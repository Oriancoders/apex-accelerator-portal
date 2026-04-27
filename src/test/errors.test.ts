import { describe, expect, it } from "vitest";

import { getUserFacingError } from "../lib/errors";

describe("getUserFacingError", () => {
  it("explains a missing Supabase RPC", () => {
    expect(
      getUserFacingError(
        { message: "PGRST202: Could not find the function public.deduct_credits" },
        "Unable to process request"
      )
    ).toBe(
      "The credit approval RPC is unavailable in the connected Supabase project. Please sync the database migrations and try again."
    );
  });

  it("still hides internal SQL errors behind the fallback message", () => {
    expect(
      getUserFacingError(
        { message: "SQLSTATE 23505 duplicate key value violates unique constraint" },
        "Unable to process request"
      )
    ).toBe("Unable to process request");
  });
});