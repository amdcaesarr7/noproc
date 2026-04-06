/**
 * NoProc — Settings Manager
 * Gradient presets, Custom wallpaper, Google Auth
 */

class SettingsManager {
    constructor() {
        this.overlay = null;
        this.currentGradient = localStorage.getItem('noproc_gradient') || 'aurora';
        this.customWallpaper = localStorage.getItem('noproc_wallpaper_url') || null;
        this.user = JSON.parse(localStorage.getItem('noproc_user') || 'null');

        this.gradients = [
            { id: 'aurora', name: 'Aurora', bg: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
            { id: 'sunset', name: 'Sunset', bg: 'linear-gradient(135deg, #0c0c1d, #1a0a2e, #2d1b3d)' },
            { id: 'ocean', name: 'Ocean', bg: 'linear-gradient(135deg, #020617, #0c1426, #0f172a)' },
            { id: 'midnight', name: 'Midnight', bg: 'linear-gradient(135deg, #000000, #0a0a0f, #111118)' },
            { id: 'nature', name: 'Nature', bg: 'linear-gradient(135deg, #021a0f, #0a1e15, #0f2920)' },
            { id: 'rose', name: 'Rose', bg: 'linear-gradient(135deg, #1a0a10, #2d0f1a, #3d1025)' },
        ];

        this.init();
    }

    init() {
        this.applyGradient(this.currentGradient);
        this.applyWallpaper();
        this.updateUserUI();

        const settingsBtns = document.querySelectorAll('.settings-btn');
        settingsBtns.forEach(btn => {
            btn.addEventListener('click', () => this.open());
        });
    }

    open() {
        if (this.overlay) this.overlay.remove();

        this.overlay = document.createElement('div');
        this.overlay.className = 'settings-overlay active';
        this.overlay.innerHTML = this.buildHTML();
        document.body.appendChild(this.overlay);

        // Re-init icons
        if (window.lucide) lucide.createIcons({ attrs: { class: '' }, nameAttr: 'data-lucide' });

        this.bindEvents();
    }

    close() {
        if (!this.overlay) return;
        this.overlay.classList.add('closing');
        setTimeout(() => {
            this.overlay.remove();
            this.overlay = null;
        }, 300);
    }

    buildHTML() {
        const gradientCards = this.gradients.map(g =>
            `<div class="gradient-swatch ${g.id === this.currentGradient ? 'active' : ''}" 
                  data-gradient="${g.id}" data-name="${g.name}" 
                  style="background: ${g.bg};"></div>`
        ).join('');

        const userSection = this.user
            ? `<div class="user-account-section">
                    <img src="${this.user.picture}" alt="${this.user.name}">
                    <div class="user-account-info">
                        <div class="name">${this.user.name}</div>
                        <div class="email">${this.user.email}</div>
                    </div>
                    <button class="logout-btn" id="settings-logout">Sign Out</button>
               </div>`
            : `<button class="google-signin-btn" id="settings-google-login">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G">
                    Sign in with Google
               </button>`;

        const wallpaperPreview = this.customWallpaper
            ? `<div class="wallpaper-preview active">
                    <img src="${this.customWallpaper}" alt="Wallpaper">
                    <button class="wallpaper-remove" id="remove-wallpaper">&times;</button>
               </div>`
            : `<div class="wallpaper-preview"></div>`;

        return `
            <div class="settings-card">
                <div class="settings-header">
                    <h2>Settings</h2>
                    <button class="settings-close" id="settings-close">
                        <i data-lucide="x"></i>
                    </button>
                </div>

                <div class="settings-section">
                    <h3>Account</h3>
                    ${userSection}
                </div>

                <div class="settings-section">
                    <h3>Background</h3>
                    <div class="gradient-grid">${gradientCards}</div>
                </div>

                <div class="settings-section">
                    <h3>Custom Wallpaper</h3>
                    <div class="wallpaper-upload" id="wallpaper-upload">
                        <i data-lucide="image-plus"></i>
                        <p>Upload Wallpaper</p>
                        <span class="hint">JPG, PNG · Max 5MB · Uploaded via ImgBB</span>
                    </div>
                    ${wallpaperPreview}
                    <input type="file" id="wallpaper-input" accept="image/*" hidden>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Close
        this.overlay.querySelector('#settings-close').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Gradient swatches
        this.overlay.querySelectorAll('.gradient-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                const id = swatch.dataset.gradient;
                this.applyGradient(id);
                this.overlay.querySelectorAll('.gradient-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                // Remove wallpaper when selecting a gradient
                this.removeWallpaper();
            });
        });

        // Wallpaper upload
        const uploadArea = this.overlay.querySelector('#wallpaper-upload');
        const fileInput = this.overlay.querySelector('#wallpaper-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleWallpaperUpload(e));

        // Remove wallpaper
        const removeBtn = this.overlay.querySelector('#remove-wallpaper');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeWallpaper();
                this.close();
                this.open(); // Refresh panel
            });
        }

        // Google Auth
        const loginBtn = this.overlay.querySelector('#settings-google-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.googleSignIn());
        }

        const logoutBtn = this.overlay.querySelector('#settings-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.googleSignOut());
        }
    }

    // ─── Gradient ───
    applyGradient(id) {
        this.currentGradient = id;
        localStorage.setItem('noproc_gradient', id);

        // Remove all gradient classes, then add the selected one
        const body = document.body;
        this.gradients.forEach(g => body.classList.remove(`gradient-${g.id}`));
        body.classList.add(`gradient-${id}`);
    }

    // ─── Wallpaper (ImgBB Upload · Permanent) ───
    async handleWallpaperUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB');
            return;
        }

        // Show uploading state
        const uploadArea = this.overlay?.querySelector('#wallpaper-upload');
        if (uploadArea) {
            uploadArea.innerHTML = '<p style="color: var(--accent-primary)">\u2728 Uploading...</p>';
        }

        try {
            const formData = new FormData();
            formData.append('image', file);
            const apiKey = import.meta.env.VITE_IMGBB_API_KEY || '0b67ff163b661ee9f618bba9d9751540';

            const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                this.customWallpaper = data.data.display_url;
                localStorage.setItem('noproc_wallpaper_url', this.customWallpaper);
                this.applyWallpaper();
                this.close();
                this.open(); // Refresh to show preview
            } else {
                alert('Upload failed. Check your ImgBB API key.');
                this.close();
                this.open();
            }
        } catch (err) {
            console.error('ImgBB upload error:', err);
            alert('Upload failed. Check your connection and API key.');
            this.close();
            this.open();
        }
    }

    applyWallpaper() {
        let wallpaperEl = document.querySelector('.wallpaper-bg');
        if (!wallpaperEl) {
            wallpaperEl = document.createElement('div');
            wallpaperEl.className = 'wallpaper-bg';
            const bgWrapper = document.querySelector('.bg-wrapper');
            if (bgWrapper) bgWrapper.appendChild(wallpaperEl);
        }

        if (this.customWallpaper) {
            wallpaperEl.style.backgroundImage = `url(${this.customWallpaper})`;
            wallpaperEl.classList.add('active');
        } else {
            wallpaperEl.classList.remove('active');
            wallpaperEl.style.backgroundImage = '';
        }
    }

    removeWallpaper() {
        this.customWallpaper = null;
        localStorage.removeItem('noproc_wallpaper_url');
        this.applyWallpaper();
    }

    // ─── Google Auth (GIS) ───
    googleSignIn() {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '809193127339-ce8a0jds7r5bdq8mel91vqi68vb5psg2.apps.googleusercontent.com';

        if (!window.google || !google.accounts) {
            // Load GIS library dynamically
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => this._initGIS(clientId);
            document.head.appendChild(script);
        } else {
            this._initGIS(clientId);
        }
    }

    _initGIS(clientId) {
        const client = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid profile email',
            callback: (response) => {
                if (response.access_token) {
                    this._fetchUserProfile(response.access_token);
                }
            },
        });
        client.requestAccessToken();
    }

    async _fetchUserProfile(token) {
        try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            this.user = {
                name: data.name,
                email: data.email,
                picture: data.picture,
                given_name: data.given_name
            };
            localStorage.setItem('noproc_user', JSON.stringify(this.user));
            this.updateUserUI();
            this.close();
            this.open(); // Refresh
        } catch (err) {
            console.error('Google Auth error:', err);
        }
    }

    googleSignOut() {
        this.user = null;
        localStorage.removeItem('noproc_user');
        this.updateUserUI();
        this.close();
        this.open(); // Refresh
    }

    updateUserUI() {
        // Update greeting with user name
        const greetingEl = document.getElementById('greeting');
        if (greetingEl) {
            const hour = new Date().getHours();
            let greeting = 'Good Morning';
            if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
            else if (hour >= 17 && hour < 21) greeting = 'Good Evening';
            else if (hour >= 21 || hour < 5) greeting = 'Good Night';

            if (this.user && this.user.given_name) {
                greetingEl.innerHTML = `${greeting}, <span class="user-name">${this.user.given_name}</span>`;
            } else {
                greetingEl.textContent = greeting;
            }
        }

        // Update sidebar avatar
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (!sidebarFooter) return;

        let avatarEl = sidebarFooter.querySelector('.user-avatar');
        if (this.user) {
            if (!avatarEl) {
                avatarEl = document.createElement('img');
                avatarEl.className = 'user-avatar';
                avatarEl.addEventListener('click', () => this.open());
                sidebarFooter.appendChild(avatarEl);
            }
            avatarEl.src = this.user.picture;
            avatarEl.alt = this.user.name;
        } else if (avatarEl) {
            avatarEl.remove();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});
