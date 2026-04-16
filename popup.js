document.addEventListener('DOMContentLoaded', () => {
    const btnExtract = document.getElementById('btn-extract');
    const btnType = document.getElementById('btn-type');
    const loader = document.getElementById('loader');

    function updateLoader(msg) {
        loader.style.display = 'block';
        loader.innerText = `> status: ${msg}...`;
    }
    
    function hideLoader() { loader.style.display = 'none'; }

    btnExtract.addEventListener('click', () => {
        btnExtract.disabled = true;
        updateLoader('Parsing Sequence');

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs || tabs.length === 0) {
                updateLoader('Error: No active tab found');
                btnExtract.disabled = false;
                return;
            }
            
            const tabId = tabs[0].id;

            chrome.tabs.sendMessage(tabId, { action: "extract_content" }, (resp) => {
                // Handle the case where content.js isn't running on the page yet
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    updateLoader('Init Failed: Please refresh the web page & try again!');
                    btnExtract.disabled = false;
                    return;
                }

                if (!resp || !resp.payload) {
                    updateLoader('DOM Extraction Failed');
                    btnExtract.disabled = false;
                    return;
                }

                updateLoader('Synthesizing with Gemini Flash Lite 3.1 Preview');
                chrome.runtime.sendMessage({ action: "proxy_gemini_api", payload: resp.payload }, (apiResp) => {
                    if (chrome.runtime.lastError) {
                        updateLoader('Error: Background Service Worker offline');
                        btnExtract.disabled = false;
                        return;
                    }

                    if (apiResp.error) {
                        updateLoader(`Error: ${apiResp.error}`);
                        btnExtract.disabled = false;
                        return;
                    }

                    const json = apiResp.api_response;
                    updateLoader('Rendering Image Assets via Flash 2.5');
                    
                    chrome.tabs.sendMessage(tabId, { action: "mount_ui", data: json }, () => {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError.message);
                        }
                        hideLoader();
                        btnType.disabled = false;
                        btnExtract.innerText = "> re-run extraction()";
                        btnExtract.disabled = false;
                    });
                });
            });
        });
    });

    btnType.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "open_overlay" }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Overlay error:", chrome.runtime.lastError.message);
                }
            });
        });
    });
});
