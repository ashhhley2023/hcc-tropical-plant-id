// app.js – Plant Flashcards

// --- State ---
let plants = [];
let index = 0;
let mode = "flash"; // "flash" | "quiz"

// --- Helpers ---
function createEl(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (let [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") {
      el.addEventListener(k.substring(2), v);
    } else {
      el.setAttribute(k, v);
    }
  }
  for (let c of children) {
    if (typeof c === "string") el.appendChild(document.createTextNode(c));
    else if (c) el.appendChild(c);
  }
  return el;
}

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s.-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  a = normalize(a);
  b = normalize(b);
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// --- Sample data ---
plants = [
  {
    commonName: "Bottle palm",
    scientificName: "Hyophorbe lagenicaulis",
    image1: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Hyophorbe_lagenicaulis.jpg"
  },
  {
    commonName: "Lady Palm",
    scientificName: "Rhapis excelsa",
    image1: "https://upload.wikimedia.org/wikipedia/commons/d/d7/Rhapis_excelsa3.jpg",
    aliases: ["Rhapis Palm"]
  }
];

// --- UI ---
function render() {
  const app = document.querySelector(".app");
  app.innerHTML = "";

  if (!plants.length) {
    app.appendChild(createEl("p", {}, "No plants loaded."));
    return;
  }
  const plant = plants[index];

  // Controls
  const controls = createEl("div", { class: "controls" },
    createEl("button", { onclick: prev }, "◀ Prev"),
    createEl("button", { onclick: next }, "Next ▶"),
    createEl("button", { onclick: shuffle }, "🔀 Shuffle"),
    createEl("span", { style: "margin-left:auto" }, `${index + 1}/${plants.length}`),
    createEl("button", {
      onclick: () => { mode = "flash"; render(); },
      class: mode === "flash" ? "active" : ""
    }, "Flashcards"),
    createEl("button", {
      onclick: () => { mode = "quiz"; render(); },
      class: mode === "quiz" ? "active" : ""
    }, "Quiz")
  );
  app.appendChild(controls);

  if (mode === "flash") {
    const card = createEl("div", { class: "card" });
    const img = createEl("img", {
      src: plant.image1,
      alt: "Plant image",
      class: "plant-img",
      onerror: () => (img.src = "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg")
    });
    card.appendChild(img);
    card.appendChild(createEl("p", { class: "caption" }, "Click the card to flip"));

    let flipped = false;
    card.onclick = () => {
      flipped = !flipped;
      card.innerHTML = flipped
        ? `<h2>${plant.commonName}</h2><p><i>${plant.scientificName}</i></p>`
        : `<img src="${plant.image1}" alt="Plant image" class="plant-img" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg'"/>`;
    };

    app.appendChild(card);
  } else {
    // Quiz mode
    const form = createEl("div", { class: "quiz" },
      createEl("img", {
        src: plant.image1,
        alt: "Plant image",
        class: "plant-img",
        onerror: (e) => (e.target.src = "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg")
      }),
      createEl("label", {}, "Common name:"),
      createEl("input", { id: "guessCommon", type: "text" }),
      createEl("label", {}, "Scientific name:"),
      createEl("input", { id: "guessSci", type: "text" }),
      createEl("button", { onclick: checkAnswer }, "Check"),
      createEl("button", { onclick: reveal }, "Reveal")
    );
    app.appendChild(form);

    function checkAnswer(e) {
      e.preventDefault();
      const commonGuess = document.getElementById("guessCommon").value;
      const sciGuess = document.getElementById("guessSci").value;

      const commonOk = normalize(commonGuess) === normalize(plant.commonName)
        || (plant.aliases || []).some(a => normalize(commonGuess) === normalize(a));
      const sciOk = normalize(sciGuess) === normalize(plant.scientificName);

      alert(
        `Common name: ${commonOk ? "✓ correct" : "✗ wrong"}\n` +
        `Scientific name: ${sciOk ? "✓ correct" : "✗ wrong"}`
      );
    }

    function reveal(e) {
      e.preventDefault();
      document.getElementById("guessCommon").value = plant.commonName;
      document.getElementById("guessSci").value = plant.scientificName;
    }
  }
}

// --- Navigation ---
function prev() { index = (index - 1 + plants.length) % plants.length; render(); }
function next() { index = (index + 1) % plants.length; render(); }
function shuffle() { plants.sort(() => Math.random() - 0.5); index = 0; render(); }

// --- Start ---
document.addEventListener("DOMContentLoaded", render);
