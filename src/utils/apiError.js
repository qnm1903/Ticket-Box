'use strict';

class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        
        // Đánh dấu lỗi này là lỗi hoạt động đã biết
        this.isOperational = true;

        // Ghi lại stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

export {
    ApiError
};