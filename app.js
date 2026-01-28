// ===== Utils =====
const $ = (id) => document.getElementById(id);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const nowTime = () => new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

// ===== Constants =====
const SAVE_KEY = "menzo_lotgd_save_v2";

const LOCATIONS = {
  WILD: "Außenbezirk",
  CITY: "Menzoberranzan (Basar)",
};

const TEXT = {
  start:
    "Du trittst in den Außenbezirk ein. Über dir lastet Fels wie eine ewige Nacht. Zwischen Pilztürmen glimmen kalte Lichter – die ersten Vorboten einer Stadt, die von Misstrauen lebt.",
  toCity:
    "Du betrittst den Basar von Menzoberranzan. Stimmen flüstern, handeln, drohen. Spinnensymbole wachen von Balkonen herab, und jeder Blick scheint einen Preis zu haben.",
  toWild:
    "Du lässt den Basar hinter dir. Der Lärm verstummt, und die Dunkelheit wird wieder ehrlich: kalt, schwer, still.",
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
  saveDeleted: "Alle Spuren deiner Anwesenheit sind ausgelöscht.",
  dead: "Deine Kräfte verlassen dich. Die Stadt wird dich nicht vermissen."
};

// ===== State =====
let state = null;

// ===== DOM =====
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
    log: [], // array of strings
  };
}

function inCity() {
  return state.location === LOCATIONS.CITY;
}

function pushLog(line) {
  const entry = `[${nowTime()}] ${line}`;
  state.log.push(entry);

  // keep last 80 entries to avoid endless growth
  if (state.log.length > 80) state.log = state.log.slice(state.log.length - 80);

  renderLog();
}

function renderLog() {
  // render as HTML with line breaks, escaped minimally (we only insert our strings)
  output.innerHTML = state.log.map((l) => `<div class="logline">${escapeHtml(l)}</div>`).join("");
  // auto-scroll to bottom
  output.scrollTop = output.scrollHeight;
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  hudName.textContent = state.name;
  hudHp.textContent = `${state.hp}/${state.hpMax}`;
  hudGold.textContent = state.gold;
  hudDay.textContent = state.day;
  hudLoc.textContent = state.location;

  // contextual nav like LotGD
  if (inCity()) {
    btnExplore.style.display = "none";
    btnTown.style.display = "inline-block";
    btnTown.textContent = "Raus aus der Stadt";
  } else {
    btnExplore.style.display = "inline-block";
    btnTown.style.display = "inline-block";
    btnTown.textContent = "Zur Stadt";
  }

  btnRest.style.display = "inline-block";

  const dead = state.hp <= 0;
  btnExplore.disabled = dead;
  btnRest.disabled = dead;
  btnTown.disabled = dead;

  renderLog();
}

function newGame() {
  state = defaultState();
  pushLog(TEXT.start);
  render();
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  pushLog(TEXT.saved);
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    // no state yet; create minimal temporary to show message
    if (!state) state = defaultState();
    pushLog(TEXT.noSave);
    render();
    return;
  }
  state = JSON.parse(raw);
  // backward safety
  if (!Array.isArray(state.log)) state.log = [];
  pushLog(TEXT.loaded);
  render();
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  if (!state) state = defaultState();
  state.log = [];
  pushLog(TEXT.saveDeleted);
  render();
}

// ===== Actions =====
btnExplore.addEventListener("click", () => {
  if (!state) newGame();
  if (state.hp <= 0) return;

  state.day += 1;
  state.fatigue += 1;
  state.location = LOCATIONS.WILD;

  const dmg = Math.random() < 0.35 ? 1 + Math.floor(Math.random() * 4) : 0;
  state.hp = clamp(state.hp - dmg, 0, state.hpMax);

  const gold = 1 + Math.floor(Math.random() * 6);
  state.gold += gold;

  const line =
    TEXT.explore[Math.floor(Math.random() * TEXT.explore.length)] +
    ` Du findest ${gold} Gold.` +
    (dmg ? ` Du erleidest ${dmg} Schaden.` : "");

  if (state.hp === 0) pushLog(TEXT.dead);
  else pushLog(line);

  render();
});

btnRest.addEventListener("click", () => {
  if (!state) newGame();
  if (state.hp <= 0) return;

  state.day += 1;

  const heal = 2 + Math.floor(Math.random() * 5);
  state.hp = clamp(state.hp + heal, 0, state.hpMax);
  state.fatigue = Math.max(0, state.fatigue - 1);

  const line = `${TEXT.rest[Math.floor(Math.random() * TEXT.rest.length)]} Du erholst dich um ${heal} HP.`;
  pushLog(line);
  render();
});

btnTown.addEventListener("click", () => {
  if (!state) newGame();
  if (state.hp <= 0) return;

  if (inCity()) {
    state.location = LOCATIONS.WILD;
    pushLog(TEXT.toWild);
  } else {
    state.location = LOCATIONS.CITY;
    pushLog(TEXT.toCity);
  }
  render();
});

// ===== Meta =====
btnNew.addEventListener("click", () => {
  newGame();
});

btnSave.addEventListener("click", saveGame);
btnLoad.addEventListener("click", loadGame);
btnReset.addEventListener("click", resetSave);

// ===== Boot =====
(() => {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    state = JSON.parse(raw);
    if (!Array.isArray(state.log)) state.log = [];
    pushLog(TEXT.loaded);
    render();
  } else {
    newGame();
  }
})();
