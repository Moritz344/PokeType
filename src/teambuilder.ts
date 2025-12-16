import blessed from "neo-blessed";
import { PokemonClient } from 'pokenode-ts';


const screen = blessed.screen({
  smartCSR: true,
  title: "TeamBuilder-Tui"
});

var box = blessed.box({
  parent: screen,
  top: "center",
  bottom: "center",
  left: "center",
  width: "50%",
  height: "60%",
  border: "line",
  label: "Team",
  style: { fg: "yellow", bg: "black" },
  scrollable: false,
  alwaysScroll: false,
  scrollbar: { bg: "blue" }
});

screen.append(box);

function teamSlot(top: string, bottom: string, right: string, left: string,) {
  return blessed.box({
    parent: box,
    top: top,
    bottom: bottom,
    left: left,
    right: right,
    width: "20%",
    height: "30%",
    border: "line",
    label: "Slot",
    style: { fg: "yellow", bg: "black" },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { bg: "blue" }
  });

}

teamSlot("20%", "0", "0", "18%");
teamSlot("20%", "0", "0", "40%");
teamSlot("20%", "0", "0", "62%");

teamSlot("45%", "0", "0", "18%");
teamSlot("45%", "0", "0", "40%");
teamSlot("45%", "0", "0", "62%");

screen.render();
