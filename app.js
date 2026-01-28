// ===== Utils =====
const $ = (id) => document.getElementById(id);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// ===== Constants =====
const SAVE_KEY = "menzo_lotgd_save_v1";

const LOCATIONS = {
  WILD: "Außenbezirk",
  CITY: "Menzoberranzan (Basar)",
};

const TEXT = {
  start:
    "Du trittst in den Außenbezirk ein. Über dir lastet Fels wie eine ewige Nacht. Zwischen Pilztürmen glimmen kalte Lichter – die ersten Vorboten einer Stadt, die von Misstrauen lebt.",
  toCity:
    "Du betrittst den Basar von Menzoberranzan. Stimmen flüstern, handeln, drohen. Spinnensymbole wachen von Balkonen herab, und jeder Blick scheint einen Preis zu haben.",
  explore: [
    "Ein schmaler Pfad windet sich zwischen pilzbewachsenen Säulen. Irgendwo kratzt etwas über Stein.",
    "In der Ferne zieht eine bewaffnete Drow-Patrouille vorbei. Du verharrst reglos, bis nur noch ihr Echo bleibt.",
    "Alchemistische Dämpfe hängen in der Luft. Der Geruch ist süßlich – und falsch.",
    "Du spürst einen Blick im Rücken. Als du dich umdrehst, ist dort nur Dunkelheit."
  ],
  rest: [
    "Du findest eine Nische im Fels. Schlaf kommt in kurzen, unruhigen Stößen.",
    "Du lehnst dich gegen kalten Stein und zwingst deinen Atem zur Ruhe."
  ],
  saved: "Dein Fortschritt wird im Gedächtnis der Stadt verankert.",
  loaded: "Die Schatten erinnern sich an dich.",
  noSave: "Die Dunkelheit kennt diesen Namen nicht.",
  saveDeleted: "Alle Spuren deiner Anwesenheit sind ausgelöscht."
};

// ===== State =====
let state = null;

// ===== DOM =====
const output = $("output");

const hudName = $("hudName");
const hudHp = $("hudHp");
const hudGold = $("hudGold");
const hudDay = $("hudDay");
const hudLoc = $("hudLoc");

const btnExplore = $("btnExplore");
const btnRest = $("btnRest");
const btnTown = $("btnTown");
const btnNew = $("btnNew");
const btnSave = $("btnSave");
const btnLoad = $("btnLoad");
const btnReset = $("btnReset");

// ===== Core =====
function defaultState() {
  return {
    name: "Reisender",
    hp: 20,
    hpMax: 20,
    gold: 10,
    day: 1,
    location: LOCATIONS.WILD,
    fatigue: 0,
  };
}

function log(text) {
  output.textContent = text;
}

function render() {
  hudName.textContent = state.name;
  hudHp.textContent = `${state.hp}/${state.hpMax}`;
  hudGold.textContent = state.gold;
  hudDay.textContent = state.day;
  hudLoc.textContent = state.location;

  const inCity = state.location === LOCATIONS.CITY;
  btnExplore.style.display = inCity ? "none" : "inline-block";
  btnTown.style.display = inCity ? "none" : "inline-block";
  btnRest.style.display = "inline-block";
}

function newGame() {
  state = defaultState();
  log(TEXT.start);
  render();
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  log(TEXT.saved);
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    log(TEXT.noSave);
    return;
  }
  state = JSON.parse(raw);
  log(TEXT.loaded);
  render();
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  log(TEXT.saveDeleted);
}

// ===== Actions =====
btnExplore.addEventListener("click", () => {
  if (!state) newGame();

  state.day += 1;
  state.fatigue += 1;
  state.location = LOCATIONS.WILD;

  const dmg = Math.random() < 0.35 ? 1 + Math.floor(Math.random() * 4) : 0;
  state.hp = clamp(state.hp - dmg, 0, state.hpMax);

  const gold = 1 + Math.floor(Math.random() * 6);
  state.gold += gold;

  const text =
    TEXT.explore[Math.floor(Math.random() * TEXT.explore.length)] +
    ` Du findest ${gold} Gold.` +
    (dmg ? ` Du erleidest ${dmg} Schaden.` : "");

  if (state.hp === 0) {
    log("Deine Kräfte verlassen dich. Die Stadt wird dich nicht vermissen.");
  } else {
    log(text);
  }

  render();
});

btnRest.addEventListener("click", () => {
  if (!state) newGame();

  state.day += 1;
  state.location = LOCATIONS.WILD;

  const heal = 2 + Math.floor(Math.random() * 5);
  state.hp = clamp(state.hp + heal, 0, state.hpMax);
  state.fatigue = Math.max(0, state.fatigue - 1);

  log(`${TEXT.rest[Math.floor(Math.random() * TEXT.rest.length)]} Du erholst dich um ${heal} HP.`);
  render();
});

btnTown.addEventListener("click", () => {
  if (!state) newGame();
  state.location = LOCATIONS.CITY;
  log(TEXT.toCity);
  render();
});

// ===== Meta =====
btnNew.addEventListener("click", newGame);
btnSave.addEventListener("click", saveGame);
btnLoad.addEventListener("click", loadGame);
btnReset.addEventListener("click", resetSave);

// ===== Boot =====
(() => {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    state = JSON.parse(raw);
    log(TEXT.loaded);
    render();
  } else {
    newGame();
  }
})();
