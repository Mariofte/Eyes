import * as z from "zod";
import { Failure } from "../failure";

export class HttpError extends Failure {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
        this.name = "HttpError";
    }
}

export class ValidationError extends Failure {
    constructor(public issues: z.core.$ZodIssue[]) {
        super(`Validation failed: ${issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")}`);
        this.name = "ValidationError";
    }
}

export class NetworkError extends Failure {
    constructor(message: string) {
        super(message);
        this.name = "NetworkError";
    }
}