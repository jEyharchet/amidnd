import Link from "next/link";
import { CharacterStatusBadge } from "@/features/characters/components/CharacterStatusBadge";
import type { Character } from "@/features/characters/types";

type CharacterCardProps = {
  character: Character;
};

export function CharacterCard({ character }: CharacterCardProps) {
  return (
    <Link
      href={`/characters/${character.id}`}
      className="character-card"
      aria-label={`Ver ficha de ${character.name}`}
    >
      <div className="character-card__header">
        <div>
          {character.playerName ? (
            <p className="character-card__player">{character.playerName}</p>
          ) : null}
          <h2 className="character-card__name">{character.name}</h2>
        </div>
        <CharacterStatusBadge
          sourceMetadata={character.sourceMetadata}
          importDiagnostics={character.importDiagnostics}
        />
      </div>

      <p className="character-card__summary">
        {character.species} · {character.classLabel} · Nivel {character.level}
      </p>

      <dl className="character-card__stats">
        <div>
          <dt>PG</dt>
          <dd>
            {character.hitPoints.current}/{character.hitPoints.maximum}
          </dd>
        </div>
        <div>
          <dt>CA</dt>
          <dd>{character.armor.armorClass}</dd>
        </div>
        <div>
          <dt>Iniciativa</dt>
          <dd>{formatSignedValue(character.initiative ?? character.armor.initiative ?? 0)}</dd>
        </div>
      </dl>

      <div className="character-card__footer">
        <span>{character.rulesetId ?? "Ruleset libre"}</span>
        <span>{character.spellcasting ? "Con magia" : "Sin magia"}</span>
      </div>
    </Link>
  );
}

function formatSignedValue(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}
