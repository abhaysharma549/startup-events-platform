/**
 * Simple logging utilities for request/response tracking
 */

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const getStatusColor = (status) => {
    if (status >= 500) return colors.red;
    if (status >= 400) return colors.yellow;
    if (status >= 300) return colors.cyan;
    if (status >= 200) return colors.green;
    return colors.blue;
};

const getMethodColor = (method) => {
    switch (method) {
        case 'GET': return colors.blue;
        case 'POST': return colors.green;
        case 'PUT': return colors.cyan;
        case 'DELETE': return colors.red;
        case 'PATCH': return colors.yellow;
        default: return colors.reset;
    }
};

const log = (message, level = 'info') => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
};

const logRequest = (req, res) => {
    const startTime = Date.now();
    const methodColor = getMethodColor(req.method);
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusColor = getStatusColor(res.statusCode);
        const userId = req.user?.id || 'anonymous';
        
        const logMessage = 
            `${methodColor}${req.method}${colors.reset} ` +
            `${req.originalUrl} ` +
            `${statusColor}${res.statusCode}${colors.reset} ` +
            `${duration}ms ` +
            `(${userId})`;
        
        log(logMessage, 'http');
    });
};

const logError = (error, context = '') => {
    const message = context 
        ? `${context}: ${error.message}`
        : error.message;
    log(`${colors.red}ERROR: ${message}${colors.reset}`, 'error');
    if (error.stack) {
        log(error.stack, 'error');
    }
};

const logSuccess = (message, data = null) => {
    const msg = data ? `${message} - ${JSON.stringify(data)}` : message;
    log(`${colors.green}SUCCESS: ${msg}${colors.reset}`, 'info');
};

const logWarning = (message) => {
    log(`${colors.yellow}WARNING: ${message}${colors.reset}`, 'warn');
};

const requestLoggingMiddleware = (req, res, next) => {
    logRequest(req, res);
    next();
};

module.exports = {
    log,
    logRequest,
    logError,
    logSuccess,
    logWarning,
    requestLoggingMiddleware
};
