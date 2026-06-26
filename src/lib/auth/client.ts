import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "./server";

/**
 * Auth client cho component phía client. `import type` đảm bảo không kéo
 * code server (Pool, env) vào bundle. inferAdditionalFields suy ra type shopId.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
});
