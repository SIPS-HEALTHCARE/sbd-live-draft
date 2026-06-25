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
        this.renderTelemetry();
        
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
        
        let apiData = { analytics: [], access: [], mtd: {} };
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
                const mtdRecord = (apiData.mtd && apiData.mtd[fac.id]) ? apiData.mtd[fac.id] : { tokens: 0, cost: 0 };
                return {
                    id: fac.id,
                    name: fac.name || 'Unnamed Facility',
                    is_active: accessRecord ? accessRecord.is_active : false,
                    tier: accessRecord ? accessRecord.tier : 'base',
                    usage_tier: accessRecord && accessRecord.usage_tier ? accessRecord.usage_tier : 'included',
                    questions_allowance: accessRecord && accessRecord.questions_allowance ? accessRecord.questions_allowance : 250,
                    questions_consumed: accessRecord && accessRecord.questions_consumed ? accessRecord.questions_consumed : 0,
                    reserve_consumed: accessRecord && accessRecord.reserve_consumed ? accessRecord.reserve_consumed : 0,
                    period_start: accessRecord ? accessRecord.period_start : null,
                    // MTD figures (month-scoped) for the cost/token tiles — questions drive the throttle.
                    tokens_used: mtdRecord.tokens || 0,
                    cost_mtd: mtdRecord.cost || 0
                };
            });
        } else {
            this.facilities = [
                { id: 'fac_1', name: 'Alta Bates Summit Medical Center', is_active: true, tier: 'premium', usage_tier: 'standard', questions_allowance: 2500, tokens_used: 14500 },
                { id: 'fac_2', name: 'Mercy Hospital Group', is_active: false, tier: 'base', usage_tier: 'included', questions_allowance: 250, tokens_used: 0 },
                { id: 'fac_3', name: 'Sutter Health Main Campus', is_active: true, tier: 'supreme', usage_tier: 'power', questions_allowance: 7500, tokens_used: 82000 },
                { id: 'fac_4', name: 'Kaiser Permanente Oakland', is_active: false, tier: 'base', usage_tier: 'included', questions_allowance: 250, tokens_used: 1200 }
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
        this.renderTelemetry();
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
        this.renderTelemetry();
    }

    async updateUsageTier(facilityId, newUsageTier) {
        const token = this.getAuthToken();
        if (!token) {
            this.showToast('Authentication error. Please log in again.', 'error');
            return;
        }

        const fac = this.facilities.find(f => f.id === facilityId);
        if (!fac) return;
        if (fac.is_loading) return;

        const ALLOWANCE = { included: 250, starter: 750, standard: 2500, power: 7500 };
        const prevUsageTier = fac.usage_tier;
        const prevAllowance = fac.questions_allowance;

        fac.is_loading = true;
        this.renderTable(); // Show loading state

        try {
            console.log(`[DAVID Dashboard] UPDATE_USAGE_TIER: ${facilityId} → ${newUsageTier}`);
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'UPDATE_USAGE_TIER', payload: { facilityId, usageTier: newUsageTier } })
            });

            const json = await res.json();
            console.log('[DAVID Dashboard] USAGE_TIER response:', json);

            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Usage tier update failed on server');
            }

            fac.usage_tier = newUsageTier;
            fac.questions_allowance = (json.data && json.data.questions_allowance) || ALLOWANCE[newUsageTier] || prevAllowance;
            fac.is_loading = false;
            this.showToast(`Plan set to ${newUsageTier.toUpperCase()} (${fac.questions_allowance.toLocaleString()} questions/mo) for ${fac.name}`, 'success');
        } catch (e) {
            console.error('[DAVID Dashboard] Usage tier update failed:', e);
            fac.usage_tier = prevUsageTier;
            fac.questions_allowance = prevAllowance;
            fac.is_loading = false;
            this.showToast(`Plan update failed: ${e.message}`, 'error');
        }

        this.renderMetrics();
        this.renderTable();
        this.renderTelemetry();
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
            .dad-kpi-sub {
                font-size: 11px;
                color: var(--txt2);
                margin-top: 6px;
                font-family: 'Fira Code', monospace;
            }
            .dad-telemetry-row {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 12px 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .dad-section-title {
                font-size: 16px;
                font-weight: 700;
                color: var(--gold);
                margin: 32px 0 16px;
            }
            .dad-table-wrapper {
                background: var(--s1);
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                border: 1px solid var(--bdr);
                overflow-x: auto;
            }
            .dad-table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
                min-width: 760px;
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

            /* #9 SIPS plan (billing/volume) colors — distinct from capability tier */
            .dad-plan-included { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }
            .dad-plan-starter  { background: rgba(45, 212, 191, 0.1); color: #2dd4bf; border: 1px solid rgba(45, 212, 191, 0.25); }
            .dad-plan-standard { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
            .dad-plan-power    { background: rgba(196, 154, 32, 0.15); color: var(--gold); border: 1px solid rgba(196, 154, 32, 0.3); box-shadow: 0 0 10px rgba(196, 154, 32, 0.2); }

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
                                <th>SIPS Plan</th>
                                <th>Questions Used (MTD)</th>
                                <th>Status</th>
                                <th>Toggle Access</th>
                            </tr>
                        </thead>
                        <tbody id="dad-table-body"></tbody>
                    </table>
                </div>
                <h2 class="dad-section-title">Live Telemetry · Per-Facility Question Burn</h2>
                <div class="dad-table-wrapper" style="padding: 8px 24px;">
                    <div id="dad-telemetry"></div>
                </div>
            </div>
        `;
    }

    renderMetrics() {
        const kpiArea = document.getElementById('dad-kpi-area');
        if (!kpiArea) return;

        const activeFacs = this.facilities.filter(f => f.is_active);
        const activeCount = activeFacs.length;
        const totalTokens = this.facilities.reduce((acc, f) => acc + (f.tokens_used || 0), 0);
        const totalCost = this.facilities.reduce((acc, f) => acc + (f.cost_mtd || 0), 0);

        // Network question-burn ring = Σ consumed / Σ allowance across ACTIVE facilities (§5).
        const sumConsumed = activeFacs.reduce((a, f) => a + (f.questions_consumed || 0), 0);
        const sumAllowance = activeFacs.reduce((a, f) => a + (f.questions_allowance || 0), 0);
        const ringPct = sumAllowance > 0 ? Math.min(100, Math.round((sumConsumed / sumAllowance) * 100)) : 0;

        kpiArea.innerHTML = `
            <div class="dad-kpi-card">
                <div class="dad-kpi-label">Active Deployments</div>
                <div class="dad-kpi-value" style="display:flex; align-items:center; gap:14px;">
                    <span>${activeCount} <span style="font-size: 16px; color: var(--txt2);">/ ${this.facilities.length}</span></span>
                    ${this.ringSvg(ringPct)}
                </div>
                <div class="dad-kpi-sub">${sumConsumed.toLocaleString()} / ${sumAllowance.toLocaleString()} questions used</div>
            </div>
            <div class="dad-kpi-card">
                <div class="dad-kpi-label">Network Token Usage <span style="opacity:0.6;">· MTD</span></div>
                <div class="dad-kpi-value">${totalTokens.toLocaleString()}</div>
            </div>
            <div class="dad-kpi-card">
                <div class="dad-kpi-label">Estimated AI Cost <span style="opacity:0.6;">· MTD</span></div>
                <div class="dad-kpi-value">$${totalCost.toFixed(2)}</div>
            </div>
        `;
    }

    // Donut ring for the Active Deployments tile (network question burn %).
    ringSvg(pct) {
        const r = 16, c = 2 * Math.PI * r;
        const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
        const color = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : 'var(--gold)';
        return `<svg width="44" height="44" viewBox="0 0 44 44" style="flex:none;">
            <circle cx="22" cy="22" r="${r}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"></circle>
            <circle cx="22" cy="22" r="${r}" fill="none" stroke="${color}" stroke-width="4"
                stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
                stroke-linecap="round" transform="rotate(-90 22 22)"></circle>
            <text x="22" y="26" text-anchor="middle" font-size="11" fill="var(--txt)" font-family="monospace">${pct}%</text>
        </svg>`;
    }

    // Per-facility question burn bar. Color states per §5: green <75, amber 75–90,
    // red 90–100, distinct (pulsing) at ≥100. Shows manager reserve draw when over allowance.
    burnBar(consumed, allowance, reserveConsumed) {
        const a = allowance || 0;
        const used = consumed || 0;
        const pct = a > 0 ? (used / a) * 100 : 0;
        const width = Math.min(100, pct);
        let color, label;
        if (pct >= 100) { color = '#ef4444'; label = 'AT LIMIT'; }
        else if (pct >= 90) { color = '#ef4444'; label = `${Math.round(pct)}%`; }
        else if (pct >= 75) { color = '#f59e0b'; label = `${Math.round(pct)}%`; }
        else { color = '#10b981'; label = `${Math.round(pct)}%`; }
        const reserveNote = (reserveConsumed > 0) ? ` <span style="color:#f59e0b;">+${reserveConsumed} reserve</span>` : '';
        return `<div style="min-width:160px;">
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px; font-family:'Fira Code',monospace;">
                <span>${used.toLocaleString()} / ${a.toLocaleString()}</span>
                <span style="color:${color}; font-weight:600;">${label}${reserveNote}</span>
            </div>
            <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                <div style="height:100%; width:${width}%; background:${color}; border-radius:3px; transition:width .3s;${pct >= 100 ? 'animation:pulse 1s infinite alternate;' : ''}"></div>
            </div>
        </div>`;
    }

    renderTelemetry() {
        const el = document.getElementById('dad-telemetry');
        if (!el) return;
        const active = this.facilities.filter(f => f.is_active);
        if (active.length === 0) {
            el.innerHTML = `<div style="color:var(--txt2); font-size:13px; padding:12px 0;">No active facilities to monitor.</div>`;
            return;
        }
        el.innerHTML = active.map(f => `
            <div class="dad-telemetry-row">
                <div style="flex:1; font-size:13px; font-weight:500;">${f.name}
                    <span class="dad-tier-badge dad-plan-${f.usage_tier}" style="margin-left:8px;">${(f.usage_tier || 'included').toUpperCase()}</span>
                </div>
                <div style="flex:2;">${this.burnBar(f.questions_consumed, f.questions_allowance, f.reserve_consumed)}</div>
            </div>
        `).join('');
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
                <td>
                    <select class="dad-tier-select dad-plan-${f.usage_tier}"
                            style="${f.is_loading ? 'opacity: 0.5; pointer-events: none; cursor: wait;' : ''}"
                            onchange="window.DAVID_DASHBOARD.updateUsageTier('${f.id}', this.value)">
                        <option value="included" ${f.usage_tier === 'included' ? 'selected' : ''}>INCLUDED · 250</option>
                        <option value="starter" ${f.usage_tier === 'starter' ? 'selected' : ''}>STARTER · 750</option>
                        <option value="standard" ${f.usage_tier === 'standard' ? 'selected' : ''}>STANDARD · 2,500</option>
                        <option value="power" ${f.usage_tier === 'power' ? 'selected' : ''}>POWER · 7,500</option>
                    </select>
                </td>
                <td>${this.burnBar(f.questions_consumed, f.questions_allowance, f.reserve_consumed)}</td>
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
