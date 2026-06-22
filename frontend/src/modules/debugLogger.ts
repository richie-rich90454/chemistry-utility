/**
 * Singleton class that provides configurable logging with log levels.
 * Respects the environment: debug and info messages are suppressed
 * in production mode.
 */
export class DebugLogger {
	private static instance: DebugLogger;
	private level: LogLevel;
	private isProduction: boolean;

	private constructor() {
		this.level = "info";
		this.isProduction = this.detectProduction();
		if (this.isProduction) {
			this.level = "warn";
		}
	}

	/** Returns the singleton instance of {@link DebugLogger}. */
	public static getInstance(): DebugLogger {
		if (!DebugLogger.instance) {
			DebugLogger.instance = new DebugLogger();
		}
		return DebugLogger.instance;
	}

	/**
	 * Sets the current log level. Messages below this level are
	 * suppressed. In production mode, the level cannot be set
	 * below "warn".
	 */
	public setLevel(level: LogLevel): void {
		if (this.isProduction && levelRank(level) < levelRank("warn")) {
			return;
		}
		this.level = level;
	}

	/** Logs a debug-level message. Suppressed in production. */
	public debug(message: string, context?: Record<string, unknown>): void {
		if (!this.shouldLog("debug")) {
			return;
		}
		console.debug(this.formatMessage("DEBUG", message), context ?? {});
	}

	/** Logs an info-level message. Suppressed in production. */
	public info(message: string, context?: Record<string, unknown>): void {
		if (!this.shouldLog("info")) {
			return;
		}
		console.info(this.formatMessage("INFO", message), context ?? {});
	}

	/** Logs a warning-level message. */
	public warn(message: string, context?: Record<string, unknown>): void {
		if (!this.shouldLog("warn")) {
			return;
		}
		console.warn(this.formatMessage("WARN", message), context ?? {});
	}

	/** Logs an error-level message. */
	public error(message: string, context?: Record<string, unknown>): void {
		if (!this.shouldLog("error")) {
			return;
		}
		console.error(this.formatMessage("ERROR", message), context ?? {});
	}

	/** Determines if a message at the given level should be logged. */
	private shouldLog(level: LogLevel): boolean {
		return levelRank(level) >= levelRank(this.level);
	}

	/** Formats a log message with a prefix. */
	private formatMessage(prefix: string, message: string): string {
		return "[" + prefix + "] " + message;
	}

	/** Detects whether the app is running in production mode. */
	private detectProduction(): boolean {
		if (typeof process !== "undefined" && process.env && process.env.NODE_ENV) {
			return process.env.NODE_ENV === "production";
		}
		return false;
	}
}

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

function levelRank(level: LogLevel): number {
	return LEVEL_RANK[level];
}
