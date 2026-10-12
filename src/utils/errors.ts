import * as z from "zod";

export class HttpError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
        this.name = "HttpError";
    }
}

export class ValidationError extends Error {
    constructor(public issues: z.core.$ZodIssue[]) {
        super(`Validation failed: ${issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")}`);
        this.name = "ValidationError";
    }
}

export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NetworkError";
    }
}