import Link from "next/link";
import { CharacterCombatPanel } from "@/features/characters/components/CharacterCombatPanel";
import { CharacterHeader } from "@/features/characters/components/CharacterHeader";
import { CharacterNotesPanel } from "@/features/characters/components/CharacterNotesPanel";
import { CharacterResourcesPanel } from "@/features/characters/components/CharacterResourcesPanel";
import { CharacterSkillsPanel } from "@/features/characters/components/CharacterSkillsPanel";
import { CharacterStatsPanel } from "@/features/characters/components/CharacterStatsPanel";
import type { Character } from "@/features/characters/types";

type CharacterSheetProps = {
  character: Character;
};

export function CharacterSheet({ character }: CharacterSheetProps) {
  return (
    <main className="character-sheet-page">
      <section className="character-sheet-shell" aria-label={`Ficha de ${character.name}`}>
        <Link href="/characters" className="sheet-back-link">
          Volver a la cripta de aventureros
        </Link>

        <CharacterHeader character={character} />

        <div className="sheet-layout">
          <CharacterStatsPanel character={character} />
          <CharacterCombatPanel character={character} />
          <CharacterSkillsPanel character={character} />
          <CharacterResourcesPanel character={character} />
          <CharacterNotesPanel character={character} />
        </div>
      </section>
    </main>
  );
}
