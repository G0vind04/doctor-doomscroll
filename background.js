chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.limitReached && message.timeSpent !== undefined) {
    const timeInSeconds = message.timeSpent;

    // Open new tab to lost_time.html with the time parameter
    chrome.tabs.create({
      url: chrome.runtime.getURL(`lost_time.html?time=${timeInSeconds}`)
    });

    // Optionally close the original Shorts/Reels tab to stop browsing
    if (sender.tab && sender.tab.url &&
        (sender.tab.url.includes("youtube.com/shorts") ||
         sender.tab.url.includes("instagram.com/reel") ||
         sender.tab.url.includes("instagram.com/reels"))) {
      chrome.tabs.remove(sender.tab.id);
    }
  }
});
