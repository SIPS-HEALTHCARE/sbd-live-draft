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
        if (typeof SB_SESSION !== 'undefined' && SB_SESSION && SB_SESSION.access_token) {
            return SB_SESSION.access_token;
        }
        if (typeof ST !== 'undefined' && ST.session && ST.session.access_token) {
            return ST.session.access_token;
        }
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
        const token = this.getAuthToken();
        
        let apiData = { analytics: [], access: [] };
        if (token) {
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
                    if (json.data && json.data.analytics) {
                        apiData = json.data;
                    }
                }
            } catch (e) {
                console.error('Failed to fetch DAVID analytics:', e);
            }
        } else {
            console.warn('DAVID Dashboard: No auth token found.');
        }

        const dbFacilities = (window.DB && window.DB.facilities) ? window.DB.facilities : [];
        
        if (dbFacilities.length > 0) {
            this.facilities = dbFacilities.map(fac => {
                const accessRecord = apiData.access.find(a => a.facility_id === fac.id);
                const analyticsRecord = apiData.analytics.find(a => a.facility_id === fac.id);
                return {
                    id: fac.id,
                    name: fac.name || 'Unnamed Facility',
                    is_active: accessRecord ? accessRecord.is_active : false,
                    tier: accessRecord ? accessRecord.tier : 'base',
                    tokens_used: analyticsRecord ? (analyticsRecord.total_tokens || 0) : 0
                };
            });
        } else {
            this.facilities = [
                { id: 'fac_1', name: 'Alta Bates Summit Medical Center', is_active: true, tier: 'premium', tokens_used: 14500 },
                { id: 'fac_2', name: 'Mercy Hospital Group', is_active: false, tier: 'base', tokens_used: 0 },
                { id: 'fac_3', name: 'Sutter Health Main Campus', is_active: true, tier: 'supreme', tokens_used: 82000 },
                { id: 'fac_4', name: 'Kaiser Permanente Oakland', is_active: false, tier: 'base', tokens_used: 1200 }
            ];
        }
        
        this.metrics = apiData.analytics || [];
    }

    async toggleFacility(facilityId, newStatus) {
        const token = this.getAuthToken();
        if (!token) {
            this.showToast('Authentication error. Please log in again.', 'error');
            return;
        }

        const fac = this.facilities.find(f => f.id === facilityId);
        if (!fac) return;

        if (fac.is_loading) return;
        fac.is_loading = true;
        this.renderTable(); // Show loading state

        try {
            console.log(`[DAVID Dashboard] TOGGLE: ${facilityId} → ${newStatus}`);
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'TOGGLE_FACILITY', payload: { facilityId, isActive: newStatus } })
            });

            const json = await res.json();
            console.log('[DAVID Dashboard] TOGGLE response:', json);

            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Toggle failed on server');
            }

            fac.is_active = newStatus;
            fac.is_loading = false;
            this.showToast(`Access ${newStatus ? 'granted' : 'revoked'} for ${fac.name}`, 'success');
        } catch (e) {
            console.error('[DAVID Dashboard] Toggle failed:', e);
            fac.is_loading = false;
            this.showToast(`Toggle failed: ${e.message}`, 'error');
        }

        this.renderMetrics();
        this.renderTable();
    }

    async updateTier(facilityId, newTier) {
        const token = this.getAuthToken();
        if (!token) {
            this.showToast('Authentication error. Please log in again.', 'error');
            return;
        }

        const fac = this.facilities.find(f => f.id === facilityId);
        if (!fac) return;
        if (fac.is_loading) return;
        fac.is_loading = true;
        this.renderTable(); // Show loading state

        try {
            console.log(`[DAVID Dashboard] UPDATE_TIER: ${facilityId} → ${newTier}`);
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'UPDATE_TIER', payload: { facilityId, tier: newTier } })
            });

            const json = await res.json();
            console.log('[DAVID Dashboard] TIER response:', json);

            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Tier update failed on server');
            }

            fac.tier = newTier;
            fac.is_loading = false;
            this.showToast(`Tier upgraded to ${newTier.toUpperCase()} for ${fac.name}`, 'success');
        } catch (e) {
            console.error('[DAVID Dashboard] Tier update failed:', e);
            fac.is_loading = false;
            this.showToast(`Tier update failed: ${e.message}`, 'error');
        }

        this.renderMetrics();
        this.renderTable();
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 12px 24px;
            border-radius: 8px;
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)'};
            color: white;
            font-family: 'Fira Sans', sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.1);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateY(20px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    injectStyles() {
        if (document.getElementById('david-dashboard-styles')) return;
        const style = document.createElement('style');
        style.id = 'david-dashboard-styles';
        style.textContent = `
            .dad-container {
                font-family: 'Fira Code', 'Fira Sans', sans-serif;
                background: var(--bg);
                color: var(--txt);
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
                color: var(--gold);
                margin: 0;
                text-shadow: 0 0 10px rgba(196,154,32,0.2);
            }
            .dad-subtitle {
                font-size: 14px;
                color: var(--txt2);
                margin-top: 4px;
            }
            .dad-kpi-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 20px;
                margin-bottom: 32px;
            }
            .dad-kpi-card {
                background: var(--s1);
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                border: 1px solid var(--bdr);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .dad-kpi-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 24px rgba(196,154,32,0.1);
                border-color: rgba(196,154,32,0.3);
            }
            .dad-kpi-label {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--txt2);
                font-weight: 600;
            }
            .dad-kpi-value {
                font-size: 28px;
                font-weight: 700;
                color: var(--txt);
                margin-top: 8px;
                font-family: 'Fira Code', monospace;
            }
            .dad-table-wrapper {
                background: var(--s1);
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                border: 1px solid var(--bdr);
                overflow: hidden;
            }
            .dad-table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
            }
            .dad-table th {
                background: rgba(0,0,0,0.2);
                padding: 16px 20px;
                font-size: 13px;
                font-weight: 600;
                color: var(--txt2);
                border-bottom: 1px solid var(--bdr);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .dad-table td {
                padding: 16px 20px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                font-size: 14px;
                color: var(--txt);
            }
            .dad-table tr:hover td {
                background: rgba(255,255,255,0.02);
            }
            .dad-tier-badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                border: 1px solid transparent;
            }
            .dad-tier-base { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }
            .dad-tier-premium { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
            .dad-tier-supreme { background: rgba(196, 154, 32, 0.15); color: var(--gold); border: 1px solid rgba(196, 154, 32, 0.3); box-shadow: 0 0 10px rgba(196, 154, 32, 0.2); }

            .dad-tier-select {
                appearance: none;
                -webkit-appearance: none;
                background-color: transparent;
                padding: 4px 24px 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                cursor: pointer;
                outline: none;
                font-family: 'Fira Sans', sans-serif;
                background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right 6px center;
                background-size: 12px;
                transition: all 0.2s ease;
            }
            .dad-tier-select:focus {
                border-color: rgba(255,255,255,0.4);
            }
            .dad-tier-select option {
                background-color: var(--s1);
                color: #fff;
            }
            
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
                background-color: rgba(255,255,255,0.1);
                transition: .3s;
                border-radius: 24px;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .dad-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 2px;
                bottom: 2px;
                background-color: var(--txt2);
                transition: .3s;
                border-radius: 50%;
            }
            input:checked + .dad-slider {
                background-color: rgba(196,154,32,0.2);
                border-color: rgba(196,154,32,0.4);
            }
            input:checked + .dad-slider:before {
                transform: translateX(20px);
                background-color: var(--gold);
                box-shadow: 0 0 10px rgba(196,154,32,0.5);
            }
            
            .dad-export-btn {
                padding: 10px 18px; 
                background: rgba(196,154,32,0.1); 
                color: var(--gold); 
                border: 1px solid rgba(196,154,32,0.3); 
                border-radius: 6px; 
                font-family: 'Fira Code', monospace;
                font-weight: 600; 
                font-size: 13px;
                cursor: pointer; 
                transition: all 0.2s;
            }
            .dad-export-btn:hover {
                background: rgba(196,154,32,0.2);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(196,154,32,0.15);
            }

            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse {
                from { background-color: rgba(255,255,255,0.1); }
                to { background-color: rgba(255,255,255,0.3); }
            }
        `;
        document.head.appendChild(style);
    }

    renderShell() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`DAVID Dashboard Error: Container #${this.containerId} not found.`);
            return;
        }

        container.innerHTML = `
            <div class="dad-container">
                <div class="dad-header">
                    <div>
                        <h1 class="dad-title">DAVID Command Center</h1>
                        <p class="dad-subtitle">Enterprise Operational Intelligence Management</p>
                    </div>
                    <button class="dad-export-btn">Export Analytics CSV</button>
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
                <div class="dad-kpi-value">${activeCount} <span style="font-size: 16px; color: var(--txt2);">/ ${this.facilities.length}</span></div>
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
                <td>
                    <select class="dad-tier-select dad-tier-${f.tier}" 
                            style="${f.is_loading ? 'opacity: 0.5; pointer-events: none; cursor: wait;' : ''}"
                            onchange="window.DAVID_DASHBOARD.updateTier('${f.id}', this.value)">
                        <option value="base" ${f.tier === 'base' ? 'selected' : ''}>BASE</option>
                        <option value="premium" ${f.tier === 'premium' ? 'selected' : ''}>PREMIUM</option>
                        <option value="supreme" ${f.tier === 'supreme' ? 'selected' : ''}>SUPREME</option>
                    </select>
                </td>
                <td style="font-family: 'Fira Code', monospace;">${f.tokens_used.toLocaleString()}</td>
                <td>
                    <span style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: ${f.is_active ? 'var(--gold)' : 'var(--txt2)'};">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${f.is_active ? 'var(--gold)' : 'var(--txt2)'}; display: inline-block; ${f.is_active ? 'box-shadow: 0 0 8px rgba(196,154,32,0.6);' : ''}"></span>
                        ${f.is_active ? 'ACTIVE' : 'LOCKED'}
                    </span>
                </td>
                <td>
                    <label class="dad-toggle" style="${f.is_loading ? 'opacity: 0.5; pointer-events: none; cursor: wait;' : ''}">
                        <input type="checkbox" ${f.is_active ? 'checked' : ''} onchange="window.DAVID_DASHBOARD.toggleFacility('${f.id}', this.checked)">
                        <span class="dad-slider" style="${f.is_loading ? 'animation: pulse 1s infinite alternate;' : ''}"></span>
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
