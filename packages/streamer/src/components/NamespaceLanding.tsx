import { useState, useEffect } from 'react';

const POLL_INTERVAL_MS = 2000;

export function NamespaceLanding() {
  const [namespaces, setNamespaces] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch('/api/namespaces');
        if (!cancelled && res.ok) {
          const data: string[] = await res.json();
          setNamespaces(data);
        }
      } catch {
        // Ignore fetch errors; keep showing the last known state
      }
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0d1117] text-white">
      <h1 className="text-3xl font-bold mb-2">
        <span className="text-blue-400">No</span>Console
      </h1>
      <p className="text-gray-400 mb-8 text-sm">
        Connect a logger client to get a unique stream URL
      </p>

      {namespaces.length === 0 ? (
        <div className="flex items-center gap-3 text-gray-500">
          <span className="animate-spin text-xl">⟳</span>
          <span>Waiting for logger connections…</span>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <p className="text-gray-400 text-sm mb-3">Active streams:</p>
          <ul className="space-y-2">
            {namespaces.map((ns) => (
              <li key={ns}>
                <a
                  href={`/${ns}`}
                  className="block w-full px-4 py-3 bg-[#161b22] border border-gray-700 rounded-md
                             font-mono text-sm text-blue-400 hover:border-blue-500 hover:bg-[#1c2230]
                             transition-colors truncate"
                >
                  {ns}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
