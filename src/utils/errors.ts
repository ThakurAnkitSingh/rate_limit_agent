export class BaseError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ProxyError extends BaseError {
  constructor(message: string, originalError?: Error) {
    super(message, 502, originalError);
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string, originalError?: Error) {
    super(message, 429, originalError);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, 404);
  }
}
