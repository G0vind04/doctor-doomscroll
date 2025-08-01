// --- UNIFIED COUNTER FUNCTION ---
// By putting the message sending in one function, we ensure it's always the same.
function incrementCounter() {
  // This console log will help you debug. You can see it in the browser's developer console (F12).
  console.log('Dr. Doomscroll: Sending reelScrolled message to background.');
  chrome.runtime.sendMessage({ type: 'reelScrolled' });
}


// --- BLOCKING LOGIC ---
const blockPage = (limit) => {
  // Stop listening for events to prevent errors after the page is blocked.
  if (window.location.hostname.includes('instagram.com')) {
    window.removeEventListener('wheel', handleScroll);
  }
  document.body.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 24px; color: red; text-align: center; font-family: sans-serif;">You have reached your daily limit of ${limit} scrolls.</div>`;
};

// Listen for messages FROM the background script (e.g., to block the page)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'limitReached') {
    blockPage(message.limit);
  }
});


// --- SITE-SPECIFIC LOGIC ---

// LOGIC FOR YOUTUBE SHORTS: Monitor URL changes
if (window.location.hostname.includes('youtube.com')) {
  let currentUrl = window.location.href;

  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      // On every URL change, increment the counter.
      incrementCounter();
    }
  }, 500); // Check for a new URL every half-second
}

// LOGIC FOR INSTAGRAM REELS: Listen for scroll wheel events
if (window.location.hostname.includes('instagram.com')) {
  let scrollTimeout;
  const handleScroll = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // After a scroll is detected, increment the counter.
      incrementCounter();
    }, 500); // Debounce to count one scroll flick as a single reel
  };
  window.addEventListener('wheel', handleScroll, { passive: true });
}


// --- INITIALIZATION LOGIC ---

// This function runs as soon as the content script is injected into the page.
function initialize() {
  console.log('Dr. Doomscroll: Content script loaded. Checking limit and counting first view.');
  
  // 1. Check if the limit has already been met from a previous session.
  chrome.runtime.sendMessage({ type: 'checkLimitOnLoad' });

  // 2. IMPORTANT FIX: Count the very first Reel/Short that the user sees.
  // The listeners above will only handle the *next* ones.
  incrementCounter();
}

initialize();