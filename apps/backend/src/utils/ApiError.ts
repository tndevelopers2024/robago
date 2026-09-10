// src/utils/ApiError.ts

/** Thrown anywhere in a controller/service; caught by the global error handler (middleware/errorHandler.ts). */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly fieldErrors?: Record<string, string>;

    constructor(statusCode: number, message: string, fieldErrors?: Record<string, string>) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.fieldErrors = fieldErrors;
        Error.captureStackTrace?.(this, ApiError);
    }

    static badRequest(message: string, fieldErrors?: Record<string, string>) {
        return new ApiError(400, message, fieldErrors);
    }
    static unauthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }
    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }
    static notFound(message = "Not found") {
        return new ApiError(404, message);
    }
    static conflict(message: string, fieldErrors?: Record<string, string>) {
        return new ApiError(409, message, fieldErrors);
    }
}
