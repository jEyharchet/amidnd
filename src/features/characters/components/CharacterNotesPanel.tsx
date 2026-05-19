import type { Character } from "@/features/characters/types";

type CharacterNotesPanelProps = {
  character: Character;
};

export function CharacterNotesPanel({ character }: CharacterNotesPanelProps) {
  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Notas del GM</h2>
        <p>Espacio de extension para campanas, escenas y referencias futuras.</p>
      </div>

      <div className="notes-list">
        {character.notes.map((note) => (
          <article key={note.id} className="note-card">
            <p className="note-card__kind">{note.kind ?? "other"}</p>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
