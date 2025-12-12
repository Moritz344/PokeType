import blessed from "neo-blessed";
import { PokemonClient } from 'pokenode-ts';

const api = new PokemonClient();
var POKEMON_DATA: string[] = [""];
var FOUND_POKEMONS: any = [];


async function searchForPokemon(name: string) {
  FOUND_POKEMONS = [];
  debug("SEARCH: " + name);
  const pokemonName = name.toLowerCase();

  const allPokemons = await api.listPokemons(0, 1000);
  for (let pokemon of allPokemons.results) {
    if (pokemon.name.includes(pokemonName)) {
      FOUND_POKEMONS.push(pokemon.name);
      debug("FOUND: " + pokemon.name);
      list.setItems(FOUND_POKEMONS);
      screen.render();
    }
  }

}

async function getSpecificPokemon(name: string) {
  await api
    .getPokemonByName(name)
    .then((data) => savePokemonDataAndDisplay(data))
    .catch((error) => debug(error))
}

async function getPokemonDescription(id: number) {
  const species = await api.getPokemonSpeciesById(id);

  const entry = species.flavor_text_entries.find(
    (e) => e.language.name === "en"
  );

  return entry ? entry.flavor_text.replace(/\s+/g, " ") : "No Description found.";
}

async function savePokemonDataAndDisplay(data: any) {
  pokemonInfos.content = "";
  const pokemon = {
    id: data.id,
    name: data.name,
    type: data.types,
    weight: data.weight,
    sprite: data.sprites.back_default,
    desc: "",
  }

  pokemon.desc = await getPokemonDescription(pokemon.id);

  if (pokemon.id < 10) {
    pokemonInfos.content += "#00" + pokemon.id + "\n";
  } else if (pokemon.id >= 10 && pokemon.id < 99) {
    pokemonInfos.content += "#0" + pokemon.id + "\n";
  } else {
    pokemonInfos.content += "#" + pokemon.id + "\n";
  }
  pokemonInfos.content += "Name: " + pokemon.name + "\n";
  pokemonInfos.content += pokemon.desc + "\n";
  for (let i = 0; i < pokemon.type.length; i++) {
    pokemonInfos.content += "Type" + ": " + pokemon.type[i]["type"].name + "\n";
  }
  pokemonInfos.content += "Weight: " + pokemon.weight + "kg" + "\n";
  pokemonInfos.show();
  screen.render();

  input.focus();

  //debug(pokemon.name);
  //debug(pokemon.type);
  //debug(pokemon.weight);
  //debug(pokemon.sprite);
}

const screen = blessed.screen({
  smartCSR: true
});

screen.title = "Pokemon TUI";


var input = blessed.textbox({
  top: '0px',
  left: '0px',
  width: '100%',
  height: 'shrink',
  inputOnFocus: true,
  mouse: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'transparent',
    border: {
      fg: '#f0f0f0'
    },
  }

});

input.on("submit", (value: string) => {
  list.show();
  pokemonInfos.hide();
  list.focus();
  searchForPokemon(value);
})


const list = blessed.List({
  parent: screen,
  top: "14%",
  left: "0",
  width: "100%",
  height: "73%",
  items: FOUND_POKEMONS,
  vi: true,
  keys: true,
  mouse: true,
  border: { type: "line" },
  style: {
    selected: { bg: "blue", fg: "white" },
    border: { fg: "white" }
  }
});

const pokemonInfos = blessed.box({
  parent: screen,
  top: "14%",
  scrollable: true,
  left: "0%",
  content: "",
  width: "100%",
  border: 'line',
  height: "73%",
  style: {
    selected: { bg: "blue", fg: "white" },
    border: { fg: "white" }
  }
})
pokemonInfos.hide();



function toggleList(on: boolean) {
  if (!on) {
    list.hide();
    screen.render();
  } else {
    list.show();
    screen.render();
  }
}

list.on("select", (item: any, index: number) => {
  getSpecificPokemon(item.getText());
  toggleList(false);
});

const debugBox = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  width: "100%",
  height: "20%",
  border: "line",
  label: "Debug",
  style: { fg: "yellow", bg: "black" },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: { bg: "blue" }
});

function debug(msg: any) {
  debugBox.pushLine(msg);
  debugBox.setScrollPerc(100);
  screen.render();
}


screen.append(input);
input.focus();

screen.key(["q", "C-c"], () => process.exit(0));
screen.key(["0"], () => input.focus());
screen.key(["1"], () => list.focus());
screen.render();






