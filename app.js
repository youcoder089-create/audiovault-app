const BACKEND_API = "https://YOUR_BACKEND_URL.com/api/v1/extract-audio";
const statusBox = document.getElementById('status-box');
const downloadBtn = document.getElementById('downloadBtn');

// 1. Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}

// 2. Handle URL Context (Share Target + Manual Actions)
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    
    // Check if opened from long-press shortcut "App Info"
    if (params.get('action') === 'info') {
        toggleInfo();
    }

    // Check if shared from YouTube
    if (params.get('shared')) {
        const text = params.get('text') || params.get('url') || '';
        const match = text.match(/(https?:\/\/[^\s]+)/g);
        if (match) {
            document.getElementById('manualUrl').value = match[0];
            triggerDownload(match[0]);
        }
    }
});

// 3. Manual Paste Download Trigger
downloadBtn.onclick = () => {
    const url = document.getElementById('manualUrl').value.trim();
    if (url) triggerDownload(url);
    else updateStatus("Please paste a valid URL first.");
};

async function triggerDownload(videoUrl) {
    updateStatus("Initializing backend extraction...", true);
    downloadBtn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_API}?url=${encodeURIComponent(videoUrl)}`);
        if (!response.ok) throw new Error("Server rejected request.");

        updateStatus("Streaming to device storage...");
        
        // Blobs bypass traditional RAM limits for larger files
        const blob = await response.blob();
        const diskUrl = window.URL.createObjectURL(blob);
        
        const anchor = document.createElement('a');
        anchor.href = diskUrl;
        anchor.download = `AV_${Date.now()}.mp3`;
        document.body.appendChild(anchor);
        anchor.click();
        
        window.URL.revokeObjectURL(diskUrl);
        document.body.removeChild(anchor);
        updateStatus("Success! Check your Downloads folder.");
        
    } catch (e) {
        updateStatus(`Error: ${e.message}`);
    } finally {
        downloadBtn.disabled = false;
    }
}

function updateStatus(msg, show = true) {
    statusBox.innerText = msg;
    statusBox.style.display = show ? 'block' : 'none';
}

function toggleInfo() {
    const modal = document.getElementById('infoModal');
    modal.classList.toggle('active');
    
    if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(est => {
            const used = (est.usage / (1024 * 1024)).toFixed(2);
            document.getElementById('storageInfo').innerText = `App Data Cache: ${used} MB`;
        });
    }
}