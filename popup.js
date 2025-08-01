document.addEventListener('DOMContentLoaded', () => {
  const reelsCountEl = document.getElementById('reels-count');
  const timeSpentEl = document.getElementById('time-spent');
  const limitInputEl = document.getElementById('limit-input');
  const saveLimitBtn = document.getElementById('save-limit');

  const updatePopup = () => {
    // Access storage to get the latest data
    chrome.storage.local.get(['reelsCount', 'timeSpentInSeconds', 'reelsLimit'], (result) => {
      reelsCountEl.textContent = result.reelsCount || 0;
      
      const timeSpent = result.timeSpentInSeconds || 0;
      const minutes = Math.floor(timeSpent / 60);
      const seconds = timeSpent % 60;
      timeSpentEl.textContent = `${minutes}m ${seconds}s`;

      if (result.reelsLimit) {
        limitInputEl.value = result.reelsLimit;
      }
    });
  };

  saveLimitBtn.addEventListener('click', () => {
    const limit = parseInt(limitInputEl.value);
    if (!isNaN(limit) && limit > 0) {
      chrome.storage.local.set({ reelsLimit: limit }, () => {
        // You can provide user feedback here, like a small message
        alert('Limit saved!');
      });
    }
  });

  // Initial update when popup is opened
  updatePopup();
  // Set an interval to keep the popup data fresh while it's open
  setInterval(updatePopup, 1000);
});