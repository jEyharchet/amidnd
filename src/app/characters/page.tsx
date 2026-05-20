import Link from "next/link";
import { CharacterList, mockCharacters } from "@/features/characters";

export const metadata = {
  title: "Personajes | Amidnd",
};

export default function CharactersPage() {
  return (
    <main className="characters-page">
      <section className="characters-shell" aria-label="Registro de personajes">
        <div className="characters-hero">
          <div>
            <p className="characters-kicker">Amidnd · Personajes</p>
            <h1>Cripta de aventureros</h1>
            <p className="characters-copy">
              Primer modulo del dominio de personajes. La estructura queda lista para
              carga manual, reglas futuras e importadores sin acoplar la UI a una
              base de datos todavia.
            </p>
          </div>

          <button type="button" className="characters-action" disabled>
            Nuevo personaje
          </button>
        </div>

        <div className="characters-toolbar">
          <div>
            <span className="characters-toolbar__label">Activos</span>
            <strong>{mockCharacters.length} personajes</strong>
          </div>
          <div className="characters-toolbar__actions">
            <p className="characters-toolbar__hint">
              Mock inicial para destrabar CRUD, importadores y reglas por steps.
            </p>
            <Link href="/characters/import/nivel20" className="characters-toolbar__link">
              Importar desde Nivel20
            </Link>
          </div>
        </div>

        <CharacterList characters={mockCharacters} />
      </section>
    </main>
  );
}
