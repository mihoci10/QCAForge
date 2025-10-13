export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";
export const LOG_LEVELS: LogLevel[] = ["ERROR", "WARN", "INFO", "DEBUG", "TRACE"];

export interface LogEntry {
    level: LogLevel;
    timestamp: Date;
    target: string;
    message: string;
    file?: string;
    line?: number;
}

export function getPrettyLogLevel(level: LogLevel): string {
    switch (level) {
        case "TRACE":
            return "Trace";
        case "DEBUG":
            return "Debug";
        case "INFO":
            return "Info";
        case "WARN":
            return "Warning";
        case "ERROR":
            return "Error";
    }
}

export function deserializeLogEntry(data: any): LogEntry {
    return {
        level: data.level as LogLevel,
        timestamp: new Date(data.timestamp),
        target: data.target,
        message: data.message,
        file: data.file,
        line: data.line,
    };
}

