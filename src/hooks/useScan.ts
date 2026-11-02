import { useState, useEffect } from "react";
import Request from "@/utils/request";

export default function useScan(path:string) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    

    return {loading, error};
}