import Link from "next/link";
import { CharacterSheet } from "@/features/characters";
import { CharacterSyncClient } from "@/features/characters/components/CharacterSyncClient";
import {
  getCharacterByIdFromDb,
  getCharacterRecordById,
} from "@/features/characters/server/character-store";

type CharacterDetailPageProps = {
  params: Promise<{
    characterId: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function CharacterDetailPage({
  params,
}: CharacterDetailPageProps) {
  const { characterId } = await params;
  const [character, record] = await Promise.all([
    getCharacterByIdFromDb(characterId),
    getCharacterRecordById(characterId),
  ]);

  if (!character || !record) {
    return (
      <main className="character-sheet-page">
        <section className="character-sheet-shell character-sheet-shell--missing">
          <p className="characters-kicker">Archivo de personajes</p>
          <h1>Personaje no encontrado</h1>
          <p className="characters-copy">
            La ficha que buscabas no existe en este registro actual.
          </p>
          <Link href="/characters" className="primary-link">
            Volver a la cripta de aventureros
          </Link>
        </section>
      </main>
    );
  }

  return (
    <CharacterSheet
      character={character}
      topContent={
        <CharacterSyncClient
          characterId={record.id}
          source={record.source}
          hasSyncableSource={record.source === "NIVEL20" && Boolean(record.sourceUrl)}
          sourceLabel={record.sourceLabel ?? (record.source === "NIVEL20" ? "Nivel20" : "Local")}
          importState={character.importDiagnostics?.state}
          missingFieldCount={character.importDiagnostics?.missingFields.length}
          lastSyncedAt={record.lastSyncedAt?.toISOString() ?? null}
          syncStatus={record.syncStatus}
          syncError={record.syncError}
        />
      }
    />
  );
}
