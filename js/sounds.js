class SoundManager {
    constructor() {
        this.sounds = [
            { id: 'rain', name: 'Gentle Rain', icon: 'cloud-rain', url: 'assets/rain-sound.mp3' },
            { id: 'white-noise', name: 'White Noise', icon: 'wind', url: 'assets/white-noise.mp3' },
            { id: 'forest', name: 'Forest Birds', icon: 'trees', url: 'assets/forestbirds.mp3' },
            { id: 'waves', name: 'Ocean Waves', icon: 'waves', url: 'assets/ocean-waves.mp3' }
        ];
        this.playingSounds = new Map(); // id -> Audio object
        this.grid = document.getElementById('sounds-grid');

        this.init();
    }

    init() {
        this.render();
    }

    toggleSound(id) {
        const sound = this.sounds.find(s => s.id === id);
        const card = document.querySelector(`.sound-card[data-id="${id}"]`);

        if (this.playingSounds.has(id)) {
            const audio = this.playingSounds.get(id);
            audio.pause();
            this.playingSounds.delete(id);
            card.classList.remove('playing');
        } else {
            const audio = new Audio(sound.url);
            audio.loop = true;
            audio.play();
            this.playingSounds.set(id, audio);
            card.classList.add('playing');
        }
    }

    setVolume(id, volume) {
        if (this.playingSounds.has(id)) {
            this.playingSounds.get(id).volume = volume;
        }
    }

    render() {
        if (!this.grid) return;
        this.grid.innerHTML = '';
        this.sounds.forEach(sound => {
            const card = document.createElement('div');
            card.className = 'sound-card glass';
            card.setAttribute('data-id', sound.id);
            card.innerHTML = `
                <div class="sound-icon">
                    <i data-lucide="${sound.icon}"></i>
                </div>
                <div class="sound-info">
                    <h4>${sound.name}</h4>
                </div>
                <div class="sound-volume" onclick="event.stopPropagation()">
                    <input type="range" min="0" max="1" step="0.1" value="0.5" oninput="window.soundManager.setVolume('${sound.id}', this.value)">
                </div>
            `;
            card.onclick = () => this.toggleSound(sound.id);
            this.grid.appendChild(card);
        });
        lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.soundManager = new SoundManager();
});
