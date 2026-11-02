import { useState } from "react";
import useScraping from "../hooks/useScraping";

export default function Scraping() {
    const {
        handleCheckUrl,
        loading,
        error,
    } = useScraping();

    const [result, setResult] = useState<unknown>(null);

    const handleClick = () => {
        handleCheckUrl()
            .then((data) => setResult(data))
            .catch(() => {
                setResult(null);
            });
    };

    return (
        <div>
            <h1>Scraping</h1>

            <button onClick={handleClick} disabled={loading}>
                {loading ? "Consultando..." : "Comprobar URL"}
            </button>

            {error && <p>Error: {error.message}</p>}

            {result !== null && (
                <pre>{JSON.stringify(result, null, 2)}</pre>
            )}
        </div>
    );
}