import { type NextRequest, NextResponse } from "next/server";

import { syncAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

function safeDestination(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const destination = safeDestination(requestUrl.searchParams.get("next"));
  const authEntry =
    requestUrl.searchParams.get("entry") === "sign-up"
      ? "/auth/signup"
      : "/auth/login";

  if (!code) {
    return NextResponse.redirect(
      new URL(`${authEntry}?error=missing_code`, request.url),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`${authEntry}?error=oauth_callback`, request.url),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL(`${authEntry}?error=session_missing`, request.url),
    );
  }

  let profile;

  try {
    profile = await syncAuthenticatedUser(user);
  } catch {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(`${authEntry}?error=profile_sync`, request.url),
    );
  }

  try {
    await prisma.auditLog.create({
      data: {
        actorId: profile.id,
        action: "SIGN_IN",
        entityType: "User",
        entityId: profile.id,
        metadata: { provider: "google" },
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          null,
        userAgent: request.headers.get("user-agent"),
      },
    });
  } catch (error) {
    console.error("Unable to record sign-in audit event.", error);
  }

  return NextResponse.redirect(new URL(destination, request.url));
}
