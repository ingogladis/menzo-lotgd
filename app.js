// ===== Utils =====
const $ = (id) => document.getElementById(id);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hhmm() {
  return new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

// ===== Constants =====
const SAVE_KEY = "menzo_lotgd_save_v4";

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
  market: "Der Markt ist ein Netz aus Stimmen. (Platzhalter: als nächstes Kaufen/Verkaufen.)",
  tavern: "Die Taverne ist warm, aber die Wärme ist geliehen. (Platzhalter: als nächstes Gerüchte/Quests.)",
  healer: "Der Heiler verlangt keinen Dank, nur Münzen. (Platzhalter: als nächstes Heilung gegen Gold.)",
  saved: "Gespeichert.",
  loaded: "Save geladen.",
  noSave: "Kein Save gefunden.",
  saveDeleted: "Save gelöscht.",
  dead: "Deine Kräfte verlassen dich. Die Stadt wird dich nicht vermissen."
};

// ===== State =====
let state = null;

function defaultState() {
  return {
    name: "Reisender",
    hp: 20,
    hpMax: 20,
    gold: 10,
    day: 1,
    location: LOCATIONS.WILD,
    fatigue: 0,
    log: []
  };
}

// ===== DOM =====
const menuRoot = $("menuRoot");
const output = $("output");

const pageTitle = $("pageTitle");
const pageSubtitle = $("pageSubtitle");
const statusLine = $("statusLine");

const hudName = $("hudName");
const hudHp = $("hudHp");
const hudGold = $("hudGold");
const hudDay = $("hudDay");
const hudLoc = $("hudLoc");
const hudHpBar = $("hudHpBar");

// ===== Log =====
function pushLog(line) {
  const entry = `[${hhmm()}] ${line}`;
  state.log.push(entry);
  if (state.log.length > 140) state.log = state.log.slice(-140);
  renderLog();
}

function renderLog() {
  output.innerHTML = state.log
    .map((l) => {
      // split only first bracket timestamp
      const m = l.match(/^\[(\d{2}:\d{2})\]\s*(.*)$/);
      if (!m) return `<div class="logline">${escapeHtml(l)}</div>`;
      return `<div class="logline"><span class="logtime">[${escapeHtml(m[1])}]</span> ${escapeHtml(m[2])}</div>`;
    })
    .join("");
  output.scrollTop = output.scrollHeight;
}

// ===== Menu builder (Port der menu.php-Idee) =====
function mkGroup(title, items, noteHtml = "") {
  const wrap = document.createElement("div");
  wrap.className = "menu-group";

  const t = document.createElement("div");
  t.className = "menu-title";
  t.textContent = title;

  const links = document.createElement("div");
  links.className = "menu-links";

  for (const it of items) {
    const btn = document.createElement("button");
    btn.className = "menu-link";
    btn.type = "button";
    btn.textContent = it.label;
    if (it.hint) btn.title = it.hint;
    btn.disabled = !!it.disabled;

    btn.addEventListener("click", () => it.onClick?.());
    links.appendChild(btn);
  }

  wrap.appendChild(t);
  wrap.appendChild(links);

  if (noteHtml) {
    const n = document.createElement("div");
    n.className = "menu-note";
    n.innerHTML = noteHtml;
    wrap.appendChild(n);
  }

  return wrap;
}

function rebuildMenu() {
  menuRoot.innerHTML = "";

  const dead = state.hp <= 0;
  const inCity = state.location === LOCATIONS.CITY;

  // Stadt-Gruppe (kontextabhängig)
  const cityItems = inCity
    ? [
        { label: "Heimat", hint: "Zurück ins Herz der Stadt.", onClick: () => goCity(), disabled: dead },
        { label: "Markt", hint: "Waren, Beute, Gerüchte.", onClick: () => cityMarket(), disabled: dead },
        { label: "Taverne", hint: "Flüstern, Deals, Aufträge.", onClick: () => cityTavern(), disabled: dead },
        { label: "Heiler", hint: "Wunden schließen – gegen Münzen.", onClick: () => cityHealer(), disabled: dead },
        { label: "Raus aus der Stadt", hint: "Zurück in den Außenbezirk.", onClick: () => goWild(), disabled: dead },
      ]
    : [
        { label: "Heimat", hint: "Zurück ins Herz der Stadt.", onClick: () => goCity(), disabled: dead },
        { label: "Erkunden", hint: "Durch Schatten und Spuren streifen.", onClick: () => explore(), disabled: dead },
        { label: "Rasten", hint: "Kräfte sammeln.", onClick: () => rest(), disabled: dead },
      ];

  menuRoot.appendChild(mkGroup("Stadt", cityItems));

  // Ausrüstung (Platzhalter, aber wie dein Projekt)
  menuRoot.appendChild(
    mkGroup("Ausrüstung", [
      { label: "Inventar", hint: "Beute und Ausrüstung verwalten. (Platzhalter)", onClick: () => pushLog("Inventar: Platzhalter."), disabled: false },
      { label: "Fähigkeiten", hint: "Pfade wählen und Schatten schärfen. (Platzhalter)", onClick: () => pushLog("Fähigkeiten: Platzhalter."), disabled: false },
    ])
  );

  // System
  menuRoot.appendChild(
    mkGroup("System", [
      { label: "Neues Spiel", hint: "Neuer Start.", onClick: () => newGame(), disabled: false },
      { label: "Speichern", hint: "Im Browser speichern.", onClick: () => saveGame(), disabled: false },
      { label: "Laden", hint: "Aus dem Browser laden.", onClick: () => loadGame(), disabled: false },
      { label: "Reset Save", hint: "Save löschen.", onClick: () => resetSave(), disabled: false },
    ])
  );

  // Hinweis wie dein menu.php
  menuRoot.appendChild(
    mkGroup(
      "Hinweis",
      [],
      "<em>In Menzoberranzan ist jede Tür ein Versprechen – und jede Ecke eine Lüge.</em>"
    )
  );
}

// ===== Render =====
function render() {
  const inCity = state.location === LOCATIONS.CITY;

  hudName.textContent = state.name;
  hudHp.textContent = `${state.hp}/${state.hpMax}`;
  hudGold.textContent = String(state.gold);
  hudDay.textContent = String(state.day);
  hudLoc.textContent = state.location;

  const hpPct = state.hpMax > 0 ? (state.hp / state.hpMax) * 100 : 0;
  hudHpBar.style.width = `${clamp(hpPct, 0, 100)}%`;

  pageTitle.textContent = inCity ? "Basar" : "Außenbezirk";
  pageSubtitle.textContent = inCity
    ? "Der Preis ist selten Gold. Meist ist es Aufmerksamkeit."
    : "Die Dunkelheit ist weit. Die Ohren sind näher.";

  statusLine.textContent = state.hp <= 0
    ? "Du bist bewusstlos (Game Over – vorerst)."
    : (inCity ? "Du bist in der Stadt." : "Du bist außerhalb der Stadt.");

  rebuildMenu();
  renderLog();
}

// ===== Game actions =====
function newGame() {
  state = defaultState();
  pushLog(TEXT.start);
  render();
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  pushLog(TEXT.saved);
  render();
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    if (!state) state = defaultState();
    pushLog(TEXT.noSave);
    render();
    return;
  }
  state = JSON.parse(raw);
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

function goCity() {
  if (state.hp <= 0) return;
  state.location = LOCATIONS.CITY;
  pushLog(TEXT.toCity);
  render();
}

function goWild() {
  if (state.hp <= 0) return;
  state.location = LOCATIONS.WILD;
  pushLog(TEXT.toWild);
  render();
}

function explore() {
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

  pushLog(state.hp === 0 ? TEXT.dead : line);
  render();
}

function rest() {
  if (state.hp <= 0) return;

  state.day += 1;

  const heal = 2 + Math.floor(Math.random() * 5);
  state.hp = clamp(state.hp + heal, 0, state.hpMax);
  state.fatigue = Math.max(0, state.fatigue - 1);

  const line = `${TEXT.rest[Math.floor(Math.random() * TEXT.rest.length)]} Du erholst dich um ${heal} HP.`;
  pushLog(line);
  render();
}

// City placeholders
function cityMarket() { pushLog(TEXT.market); }
function cityTavern() { pushLog(TEXT.tavern); }
function cityHealer() { pushLog(TEXT.healer); }

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
