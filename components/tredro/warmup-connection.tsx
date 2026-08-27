"use client";
import { useEffect, useState, useCallback } from "react";

export default function WarmupConnection() {
  const [results, setResults] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const addResult = (line: string) => {
    setResults((prev) => [...prev, line]);
  };

  const testServer = async (label: string, url: string) => {
    const start = Date.now();
    try {
      const res = await fetch(url);
      const duration = Date.now() - start;
      const text = await res.text();
      addResult(
        `${label}: ${duration}ms | status: ${res.status} | body: ${text.slice(
          0,
          100,
        )}`,
      );
    } catch (e: any) {
      const duration = Date.now() - start;
      addResult(
        `${label} FAILED after ${duration}ms | name: ${e?.name} | message: ${e?.message}`,
      );
    }
  };

  const runTests = useCallback(async () => {
    setRunning(true);
    setResults([]);

    await testServer(
      "jsonplaceholder",
      "https://jsonplaceholder.typicode.com/posts/1",
    );
    await testServer(
      "your-server (tredro)",
      `${process.env.NEXT_PUBLIC_BASE_URL}/health`,
    );
    await testServer(
      "kadnya-backend",
      "https://back-auth.kadnya-dev.com/health",
    );
    await testServer(
      "other-render-2",
      "https://my-json-server.typicode.com/typicode/demo/posts",
    );

    setRunning(false);
  }, []);

  useEffect(() => {
    runTests();
  }, [runTests]);

  return <></>;
}
