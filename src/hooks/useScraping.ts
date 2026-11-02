import { useState, useCallback } from "react";
import { Scraping } from "../service/scraping";

export default function useScraping() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback((request: () => Promise<unknown>) => {
        setLoading(true);
        setError(null);

        return request()
            .catch((err: unknown) => {
                const requestError =
                    err instanceof Error
                        ? err
                        : new Error("Error desconocido");

                setError(requestError);
                throw requestError;
            })
            .finally(() => setLoading(false));
    }, []);

    const handleCheckUrl = useCallback(
        () => execute(() => Scraping.checkUrl()),
        [execute]
    );

    const handleFetch = useCallback(
        () => execute(() => Scraping.fetch()),
        [execute]
    );

    const handleExtract = useCallback(
        () => execute(() => Scraping.extract()),
        [execute]
    );

    const handleBatch = useCallback(
        () => execute(() => Scraping.batch()),
        [execute]
    );

    return {
        handleCheckUrl,
        handleFetch,
        handleExtract,
        handleBatch,
        loading,
        error,
    };
}