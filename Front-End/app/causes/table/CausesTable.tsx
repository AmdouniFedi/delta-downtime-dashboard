'use client';

import { useEffect, useState } from 'react';

type Cause = {
    id: string;
    code: string;
    name: string;
    category: string;
    description: string | null;
    affectTRS: boolean;
};

type CausesApiResponse = {
    items: Cause[];
    total: number;
    page: number;
    limit: number;
};

export default function CausesTable() {
    const [data, setData] = useState<CausesApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const baseUrl = process.env.NEXT_PUBLIC_API_URL;
                if (!baseUrl) throw new Error('Missing NEXT_PUBLIC_API_URL in Front-End/.env.local');

                // IMPORTANT: no query params => ALL causes appear (affect_TRS 0 and 1)
                const res = await fetch(`${baseUrl}/causes`, { signal: controller.signal });

                if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

                const json = (await res.json()) as CausesApiResponse;
                setData(json);
            } catch (e: any) {
                if (e?.name !== 'AbortError') setError(e?.message ?? 'Unknown error');
            } finally {
                setLoading(false);
            }
        }

        load();
        return () => controller.abort();
    }, []);

    if (loading) return <div>Loading causes...</div>;

    if (error) {
        return (
            <div style={{ border: '1px solid #ccc', padding: 12 }}>
                <div style={{ marginBottom: 8 }}>Unable to load causes.</div>
                <div style={{ fontFamily: 'monospace' }}>{error}</div>
            </div>
        );
    }

    const items = data?.items ?? [];

    if (items.length === 0) return <div>No causes found.</div>;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={th}>Code</th>
                        <th style={th}>Name</th>
                        <th style={th}>Category</th>
                        <th style={th}>Affects TRS</th>
                        <th style={th}>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((c) => (
                        <tr key={c.id}>
                            <td style={td}>{c.code}</td>
                            <td style={td}>{c.name}</td>
                            <td style={td}>{c.category}</td>
                            <td style={td}>{c.affectTRS ? 'Yes' : 'No'}</td>
                            <td style={td}>{c.description ?? ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: 12, fontSize: 12 }}>
                Showing {items.length} / {data?.total ?? items.length}
            </div>
        </div>
    );
}

const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 8px',
    borderBottom: '1px solid #ddd',
    whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
    padding: '10px 8px',
    borderBottom: '1px solid #eee',
    whiteSpace: 'nowrap',
};
