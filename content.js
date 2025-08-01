console.log("The shorts counter is running");

let shortsCount = 0;
let shortsWatched = new Set();
let timer = 0;
let shortsLimit = 0;
let limitCheckIntervalId = null;

// Meme image paths (10 steps from inc1.png to inc10.png)
const memeImages = [
  chrome.runtime.getURL("inc1.png"),
  chrome.runtime.getURL("inc2.png"),
  chrome.runtime.getURL("inc3.png"),
  chrome.runtime.getURL("inc4.png"),
  chrome.runtime.getURL("inc5.png"),
  chrome.runtime.getURL("inc6.png"),
  chrome.runtime.getURL("inc7.png"),
  chrome.runtime.getURL("inc8.png"),
  chrome.runtime.getURL("inc9.png"),
  chrome.runtime.getURL("inc10.png"),
];

// Overlay generator with meme image step
const createOverlay = (message, shortsCountParam = 1, shortsLimitParam = 10, duration = 1000) => {
  // Use passed-in shortsCount and shortsLimit for previewing proper meme, else fall back to globals
  const currCount = shortsCountParam ?? shortsCount;
  const currLimit = shortsLimitParam ?? shortsLimit;
  const steps = memeImages.length;
  const validLimit = currLimit > 0 ? currLimit : steps;
  const stepSize = Math.ceil(validLimit / steps);
  const imgIndex = Math.min(Math.floor((currCount - 1) / stepSize), steps - 1);

  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 999999,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontSize: '2rem',
    pointerEvents: 'none'
  });

  // Meme image
  const img = document.createElement('img');
  img.src = memeImages[imgIndex];
  img.style.maxWidth = '300px';
  img.style.height = 'auto';
  img.style.marginBottom = '24px';
  img.style.opacity = '0';
  img.style.transition = 'opacity 0.7s';
  setTimeout(() => { img.style.opacity = '1'; }, 50);

  // Message
  const text = document.createElement('div');
  text.textContent = message;

  overlay.appendChild(img);
  overlay.appendChild(text);
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();
  }, duration);

  return overlay;
};

// Load limit from Chrome storage
chrome.storage.sync.get(["shortsLimit"], (result) => {
  if (result.shortsLimit !== undefined) {
    shortsLimit = parseInt(result.shortsLimit);
    console.log("Loaded shorts limit:", shortsLimit);
    startLimitCheck();
  }
});

const isShorts = (url) => url.includes("/shorts");

// --- Overlay on activation (start at first image) ---
createOverlay('Reel Counter active', 1, shortsLimit);

const countShorts = () => {
  let currentUrl = window.location.href;
  if (isShorts(currentUrl) && !shortsWatched.has(currentUrl)) {
    shortsWatched.add(currentUrl);
    shortsCount++;
    // Show meme overlay for current progress
    createOverlay(`Total shorts watched: ${shortsCount}`, shortsCount, shortsLimit);
    console.log("New short watched", currentUrl);
    console.log("Total shorts watched:", shortsCount);

    if (shortsLimit > 0 && shortsCount >= shortsLimit) {
      chrome.runtime.sendMessage({ limitReached: true });
      createOverlay("Shorts limit reached!", shortsCount, shortsLimit, 3000);
    }
  }
};

function startLimitCheck() {
  if (limitCheckIntervalId) {
    clearInterval(limitCheckIntervalId);
    limitCheckIntervalId = null;
  }
  if (shortsLimit > 0) {
    console.log("Starting limit check with limit:", shortsLimit);
    if (shortsCount >= shortsLimit) {
      chrome.runtime.sendMessage({ limitReached: true });
      createOverlay("Shorts limit reached!", shortsCount, shortsLimit, 3000);
    }
  }
}

countShorts();

window.addEventListener('popstate', countShorts);
window.addEventListener('hashchange', countShorts);

let previousUrl = window.location.href;
setInterval(() => {
  let currentUrl = window.location.href;
  if (currentUrl !== previousUrl) {
    previousUrl = currentUrl;
    countShorts();
  }
}, 1000);

setInterval(() => {
  timer++;
  console.log(timer);
}, 1000);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SHORTS_COUNT") {
    sendResponse({ count: shortsCount });
  }
  else if (message.type === "GET_TIMER") {
    sendResponse({ timer: timer });
  }
  else if (message.type === "START_LIMIT_CHECK") {
    shortsLimit = parseInt(message.shortsLimit);
    console.log("Received new shorts limit:", shortsLimit);
    startLimitCheck();
  }
  return true;
});
