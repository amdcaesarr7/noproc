class StatsManager {
    constructor() {
        this.sessions = JSON.parse(localStorage.getItem('noproc_sessions')) || [];
        this.chart = null;

        this.init();
    }

    init() {
        this.renderStats();
        this.initChart();
    }

    addSession(duration, mode) {
        const session = {
            id: Date.now(),
            duration,
            mode,
            date: new Date().toISOString().split('T')[0]
        };
        this.sessions.push(session);
        localStorage.setItem('noproc_sessions', JSON.stringify(this.sessions));
        this.renderStats();
        this.updateChart();
    }

    renderStats() {
        const totalMinutes = this.sessions.reduce((acc, s) => acc + (s.duration / 60), 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor(totalMinutes % 60);

        const timeDisplay = document.getElementById('total-focus-time');
        const sessionDisplay = document.getElementById('total-sessions');

        if (timeDisplay) timeDisplay.textContent = `${hours}h ${minutes}m`;
        if (sessionDisplay) sessionDisplay.textContent = this.sessions.length;
    }

    initChart() {
        const ctx = document.getElementById('focus-chart');
        if (!ctx) return;

        const data = this.getChartData();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Minutes Focused',
                    data: data.values,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                    }
                }
            }
        });
    }

    getChartData() {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const values = last7Days.map(date => {
            return this.sessions
                .filter(s => s.date === date)
                .reduce((acc, s) => acc + (s.duration / 60), 0);
        });

        return {
            labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
            values
        };
    }

    updateChart() {
        if (!this.chart) return;
        const data = this.getChartData();
        this.chart.data.labels = data.labels;
        this.chart.data.datasets[0].data = data.values;
        this.chart.update();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.statsManager = new StatsManager();
});
