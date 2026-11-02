import Request from "../utils/request";
import { z } from "zod";
import config from "../config";

const prefix = "scraping"

const CheckUrlSchema = z.object({
    url: z.string(),
    status_code: z.int(),
    is_reachable: z.boolean(),
    response_time_ms: z.number(),
});

const FetchSchema = z.object({
    url: z.string(),
    content: z.string(),
    status_code: z.number(),
    response_time_ms: z.number(),
});

const ExtractSchema = z.object({
    source: z.string(),
    data: z.object({
        title: z.string(),
        description: z.string(),
        meta: z.record(z.string(), z.string()),
    }),
});

const BatchSchema = z.object({
    urls_processed: z.number(),
    results: z.array(
        z.object({
            url: z.string(),
            status: z.number(),
            ok: z.boolean(),
        })
    ),
});

export const Scraping = {
    checkUrl: () =>
        Request.get(`${config.baseAPI}/${prefix}/check-url`, CheckUrlSchema),

    fetch: () =>
        Request.get(`${config.baseAPI}/${prefix}/fetch`, FetchSchema),

    extract: () =>
        Request.get(`${config.baseAPI}/${prefix}/extract`, ExtractSchema),

    batch: () =>
        Request.get(`${config.baseAPI}/${prefix}/batch`, BatchSchema),
};