import type { Character, CharacterCustomAttributeValue } from "@/features/characters/types";

type CharacterCustomAttributesPanelProps = {
  character: Character;
};

export function CharacterCustomAttributesPanel({
  character,
}: CharacterCustomAttributesPanelProps) {
  const visibleAttributes =
    character.customAttributes
      ?.filter((attribute) => attribute.visibleInSheet)
      .sort((left, right) => (left.visualOrder ?? 999) - (right.visualOrder ?? 999)) ?? [];

  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Atributos personalizados</h2>
        <p>Campos creados desde el mapeo asistido cuando el modelo base no alcanza.</p>
      </div>

      {visibleAttributes.length ? (
        <div className="sheet-detail-stack">
          {visibleAttributes.map((attribute) => (
            <article key={attribute.key} className="sheet-detail-card">
              <span className="sheet-detail-card__label">
                {attribute.label} · {attribute.category}
              </span>
              <strong>{formatCustomValue(attribute.value)}</strong>
            </article>
          ))}
        </div>
      ) : (
        <p className="sheet-panel__note">
          Esta ficha no tiene atributos personalizados visibles todavia.
        </p>
      )}
    </section>
  );
}

function formatCustomValue(value: CharacterCustomAttributeValue["value"]) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  if (value === null || value === undefined || value === "") {
    return "Sin valor";
  }

  return String(value);
}
