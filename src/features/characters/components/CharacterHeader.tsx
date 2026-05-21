import { CharacterStatusBadge } from "@/features/characters/components/CharacterStatusBadge";
import type { Character } from "@/features/characters/types";

type CharacterHeaderProps = {
  character: Character;
};

export function CharacterHeader({ character }: CharacterHeaderProps) {
  return (
    <header className="sheet-header">
      <div>
        {character.playerName ? (
          <p className="sheet-header__player">Jugador: {character.playerName}</p>
        ) : null}
        <h1 className="sheet-header__name">{character.name}</h1>
        <p className="sheet-header__summary">
          {character.species} · {character.classLabel} · Nivel {character.level}
        </p>
      </div>

      <div className="sheet-header__meta">
        <CharacterStatusBadge
          sourceMetadata={character.sourceMetadata}
          importDiagnostics={character.importDiagnostics}
        />
        {character.background ? <span>Trasfondo: {character.background}</span> : null}
        {character.alignment ? <span>Alineamiento: {character.alignment}</span> : null}
        <span>{character.rulesetId ?? "Ruleset libre"}</span>
      </div>
    </header>
  );
}
