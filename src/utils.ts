import fs from 'fs';
import path from 'path';

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

export function checkIfQuizNeedsToBeSet() {
  const quizDateCheck = JSON.parse(
    fs.readFileSync(path.join(__dirname, "quiz.json"), "utf-8")
  );

  let today = new Date();
  let quizDate = new Date(quizDateCheck.date);
  let todayDateString = today.getDay() + "." + (today.getMonth() + 1) + "." + today.getFullYear();
  let setQuizDateString = quizDate.getDay() + "." + (quizDate.getMonth() + 1) + "." + quizDate.getFullYear();
  if (todayDateString == setQuizDateString) {
    return false;
  }
  return true;
}


export function shuffleArray(array: any) {
  for (let i = 0; i < array.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function getRandomPokemonName(api: any) {
  const data: any = await api.listPokemons(0, 1020);
  const randomPokemon = data.results[Math.floor(Math.random() * data.results.length)];
  return randomPokemon;
}

export async function getPokemonInfoFromData(data: any, api: any, isCommand: boolean) {
  let pokemonDataString: string = "";
  const pokemon = {
    id: data.id,
    name: data.name,
    type: data.types,
    weight: data.weight,
    desc: "",
    abilities: data.abilities,
    baseStats: data.stats
  }

  pokemon.weight = pokemon.weight / 10;

  pokemon.desc = await getPokemonDescription(api, pokemon.id);

  pokemon.id = getPokemonIdString(pokemon.id);


  if (!isCommand) {
    pokemonDataString += `{bold}${pokemon.id} ${pokemon.name}{/bold}\n`;
  } else {
    pokemonDataString += `${pokemon.id} ${pokemon.name}\n`;
  }
  pokemonDataString += pokemon.desc + "\n";

  pokemonDataString += "Weight: " + pokemon.weight + "kg" + "\n";

  pokemonDataString += "\nTypes:\n"
  pokemonDataString += "------\n"
  for (let i = 0; i < pokemon.type.length; i++) {
    pokemonDataString += pokemon.type[i]["type"].name + "\n";
  }

  pokemonDataString += "\nAbilities:\n"
  pokemonDataString += "---------\n"
  for (let i = 0; i < pokemon.abilities.length; i++) {
    pokemonDataString += pokemon.abilities[i]["ability"]["name"] + "\n";
  }

  pokemonDataString += "\nBase Stats:\n"
  pokemonDataString += "-----------\n"
  for (let i = 0; i < pokemon.baseStats.length; i++) {
    pokemonDataString += pokemon.baseStats[i]["stat"]["name"] + ":" + pokemon.baseStats[i]["base_stat"] + "\n";
  }

  return pokemonDataString;

}
