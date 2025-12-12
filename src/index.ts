import blessed from "neo-blessed";
import { PokemonClient } from 'pokenode-ts';

const api = new PokemonClient();
var currentPage: number = 0;
var pageLimit: number = 20;

async function searchForPokemon(data: any, name: string) {
  list.setItems([]);
  debug("SEARCH: " + name);
  let foundPokemons: string[] = [];
  const pokemonName = name.toLowerCase();

  for (let pokemon of data.results) {
    if (pokemon.name.includes(pokemonName)) {
      foundPokemons.push(pokemon.name);
      debug("FOUND: " + pokemon.name);
      list.setItems(foundPokemons);
      screen.render();
    }
  }
}

async function initPage() {
  const allPokemons = await api.listPokemons(0, 100);
  return allPokemons;
}

async function nextPage(name: string) {
  list.setItems([]);
  currentPage += 1;
  debug("PAGE: " + currentPage);
  const data = await api.listPokemons((currentPage - 1) * pageLimit, pageLimit);
  let foundPokemons = [];
  for (let pokemon of data.results) {
    if (pokemon.name.includes(name.toLowerCase())) {
      foundPokemons.push(pokemon.name);
      list.setItems(foundPokemons);
      screen.render();
    }
  }

}

async function previousPage(name: string) {
  if (currentPage <= 0) {
    return;
  }
  list.setItems([]);
  currentPage -= 1;
  debug("PAGE: " + currentPage);
  const data = await api.listPokemons((currentPage - 1) * pageLimit, pageLimit);
  let foundPokemons = [];
  for (let pokemon of data.results) {
    if (pokemon.name.includes(name.toLowerCase())) {
      foundPokemons.push(pokemon.name);
      list.setItems(foundPokemons);
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
  let pokemonIdString;

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
    pokemonIdString = "#00" + pokemon.id;
  } else if (pokemon.id >= 10 && pokemon.id < 99) {
    pokemonIdString = "#0" + pokemon.id;
  } else {
    pokemonIdString = "#" + pokemon.id;
  }
  pokemonInfos.content += `{bold}${pokemon.name}{/bold}\n`;
  pokemonInfos.content += pokemon.desc + "\n";
  for (let i = 0; i < pokemon.type.length; i++) {
    pokemonInfos.content += "Type" + ": " + pokemon.type[i]["type"].name + "\n";
  }
  pokemonInfos.content += "Weight: " + pokemon.weight + "kg" + "\n";
  pokemonInfos.show();
  debug("NAME:" + pokemon.name);
  screen.render();
  input.focus();

}


const screen = blessed.screen({
  smartCSR: true,
  title: "PokeType"
});



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

input.on("submit", async (value: string) => {
  debug("SUBMITTED: ");
  list.show();
  pokemonInfos.hide();
  list.focus();
  let pokemonPageData = await initPage();
  await searchForPokemon(pokemonPageData, value);
})


const list = blessed.List({
  parent: screen,
  top: "14%",
  left: "0",
  width: "100%",
  height: "73%",
  items: "",
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
  tags: true,
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


list.on("select", async (item: any, index: number) => {
  await getSpecificPokemon(item.getText());
  list.hide();
  screen.render();
});

const debugBox = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  width: "100%",
  height: "40%",
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

function goBackToSearch() {
  pokemonInfos.hide();
  list.show();
  screen.render();
  list.focus();
}
var bottom = blessed.text({
  parent: screen,
  content: `{green-fg}{bold}Made With Love by Moritz344{/bold}{/green-fg}`,
  valign: 'middle',
  top: '95%',
  left: '3%',
  height: '5%',
  tags: true
});

screen.append(input);
input.focus();

screen.key(["q", "C-c"], () => process.exit(0));
screen.key(["0"], () => input.focus());
screen.key(["1"], () => list.focus());
screen.key(["b"], () => goBackToSearch());

screen.key(["right"], () => nextPage(input.getText()));
screen.key(["left"], () => previousPage(input.getText()));
screen.render();





