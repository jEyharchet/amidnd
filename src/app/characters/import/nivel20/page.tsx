import Link from "next/link";
import { Nivel20ImportForm } from "@/features/characters/importers/nivel20/Nivel20ImportForm";

export const metadata = {
  title: "Importar desde Nivel20 | Amidnd",
};

export default function Nivel20ImportPage() {
  return (
    <main className="characters-page">
      <section className="characters-shell" aria-label="Importacion experimental desde Nivel20">
        <Link href="/characters" className="sheet-back-link">
          Volver a la cripta de aventureros
        </Link>

        <div className="characters-hero">
          <div>
            <p className="characters-kicker">Importacion experimental</p>
            <h1>Importar desde Nivel20</h1>
            <p className="characters-copy">
              Esta pantalla prueba si una URL parece apta para una futura importacion
              tecnica, sin pedir credenciales ni guardar informacion sensible.
            </p>
          </div>
        </div>

        <Nivel20ImportForm />
      </section>
    </main>
  );
}
