const CATEGORIES = [
  {
    id: "profissao",
    name: "Profissão",
    color: "#e53935",
    lightText: true,
    items: [
      "Médico",
      "Professor",
      "Bombeiro",
      "Policial",
      "Dentista",
      "Piloto",
      "Chef de cozinha",
      "Advogado",
      "Engenheiro",
      "Veterinário",
    ],
  },
  {
    id: "animal",
    name: "Animal",
    color: "#1e88e5",
    lightText: true,
    items: [
      "Cachorro",
      "Gato",
      "Elefante",
      "Golfinho",
      "Leão",
      "Pinguim",
      "Tartaruga",
      "Coelho",
      "Urso",
      "Macaco",
    ],
  },
  {
    id: "comida",
    name: "Comida",
    color: "#43a047",
    lightText: true,
    items: [
      "Pizza",
      "Hambúrguer",
      "Sushi",
      "Sorvete",
      "Brigadeiro",
      "Lasanha",
      "Açaí",
      "Pão de queijo",
      "Salada",
      "Macarrão",
    ],
  },
  {
    id: "objeto",
    name: "Objeto",
    color: "#fdd835",
    lightText: false,
    items: [
      "Celular",
      "Bicicleta",
      "Livro",
      "Guarda-chuva",
      "Relógio",
      "Cadeira",
      "Lâmpada",
      "Chave",
      "Óculos",
      "Mochila",
    ],
  },
];

const screenPlay = document.getElementById("screen-play");
const hintPlay = document.getElementById("hint-play");
const cardViewport = document.getElementById("card-viewport");
const cardTrack = document.getElementById("card-track");
const actionBar = document.getElementById("action-bar");
const btnAction = document.getElementById("btn-action");

const LABEL_STOP = "Parar";
const LABEL_SPIN = "Voltar a girar";

let cardDeck = [];
let cardOffset = 0;
let cardHeight = 0;
let cardSpinning = true;
let cardStopping = false;
let cardAnimId = null;

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck() {
  const all = [];
  CATEGORIES.forEach((cat) => {
    cat.items.forEach((label) => {
      all.push({
        label,
        categoryName: cat.name,
        color: cat.color,
        lightText: cat.lightText,
      });
    });
  });
  return shuffle(all);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function measureCardHeight() {
  const first = cardTrack.querySelector(".option-card");
  if (!first) return 0;
  return first.offsetHeight;
}

function buildCardTrack() {
  cardDeck = buildDeck();
  cardTrack.innerHTML = "";

  cardDeck.forEach((entry) => {
    const card = document.createElement("div");
    const textClass = entry.lightText ? "light-text" : "dark-text";
    card.className = `option-card ${textClass}`;
    card.style.backgroundColor = entry.color;
    card.innerHTML = `
      <span class="card-category">${entry.categoryName}</span>
      <span class="card-word">${entry.label}</span>
    `;
    cardTrack.appendChild(card);
  });

  requestAnimationFrame(() => {
    cardHeight = measureCardHeight();
    cardOffset = 0;
    cardTrack.style.transform = "translateY(0px)";
  });
}

function cardLoop() {
  if (cardSpinning && !cardStopping && cardHeight > 0) {
    cardOffset += 12 + Math.random() * 4;
    const total = cardHeight * cardDeck.length;
    if (cardOffset >= total) cardOffset -= total;
    cardTrack.style.transform = `translateY(${-cardOffset}px)`;
  }
  cardAnimId = requestAnimationFrame(cardLoop);
}

function updateActionButton() {
  if (cardStopping) {
    btnAction.textContent = "Parando...";
    btnAction.disabled = true;
    return;
  }
  btnAction.disabled = false;
  if (cardSpinning) {
    btnAction.textContent = LABEL_STOP;
    btnAction.setAttribute("aria-label", "Parar nos cards");
  } else {
    btnAction.textContent = LABEL_SPIN;
    btnAction.setAttribute("aria-label", "Voltar a girar os cards");
  }
}

function stopCards() {
  if (cardStopping || !cardSpinning || cardHeight <= 0) return;

  cardStopping = true;
  hintPlay.textContent = "Parando...";
  hintPlay.classList.add("stopped");
  updateActionButton();

  const targetIndex = Math.floor(Math.random() * cardDeck.length);
  const total = cardHeight * cardDeck.length;
  let target = targetIndex * cardHeight;
  const current = cardOffset % total;
  if (target <= current) target += total;
  target += total * (2 + Math.floor(Math.random() * 2));

  const start = cardOffset;
  const delta = target - start;
  const duration = 2400 + Math.random() * 800;
  const startTime = performance.now();

  function animateCards(now) {
    const t = Math.min(1, (now - startTime) / duration);
    cardOffset = start + delta * easeOutCubic(t);
    cardTrack.style.transform = `translateY(${-cardOffset}px)`;
    if (t < 1) {
      requestAnimationFrame(animateCards);
    } else {
      cardOffset = targetIndex * cardHeight;
      cardTrack.style.transform = `translateY(${-cardOffset}px)`;
      cardSpinning = false;
      cardStopping = false;
      hintPlay.classList.add("hidden");
      screenPlay.classList.add("stopped");
      updateActionButton();
    }
  }
  requestAnimationFrame(animateCards);
}

function resetGame() {
  cardSpinning = true;
  cardStopping = false;
  cardOffset = 0;
  hintPlay.textContent = "Toque na tela ou em Parar";
  hintPlay.classList.remove("stopped", "hidden");
  screenPlay.classList.remove("stopped");
  updateActionButton();
  buildCardTrack();
}

function onPlayTap(e) {
  if (e.target.closest(".btn-primary")) return;
  if (!cardSpinning) return;
  stopCards();
}

function bindTap(el, handler) {
  el.addEventListener(
    "pointerup",
    (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      handler(e);
    },
    { passive: true }
  );
}

bindTap(screenPlay, onPlayTap);
btnAction.addEventListener("click", (e) => {
  e.stopPropagation();
  if (cardStopping) return;
  if (cardSpinning) stopCards();
  else resetGame();
});

window.addEventListener("resize", () => {
  const prevIndex =
    cardHeight > 0 ? Math.round(cardOffset / cardHeight) % cardDeck.length : 0;
  cardHeight = measureCardHeight();
  if (cardHeight > 0 && cardDeck.length) {
    cardOffset = prevIndex * cardHeight;
    cardTrack.style.transform = `translateY(${-cardOffset}px)`;
  }
});

updateActionButton();
buildCardTrack();
cardAnimId = requestAnimationFrame(cardLoop);
