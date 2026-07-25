import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  AuthenticationError,
  AuthorizationError,
  ConfigurationError,
  ConflictError,
  ExternalServiceError,
  ResourceNotFoundError,
  ValidationError,
} from "@/lib/security/errors";

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (
    error instanceof AuthenticationError ||
    error instanceof ValidationError ||
    error instanceof AuthorizationError ||
    error instanceof ConflictError ||
    error instanceof ConfigurationError ||
    error instanceof ExternalServiceError ||
    error instanceof ResourceNotFoundError
  ) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { error: "A record with that value already exists." },
      { status: 409 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: "An unexpected server error occurred." },
    { status: 500 },
  );
}
