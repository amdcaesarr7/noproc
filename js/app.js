class App {
    constructor() {
        this.currentPage = 'home';
        this.navItems = document.querySelectorAll('.nav-item');
        this.pages = document.querySelectorAll('.page');
        this.isMobile = window.innerWidth <= 900;

        this.init();
    }

    init() {
        this.setupNavigation();
        this.startClock();
        this.updateGreeting();
        this.createBlobs();
        this.setupMusicControl();
        this.listenForMetadata();
        this.setupPlayerEventListeners();
        this.setupPlatformDetection();

        // Update greeting every minute
        setInterval(() => this.updateGreeting(), 60000);
    }

    // ─── Platform Detection ───
    setupPlatformDetection() {
        this._applyPlatform();
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 900;
            this._applyPlatform();
        });
    }

    _applyPlatform() {
        const miniPlayer = document.getElementById('mini-player');
        const spotifyLogin = document.getElementById('spotify-login');

        if (this.isMobile) {
            // Mobile: Show Spotify, hide extension controls
            document.body.classList.add('is-mobile');
            document.body.classList.remove('is-desktop');
            if (spotifyLogin) spotifyLogin.style.display = '';
        } else {
            // Desktop: Show extension controls, hide Spotify login
            document.body.classList.add('is-desktop');
            document.body.classList.remove('is-mobile');
            if (spotifyLogin) spotifyLogin.style.display = 'none';
        }
    }

    // ─── Music Control ───
    setupMusicControl() {
        this.extensionId = import.meta.env.VITE_EXTENSION_ID || "YOUR_EXTENSION_ID_HERE";
    }

    controlMusic(action) {
        console.log(`Music Control: ${action}`);

        // 1. Try Spotify Native (mobile priority)
        if (window.spotifyManager && window.spotifyManager.player) {
            if (action === 'playPause') window.spotifyManager.togglePlay();
            else if (action === 'next') window.spotifyManager.next();
            else if (action === 'previous') window.spotifyManager.previous();
            return;
        }

        // 2. Extension Bridge (desktop priority)
        const event = new CustomEvent('NOPROC_MUSIC_CONTROL', { detail: { action } });
        window.dispatchEvent(event);

        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ type: 'MUSIC_CONTROL', action });
        }
    }

    setupPlayerEventListeners() {
        const volSlider = document.getElementById('player-vol');
        if (volSlider) {
            volSlider.addEventListener('input', (e) => {
                if (window.spotifyManager && window.spotifyManager.player) {
                    window.spotifyManager.player.setVolume(e.target.value / 100);
                }
            });
        }
    }

    listenForMetadata() {
        window.addEventListener('NOPROC_MUSIC_METADATA', (e) => {
            this.updateMusicMetadata(e.detail);
        });
    }

    updateMusicMetadata(data) {
        if (!data) return;

        const titleEl = document.getElementById('player-title');
        const artistEl = document.getElementById('player-artist');
        const coverEl = document.getElementById('player-cover');
        const glowEl = document.getElementById('player-glow');

        if (titleEl) titleEl.textContent = data.title || 'Unknown Title';
        if (artistEl) artistEl.textContent = data.artist || 'Unknown Artist';
        if (coverEl && data.artwork) {
            coverEl.src = data.artwork;
            if (glowEl) {
                glowEl.style.backgroundColor = 'transparent';
                glowEl.style.backgroundImage = `url(${data.artwork})`;
                glowEl.style.backgroundSize = 'cover';
            }
        }
    }

    // ─── Navigation ───
    setupNavigation() {
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageId = item.getAttribute('data-page');
                this.navigateTo(pageId);
            });
        });
    }

    navigateTo(pageId) {
        if (this.currentPage === pageId) return;

        // Update Nav
        this.navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-page') === pageId);
        });

        // Transition Pages
        const currentActive = document.querySelector('.page.active');
        if (currentActive) {
            currentActive.classList.remove('active');
            currentActive.classList.add('page-exit');

            setTimeout(() => {
                currentActive.classList.remove('page-exit');
                const nextActive = document.getElementById(`${pageId}-page`);
                if (nextActive) nextActive.classList.add('active');
                this.currentPage = pageId;
            }, 300);
        } else {
            const nextActive = document.getElementById(`${pageId}-page`);
            if (nextActive) nextActive.classList.add('active');
            this.currentPage = pageId;
        }
    }

    // ─── Clock ───
    startClock() {
        const headerClock = document.getElementById('header-clock');
        const largeClock = document.getElementById('large-clock');
        const dateDisplay = document.getElementById('date-display');

        const update = () => {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            const s = String(now.getSeconds()).padStart(2, '0');

            if (headerClock) headerClock.textContent = `${h}:${m}`;
            if (largeClock) largeClock.textContent = `${h}:${m}:${s}`;

            if (dateDisplay) {
                const options = { weekday: 'long', month: 'long', day: 'numeric' };
                dateDisplay.textContent = now.toLocaleDateString('en-US', options);
            }
        };

        update();
        setInterval(update, 1000);
    }

    // ─── Greeting ───
    updateGreeting() {
        // If settingsManager exists and has updated the greeting, skip.
        if (window.settingsManager && window.settingsManager.user) {
            window.settingsManager.updateUserUI();
            return;
        }

        const hour = new Date().getHours();
        const greetingEl = document.getElementById('greeting');
        let greeting = 'Good Morning';

        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
        else if (hour >= 17 && hour < 21) greeting = 'Good Evening';
        else if (hour >= 21 || hour < 5) greeting = 'Good Night';

        if (greetingEl) greetingEl.textContent = greeting;
    }

    // ─── Background Blobs ───
    createBlobs() {
        const container = document.getElementById('blobs-container');
        if (!container) return;

        const colors = [
            'var(--blob-1, var(--gradient-1))',
            'var(--blob-2, var(--gradient-2))',
            'var(--blob-3, var(--gradient-3))'
        ];

        const count = 6;
        for (let i = 0; i < count; i++) {
            const blob = document.createElement('div');
            blob.className = 'blob';

            const size = Math.random() * 350 + 200;
            blob.style.width = `${size}px`;
            blob.style.height = `${size}px`;
            blob.style.left = `${Math.random() * 100}%`;
            blob.style.top = `${Math.random() * 100}%`;
            blob.style.background = `radial-gradient(circle, ${colors[i % colors.length]} 0%, transparent 70%)`;

            const duration = Math.random() * 25 + 15;
            const delay = Math.random() * -20;
            blob.style.animation = `blobFloat ${duration}s ease-in-out ${delay}s infinite alternate`;

            container.appendChild(blob);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
