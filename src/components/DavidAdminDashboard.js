/**
 * DAVID AI Master Admin Dashboard
 * Enterprise Intelligence Control Center
 */
class DavidAdminDashboard {
    constructor(containerId) {
        this.containerId = containerId;
        this.apiUrl = 'https://mhijaqahbceuahfzezbh.supabase.co/functions/v1/david-admin-api';
        this.facilities = [];
        this.metrics = [];
        this.init();
    }

    async init() {
        this.injectStyles();
        this.renderShell();
        await this.fetchData();
        this.renderMetrics();
        this.renderTable();
        
        // Expose globally for inline event handlers
        window.DAVID_DASHBOARD = this;
    }

    getAuthToken() {
        // Assume JWT is stored in localStorage by Supabase
        const authData = localStorage.getItem('sb-mhijaqahbceuahfzezbh-auth-token');
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                return parsed.access_token;
            } catch(e) { return null; }
        }
        return null;
    }

    async fetchData() {
        // Fetch actual metrics from the Edge Function
        const token = this.getAuthToken();
        if (!token) return;

        try {
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'GET_METRICS', payload: {} })
            });

            if (res.ok) {
                const json = await res.json();
                this.metrics = json.data || [];
            }
        } catch (e) {
            console.error('Failed to fetch DAVID analytics:', e);
        }

        // Mock facility data mapping for visual demonstration since we don't have sbd_facilities connected
        this.facilities = [
            { id: 'fac_1', name: 'Alta Bates Summit Medical Center', is_active: true, tier: 'premium', tokens_used: 14500 },
            { id: 'fac_2', name: 'Mercy Hospital Group', is_active: false, tier: 'base', tokens_used: 0 },
            { id: 'fac_3', name: 'Sutter Health Main Campus', is_active: true, tier: 'supreme', tokens_used: 82000 },
            { id: 'fac_4', name: 'Kaiser Permanente Oakland', is_active: false, tier: 'base', tokens_used: 1200 }
        ];
    }

    async toggleFacility(facilityId, newStatus) {
        const token = this.getAuthToken();
        if (!token) return;

        // Optimistic UI Update
        const fac = this.facilities.find(f => f.id === facilityId);
        if (fac) fac.is_active = newStatus;
        this.renderMetrics();
        this.renderTable();

        try {
            await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'TOGGLE_FACILITY', payload: { facilityId, isActive: newStatus } })
            });
        } catch (e) {
            console.error('Toggle failed:', e);
            // Revert
            if (fac) fac.is_active = !newStatus;
            this.renderMetrics();
            this.renderTable();
        }
    }

    injectStyles() {
        if (document.getElementById('david-dashboard-styles')) return;
        const style = document.createElement('style');
        style.id = 'david-dashboard-styles';
        style.textContent = `
            .dad-container {
                font-family: 'Fira Code', 'Fira Sans', sans-serif;
                background: #F8FAFC;
                color: #1E3A8A;
                padding: 32px;
                min-height: 100vh;
                animation: fade-in 0.3s ease-in-out;
            }
            .dad-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 32px;
            }
            .dad-title {
                font-size: 24px;
                font-weight: 700;
                margin: 0;
            }
            .dad-subtitle {
                font-size: 14px;
                color: #475569;
                margin-top: 4px;
            }
            .dad-kpi-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 20px;
                margin-bottom: 32px;
            }
            .dad-kpi-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                border: 1px solid #E2E8F0;
                transition: transform 0.2s;
            }
            .dad-kpi-card:hover {
                transform: translateY(-2px);
            }
            .dad-kpi-label {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #64748B;
                font-weight: 600;
            }
            .dad-kpi-value {
                font-size: 28px;
                font-weight: 700;
                color: #1E40AF;
                margin-top: 8px;
            }
            .dad-table-wrapper {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                border: 1px solid #E2E8F0;
                overflow: hidden;
            }
            .dad-table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
            }
            .dad-table th {
                background: #F1F5F9;
                padding: 12px 20px;
                font-size: 13px;
                font-weight: 600;
                color: #475569;
                border-bottom: 1px solid #E2E8F0;
            }
            .dad-table td {
                padding: 16px 20px;
                border-bottom: 1px solid #F1F5F9;
                font-size: 14px;
            }
            .dad-tier-badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
            }
            .dad-tier-base { background: #E2E8F0; color: #475569; }
            .dad-tier-premium { background: #DBEAFE; color: #1D4ED8; }
            .dad-tier-supreme { background: #FEF3C7; color: #B45309; }
            
            /* Toggle Switch Glassmorphism */
            .dad-toggle {
                position: relative;
                display: inline-block;
                width: 44px;
                height: 24px;
            }
            .dad-toggle input { opacity: 0; width: 0; height: 0; }
            .dad-slider {
                position: absolute;
                cursor: pointer;
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: #CBD5E1;
                transition: .3s;
                border-radius: 24px;
            }
            .dad-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .3s;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            input:checked + .dad-slider {
                background-color: #F59E0B; /* Gold CTA */
            }
            input:checked + .dad-slider:before {
                transform: translateX(20px);
            }
            
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    renderShell() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(\`DAVID Dashboard Error: Container #\${this.containerId} not found.\`);
            return;
        }

        container.innerHTML = `
            <div class="dad-container">
                <div class="dad-header">
                    <div>
                        <h1 class="dad-title">DAVID Command Center</h1>
                        <p class="dad-subtitle">Enterprise Operational Intelligence Management</p>
                    </div>
                    <button style="padding: 10px 16px; background: #1E40AF; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Export Analytics CSV</button>
                </div>
                <div id="dad-kpi-area" class="dad-kpi-grid"></div>
                <div class="dad-table-wrapper">
                    <table class="dad-table">
                        <thead>
                            <tr>
                                <th>Facility Name</th>
                                <th>Intelligence Tier</th>
                                <th>Monthly Tokens Used</th>
                                <th>Status</th>
                                <th>Toggle Access</th>
                            </tr>
                        </thead>
                        <tbody id="dad-table-body"></tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderMetrics() {
        const kpiArea = document.getElementById('dad-kpi-area');
        if (!kpiArea) return;
        
        const activeCount = this.facilities.filter(f => f.is_active).length;
        const totalTokens = this.facilities.reduce((acc, f) => acc + f.tokens_used, 0);

        kpiArea.innerHTML = `
            <div class="dad-kpi-card">
                <div class="dad-kpi-label">Active Deployments</div>
                <div class="dad-kpi-value">${activeCount} <span style="font-size: 16px; color: #94A3B8;">/ ${this.facilities.length}</span></div>
            </div>
            <div class="dad-kpi-card">
                <div class="dad-kpi-label">Network Token Usage</div>
                <div class="dad-kpi-value">${totalTokens.toLocaleString()}</div>
            </div>
            <div class="dad-kpi-card">
                <div class="dad-kpi-label">Estimated AI Cost</div>
                <div class="dad-kpi-value">$${((totalTokens / 1000) * 0.015).toFixed(2)}</div>
            </div>
        `;
    }

    renderTable() {
        const tbody = document.getElementById('dad-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.facilities.map(f => `
            <tr>
                <td style="font-weight: 500;">${f.name}</td>
                <td><span class="dad-tier-badge dad-tier-${f.tier}">${f.tier}</span></td>
                <td style="font-family: 'Fira Code', monospace;">${f.tokens_used.toLocaleString()}</td>
                <td>
                    <span style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: ${f.is_active ? '#10B981' : '#64748B'};">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${f.is_active ? '#10B981' : '#CBD5E1'}; display: inline-block;"></span>
                        ${f.is_active ? 'ACTIVE' : 'LOCKED'}
                    </span>
                </td>
                <td>
                    <label class="dad-toggle">
                        <input type="checkbox" ${f.is_active ? 'checked' : ''} onchange="window.DAVID_DASHBOARD.toggleFacility('${f.id}', this.checked)">
                        <span class="dad-slider"></span>
                    </label>
                </td>
            </tr>
        `).join('');
    }
}

// Expose globally for module imports or standard HTML inclusion
if (typeof window !== 'undefined') {
    window.DavidAdminDashboard = DavidAdminDashboard;
}
export default DavidAdminDashboard;
