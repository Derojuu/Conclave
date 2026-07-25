"use client";

import { useContext } from "react";

import { ClientAuthContext } from "@/components/auth/client-auth-provider";

export function useAuth() {
  const context = useContext(ClientAuthContext);

  if (!context) {
    throw new Error("useAuth must be used within ClientAuthProvider.");
  }

  return context;
}
