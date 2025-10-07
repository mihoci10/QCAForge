export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
    level: LogLevel;
    timestamp: Date;
    target: string;
    message: string;
    file?: string;
    line?: number;
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

