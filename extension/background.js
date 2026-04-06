/**
 * NoProc Extension — Background Service Worker
 * Polls audible tabs for real-time MediaSession metadata every 1.5s
 * and pushes updates to all open NoProc dashboard tabs.
 */

// ─── State ───────────────────────────────────────────────
let cachedMetadata = null;

// ─── Helpers ─────────────────────────────────────────────

/** Returns true if a tab is likely playing music */
function isMusicTab(tab) {
    if (!tab || !tab.url) return false;
    const musicDomains = [
        'music.youtube.com',
        'youtube.com/watch',
        'youtube.com/shorts',
        'spotify.com',
        'soundcloud.com',
        'tidal.com',
        'deezer.com',
        'music.apple.com',
        'pandora.com',
        'bandcamp.com',
        'twitch.tv',
    ];
    return musicDomains.some(d => tab.url.includes(d)) || tab.audible === true;
}

/** Sends a message to every NoProc dashboard tab */
function broadcastToNoProcTabs(message) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (!tab.url) return;
            const isNoProc =
                tab.url.includes('localhost') ||
                tab.url.includes('127.0.0.1') ||
                tab.url.includes('/NoProc/') ||
                tab.url.toLowerCase().includes('noproc') ||
                tab.url.includes('index.html');
            if (isNoProc) {
                chrome.tabs.sendMessage(tab.id, message).catch(() => {});
            }
        });
    });
}

// ─── Injected into music tabs: reads MediaSession ─────────
function extractMediaSession() {
    try {
        const ms = navigator.mediaSession;
        if (!ms || !ms.metadata) return null;
        const m = ms.metadata;

        const artwork = m.artwork && m.artwork.length > 0
            ? m.artwork[m.artwork.length - 1].src
            : null;

        const mediaEls = Array.from(document.querySelectorAll('video, audio'));
        const active = mediaEls.find(el => !el.paused && !el.ended && el.readyState > 2);
        const isPlaying = !!active;
        const currentTime = active ? active.currentTime : 0;
        const duration = active ? active.duration : 0;

        return {
            title: m.title || '',
            artist: m.artist || '',
            album: m.album || '',
            artwork,
            isPlaying,
            currentTime: isFinite(currentTime) ? currentTime : 0,
            duration: isFinite(duration) ? duration : 0,
        };
    } catch (_) {
        return null;
    }
}

// ─── Injected into music tabs: executes playback control ──
function executeControl(action) {
    const mediaEls = Array.from(document.querySelectorAll('video, audio'));
    const active = mediaEls.find(el => el.readyState > 0) || mediaEls[0];

    if (action === 'playPause') {
        if (active) {
            active.paused ? active.play() : active.pause();
        } else {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'MediaPlayPause', bubbles: true }));
        }
        return;
    }

    if (action === 'next') {
        try { navigator.mediaSession.callAction?.('nexttrack'); } catch (_) {}
        const btn = document.querySelector(
            '.next-button, .ytp-next-button, [aria-label="Next"], [title="Next"], ' +
            '[data-testid="control-button-skip-forward"], .playerControls__next, ' +
            '[aria-label="Skip to next track"]'
        );
        if (btn) btn.click();
        return;
    }

    if (action === 'previous') {
        try { navigator.mediaSession.callAction?.('previoustrack'); } catch (_) {}
        const btn = document.querySelector(
            '.previous-button, .ytp-prev-button, [aria-label="Previous"], [title="Previous"], ' +
            '[data-testid="control-button-skip-back"], .playerControls__prev, ' +
            '[aria-label="Skip to previous track"]'
        );
        if (btn) btn.click();
        return;
    }
}

// ─── Main Poll Loop ───────────────────────────────────────
async function poll() {
    let tabs;
    try { tabs = await chrome.tabs.query({}); }
    catch (_) { return; }

    const musicTabs = tabs.filter(isMusicTab);

    for (const tab of musicTabs) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: false },
                func: extractMediaSession,
            });
            const result = results?.[0]?.result;
            if (!result || !result.title) continue;

            cachedMetadata = result;
            broadcastToNoProcTabs({ type: 'MUSIC_METADATA', metadata: result });
            break; // Use the first responding music tab
        } catch (_) {
            // chrome://, PDFs, restricted pages — skip silently
        }
    }
}

setInterval(poll, 1500);
poll(); // Immediate first run

// ─── Message Handler ─────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // Popup asks for latest cached metadata
    if (request.type === 'GET_METADATA') {
        sendResponse({ metadata: cachedMetadata });
        return true;
    }

    // Dashboard or popup sends a playback control action
    if (request.type === 'MUSIC_CONTROL') {
        chrome.tabs.query({}, async (tabs) => {
            const musicTabs = tabs.filter(isMusicTab);
            for (const tab of musicTabs) {
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id, allFrames: false },
                        func: executeControl,
                        args: [request.action],
                    });
                    break;
                } catch (_) {}
            }
        });
        return true;
    }
});
