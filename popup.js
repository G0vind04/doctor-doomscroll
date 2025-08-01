chrome.tabs.query(
  {
    active: true,
    currentWindow: true
  },
  function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "GET_SHORTS_COUNT" }, function (response) {
      if (chrome.runtime.lastError) {
        document.getElementById("counter").textContent = "Could not fetch the count.";
        return;
      }
      const count = (response && response.count) || 0;
      document.getElementById("counter").textContent = `Shorts watched: ${count}`;
    });
    chrome.tabs.sendMessage(tabs[0].id, { type: "GET_TIMER" }, function (response) {
      if (chrome.runtime.lastError) {
        document.getElementById("timer").textContent = "Could not fetch the timer.";
        return;
      }
      const timer = (response && response.timer) || 0;
      document.getElementById("timer").textContent = `Seconds watched: ${timer}`;
    });
  }
);


document.addEventListener('DOMContentLoaded',()=>{
  const saveBtn = document.getElementById("saveBtn");
  const shortsLimitInput = document.getElementById("shortsLimit");
  const statusElement = document.getElementById("status");

  chrome.storage.sync.get(['shortsLimit'],(result)=>{
    if(result.shortsLimit !== undefined){
      shortsLimitInput.value = result.shortsLimit;
    }
  });

  saveBtn.addEventListener("click",()=>{
    const limit = parseInt(shortsLimitInput.value);

    if (isNaN(limit)) {
      statusElement.textContent = "Please enter a valid number.";
      return;
    }

    chrome.storage.sync.set({shortsLimit:limit},()=>{
      statusElement.textContent = "Limit saved";

    chome.tabs.query({active:true, currentWindow: true},(tabs)=>{
      if(tabs[0]){
        chrome.tabs.sendMessage(tabs[0].id,{
          type: "START_LIMIT_CHECK",
          shortsLimit: limit
        });
      }
    });

    setTimeout(() => {
      statusElement.textContent = "";
    }, 2000);

    })

  });
})
