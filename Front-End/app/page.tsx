import CausesTable from './causes/table/CausesTable';

export default function CausesPage() {
    return (
        <main style={{ padding: 24 }}>
            <h1 style={{ marginBottom: 16 }}>Causes</h1>
            <CausesTable />
        </main>
    );
}
