export class AuthenticationError extends Error {
  status = 401;

  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends Error {
  status = 400;

  constructor(message = "The submitted data is invalid.") {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthorizationError extends Error {
  status = 403;

  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class ResourceNotFoundError extends Error {
  status = 404;

  constructor(message = "The requested resource was not found.") {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

export class ConflictError extends Error {
  status = 409;

  constructor(message = "The requested operation conflicts with current state.") {
    super(message);
    this.name = "ConflictError";
  }
}

export class ConfigurationError extends Error {
  status = 503;

  constructor(message = "A required service is not configured.") {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class ExternalServiceError extends Error {
  status = 502;

  constructor(message = "An external service request failed.") {
    super(message);
    this.name = "ExternalServiceError";
  }
}
