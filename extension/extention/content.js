/**
 * NoProc Content Script — Page Bridge
 * Injected into the NoProc dashboard tab.
 * Relays metadata FROM the background → page (custom event)
 * Relays music controls FROM the page → background (chrome.runtime)
 */

// ─── 1. Relay metadata from background → NoProc page ─────
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'MUSIC_METADATA') {
        window.dispatchEvent(new CustomEvent('NOPROC_MUSIC_METADATA', {
            detail: message.metadata,
        }));
    }
});

// ─── 2. Relay music controls from NoProc page → background ─
window.addEventListener('NOPROC_MUSIC_CONTROL', (event) => {
    chrome.runtime.sendMessage({
        type: 'MUSIC_CONTROL',
        action: event.detail.action,
    });
});

console.log('[NoProc Extension] Bridge active ✓');
