chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.limitReached) {
      console.log("Shorts limit reached. Activating blocking rule...");
  
      // Enable the rule
      chrome.declarativeNetRequest.updateEnabledRulesets(
        {
          enableRulesetIds: ["blockShortsRules"]
        },
        () => {
          console.log("Shorts blocking rule enabled.");
        }
      );
  
      // Close any Shorts tab
      chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
          if (tab.url && tab.url.includes("youtube.com/shorts/")) {
            console.log("Closing Shorts tab:", tab.url);
            chrome.tabs.remove(tab.id);
          }
        }
      });
    }
  });
  