#!/usr/bin/env bun

import blessed from "neo-blessed";
import { PokemonClient } from 'pokenode-ts';
import commander, { program, Command } from 'commander';
import { getPokemonDescription, getPokemonIdString, getPokemonInfoFromData, getRandomPokemonName, shuffleArray, checkIfQuizNeedsToBeSet } from './utils.ts';
import { select, Separator } from '@inquirer/prompts';
import fs from 'fs';
import path from 'path';

// TODO: show page number 
// TODO: zufälliges pokemon von einem typen
// TODO: Team Builder
// TODO: get pokemon that is effective for example charizard -> Gestein,Wasser

const api = new PokemonClient();
var currentPage: number = 0;
var pageLimit: number = 50;
const program = new Command();
const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "package.json"), "utf-8")
);

const setQuiz = checkIfQuizNeedsToBeSet();
if (setQuiz) {
  await setQuizOfTheDay();
}

function HandleCommands() {
  program
    .name("PokeType")
    .description("a tui to get information about pokemons")
    .version(pkg.version)

  program
    .command("tui")
    .description("start the tui")
  program
    .command("random")
    .action(async () => {
      const [pokemonData, _] = await getRandomPokemonCommand();
      console.log(pokemonData);
    })
    .description("get a random pokemon")
  program
    .command("quiz")
    .action(async () => {
      await getQuizOfTheDay();
    })
    .description("quiz of the day")
  program
    .command("search")
    .action(async (value: any) => {
      await searchForSpecificPokemonCommand(value);
    })
    .description("search for a specific pokemon with the name or id")
    .argument('<name or id>')

  program.parse(process.argv);

}
HandleCommands();

async function setQuizOfTheDay() {
  const [_, pokemonId] = await getRandomPokemonCommand();
  let pokemonDescription = await getPokemonDescription(api, pokemonId);

  let answer = await api.getPokemonByName(pokemonId);
  let wrong_answer_1 = await getRandomPokemonName(api);
  let wrong_answer_2 = await getRandomPokemonName(api);

  let choices = [
    { name: wrong_answer_1.name, value: false },
    { name: answer.name, value: true },
    { name: wrong_answer_2.name, value: false },
  ];

  const quizData = {
    quiz: pokemonDescription,
    choices: choices,
    date: new Date()
  }
  fs.writeFileSync(
    path.join(__dirname, "quiz.json"),
    JSON.stringify(quizData, null, 2),
    "utf-8"
  );
}


async function getRandomPokemonCommand() {
  const randomPokemon = await getRandomPokemonName(api);
  const randomPokemonInfos: any = await api.getPokemonByName(randomPokemon.name);
  const pokemonDataString = await getPokemonInfoFromData(randomPokemonInfos, api, true);
  return [pokemonDataString, randomPokemonInfos.id];
}
async function getQuizOfTheDay() {
  const quiz = JSON.parse(
    fs.readFileSync(path.join(__dirname, "quiz.json"), "utf-8")
  );

  quiz.choices = shuffleArray(quiz.choices);

  console.log("What pokemon is this?")
  console.log("---------------------")
  console.log(quiz.quiz);
  console.log("");
  const query: any = await select({
    message: 'Select the pokemon',
    choices: quiz.choices
  });
  if (query) {
    console.log("Thats correct!");
  } else if (query == "exit") {
    console.log("Exit")
  } else {
    console.log("Thats incorrect!");
  }
}

async function searchForSpecificPokemonCommand(value: any) {
  try {
    const data = await api.getPokemonByName(value);
    let pokemonData = await getPokemonInfoFromData(data, api, true);
    console.log(pokemonData);
  } catch (err) {
    console.log("Pokemon not found");
  }
}



if (process.argv[2] == "tui") {
  const screen = blessed.screen({
    smartCSR: true,
    title: "PokeType"
  });


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
    if (foundPokemons.length == 0 || foundPokemons.length == 1) {
      list.hide();
      await getSpecificPokemon(name);
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
    try {
      const data = await api.getPokemonByName(name);
      await savePokemonDataAndDisplay(data);
    } catch (err) {
      notSearchedText.content = "Error looking for pokemon."
      list.show();
      screen.render();
    }
  }




  async function savePokemonDataAndDisplay(data: any) {
    pokemonInfos.content = "";

    pokemonInfos.content = await getPokemonInfoFromData(data, api, false);

    pokemonInfos.show();
    screen.render();
    input.focus();

  }



  var input = blessed.textbox({
    top: '0',
    left: '0',
    width: '100%',
    height: '10%',
    inputOnFocus: true,
    label: "Search",
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
    list.show();
    pokemonInfos.hide();
    list.focus();
    let pokemonPageData = await initPage();
    await searchForPokemon(pokemonPageData, value);
  });


  const list = blessed.List({
    parent: screen,
    label: "Pokemon List",
    top: "10%",
    width: "100%",
    height: "80%",
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



  screen.on('resize', () => {
    list.width = '100%';
    list.height = '80%';
    screen.render();
  });



  const pokemonInfos = blessed.box({
    parent: screen,
    label: "Infos",
    tags: true,
    top: "10%",
    scrollable: true,
    content: "",
    width: "100%",
    border: 'line',
    height: "80%",
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

  var debugBox = blessed.box({
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

  debugBox.hide();

  var helpBar = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    content: "← → Page | ↑ ↓ Pokemon List | Enter Open Infos| q Exit",
    width: "100%",
    height: "10%",
    border: "line",
    label: "Help",
    style: { fg: "blue", bg: "black" },
    scrollable: false,
    alwaysScroll: false,
    scrollbar: { bg: "blue" }
  })
  var notSearchedText = blessed.text({
    parent: list,
    content: "See a list of pokemon names here."
  });

  //const msg = blessed.message({
  //  parent: screen,
  //  top: 'center',
  //  left: 'center',
  //  width: '30%',
  //  height: 'shrink',
  //  border: 'line',
  //  label: ' Info '
  //});


  //msg.display('PokeType: ' + pkg.version, 3);




  function debug(msg: any) {
    debugBox.pushLine(msg);
    debugBox.setScrollPerc(100);
    screen.render();
  }

  function goBackToSearch() {
    pokemonInfos.hide();
    list.show();
    list.focus();
    screen.render();
  }
  var bottom = blessed.text({
    content: `{ green - fg } { bold }Made With Love by Moritz344{ /bold}{/green - fg } `,
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

}

