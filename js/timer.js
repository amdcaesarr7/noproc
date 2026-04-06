class Timer {
    constructor() {
        this.modes = {
            pomodoro: 25 * 60,
            'short-break': 5 * 60,
            'long-break': 15 * 60,
            stopwatch: 0
        };
        this.currentMode = 'pomodoro';
        this.timeLeft = this.modes[this.currentMode];
        this.isRunning = false;
        this.timerId = null;

        // UI Elements
        this.display = document.getElementById('timer-val');
        this.progressCircle = document.getElementById('timer-progress');
        this.statusLabel = document.getElementById('timer-status');
        this.toggleBtn = document.getElementById('timer-toggle');
        this.toggleIcon = document.getElementById('play-pause-icon');
        this.resetBtn = document.getElementById('timer-reset');
        this.settingsBtn = document.getElementById('timer-settings');
        this.modeBtns = document.querySelectorAll('.mode-btn');

        this.circumference = 140 * 2 * Math.PI;

        this.init();
    }

    init() {
        this.updateDisplay();

        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.resetBtn.addEventListener('click', () => this.reset());
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openSettings());
        }

        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setMode(btn.getAttribute('data-mode'));
            });
        });

        // Space shortcut
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    setMode(mode) {
        if (this.isRunning) this.pause();

        this.currentMode = mode;
        this.timeLeft = this.modes[mode];

        this.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
        });

        this.statusLabel.textContent = mode === 'pomodoro' ? 'Focusing' : (mode.includes('break') ? 'Resting' : 'Tracking');
        this.updateDisplay();
    }

    toggle() {
        if (this.isRunning) this.pause();
        else this.start();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.toggleIcon.setAttribute('data-lucide', 'pause');
        lucide.createIcons();

        this.timerId = setInterval(() => {
            if (this.currentMode === 'stopwatch') {
                this.timeLeft++;
            } else {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.complete();
                }
            }
            this.updateDisplay();
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.timerId);
        this.toggleIcon.setAttribute('data-lucide', 'play');
        lucide.createIcons();
    }

    reset() {
        this.pause();
        this.timeLeft = this.modes[this.currentMode];
        this.updateDisplay();
    }

    openSettings() {
        if (this.currentMode === 'stopwatch') return;

        const currentMins = Math.floor(this.modes[this.currentMode] / 60);
        const newMins = prompt(`Enter new duration for ${this.currentMode} (minutes):`, currentMins);

        if (newMins && !isNaN(newMins) && newMins > 0) {
            this.modes[this.currentMode] = parseInt(newMins) * 60;
            this.reset();
        }
    }

    complete() {
        this.pause();

        // Track session
        if (window.statsManager && this.currentMode !== 'stopwatch') {
            window.statsManager.addSession(this.modes[this.currentMode], this.currentMode);
        }

        this.timeLeft = 0;

        // Confetti!
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#a855f7', '#3b82f6']
        });

        // Alert sound or notification could go here
    }

    updateDisplay() {
        const h = Math.floor(this.timeLeft / 3600);
        const m = Math.floor((this.timeLeft % 3600) / 60);
        const s = this.timeLeft % 60;

        let timeStr = "";
        if (h > 0) {
            timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        } else {
            timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        this.display.textContent = timeStr;

        // Circle progress
        if (this.currentMode !== 'stopwatch') {
            const total = this.modes[this.currentMode];
            const percent = this.timeLeft / total;
            const offset = this.circumference * (1 - percent);
            this.progressCircle.style.strokeDashoffset = offset;
        } else {
            this.progressCircle.style.strokeDashoffset = 0;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.timer = new Timer();
});
