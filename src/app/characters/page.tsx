import Link from "next/link";
import { CharacterList } from "@/features/characters";
import { listCharactersFromDb } from "@/features/characters/server/character-store";

export const metadata = {
  title: "Personajes | Amidnd",
};

export const dynamic = "force-dynamic";

export default async function CharactersPage() {
  const characters = await listCharactersFromDb();

  return (
    <main className="characters-page">
      <section className="characters-shell" aria-label="Registro de personajes">
        <div className="characters-hero">
          <div>
            <p className="characters-kicker">Amidnd · Personajes</p>
            <h1>Cripta de aventureros</h1>
            <p className="characters-copy">
              Personajes persistidos en Neon, con origen local o enlace a Nivel20
              para sincronizacion posterior.
            </p>
          </div>

          <Link href="/characters/new" className="primary-link">
            Nuevo personaje
          </Link>
        </div>

        <div className="characters-toolbar">
          <div>
            <span className="characters-toolbar__label">Activos</span>
            <strong>{characters.length} personajes</strong>
          </div>
          <div className="characters-toolbar__actions">
            <p className="characters-toolbar__hint">
              Los personajes Nivel20 guardan su URL y se sincronizan desde la ficha.
            </p>
            <Link href="/characters/import/nivel20" className="characters-toolbar__link">
              Importar desde Nivel20
            </Link>
          </div>
        </div>

        {characters.length ? (
          <CharacterList characters={characters} />
        ) : (
          <section className="characters-empty-state">
            <p className="characters-kicker">Sin fichas guardadas</p>
            <h2>La cripta todavia esta vacia</h2>
            <p>
              Crea tu primer personaje local o enlaza una ficha de Nivel20 para empezar
              a poblar el archivo.
            </p>
            <div className="home-actions">
              <Link href="/characters/new" className="primary-link">
                Crear el primer personaje
              </Link>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
