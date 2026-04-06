class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('noproc_tasks')) || [];
        this.input = document.getElementById('task-input');
        this.addBtn = document.getElementById('add-task-btn');
        this.list = document.getElementById('tasks-list');
        this.countDisplay = document.getElementById('tasks-count');

        this.init();
    }

    init() {
        this.render();
        this.addBtn.addEventListener('click', () => this.addTask());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
    }

    addTask() {
        const text = this.input.value.trim();
        if (!text) return;

        const task = {
            id: Date.now(),
            text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.save();
        this.input.value = '';
        this.render();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                this.celebrate();
            }
            this.save();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('noproc_tasks', JSON.stringify(this.tasks));
    }

    celebrate() {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }

    render() {
        this.list.innerHTML = '';
        this.tasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `task-item glass ${task.completed ? 'completed' : ''}`;
            taskEl.innerHTML = `
                <div class="task-check">
                    <i data-lucide="${task.completed ? 'check-circle-2' : 'circle'}"></i>
                </div>
                <span class="task-text">${task.text}</span>
                <button class="task-delete">
                    <i data-lucide="trash-2"></i>
                </button>
            `;

            // Explicit listeners for better reliability
            taskEl.querySelector('.task-check').onclick = () => this.toggleTask(task.id);
            taskEl.querySelector('.task-delete').onclick = (e) => {
                e.stopPropagation();
                this.deleteTask(task.id);
            };

            this.list.appendChild(taskEl);
        });

        this.countDisplay.textContent = `${this.tasks.length} tasks`;
        lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});
