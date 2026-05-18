import { checkDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const database = await checkDatabase();

  return (
    <main className="page-shell">
      <section className="scroll" aria-label="Pergamino antiguo">
        <p className="eyebrow">Amidnd</p>
        <h1>Hola mundo</h1>
        <p className="intro">Un primer mensaje escrito sobre un viejo pergamino.</p>

        <div className={`db-status ${database.ok ? "is-ready" : "is-pending"}`}>
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>{database.label}</strong>
            <p>{database.message}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
