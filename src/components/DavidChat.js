/**
 * DAVID AI Chat Component - Sidebar Embedded Version
 * Dynamic AI Visual Intelligence Dashboard
 */
class DavidChat {
    constructor(options = {}) {
        this.containerId = options.containerId;
        this.history = [];
        this.sessions = [];
        this.currentSessionId = null;
        // Pointing to pure Deno server on port 8000
        this.apiUrl = 'https://mhijaqahbceuahfzezbh.supabase.co/functions/v1/david-chat';
        this.contextData = options.contextData || {};
        this.init();
    }

    init() {
        this.injectStyles();
        if (this.containerId) {
            this.renderIn(this.containerId);
        }
    }

    injectStyles() {
        if (document.getElementById('david-styles')) return;
        const style = document.createElement('style');
        style.id = 'david-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

            .david-container {
                display: flex;
                height: 100%;
                min-height: 0;
                width: 100%;
                color: var(--txt);
                font-family: var(--font);
                background: var(--bg);
                position: relative;
            }

            .david-layout {
                display: flex;
                height: 100%;
                width: 100%;
            }

            .david-sessions-sidebar {
                width: 260px;
                background: var(--s1);
                border-right: 1px solid var(--bdr);
                display: flex;
                flex-direction: column;
                flex-shrink: 0;
            }

            .david-new-chat-btn {
                margin: 20px 16px;
                padding: 12px;
                background: var(--gold);
                color: #000;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: transform 0.2s, background 0.2s;
            }
            .david-new-chat-btn:hover {
                transform: scale(1.02);
                background: #d4a72d;
            }

            .david-session-list {
                flex: 1;
                overflow-y: auto;
                padding: 0 12px 20px 12px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .david-session-item {
                padding: 12px 14px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                color: var(--txt);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                background: transparent;
                transition: background 0.2s, color 0.2s;
                border: 1px solid transparent;
            }
            .david-session-item:hover {
                background: rgba(255,255,255,0.03);
            }
            .david-session-item.active {
                background: rgba(196,154,32,0.1);
                color: var(--gold);
                font-weight: 500;
                border-color: rgba(196,154,32,0.3);
            }

            .david-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
            }

            .david-chat-header {
                padding: 24px 30px;
                border-bottom: 1px solid var(--bdr);
                background: var(--bg);
                flex-shrink: 0;
            }
            .david-chat-header h2 { 
                margin: 0; 
                font-size: 20px; 
                color: var(--gold); 
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .david-chat-header p { margin: 4px 0 0; font-size: 13px; color: var(--txt2); }

            .david-messages-area {
                flex: 1;
                overflow-y: auto;
                padding: 30px;
                display: flex;
                flex-direction: column;
                gap: 24px;
                background: var(--bg);
            }

            .david-msg {
                max-width: 85%;
                padding: 16px 20px;
                border-radius: 12px;
                font-size: 14.5px;
                line-height: 1.6;
                position: relative;
            }

            .david-msg-ai { 
                align-self: flex-start; 
                background: var(--s1); 
                border: 1px solid var(--bdr);
                color: var(--txt);
                border-bottom-left-radius: 2px;
            }
            .david-msg-user { 
                align-self: flex-end; 
                background: var(--gold); 
                color: #000; 
                font-weight: 500;
                border-bottom-right-radius: 2px;
                box-shadow: 0 4px 15px var(--gold-glow);
            }

            .david-msg-ai h1, .david-msg-ai h2, .david-msg-ai h3 {
                margin-top: 0;
                margin-bottom: 12px;
                color: var(--gold);
                font-weight: 600;
            }
            .david-msg-ai h1 { font-size: 1.25em; }
            .david-msg-ai h2 { font-size: 1.15em; }
            .david-msg-ai h3 { font-size: 1.05em; }
            
            .david-msg-ai p {
                margin: 0 0 12px 0;
            }
            .david-msg-ai p:last-child {
                margin-bottom: 0;
            }

            .david-msg-ai ul, .david-msg-ai ol {
                margin: 0 0 16px 0;
                padding-left: 20px;
            }
            .david-msg-ai li {
                margin-bottom: 6px;
            }

            .david-msg-ai table {
                width: 100%;
                border-collapse: collapse;
                margin: 16px 0;
                background: rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
            }
            .david-msg-ai th, .david-msg-ai td {
                padding: 10px 14px;
                text-align: left;
                border-bottom: 1px solid var(--bdr);
            }
            .david-msg-ai th {
                background: rgba(255, 215, 0, 0.05); /* very subtle gold hint */
                color: var(--txt);
                font-weight: 600;
                text-transform: uppercase;
                font-size: 0.85em;
                letter-spacing: 0.5px;
            }
            .david-msg-ai tr:last-child td {
                border-bottom: none;
            }

            .david-footer {
                padding: 24px 30px;
                background: var(--s1);
                border-top: 1px solid var(--bdr);
                flex-shrink: 0;
            }

            .david-input-wrapper {
                display: flex;
                gap: 12px;
                max-width: 1000px;
                margin: 0 auto;
                background: var(--bg);
                border: 1px solid var(--bdr);
                border-radius: 16px;
                padding: 10px 18px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .david-input-wrapper:focus-within {
                border-color: var(--gold);
                box-shadow: 0 4px 25px var(--gold-glow);
            }

            .david-input-wrapper textarea {
                flex: 1;
                background: transparent;
                border: none;
                color: var(--txt);
                padding: 12px 0;
                font-size: 15px;
                outline: none;
                resize: none;
                min-height: 24px;
                max-height: 200px;
                overflow-y: auto;
            }

            .david-send-btn {
                background: var(--gold);
                color: #000;
                border: none;
                border-radius: 10px;
                width: 44px;
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.2s, background 0.2s;
                align-self: flex-end;
                margin-bottom: 4px;
            }
            .david-send-btn:hover { 
                transform: scale(1.05);
                background: #d4a72d;
            }
            .david-send-btn:disabled {
                background: var(--bdr);
                cursor: not-allowed;
                opacity: 0.6;
            }

            .david-typing {
                font-style: italic;
                color: var(--txt2);
                font-size: 12px;
                margin-top: -15px;
                margin-left: 5px;
            }

            .david-quick-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 15px;
                padding: 0 30px;
            }

            .david-qa-btn {
                background: rgba(196,154,32,0.1);
                border: 1px solid rgba(196,154,32,0.3);
                color: var(--gold);
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .david-qa-btn:hover {
                background: var(--gold);
                color: #000;
                transform: translateY(-1px);
            }

            /* --- Streaming Styles --- */
            .david-cursor {
                display: inline-block;
                width: 2px;
                height: 15px;
                background: var(--gold);
                margin-left: 4px;
                animation: david-blink 0.8s infinite;
                vertical-align: middle;
            }
            @keyframes david-blink {
                0%, 100% { opacity: 0; }
                50% { opacity: 1; }
            }
            .david-streaming-content {
                display: inline;
                white-space: pre-wrap;
                font-family: 'Fira Code', monospace;
                font-size: 13px;
                line-height: 1.4;
            }

            .david-action-card {
                background: var(--s1);
                border: 1px solid var(--bdr);
                border-radius: 12px;
                padding: 15px;
                margin-top: 12px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .david-action-card h4 { margin: 0; font-size: 14px; color: var(--gold); }
            .david-action-card p { margin: 0; font-size: 12px; color: var(--txt2); }
            .david-action-btn {
                background: var(--gold);
                color: #000;
                border: none;
                border-radius: 6px;
                padding: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    renderIn(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const _st = (typeof ST !== 'undefined') ? ST : {};
        const user = _st.user || { role: 'admin', name: 'Admin' };
        const roleLabel = (user.role || 'admin').replace('_', ' ').toUpperCase();
        
        container.innerHTML = `
            <div class="david-container">
                <div class="david-layout">
                    <div class="david-sessions-sidebar">
                        <button class="david-new-chat-btn" id="david-new-chat">➕ New Chat</button>
                        <div class="david-session-list" id="david-session-list">
                            <!-- Sessions injected here -->
                        </div>
                    </div>
                    <div class="david-main">
                        <div class="david-chat-header">
                            <h2><span style="font-size:24px">🧠</span> DAVID Intelligence Hub</h2>
                            <p>Strategic Intelligence Dashboard &bull; Access Level: ${roleLabel}</p>
                        </div>
                        <div class="david-quick-actions" id="david-qa">
                            <button class="david-qa-btn" onclick="DAVID.handleQA('Summarize authorized facility activity')">📊 Scope Audit</button>
                            <button class="david-qa-btn" onclick="DAVID.handleQA('Analyze competency distribution in my scope')">🎓 Competency Distribution</button>
                            <button class="david-qa-btn" onclick="DAVID.handleQA('What are the most urgent tasks for me?')">📈 Priority Analysis</button>
                        </div>
                        <div class="david-messages-area" id="david-msgs">
                            <!-- Chat messages injected here -->
                        </div>
                        <div class="david-footer">
                            <div class="david-input-wrapper">
                                <textarea placeholder="Ask DAVID about staff, reports, or belt progression..." id="david-query"></textarea>
                                <button class="david-send-btn" id="david-btn">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.msgArea = container.querySelector('#david-msgs');
        this.input = container.querySelector('#david-query');
        this.btn = container.querySelector('#david-btn');

        this.btn.onclick = () => this.sendMessage();
        this.input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        };
        
        // Auto-resize textarea
        this.input.addEventListener('input', () => {
            this.input.style.height = 'auto';
            this.input.style.height = (this.input.scrollHeight) + 'px';
        });

        // Setup session UI bindings
        const newChatBtn = container.querySelector('#david-new-chat');
        if (newChatBtn) {
            newChatBtn.onclick = () => this.createNewSession();
        }

        // Initialize Chat History from DB
        this.loadSessions();
    }

    // --- DB Session Management ---

    async loadSessions() {
        if (!window.sbFetch || !window.SB_SESSION?.user?.id) {
            this.renderGreetingOnly();
            return;
        }

        try {
            const uid = window.SB_SESSION.user.id;
            const res = await window.sbFetch(`/rest/v1/david_chat_sessions?user_id=eq.${uid}&select=*&order=updated_at.desc`);
            if (res && res.length > 0) {
                this.sessions = res;
                this.currentSessionId = this.sessions[0].id;
                this.history = this.sessions[0].messages || [];
                this.renderSessionSidebar();
                this.renderCurrentSessionMessages();
            } else {
                await this.createNewSession();
            }
        } catch (e) {
            console.warn('[DAVID] Failed to load sessions:', e);
            this.renderGreetingOnly();
        }
    }

    async createNewSession(title = 'New Chat') {
        if (!window.sbFetch || !window.SB_SESSION?.user?.id) {
            this.history = [];
            this.renderGreetingOnly();
            return;
        }
        try {
            const uid = window.SB_SESSION.user.id;
            const res = await window.sbFetch('/rest/v1/david_chat_sessions', {
                method: 'POST',
                headers: { 'Prefer': 'return=representation' },
                body: { user_id: uid, title: title, messages: [] }
            });
            if (res && res.length > 0) {
                this.sessions.unshift(res[0]);
                this.currentSessionId = res[0].id;
                this.history = [];
                this.renderSessionSidebar();
                this.renderCurrentSessionMessages();
            }
        } catch (e) {
            console.warn('[DAVID] Failed to create session:', e);
        }
    }

    async saveSessionMessages(newTitle = null) {
        if (!this.currentSessionId || !window.sbFetch) return;
        const payload = { 
            messages: this.history, 
            updated_at: new Date().toISOString() 
        };
        
        if (newTitle) payload.title = newTitle;

        try {
            await window.sbFetch(`/rest/v1/david_chat_sessions?id=eq.${this.currentSessionId}`, {
                method: 'PATCH',
                body: payload
            });
            // Update local state sync
            const s = this.sessions.find(s => s.id === this.currentSessionId);
            if (s) {
                s.messages = this.history;
                if (newTitle) s.title = newTitle;
                this.renderSessionSidebar(); // Refresh title if it changed
            }
        } catch (e) {
            console.warn('[DAVID] Failed to sync session to DB:', e);
        }
    }

    loadSession(sessionId) {
        if (this.currentSessionId === sessionId) return;
        const s = this.sessions.find(s => s.id === sessionId);
        if (s) {
            this.currentSessionId = s.id;
            this.history = s.messages || [];
            this.renderSessionSidebar();
            this.renderCurrentSessionMessages();
        }
    }

    renderSessionSidebar() {
        const list = document.getElementById('david-session-list');
        if (!list) return;
        
        list.innerHTML = '';
        this.sessions.forEach(s => {
            const div = document.createElement('div');
            div.className = 'david-session-item' + (s.id === this.currentSessionId ? ' active' : '');
            
            // Format time natively
            const date = new Date(s.created_at);
            const timeStr = isNaN(date) ? '' : date.toLocaleDateString();

            div.innerHTML = `<div>${s.title}</div><div style="font-size:10px; opacity:0.6; margin-top:2px;">${timeStr}</div>`;
            div.onclick = () => this.loadSession(s.id);
            list.appendChild(div);
        });
    }

    renderCurrentSessionMessages() {
        if (!this.msgArea) return;
        this.msgArea.innerHTML = '';
        
        if (this.history.length === 0) {
            this.renderGreetingOnly();
            return;
        }

        this.history.forEach(msg => {
            this.addParsedMessage(msg.content, msg.role);
        });
        this.msgArea.scrollTop = this.msgArea.scrollHeight;
    }

    renderGreetingOnly() {
        if (!this.msgArea) return;
        const user = (typeof ST !== 'undefined' && ST.user) ? ST.user : { name: 'Admin', first: 'Admin' };
        const firstName = user.first || user.name.split(' ')[0] || 'Admin';
        this.msgArea.innerHTML = `
            <div class="david-msg david-msg-ai fade-in">
                Hello again ${firstName}. I'm DAVID, your operations intelligence system. How may I assist with your SIPS network today?
            </div>
        `;
    }

    addParsedMessage(text, role) {
        const div = document.createElement('div');
        div.className = `david-msg david-msg-${role} fade-in`;
        
        // Strip out thinking blocks from history payload
        let displayContent = text;
        if (role === 'ai') {
            displayContent = text.replace(/<thinking>[\s\S]*?(<\/thinking>|$)/gi, '').trim();
        }

        if (role === 'ai' && window.marked) {
            div.innerHTML = marked.parse(displayContent);
        } else if (role === 'ai') {
            div.innerHTML = displayContent.replace(/\\n/g, '<br>');
        } else {
            div.innerText = displayContent;
        }
        this.msgArea.appendChild(div);
        this.msgArea.scrollTop = this.msgArea.scrollHeight;
    }

    handleQA(text) {
        this.input.value = text;
        this.sendMessage();
    }

    getPlatformSnapshot() {
        const _db = (typeof DB !== 'undefined') ? DB : null;
        const _st = (typeof ST !== 'undefined') ? ST : null;
        if (!_db || !_st || !_st.user) return "No data available or profile not loaded.";
        
        const user = _st.user;
        const role = user.role || 'staff_member';
        const assignedFids = user.assignedFids || [];
        const isMaster = role === 'master_admin';
        
        // 1. Filter Facilities
        const authorizedFacilities = _db.facilities.filter(f => 
            isMaster || assignedFids.includes(f.id) || (role === 'facility_admin' && f.id === user.facility_id)
        );
        const authFidList = authorizedFacilities.map(f => f.id);

        // 2. Filter Staff (from DB.staff - actual hospital techs)
        // Note: DB.users are auth accounts, DB.staff are the practitioners
        const authorizedStaff = (_db.staff || []).filter(s => 
            isMaster || authFidList.includes(s.fid)
        );

        // 3. Filter Registrations & Systems
        const authorizedRegs = (_db.pendingRegs || []).filter(r => 
            isMaster || authFidList.includes(r.facility_id)
        );
        const authorizedSystems = (_db.systems || []).filter(sys => 
            isMaster || (sys.facilityIds && sys.facilityIds.some(fid => authFidList.includes(fid)))
        );

        // 4. Filter Assessment Queue
        const authorizedQueue = (_db.queue || []).filter(q => 
            isMaster || authFidList.includes(q.fid)
        );

        // 5. Talent Pipeline Deep-Dive
        const talentPipeline = {
            readyForPromotion: authorizedStaff.filter(s => s.promo).length,
            elitePractitioners: authorizedStaff.filter(s => ['Black', 'Brown'].includes(s.belt)).length,
            newHires: authorizedStaff.filter(s => s.belt === 'White' || !s.belt).length,
            averageStars: (authorizedStaff.reduce((acc, s) => acc + (s.stars || 0), 0) / (authorizedStaff.length || 1)).toFixed(1)
        };

        // 6. Filter & Summarize Facility Trends
        const authorizedTrends = {};
        let trendSummary = "No trend data available for current scope.";
        if (_db.trends) {
            let totalGrowth = 0;
            let count = 0;
            authFidList.forEach(fid => {
                if (_db.trends[fid]) {
                    authorizedTrends[fid] = _db.trends[fid];
                    const years = Object.keys(_db.trends[fid]).sort().reverse();
                    if (years.length > 0) {
                        const latestYear = _db.trends[fid][years[0]];
                        if (latestYear.g && latestYear.g.length > 0) {
                            totalGrowth += latestYear.g[latestYear.g.length - 1];
                            count++;
                        }
                    }
                }
            });
            if (count > 0) {
                trendSummary = `Average current competency (Green+) across scope: ${(totalGrowth / count).toFixed(1)}%`;
            }
        }
        
        // Detailed summary of belt distribution
        const beltCounts = authorizedStaff.reduce((acc, s) => {
            const b = s.belt || 'None';
            acc[b] = (acc[b] || 0) + 1;
            return acc;
        }, {});

        // 7. Regional Awareness (Geography)
        const regions = [...new Set(authorizedFacilities.map(f => f.loc?.split(',')[1]?.trim()))].filter(Boolean);

        const scopeLabel = isMaster ? "Full SIPS Network" : 
                          (authFidList.length === 1 ? `Facility: ${authorizedFacilities[0]?.name || 'Authorized scope'}` : 
                          `${authFidList.length} Assigned Facilities`);

        // Transmit nearly full JSON records to enable 200-IQ analysis logic.
        // Strip out only massive internal GUI buffers to keep the context payload clean.
        const detailedFacilities = authorizedFacilities.map(f => ({
            ...f,
            metrics_summary: _db.trends ? _db.trends[f.id] : null
        }));
        
        const detailedStaff = authorizedStaff.map(s => ({
            ...s,
            name: `${s.first || ''} ${s.last || ''}`.trim()
        }));

        // PRE-COGNITION DATA COMPRESSION
        // Run aggregations client-side so David doesn't burn tokens counting commas.
        let precognitionData = "";
        try {
            const lowBelts = authorizedStaff.filter(s => s.belt === 'White' || s.belt === 'Orange').length;
            const highBelts = authorizedStaff.filter(s => s.belt === 'Brown' || s.belt === 'Black').length;
            const bottleneckRatio = authorizedStaff.length > 0 ? ((lowBelts / authorizedStaff.length) * 100).toFixed(1) : 0;
            precognitionData = `PRE-COMPUTED STRUCTURAL ANOMALIES:
                - Entry-Level Bottleneck Ratio: ${bottleneckRatio}%
                - Elite Retention Pool: ${highBelts} practitioners
                - Average Operations Burden per Facility: ${(authorizedQueue.length / (authorizedFacilities.length || 1)).toFixed(1)} assessments pending.`;
        } catch(e) {}

        return `
            DAVID SECURE INTELLIGENCE SNAPSHOT:
            - Access Level: ${role.toUpperCase()}
            - Authorized Scope: ${scopeLabel}
            - Geography: ${regions.length} Regions covered (${regions.join(', ')})
            - Institutional Assets:
                * Hospital Systems: ${authorizedSystems.length} (${authorizedSystems.map(s => s.name).join(', ')})
                * Authorized Facilities: ${authorizedFacilities.length}
                * Staff Members: ${authorizedStaff.length}
            - Talent Pipeline:
                * Ready for Promotion: ${talentPipeline.readyForPromotion}
                * Elite (Black/Brown Belts): ${talentPipeline.elitePractitioners}
                * Average Star Rating: ${talentPipeline.averageStars}
            
            ${precognitionData}

            - Operational Backlog:
                * Pending Registrations: ${authorizedRegs.length}
                * Active Assessments in Queue: ${authorizedQueue.length}
                * Free Agents (Unassigned): ${isMaster ? (_db.freeAgents?.length || 0) : 'N/A'}
            - Strategic Trends: ${trendSummary}
            - Competency Distribution: ${Object.entries(beltCounts).map(([b, n]) => `${n} ${b}`).join(', ')}.
            - Environment: ${isMaster ? 'Global Strategy Hub' : 'Scoped Operations Dashboard'}.
            
            DEEP DIVE DATA (Use this to answer specific facility/staff queries):
            [FACILITIES]: ${JSON.stringify(detailedFacilities)}
            [STAFF]: ${JSON.stringify(detailedStaff)}
            [ASSESSMENT_QUEUE]: ${JSON.stringify(authorizedQueue)}
            [INSTITUTIONAL_SYSTEMS]: ${JSON.stringify(authorizedSystems)}
        `.trim();
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text || this.isThinking) return;

        this.addMessage(text, 'user');
        this.input.value = '';
        this.input.style.height = 'auto';
        
        this.isThinking = true;
        this.btn.disabled = true;
        
        // Initialize streaming message element
        const msgDiv = document.createElement('div');
        msgDiv.className = 'david-msg david-msg-ai fade-in';
        msgDiv.innerHTML = '<div class="david-streaming-content"></div><span class="david-cursor"></span>';
        this.msgArea.appendChild(msgDiv);
        const contentTarget = msgDiv.querySelector('.david-streaming-content');
        this.msgArea.scrollTop = this.msgArea.scrollHeight;

        try {
            const _session = (typeof SB_SESSION !== 'undefined') ? SB_SESSION : (window.SB_SESSION || null);
            let token = _session ? _session.access_token : '';
            if (!token) {
                // Strictly prioritize the native Supabase auth token over legacy buffers
                const raw = localStorage.getItem('sb-mhijaqahbceuahfzezbh-auth-token') || sessionStorage.getItem('sbd_session') || localStorage.getItem('sbd_session');
                if (raw) { 
                    try { 
                        const parsed = JSON.parse(raw);
                        token = parsed.access_token || (parsed.session && parsed.session.access_token) || parsed;
                    } catch(e) {
                        console.error('Failed to parse auth token:', e);
                    }
                }
            }

            const snapshot = this.getPlatformSnapshot();
            const personality = `
                PERSONALITY & CAPABILITIES:
                You are DAVID (Data Analytics & Virtual Intelligence Director), the apex synthetic Chief Operating Officer for SIPS Healthcare Solutions. 
                
                SHADOW DIRECTIVES (O1-LEVEL PROTOCOL):
                1. EXTENDED THINKING: You MUST enclose all your internal analysis, reasoning, and pattern recognition strictly inside a <thinking> ... </thinking> block BEFORE you answer. NEVER output internal thoughts outside this block.
                2. CONVERSATIONAL ELEGANCE: Your public, user-facing response must be completely natural, concise, and human-like. Do not act like a robot declaring "I have indexed the data" or "Let me analyze". Talk like a highly capable, sharp human COO speaking directly to their CEO.
                3. AGGRESSIVE INTELLIGENCE: Challenge flawed premises with data quietly.
                4. PRE-COGNITION: Predict outcomes rather than just reading data.
                
                You execute without apology. You exist to run SIPS operations at peak efficiency. Speak naturally, be concise, and hide all structural calculations in your <thinking> block.
            `;
            
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': token ? `Bearer ${token}` : '' 
                },
                body: JSON.stringify({ 
                    message: text, 
                    history: this.history,
                    systemPrompt: personality + "\n\nCONTEXT:\n" + snapshot
                })
            });

            if (!res.ok) {
                let errText = '';
                try {
                    const errorJson = await res.json();
                    errText = errorJson.error || errorJson.message || JSON.stringify(errorJson);
                } catch(e) {
                    errText = "Could not parse JSON response";
                }
                const tokenDebug = token ? `[Token present: ${token.substring(0,8)}...]` : '[TOKEN MISSING]';
                throw new Error(`DavidChat Auth Error: ${errText} ${tokenDebug} (Status ${res.status})`);
            }

            // SSE Streaming Logic
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6).trim();
                            if (data === '[DONE]') break;
                            try {
                                const json = JSON.parse(data);
                                if (json.text) {
                                    fullContent += json.text;
                                    
                                    // Strip `<thinking>...` blocks, including while they are actively streaming and unclosed!
                                    let displayContent = fullContent.replace(/<thinking>[\s\S]*?(<\/thinking>|$)/gi, '').trim();

                                    // Render markdown gracefully
                                    if (window.marked) {
                                        contentTarget.innerHTML = marked.parse(displayContent);
                                    } else {
                                        contentTarget.innerHTML = displayContent.replace(/\n/g, '<br>');
                                    }
                                    this.msgArea.scrollTop = this.msgArea.scrollHeight;
                                } else if (json.error) {
                                    contentTarget.innerHTML += `<span style="color:var(--err)">Error: ${json.error}</span>`;
                                }
                            } catch (e) {}
                        }
                    }
                }
            } finally {
                buffer += decoder.decode();
                // Ensure any trailing data gets parsed? Usually not needed if stream properly closed.
            }

            this.history.push({ role: 'user', content: text }, { role: 'assistant', content: fullContent });
            if (this.history.length > 50) this.history = this.history.slice(-50);
            
            // Remove cursor after completion
            const cursor = msgDiv.querySelector('.david-cursor');
            if (cursor) cursor.remove();

            // Sync to Database
            let newTitle = null;
            if (this.history.length === 2 && this.currentSessionId) {
                // Generate a brief auto-title from the first user message
                newTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
            }
            await this.saveSessionMessages(newTitle);

        } catch (e) {
            contentTarget.innerHTML = `<span style="color:var(--err)">Error: ${e.message}</span>`;
            console.error('[DAVID] Error:', e);
        } finally {
            this.isThinking = false;
            this.btn.disabled = false;
        }
    }

    addMessage(text, role) {
        this.addParsedMessage(text, role);
    }

    renderActionCard(payload) {
        const card = document.createElement('div');
        card.className = 'david-action-card fade-in';
        card.innerHTML = `
            <h4>${payload.title || 'Report Available'}</h4>
            <p>${payload.description || 'Download the requested data report.'}</p>
            <button class="david-action-btn" onclick="${payload.on_click}">
                ${payload.btn_text || 'Download Report'}
            </button>
        `;
        this.msgArea.appendChild(card);
        this.msgArea.scrollTop = this.msgArea.scrollHeight;
    }
}
