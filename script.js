/**
 * NEXGEN MARKETING OS - CORE SYSTEM
 * 
 * Architecture:
 * 1. Store: LocalStorage wrapper for persistence
 * 2. Router: Simple hash-based routing
 * 3. Auth: Session management
 * 4. Views: Functional components rendering HTML
 */

// --- 1. STORE & DATA SEEDING ---

const Store = {
    get: (key) => JSON.parse(localStorage.getItem(key) || 'null'),
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),

    init: () => {
        if (!Store.get('users')) {
            // Seed Data
            const users = [
                { id: 'u1', name: 'Admin User', email: 'admin@nexgen.com', password: '123', role: 'admin' },
                { id: 'u2', name: 'Marketer Jane', email: 'jane@nexgen.com', password: '123', role: 'marketer' },
                { id: 'u3', name: 'Client Acme', email: 'client@acme.com', password: '123', role: 'client' }
            ];
            Store.set('users', users);

            const campaigns = [
                { id: 'c1', name: 'Summer Sale 2024', channel: 'Meta Ads', budget: 5000, spent: 2100, status: 'active', start: '2024-06-01', end: '2024-08-31', clicks: 1240, impressions: 45000, conversions: 85 },
                { id: 'c2', name: 'B2B Lead Gen', channel: 'LinkedIn', budget: 8000, spent: 6500, status: 'active', start: '2024-01-15', end: '2024-12-31', clicks: 850, impressions: 12000, conversions: 120 },
                { id: 'c3', name: 'Retargeting Q1', channel: 'Google Ads', budget: 3000, spent: 3000, status: 'stopped', start: '2024-01-01', end: '2024-03-31', clicks: 2100, impressions: 90000, conversions: 210 }
            ];
            Store.set('campaigns', campaigns);

            const leads = [
                { id: 'l1', name: 'John Doe', email: 'john@gmail.com', status: 'new', score: 45, source: 'Meta Ads' },
                { id: 'l2', name: 'Sarah Smith', email: 'sarah@corp.com', status: 'qualified', score: 85, source: 'LinkedIn' },
                { id: 'l3', name: 'Mike Johnson', email: 'mike@yahoo.com', status: 'converted', score: 100, source: 'Google Ads' }
            ];
            Store.set('leads', leads);

            const logs = [
                { id: 'log1', user: 'Admin User', action: 'System Initialized', time: new Date().toISOString() }
            ];
            Store.set('logs', logs);
        }
    }
};

Store.init();

// --- 1.5. TOAST NOTIFICATION SYSTEM ---

const Toast = {
    show: (message, type = 'info', duration = 3000) => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        toast.innerHTML = `
            <span class="material-symbols-outlined">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <span class="toast-close material-symbols-outlined">close</span>
        `;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            Toast.remove(toast);
        });

        // Auto remove
        setTimeout(() => Toast.remove(toast), duration);
    },

    remove: (toast) => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    },

    success: (msg, duration) => Toast.show(msg, 'success', duration),
    error: (msg, duration) => Toast.show(msg, 'error', duration),
    warning: (msg, duration) => Toast.show(msg, 'warning', duration),
    info: (msg, duration) => Toast.show(msg, 'info', duration)
};

// --- 2. AUTHENTICATION ---

const Auth = {
    user: null,

    login: (email, password) => {
        const users = Store.get('users');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            Auth.user = user;
            Store.set('session', user);
            Toast.success(`Welcome back, ${user.name}!`);
            ActivityLog.add(`${user.name} logged in`, 'auth');
            Router.navigate('dashboard');
            return true;
        }
        Toast.error('Invalid email or password');
        return false;
    },

    signup: (data) => {
        const users = Store.get('users');
        if (users.find(u => u.email === data.email)) {
            Toast.error('Email already exists');
            return false;
        }
        const newUser = { id: 'u' + Date.now(), ...data };
        users.push(newUser);
        Store.set('users', users);
        Auth.user = newUser;
        Store.set('session', newUser);
        Toast.success(`Account created successfully! Welcome, ${newUser.name}!`);
        ActivityLog.add(`${newUser.name} signed up`, 'auth');
        Router.navigate('dashboard');
        return true;
    },

    logout: () => {
        const userName = Auth.user?.name || 'User';
        Auth.user = null;
        Store.set('session', null);
        Toast.info('Logged out successfully');
        Router.navigate('login');
    },

    check: () => {
        const session = Store.get('session');
        if (session) {
            Auth.user = session;
            return true;
        }
        return false;
    }
};

// --- 3. ROUTER & APP RENDERER ---

const Router = {
    current: 'login',

    navigate: (route) => {
        Router.current = route;
        App.render();
    }
};

const App = {
    el: document.getElementById('app'),

    render: () => {
        // Guard Routes
        if (!Auth.check() && Router.current !== 'login' && Router.current !== 'signup') {
            Router.navigate('login');
            return;
        }
        if (Auth.check() && (Router.current === 'login' || Router.current === 'signup')) {
            Router.navigate('dashboard');
            return;
        }

        // Render View
        if (Router.current === 'login') App.el.innerHTML = Views.Login();
        else if (Router.current === 'signup') App.el.innerHTML = Views.Signup();
        else {
            // Layout Wrapper
            App.el.innerHTML = `
                ${Components.Sidebar()}
                <div class="main-content">
                    ${Components.Header()}
                    <div class="p-6">
                        ${App.getViewHtml()}
                    </div>
                </div>
                ${Components.ModalContainer()}
            `;
            App.postRender();
        }
    },

    getViewHtml: () => {
        switch (Router.current) {
            case 'dashboard': return Views.Dashboard();
            case 'campaigns': return Views.Campaigns();
            case 'analytics': return Views.Analytics();
            case 'crm': return Views.CRM();
            case 'automation': return Views.Automation();
            case 'admin': return Views.Admin();
            case 'settings': return Views.Settings();
            case 'reports': return Views.Reports();
            case 'premium': return Views.Premium();
            default: return Views.Dashboard();
        }
    },

    postRender: () => {
        // Initialize Charts if on Dashboard or Analytics
        if (Router.current === 'dashboard' || Router.current === 'analytics') {
            Charts.render('revenueChart', 'line', [12, 19, 3, 5, 2, 3], ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']);
            Charts.render('channelChart', 'bar', [45, 25, 30], ['Meta', 'Google', 'LinkedIn']);
        }

        // Attach Event Listeners (Delegation)
        // Note: In a real app, we'd bind specific events. Here we rely on onclick attributes for simplicity in a single file.
    }
};

// --- 4. COMPONENTS (HTML Generators) ---

const Components = {
    Sidebar: () => `
        <div class="sidebar">
            <div class="logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                NexGen OS
            </div>
            <nav style="flex:1;">
                <a onclick="Router.navigate('dashboard')" class="nav-item ${Router.current === 'dashboard' ? 'active' : ''}">📊 Dashboard</a>
                <a onclick="Router.navigate('campaigns')" class="nav-item ${Router.current === 'campaigns' ? 'active' : ''}">🚀 Campaigns</a>
                <a onclick="Router.navigate('analytics')" class="nav-item ${Router.current === 'analytics' ? 'active' : ''}">📈 Analytics</a>
                <a onclick="Router.navigate('crm')" class="nav-item ${Router.current === 'crm' ? 'active' : ''}">👥 CRM & Leads</a>
                <a onclick="Router.navigate('automation')" class="nav-item ${Router.current === 'automation' ? 'active' : ''}">⚡ Automation</a>
                <a onclick="Router.navigate('reports')" class="nav-item ${Router.current === 'reports' ? 'active' : ''}">📄 Reports</a>
                ${Auth.user.role === 'admin' ? `<a onclick="Router.navigate('admin')" class="nav-item ${Router.current === 'admin' ? 'active' : ''}">🛡️ Admin</a>` : ''}
                <a onclick="Router.navigate('premium')" class="nav-item ${Router.current === 'premium' ? 'active' : ''}" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1)); border-right: 3px solid var(--primary);">⭐ Premium</a>
                <a onclick="Router.navigate('settings')" class="nav-item ${Router.current === 'settings' ? 'active' : ''}">⚙️ Settings</a>
            </nav>
            <div class="user-profile">
                <div class="flex items-center gap-2">
                    <div style="width:32px;height:32px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;">${Auth.user.name[0]}</div>
                    <div style="flex:1;">
                        <div class="text-sm" style="font-weight:600;">${Auth.user.name}</div>
                        <div class="text-sm text-muted" style="font-size:0.7rem;">${Auth.user.role.toUpperCase()}</div>
                    </div>
                    <button onclick="Auth.logout()" class="btn-sm btn-outline" title="Logout">🚪</button>
                </div>
            </div>
        </div>
    `,

    Header: () => `
        <div class="header">
            <div class="flex items-center gap-4">
                <button class="mobile-menu-toggle" onclick="document.querySelector('.sidebar').classList.toggle('open')">
                    <span class="material-symbols-outlined">menu</span>
                </button>
                <div class="text-xl" style="text-transform:capitalize;">${Router.current}</div>
            </div>
            <div class="flex items-center gap-4">
                <button class="btn btn-sm btn-primary" onclick="Toast.info('AI Insight: Based on recent data, consider increasing budget for top-performing campaigns by 15%.', 5000)">✨ AI Insights</button>
                <div class="text-muted text-sm">${new Date().toLocaleDateString()}</div>
            </div>
        </div>
    `,

    ModalContainer: () => `
        <div id="modal-container" class="hidden modal-overlay" onclick="if(event.target === this) Modals.close()">
            <!-- Content injected via JS -->
        </div>
    `
};

// --- 5. VIEWS ---

const Views = {
    Login: () => `
        <div class="auth-container">
            <div class="auth-box">
                <div class="text-center mb-8">
                    <div class="flex justify-center mb-4">
                        <div style="width:48px;height:48px;background:linear-gradient(135deg, #6366f1, #4f46e5);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 15px -3px rgba(99, 102, 241, 0.3);">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                        </div>
                    </div>
                    <h1 class="text-2xl mb-2 font-bold">Welcome Back</h1>
                    <p class="text-muted">Enter your credentials to access the dashboard</p>
                </div>
                
                <form onsubmit="event.preventDefault(); Auth.login(this.email.value, this.password.value) || alert('Invalid credentials');">
                    <div class="mb-4">
                        <label class="block text-sm mb-2 text-muted font-medium">Email Address</label>
                        <div class="input-group">
                            <span class="material-symbols-outlined">mail</span>
                            <input type="email" name="email" class="input" placeholder="admin@nexgen.com" required>
                        </div>
                    </div>
                    <div class="mb-6">
                        <div class="flex justify-between mb-2">
                            <label class="block text-sm text-muted font-medium">Password</label>
                            <a href="#" class="text-sm text-primary hover:underline">Forgot?</a>
                        </div>
                        <div class="input-group">
                            <span class="material-symbols-outlined">lock</span>
                            <input type="password" name="password" class="input" placeholder="••••••" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary w-full">
                        Sign In <span class="material-symbols-outlined" style="font-size:18px;">arrow_forward</span>
                    </button>
                </form>

                <div class="auth-divider">
                    <span>OR CONTINUE WITH</span>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <button class="social-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                        Google
                    </button>
                    <button class="social-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        GitHub
                    </button>
                </div>

                <div class="mt-6 text-center text-sm text-muted">
                    Don't have an account? <a href="#" onclick="Router.navigate('signup')" class="text-primary hover:text-white transition-colors font-medium">Create Account</a>
                </div>
            </div>
        </div>
    `,

    Signup: () => `
        <div class="auth-container">
            <div class="auth-box">
                <div class="text-center mb-8">
                    <h1 class="text-2xl mb-2 font-bold">Create Account</h1>
                    <p class="text-muted">Join NexGen Marketing OS today</p>
                </div>
                <form onsubmit="event.preventDefault(); Auth.signup({name: this.name.value, email: this.email.value, password: this.password.value, role: this.role.value});">
                    <div class="mb-4">
                        <label class="block text-sm mb-2 text-muted font-medium">Full Name</label>
                        <div class="input-group">
                            <span class="material-symbols-outlined">person</span>
                            <input type="text" name="name" class="input" placeholder="John Doe" required>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm mb-2 text-muted font-medium">Email Address</label>
                        <div class="input-group">
                            <span class="material-symbols-outlined">mail</span>
                            <input type="email" name="email" class="input" placeholder="john@example.com" required>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm mb-2 text-muted font-medium">Password</label>
                        <div class="input-group">
                            <span class="material-symbols-outlined">lock</span>
                            <input type="password" name="password" class="input" placeholder="••••••" required>
                        </div>
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm mb-2 text-muted font-medium">Role</label>
                        <div class="input-group">
                            <span class="material-symbols-outlined">badge</span>
                            <select name="role" class="input">
                                <option value="marketer">Marketer</option>
                                <option value="client">Client</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary w-full">
                        Get Started <span class="material-symbols-outlined" style="font-size:18px;">rocket_launch</span>
                    </button>
                </form>
                <div class="mt-6 text-center text-sm text-muted">
                    Already have an account? <a href="#" onclick="Router.navigate('login')" class="text-primary hover:text-white transition-colors font-medium">Sign In</a>
                </div>
            </div>
        </div>
    `,

    Dashboard: () => {
        const campaigns = Store.get('campaigns') || [];
        const totalSpend = campaigns.reduce((sum, c) => sum + c.spent, 0);
        const totalConv = campaigns.reduce((sum, c) => sum + c.conversions, 0);
        const logs = ActivityLog.get(5);

        return `
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card">
                    <div class="text-muted text-sm">Total Spend</div>
                    <div class="text-2xl">$${totalSpend.toLocaleString()}</div>
                    <div class="text-sm text-success">↑ 12% vs last month</div>
                </div>
                <div class="card">
                    <div class="text-muted text-sm">Conversions</div>
                    <div class="text-2xl">${totalConv}</div>
                    <div class="text-sm text-success">↑ 5% vs last month</div>
                </div>
                <div class="card">
                    <div class="text-muted text-sm">ROAS</div>
                    <div class="text-2xl">3.4x</div>
                    <div class="text-sm text-warning">→ Stable</div>
                </div>
                <div class="card">
                    <div class="text-muted text-sm">Active Campaigns</div>
                    <div class="text-2xl">${campaigns.filter(c => c.status === 'active').length}</div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-6 mb-6">
                <div class="card">
                    <h3 class="mb-4 text-xl">Revenue Trend</h3>
                    <div class="chart-container">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <h3 class="mb-4 text-xl">Channel Performance</h3>
                    <div class="chart-container">
                        <canvas id="channelChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl">Recent Activity</h3>
                    <button onclick="Router.navigate('admin')" class="btn btn-sm btn-outline">View All Logs</button>
                </div>
                <div class="text-sm text-muted">
                    ${logs.length === 0 ? 
                        '<div class="p-4 text-center text-muted">No recent activity</div>' :
                        logs.map(log => {
                            const timeAgo = getTimeAgo(new Date(log.time));
                            return `<div class="p-2 border-b border-border flex justify-between"><span>${log.user}: ${log.action}</span><span>${timeAgo}</span></div>`;
                        }).join('')
                    }
                </div>
            </div>
        `;
    },

    Campaigns: () => {
        const campaigns = Store.get('campaigns') || [];
        return `
            <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 class="text-2xl">Campaign Management</h2>
                <div class="flex items-center gap-3">
                    <div class="search-wrapper">
                        <span class="material-symbols-outlined">search</span>
                        <input type="text" id="campaign-search" class="search-input" placeholder="Search campaigns..." onkeyup="Filter.handleCampaignSearch()">
                    </div>
                    <select id="campaign-status-filter" class="input" style="width:auto;padding:0.5rem 1rem;" onchange="Filter.handleCampaignFilter()">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="stopped">Stopped</option>
                    </select>
                    <button onclick="Actions.exportCSV(campaigns, 'campaigns.csv')" class="btn btn-outline">Export</button>
                    <button onclick="Modals.open('createCampaign')" class="btn btn-primary">+ New Campaign</button>
                </div>
            </div>

            <div class="card overflow-hidden">
                ${campaigns.length === 0 ? `
                    <div class="empty-state">
                        <span class="material-symbols-outlined">campaign</span>
                        <p>No campaigns found. Create your first campaign to get started!</p>
                    </div>
                ` : `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Channel</th>
                            <th>Status</th>
                            <th>Budget</th>
                            <th>Spent</th>
                            <th>ROI</th>
                            <th>Conv.</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="campaigns-table-body">
                        ${campaigns.map(c => {
                            const roi = c.spent > 0 ? ((c.budget - c.spent) / c.spent * 100).toFixed(1) : '0';
                            return `
                            <tr data-campaign-id="${c.id}">
                                <td style="font-weight:500;">${c.name}</td>
                                <td>${c.channel}</td>
                                <td><span class="badge badge-${c.status}">${c.status}</span></td>
                                <td>$${c.budget.toLocaleString()}</td>
                                <td>$${c.spent.toLocaleString()}</td>
                                <td>${roi}%</td>
                                <td>${c.conversions}</td>
                                <td>
                                    <div class="flex items-center gap-2">
                                        <button class="btn-sm btn-outline" onclick="Modals.open('editCampaign', '${c.id}')" title="Edit">✏️</button>
                                        <button class="btn-sm btn-outline" onclick="Actions.toggleCampaign('${c.id}')" title="${c.status === 'active' ? 'Pause' : 'Resume'}">${c.status === 'active' ? '⏸️' : '▶️'}</button>
                                        <button class="btn-sm btn-danger" onclick="Actions.deleteCampaign('${c.id}')" title="Delete">×</button>
                                    </div>
                                </td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
                `}
            </div>
        `;
    },

    Analytics: () => `
        <h2 class="text-2xl mb-6">Performance Analytics</h2>
        <div class="grid grid-cols-3 gap-6 mb-6">
            <div class="card">
                <h3 class="text-lg mb-2">Funnel Visualization</h3>
                <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                        <div style="width:100px;">Impressions</div>
                        <div class="w-full bg-bg-dark rounded h-4 overflow-hidden"><div style="width:100%;background:var(--primary);height:100%;"></div></div>
                        <div class="text-sm">150k</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div style="width:100px;">Clicks</div>
                        <div class="w-full bg-bg-dark rounded h-4 overflow-hidden"><div style="width:45%;background:var(--primary);height:100%;opacity:0.8;"></div></div>
                        <div class="text-sm">4.5k</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div style="width:100px;">Leads</div>
                        <div class="w-full bg-bg-dark rounded h-4 overflow-hidden"><div style="width:15%;background:var(--primary);height:100%;opacity:0.6;"></div></div>
                        <div class="text-sm">850</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div style="width:100px;">Sales</div>
                        <div class="w-full bg-bg-dark rounded h-4 overflow-hidden"><div style="width:5%;background:var(--success);height:100%;"></div></div>
                        <div class="text-sm">120</div>
                    </div>
                </div>
            </div>
            <div class="card col-span-2">
                <h3 class="text-lg mb-2">Traffic Sources</h3>
                <div class="chart-container">
                    <canvas id="channelChart"></canvas>
                </div>
            </div>
        </div>
        <div class="card p-6 border-l-4 border-primary">
            <h3 class="text-lg font-bold mb-2">🤖 AI Insight</h3>
            <p class="text-muted">Your "LinkedIn B2B" campaign has a 40% higher conversion rate than average. Consider reallocating budget from "Google Ads" to maximize ROAS for the remainder of the quarter.</p>
        </div>
    `,

    CRM: () => {
        const leads = Store.get('leads') || [];
        const newLeads = leads.filter(l => l.status === 'new');
        const qualifiedLeads = leads.filter(l => l.status === 'qualified');
        const convertedLeads = leads.filter(l => l.status === 'converted');
        
        return `
            <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 class="text-2xl">Lead Management</h2>
                <div class="flex items-center gap-3">
                    <div class="search-wrapper">
                        <span class="material-symbols-outlined">search</span>
                        <input type="text" id="lead-search" class="search-input" placeholder="Search leads..." onkeyup="Filter.handleLeadSearch()">
                    </div>
                    <button onclick="Actions.exportCSV(leads, 'leads.csv')" class="btn btn-outline">Export CSV</button>
                    <button onclick="Modals.open('createLead')" class="btn btn-primary">+ Add Lead</button>
                </div>
            </div>
            
            <div class="grid grid-cols-3 gap-4">
                <div class="card">
                    <div class="flex justify-between items-center mb-4 border-b border-border pb-2">
                        <h3 class="text-lg">New (${newLeads.length})</h3>
                    </div>
                    <div id="leads-new">
                        ${newLeads.length === 0 ? '<div class="empty-state" style="padding:1rem;"><p class="text-sm text-muted">No new leads</p></div>' : newLeads.map(l => `
                            <div class="p-3 bg-bg-dark rounded mb-2 border border-border hover:border-primary transition-colors" data-lead-id="${l.id}">
                                <div class="flex justify-between items-start mb-1">
                                    <div class="font-bold">${l.name}</div>
                                    <button class="btn-sm btn-danger" onclick="Actions.deleteLead('${l.id}')" title="Delete">×</button>
                                </div>
                                <div class="text-xs text-muted mb-2">${l.email}</div>
                                ${l.phone ? `<div class="text-xs text-muted mb-2">📞 ${l.phone}</div>` : ''}
                                <div class="flex justify-between items-center mt-2">
                                    <span class="badge badge-active">${l.score} pts</span>
                                    <span class="text-xs text-muted">${l.source}</span>
                                </div>
                                <div class="flex gap-2 mt-2">
                                    <button class="btn-sm btn-outline" style="flex:1;padding:0.25rem;" onclick="Actions.updateLeadStatus('${l.id}', 'qualified')">→ Qualified</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="card">
                    <div class="flex justify-between items-center mb-4 border-b border-border pb-2">
                        <h3 class="text-lg">Qualified (${qualifiedLeads.length})</h3>
                    </div>
                    <div id="leads-qualified">
                        ${qualifiedLeads.length === 0 ? '<div class="empty-state" style="padding:1rem;"><p class="text-sm text-muted">No qualified leads</p></div>' : qualifiedLeads.map(l => `
                            <div class="p-3 bg-bg-dark rounded mb-2 border border-border border-l-4 border-primary hover:border-primary transition-colors" data-lead-id="${l.id}">
                                <div class="flex justify-between items-start mb-1">
                                    <div class="font-bold">${l.name}</div>
                                    <button class="btn-sm btn-danger" onclick="Actions.deleteLead('${l.id}')" title="Delete">×</button>
                                </div>
                                <div class="text-xs text-muted mb-2">${l.email}</div>
                                <div class="flex justify-between items-center mt-2">
                                    <span class="badge badge-active">${l.score} pts</span>
                                </div>
                                <div class="flex gap-2 mt-2">
                                    <button class="btn-sm btn-outline" style="flex:1;padding:0.25rem;" onclick="Actions.updateLeadStatus('${l.id}', 'new')">← New</button>
                                    <button class="btn-sm btn-primary" style="flex:1;padding:0.25rem;" onclick="Actions.updateLeadStatus('${l.id}', 'converted')">Convert →</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="card">
                    <div class="flex justify-between items-center mb-4 border-b border-border pb-2">
                        <h3 class="text-lg">Converted (${convertedLeads.length})</h3>
                    </div>
                    <div id="leads-converted">
                        ${convertedLeads.length === 0 ? '<div class="empty-state" style="padding:1rem;"><p class="text-sm text-muted">No converted leads</p></div>' : convertedLeads.map(l => `
                            <div class="p-3 bg-bg-dark rounded mb-2 border border-border border-l-4 border-success hover:border-success transition-colors" data-lead-id="${l.id}">
                                <div class="flex justify-between items-start mb-1">
                                    <div class="font-bold">${l.name}</div>
                                    <button class="btn-sm btn-danger" onclick="Actions.deleteLead('${l.id}')" title="Delete">×</button>
                                </div>
                                <div class="text-xs text-success mb-2">✓ Customer</div>
                                <div class="text-xs text-muted">${l.email}</div>
                                <div class="flex justify-between items-center mt-2">
                                    <span class="badge badge-active">${l.score} pts</span>
                                </div>
                                <div class="flex gap-2 mt-2">
                                    <button class="btn-sm btn-outline" style="flex:1;padding:0.25rem;" onclick="Actions.updateLeadStatus('${l.id}', 'qualified')">← Qualified</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    Automation: () => `
        <h2 class="text-2xl mb-6">Marketing Automation</h2>
        <div class="grid grid-cols-2 gap-6">
            <div class="card">
                <h3 class="text-lg mb-4">Active Workflows</h3>
                <div class="flex items-center justify-between p-3 bg-bg-dark rounded mb-2">
                    <div>
                        <div class="font-bold">Welcome Sequence</div>
                        <div class="text-xs text-muted">Trigger: New Signup</div>
                    </div>
                    <div class="text-success">● Active</div>
                </div>
                <div class="flex items-center justify-between p-3 bg-bg-dark rounded mb-2">
                    <div>
                        <div class="font-bold">Cart Abandonment</div>
                        <div class="text-xs text-muted">Trigger: Checkout Drop-off</div>
                    </div>
                    <div class="text-success">● Active</div>
                </div>
                <div class="flex items-center justify-between p-3 bg-bg-dark rounded">
                    <div>
                        <div class="font-bold">Win-back Campaign</div>
                        <div class="text-xs text-muted">Trigger: Inactive 30 days</div>
                    </div>
                    <div class="text-warning">● Paused</div>
                </div>
            </div>
            <div class="card">
                <h3 class="text-lg mb-4">Create Rule</h3>
                <div class="mb-4">
                    <label class="block text-sm mb-2 text-muted">If</label>
                    <select class="input"><option>Lead Score > 80</option><option>Visited Pricing Page</option></select>
                </div>
                <div class="mb-4">
                    <label class="block text-sm mb-2 text-muted">Then</label>
                    <select class="input"><option>Send Email: Sales Intro</option><option>Add to CRM List: Hot Leads</option></select>
                </div>
                <button class="btn btn-primary w-full">Save Rule</button>
            </div>
        </div>
    `,

    Admin: () => {
        const users = Store.get('users');
        const logs = ActivityLog.get(50);
        return `
            <h2 class="text-2xl mb-6">System Administration</h2>
            <div class="card">
                <h3 class="mb-4 text-xl">User Management</h3>
                <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>${u.name}</td>
                                <td>${u.email}</td>
                                <td><span class="badge badge-active">${u.role}</span></td>
                                <td><span class="text-success">Active</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mt-6 card">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl">Activity Log</h3>
                    <button onclick="Actions.exportCSV(logs, 'activity-log.csv')" class="btn btn-sm btn-outline">Export Log</button>
                </div>
                <div class="text-sm text-muted font-mono bg-bg-dark p-4 rounded max-h-96 overflow-y-auto">
                    ${logs.length === 0 ? '<div class="text-center text-muted">No activity logs</div>' : logs.map(log => {
                        const date = new Date(log.time);
                        const dateStr = date.toLocaleString();
                        return `[${dateStr}] ${log.user}: ${log.action}<br>`;
                    }).join('')}
                </div>
            </div>
        `;
    }
};

// --- 5.5. ACTIVITY LOG SYSTEM ---

const ActivityLog = {
    add: (action, category = 'general') => {
        const logs = Store.get('logs') || [];
        const logEntry = {
            id: 'log' + Date.now(),
            user: Auth.user?.name || 'System',
            action: action,
            category: category,
            time: new Date().toISOString()
        };
        logs.unshift(logEntry); // Add to beginning
        // Keep only last 100 logs
        if (logs.length > 100) logs.pop();
        Store.set('logs', logs);
        return logEntry;
    },

    get: (limit = 50) => {
        const logs = Store.get('logs') || [];
        return logs.slice(0, limit);
    }
};

// --- 6. ACTIONS & LOGIC ---

const Actions = {
    deleteCampaign: (id) => {
        const campaign = Store.get('campaigns').find(c => c.id === id);
        if (!campaign) return;
        
        if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) return;
        
        const campaigns = Store.get('campaigns').filter(c => c.id !== id);
        Store.set('campaigns', campaigns);
        Toast.success(`Campaign "${campaign.name}" deleted successfully`);
        ActivityLog.add(`Deleted campaign: ${campaign.name}`, 'campaign');
        App.render();
    },

    toggleCampaign: (id) => {
        const campaigns = Store.get('campaigns');
        const c = campaigns.find(x => x.id === id);
        if (c) {
            const oldStatus = c.status;
            c.status = c.status === 'active' ? 'paused' : 'active';
            Store.set('campaigns', campaigns);
            Toast.info(`Campaign "${c.name}" ${c.status === 'active' ? 'resumed' : 'paused'}`);
            ActivityLog.add(`Campaign "${c.name}" ${c.status === 'active' ? 'resumed' : 'paused'}`, 'campaign');
            App.render();
        }
    },

    createCampaign: (form) => {
        const campaigns = Store.get('campaigns');
        const newC = {
            id: 'c' + Date.now(),
            name: form.name.value,
            channel: form.channel.value,
            budget: parseInt(form.budget.value),
            spent: 0,
            status: 'active',
            start: form.start?.value || new Date().toISOString().split('T')[0],
            end: form.end?.value || '',
            clicks: 0,
            impressions: 0,
            conversions: 0
        };
        campaigns.push(newC);
        Store.set('campaigns', campaigns);
        Toast.success(`Campaign "${newC.name}" created successfully!`);
        ActivityLog.add(`Created campaign: ${newC.name}`, 'campaign');
        Modals.close();
        App.render();
    },

    updateCampaign: (id, form) => {
        const campaigns = Store.get('campaigns');
        const c = campaigns.find(x => x.id === id);
        if (c) {
            c.name = form.name.value;
            c.channel = form.channel.value;
            c.budget = parseInt(form.budget.value);
            c.start = form.start?.value || c.start;
            c.end = form.end?.value || c.end;
            Store.set('campaigns', campaigns);
            Toast.success(`Campaign "${c.name}" updated successfully`);
            ActivityLog.add(`Updated campaign: ${c.name}`, 'campaign');
            Modals.close();
            App.render();
        }
    },

    updateLeadStatus: (id, newStatus) => {
        const leads = Store.get('leads');
        const lead = leads.find(l => l.id === id);
        if (lead) {
            lead.status = newStatus;
            Store.set('leads', leads);
            Toast.success(`Lead "${lead.name}" moved to ${newStatus}`);
            ActivityLog.add(`Lead "${lead.name}" status changed to ${newStatus}`, 'crm');
            App.render();
        }
    },

    deleteLead: (id) => {
        const leads = Store.get('leads');
        const lead = leads.find(l => l.id === id);
        if (!lead) return;
        
        if (!confirm(`Delete lead "${lead.name}"?`)) return;
        
        const updatedLeads = leads.filter(l => l.id !== id);
        Store.set('leads', updatedLeads);
        Toast.success(`Lead "${lead.name}" deleted`);
        ActivityLog.add(`Deleted lead: ${lead.name}`, 'crm');
        App.render();
    },

    createLead: (form) => {
        const leads = Store.get('leads');
        const newLead = {
            id: 'l' + Date.now(),
            name: form.name.value,
            email: form.email.value,
            status: 'new',
            score: parseInt(form.score?.value || 0),
            source: form.source?.value || 'Manual',
            phone: form.phone?.value || '',
            company: form.company?.value || '',
            createdAt: new Date().toISOString()
        };
        leads.push(newLead);
        Store.set('leads', leads);
        Toast.success(`Lead "${newLead.name}" added successfully`);
        ActivityLog.add(`Added lead: ${newLead.name}`, 'crm');
        Modals.close();
        App.render();
    },

    exportCSV: (data, filename) => {
        if (!data || data.length === 0) {
            Toast.warning('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') 
                    ? `"${value}"` 
                    : value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename || 'export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Toast.success('Data exported successfully');
    },

    exportCampaignReport: () => {
        const campaigns = Store.get('campaigns') || [];
        if (campaigns.length === 0) {
            Toast.warning('No campaigns to export');
            return;
        }

        const reportData = campaigns.map(c => {
            const roi = c.spent > 0 ? ((c.budget - c.spent) / c.spent * 100).toFixed(2) : '0';
            const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0';
            const conversionRate = c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(2) : '0';
            const cpc = c.clicks > 0 ? (c.spent / c.clicks).toFixed(2) : '0';
            const cpa = c.conversions > 0 ? (c.spent / c.conversions).toFixed(2) : '0';
            
            return {
                'Campaign Name': c.name,
                'Channel': c.channel,
                'Status': c.status,
                'Budget ($)': c.budget,
                'Spent ($)': c.spent,
                'Remaining Budget ($)': c.budget - c.spent,
                'Impressions': c.impressions,
                'Clicks': c.clicks,
                'CTR (%)': ctr,
                'Conversions': c.conversions,
                'Conversion Rate (%)': conversionRate,
                'Cost Per Click (CPC)': cpc,
                'Cost Per Acquisition (CPA)': cpa,
                'ROI (%)': roi,
                'Start Date': c.start,
                'End Date': c.end || 'N/A'
            };
        });

        Actions.exportCSV(reportData, `campaign-report-${new Date().toISOString().split('T')[0]}.csv`);
    },

    exportLeadsReport: () => {
        const leads = Store.get('leads') || [];
        if (leads.length === 0) {
            Toast.warning('No leads to export');
            return;
        }

        const reportData = leads.map(l => ({
            'Name': l.name,
            'Email': l.email,
            'Phone': l.phone || 'N/A',
            'Company': l.company || 'N/A',
            'Status': l.status,
            'Lead Score': l.score,
            'Source': l.source,
            'Created Date': l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'N/A'
        }));

        Actions.exportCSV(reportData, `leads-report-${new Date().toISOString().split('T')[0]}.csv`);
    },

    exportSummaryReport: () => {
        const campaigns = Store.get('campaigns') || [];
        const leads = Store.get('leads') || [];
        
        const totalSpend = campaigns.reduce((sum, c) => sum + c.spent, 0);
        const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
        const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
        const totalLeads = leads.length;
        const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
        const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
        const conversionRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(2) : 0;
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        
        const reportData = [{
            'Report Date': new Date().toLocaleDateString(),
            'Total Campaigns': campaigns.length,
            'Active Campaigns': activeCampaigns,
            'Total Budget ($)': totalBudget,
            'Total Spent ($)': totalSpend,
            'Remaining Budget ($)': totalBudget - totalSpend,
            'Budget Utilization (%)': totalBudget > 0 ? ((totalSpend / totalBudget) * 100).toFixed(2) : 0,
            'Total Impressions': totalImpressions,
            'Total Clicks': totalClicks,
            'Overall CTR (%)': totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
            'Total Conversions': totalConversions,
            'Total Leads': totalLeads,
            'Conversion Rate (%)': conversionRate,
            'Average Cost Per Click': totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : 0,
            'Average Cost Per Acquisition': totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : 0
        }];

        Actions.exportCSV(reportData, `summary-report-${new Date().toISOString().split('T')[0]}.csv`);
    },

    exportAllReports: () => {
        Toast.info('Exporting all reports...', 2000);
        setTimeout(() => {
            Actions.exportCampaignReport();
            setTimeout(() => {
                Actions.exportLeadsReport();
                setTimeout(() => {
                    Actions.exportSummaryReport();
                    Toast.success('All reports exported successfully!');
                }, 500);
            }, 500);
        }, 500);
    },

    upgradePlan: (planId) => {
        const plans = {
            free: 'Free',
            basic: 'Basic',
            premium: 'Premium',
            enterprise: 'Enterprise'
        };
        
        if (confirm(`Are you sure you want to upgrade to ${plans[planId]} plan?`)) {
            const users = Store.get('users');
            const currentUser = users.find(u => u.id === Auth.user.id);
            
            if (currentUser) {
                currentUser.plan = planId;
                Store.set('users', users);
                Auth.user = currentUser;
                Store.set('session', currentUser);
                Toast.success(`Successfully upgraded to ${plans[planId]} plan!`);
                ActivityLog.add(`Upgraded to ${plans[planId]} plan`, 'subscription');
                App.render();
            }
        }
    }
};

const Modals = {
    open: (type, id = null) => {
        const container = document.getElementById('modal-container');
        container.classList.remove('hidden');

        let content = '';
        if (type === 'createCampaign') {
            content = `
                <div class="modal-content">
                    <h2 class="text-xl mb-4">New Campaign</h2>
                    <form onsubmit="event.preventDefault(); Actions.createCampaign(this);">
                        <div class="mb-4">
                            <label class="block text-sm mb-2 text-muted font-medium">Campaign Name</label>
                            <input name="name" class="input" placeholder="Enter campaign name" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm mb-2 text-muted font-medium">Channel</label>
                            <select name="channel" class="input">
                                <option value="Meta Ads">Meta Ads</option>
                                <option value="Google Ads">Google Ads</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Email">Email</option>
                                <option value="Twitter">Twitter</option>
                            </select>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm mb-2 text-muted font-medium">Start Date</label>
                            <input type="date" name="start" class="input" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm mb-2 text-muted font-medium">End Date (Optional)</label>
                            <input type="date" name="end" class="input">
                        </div>
                        <div class="mb-6">
                            <label class="block text-sm mb-2 text-muted font-medium">Budget ($)</label>
                            <input type="number" name="budget" class="input" placeholder="5000" min="0" step="100" required>
                        </div>
                        <div class="flex justify-end gap-2">
                            <button type="button" onclick="Modals.close()" class="btn btn-outline">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Campaign</button>
                        </div>
                    </form>
                </div>
            `;
        } else if (type === 'editCampaign' && id) {
            const campaign = Store.get('campaigns').find(c => c.id === id);
            if (campaign) {
                content = `
                    <div class="modal-content">
                        <h2 class="text-xl mb-4">Edit Campaign</h2>
                        <form onsubmit="event.preventDefault(); Actions.updateCampaign('${id}', this);">
                            <div class="mb-4">
                                <label class="block text-sm mb-2 text-muted font-medium">Campaign Name</label>
                                <input name="name" class="input" value="${campaign.name}" required>
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm mb-2 text-muted font-medium">Channel</label>
                                <select name="channel" class="input">
                                    <option value="Meta Ads" ${campaign.channel === 'Meta Ads' ? 'selected' : ''}>Meta Ads</option>
                                    <option value="Google Ads" ${campaign.channel === 'Google Ads' ? 'selected' : ''}>Google Ads</option>
                                    <option value="LinkedIn" ${campaign.channel === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                                    <option value="Email" ${campaign.channel === 'Email' ? 'selected' : ''}>Email</option>
                                    <option value="Twitter" ${campaign.channel === 'Twitter' ? 'selected' : ''}>Twitter</option>
                                </select>
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm mb-2 text-muted font-medium">Start Date</label>
                                <input type="date" name="start" class="input" value="${campaign.start}" required>
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm mb-2 text-muted font-medium">End Date</label>
                                <input type="date" name="end" class="input" value="${campaign.end || ''}">
                            </div>
                            <div class="mb-6">
                                <label class="block text-sm mb-2 text-muted font-medium">Budget ($)</label>
                                <input type="number" name="budget" class="input" value="${campaign.budget}" min="0" step="100" required>
                            </div>
                            <div class="flex justify-end gap-2">
                                <button type="button" onclick="Modals.close()" class="btn btn-outline">Cancel</button>
                                <button type="submit" class="btn btn-primary">Update Campaign</button>
                            </div>
                        </form>
                    </div>
                `;
            }
        } else if (type === 'createLead') {
            content = `
                <div class="modal-content">
                    <h2 class="text-xl mb-4">Add New Lead</h2>
                    <form onsubmit="event.preventDefault(); Actions.createLead(this);">
                        <div class="mb-4">
                            <label class="block text-sm mb-2 text-muted font-medium">Full Name</label>
                            <input name="name" class="input" placeholder="John Doe" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm mb-2 text-muted font-medium">Email</label>
                            <input type="email" name="email" class="input" placeholder="john@example.com" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm mb-2 text-muted font-medium">Phone (Optional)</label>
                            <input type="tel" name="phone" class="input" placeholder="+1 234 567 8900">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm mb-2 text-muted font-medium">Company (Optional)</label>
                            <input name="company" class="input" placeholder="Company Name">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm mb-2 text-muted font-medium">Lead Score</label>
                            <input type="number" name="score" class="input" placeholder="0" min="0" max="100" value="0">
                        </div>
                        <div class="mb-6">
                            <label class="block text-sm mb-2 text-muted font-medium">Source</label>
                            <select name="source" class="input">
                                <option value="Manual">Manual</option>
                                <option value="Meta Ads">Meta Ads</option>
                                <option value="Google Ads">Google Ads</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Website">Website</option>
                                <option value="Referral">Referral</option>
                            </select>
                        </div>
                        <div class="flex justify-end gap-2">
                            <button type="button" onclick="Modals.close()" class="btn btn-outline">Cancel</button>
                            <button type="submit" class="btn btn-primary">Add Lead</button>
                        </div>
                    </form>
                </div>
            `;
        }
        container.innerHTML = content;
    },

    close: () => {
        document.getElementById('modal-container').classList.add('hidden');
    }
};

// --- 7. CHARTS ENGINE (Simple Canvas Implementation) ---

const Charts = {
    render: (id, type, data, labels) => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.parentElement.offsetWidth;
        const height = canvas.height = canvas.parentElement.offsetHeight;

        ctx.clearRect(0, 0, width, height);

        // Styling
        ctx.strokeStyle = '#6366f1';
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.lineWidth = 2;
        ctx.font = '12px sans-serif';

        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const maxVal = Math.max(...data) * 1.2;

        if (type === 'line') {
            ctx.beginPath();
            data.forEach((val, i) => {
                const x = padding + (i / (data.length - 1)) * chartWidth;
                const y = height - padding - (val / maxVal) * chartHeight;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                // Draw Point
                ctx.fillStyle = '#6366f1';
                ctx.fillRect(x - 3, y - 3, 6, 6);

                // Draw Label
                ctx.fillStyle = '#94a3b8';
                ctx.fillText(labels[i], x - 10, height - 10);
            });
            ctx.stroke();
        } else if (type === 'bar') {
            const barWidth = (chartWidth / data.length) * 0.6;
            data.forEach((val, i) => {
                const x = padding + (i * (chartWidth / data.length)) + 20;
                const h = (val / maxVal) * chartHeight;
                const y = height - padding - h;

                ctx.fillStyle = '#6366f1';
                ctx.fillRect(x, y, barWidth, h);

                ctx.fillStyle = '#94a3b8';
                ctx.fillText(labels[i], x, height - 10);
            });
        }
    }
};

// --- 8. CHATBOT LOGIC ---

const Chatbot = {
    init: () => {
        const toggler = document.querySelector(".chatbot-toggler");
        const closeBtn = document.querySelector(".close-btn");
        const chatInput = document.querySelector(".chat-input textarea");
        const sendBtn = document.querySelector("#send-btn");
        const chatbox = document.querySelector(".chatbox");

        if (!toggler) return; // Chatbot not in DOM yet

        let userMessage = null;
        const inputInitHeight = chatInput.scrollHeight;

        const createChatLi = (message, className) => {
            const chatLi = document.createElement("li");
            chatLi.classList.add("chat", className);
            let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
            chatLi.innerHTML = chatContent;
            chatLi.querySelector("p").textContent = message;
            return chatLi;
        };

        const generateResponse = (incomingChatLi) => {
            const messageElement = incomingChatLi.querySelector("p");

            // Simple keyword-based response logic
            const msg = userMessage.toLowerCase();
            let response = "I'm not sure I understand. Could you rephrase that? I can help with campaigns, budget, or leads.";

            if (msg.includes("hello") || msg.includes("hi")) {
                response = "Hello! How can I assist you with your marketing today?";
            } else if (msg.includes("campaign")) {
                const campaigns = Store.get('campaigns');
                const active = campaigns.filter(c => c.status === 'active').length;
                response = `You currently have ${active} active campaigns. The 'Summer Sale 2024' is performing best with 85 conversions.`;
            } else if (msg.includes("budget") || msg.includes("spend")) {
                const campaigns = Store.get('campaigns');
                const totalSpend = campaigns.reduce((sum, c) => sum + c.spent, 0);
                response = `Your total spend across all campaigns is $${totalSpend.toLocaleString()}. You are within your allocated budget for this quarter.`;
            } else if (msg.includes("lead") || msg.includes("crm")) {
                const leads = Store.get('leads');
                const newLeads = leads.filter(l => l.status === 'new').length;
                response = `You have ${newLeads} new leads waiting for follow-up in the CRM.`;
            } else if (msg.includes("thank")) {
                response = "You're welcome! Happy marketing! 🚀";
            }

            // Simulate typing delay
            setTimeout(() => {
                messageElement.textContent = response;
                chatbox.scrollTo(0, chatbox.scrollHeight);
            }, 600);
        };

        const handleChat = () => {
            userMessage = chatInput.value.trim();
            if (!userMessage) return;

            // Clear input
            chatInput.value = "";
            chatInput.style.height = `${inputInitHeight}px`;

            // Append user message
            chatbox.appendChild(createChatLi(userMessage, "outgoing"));
            chatbox.scrollTo(0, chatbox.scrollHeight);

            // Append "Thinking..." message
            setTimeout(() => {
                const incomingChatLi = createChatLi("Thinking...", "incoming");
                chatbox.appendChild(incomingChatLi);
                chatbox.scrollTo(0, chatbox.scrollHeight);
                generateResponse(incomingChatLi);
            }, 600);
        };

        // Event Listeners
        toggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
        closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));

        chatInput.addEventListener("input", () => {
            chatInput.style.height = `${inputInitHeight}px`;
            chatInput.style.height = `${chatInput.scrollHeight}px`;
        });

        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
                e.preventDefault();
                handleChat();
            }
        });

        sendBtn.addEventListener("click", handleChat);
    }
};

// --- 9. FILTER & SEARCH UTILITIES ---

const Filter = {
    handleCampaignSearch: () => {
        const searchTerm = document.getElementById('campaign-search')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('campaign-status-filter')?.value || '';
        const rows = document.querySelectorAll('#campaigns-table-body tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const status = row.querySelector('.badge')?.textContent.toLowerCase() || '';
            const matchesSearch = !searchTerm || text.includes(searchTerm);
            const matchesStatus = !statusFilter || status === statusFilter;
            row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
        });
    },

    handleCampaignFilter: () => {
        Filter.handleCampaignSearch();
    },

    handleLeadSearch: () => {
        const searchTerm = document.getElementById('lead-search')?.value.toLowerCase() || '';
        const leadCards = document.querySelectorAll('[data-lead-id]');
        
        leadCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = !searchTerm || text.includes(searchTerm) ? '' : 'none';
        });
    }
};

// --- 9.5. UTILITY FUNCTIONS ---

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

// --- 10. ADDITIONAL VIEWS ---

Views.Settings = () => {
    const user = Auth.user;
    return `
        <h2 class="text-2xl mb-6">Settings</h2>
        <div class="grid grid-cols-2 gap-6">
            <div class="card">
                <h3 class="text-xl mb-4">Profile Settings</h3>
                <div class="mb-4">
                    <label class="block text-sm mb-2 text-muted font-medium">Full Name</label>
                    <input type="text" class="input" value="${user.name}" readonly>
                </div>
                <div class="mb-4">
                    <label class="block text-sm mb-2 text-muted font-medium">Email</label>
                    <input type="email" class="input" value="${user.email}" readonly>
                </div>
                <div class="mb-4">
                    <label class="block text-sm mb-2 text-muted font-medium">Role</label>
                    <input type="text" class="input" value="${user.role.toUpperCase()}" readonly>
                </div>
            </div>
            <div class="card">
                <h3 class="text-xl mb-4">Preferences</h3>
                <div class="mb-4">
                    <label class="block text-sm mb-2 text-muted font-medium">Notifications</label>
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="email-notifications" checked class="input" style="width:auto;">
                        <label for="email-notifications">Email notifications</label>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-sm mb-2 text-muted font-medium">Theme</label>
                    <select class="input">
                        <option>Dark (Default)</option>
                        <option disabled>Light (Coming Soon)</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="mt-6 card">
            <h3 class="text-xl mb-4">Danger Zone</h3>
            <button onclick="if(confirm('Are you sure you want to clear all data? This cannot be undone!')) { localStorage.clear(); location.reload(); }" class="btn btn-danger">Clear All Data</button>
        </div>
    `;
};

Views.Reports = () => {
    const campaigns = Store.get('campaigns') || [];
    const leads = Store.get('leads') || [];
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(2) : 0;
    
    return `
        <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 class="text-2xl">Performance Reports</h2>
            <div class="flex items-center gap-2 flex-wrap">
                <button onclick="Actions.exportCampaignReport()" class="btn btn-outline">📊 Export Campaigns</button>
                <button onclick="Actions.exportLeadsReport()" class="btn btn-outline">👥 Export Leads</button>
                <button onclick="Actions.exportSummaryReport()" class="btn btn-outline">📈 Export Summary</button>
                <button onclick="Actions.exportAllReports()" class="btn btn-primary">💾 Export All Reports</button>
            </div>
        </div>
        
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="card">
                <div class="text-muted text-sm">Total Budget</div>
                <div class="text-2xl">$${totalBudget.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="text-muted text-sm">Total Spent</div>
                <div class="text-2xl">$${totalSpend.toLocaleString()}</div>
                <div class="text-sm text-muted mt-1">${totalBudget > 0 ? ((totalSpend / totalBudget) * 100).toFixed(1) : 0}% utilized</div>
            </div>
            <div class="card">
                <div class="text-muted text-sm">Total Leads</div>
                <div class="text-2xl">${totalLeads}</div>
            </div>
            <div class="card">
                <div class="text-muted text-sm">Conversion Rate</div>
                <div class="text-2xl">${conversionRate}%</div>
            </div>
        </div>
        
        <div class="grid grid-cols-2 gap-6">
            <div class="card">
                <h3 class="text-xl mb-4">Campaign Performance</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Campaign</th>
                            <th>Spent</th>
                            <th>Conv.</th>
                            <th>ROI</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${campaigns.slice(0, 5).map(c => {
                            const roi = c.spent > 0 ? ((c.budget - c.spent) / c.spent * 100).toFixed(1) : '0';
                            return `
                                <tr>
                                    <td>${c.name}</td>
                                    <td>$${c.spent.toLocaleString()}</td>
                                    <td>${c.conversions}</td>
                                    <td>${roi}%</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div class="card">
                <h3 class="text-xl mb-4">Lead Sources</h3>
                <div class="flex flex-col gap-3">
                    ${Object.entries(leads.reduce((acc, lead) => {
                        acc[lead.source] = (acc[lead.source] || 0) + 1;
                        return acc;
                    }, {})).map(([source, count]) => `
                        <div class="flex items-center justify-between p-2 bg-bg-dark rounded">
                            <span>${source}</span>
                            <span class="badge badge-active">${count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};

Views.Premium = () => {
    const user = Auth.user;
    const currentPlan = user.plan || 'free';
    
    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: 0,
            period: 'forever',
            description: 'Perfect for getting started',
            features: [
                'Up to 3 campaigns',
                'Up to 50 leads',
                'Basic analytics',
                'Email support',
                'Standard templates',
                '5 automation workflows'
            ],
            popular: false
        },
        {
            id: 'basic',
            name: 'Basic',
            price: 29,
            period: 'month',
            description: 'For small teams and startups',
            features: [
                'Up to 15 campaigns',
                'Up to 500 leads',
                'Advanced analytics',
                'Priority email support',
                'Custom templates',
                'Unlimited automation workflows',
                'CSV exports',
                'Basic reporting'
            ],
            popular: false
        },
        {
            id: 'premium',
            name: 'Premium',
            price: 99,
            period: 'month',
            description: 'For growing businesses',
            features: [
                'Unlimited campaigns',
                'Unlimited leads',
                'Advanced analytics & insights',
                '24/7 priority support',
                'Custom branding',
                'Unlimited automation workflows',
                'Advanced CSV/Excel exports',
                'Custom reporting & dashboards',
                'API access',
                'Team collaboration (up to 5 users)',
                'A/B testing tools',
                'Advanced AI insights'
            ],
            popular: true
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: 299,
            period: 'month',
            description: 'For large organizations',
            features: [
                'Everything in Premium',
                'Unlimited team members',
                'Dedicated account manager',
                'Custom integrations',
                'On-premise deployment option',
                'SLA guarantee (99.9% uptime)',
                'Advanced security & compliance',
                'Custom training & onboarding',
                'White-label solution',
                'Advanced custom reporting',
                'Dedicated infrastructure'
            ],
            popular: false
        }
    ];
    
    return `
        <div class="premium-container">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold mb-4">Choose Your Plan</h1>
                <p class="text-muted text-lg">Select the perfect plan for your marketing needs</p>
                ${currentPlan !== 'free' ? `<div class="mt-4"><span class="badge badge-active">Current Plan: ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</span></div>` : ''}
            </div>
            
            <div class="pricing-grid">
                ${plans.map(plan => {
                    const isCurrentPlan = currentPlan === plan.id;
                    const isPopular = plan.popular;
                    return `
                        <div class="pricing-card ${isPopular ? 'pricing-card-popular' : ''} ${isCurrentPlan ? 'pricing-card-current' : ''}">
                            ${isPopular ? '<div class="popular-badge">Most Popular</div>' : ''}
                            ${isCurrentPlan ? '<div class="current-badge">Current Plan</div>' : ''}
                            <div class="pricing-header">
                                <h3 class="pricing-name">${plan.name}</h3>
                                <div class="pricing-price">
                                    ${plan.price === 0 ? '<span class="price-amount">Free</span>' : `<span class="price-amount">$${plan.price}</span><span class="price-period">/${plan.period}</span>`}
                                </div>
                                <p class="pricing-description">${plan.description}</p>
                            </div>
                            <div class="pricing-features">
                                ${plan.features.map(feature => `
                                    <div class="feature-item">
                                        <span class="material-symbols-outlined feature-icon">check_circle</span>
                                        <span>${feature}</span>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="pricing-footer">
                                ${isCurrentPlan ? 
                                    `<button class="btn btn-outline w-full" disabled>Current Plan</button>` :
                                    `<button onclick="Actions.upgradePlan('${plan.id}')" class="btn ${isPopular ? 'btn-primary' : 'btn-outline'} w-full">${plan.price === 0 ? 'Get Started' : 'Upgrade Now'}</button>`
                                }
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="mt-12 text-center">
                <div class="card" style="max-width: 800px; margin: 0 auto;">
                    <h3 class="text-xl mb-4">💡 Need a Custom Solution?</h3>
                    <p class="text-muted mb-4">Contact our sales team to discuss enterprise plans, custom features, and dedicated support options.</p>
                    <button onclick="Toast.info('Contact sales at sales@nexgen.com or call +1 (555) 123-4567', 5000)" class="btn btn-primary">Contact Sales</button>
                </div>
            </div>
            
            <div class="mt-8 card">
                <h3 class="text-xl mb-4">Frequently Asked Questions</h3>
                <div class="faq-grid">
                    <div class="faq-item">
                        <h4 class="faq-question">Can I change plans anytime?</h4>
                        <p class="faq-answer text-muted">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.</p>
                    </div>
                    <div class="faq-item">
                        <h4 class="faq-question">What payment methods do you accept?</h4>
                        <p class="faq-answer text-muted">We accept all major credit cards, PayPal, and bank transfers for enterprise plans.</p>
                    </div>
                    <div class="faq-item">
                        <h4 class="faq-question">Is there a free trial?</h4>
                        <p class="faq-answer text-muted">Yes! All paid plans come with a 14-day free trial. No credit card required.</p>
                    </div>
                    <div class="faq-item">
                        <h4 class="faq-question">What happens to my data if I cancel?</h4>
                        <p class="faq-answer text-muted">Your data is safe! You can export all your data before canceling, and we'll keep it for 30 days in case you want to reactivate.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// --- INITIALIZATION ---
App.render();
// Initialize Chatbot after render (since it's outside App.el, it's always there, but we need to attach listeners)
// Wait for DOM content to be fully ready if needed, but script is at end of body
setTimeout(Chatbot.init, 100); 
