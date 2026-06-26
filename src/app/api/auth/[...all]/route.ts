import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/server";

// Catch-all handler cho mọi endpoint Better Auth (/api/auth/*).
export const { POST, GET } = toNextJsHandler(auth);
