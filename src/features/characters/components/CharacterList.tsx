import { CharacterCard } from "@/features/characters/components/CharacterCard";
import type { Character } from "@/features/characters/types";

type CharacterListProps = {
  characters: Character[];
};

export function CharacterList({ characters }: CharacterListProps) {
  return (
    <section className="character-list" aria-label="Listado de personajes">
      {characters.map((character) => (
        <CharacterCard key={character.id} character={character} />
      ))}
    </section>
  );
}
