/**
 * DAVID AI Chat Component - Sidebar Embedded Version
 * Dynamic AI Visual Intelligence Dashboard
 */
class DavidChat {
    constructor(options = {}) {
        this.containerId = options.containerId;
        this.history = [];
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
            .david-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                width: 100%;
                color: var(--txt);
                font-family: var(--font);
                background: var(--bg);
            }
            .david-chat-header {
                padding: 24px 30px;
                border-bottom: 1px solid var(--bdr);
                background: var(--s1);
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

        container.innerHTML = `
            <div class="david-container">
                <div class="david-chat-header">
                    <h2><span style="font-size:24px">🧠</span> DAVID Intelligence Hub</h2>
                    <p>Dynamic AI Visual Intelligence Dashboard &bull; Access Level: SIPS Master Admin</p>
                </div>
                <div class="david-quick-actions" id="david-qa">
                    <button class="david-qa-btn" onclick="DAVID.handleQA('Compare all facility registration volumes')">📊 Compare Facilities</button>
                    <button class="david-qa-btn" onclick="DAVID.handleQA('Summarize training audit for current staff')">🎓 Training Audit</button>
                    <button class="david-qa-btn" onclick="DAVID.handleQA('Show recent registration trends')">📈 Trend Analysis</button>
                </div>
                <div class="david-messages-area" id="david-msgs">
                    <div class="david-msg david-msg-ai fade-in">
                        Greetings, Master Admin. I am DAVID, your Strategic Intelligence Assistant. I have indexed the latest SIPS platform data. How can I assist with reports or comparisons today?
                    </div>
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
    }

    handleQA(text) {
        this.input.value = text;
        this.sendMessage();
    }

    getPlatformSnapshot() {
        // Generate a concise snapshot of the platform data for AI context
        if(!window.DB) return "No data available.";
        
        const staffCount = DB.users ? DB.users.filter(u => u.role === 'staff_member').length : 0;
        const facilityCount = DB.facilities ? DB.facilities.length : 0;
        const regCount = DB.registrations ? DB.registrations.length : 0;
        
        return `
            PLATFORM SNAPSHOT:
            - Total Staff: ${staffCount}
            - Total Facilities: ${facilityCount}
            - Total Pending Registrations: ${regCount}
            - Active Master Admins: ${DB.users ? DB.users.filter(u => u.role === 'master_admin').length : 0}
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
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'david-typing fade-in';
        typingIndicator.innerText = 'DAVID is thinking...';
        this.msgArea.appendChild(typingIndicator);
        this.msgArea.scrollTop = this.msgArea.scrollHeight;

        try {
            const token = window.SB_SESSION ? window.SB_SESSION.access_token : '';
            const snapshot = this.getPlatformSnapshot();
            
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    message: text, 
                    history: this.history,
                    context: snapshot
                })
            });
            const data = await res.json();
            
            typingIndicator.remove();
            
            if (data.success) {
                this.addMessage(data.response, 'ai');
                
                // If the response contains report triggers, render action buttons
                if (data.action === 'trigger_report') {
                   this.renderActionCard(data.action_payload);
                }

                this.history.push({ role: 'user', content: text }, { role: 'assistant', content: data.response });
                if (this.history.length > 20) this.history = this.history.slice(-20);
            } else {
                this.addMessage('System Exception: ' + (data.error || 'Request failure encountered.'), 'ai');
            }
        } catch (e) {
            typingIndicator.remove();
            this.addMessage('Network Error: DAVID terminal connection disrupted.', 'ai');
        } finally {
            this.isThinking = false;
            this.btn.disabled = false;
        }
    }

    addMessage(text, role) {
        const div = document.createElement('div');
        div.className = `david-msg david-msg-${role} fade-in`;
        div.innerText = text;
        this.msgArea.appendChild(div);
        this.msgArea.scrollTop = this.msgArea.scrollHeight;
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
