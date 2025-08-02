// DEBUG: Let's confirm the script is running
console.log("results.js script started.");

chrome.storage.sync.get(['timer'], (result) => {
  // DEBUG: Check for errors during the API call (this is very important!)
  if (chrome.runtime.lastError) {
    console.error("Error fetching from chrome.storage:", chrome.runtime.lastError.message);
    document.getElementById('result').textContent = "Error: Could not retrieve data from storage.";
    return;
  }

  // DEBUG: Log the entire result object returned from storage
  console.log("Data received from chrome.storage.sync:", result);

  const totalSeconds = result.timer || 0;

  // DEBUG: Log the final value being used for calculations
  console.log("Value of totalSeconds after processing:", totalSeconds);

  const resultDiv = document.getElementById('result');

  if (totalSeconds === 0) {
    resultDiv.textContent = "No scrolling time data found. Go waste some time first!";
    return;
  }

  // Define absurd time units in seconds
  const absurdUnits = [
    { name: "Instagram Story Viewings", seconds: 6 },,
    { name: "Microwave Popcorn Pops", seconds: 0.7 },
    { name: "Full \"Baby Shark\" Songs Played", seconds: 136 },
    { name: "Netflix \"Are You Still Watching\" Popups", seconds: 3 * 3600 },
    { name: "Washing Machine Spin Cycles", seconds: 2700 },
    { name: "Legendary Fortnite Dances", seconds: 5 },
    { name: "Times you could have blinked", seconds: 5 }
  ];

  // Calculate and format absurd equivalents
  const results = absurdUnits.map(unit => {
    const count = parseFloat((totalSeconds / unit.seconds).toFixed(2));
    return `<li>${count} ${unit.name}</li>`;
  }).join('');

  // Show results in the DOM
  resultDiv.innerHTML = `
    <ul>
      ${results}
    </ul>
    <p class="normal-time">(That's ${totalSeconds} seconds of your life wasted in boring normal units.)</p>
  `;
});