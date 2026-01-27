// ===== Task Dashboard App =====

// Data Store
let tasks = JSON.parse(localStorage.getItem('lovarTasks')) || [];

// DOM Elements
const elements = {
    newTaskBtn: document.getElementById('newTaskBtn'),
    taskModal: document.getElementById('taskModal'),
    detailModal: document.getElementById('detailModal'),
    closeModal: document.getElementById('closeModal'),
    closeDetailModal: document.getElementById('closeDetailModal'),
    cancelBtn: document.getElementById('cancelBtn'),
    taskForm: document.getElementById('taskForm'),
    taskProgress: document.getElementById('taskProgress'),
    progressValue: document.getElementById('progressValue'),
    currentDate: document.getElementById('currentDate'),
    modalTitle: document.getElementById('modalTitle'),
    taskId: document.getElementById('taskId'),
    deleteTaskBtn: document.getElementById('deleteTaskBtn'),
    editTaskBtn: document.getElementById('editTaskBtn'),
    
    // Stats
    pendingCount: document.getElementById('pendingCount'),
    activeCount: document.getElementById('activeCount'),
    completedCount: document.getElementById('completedCount'),
    totalCount: document.getElementById('totalCount'),
    
    // Column counts
    pendingColumnCount: document.getElementById('pendingColumnCount'),
    activeColumnCount: document.getElementById('activeColumnCount'),
    completedColumnCount: document.getElementById('completedColumnCount'),
    
    // Task lists
    pendingTasks: document.getElementById('pendingTasks'),
    activeTasks: document.getElementById('activeTasks'),
    completedTasks: document.getElementById('completedTasks'),
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    renderTasks();
    setupEventListeners();
});

// Update current date
function updateDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    elements.currentDate.textContent = now.toLocaleDateString('zh-TW', options);
}

// Setup Event Listeners
function setupEventListeners() {
    // New task button
    elements.newTaskBtn.addEventListener('click', () => openModal());
    
    // Close modals
    elements.closeModal.addEventListener('click', () => closeModal());
    elements.closeDetailModal.addEventListener('click', () => closeDetailModal());
    elements.cancelBtn.addEventListener('click', () => closeModal());
    
    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            closeModal();
            closeDetailModal();
        });
    });
    
    // Form submit
    elements.taskForm.addEventListener('submit', handleSubmit);
    
    // Progress slider
    elements.taskProgress.addEventListener('input', (e) => {
        elements.progressValue.textContent = e.target.value;
    });
    
    // Delete and Edit buttons
    elements.deleteTaskBtn.addEventListener('click', handleDelete);
    elements.editTaskBtn.addEventListener('click', handleEdit);
    
    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeDetailModal();
        }
        if (e.key === 'n' && e.ctrlKey) {
            e.preventDefault();
            openModal();
        }
    });
}

// Open modal for new task
function openModal(task = null) {
    elements.modalTitle.textContent = task ? '編輯任務' : '新建任務';
    elements.taskModal.classList.add('active');
    
    if (task) {
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskDesc').value = task.description || '';
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskDue').value = task.dueDate || '';
        document.getElementById('taskProgress').value = task.progress || 0;
        elements.progressValue.textContent = task.progress || 0;
        elements.taskId.value = task.id;
    } else {
        elements.taskForm.reset();
        elements.progressValue.textContent = '0';
        elements.taskId.value = '';
    }
}

// Close modal
function closeModal() {
    elements.taskModal.classList.remove('active');
    elements.taskForm.reset();
    elements.progressValue.textContent = '0';
    elements.taskId.value = '';
}

// Close detail modal
function closeDetailModal() {
    elements.detailModal.classList.remove('active');
}

// Handle form submit
function handleSubmit(e) {
    e.preventDefault();
    
    const taskData = {
        id: elements.taskId.value || generateId(),
        name: document.getElementById('taskName').value,
        description: document.getElementById('taskDesc').value,
        category: document.getElementById('taskCategory').value,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        dueDate: document.getElementById('taskDue').value,
        progress: parseInt(document.getElementById('taskProgress').value),
        createdAt: elements.taskId.value ? 
            tasks.find(t => t.id === elements.taskId.value)?.createdAt : 
            new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (elements.taskId.value) {
        // Update existing task
        const index = tasks.findIndex(t => t.id === elements.taskId.value);
        if (index !== -1) {
            tasks[index] = taskData;
        }
    } else {
        // Add new task
        tasks.push(taskData);
    }
    
    saveTasks();
    renderTasks();
    closeModal();
}

// Handle delete
function handleDelete() {
    const taskId = elements.detailModal.dataset.taskId;
    if (confirm('確定要刪除這個任務嗎？')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        closeDetailModal();
    }
}

// Handle edit
function handleEdit() {
    const taskId = elements.detailModal.dataset.taskId;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        closeDetailModal();
        openModal(task);
    }
}

// Generate unique ID
function generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('lovarTasks', JSON.stringify(tasks));
}

// Render all tasks
function renderTasks() {
    // Clear task lists
    elements.pendingTasks.innerHTML = '';
    elements.activeTasks.innerHTML = '';
    elements.completedTasks.innerHTML = '';
    
    // Count tasks
    const counts = {
        pending: 0,
        active: 0,
        completed: 0
    };
    
    // Render each task
    tasks.forEach(task => {
        const card = createTaskCard(task);
        
        switch (task.status) {
            case 'pending':
                elements.pendingTasks.appendChild(card);
                counts.pending++;
                break;
            case 'active':
                elements.activeTasks.appendChild(card);
                counts.active++;
                break;
            case 'completed':
                elements.completedTasks.appendChild(card);
                counts.completed++;
                break;
        }
    });
    
    // Update stats
    elements.pendingCount.textContent = counts.pending;
    elements.activeCount.textContent = counts.active;
    elements.completedCount.textContent = counts.completed;
    elements.totalCount.textContent = tasks.length;
    
    elements.pendingColumnCount.textContent = counts.pending;
    elements.activeColumnCount.textContent = counts.active;
    elements.completedColumnCount.textContent = counts.completed;
}

// Create task card element
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.id = task.id;
    
    const priorityEmoji = {
        high: '🔴',
        medium: '🟡',
        low: '🟢'
    };
    
    const categoryLabels = {
        amazon: '🛒 亞馬遜',
        ai: '🤖 AI',
        data: '📊 數據',
        other: '📌 其他'
    };
    
    card.innerHTML = `
        <div class="task-card-header">
            <span class="task-card-title">${escapeHtml(task.name)}</span>
            <span class="task-card-priority">${priorityEmoji[task.priority]}</span>
        </div>
        ${task.description ? `<p class="task-card-desc">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-card-meta">
            <span class="task-card-category">${categoryLabels[task.category]}</span>
            ${task.dueDate ? `<span>📅 ${task.dueDate}</span>` : ''}
        </div>
        ${task.progress > 0 ? `
            <div class="task-card-progress">
                <div class="task-card-progress-bar" style="width: ${task.progress}%"></div>
            </div>
        ` : ''}
    `;
    
    card.addEventListener('click', () => showTaskDetail(task));
    
    return card;
}

// Show task detail
function showTaskDetail(task) {
    elements.detailModal.dataset.taskId = task.id;
    document.getElementById('detailTitle').textContent = task.name;
    
    const priorityLabels = {
        high: '🔴 高',
        medium: '🟡 中',
        low: '🟢 低'
    };
    
    const statusLabels = {
        pending: '📝 待開始',
        active: '🔄 進行中',
        completed: '✅ 已完成'
    };
    
    const categoryLabels = {
        amazon: '🛒 亞馬遜運營',
        ai: '🤖 AI 工作流',
        data: '📊 數據分析',
        other: '📌 其他'
    };
    
    document.getElementById('taskDetail').innerHTML = `
        <div class="task-detail-item">
            <div class="task-detail-label">描述</div>
            <div class="task-detail-value">${task.description || '無描述'}</div>
        </div>
        <div class="task-detail-item">
            <div class="task-detail-label">分類</div>
            <div class="task-detail-value">${categoryLabels[task.category]}</div>
        </div>
        <div class="task-detail-item">
            <div class="task-detail-label">優先級</div>
            <div class="task-detail-value">${priorityLabels[task.priority]}</div>
        </div>
        <div class="task-detail-item">
            <div class="task-detail-label">狀態</div>
            <div class="task-detail-value">${statusLabels[task.status]}</div>
        </div>
        <div class="task-detail-item">
            <div class="task-detail-label">進度</div>
            <div class="task-detail-value">${task.progress}%</div>
        </div>
        ${task.dueDate ? `
            <div class="task-detail-item">
                <div class="task-detail-label">截止日期</div>
                <div class="task-detail-value">${task.dueDate}</div>
            </div>
        ` : ''}
        <div class="task-detail-item">
            <div class="task-detail-label">創建時間</div>
            <div class="task-detail-value">${new Date(task.createdAt).toLocaleString('zh-TW')}</div>
        </div>
        <div class="task-detail-item">
            <div class="task-detail-label">更新時間</div>
            <div class="task-detail-value">${new Date(task.updatedAt).toLocaleString('zh-TW')}</div>
        </div>
    `;
    
    elements.detailModal.classList.add('active');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions for external use (e.g., by Lovar)
window.LovarTasks = {
    getTasks: () => tasks,
    addTask: (taskData) => {
        const task = {
            id: generateId(),
            ...taskData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tasks.push(task);
        saveTasks();
        renderTasks();
        return task;
    },
    updateTask: (id, updates) => {
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
            saveTasks();
            renderTasks();
            return tasks[index];
        }
        return null;
    },
    deleteTask: (id) => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    },
    getStats: () => ({
        pending: tasks.filter(t => t.status === 'pending').length,
        active: tasks.filter(t => t.status === 'active').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        total: tasks.length
    })
};

// ===== Automation Jobs =====

let automationJobs = [];

// Load and render automation jobs
async function loadAutomationJobs() {
    try {
        const response = await fetch('cron-jobs.json');
        const data = await response.json();
        automationJobs = data.jobs;
        renderAutomationJobs(automationJobs);
        addAutomationToStats();
        addAutomationToTaskBoard();
    } catch (error) {
        console.log('No automation jobs found');
    }
}

function renderAutomationJobs(jobs) {
    const grid = document.getElementById('automationGrid');
    if (!grid) return;
    
    grid.innerHTML = jobs.map(job => {
        const nextRun = getNextRunTime(job.cronExpr);
        const statusClass = job.enabled ? (job.lastStatus === 'ok' ? 'success' : 'error') : 'disabled';
        
        return `
        <div class="automation-card" data-status="${statusClass}">
            <div class="automation-card-header">
                <span class="automation-icon">${job.icon}</span>
                <span class="automation-title">${job.name}</span>
            </div>
            <p class="automation-desc">${job.description}</p>
            <div class="automation-meta">
                <span class="automation-schedule">
                    🕐 ${job.schedule}
                </span>
                <span class="automation-status ${job.enabled ? 'enabled' : 'disabled'}">
                    ${job.enabled ? '✓ 運行中' : '○ 已停用'}
                </span>
            </div>
            <div class="automation-times">
                ${job.lastRun ? `
                    <div class="automation-last-run">
                        ⏮️ 上次: ${formatTime(job.lastRun)} ${job.lastStatus === 'ok' ? '✅' : '❌'}
                    </div>
                ` : ''}
                <div class="automation-next-run">
                    ⏭️ 下次: ${nextRun}
                </div>
            </div>
        </div>
    `}).join('');
}

// Add automation jobs to stats
function addAutomationToStats() {
    const enabledCount = automationJobs.filter(j => j.enabled).length;
    const automationStat = document.getElementById('automationCount');
    if (automationStat) {
        automationStat.textContent = enabledCount;
    }
}

// Add automation jobs to task board as "active" tasks
function addAutomationToTaskBoard() {
    const activeTasks = document.getElementById('activeTasks');
    if (!activeTasks) return;
    
    automationJobs.filter(j => j.enabled).forEach(job => {
        const card = document.createElement('div');
        card.className = 'task-card automation-task';
        card.innerHTML = `
            <div class="task-card-header">
                <span class="task-card-title">${job.icon} ${job.name}</span>
                <span class="task-card-priority">⚡</span>
            </div>
            <p class="task-card-desc">${job.description}</p>
            <div class="task-card-meta">
                <span class="task-card-category">🤖 自動任務</span>
                <span>🕐 ${job.schedule}</span>
            </div>
            <div class="task-card-status ${job.lastStatus === 'ok' ? 'success' : 'error'}">
                ${job.lastStatus === 'ok' ? '✅ 正常運行' : '❌ 執行異常'}
            </div>
        `;
        activeTasks.appendChild(card);
    });
    
    // Update active count
    const currentActive = parseInt(elements.activeCount.textContent) || 0;
    const autoCount = automationJobs.filter(j => j.enabled).length;
    elements.activeCount.textContent = currentActive + autoCount;
    elements.activeColumnCount.textContent = currentActive + autoCount;
    
    // Update total count
    const currentTotal = parseInt(elements.totalCount.textContent) || 0;
    elements.totalCount.textContent = currentTotal + autoCount;
}

// Format time to readable string
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-TW', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calculate next run time from cron expression (simplified)
function getNextRunTime(cronExpr) {
    const parts = cronExpr.split(' ');
    const hour = parts[1];
    const minute = parts[0];
    
    const now = new Date();
    const next = new Date();
    next.setHours(parseInt(hour), parseInt(minute), 0, 0);
    
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }
    
    return next.toLocaleString('zh-TW', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Load automation jobs on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAutomationJobs();
});
