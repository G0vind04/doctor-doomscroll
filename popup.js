document.addEventListener('DOMContentLoaded', () => {
  const shortsCountElement = document.getElementById('shorts-count');
  const timerElement = document.getElementById('timer');
  const shortsLimitInput = document.getElementById('shorts-limit');
  const saveLimitButton = document.getElementById('save-limit');
  // Assuming you have a button with id="clear-counter" in your popup.html
  const clearCounterButton = document.getElementById('clear-counter'); 
  const seeResultsBtn = document.getElementById('see-results-btn');

  // --- Helper Functions ---

  // Formats total seconds into a more readable "Xm Ys" string
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Updates the display in the popup
  const updateDisplay = (count, timeInSeconds) => {
    shortsCountElement.textContent = count;
    timerElement.textContent = formatTime(timeInSeconds);
  };

  // --- Main Logic ---

  // 1. Load data from storage first for a fast, persistent display.
  chrome.storage.sync.get(["shortsCount", "timer", "shortsLimit"], (data) => {
    console.log("Loaded from storage:", data);
    const storedCount = data.shortsCount || 0;
    const storedTimer = data.timer || 0;
    
    // Immediately update the display with stored data
    updateDisplay(storedCount, storedTimer);

    // Update the limit input field
    if (data.shortsLimit) {
      shortsLimitInput.value = data.shortsLimit;
    }

    // 2. Then, try to get live data from the active tab if it's relevant.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // Check if we have a valid tab to message
      if (tabs.length > 0 && tabs[0].id) {
        const activeTabId = tabs[0].id;
        
        // Check both count and timer
        chrome.tabs.sendMessage(activeTabId, { type: "GET_SHORTS_COUNT" }, (response) => {
          if (!chrome.runtime.lastError && response && response.count !== undefined) {
             // If we get a live response, update the display again
             chrome.tabs.sendMessage(activeTabId, { type: "GET_TIMER" }, (timerResponse) => {
                if (!chrome.runtime.lastError && timerResponse && timerResponse.timer !== undefined) {
                    console.log("Updating with live data:", {count: response.count, timer: timerResponse.timer});
                    updateDisplay(response.count, timerResponse.timer);
                }
             });
          } else {
            // This clears the lastError, but we don't need to do anything here
            // because the stored data is already displayed.
            void chrome.runtime.lastError;
          }
        });
      }
    });
  });

  // --- Event Listeners ---

  // Handle saving the new limit
  saveLimitButton.addEventListener('click', () => {
    const newLimit = shortsLimitInput.value;
    if (newLimit && parseInt(newLimit) > 0) {
      // Save to storage so it persists
      chrome.storage.sync.set({ shortsLimit: newLimit }, () => {
        console.log("New limit saved:", newLimit);
        // Also send a message to the content script to update its limit immediately
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0 && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "START_LIMIT_CHECK", shortsLimit: newLimit });
          }
        });
      });
    }
  });

  // Handle clearing the counters
  if (clearCounterButton) {
    clearCounterButton.addEventListener('click', () => {
      // Reset the data in Chrome storage
      chrome.storage.sync.set({ shortsCount: 0, timer: 0, shortsWatched: [] }, () => {
        // Update the popup display immediately
        updateDisplay(0, 0);
        console.log("Counters cleared in storage.");
      });

      // Send a message to any active content script to reset its state as well
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "RESET_COUNTERS" });
        }
      });
    });
  }
  
  // Handle opening the results page
  if (seeResultsBtn) {
    seeResultsBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'lost_time.html' });
    });
  }
});