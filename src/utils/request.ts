import { error, debug, warn } from "@tauri-apps/plugin-log";
import { HttpError, NetworkError, ValidationError } from "../utils/errors/errors_api";
import { fetch } from "@tauri-apps/plugin-http";
import { z } from "zod";

/**
 * Sends an HTTP request and parses the response using Zod schema.
 * @param url The URL to send the request to.
 * @param schema The Zod schema to parse the response with.
 * @param options The request options.
 * @returns A promise resolving to the parsed response data.
 */
async function http<T extends z.ZodType>(
    url: string,
    schema: T,
    options?: RequestInit,
): Promise<z.infer<T>> {
    const method = options?.method ?? "GET";
    let response: Response;
    response = await fetch(url, options)
        .then(async (res) => {
            await debug(`${method} ${url} - respuesta ${res.status}`);
            return res;
        })
        .catch(async (err) => {
            const message = err instanceof Error ? err.message : "Network error occurred";
            await error(`${method} ${url} - error de red: ${message}`);
            throw new NetworkError(message);
        });

    if (!response.ok) {
        warn(`${method} ${url} - error HTTP: ${response.status}`);
        throw new HttpError(response.status, `HTTP ${response.status}`);
    }

    const data = await response.json();
    try {
        return schema.parse(data);
    } catch (e) {
        if (e instanceof z.ZodError) {
            error(`${method} ${url} - error de validación: ${JSON.stringify(e.issues)}`);
            throw new ValidationError(e.issues);
        }
        throw e;
    }
}

const Request = {
    get: async <T extends z.ZodType>(url: string, schema: T, options?: RequestInit): Promise<z.infer<T>> =>
        http(url, schema, { ...options, method: "GET" }),

    post: async <T extends z.ZodType>(url: string, schema: T, body: unknown, options?: RequestInit): Promise<z.infer<T>> =>
        http(url, schema, { ...options, method: "POST", body: JSON.stringify(body) }),

    put: async <T extends z.ZodType>(url: string, schema: T, body: unknown, options?: RequestInit): Promise<z.infer<T>> =>
        http(url, schema, { ...options, method: "PUT", body: JSON.stringify(body) }),

    delete: async <T extends z.ZodType>(url: string, schema: T, options?: RequestInit): Promise<z.infer<T>> =>
        http(url, schema, { ...options, method: "DELETE" })
};

export default Request;

