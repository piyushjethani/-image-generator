const promptForm = document.querySelector(".prompt-form");
const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const generateBtn = document.querySelector(".generate-btn");
const galleryGrid = document.querySelector(".gallery-grid");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");

const API_KEY = "PASTE-YOUR-API-KEY"; // Replace with your actual Hugging Face API Key

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean",
];

// Set theme on load
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
  document.body.classList.toggle("dark-theme", isDark);
  themeToggle.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

const toggleTheme = () => {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [w, h] = aspectRatio.split("/").map(Number);
  const scale = baseSize / Math.sqrt(w * h);
  let width = Math.floor((w * scale) / 16) * 16;
  let height = Math.floor((h * scale) / 16) * 16;
  return { width, height };
};

const updateImageCard = (index, imageUrl) => {
  const card = document.getElementById(`img-card-${index}`);
  if (!card) return;
  card.classList.remove("loading");
  card.innerHTML = `
    <img class="result-img" src="${imageUrl}" alt="Generated image" />
    <div class="img-overlay">
      <a href="${imageUrl}" class="img-download-btn" title="Download Image" download>
        <i class="fa-solid fa-download"></i>
      </a>
    </div>`;
};

const generateImages = async (model, count, ratio, prompt) => {
  const MODEL_URL = `https://api-inference.huggingface.co/models/${model}`;
  const { width, height } = getImageDimensions(ratio);

  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";

  const imageTasks = Array.from({ length: count }, async (_, i) => {
    try {
      const response = await fetch(MODEL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "x-use-cache": "false",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height },
        }),
      });

      if (!response.ok) throw new Error((await response.json())?.error || "Unknown error");

      const blob = await response.blob();
      updateImageCard(i, URL.createObjectURL(blob));
    } catch (err) {
      console.error("Image generation failed:", err);
      const errorCard = document.getElementById(`img-card-${i}`);
      if (errorCard) {
        errorCard.classList.replace("loading", "error");
        errorCard.querySelector(".status-text").textContent = "Generation failed!";
      }
    }
  });

  await Promise.allSettled(imageTasks);
  generateBtn.disabled = false;
  generateBtn.textContent = "Generate";
};

const createImageCards = (model, count, ratio, prompt) => {
  galleryGrid.innerHTML = "";

  for (let i = 0; i < count; i++) {
    galleryGrid.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${ratio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
      </div>`;
  }

  document.querySelectorAll(".img-card").forEach((card, i) => {
    setTimeout(() => card.classList.add("animate-in"), 100 * i);
  });

  generateImages(model, count, ratio, prompt);
};

const handleFormSubmit = (e) => {
  e.preventDefault();

  const model = modelSelect.value;
  const count = parseInt(countSelect.value) || 1;
  const ratio = ratioSelect.value || "1/1";
  const prompt = promptInput.value.trim();

  if (!prompt) {
    alert("Please enter a prompt.");
    return;
  }

  createImageCards(model, count, ratio, prompt);
};

promptBtn.addEventListener("click", () => {
  const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.focus();
  promptInput.value = "";
  promptBtn.disabled = true;
  promptBtn.style.opacity = "0.5";

  let i = 0;
  const typeEffect = setInterval(() => {
    if (i < randomPrompt.length) {
      promptInput.value += randomPrompt.charAt(i);
      i++;
    } else {
      clearInterval(typeEffect);
      promptBtn.disabled = false;
      promptBtn.style.opacity = "1";
    }
  }, 10);
});

themeToggle.addEventListener("click", toggleTheme);
promptForm.addEventListener("submit", handleFormSubmit);
