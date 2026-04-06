class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.toggleBtn = document.getElementById('theme-toggle');
        this.toggleIcon = document.getElementById('theme-icon');
        
        this.init();
    }

    init() {
        this.applyTheme();
        this.toggleBtn.addEventListener('click', () => this.toggle());
        
        // Shortcut 'O' for theme toggle
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'o') {
                this.toggle();
            }
        });
    }

    toggle() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    applyTheme() {
        document.body.className = this.theme + '-theme';
        this.toggleIcon.setAttribute('data-lucide', this.theme === 'dark' ? 'moon' : 'sun');
        lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});
