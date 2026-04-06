/**
 * Spotify Integration for NoProc
 * Updated for PKCE Flow and Localhost support
 */

class SpotifyManager {
    constructor(clientId) {
        this.clientId = clientId;
        this.accessToken = localStorage.getItem('spotify_token');
        this.player = null;
        this.deviceId = null;

        this.init();
    }

    async init() {
        const loginBtn = document.getElementById('spotify-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.login());
            if (this.accessToken) {
                loginBtn.innerHTML = '<i data-lucide="check"></i> <span>Spotify Connected</span>';
                loginBtn.classList.add('connected');
                if (window.lucide) lucide.createIcons();
                this.loadSDK();
            }
        }

        // Check for "code" in URL (Authorization Code Flow with PKCE)
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
            await this.handleAuthCode(code);
        }
    }

    // Helper for PKCE: Generate random string
    generateRandomString(length) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    // Helper for PKCE: Hash code verifier
    async generateCodeChallenge(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    async login() {
        // IMPORTANT: Spotify DOES NOT allow file:// redirect URIs.
        // You MUST run this on http://localhost (e.g. using VS Code Live Server or 'npx serve')
        const redirectUri = window.location.origin + window.location.pathname;

        if (window.location.protocol === 'file:') {
            alert("Spotify Integration requires a local server.\n\nPlease open this project using VS Code 'Live Server' or run 'npx serve' in the folder.\n\nSpotify does not allow redirecting back to 'file://' URLs for security.");
            return;
        }

        const verifier = this.generateRandomString(128);
        const challenge = await this.generateCodeChallenge(verifier);

        localStorage.setItem('spotify_verifier', verifier);

        const scopes = [
            'streaming',
            'user-read-email',
            'user-read-private',
            'user-read-playback-state',
            'user-modify-playback-state'
        ];

        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            code_challenge_method: 'S256',
            code_challenge: challenge,
            scope: scopes.join(' '),
        });

        window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    }

    async handleAuthCode(code) {
        const verifier = localStorage.getItem('spotify_verifier');
        const redirectUri = window.location.origin + window.location.pathname;

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                code_verifier: verifier,
            }),
        });

        const data = await response.json();
        if (data.access_token) {
            this.accessToken = data.access_token;
            localStorage.setItem('spotify_token', data.access_token);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            location.reload();
        }
    }

    loadSDK() {
        if (window.Spotify) return; // Already loaded

        window.onSpotifyWebPlaybackSDKReady = () => {
            this.player = new Spotify.Player({
                name: 'NoProc Dashboard',
                getOAuthToken: cb => { cb(this.accessToken); },
                volume: 0.8
            });

            this.player.addListener('ready', ({ device_id }) => {
                console.log('Spotify Player Ready', device_id);
                this.deviceId = device_id;
            });

            this.player.addListener('player_state_changed', state => {
                if (!state) return;
                const track = state.track_window.current_track;
                window.dispatchEvent(new CustomEvent('NOPROC_MUSIC_METADATA', {
                    detail: {
                        title: track.name,
                        artist: track.artists.map(a => a.name).join(', '),
                        artwork: track.album.images[0].url
                    }
                }));
                this.updateProgressBar(state.position, state.duration);
            });

            this.player.connect();
        };

        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
    }

    updateProgressBar(pos, duration) {
        const fill = document.getElementById('p-fill');
        const current = document.getElementById('p-current');
        const total = document.getElementById('p-total');

        if (fill) fill.style.width = `${(pos / duration) * 100}%`;
        if (current) current.textContent = this.formatTime(pos);
        if (total) total.textContent = this.formatTime(duration);
    }

    formatTime(ms) {
        const sec = Math.floor(ms / 1000);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    togglePlay() {
        if (this.player) this.player.togglePlay();
    }

    next() {
        if (this.player) this.player.nextTrack();
    }

    previous() {
        if (this.player) this.player.previousTrack();
    }
}

// Initialize
window.addEventListener('load', () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'fd83e58cb3de437e9f9504eb504c7a27';
    window.spotifyManager = new SpotifyManager(clientId);
});
