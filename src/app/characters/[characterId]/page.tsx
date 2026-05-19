import Link from "next/link";
import {
  CharacterSheet,
  getMockCharacterById,
  mockCharacters,
} from "@/features/characters";

type CharacterDetailPageProps = {
  params: Promise<{
    characterId: string;
  }>;
};

export async function generateStaticParams() {
  return mockCharacters.map((character) => ({
    characterId: character.id,
  }));
}

export default async function CharacterDetailPage({
  params,
}: CharacterDetailPageProps) {
  const { characterId } = await params;
  const character = getMockCharacterById(characterId);

  if (!character) {
    return (
      <main className="character-sheet-page">
        <section className="character-sheet-shell character-sheet-shell--missing">
          <p className="characters-kicker">Archivo de personajes</p>
          <h1>Personaje no encontrado</h1>
          <p className="characters-copy">
            La ficha que buscabas no existe en este registro mock.
          </p>
          <Link href="/characters" className="primary-link">
            Volver a la cripta de aventureros
          </Link>
        </section>
      </main>
    );
  }

  return <CharacterSheet character={character} />;
}
