document.addEventListener('DOMContentLoaded', () => {
    const btnExtract = document.getElementById('btn-extract');
    const btnType = document.getElementById('btn-type');
    const btnSave = document.getElementById('btn-save');
    const loader = document.getElementById('loader');
    const optionsLink = document.getElementById('optionsLink');
  
    optionsLink.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  
    function sendMessageWithInjection(tabId, msg, callback) {
      chrome.tabs.sendMessage(tabId, msg, (resp) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] })
            .then(() => chrome.tabs.sendMessage(tabId, msg, callback))
            .catch(err => console.error(err));
        } else if (callback) {
          callback(resp);
        }
      });
    }
  
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs[0]) return;
      sendMessageWithInjection(tabs[0].id, {action: "ping"}, (resp) => {
        if (resp && resp.hasNuggets) {
          btnType.disabled = false;
          btnSave.disabled = false;
        }
      });
    });
  
    btnExtract.addEventListener('click', () => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs[0]) return;
        btnExtract.disabled = true;
        loader.style.display = 'block';
        loader.innerText = 'Extracting page text...';
  
        sendMessageWithInjection(tabs[0].id, {action: "extract_text"}, (resp) => {
          if (!resp || !resp.text) {
            loader.innerText = 'Failed to extract text.';
            btnExtract.disabled = false;
            return;
          }
  
          loader.innerText = 'Calling Gemini 1.5...';
          chrome.runtime.sendMessage({ action: "summarize", text: resp.text }, (apiResp) => {
            if (apiResp.error) {
              loader.innerText = 'Error: ' + apiResp.error;
              btnExtract.disabled = false;
              return;
            }
  
            loader.innerText = 'Success! Rendering...';
            sendMessageWithInjection(tabs[0].id, { action: "beautify", nuggets: apiResp.nuggets }, (res) => {
              if (res && res.success) {
                  loader.style.display = 'none';
                  btnExtract.disabled = false;
                  btnType.disabled = false;
                  btnSave.disabled = false;
              }
            });
          });
        });
      });
    });
  
    btnType.addEventListener('click', () => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs[0]) return;
        sendMessageWithInjection(tabs[0].id, {action: "type"});
      });
    });
  
    btnSave.addEventListener('click', () => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs[0]) return;
        sendMessageWithInjection(tabs[0].id, {action: "save"});
      });
    });
  });
