document.addEventListener('DOMContentLoaded', () => {
  const btnBeautify = document.getElementById('btn-beautify');
  const btnType = document.getElementById('btn-type');
  const btnSave = document.getElementById('btn-save');

  function enableButtons() {
    btnType.classList.remove('disabled');
    btnType.disabled = false;
    btnSave.classList.remove('disabled');
    btnSave.disabled = false;
  }

  function sendMessageWithInjection(tabId, msg, callback) {
    chrome.tabs.sendMessage(tabId, msg, (resp) => {
      if (chrome.runtime.lastError) {
        // The content script isn't running on this tab yet, let's inject it.
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        }).then(() => {
          return chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ['content.css']
          });
        }).then(() => {
          // Retry the internal message after successful injection
          chrome.tabs.sendMessage(tabId, msg, callback);
        }).catch(err => console.error("Injection failed: ", err));
      } else if (callback) {
        callback(resp);
      }
    });
  }

  // Check state on load
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (!tabs[0]) return;
    
    // Quick load metrics
    try {
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
      chrome.storage.local.get(['lifetimeChars', domain], (res) => {
        document.getElementById('m-chars').innerText = res.lifetimeChars || 0;
        document.getElementById('m-time').innerText = (res[domain] || 0) + 'm';
      });
    } catch(e){}

    sendMessageWithInjection(tabs[0].id, {action: "ping"}, (resp) => {
      if (resp && resp.hasNuggets) {
        enableButtons();
      }
    });
  });

  // Button 1: Beautify
  btnBeautify.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs[0]) return;
      sendMessageWithInjection(tabs[0].id, {action: "beautify"}, (resp) => {
        if (resp && resp.success) enableButtons();
      });
    });
  });

  // Button 2: Typing Flow
  btnType.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs[0]) return;
      sendMessageWithInjection(tabs[0].id, {action: "type"});
    });
  });

  // Button 3: Save HTML
  btnSave.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs[0]) return;
      sendMessageWithInjection(tabs[0].id, {action: "save"});
    });
  });
});
