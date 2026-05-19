import type { CharacterSourceMetadata } from "@/features/characters/types";

type CharacterStatusBadgeProps = {
  sourceMetadata: CharacterSourceMetadata;
};

const sourceLabels: Record<CharacterSourceMetadata["source"], string> = {
  manual: "Manual",
  foundry: "Foundry",
  roll20: "Roll20",
  dndbeyond: "D&D Beyond",
  nivel20: "Nivel20",
  other: "Otro origen",
};

export function CharacterStatusBadge({
  sourceMetadata,
}: CharacterStatusBadgeProps) {
  const syncLabel =
    sourceMetadata.syncStatus === "imported"
      ? "Importado"
      : sourceMetadata.syncStatus === "stale"
        ? "Pendiente"
        : sourceMetadata.syncStatus === "conflict"
          ? "Conflicto"
          : "Manual";

  return (
    <span className="character-status-badge">
      {sourceMetadata.sourceLabel ?? sourceLabels[sourceMetadata.source]} · {syncLabel}
    </span>
  );
}
