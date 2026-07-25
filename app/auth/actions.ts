"use server";

import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();

  try {
    const [user, metadata] = await Promise.all([
      getAuthenticatedUser(),
      getRequestMetadata(),
    ]);

    if (user) {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "SIGN_OUT",
          entityType: "User",
          entityId: user.id,
          ...metadata,
        },
      });
    }
  } catch (error) {
    console.error("Unable to record sign-out audit event.", error);
  }

  await supabase.auth.signOut();
  redirect("/");
}
