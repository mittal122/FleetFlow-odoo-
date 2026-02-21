export function successResponse(data: any, message: string = 'Success', statusCode: number = 200) {
    return {
        success: true,
        data,
        message,
        statusCode,
    };
}

export function errorResponse(message: string, statusCode: number = 500) {
    return {
        success: false,
        error: message,
        statusCode,
    };
}

export function validationErrorResponse(message: string) {
    return {
        success: false,
        error: message,
        statusCode: 422,
    };
}

export function forbiddenResponse() {
    return {
        success: false,
        error: 'Forbidden: Insufficient permissions',
        statusCode: 403,
    };
}

export function notFoundResponse(message: string = 'Resource not found') {
    return {
        success: false,
        error: message,
        statusCode: 404,
    };
}
