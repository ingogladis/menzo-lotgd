const $ = (id) => document.getElementById(id);

const output = $("output");

// HUD
const hudName = $("hudName");
const hudHp = $("hudHp");
const hudGold = $("hudGold");
const hudDay = $("hudDay");
const hudLoc = $("hudLoc");

// Buttons
const btnExplore = $("btnExplore");
const btnRest = $("btnRest");
const btnTown = $("btnTown");
const btnNew = $("btnNew");
const btnSave = $("btnSave");
const btnLoad = $("btnLoad");
const btnReset = $("btnReset");

const SAVE_KEY = "menzo_lotgd_save_v1";

let state = null;

function defaultState() {
  return {
    name: "Reisender",
    hp: 20,
    hpMax: 20,
    gold: 10,
    day: 1,
    location: "Außenbezirk",
    fatigue: 0,
  };
}

function render() {
  hudName.textContent = state.name;
  hudHp.textContent = `${state.hp}/${state.hpMax}`;
  hudGold.textContent = `${state.gold}`;
  hudDay.textContent = `${state.day}`;
  hudLoc.textContent = state.location;
}

function log(text) {
  output.textContent = text;
}

function newGame() {
  state = defaultState();
  log("Du betrittst die Schatten von Menzoberranzan. Ein neuer Tag beginnt.");
  render();
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  log("Gespeichert.");
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    log("Kein Save gefunden.");
    return;
  }
  state = JSON.parse(raw);
  log("Save geladen.");
  render();
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  log("Save gelöscht.");
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Aktionen (Mini-LotGD)
btnExplore.addEventListener("click", () => {
  if (!state) newGame();

  state.location = "Underdark-Pfad";
  state.fatigue++;
  state.day += 1;

  // Risiko: kleiner Schaden
  const dmg = Math.random() < 0.35 ? 1 + Math.floor(Math.random() * 4) : 0;
  state.hp = clamp(state.hp - dmg, 0, state.hpMax);

  // Loot: bisschen Gold
  const found = 1 + Math.floor(Math.random() * 6);
  state.gold += found;

  if (state.hp === 0) {
    log("Du brichst zusammen. Game Over (vorerst). Klick 'Neues Spiel'.");
  } else {
    log(`Erkundungstag ${state.day - 1}: Du findest ${found} Gold.${dmg ? ` Du nimmst ${dmg} Schaden.` : ""}`);
  }

  render();
});

btnRest.addEventListener("click", () => {
  if (!state) newGame();

  state.location = "Unterschlupf";
  state.day += 1;

  const heal = 2 + Math.floor(Math.random() * 5);
  state.hp = clamp(state.hp + heal, 0, state.hpMax);
  state.fatigue = Math.max(0, state.fatigue - 1);

  log(`Tag ${state.day - 1}: Du rastest und heilst ${heal} HP.`);
  render();
});

btnTown.addEventListener("click", () => {
  if (!state) newGame();

  state.location = "Menzoberranzan (Basar)";
  log("Du erreichst den Basar. (Shop kommt als nächstes.)");
  render();
});

// Meta
btnNew.addEventListener("click", newGame);
btnSave.addEventListener("click", saveGame);
btnLoad.addEventListener("click", loadGame);
btnReset.addEventListener("click", resetSave);

// Boot: automatisch laden, falls vorhanden
(() => {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    state = JSON.parse(raw);
    log("Auto-Load: Save gefunden.");
    render();
  } else {
    newGame();
  }
})();
