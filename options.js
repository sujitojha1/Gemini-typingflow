document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');

    // Load saved API key
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
        }
    });

    // Save API key
    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
            statusDiv.textContent = 'Settings saved successfully!';
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);
        });
    });
});
