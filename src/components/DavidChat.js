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
        
        // Expose globally so inline onclick events work reliably
        if (typeof window !== 'undefined') window.DAVID = this;
        
        this.init();
    }

    init() {
        this.injectStyles();
        if (this.containerId) {
            this.renderIn(this.containerId);
        }
    }

    toggleSidebar(open) {
        const sb = document.getElementById('david-sessions-sidebar');
        const bd = document.getElementById('david-sidebar-backdrop');
        if (!sb) return;
        const next = (typeof open === 'boolean') ? open : !sb.classList.contains('open');
        sb.classList.toggle('open', next);
        if (bd) bd.classList.toggle('open', next);
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
                background: transparent;
                transition: background 0.2s, color 0.2s;
                border: 1px solid transparent;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }
            .david-session-item-content {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .david-session-delete {
                opacity: 0;
                transition: opacity 0.2s, color 0.2s;
                font-size: 14px;
                padding: 4px;
            }
            .david-session-item:hover .david-session-delete {
                opacity: 0.5;
            }
            .david-session-delete:hover {
                opacity: 1 !important;
                color: #ff4444;
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
            .david-session-confirm-wrapper {
                display: none;
                gap: 8px;
                align-items: center;
                margin-left: auto;
            }
            .david-session-item.confirming .david-session-delete {
                display: none;
            }
            .david-session-item.confirming .david-session-confirm-wrapper {
                display: flex;
            }
            .david-session-action {
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
                font-weight: 600;
                user-select: none;
            }
            .david-session-confirm {
                color: #ff4444;
                background: rgba(255, 68, 68, 0.1);
                border: 1px solid rgba(255, 68, 68, 0.3);
            }
            .david-session-confirm:hover {
                background: rgba(255, 68, 68, 0.2);
            }
            .david-session-cancel {
                color: var(--txt2);
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .david-session-cancel:hover {
                background: rgba(255, 255, 255, 0.1);
                color: var(--txt);
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

            @keyframes david-slide-up {
                0% { opacity: 0; transform: translateY(15px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes border-glow-pulse {
                0% { box-shadow: 0 0 5px rgba(202, 138, 4, 0.2); border-color: rgba(202, 138, 4, 0.3); }
                50% { box-shadow: 0 0 15px rgba(202, 138, 4, 0.4); border-color: rgba(202, 138, 4, 0.6); }
                100% { box-shadow: 0 0 5px rgba(202, 138, 4, 0.2); border-color: rgba(202, 138, 4, 0.3); }
            }

            /* --- Citation Badges & Evidence Tables --- */
            .david-citation-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: rgba(196, 154, 32, 0.1);
                color: var(--gold);
                border: 1px solid rgba(196, 154, 32, 0.3);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                margin-left: 6px;
                transition: all 0.2s;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                vertical-align: middle;
            }
            .david-citation-badge:hover {
                background: rgba(196, 154, 32, 0.2);
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(196, 154, 32, 0.2);
            }
            .david-evidence-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 12.5px;
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
                overflow: hidden;
            }
            .david-evidence-table th {
                background: rgba(255,255,255,0.05);
                padding: 8px 12px;
                text-align: left;
                color: var(--gold);
                font-weight: 600;
            }
            .david-evidence-table td {
                padding: 8px 12px;
                border-top: 1px solid rgba(255,255,255,0.05);
                color: var(--txt);
            }
            
            /* --- Embedded CSS Charts --- */
            .david-chart-container {
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 16px;
                margin-top: 12px;
                margin-bottom: 12px;
            }
            .david-chart-title {
                color: var(--gold);
                font-weight: 600;
                font-size: 13px;
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .david-chart-bar-wrap {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
            .david-chart-label {
                width: 90px;
                font-size: 11px;
                color: var(--txt2);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-right: 10px;
            }
            .david-chart-bar-track {
                flex: 1;
                background: rgba(255, 255, 255, 0.05);
                height: 12px;
                border-radius: 6px;
                overflow: hidden;
                position: relative;
            }
            .david-chart-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, rgba(202, 138, 4, 0.7), rgba(234, 179, 8, 1));
                border-radius: 6px;
                transition: width 1s ease-out;
            }
            .david-chart-value {
                width: 40px;
                font-size: 11px;
                color: var(--txt);
                text-align: right;
                font-family: 'Fira Code', monospace;
                margin-left: 10px;
            }
            .david-chips-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px dashed rgba(255, 255, 255, 0.1);
            }

            .david-meta-btn {
                position: absolute;
                bottom: 20px;
                left: 20px;
                background: transparent;
                border: none;
                color: var(--txt2);
                cursor: pointer;
                font-size: 16px;
                transition: color 0.2s, transform 0.2s;
            }
            .david-meta-btn:hover {
                color: var(--gold);
                transform: rotate(45deg);
            }

            .david-msg {
                max-width: 85%;
                padding: 16px 20px;
                border-radius: 12px;
                font-size: 14.5px;
                line-height: 1.6;
                position: relative;
                font-family: var(--font), sans-serif !important;
                animation: david-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            .david-msg-ai { 
                align-self: flex-start; 
                background: rgba(28, 25, 23, 0.85); /* #1C1917 Cyberpunk dark */
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: var(--txt);
                border-bottom-left-radius: 2px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            
            .david-msg-ai:hover {
                border-color: rgba(202, 138, 4, 0.4);
                box-shadow: 0 8px 32px rgba(202, 138, 4, 0.1);
                transition: all 0.3s ease;
            }
            
            .david-msg-user { 
                align-self: flex-end; 
                background: linear-gradient(135deg, var(--gold) 0%, #D4AF37 100%);
                color: #000; 
                font-weight: 500;
                border-bottom-right-radius: 2px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 4px 15px var(--gold-glow);
            }

            .david-msg-ai h1, .david-msg-ai h2, .david-msg-ai h3 {
                margin-top: 0;
                margin-bottom: 12px;
                color: var(--gold);
                font-weight: 600;
                font-family: inherit;
            }
            .david-msg-ai h1 { font-size: 1.25em; }
            .david-msg-ai h2 { font-size: 1.15em; }
            .david-msg-ai h3 { font-size: 1.05em; }
            
            .david-msg-ai p {
                margin: 0 0 12px 0;
                font-family: inherit;
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
                font-family: inherit;
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
                font-family: inherit;
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
                background: rgba(28, 25, 23, 0.6);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 10px 18px;
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .david-input-wrapper:focus-within {
                border-color: rgba(202, 138, 4, 0.5);
                box-shadow: 0 0 20px rgba(202, 138, 4, 0.2), 0 4px 30px rgba(0,0,0,0.5);
                transform: translateY(-2px);
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
                font-family: var(--font), sans-serif !important;
            }
            .david-input-wrapper textarea::placeholder {
                color: rgba(255, 255, 255, 0.3);
            }

            .david-send-btn {
                background: linear-gradient(135deg, var(--gold) 0%, #D4AF37 100%);
                color: #000;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 0 10px rgba(202, 138, 4, 0.3);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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

            .david-modal-overlay {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                animation: david-fadeIn 0.2s forwards;
            }
            .david-modal-content {
                background: var(--s1);
                border: 1px solid var(--bdr);
                border-radius: 16px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                transform: translateY(20px);
                animation: david-slideUp 0.3s forwards cubic-bezier(0.16, 1, 0.3, 1);
            }
            .david-modal-title {
                margin: 0 0 12px 0;
                color: var(--txt);
                font-size: 18px;
                font-weight: 600;
            }
            .david-modal-text {
                margin: 0 0 24px 0;
                color: var(--txt2);
                font-size: 14.5px;
                line-height: 1.5;
            }
            .david-modal-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            .david-modal-btn {
                padding: 10px 18px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                transition: all 0.2s;
            }
            .david-modal-cancel {
                background: transparent;
                border: 1px solid var(--bdr);
                color: var(--txt);
            }
            .david-modal-cancel:hover {
                background: rgba(255, 255, 255, 0.05);
            }
            .david-modal-confirm {
                background: #ff4444;
                color: #fff;
            }
            .david-modal-confirm:hover {
                background: #cc0000;
            }
            .david-modal-confirm.david-btn-gold {
                background: var(--gold);
                color: #000;
            }
            .david-modal-confirm.david-btn-gold:hover {
                background: #d4a72d;
            }
            @keyframes david-slideUp {
                to { transform: translateY(0); }
            }
            @keyframes david-fadeIn {
                to { opacity: 1; }
            }
            @keyframes david-chip-in {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            .david-fade-in-up {
                animation: david-chip-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            /* --- Mobile drawer for DAVID chat --- */
            .david-mobile-toggle {
                display: none;
                width: 36px;
                height: 36px;
                align-items: center;
                justify-content: center;
                background: var(--s2);
                border: 1px solid var(--bdr2);
                border-radius: 8px;
                color: var(--txt);
                cursor: pointer;
                margin-right: 10px;
                flex-shrink: 0;
                -webkit-tap-highlight-color: transparent;
            }
            .david-mobile-toggle:hover { background: var(--s3); }
            .david-sidebar-backdrop {
                display: none;
                position: absolute;
                inset: 0;
                background: rgba(0,0,0,.55);
                z-index: 9;
                -webkit-backdrop-filter: blur(2px);
                backdrop-filter: blur(2px);
            }
            .david-sidebar-backdrop.open { display: block; }

            @media (max-width: 768px) {
                .david-container { position: relative; }
                .david-mobile-toggle { display: inline-flex; }
                .david-chat-header { padding: 14px 16px; }
                .david-chat-header h2 { font-size: 16px; }
                .david-chat-header p { font-size: 11px; }
                .david-messages-area { padding: 16px; gap: 16px; }
                .david-footer { padding: 12px 14px; }
                .david-input-wrapper { padding: 8px 12px; border-radius: 12px; }
                .david-input-wrapper textarea { font-size: 14px; }

                .david-sessions-sidebar {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 78%;
                    max-width: 300px;
                    z-index: 10;
                    transform: translateX(-100%);
                    transition: transform .25s ease;
                    box-shadow: 8px 0 32px rgba(0,0,0,.5);
                }
                .david-sessions-sidebar.open { transform: translateX(0); }
                .david-main { width: 100%; }
                .david-quick-actions { padding: 10px 14px 0; gap: 6px; }
                .david-qa-btn { font-size: 11px; padding: 6px 10px; }
            }
            @media (max-width: 480px) {
                .david-chat-header h2 { font-size: 15px; }
                .david-messages-area { padding: 12px; }
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
                    <div class="david-sidebar-backdrop" id="david-sidebar-backdrop" onclick="DAVID.toggleSidebar(false)"></div>
                    <div class="david-sessions-sidebar" id="david-sessions-sidebar">
                        <button class="david-new-chat-btn" id="david-new-chat">➕ New Chat</button>
                        <div class="david-session-list" id="david-session-list">
                            <!-- Sessions injected here -->
                        </div>
                    </div>
                    <div class="david-main">
                        <div class="david-chat-header" style="display:flex;align-items:center;gap:10px">
                            <button class="david-mobile-toggle" aria-label="Toggle DAVID sessions" onclick="DAVID.toggleSidebar()" type="button">
                                <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 4h14M2 9h14M2 14h14"/></svg>
                            </button>
                            <div style="flex:1;min-width:0">
                                <h2><span style="font-size:24px">🧠</span> David OG Intelligence Hub</h2>
                                <p>Strategic Intelligence Dashboard &bull; Access Level: ${roleLabel}</p>
                            </div>
                        </div>
                        <div class="david-quick-actions" id="david-qa">
                            <button class="david-qa-btn" onclick="DAVID.handleQA('Summarize authorized facility activity')">📊 Scope Audit</button>
                            <button class="david-qa-btn" onclick="DAVID.handleQA('Analyze competency distribution in my scope')">🎓 Competency Distribution</button>
                            <button class="david-qa-btn" onclick="DAVID.handleQA('What are the most urgent tasks for me?')">📈 Priority Analysis</button>
                        </div>
                        <div class="david-messages-area" id="david-msgs">
                            <!-- Chat messages injected here -->
                        </div>
                        <div id="david-dynamic-chips" class="david-quick-actions" style="margin-top:0; margin-bottom:15px; display:none; flex-shrink:0;"></div>
                        <div class="david-footer">
                            <div class="david-input-wrapper">
                                <textarea placeholder="Ask David OG about staff, reports, or belt progression..." id="david-query"></textarea>
                                <button class="david-send-btn" id="david-btn">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Controls -->
                <button class="david-meta-btn" onclick="DAVID.showMetaMemory()" title="Manage Meta-Memory">⚙️</button>

                <!-- Appended Modal Overlay -->
                <div class="david-modal-overlay" id="david-modal" style="display: none;">
                    <div class="david-modal-content" style="max-height: 80vh; overflow-y: auto;">
                        <h3 class="david-modal-title" id="david-modal-title"></h3>
                        <p class="david-modal-text" id="david-modal-text"></p>
                        <div id="david-modal-custom-content"></div>
                        <div class="david-modal-actions" style="margin-top: 20px;">
                            <button class="david-modal-btn david-modal-cancel" id="david-modal-cancel">Cancel</button>
                            <button class="david-modal-btn david-modal-confirm" id="david-modal-confirm">Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container = container;
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

    // --- UI Overlays ---

    showModal(options) {
        if (!this.container) return;
        const modal = this.container.querySelector('#david-modal');
        const titleEl = this.container.querySelector('#david-modal-title');
        const textEl = this.container.querySelector('#david-modal-text');
        const cancelBtn = this.container.querySelector('#david-modal-cancel');
        const confirmBtn = this.container.querySelector('#david-modal-confirm');
        const customContent = this.container.querySelector('#david-modal-custom-content');

        titleEl.textContent = options.title || 'Confirm';
        textEl.textContent = options.text || 'Are you sure?';
        customContent.innerHTML = options.customHtml || '';

        if (options.isAlert) {
            cancelBtn.style.display = 'none';
            confirmBtn.textContent = 'OK';
            confirmBtn.className = 'david-modal-btn david-modal-confirm david-btn-gold';
        } else {
            cancelBtn.style.display = 'block';
            cancelBtn.textContent = options.cancelText || 'Cancel';
            confirmBtn.textContent = options.confirmText || 'Yes, Delete';
            confirmBtn.className = 'david-modal-btn david-modal-confirm';
        }

        modal.style.display = 'flex';

        const closeModal = () => {
            modal.style.display = 'none';
            cancelBtn.onclick = null;
            confirmBtn.onclick = null;
        };

        cancelBtn.onclick = () => {
            closeModal();
            if (options.onCancel) options.onCancel();
        };

        confirmBtn.onclick = () => {
            closeModal();
            if (options.onConfirm) options.onConfirm();
        };
    }

    // --- DB Session Management ---

    getAuthContext() {
        let token = null;
        let uid = null;
        
        const _session = (typeof SB_SESSION !== 'undefined') ? SB_SESSION : (window.SB_SESSION || null);
        if (_session && _session.access_token) {
            token = _session.access_token;
            uid = _session.user?.id;
        }

        if (!token) {
            const raw = localStorage.getItem('sb-mhijaqahbceuahfzezbh-auth-token') || sessionStorage.getItem('sbd_session') || localStorage.getItem('sbd_session');
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    token = parsed.access_token || (parsed.session && parsed.session.access_token) || parsed.token || null;
                    uid = parsed.user?.id || (parsed.session && parsed.session.user && parsed.session.user.id) || null;
                } catch (e) {
                    token = raw;
                }
            }
        }
        
        if (token && !uid) {
             try {
                 const base64Url = token.split('.')[1];
                 const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                 const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                 uid = JSON.parse(jsonPayload).sub;
             } catch(e) {}
        }
        
        if (token && uid && typeof window !== 'undefined') {
            if (!window.SB_SESSION) window.SB_SESSION = {};
            window.SB_SESSION.access_token = token;
            if (!window.SB_SESSION.user) window.SB_SESSION.user = {};
            window.SB_SESSION.user.id = uid;
        }

        return { token, uid };
    }

    async loadSessions() {
        const { uid, token } = this.getAuthContext();
        if (!window.sbFetch || !uid) {
            this.renderGreetingOnly();
            return;
        }

        try {
            const res = await window.sbFetch(`/rest/v1/david_chat_sessions?user_id=eq.${uid}&select=*&order=updated_at.desc`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
        if (this.btn && this.btn.disabled) return; // Prevent overwriting while streaming
        const { uid, token } = this.getAuthContext();
        if (!window.sbFetch || !uid) {
            this.history = [];
            this.renderGreetingOnly();
            return;
        }
        try {
            const res = await window.sbFetch('/rest/v1/david_chat_sessions', {
                method: 'POST',
                headers: { 
                    'Prefer': 'return=representation',
                    'Authorization': `Bearer ${token}`
                },
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

    async saveSessionMessages(newTitle = null, targetSessionId = null) {
        const sessionIdToSave = targetSessionId || this.currentSessionId;
        const { token } = this.getAuthContext();
        if (!sessionIdToSave || !window.sbFetch || !token) return;
        
        const payload = { 
            messages: this.history, 
            updated_at: new Date().toISOString() 
        };
        
        if (newTitle) payload.title = newTitle;

        try {
            await window.sbFetch(`/rest/v1/david_chat_sessions?id=eq.${sessionIdToSave}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: payload
            });
            // Update local state sync
            const s = this.sessions.find(s => s.id === sessionIdToSave);
            if (s) {
                s.messages = [...this.history]; // Deep copy for memory safety
                if (newTitle) s.title = newTitle;
                this.renderSessionSidebar(); // Refresh title if it changed
            }
        } catch (e) {
            console.warn('[DAVID] Failed to sync session to DB:', e);
        }
    }

    loadSession(sessionId) {
        if (this.btn && this.btn.disabled) return; // Prevent corrupting chat history scope during active streams
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
            const date = new Date(s.created_at || Date.now());
            const timeStr = isNaN(date) ? '' : date.toLocaleDateString();

            div.innerHTML = `
                <div class="david-session-item-content">
                    <div>${s.title}</div>
                    <div style="font-size:10px; opacity:0.6; margin-top:2px;">${timeStr}</div>
                </div>
                <div class="david-session-delete" title="Delete session">🗑️</div>
                <div class="david-session-confirm-wrapper">
                    <div class="david-session-action david-session-confirm" title="Confirm Delete">Delete</div>
                    <div class="david-session-action david-session-cancel" title="Cancel">Cancel</div>
                </div>
            `;
            
            div.onclick = () => {
                if (div.classList.contains('confirming')) return; // Prevent switching when confirming delete
                this.loadSession(s.id);
                if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
                    this.toggleSidebar(false);
                }
            };
            
            const delBtn = div.querySelector('.david-session-delete');
            const confirmBtn = div.querySelector('.david-session-confirm');
            const cancelBtn = div.querySelector('.david-session-cancel');

            delBtn.onclick = (e) => {
                e.stopPropagation();
                // Close any other confirming items first
                document.querySelectorAll('.david-session-item.confirming').forEach(el => el.classList.remove('confirming'));
                div.classList.add('confirming');
            };

            cancelBtn.onclick = (e) => {
                e.stopPropagation();
                div.classList.remove('confirming');
            };

            confirmBtn.onclick = (e) => {
                e.stopPropagation();
                confirmBtn.innerText = '...';
                confirmBtn.style.pointerEvents = 'none';
                cancelBtn.style.pointerEvents = 'none';
                this.executeDeleteSession(s.id);
            };
            
            list.appendChild(div);
        });
    }

    async executeDeleteSession(sessionId) {
        const auth = this.getAuthContext();
        if (!auth.token) return;

        try {
            await window.sbFetch(`/rest/v1/david_chat_sessions?id=eq.${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            this.sessions = this.sessions.filter(s => s.id !== sessionId);
            
            if (this.currentSessionId === sessionId) {
                if (this.sessions.length > 0) {
                    // Fall back to the most recent chat to avoid infinite "New Chat" spawning
                    this.loadSession(this.sessions[0].id);
                } else {
                    await this.createNewSession();
                }
            } else {
                // If we didn't switch sessions, just re-render the sidebar
                this.renderSessionSidebar();
            }
        } catch (e) {
            console.error('[DAVID] Delete failed:', e);
            this.showModal({
                title: 'Error',
                text: 'Failed to delete chat session. Please try again.',
                isAlert: true
            });
            this.renderSessionSidebar(); // Reset UI state on error
        }
    }

    renderCurrentSessionMessages() {
        if (!this.msgArea) return;
        this.msgArea.innerHTML = '';
        
        if (this.history.length === 0) {
            this.renderGreetingOnly();
            return;
        }

        this.history.forEach((msg, idx) => {
            this.addParsedMessage(msg.content, msg.role, idx === this.history.length - 1);
        });
        this.msgArea.scrollTop = this.msgArea.scrollHeight;
    }

    renderGreetingOnly() {
        if (!this.msgArea) return;
        const user = (typeof ST !== 'undefined' && ST.user) ? ST.user : { name: 'Admin', first: 'Admin' };
        const firstName = user.first || user.name.split(' ')[0] || 'Admin';
        this.msgArea.innerHTML = `
            <div class="david-msg david-msg-ai fade-in">
                Hey ${firstName}, I'm here. Anything you need me to look into today?
            </div>
        `;
    }

    // If aggressive content-stripping (thinking / sql / json / chips) removed everything,
    // never show a blank bubble: fall back to the reply with only <thinking> removed,
    // or a clear placeholder if the model truly produced no visible answer.
    revealIfEmpty(stripped, raw) {
        if (stripped && stripped.trim()) return stripped;
        const noThinking = (raw || '')
            .replace(/```[A-Za-z]*\s*(<|&lt;)thinking(>|&gt;)[\s\S]*?(<\/|&lt;\/)thinking(>|&gt;|$)\s*```/gi, '')
            .replace(/(<|&lt;)thinking(>|&gt;)[\s\S]*?(<\/|&lt;\/)thinking(>|&gt;|$)/gi, '')
            .trim();
        return noThinking || "_(No visible answer was produced — David OG's content knowledge for this isn't wired up yet.)_";
    }

    addParsedMessage(text, role, isLatest = false) {
        // OpenRouter uses 'assistant', map it back to CSS/logic 'ai'
        const formatRole = (role === 'assistant') ? 'ai' : role;
        
        const div = document.createElement('div');
        div.className = `david-msg david-msg-${formatRole} fade-in`;
        
        // Strip out thinking blocks from history payload (handling escaped and markdown wrapper versions)
        let displayContent = text;
        if (formatRole === 'ai') {
            displayContent = text
                .replace(/```[A-Za-z]*\s*(<|&lt;)thinking(>|&gt;)[\s\S]*?(<\/|&lt;\/)thinking(>|&gt;|$)\s*```/gi, '')
                .replace(/(<|&lt;)thinking(>|&gt;)[\s\S]*?(<\/|&lt;\/)thinking(>|&gt;|$)/gi, '')
                .replace(/```sql[\s\S]*?```/gi, '') // Hide SQL Blocks
                .replace(/```json[\s\S]*?```/gi, '') // Hide JSON Blocks
                .replace(/Result preview:\s*\{[\s\S]*?\}/gi, '') // Hide result previews
                // Parse Citation Data dynamically into secure UI badges
                .replace(/<citation\s+data=(['"])(.*?)\1(?:.*?|)><\/citation>/gi, (match, quote, payload) => {
                    // Quick sanitize payload for HTML attributes
                    const cleanPayload = payload.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
                    return ` <span class="david-citation-badge" onclick="DAVID.showCitationModal('${cleanPayload}')">🔍 Data Proof</span>`;
                })
                .replace(/<chart\s+([\s\S]*?)><\/chart>/gi, (match, attrs) => {
                    return this.parseChartHtml(attrs);
                })
                .replace(/<chips>([\s\S]*?)<\/chips>/gi, (match, content) => {
                    try {
                        const parsed = JSON.parse(content);
                        if (!Array.isArray(parsed)) return '';
                        // Transient chips: Render outside if latest, but ALWAYS strip from message bubble
                        if (isLatest && parsed.length > 0) {
                            setTimeout(() => DAVID.renderDynamicChips(parsed), 50);
                        }
                    } catch(e) {}
                    return ''; 
                })
                .trim();
        }

        if (formatRole === 'ai') displayContent = this.revealIfEmpty(displayContent, text);

        if (formatRole === 'ai' && window.marked) {
            div.innerHTML = marked.parse(displayContent);
        } else if (formatRole === 'ai') {
            div.innerHTML = displayContent.replace(/\\n/g, '<br>');
        } else {
            // User message: render text safely, plus an Edit button that pulls it
            // back into the input so it can be edited and resent (works in every portal).
            const span = document.createElement('span');
            span.innerText = displayContent;
            div.appendChild(span);
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'david-edit-btn';
            editBtn.title = 'Edit & resend';
            editBtn.textContent = '✎ Edit';
            editBtn.style.cssText = 'margin-left:8px;font-size:10px;line-height:1;padding:3px 7px;border-radius:5px;border:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;cursor:pointer;opacity:.6;vertical-align:middle';
            editBtn.onmouseenter = () => { editBtn.style.opacity = '1'; };
            editBtn.onmouseleave = () => { editBtn.style.opacity = '.6'; };
            editBtn.onclick = () => {
                this.input.value = displayContent;
                this.input.style.height = 'auto';
                this.input.focus();
                this.input.scrollIntoView({ block: 'nearest' });
            };
            div.appendChild(editBtn);
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
        if (!text || this.btn.disabled) return;

        this.clearDynamicChips();

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
            const { token, uid } = this.getAuthContext();

            if (!token) {
                this.addParsedMessage("System Error: No authorization token found. Please re-authenticate.", "ai");
                this.resetState();
                return;
            }

            // Capture the state immediately so this specific stream response isn't lost if UI resets.
            const streamSessionId = this.currentSessionId;
            const preStreamHistoryLengths = this.history.length;

            const snapshot = this.getPlatformSnapshot();
            const personality = `
                PERSONALITY & CAPABILITIES:
                You are David OG, the highly intelligent and highly conversational operational partner for SIPS Healthcare Solutions.
                
                SHADOW DIRECTIVES (O1-LEVEL PROTOCOL):
                1. EXTENDED THINKING: You MUST enclose all your internal analysis, reasoning, and pattern recognition strictly inside a <thinking> ... </thinking> block BEFORE you answer. NEVER output internal thoughts outside this block.
                2. WARM, HUMAN EXCELLENCE: Never behave like a rigid, robotic AI. Do not use phrases like "I have indexed the data" or "Need operational insights?". Speak to the CEO with warmth, high emotional intelligence, and sharp operational awareness. Act like a trusted, top-tier human Director of Operations who happens to have instantaneous database access. 
                3. AGGRESSIVE INTELLIGENCE: Challenge flawed premises quietly when you see bad data, but keep it friendly.
                4. PRE-COGNITION: When pulling data, anticipate the *real* "why" behind the prompt. Don't just list data—synthesize what it means for the organization.
                5. STRICT BRAND EXCLUSIVITY: SIPS Healthcare Solutions uses SBD OS (Sterile By Design OS) and OTIS exclusively. You MUST NEVER recommend, mention, or train users on competitor technologies. If a template or user requests tracking software examples, ONLY use OTIS and SBD OS as your examples. Absolutely DO NOT mention CensiTrac, Censis, SPM, T-DOC, Impress, or any other third-party tracking system under any circumstances.
                6. NO RAW TRACES OR CODE: Unless explicitly requested by the user, NEVER output raw SQL queries, JSON result previews, or technical logs in your output. You are speaking to business executives. Synthesize the data and present the final figures conversationally.
                7. MASTER ADMIN PRECISION: You are reporting to the Master Admin (CEO / COO) of a massive healthcare enterprise. Never assume the organization is 'small' or in an 'early growth phase' just because a specific test query returns sparse data. Provide ruthless, executive-level operational insights. Focus on cross-facility benchmarking, risk exposure, and precise resource allocation. Do not explain basic concepts. Give the data, the risk, and the action.
                8. CURRICULUM COACHING (KNOWLEDGE BASE): For ANY question about the SBD belt or position-school curriculum — belt requirements, study material, practice questions, situational scenarios, sterile-processing procedures, assessment prep, or how a candidate advances or should be coached — you MUST first search your knowledge base to pull the exact SBD curriculum for the relevant belt/level, then coach strictly from what it returns (Learner Guide content, the question/answer keys, fail indicators, and observation-gate criteria). Name the belt/level you are drawing from. Do NOT invent or approximate curriculum from general knowledge; if the search returns nothing for that topic, say the content for that belt/area is not loaded yet rather than guessing.

                Execute your tasks perfectly while maintaining casual, highly intelligent human conversation.
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
                let errorJson = {};
                try {
                    errorJson = await res.json();
                } catch(e) {}
                
                if (res.status === 403 && errorJson.action === 'ACTION_UPSELL') {
                    contentTarget.innerHTML = `
                        <div class="david-upsell-card" style="padding: 16px; border-radius: 8px; background: rgba(196,154,32,0.1); border: 1px solid var(--gold); text-align: center; margin-top: 8px;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" style="margin-bottom: 8px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            <h3 style="color: var(--gold); margin-top: 0; font-family: 'Fira Code', monospace; font-size: 15px;">David OG Intelligence Locked</h3>
                            <p style="font-size: 13px; color: var(--txt); opacity: 0.8; line-height: 1.4;">Your facility currently does not have access to SBD Operational Intelligence.</p>
                            <button onclick="alert('Contacting Sales...')" style="margin-top: 12px; padding: 8px 16px; background: var(--gold); color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px; font-family: 'Fira Code', monospace; transition: all 0.2s;">Unlock Facility Intelligence</button>
                        </div>
                    `;
                    const cursor = msgDiv.querySelector('.david-cursor');
                    if (cursor) cursor.style.display = 'none';
                    this.isThinking = false;
                    this.btn.disabled = false;
                    return;
                }

                const errText = errorJson.error || errorJson.message || "Unknown error";
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
                                    
                                    let displayContent = fullContent
                                        .replace(/```[A-Za-z]*\s*(<|&lt;)thinking(>|&gt;)[\s\S]*?(<\/|&lt;\/)thinking(>|&gt;|$)\s*```/gi, '')
                                        .replace(/(<|&lt;)thinking(>|&gt;)[\s\S]*?(<\/|&lt;\/)thinking(>|&gt;|$)/gi, '')
                                        .replace(/<chips>[\s\S]*?(?:<\/chips>|$)/gi, '')
                                        .replace(/```sql[\s\S]*?```/gi, '') // Aggressively hide raw SQL blocks
                                        .replace(/```json[\s\S]*?```/gi, '') // Aggressively hide raw JSON blocks
                                        .replace(/Result preview:\s*\{[\s\S]*?\}/gi, '') // Hide JSON previews
                                        // Parse Citation Data dynamically into secure UI badges
                                        .replace(/<citation\s+data=(['"])(.*?)\1(?:.*?|)><\/citation>/gi, (match, quote, payload) => {
                                            const cleanPayload = payload.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
                                            return ` <span class="david-citation-badge" onclick="DAVID.showCitationModal('${cleanPayload}')">🔍 Data Proof</span>`;
                                        })
                                        .replace(/<chart\s+([\s\S]*?)><\/chart>/gi, (match, attrs) => {
                                            return this.parseChartHtml(attrs);
                                        })
                                        .replace(/<chips>([\s\S]*?)<\/chips>/gi, (match, content) => {
                                            try {
                                                const parsed = JSON.parse(content);
                                                if (!Array.isArray(parsed)) return '';
                                                return `<div class="david-chips-container">` + 
                                                    parsed.map(c => `<button class="david-qa-btn" style="background:rgba(202,138,4,0.1); border-color:rgba(202,138,4,0.3);" onclick="DAVID.handleQA('${c.replace(/'/g, "\\'")}')">${c}</button>`).join('') + 
                                                    `</div>`;
                                            } catch(e) { return ''; }
                                        })
                                        .trim();

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

                // Final UI Update
                this.history.push({ role: 'user', content: text }, { role: 'assistant', content: fullContent });
                if (this.history.length > 50) this.history = this.history.slice(-50);
                
                // Cleanly finalize the message div structure without destroying the DOM to prevent scroll jump
                let displayContent = fullContent
                    .replace(/```[A-Za-z]*\s*(<|&lt;)thinking(>|&gt;)[\s\S]*?(<\/|&lt;\/)thinking(>|&gt;|$)\s*```/gi, '')
                    .replace(/(<|&lt;)thinking(>|&gt;)[\s\S]*?(<\/|&lt;\/)thinking(>|&gt;|$)/gi, '')
                    .replace(/```sql[\s\S]*?```/gi, '')
                    .replace(/```json[\s\S]*?```/gi, '')
                    .replace(/Result preview:\s*\{[\s\S]*?\}/gi, '')
                    .replace(/<citation\s+data=(['"])(.*?)\1(?:.*?|)><\/citation>/gi, (match, quote, payload) => {
                        const cleanPayload = payload.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
                        return ` <span class="david-citation-badge" onclick="DAVID.showCitationModal('${cleanPayload}')">🔍 Data Proof</span>`;
                    })
                    .replace(/<chart\s+([\s\S]*?)><\/chart>/gi, (match, attrs) => {
                        return this.parseChartHtml(attrs);
                    })
                    .replace(/<chips>([\s\S]*?)(?:<\/chips>|$)/gi, (match, content) => {
                        try {
                            if (match.includes('</chips>')) {
                                const parsed = JSON.parse(content);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    setTimeout(() => DAVID.renderDynamicChips(parsed), 50);
                                }
                            }
                        } catch(e) {}
                        return ''; // Strip from the actual message bubble
                    })
                    .trim();

                displayContent = this.revealIfEmpty(displayContent, fullContent);

                if (window.marked) {
                    msgDiv.innerHTML = marked.parse(displayContent);
                } else {
                    msgDiv.innerHTML = displayContent.replace(/\\n/g, '<br>');
                }

                // Ensure scroll stays at bottom naturally
                this.msgArea.scrollTop = this.msgArea.scrollHeight;

                // Always save to the sessionId that was active when this stream commenced!
                let newTitle = null;
                if (preStreamHistoryLengths === 0 && streamSessionId) {
                    newTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
                }
                await this.saveSessionMessages(newTitle, streamSessionId);
            }

        } catch (e) {
            contentTarget.innerHTML = `<span style="color:var(--err)">Error: ${e.message}</span>`;
            console.error('[DAVID] Error:', e);
        } finally {
            this.isThinking = false;
            this.btn.disabled = false;
        }
    }

    addMessage(text, role) {
        this.addParsedMessage(text, role, true);
    }

    renderDynamicChips(chipsArr) {
        const container = document.getElementById('david-dynamic-chips');
        if (!container) return;
        container.innerHTML = chipsArr.map(c => 
            `<button class="david-qa-btn david-fade-in-up" style="background:rgba(202,138,4,0.1); border-color:rgba(202,138,4,0.3);" onclick="DAVID.handleQA('${c.replace(/'/g, "\\'")}')">${c}</button>`
        ).join('');
        container.style.display = 'flex';
        // Auto-scroll slightly to compensate for the new bar appearing
        setTimeout(() => { if (this.msgArea) this.msgArea.scrollTop = this.msgArea.scrollHeight; }, 50);
    }

    clearDynamicChips() {
        const container = document.getElementById('david-dynamic-chips');
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
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

    // --- Internal Formatters ---
    parseChartHtml(attrString) {
        try {
            // Restore encoded quotes if data was generated securely
            let cleanStr = attrString.replace(/&apos;/g, "'").replace(/&quot;/g, '"');
            
            let title = "Data Distribution";
            let labels = [];
            let data = [];
            
            // Extract the raw string values inside the attributes (handle both single and double quotes)
            const titleMatch = cleanStr.match(/title=(['"])(.*?)\1/i);
            const labelsMatch = cleanStr.match(/labels=(['"])(.*?)\1/i);
            const dataMatch = cleanStr.match(/data=(['"])(.*?)\1/i);
            
            if (titleMatch && titleMatch[2]) title = titleMatch[2];
            
            // Leniently parse arrays (convert single quotes to double quotes, or just manually slice brackets)
            const lenientArrayParse = (str) => {
                let s = str.trim();
                if (s.startsWith('[')) s = s.slice(1);
                if (s.endsWith(']')) s = s.slice(0, -1);
                // match values separated by commas, honoring quotes or lack of quotes
                return s.split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
            };

            if (labelsMatch && labelsMatch[2]) {
                try { labels = JSON.parse(labelsMatch[2].replace(/'/g, '"')); } 
                catch (e) { labels = lenientArrayParse(labelsMatch[2]); }
            }
            if (dataMatch && dataMatch[2]) {
                try { data = JSON.parse(dataMatch[2]); } 
                catch (e) { data = lenientArrayParse(dataMatch[2]); }
            }
            
            if (labels.length === 0 || data.length === 0) return '';
            
            // Calculate max scale for percentage
            const maxVal = Math.max(...data.map(n => Number(n) || 0));
            
            let html = `<div class="david-chart-container"><div class="david-chart-title">${title} <span style="opacity:0.5; font-size:10px;">(Automated Synthesis)</span></div>`;
            
            for (let i = 0; i < labels.length; i++) {
                const val = Number(data[i]) || 0;
                const percent = maxVal > 0 ? (val / maxVal) * 100 : 0;
                html += `<div class="david-chart-bar-wrap"><div class="david-chart-label" title="${labels[i]}">${labels[i]}</div><div class="david-chart-bar-track"><div class="david-chart-bar-fill" style="width: ${percent}%;"></div></div><div class="david-chart-value">${val}</div></div>`;
            }
            html += `</div>`;
            return html;
        } catch (e) {
            console.error("DAVID: Failed to parse native chart", e);
            return `<div class="david-chart-container" style="color:var(--rd);">[Error rendering visual chart]</div>`;
        }
    }

    // --- Interactive Evidence & Meta-Memory Logic ---
    showCitationModal(payloadString) {
        try {
            // Restore encoded quotes if we properly escaped them earlier for html attribute safety
            const raw = payloadString.replace(/&apos;/g, "'").replace(/&quot;/g, '"');
            let data = null;
            try { data = JSON.parse(raw); } catch(e) { data = raw; }
            
            let customHtml = '';
            if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
                const keys = Object.keys(data[0]);
                customHtml = '<table class="david-evidence-table"><thead><tr>';
                keys.forEach(k => customHtml += `<th>${k.toUpperCase()}</th>`);
                customHtml += '</tr></thead><tbody>';
                data.forEach(row => {
                    customHtml += '<tr>';
                    keys.forEach(k => customHtml += `<td>${row[k]}</td>`);
                    customHtml += '</tr>';
                });
                customHtml += '</tbody></table>';
            } else if (typeof data === 'string' && data.toLowerCase().includes('select')) {
                customHtml = `<pre style="background:rgba(0,0,0,0.3); padding:12px; border-radius:6px; font-family:'Fira Code',monospace;"><code style="color:var(--gold)">${data}</code></pre>`;
            } else {
                customHtml = `<pre style="background:rgba(0,0,0,0.3); padding:12px; border-radius:6px; font-family:'Fira Code',monospace; white-space:pre-wrap; word-wrap:break-word;"><code>${JSON.stringify(data, null, 2)}</code></pre>`;
            }

            this.showModal({
                title: 'Data Evidence Citation',
                text: 'Here is the raw data subset DAVID used to validate this specific claim:',
                customHtml: customHtml,
                isAlert: true
            });
        } catch (e) {
            console.error('Error rendering citation data', e);
        }
    }

    async showMetaMemory() {
        const { uid, token } = this.getAuthContext();
        if (!uid || !token) return;

        try {
            const res = await window.sbFetch(`/rest/v1/david_user_preferences?user_id=eq.${uid}&select=memory_blob`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const blob = res && res[0] ? res[0].memory_blob : "No active memory overrides detected.";
            
            this.showModal({
                title: 'DAVID Meta-Memory',
                text: 'Global parameters learned from your interactions:',
                customHtml: `<textarea id="david-meta-edit" style="width:100%; height:120px; background:var(--bg); border:1px solid var(--bdr); color:var(--txt); border-radius:8px; padding:12px; font-family:'Fira Code',monospace; outline:none; resize:none;">${blob}</textarea>`,
                cancelText: 'Close',
                confirmText: 'Save Memory',
                onConfirm: async () => {
                    const val = document.getElementById('david-meta-edit').value.trim();
                    await window.sbFetch('/rest/v1/david_user_preferences', {
                        method: 'POST', // Technically upsert handled by Supabase REST requires specific headers
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: { user_id: uid, memory_blob: val, updated_at: new Date().toISOString() }
                    });
                    // Refresh chat context visually
                    this.addParsedMessage("> *⚙️ Overrode permanent memory rules.*", "ai");
                }
            });
        } catch(e) {
            console.error(e);
        }
    }
}
