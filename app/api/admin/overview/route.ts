import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { getPlatformOverview } from "@/lib/platform-admin";
import { requireSuperAdmin } from "@/lib/security/rbac";

export async function GET() {
  try {
    const user = await requireApiUser();
    await requireSuperAdmin(user.id);
    const overview = await getPlatformOverview();

    return NextResponse.json({ overview });
  } catch (error) {
    return apiError(error);
  }
}
