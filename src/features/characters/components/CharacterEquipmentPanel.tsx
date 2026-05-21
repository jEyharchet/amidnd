import type { Character, CharacterEquipmentItem } from "@/features/characters/types";

type CharacterEquipmentPanelProps = {
  character: Character;
};

export function CharacterEquipmentPanel({ character }: CharacterEquipmentPanelProps) {
  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Equipo</h2>
        <p>Separado entre equipado, transportado y otras posesiones.</p>
      </div>

      <div className="sheet-subpanel-list">
        <EquipmentGroup title="Equipado" items={character.equippedItems} />
        <EquipmentGroup title="Transportado" items={character.carriedItems} />
        <EquipmentGroup title="Otras posesiones" items={character.otherPossessions} />
      </div>
    </section>
  );
}

function EquipmentGroup({
  title,
  items,
}: {
  title: string;
  items?: CharacterEquipmentItem[];
}) {
  return (
    <div className="sheet-subpanel">
      <div className="sheet-subpanel__title">
        <h3>{title}</h3>
      </div>
      {items?.length ? (
        <div className="table-list">
          {items.map((item) => (
            <div key={item.id} className="table-list__row">
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.category} · Cantidad {item.quantity}
                </span>
              </div>
              <div className="table-list__meta">
                <span>{item.carryingState ?? "sin estado"}</span>
                <strong>{item.weight ?? "-"}</strong>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="sheet-panel__note">No detectado.</p>
      )}
    </div>
  );
}
