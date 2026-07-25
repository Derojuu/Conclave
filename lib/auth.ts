import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { normalizeEmail } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { AuthenticationError } from "@/lib/security/errors";
import { createClient } from "@/lib/supabase/server";

function getPlatformRole(email: string) {
  const administrators = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter(Boolean);

  return administrators.includes(normalizeEmail(email))
    ? ("SUPER_ADMIN" as const)
    : ("USER" as const);
}

function getDisplayName(user: SupabaseUser) {
  const metadata = user.user_metadata;
  const name =
    metadata.full_name ??
    metadata.name ??
    metadata.user_name ??
    user.email?.split("@")[0];

  return typeof name === "string" && name.trim()
    ? name.trim().slice(0, 120)
    : "Conclave User";
}

function getAvatar(user: SupabaseUser) {
  const avatar = user.user_metadata.avatar_url ?? user.user_metadata.picture;
  return typeof avatar === "string" && avatar ? avatar : null;
}

export async function syncAuthenticatedUser(user: SupabaseUser) {
  if (!user.email) {
    throw new AuthenticationError(
      "The authenticated Google account did not provide an email address.",
    );
  }

  const email = normalizeEmail(user.email);
  const platformRole = getPlatformRole(email);
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    include: { settings: true },
  });

  if (!existing) {
    return prisma.user.create({
      data: {
        id: user.id,
        fullName: getDisplayName(user),
        email,
        avatar: getAvatar(user),
        platformRole,
        settings: { create: {} },
      },
    });
  }

  const nextAvatar = existing.avatar ?? getAvatar(user);
  const profileChanged =
    existing.email !== email ||
    existing.avatar !== nextAvatar ||
    existing.platformRole !== platformRole;

  if (profileChanged || !existing.settings) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        ...(profileChanged
          ? {
              email,
              avatar: nextAvatar,
              platformRole,
            }
          : {}),
        settings: {
          upsert: {
            create: {},
            update: {},
          },
        },
      },
    });
  }

  return existing;
}

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return syncAuthenticatedUser(user);
}

export async function requireAuthenticatedUser(options?: {
  next?: string;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    const next = options?.next
      ? `?next=${encodeURIComponent(options.next)}`
      : "";
    redirect(`/auth/login${next}`);
  }

  return user;
}

export async function requireApiUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new AuthenticationError();
  }

  return user;
}
