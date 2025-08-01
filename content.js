console.log("The shorts counter is running");

// --- GLOBAL VARIABLES ---
let shortsCount = 0;
let shortsWatched = new Set();
let timer = 0;
let shortsLimit = 0;
let currentMemePhase = -1;

// --- MEME AND ROAST CONFIGURATION ---
const memeImages = Array.from({ length: 10 }, (_, i) => chrome.runtime.getURL(`inc${i + 1}.png`));

const memeRoastCaptions = [
    "Warming up? Don’t worry, your dignity is still mostly intact.",
    "That’s already a couple of Shorts more than your willpower.",
    "Every Short drops your IQ by 0.5.",
    "You scroll like your life depends on it. (It doesn't.)",
    "This is the highlight of your week, isn’t it?",
    "Your thumb works harder than your ambitions.",
    "History will forget these Shorts. And you.",
    "Even YouTube is judging you now.",
    "They’ll name a procrastination technique after you.",
    "Achievement unlocked: Ultimate disappointment. Your phone battery isn’t the only thing dying."
];

// --- CORE FUNCTIONS ---

function saveData() {
    chrome.storage.sync.set({
        shortsCount: shortsCount,
        timer: timer,
        shortsWatched: Array.from(shortsWatched)
    });
}

const isShortFormVideo = (url) => url.includes("/shorts/") || url.includes("/reel");

const createOverlay = (shortsCountParam, shortsLimitParam, duration = 2200) => {
    // This function remains unchanged.
    const steps = memeImages.length;
    const validLimit = shortsLimitParam > 0 ? shortsLimitParam : steps;
    const stepSize = Math.ceil(validLimit / steps);
    const imgIndex = Math.min(Math.floor((shortsCountParam - 1) / stepSize), steps - 1);
    if (imgIndex < 0) return;
    const overlay = document.createElement('div');
    Object.assign(overlay.style, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 999999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '2rem', pointerEvents: 'none' });
    const img = document.createElement('img');
    img.src = memeImages[imgIndex];
    Object.assign(img.style, { maxWidth: '300px', height: 'auto', marginBottom: '24px', opacity: '0', transition: 'opacity 1s' });
    const roast = document.createElement('div');
    roast.textContent = memeRoastCaptions[imgIndex];
    Object.assign(roast.style, { fontSize: '1.3rem', marginTop: '2px', maxWidth: '80vw', textAlign: 'center', fontStyle: 'italic', opacity: '0', transition: 'opacity 1s' });
    overlay.appendChild(img);
    overlay.appendChild(roast);
    document.body.appendChild(overlay);
    setTimeout(() => { img.style.opacity = '1'; roast.style.opacity = '1'; }, 60);
    setTimeout(() => { img.style.opacity = '0'; roast.style.opacity = '0'; }, duration - 1000);
    setTimeout(() => { overlay.remove(); }, duration);
};

// A central function to process any new video, making the code cleaner.
function processNewVideo(uniqueId) {
    if (!uniqueId || shortsWatched.has(uniqueId)) {
        return; // Exit if we have no ID or have already counted this video
    }
    
    shortsWatched.add(uniqueId);
    shortsCount++;
    saveData();
    console.log("New video processed:", uniqueId.substring(0, 60), "| Total:", shortsCount);

    // Meme and limit logic
    const steps = memeImages.length;
    const validLimit = shortsLimit > 0 ? shortsLimit : steps;
    const stepSize = Math.ceil(validLimit / steps);
    const newPhase = Math.min(Math.floor((shortsCount - 1) / stepSize), steps - 1);

    if (newPhase !== currentMemePhase) {
        currentMemePhase = newPhase;
        createOverlay(shortsCount, shortsLimit);
    }
    if (shortsLimit > 0 && shortsCount >= shortsLimit) {
        chrome.runtime.sendMessage({ limitReached: true, timeSpent: timer });
        createOverlay(shortsCount, shortsLimit, 3000);
    }
}

// --- INITIALIZATION ---

chrome.storage.sync.get(["shortsCount", "timer", "shortsWatched", "shortsLimit"], (result) => {
    shortsCount = result.shortsCount || 0;
    timer = result.timer || 0;
    shortsWatched = new Set(result.shortsWatched || []);
    shortsLimit = result.shortsLimit || 0;
    console.log("Loaded data from storage:", { shortsCount, timer, shortsWatched: Array.from(shortsWatched), shortsLimit });

    // =================================================================================
    // THIS IS THE CRITICAL LOGIC SWITCH: INSTAGRAM GETS A NEW METHOD, YOUTUBE USES YOURS
    // =================================================================================

    if (window.location.hostname.includes("instagram.com")) {
        console.log("Instagram detected. Starting scroll-based watcher.");

        // This function finds the video element currently visible on the screen
        const findAndProcessVisibleReel = () => {
            // Find all videos on the page
            const videos = document.querySelectorAll('video');
            const viewportCenterY = window.innerHeight / 2;
            
            for (const video of videos) {
                const rect = video.getBoundingClientRect();
                // Check if this video is in the middle of the viewport
                if (rect.top < viewportCenterY && rect.bottom > viewportCenterY) {
                    // Use the video's 'src' as a unique ID. This is foolproof.
                    if (video.src) {
                        processNewVideo(video.src);
                    }
                    break; // Found the active reel, no need to check others
                }
            }
        };

        // A helper to prevent the check from running hundreds of times per second
        const debouncedCheck = debounce(findAndProcessVisibleReel, 400); // 400ms delay

        // Add an event listener that triggers the check after the user stops scrolling
        window.addEventListener('scroll', debouncedCheck, true);
        
        // Also run an initial check in case a reel is visible on page load
        setTimeout(findAndProcessVisibleReel, 1500);

    } else {
        // --- THIS IS YOUR UNCHANGED YOUTUBE CODE ---
        // It runs only if the site is NOT Instagram.
        console.log("YouTube or other site detected. Using original URL listeners.");

        let previousUrl = window.location.href;

        // Your main counting function for YouTube
        const countShorts = () => {
            const currentUrl = window.location.href;
            if (isShortFormVideo(currentUrl)) {
                 processNewVideo(currentUrl);
            }
        };

        // Initial check once data is loaded
        countShorts();

        // Your original URL Change Detection Logic
        window.addEventListener('popstate', countShorts);
        window.addEventListener('hashchange', countShorts);

        setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== previousUrl) {
                previousUrl = currentUrl;
                countShorts();
            }
        }, 1000);
    }
});


// A utility function to prevent a function from being called too frequently
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Timer: only increments and saves while on a Shorts or Reels page
setInterval(() => {
    if (isShortFormVideo(window.location.href)) {
        timer++;
        if (timer % 10 === 0) {
            saveData();
        }
    }
}, 1000);

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // This part is unchanged
    if (message.type === "GET_SHORTS_COUNT") sendResponse({ count: shortsCount });
    else if (message.type === "GET_TIMER") sendResponse({ timer: timer });
    else if (message.type === "START_LIMIT_CHECK") {
        shortsLimit = parseInt(message.shortsLimit) || 0;
        chrome.storage.sync.set({ shortsLimit: shortsLimit });
    } else if (message.type === "RESET_COUNTERS") {
        shortsCount = 0;
        timer = 0;
        shortsWatched.clear();
        currentMemePhase = -1;
        saveData();
        sendResponse({ success: true });
    }
    return true;
});