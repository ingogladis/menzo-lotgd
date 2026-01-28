const output = document.getElementById("output");
const btnExplore = document.getElementById("btnExplore");
const btnRest = document.getElementById("btnRest");

let fatigue = 0;

btnExplore.addEventListener("click", () => {
  fatigue++;
  const lines = [
    "Du hörst das Flüstern der Spinnpriesterinnen in der Ferne.",
    "Eine Patrouille der Drow kreuzt deinen Weg — du weichst in eine Seitenpassage aus.",
    "Der Geruch von Mykoniden-Sporen liegt in der Luft.",
    "Ein Händler aus dem Unterreich mustert dich kurz und verschwindet im Gedränge."
  ];
  output.textContent = `${lines[Math.floor(Math.random() * lines.length)]} (Erschöpfung: ${fatigue})`;
});

btnRest.addEventListener("click", () => {
  fatigue = Math.max(0, fatigue - 1);
  output.textContent = `Du rastest im Schatten. (Erschöpfung: ${fatigue})`;
});
