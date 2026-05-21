/**
 * Vitest setup — stub Next.js's `server-only` package so unit tests can
 * import server-side modules without a Next runtime.
 */
import { vi } from "vitest";

vi.mock("server-only", () => ({}));
