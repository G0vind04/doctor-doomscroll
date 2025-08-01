document.addEventListener('DOMContentLoaded', () => {
    const shortsCountElement = document.getElementById('shorts-count');
    const timerElement = document.getElementById('timer');
    const shortsLimitInput = document.getElementById('shorts-limit');
    const saveLimitButton = document.getElementById('save-limit');

    // Function to format the timer from seconds to a more readable format
    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds}s`;
    };

    // Find the active tab to send a message to its content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Ensure we have an active tab and it's a YouTube page where the content script runs
        if (tabs.length > 0 && tabs[0].url && tabs[0].url.startsWith("https://www.youtube.com/")) {
            const activeTabId = tabs[0].id;

            // --- DATA PASSING: REQUESTING SHORTS COUNT ---
            chrome.tabs.sendMessage(activeTabId, { type: "GET_SHORTS_COUNT" }, (response) => {
                if (chrome.runtime.lastError) {
                    // Handle cases where the content script hasn't been injected yet
                    console.log(chrome.runtime.lastError.message);
                    shortsCountElement.textContent = 'N/A';
                } else if (response && response.count !== undefined) {
                    // Update the popup with the received count
                    shortsCountElement.textContent = response.count;
                }
            });

            // --- DATA PASSING: REQUESTING TIMER ---
            chrome.tabs.sendMessage(activeTabId, { type: "GET_TIMER" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                    timerElement.textContent = 'N/A';
                } else if (response && response.timer !== undefined) {
                    // Update the popup with the received and formatted time
                    timerElement.textContent = formatTime(response.timer);
                }
            });

        } else {
            // If not on YouTube, display a message
            shortsCountElement.textContent = 'N/A';
            timerElement.textContent = 'Not on YouTube';
        }
    });

    // Load and display the currently saved shorts limit
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
                console.log("Shorts limit saved:", newLimit);
                
                // Notify the content script immediately of the new limit
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length > 0 && tabs[0].id) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: "START_LIMIT_CHECK", shortsLimit: newLimit });
                    }
                });
            });
        }
    });
});