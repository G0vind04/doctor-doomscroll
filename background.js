// This function runs once when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(() => {
  // Set initial values in storage.
  chrome.storage.local.set({
    reelsCount: 0,
    timeSpentInSeconds: 0,
    reelsLimit: null,
    lastResetDate: new Date().toLocaleDateString()
  });
});

/**
 * Resets the daily data if the date has changed.
 * This is a more robust version that provides default values.
 */
const resetDailyData = () => {
  const today = new Date().toLocaleDateString();
  
  // Provide a default value for 'lastResetDate'.
  // If the key doesn't exist, 'result.lastResetDate' will be an empty string.
  chrome.storage.local.get({ lastResetDate: '' }, (result) => {
    // This check handles potential browser errors.
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    if (result.lastResetDate !== today) {
      console.log('New day detected. Resetting counters.');
      // When a new day starts, reset the counters and update the date.
      chrome.storage.local.set({
        reelsCount: 0,
        timeSpentInSeconds: 0,
        lastResetDate: today
      });
    }
  });
};

// Listen for messages from content scripts.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.tab) {
    if (message.type === 'reelScrolled') {
      handleReelScrolled(sender.tab.id);
    } else if (message.type === 'checkLimitOnLoad') {
      checkLimit(sender.tab.id);
    }
  }
});

function handleReelScrolled(tabId) {
  // Provide defaults for all keys.
  chrome.storage.local.get({ reelsCount: 0, reelsLimit: null }, (result) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    let currentCount = result.reelsCount + 1;
    let limit = result.reelsLimit;

    chrome.storage.local.set({ reelsCount: currentCount }, () => {
      if (limit && currentCount >= limit) {
        chrome.tabs.sendMessage(tabId, { type: 'limitReached', limit: limit });
      }
    });
  });
}

function checkLimit(tabId) {
  // Provide defaults for all keys.
  chrome.storage.local.get({ reelsCount: 0, reelsLimit: null }, (result) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    if (result.reelsLimit && result.reelsCount >= result.reelsLimit) {
      chrome.tabs.sendMessage(tabId, { type: 'limitReached', limit: result.reelsLimit });
    }
  });
}

// Track time spent on the active Reels/Shorts tab.
setInterval(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      const url = tabs[0].url;
      if (url.includes("instagram.com/reels/") || url.includes("youtube.com/shorts/")) {
        // Provide a default for the time counter.
        chrome.storage.local.get({ timeSpentInSeconds: 0 }, (result) => {
           if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              return;
           }
           let newTime = result.timeSpentInSeconds + 1;
           chrome.storage.local.set({ timeSpentInSeconds: newTime });
        });
      }
    }
  });
}, 1000);

// Check every minute if the date has changed.
setInterval(resetDailyData, 60000);

// Run the reset check once on startup to ensure data is fresh.
resetDailyData();