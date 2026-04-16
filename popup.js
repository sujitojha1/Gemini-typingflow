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
            const tabId = tabs[0].id;

            chrome.tabs.sendMessage(tabId, { action: "extract_content" }, (resp) => {
                if (!resp || !resp.payload) {
                    updateLoader('DOM Extraction Failed');
                    return;
                }

                updateLoader('Synthesizing with Gemini Flash Lite 3.0');
                chrome.runtime.sendMessage({ action: "proxy_gemini_api", payload: resp.payload }, (apiResp) => {
                    if (apiResp.error) {
                        updateLoader(`Error: ${apiResp.error}`);
                        return;
                    }

                    const json = apiResp.api_response;
                    updateLoader('Mounting Data Structure');
                    
                    chrome.tabs.sendMessage(tabId, { action: "mount_ui", data: json }, () => {
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
            chrome.tabs.sendMessage(tabs[0].id, { action: "open_overlay" });
        });
    });
});
