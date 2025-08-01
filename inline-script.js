document.addEventListener('DOMContentLoaded', () => {
  const shortsCountElement = document.getElementById('shorts-count');
  const timerElement = document.getElementById('timer');
  const shortsLimitInput = document.getElementById('shorts-limit');
  const saveLimitButton = document.getElementById('save-limit');

  // Function to format time in minutes and seconds
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Request data from the content script of the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Ensure there is an active tab and it has a supported URL
    if (tabs.length > 0 && tabs[0].url && (tabs[0].url.includes("youtube.com"))) {
      const activeTabId = tabs[0].id;

      // Request the shorts count
      chrome.tabs.sendMessage(activeTabId, { type: "GET_SHORTS_COUNT" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          shortsCountElement.textContent = 'N/A';
        } else if (response && response.count !== undefined) {
          shortsCountElement.textContent = response.count;
        }
      });

      // Request the timer value
      chrome.tabs.sendMessage(activeTabId, { type: "GET_TIMER" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          timerElement.textContent = 'N/A';
        } else if (response && response.timer !== undefined) {
          timerElement.textContent = formatTime(response.timer);
        }
      });
    } else {
      shortsCountElement.textContent = 'N/A';
      timerElement.textContent = 'N/A';
    }
  });

  // Load the currently saved shorts limit from storage
  chrome.storage.sync.get(["shortsLimit"], (result) => {
    if (result.shortsLimit !== undefined) {
      shortsLimitInput.value = result.shortsLimit;
    }
  });

  // Add event listener to the save button
  saveLimitButton.addEventListener('click', () => {
    const newLimit = shortsLimitInput.value;
    if (newLimit && parseInt(newLimit) > 0) {
      chrome.storage.sync.set({ shortsLimit: newLimit }, () => {
        console.log("New shorts limit saved:", newLimit);
        
        // Notify the content script about the new limit
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0 && tabs[0].url && tabs[0].url.includes("youtube.com")) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "START_LIMIT_CHECK", shortsLimit: newLimit });
          }
        });
      });
    }
  });
});