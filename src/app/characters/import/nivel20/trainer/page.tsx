import Link from "next/link";
import { Nivel20Trainer } from "@/features/characters/importers/nivel20/Nivel20Trainer";

export const metadata = {
  title: "Trainer Nivel20 | Amidnd",
};

export default function Nivel20TrainerPage() {
  return (
    <main className="characters-page">
      <section className="characters-shell" aria-label="Trainer experimental de Nivel20">
        <Link href="/characters/import/nivel20" className="sheet-back-link">
          Volver a la importacion experimental
        </Link>

        <div className="characters-hero">
          <div>
            <p className="characters-kicker">Mapeo asistido</p>
            <h1>Trainer de Nivel20</h1>
            <p className="characters-copy">
              Inspecciona HTML y texto, asigna candidatos a campos amidnd
              y crea atributos personalizados cuando la ficha necesite otro
              lugar donde respirar.
            </p>
          </div>
        </div>

        <Nivel20Trainer />
      </section>
    </main>
  );
}
