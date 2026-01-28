// ===== Lovar Dashboard App (Supabase Integrated) =====

// Supabase Configuration
const SUPABASE_URL = 'https://xoiqudbfdhbvpofrtazp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaXF1ZGJmZGhidnBvZnJ0YXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDY0OTQsImV4cCI6MjA4NTE4MjQ5NH0.lGeyLdNeff3PpoNZshXO0NBp6TQosuX9dk9InoSGGJA';

class LovarDashboard {
    constructor() {
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        this.tasks = [];
        this.notifications = [];
        this.activities = [];
        this.syncInterval = null;
        this.init();
    }

    async init() {
        this.updateDate();
        await this.loadTasks();
        await this.loadNotifications();
        await this.loadActivities();
        this.bindEvents();
        this.startRealtimeSubscription();
        this.updateLovarStatus('在線', 'Supabase 連接成功');
    }

    // ===== Date Display =====
    updateDate() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('zh-TW', options);
    }

    // ===== Task Management =====
    async loadTasks() {
        try {
            const { data, error } = await this.supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            this.tasks = data || [];
        } catch (e) {
            console.error('Error loading tasks:', e);
            // Fallback to empty if DB fails
            this.tasks = [];
        }
        this.renderAll();
    }

    renderAll() {
        this.renderStats();
        this.renderTodayFocus();
        this.renderTaskBoard();
    }

    renderStats() {
        const pending = this.tasks.filter(t => t.status === 'pending').length;
        const active = this.tasks.filter(t => t.status === 'active').length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const total = this.tasks.length;

        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('activeCount').textContent = active;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('totalCount').textContent = total;

        document.getElementById('pendingColumnCount').textContent = pending;
        document.getElementById('activeColumnCount').textContent = active;
        document.getElementById('completedColumnCount').textContent = completed;
    }

    renderTodayFocus() {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        
        const todayTasks = this.tasks.filter(t => {
            if (t.status === 'completed') return false;
            // Handle due_date
            if (t.due_date && t.due_date <= tomorrow) return true;
            if (t.priority === 'high' && t.status === 'active') return true;
            return false;
        }).sort((a, b) => {
            const priorityOrder = {high: 0, medium: 1, low: 2};
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return (a.due_date || '').localeCompare(b.due_date || '');
        });

        const container = document.getElementById('todayList');
        const emptyState = document.getElementById('todayEmpty');
        const badge = document.getElementById('todayCount');

        badge.textContent = todayTasks.length;

        if (todayTasks.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        emptyState.style.display = 'none';

        container.innerHTML = todayTasks.map(task => {
            const isOverdue = task.due_date && task.due_date < today;
            const dueText = this.formatDueDate(task.due_date);
            
            return `
                <div class="today-item" data-id="${task.id}">
                    <div class="today-checkbox ${task.status === 'completed' ? 'checked' : ''}"
                         onclick="dashboard.toggleTaskComplete('${task.id}')"></div>
                    <div class="today-content">
                        <div class="today-title">${task.title}</div>
                        <div class="today-meta">
                            <span class="today-due ${isOverdue ? 'overdue' : ''}">${dueText}</span>
                            <span>${this.getCategoryLabel(task.category)}</span>
                        </div>
                    </div>
                    <div class="priority-dot ${task.priority}"></div>
                </div>
            `;
        }).join('');
    }

    formatDueDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date < today) return '⚠️ 已過期';
        if (date.toDateString() === today.toDateString()) return '📅 今天';
        if (date.toDateString() === tomorrow.toDateString()) return '📅 明天';
        return `📅 ${date.getMonth() + 1}/${date.getDate()}`;
    }

    getCategoryLabel(category) {
        const labels = {
            amazon: '🛒 亞馬遜',
            ai: '🤖 AI',
            other: '📋 其他'
        };
        return labels[category] || category;
    }

    renderTaskBoard() {
        const statuses = ['pending', 'active', 'completed'];
        const containers = {
            pending: document.getElementById('pendingTasks'),
            active: document.getElementById('activeTasks'),
            completed: document.getElementById('completedTasks')
        };

        statuses.forEach(status => {
            const tasks = this.tasks.filter(t => t.status === status);
            containers[status].innerHTML = tasks.map(task => `
                <div class="task-card ${task.priority}" data-id="${task.id}">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="task-category">${this.getCategoryLabel(task.category)}</span>
                        <span>${this.formatDueDate(task.due_date)}</span>
                    </div>
                </div>
            `).join('');
        });
    }

    async toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const newStatus = task.status === 'completed' ? 'active' : 'completed';
            
            // Optimistic update
            task.status = newStatus;
            this.renderAll();

            const { error } = await this.supabase
                .from('tasks')
                .update({ status: newStatus, updated_at: new Date() })
                .eq('id', taskId);

            if (error) {
                console.error('Error updating task:', error);
                // Revert if failed
                task.status = task.status === 'completed' ? 'active' : 'completed';
                this.renderAll();
            } else {
                this.addActivity(`任務 "${task.title}" 標記為${newStatus === 'completed' ? '已完成' : '進行中'}`);
            }
        }
    }

    // ===== Notifications =====
    async loadNotifications() {
        const { data, error } = await this.supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (!error) {
            this.notifications = data;
            this.renderNotifications();
        }
    }

    renderNotifications() {
        const container = document.getElementById('notifList');
        const badge = document.getElementById('notifCount');
        
        // Count urgent/warning notifications
        const urgentCount = this.notifications.filter(n => n.type === 'urgent' || n.type === 'warning').length;
        badge.textContent = urgentCount || this.notifications.length;
        badge.classList.toggle('urgent', urgentCount > 0);

        container.innerHTML = this.notifications.map(notif => `
            <div class="notif-item ${notif.type}" data-id="${notif.id}">
                <span class="notif-icon">${notif.icon || '🔔'}</span>
                <div class="notif-content">
                    <div class="notif-title">${notif.title}</div>
                    <div class="notif-desc">${notif.description}</div>
                </div>
                <span class="notif-time">${this.formatTime(notif.created_at)}</span>
            </div>
        `).join('');
    }

    formatTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now - date) / 1000; // seconds
        
        if (diff < 60) return '剛剛';
        if (diff < 3600) return `${Math.floor(diff/60)}分鐘前`;
        if (diff < 86400) return `${Math.floor(diff/3600)}小時前`;
        return `${date.getMonth()+1}/${date.getDate()}`;
    }

    // ===== Activity Log =====
    async loadActivities() {
        const { data, error } = await this.supabase
            .from('activities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
            
        if (!error) {
            this.activities = data;
            this.renderActivities();
        }
    }

    renderActivities() {
        const container = document.getElementById('activityList');
        container.innerHTML = this.activities.map(act => `
            <div class="activity-item">
                <span class="activity-time">${this.formatTimeShort(act.created_at)}</span>
                <span class="activity-text">${act.text}</span>
            </div>
        `).join('');
    }

    formatTimeShort(dateStr) {
        const date = new Date(dateStr);
        return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
    }

    async addActivity(text) {
        const { error } = await this.supabase
            .from('activities')
            .insert([{ text }]);
            
        if (!error) {
            await this.loadActivities(); // Reload to show new
        }
    }

    // ===== Lovar Status =====
    updateLovarStatus(state, activity) {
        document.getElementById('lovarState').textContent = `● ${state}`;
        document.getElementById('lovarActivity').textContent = activity;
    }

    // ===== Realtime Sync =====
    startRealtimeSubscription() {
        // Subscribe to changes in all 3 tables
        this.supabase
            .channel('dashboard_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
                this.loadTasks();
                this.showSyncStatus(true);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                this.loadNotifications();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
                this.loadActivities();
            })
            .subscribe();
    }

    showSyncStatus(success) {
        const status = document.getElementById('syncStatus');
        status.classList.add('syncing');
        
        setTimeout(() => {
            status.classList.remove('syncing');
            status.querySelector('.sync-text').textContent = success ? '已同步' : '同步失敗';
        }, 500);
    }

    // ===== Events =====
    bindEvents() {
        // New Task Button
        document.getElementById('newTaskBtn').addEventListener('click', () => {
            document.getElementById('taskModal').classList.add('active');
        });

        // Close Modal
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('taskModal').classList.remove('active');
        });

        document.getElementById('cancelTask').addEventListener('click', () => {
            document.getElementById('taskModal').classList.remove('active');
        });

        // Submit Task
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTask();
        });

        // Quick Actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    async createTask() {
        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDesc').value,
            category: document.getElementById('taskCategory').value,
            priority: document.getElementById('taskPriority').value,
            status: 'pending',
            due_date: document.getElementById('taskDue').value || null,
        };

        const { error } = await this.supabase
            .from('tasks')
            .insert([taskData]);

        if (error) {
            console.error('Error creating task:', error);
            alert('創建失敗: ' + error.message);
            return;
        }

        this.addActivity(`創建任務 "${taskData.title}"`);
        
        document.getElementById('taskModal').classList.remove('active');
        document.getElementById('taskForm').reset();
    }

    handleQuickAction(action) {
        this.updateLovarStatus('執行中', `正在${action}...`);
        
        const messages = {
            'sync-feishu': '同步飛書數據...',
            'check-competitors': '檢查競品變化...',
            'daily-report': '生成每日報告...',
            'refresh': '刷新儀表盤...'
        };

        this.addActivity(messages[action] || action);

        setTimeout(() => {
            this.updateLovarStatus('在線', 'Supabase 連接成功');
            if (action === 'refresh') {
                this.loadTasks();
                this.loadNotifications();
                this.loadActivities();
            }
        }, 2000);
    }
}

// Initialize Dashboard
const dashboard = new LovarDashboard();
