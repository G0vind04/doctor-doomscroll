console.log("The shorts counter is running");

let shortsCount = 0;
let shortsWatched = new Set();
let timer = 0;
let shortsLimit = 0;
let limitCheckIntervalId = null;

chrome.storage.sync.get(["shortsLimit"], (result) => {
  if (result.shortsLimit !== undefined) {
    shortsLimit = parseInt(result.shortsLimit);
    console.log("Loaded shorts limit:", shortsLimit);
    startLimitCheck();
  }
});

const isShorts = (url) => url.includes("/shorts");

const createOverlay = (message, duration = 1000) => {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontSize: '2rem',
    pointerEvents: 'none'
  });
  overlay.textContent = message;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.remove();
  }, duration);
  return overlay;
};

createOverlay('Reel Counter active');

const countShorts = () => {
  let currentUrl = window.location.href;

  if (isShorts(currentUrl) && !shortsWatched.has(currentUrl)) {
    shortsWatched.add(currentUrl);
    shortsCount++;
    createOverlay(`Total shorts watched: ${shortsCount}`);
    console.log("New short watched", currentUrl);
    console.log("Total shorts watched:", shortsCount);
    
    if (shortsLimit > 0 && shortsCount >= shortsLimit) {
      chrome.runtime.sendMessage({ limitReached: true });
      createOverlay("Shorts limit reached!", 3000);
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
      createOverlay("Shorts limit reached!", 3000);
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