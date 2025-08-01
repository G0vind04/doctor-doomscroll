document.addEventListener('DOMContentLoaded', () => {
  const shortsCountElement = document.getElementById('shorts-count');
  const timerElement = document.getElementById('timer');
  const shortsLimitInput = document.getElementById('shorts-limit');
  const saveLimitButton = document.getElementById('save-limit');

  // Time formatting helper
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Check current URL for YouTube Shorts or Instagram Reel
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0 && tabs[0].url) {
      const url = tabs[0].url;
      const onYouTube = url.includes("youtube.com");
      const onIGReel = url.includes("instagram.com/reels");

      if (onYouTube || onIGReel) {
        const activeTabId = tabs[0].id;

        // Request the count
        chrome.tabs.sendMessage(activeTabId, { type: "GET_SHORTS_COUNT" }, (response) => {
          if (chrome.runtime.lastError) {
            shortsCountElement.textContent = 'N/A';
          } else if (response && response.count !== undefined) {
            shortsCountElement.textContent = response.count;
          } else {
            shortsCountElement.textContent = 'N/A';
          }
        });

        // Request the timer
        chrome.tabs.sendMessage(activeTabId, { type: "GET_TIMER" }, (response) => {
          if (chrome.runtime.lastError) {
            timerElement.textContent = 'N/A';
          } else if (response && response.timer !== undefined) {
            timerElement.textContent = formatTime(response.timer);
          } else {
            timerElement.textContent = 'N/A';
          }
        });

      } else {
        shortsCountElement.textContent = 'N/A';
        timerElement.textContent = 'Not on YouTube/Instagram Reels';
      }
    } else {
      shortsCountElement.textContent = 'N/A';
      timerElement.textContent = 'No active tab';
    }
  });

  // Show the current shorts limit in the input box
  chrome.storage.sync.get(["shortsLimit"], (result) => {
    if (result.shortsLimit !== undefined) {
      shortsLimitInput.value = result.shortsLimit;
    }
  });

  // Handle saving the new limit
  saveLimitButton.addEventListener('click', () => {
    const newLimit = shortsLimitInput.value;
    if (newLimit && parseInt(newLimit) > 0) {
      chrome.storage.sync.set({ shortsLimit: newLimit }, () => {
        // Immediately notify content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0 && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "START_LIMIT_CHECK", shortsLimit: newLimit });
          }
        });
      });
    }
  });
});
