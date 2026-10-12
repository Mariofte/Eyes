import { HttpError, NetworkError, ValidationError } from "@/utils/errors";
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
    let response: Response;
    try {
        response = await fetch(url, options);
    } catch(error) {
        throw new NetworkError(
            error instanceof Error ? error.message : "Network error occurred"
        );
    }

    if (!response.ok) {
        throw new HttpError(response.status, `HTTP ${response.status}`);
    }

    const data = await response.json();
    try {
        return schema.parse(data);
    } catch (e) {
        if (e instanceof z.ZodError) {
            throw new ValidationError(e.issues);
        }
        throw e;
    }
}

const Request = {
    get: async <T extends z.ZodType>(url: string, schema: T, options?: RequestInit): Promise<z.infer<T>> => 
        http(url, schema, { ...options, method: "GET" })
,
    post: async <T extends z.ZodType>(url: string, schema: T, body: unknown, options?: RequestInit): Promise<z.infer<T>> =>
        http(url, schema, { ...options, method: "POST", body: JSON.stringify(body) }),

    put: async <T extends z.ZodType>(url: string, schema: T, body: unknown, options?: RequestInit): Promise<z.infer<T>> =>
        http(url, schema, { ...options, method: "PUT", body: JSON.stringify(body) }),

    delete: async <T extends z.ZodType>(url: string, schema: T, options?: RequestInit): Promise<z.infer<T>> =>
        http(url, schema, { ...options, method: "DELETE" })
};

export default Request;