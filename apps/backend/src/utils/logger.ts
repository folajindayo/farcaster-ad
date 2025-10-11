/**
 * Structured Logging System
 * Provides consistent, structured logging across the application
 * Can be easily replaced with Winston, Pino, or other logging libraries
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: any;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.minLevel = this.getMinLevel();
  }

  private getMinLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    switch (level) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.minLevel);
  }

  private formatMessage(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Human-readable format for development
      const { level, timestamp, message, context, error } = entry;
      let output = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      
      if (context && Object.keys(context).length > 0) {
        output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
      }
      
      if (error) {
        output += `\n  Error: ${error.stack || error.message || error}`;
      }
      
      return output;
    } else {
      // JSON format for production (easier to parse by log aggregators)
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(error && { error: this.serializeError(error) }),
    };

    const formatted = this.formatMessage(entry);

    // Output to appropriate stream
    if (level === LogLevel.ERROR) {
      console.error(formatted);
    } else if (level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  private serializeError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as any),
      };
    }
    return error;
  }

  /**
   * Log error message
   */
  error(message: string, error?: any, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Create child logger with default context
   */
  child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

/**
 * Child Logger with inherited context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  error(message: string, error?: any, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }
}

// Singleton instance
export const logger = new Logger();

// Export child logger creator
export function createLogger(context: LogContext): ChildLogger {
  return logger.child(context);
}

// Performance measurement utility
export class PerformanceLogger {
  private startTime: number;
  private logger: Logger | ChildLogger;
  private operation: string;
  private context: LogContext;

  constructor(operation: string, context?: LogContext, customLogger?: Logger | ChildLogger) {
    this.operation = operation;
    this.context = context || {};
    this.logger = customLogger || logger;
    this.startTime = Date.now();
    
    this.logger.debug(`Starting: ${operation}`, this.context);
  }

  end(additionalContext?: LogContext): void {
    const duration = Date.now() - this.startTime;
    const finalContext = {
      ...this.context,
      ...additionalContext,
      durationMs: duration,
    };

    if (duration > 1000) {
      this.logger.warn(`Slow operation: ${this.operation}`, finalContext);
    } else {
      this.logger.debug(`Completed: ${this.operation}`, finalContext);
    }
  }

  error(error: any, additionalContext?: LogContext): void {
    const duration = Date.now() - this.startTime;
    const finalContext = {
      ...this.context,
      ...additionalContext,
      durationMs: duration,
    };

    this.logger.error(`Failed: ${this.operation}`, error, finalContext);
  }
}

/**
 * Decorator for timing async functions
 */
export function timed(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const opName = operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const perf = new PerformanceLogger(opName);
      try {
        const result = await originalMethod.apply(this, args);
        perf.end();
        return result;
      } catch (error) {
        perf.error(error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * HTTP Request Logger Middleware
 */
export function requestLogger(req: any, res: any, next: any): void {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Attach request ID to request object
  req.requestId = requestId;
  
  // Log request start
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    logger[level]('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });

  next();
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default logger;



