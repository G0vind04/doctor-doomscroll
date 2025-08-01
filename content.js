console.log("The shorts counter is running");

let shortsCount = 0;
let shortsWatched = new Set();
let timer = 0;
let shortsLimit = 0;
let limitCheckIntervalId = null;
let currentMemePhase = -1;

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
  chrome.runtime.getURL("inc10.png")
];

// 10 ROAST CAPTIONS – one for each meme phase!
const memeRoastCaptions = [
  "You're off to a mediocre start.",
  "Still scrolling? Productivity is trembling.",
  "Every Short drops your IQ by 0.5.",
  "You scroll like your life depends on it. (It doesn't.)",
  "This is the highlight of your week, isn’t it?",
  "Your thumb works harder than your ambitions.",
  "History will forget these Shorts. And you.",
  "Even YouTube is judging you now.",
  "They’ll name a procrastination technique after you.",
  "Legend says you’re still scrolling… in the afterlife."
];

// General detector for YouTube Shorts and Instagram Reels URLs
const isShortFormVideo = url =>
  url.includes("/shorts") ||
  url.includes("/reel/");  // covers both Youtube shorts and Instagram reels

// Overlay generator with synced fade in & out for image and roast caption
const createOverlay = (message = "", shortsCountParam = 1, shortsLimitParam = 10, duration = 2200) => {
  const currCount = shortsCountParam ?? shortsCount;
  const currLimit = shortsLimitParam ?? shortsLimit;
  const steps = memeImages.length;
  const validLimit = currLimit > 0 ? currLimit : steps;
  const stepSize = Math.ceil(validLimit / steps);
  const imgIndex = Math.min(Math.floor((currCount - 1) / stepSize), steps - 1);

  // Create overlay container
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

  // Meme image, fade CSS
  const img = document.createElement('img');
  img.src = memeImages[imgIndex];
  img.style.maxWidth = '300px';
  img.style.height = 'auto';
  img.style.marginBottom = '24px';
  img.style.opacity = '0';
  img.style.transition = 'opacity 1s';

  // Roast caption, fade CSS
  const roast = document.createElement('div');
  roast.textContent = memeRoastCaptions[imgIndex];
  roast.style.fontSize = '1.3rem';
  roast.style.marginTop = '2px';
  roast.style.maxWidth = '80vw';
  roast.style.textAlign = 'center';
  roast.style.fontStyle = 'italic';
  roast.style.opacity = '0';
  roast.style.transition = 'opacity 1s';

  overlay.appendChild(img);
  overlay.appendChild(roast);
  document.body.appendChild(overlay);

  // Fade-in both image and roast caption
  setTimeout(() => {
    img.style.opacity = '1';
    roast.style.opacity = '1';
  }, 60);

  // Fade-out both before removing overlay
  setTimeout(() => {
    img.style.opacity = '0';
    roast.style.opacity = '0';
  }, duration - 1000);

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

// Overlay on activation (start at first image with neutral roast)
createOverlay('', 1, shortsLimit);

const countShorts = () => {
  let currentUrl = window.location.href;
  if (isShortFormVideo(currentUrl) && !shortsWatched.has(currentUrl)) {
    shortsWatched.add(currentUrl);
    shortsCount++;

    // Show overlay only when meme phase changes
    const steps = memeImages.length;
    const validLimit = shortsLimit > 0 ? shortsLimit : steps;
    const stepSize = Math.ceil(validLimit / steps);
    const newPhase = Math.min(Math.floor((shortsCount - 1) / stepSize), steps - 1);

    if (newPhase !== currentMemePhase) {
      currentMemePhase = newPhase;
      createOverlay("", shortsCount, shortsLimit);
    }

    console.log("New short/reel watched", currentUrl);
    console.log("Total shorts/reels watched:", shortsCount);

    if (shortsLimit > 0 && shortsCount >= shortsLimit) {
      chrome.runtime.sendMessage({ limitReached: true });
      createOverlay("Your scrolling has reached legendary status.", shortsCount, shortsLimit, 3000);
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
      createOverlay("Your scrolling has reached legendary status.", shortsCount, shortsLimit, 3000);
    }
  }
}

countShorts();

window.addEventListener('popstate', countShorts);
window.addEventListener('hashchange', countShorts);

let previousUrl = window.location.href;
// Check for navigation changes every second
setInterval(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== previousUrl) {
    previousUrl = currentUrl;
    countShorts();
  }
}, 1000);

// Increment timer only if on Shorts or Reels page
setInterval(() => {
  if (isShortFormVideo(window.location.href)) {
    timer++;
    console.log(timer);
  }
}, 1000);

// Listen to messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SHORTS_COUNT") {
    sendResponse({ count: shortsCount });
  } else if (message.type === "GET_TIMER") {
    sendResponse({ timer: timer });
  } else if (message.type === "START_LIMIT_CHECK") {
    shortsLimit = parseInt(message.shortsLimit);
    console.log("Received new shorts limit:", shortsLimit);
    startLimitCheck();
  }
  return true;
});
