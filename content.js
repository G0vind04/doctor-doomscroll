console.log("The shorts counter is running");

// --- GLOBAL VARIABLES ---
let shortsCount = 0;
let shortsWatched = new Set();
let timer = 0;
let shortsLimit = 0;
let currentMemePhase = -1;
let previousUrl = window.location.href; // Used for URL change detection

// --- MEME AND ROAST CONFIGURATION ---
const memeImages = Array.from({ length: 10 }, (_, i) => chrome.runtime.getURL(`inc${i + 1}.png`));

const memeRoastCaptions = [
  "Warming up? Don’t worry, your dignity is still mostly intact.",
  "That’s already a couple of Shorts more than your willpower.",
  "Every Short drops your IQ by 0.5.",
  "You scroll like your life depends on it. (It doesn't.)",
  "This is the highlight of your week, isn’t it?",
  "Your thumb works harder than your ambitions.",
  "History will forget these Shorts. And you.",
  "Even YouTube is judging you now.",
  "They’ll name a procrastination technique after you.",
  "Achievement unlocked: Ultimate disappointment. Your phone battery isn’t the only thing dying."
];

// --- CORE FUNCTIONS ---

// Function to save all relevant data to Chrome's synchronized storage
function saveData() {
  chrome.storage.sync.set({
    shortsCount: shortsCount,
    timer: timer,
    shortsWatched: Array.from(shortsWatched) // Convert Set to Array for storage
  });
}

// General detector for YouTube Shorts and Instagram Reels URLs
const isShortFormVideo = (url) => url.includes("/shorts/") || url.includes("/reel/");

// Overlay generator with synced fade in & out for image and roast caption
const createOverlay = (shortsCountParam, shortsLimitParam, duration = 2200) => {
  const steps = memeImages.length;
  const validLimit = shortsLimitParam > 0 ? shortsLimitParam : steps;
  const stepSize = Math.ceil(validLimit / steps);
  const imgIndex = Math.min(Math.floor((shortsCountParam - 1) / stepSize), steps - 1);

  if (imgIndex < 0) return; // Don't show overlay if there's no valid index

  // Create overlay container
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 999999, display: 'flex',
    flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    color: 'white', fontSize: '2rem', pointerEvents: 'none'
  });

  const img = document.createElement('img');
  img.src = memeImages[imgIndex];
  Object.assign(img.style, {
    maxWidth: '300px', height: 'auto', marginBottom: '24px', opacity: '0', transition: 'opacity 1s'
  });

  const roast = document.createElement('div');
  roast.textContent = memeRoastCaptions[imgIndex];
  Object.assign(roast.style, {
    fontSize: '1.3rem', marginTop: '2px', maxWidth: '80vw', textAlign: 'center',
    fontStyle: 'italic', opacity: '0', transition: 'opacity 1s'
  });

  overlay.appendChild(img);
  overlay.appendChild(roast);
  document.body.appendChild(overlay);

  setTimeout(() => { img.style.opacity = '1'; roast.style.opacity = '1'; }, 60);
  setTimeout(() => { img.style.opacity = '0'; roast.style.opacity = '0'; }, duration - 1000);
  setTimeout(() => { overlay.remove(); }, duration);
};


// Main function to count a short/reel when the URL changes
const countShorts = () => {
  const currentUrl = window.location.href;
  if (isShortFormVideo(currentUrl) && !shortsWatched.has(currentUrl)) {
    shortsWatched.add(currentUrl);
    shortsCount++;

    const steps = memeImages.length;
    const validLimit = shortsLimit > 0 ? shortsLimit : steps;
    const stepSize = Math.ceil(validLimit / steps);
    const newPhase = Math.min(Math.floor((shortsCount - 1) / stepSize), steps - 1);

    if (newPhase !== currentMemePhase) {
      currentMemePhase = newPhase;
      createOverlay(shortsCount, shortsLimit);
    }
    
    // Save data every time a new short is watched
    saveData();

    console.log("New short/reel watched:", currentUrl, "| Total:", shortsCount);

    if (shortsLimit > 0 && shortsCount >= shortsLimit) {
      chrome.runtime.sendMessage({ limitReached: true, timeSpent: timer });
      createOverlay(shortsCount, shortsLimit, 3000);
    }
  }
};

// --- INITIALIZATION and EVENT LISTENERS ---

// Load all data from storage when the script first runs
chrome.storage.sync.get(["shortsCount", "timer", "shortsWatched", "shortsLimit"], (result) => {
  shortsCount = result.shortsCount || 0;
  timer = result.timer || 0;
  shortsWatched = new Set(result.shortsWatched || []); // Convert stored Array back to Set
  shortsLimit = result.shortsLimit || 0;

  console.log("Loaded data from storage:", {
    shortsCount,
    timer,
    shortsWatched: Array.from(shortsWatched),
    shortsLimit
  });

  // Initial check once data is loaded
  countShorts();
});


// URL Change Detection Logic
window.addEventListener('popstate', countShorts);
window.addEventListener('hashchange', countShorts);

setInterval(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== previousUrl) {
    previousUrl = currentUrl;
    countShorts();
  }
}, 1000);

// Timer: only increments and saves while on a Shorts or Reels page
setInterval(() => {
  if (isShortFormVideo(window.location.href)) {
    timer++;
    // Save data periodically while timer is running
    if (timer % 10 === 0) { // Save every 10 seconds to reduce write frequency
        saveData();
    }
  }
}, 1000);

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SHORTS_COUNT") {
    sendResponse({ count: shortsCount });
  } else if (message.type === "GET_TIMER") {
    sendResponse({ timer: timer });
  } else if (message.type === "START_LIMIT_CHECK") {
    shortsLimit = parseInt(message.shortsLimit) || 0;
    // Save the new limit to storage
    chrome.storage.sync.set({ shortsLimit: shortsLimit });
    console.log("New shorts limit saved:", shortsLimit);
  } else if (message.type === "RESET_COUNTERS") {
    shortsCount = 0;
    timer = 0;
    shortsWatched.clear();
    currentMemePhase = -1;
    // Save the reset state to storage
    saveData();
    console.log("Counters have been reset and saved.");
    sendResponse({ success: true }); // Acknowledge reset
  }
  return true; // Indicates an asynchronous response may be sent
});