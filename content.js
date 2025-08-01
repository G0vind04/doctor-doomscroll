let scrollTimeout;

/**
 * Replaces the page content with a blocking message.
 * @param {number} limit - The daily limit that was reached.
 */
const blockPage = (limit) => {
  // Stop listening for scrolls once the page is blocked to prevent errors
  window.removeEventListener('wheel', handleScroll);
  document.body.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 24px; color: red; text-align: center; font-family: sans-serif;">You have reached your daily limit of ${limit} reels.</div>`;
};

// Listen for messages FROM the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // The background script will tell us when the limit is reached
  if (message.type === 'limitReached') {
    blockPage(message.limit);
  }
});

/**
 * Debounced scroll handler that sends a message to the background script.
 */
const handleScroll = () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    // Inform the background script that a reel was scrolled
    chrome.runtime.sendMessage({ type: 'reelScrolled' });
  }, 500); // Debounce to count a scroll flick as one reel
};

window.addEventListener('wheel', handleScroll, { passive: true });

// On initial load, ask the background script if the limit is already met.
// This handles cases where you open a new Reels tab after already hitting the limit.
chrome.runtime.sendMessage({ type: 'checkLimitOnLoad' });