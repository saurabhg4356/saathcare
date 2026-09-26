/**
 * Custom application operational error class hierarchy with HTTP status code support
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 500)
   * @param {string} message - Descriptive error message
   * @param {string} [code="APPLICATION_ERROR"] - Error code identifier
   * @param {any} [details=null] - Detailed error info (e.g. Zod validation errors)
   */
  constructor(statusCode, message, code = 'APPLICATION_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new BadRequestError(message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new UnauthorizedError(message);
  }

  static forbidden(message = 'Access denied to this resource') {
    return new ForbiddenError(message);
  }

  static notFound(message = 'Resource not found') {
    return new NotFoundError(message);
  }

  static conflict(message = 'Resource already exists') {
    return new ConflictError(message);
  }

  static unprocessable(message, details = null) {
    return new ValidationError(message, details);
  }

  static internal(message = 'Internal server error') {
    return new InternalServerError(message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', details = null) {
    super(404, message, 'NOT_FOUND', details);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details = null) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required', details = null) {
    super(401, message, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Access denied to this resource', details = null) {
    super(403, message, 'FORBIDDEN', details);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict or duplicate entry', details = null) {
    super(409, message, 'CONFLICT', details);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details = null) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', details = null) {
    super(500, message, 'INTERNAL_SERVER_ERROR', details);
  }
}
