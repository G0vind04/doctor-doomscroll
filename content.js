let reelCounter = 0;
let dailyLimit = null;
let scrollTimeout;

const checkReelsLimit = () => {
  chrome.storage.local.get(['reelsCount', 'reelsLimit'], (result) => {
    reelCounter = result.reelsCount || 0;
    dailyLimit = result.reelsLimit;
    if (dailyLimit && reelCounter >= dailyLimit) {
      // Replace the body content to block further viewing
      document.body.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 24px; color: red; text-align: center; font-family: sans-serif;">You have reached your daily limit of ${dailyLimit} reels.</div>`;
    }
  });
};

const handleScroll = () => {
  // Clear any existing timeout to debounce the scroll event
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    chrome.storage.local.get('reelsCount', (result) => {
      let currentCount = result.reelsCount || 0;
      currentCount++;
      chrome.storage.local.set({ reelsCount: currentCount }, () => {
        checkReelsLimit(); // Check the limit after each increment
      });
    });
  }, 500); // Debounce for 500ms to count a scroll as one reel
};

// Listen for wheel events to detect scrolling
window.addEventListener('wheel', handleScroll, { passive: true });

// Initial check when the page loads
checkReelsLimit();