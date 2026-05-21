import Link from "next/link";
import { CharacterCombatPanel } from "@/features/characters/components/CharacterCombatPanel";
import { CharacterAttacksPanel } from "@/features/characters/components/CharacterAttacksPanel";
import { CharacterBackgroundPanel } from "@/features/characters/components/CharacterBackgroundPanel";
import { CharacterCompanionsPanel } from "@/features/characters/components/CharacterCompanionsPanel";
import { CharacterHeader } from "@/features/characters/components/CharacterHeader";
import { CharacterImportDiagnosticsPanel } from "@/features/characters/components/CharacterImportDiagnosticsPanel";
import { CharacterNotesPanel } from "@/features/characters/components/CharacterNotesPanel";
import { CharacterEquipmentPanel } from "@/features/characters/components/CharacterEquipmentPanel";
import { CharacterProficienciesPanel } from "@/features/characters/components/CharacterProficienciesPanel";
import { CharacterQuickActionsPanel } from "@/features/characters/components/CharacterQuickActionsPanel";
import { CharacterResourcesPanel } from "@/features/characters/components/CharacterResourcesPanel";
import { CharacterSkillsPanel } from "@/features/characters/components/CharacterSkillsPanel";
import { CharacterSpellsPanel } from "@/features/characters/components/CharacterSpellsPanel";
import { CharacterStatsPanel } from "@/features/characters/components/CharacterStatsPanel";
import { CharacterTraitsPanel } from "@/features/characters/components/CharacterTraitsPanel";
import type { Character } from "@/features/characters/types";
import type { ReactNode } from "react";

type CharacterSheetProps = {
  character: Character;
  topContent?: ReactNode;
};

export function CharacterSheet({ character, topContent }: CharacterSheetProps) {
  return (
    <main className="character-sheet-page">
      <section className="character-sheet-shell" aria-label={`Ficha de ${character.name}`}>
        <Link href="/characters" className="sheet-back-link">
          Volver a la cripta de aventureros
        </Link>

        <CharacterHeader character={character} />

        {topContent ? <div className="sheet-top-content">{topContent}</div> : null}

        <div className="sheet-layout">
          <CharacterStatsPanel character={character} />
          <CharacterCombatPanel character={character} />
          <CharacterSkillsPanel character={character} />
          <CharacterProficienciesPanel character={character} />
          <CharacterBackgroundPanel character={character} />
          <CharacterAttacksPanel character={character} />
          <CharacterTraitsPanel character={character} />
          <CharacterEquipmentPanel character={character} />
          <CharacterSpellsPanel character={character} />
          <CharacterQuickActionsPanel character={character} />
          <CharacterResourcesPanel character={character} />
          <CharacterCompanionsPanel character={character} />
          <CharacterNotesPanel character={character} />
          {process.env.NODE_ENV !== "production" ? (
            <CharacterImportDiagnosticsPanel character={character} />
          ) : null}
        </div>
      </section>
    </main>
  );
}
