import Link from "next/link";
import { checkDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const database = await checkDatabase();

  return (
    <main className="page-shell">
      <section className="scroll" aria-label="Pergamino antiguo">
        <p className="eyebrow">Amidnd</p>
        <h1>Archivo de campaña</h1>
        <p className="intro">
          Un refugio de pergaminos para preparar personajes, reglas futuras y
          registros de aventuras.
        </p>

        <div className="home-actions">
          <Link href="/characters" className="primary-link">
            Entrar al archivo de personajes
          </Link>
        </div>

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
