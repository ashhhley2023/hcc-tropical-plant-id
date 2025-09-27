// Flashcard + Quiz App (No build, runs on GitHub Pages)
// CSV format: commonName,scientificName,image1,image2,deck,source

const state = {
  plants: [],
  i: 0,
  flipped: false,
  mode: "flash",
};

// --- Helpers ---
function normalize(s) {
  return (s || "").toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function parseCSV(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        parts.push(cur); cur = "";
      } else cur += ch;
    }
    parts.push(cur);
    rows.push(parts.map(p => p.trim()));
  }
  return rows;
}

// --- Elements ---
const el = id => document.getElementById(id);
const card = el("card");
const img1 = el("img1");
const thumbs = el("imgThumbs");
const commonOut = el("commonOut");
const sciOut = el("sciOut");
const pos = el("pos");
const len = el("len");
const quizImg = el("quizImg");
const guessCommon = el("guessCommon");
const guessSci = el("guessSci");
const result = el("result");

// --- Rendering ---
function showPlant() {
  const p = state.plants[state.i];
  if (!p) return;
  pos.textContent = state.i + 1;
  len.textContent = state.plants.length;
  img1.src = p.image1 || p.image2 || "";
  commonOut.textContent = p.commonName;
  sciOut.textContent = p.scientificName;
  card.classList.toggle("flipped", state.flipped);
  quizImg.src = p.image1 || p.image2 || "";
  guessCommon.value = "";
  guessSci.value = "";
  result.textContent = "";
}

// --- Controls ---
function prev() { state.flipped=false; state.i=(state.i-1+state.plants.length)%state.plants.length; showPlant(); }
function next() { state.flipped=false; state.i=(state.i+1)%state.plants.length; showPlant(); }
function shuffle() {
  for (let i=state.plants.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [state.plants[i],state.plants[j]]=[state.plants[j],state.plants[i]];
  }
  state.i=0; showPlant();
}

// --- Quiz ---
function checkAnswers() {
  const p = state.plants[state.i];
  if (!p) return;
  const gC = guessCommon.value.trim();
  const gS = guessSci.value.trim();

  let commonOk = gC === p.commonName;
  // Special alias: Lady Palm = Rhapis Palm
  if (normalize(p.scientificName) === "rhapis excelsa") {
    if (gC === "Lady Palm" || gC === "Rhapis Palm") commonOk = true;
  }
  const sciOk = gS === p.s
