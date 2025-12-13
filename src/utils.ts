export async function getPokemonDescription(api: any, id: number) {
  const species = await api.getPokemonSpeciesById(id);

  const entry = species.flavor_text_entries.find(
    (e: any) => e.language.name === "en"
  );

  return entry ? entry.flavor_text.replace(/\s+/g, " ") : "No Description found.";
}

export function getPokemonIdString(id: number) {
  let pokemonIdString;

  if (id < 10) {
    pokemonIdString = "#00" + id;
  } else if (id >= 10 && id < 99) {
    pokemonIdString = "#0" + id;
  } else {
    pokemonIdString = "#" + id;
  }

  return pokemonIdString;

}
