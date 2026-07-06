/**
 * DAVID AI Chat Component - Sidebar Embedded Version
 * Dynamic AI Visual Intelligence Dashboard
 */

// M.2 — role-aware mode system (the sanctioned, scoped version of the roadmap's AI_PROMPTS).
// Each mode adds a focused directive to the system prompt; tabs switch the active mode. Tool
// access is still enforced server-side (M.0) — modes only steer focus, they don't grant tools.
const DAVID_MODES = {
    staff: [
        { id: 'coach', label: 'Coach', desc: 'Coaching on your own progress', directive: 'COACH MODE — focus on this technician\'s own progress, gaps and next steps. Be encouraging and specific; use their practice history and gate-readiness.' },
        { id: 'study', label: 'Study', desc: 'Study help for your belt', directive: 'STUDY MODE — help the user study and understand the curriculum for their belt. Search the knowledge base, explain simply, and quiz them when useful.' },
        { id: 'knowledge', label: 'Knowledge', desc: 'Look up curriculum & standards', directive: 'KNOWLEDGE MODE — answer curriculum/standards questions by searching the knowledge base first; name the belt/level. Apply Directive 9 for external standards.' },
    ],
    manager: [
        { id: 'briefing', label: 'Briefing', desc: 'What changed + priorities', directive: 'BRIEFING MODE — lead with what changed and the top priorities/alerts for this facility; concise and action-oriented.' },
        { id: 'guide', label: 'Guide', desc: 'Team development guidance', directive: 'GUIDE MODE — advise the leader on developing their team: who to coach, how, and toward which gates.' },
        { id: 'ops', label: 'Ops', desc: 'Assessment queue & operations', directive: 'OPS MODE — focus on the assessment backlog, windows, and day-to-day operations for this facility.' },
        { id: 'workforce', label: 'Workforce', desc: 'Belt distribution & readiness', directive: 'WORKFORCE MODE — analyze the team\'s belt distribution, velocity, readiness, and at-risk staff.' },
        { id: 'knowledge', label: 'Knowledge', desc: 'Curriculum & standards', directive: 'KNOWLEDGE MODE — answer curriculum/standards questions from the knowledge base; name the belt/level; Directive 9 for external standards.' },
    ],
    system: [
        { id: 'netintel', label: 'Net Intel', desc: 'Cross-facility intelligence', directive: 'NETWORK INTELLIGENCE MODE — compare facilities in this system; surface network patterns, risks, and outliers.' },
        { id: 'briefing', label: 'Briefing', desc: 'What changed + priorities', directive: 'BRIEFING MODE — lead with what changed and the top priorities/alerts across the system.' },
        { id: 'workforce', label: 'Workforce', desc: 'Belt distribution & readiness', directive: 'WORKFORCE MODE — analyze belt distribution, velocity, and readiness across the system.' },
        { id: 'knowledge', label: 'Knowledge', desc: 'Curriculum & standards', directive: 'KNOWLEDGE MODE — curriculum/standards from the knowledge base; name the belt/level; Directive 9.' },
    ],
    master: [
        { id: 'netintel', label: 'Net Intel', desc: 'Network-wide intelligence', directive: 'NETWORK INTELLIGENCE MODE — operate as the executive analyst across the whole SIPS network; compare, rank, and surface patterns.' },
        { id: 'briefing', label: 'Briefing', desc: 'Executive briefing', directive: 'BRIEFING MODE — executive summary of what changed and the top strategic priorities/alerts.' },
        { id: 'workforce', label: 'Workforce', desc: 'Talent & readiness', directive: 'WORKFORCE MODE — talent pipeline, belt distribution, velocity, promotion-readiness, and at-risk staff network-wide.' },
        { id: 'guide', label: 'Guide', desc: 'Coaching guidance', directive: 'GUIDE MODE — coaching and development guidance.' },
        { id: 'knowledge', label: 'Knowledge', desc: 'Curriculum & standards', directive: 'KNOWLEDGE MODE — curriculum/standards from the knowledge base; name the belt/level; Directive 9.' },
        { id: 'adminops', label: 'Admin Ops', desc: 'Platform administration', directive: 'ADMIN OPS MODE — assist with platform administration and data operations (master admin).' },
    ],
};
function davidModesForRole(role) {
    if (role === 'staff_member') return DAVID_MODES.staff;
    if (role === 'facility_admin' || role === 'hospital') return DAVID_MODES.manager;
    if (role === 'system_admin') return DAVID_MODES.system;
    return DAVID_MODES.master; // master_admin / staff_admin / fallback
}

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
            /* ============================================================
               DAVID OG — Intelligence Console
               Uses the platform tokens (--bg/--s1/--s2/--gold/--txt…).
               AI replies render as open "briefing" blocks on the canvas;
               the operator's messages are compact gold bubbles.
            ============================================================ */

            /* The mount must fill the view area in EVERY portal, otherwise David
               grows to content height and the composer gets pushed below the fold.
               (Previously only #a-david had this, so staff/hospital/system portals
               required page-scrolling to reach the input.) */
            #a-david, #s-david, #h-david, #x-david { height: 100%; min-height: 0; }

            .david-container {
                --dv-mono: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
                --dv-col: 840px;
                display: flex;
                height: 100%;
                min-height: 0;
                width: 100%;
                color: var(--txt);
                font-family: 'Poppins', sans-serif;
                background: var(--bg);
                border: 1px solid var(--bdr2);
                border-radius: var(--r, 10px);
                overflow: hidden;
                position: relative;
            }
            .david-layout { display: flex; height: 100%; width: 100%; min-height: 0; }
            .david-container button { font-family: inherit; }
            .david-container button:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

            /* ── Sessions sidebar ── */
            .david-sessions-sidebar {
                width: 250px;
                background: var(--s1);
                border-right: 1px solid var(--bdr);
                display: flex;
                flex-direction: column;
                flex-shrink: 0;
                min-height: 0;
            }
            .david-new-chat-btn {
                margin: 14px 14px 10px;
                padding: 10px 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 7px;
                background: var(--gold);
                color: #141005;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 12.5px;
                cursor: pointer;
                transition: filter .15s;
            }
            .david-new-chat-btn:hover { filter: brightness(1.12); }
            .david-sidebar-label {
                font-size: 9.5px;
                letter-spacing: .14em;
                text-transform: uppercase;
                color: var(--txt3);
                font-weight: 600;
                padding: 8px 18px 6px;
            }
            .david-session-list {
                flex: 1;
                min-height: 0;
                overflow-y: auto;
                padding: 0 10px 16px;
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            .david-session-item {
                padding: 9px 11px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 12.5px;
                color: var(--txt2);
                border: 1px solid transparent;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                transition: background .15s, color .15s;
            }
            .david-session-item:hover { background: var(--s2); color: var(--txt); }
            .david-session-item.active {
                background: var(--gold-bg);
                border-color: var(--gold-bd);
                color: var(--gold);
            }
            .david-session-item-content { flex: 1; min-width: 0; }
            .david-session-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
            .david-session-date { font-size: 10px; color: var(--txt3); margin-top: 2px; }
            .david-session-delete {
                opacity: 0;
                color: var(--txt3);
                display: inline-flex;
                align-items: center;
                padding: 4px;
                border-radius: 5px;
                flex-shrink: 0;
                transition: opacity .15s, color .15s;
            }
            .david-session-item:hover .david-session-delete { opacity: .6; }
            .david-session-delete:hover { opacity: 1 !important; color: var(--err); }
            @media (hover: none) { .david-session-delete { opacity: .45; } }
            .david-session-confirm-wrapper { display: none; gap: 6px; align-items: center; margin-left: auto; flex-shrink: 0; }
            .david-session-item.confirming .david-session-delete { display: none; }
            .david-session-item.confirming .david-session-confirm-wrapper { display: flex; }
            .david-session-action {
                font-size: 10.5px;
                padding: 4px 8px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 600;
                user-select: none;
                transition: background .15s;
            }
            .david-session-confirm { color: var(--err); background: var(--err-bg); border: 1px solid var(--err-bd); }
            .david-session-confirm:hover { background: rgba(239,68,68,.2); }
            .david-session-cancel { color: var(--txt2); background: rgba(255,255,255,.05); border: 1px solid var(--bdr2); }
            .david-session-cancel:hover { color: var(--txt); }

            /* ── Main column ── */
            .david-main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }

            .david-chat-header {
                display: flex;
                align-items: center;
                gap: 11px;
                padding: 12px 16px;
                border-bottom: 1px solid var(--bdr);
                background: var(--s1);
                flex-shrink: 0;
            }
            .david-avatar {
                width: 34px;
                height: 34px;
                border-radius: 10px;
                background: linear-gradient(135deg, #d8b23c, #7a5c0d);
                color: #0a0700;
                font-weight: 800;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .david-head-id { flex: 1; min-width: 0; }
            .david-head-id h2 { margin: 0; font-size: 14.5px; font-weight: 700; color: var(--txt); line-height: 1.2; }
            .david-head-id p {
                margin: 2px 0 0;
                font-size: 10.5px;
                color: var(--txt3);
                display: flex;
                align-items: center;
                gap: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .david-status-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--ok);
                flex-shrink: 0;
                animation: david-status 2.8s ease-in-out infinite;
            }
            @keyframes david-status {
                0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,.35); }
                50% { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
            }
            .david-icon-btn {
                width: 32px;
                height: 32px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: 1px solid var(--bdr2);
                border-radius: 8px;
                color: var(--txt3);
                cursor: pointer;
                flex-shrink: 0;
                transition: color .15s, background .15s;
            }
            .david-icon-btn:hover { color: var(--gold); background: var(--s2); }
            .david-mobile-toggle {
                display: none;
                width: 34px;
                height: 34px;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: 1px solid var(--bdr2);
                border-radius: 8px;
                color: var(--txt);
                cursor: pointer;
                flex-shrink: 0;
                -webkit-tap-highlight-color: transparent;
            }
            .david-mobile-toggle:hover { background: var(--s2); }

            /* ── Mode rail ── */
            .david-mode-tabs {
                display: flex;
                gap: 6px;
                align-items: center;
                padding: 8px 16px;
                border-bottom: 1px solid var(--bdr);
                overflow-x: auto;
                flex-shrink: 0;
                scrollbar-width: none;
            }
            .david-mode-tabs::-webkit-scrollbar { display: none; }
            .david-mode-tab {
                font-size: 11px;
                padding: 5px 12px;
                border-radius: 14px;
                border: 1px solid var(--bdr2);
                background: transparent;
                color: var(--txt2);
                cursor: pointer;
                font-weight: 600;
                white-space: nowrap;
                flex-shrink: 0;
                transition: all .15s;
            }
            .david-mode-tab:hover { color: var(--txt); border-color: var(--bdr3); }
            .david-mode-tab.active { background: var(--gold); border-color: var(--gold); color: #141005; }

            /* ── Messages ── */
            .david-msgs-wrap { flex: 1; min-height: 0; position: relative; display: flex; flex-direction: column; }
            .david-messages-area {
                flex: 1;
                min-height: 0;
                overflow-y: auto;
                padding: 26px 20px 18px;
                padding-left: max(20px, calc((100% - var(--dv-col)) / 2));
                padding-right: max(20px, calc((100% - var(--dv-col)) / 2));
                display: flex;
                flex-direction: column;
                gap: 24px;
                background-image:
                    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
                background-size: 44px 44px;
                -webkit-overflow-scrolling: touch;
            }

            @keyframes david-slide-up {
                0% { opacity: 0; transform: translateY(12px); }
                100% { opacity: 1; transform: translateY(0); }
            }

            .david-msg {
                position: relative;
                font-size: 13.5px;
                line-height: 1.65;
                overflow-wrap: anywhere;
                animation: david-slide-up .3s cubic-bezier(.16, 1, .3, 1);
            }
            /* David: open briefing block on the canvas — tables and charts get full width */
            .david-msg-ai { align-self: stretch; max-width: 100%; color: var(--txt); }
            .david-msg-ai::before {
                content: 'DAVID';
                display: block;
                font-size: 9px;
                font-weight: 700;
                letter-spacing: .22em;
                color: var(--gold);
                margin-bottom: 7px;
            }
            /* Operator: compact gold bubble */
            .david-msg-user {
                align-self: flex-end;
                max-width: min(560px, 85%);
                background: linear-gradient(135deg, #d8b23c, var(--gold));
                color: #171204;
                font-weight: 500;
                padding: 11px 15px;
                border-radius: 14px 14px 4px 14px;
                box-shadow: 0 3px 14px rgba(196,154,32,.18);
            }

            .david-msg-time { font-size: 9.5px; margin-top: 7px; font-weight: 500; letter-spacing: .02em; }
            .david-msg-ai .david-msg-time { color: var(--txt3); opacity: .7; }
            .david-msg-user .david-msg-time { color: rgba(23,18,4,.55); text-align: right; }

            /* Markdown inside briefings */
            .david-msg-ai h1, .david-msg-ai h2, .david-msg-ai h3 {
                margin: 14px 0 8px;
                color: var(--gold);
                font-weight: 600;
            }
            .david-msg-ai h1:first-child, .david-msg-ai h2:first-child, .david-msg-ai h3:first-child { margin-top: 0; }
            .david-msg-ai h1 { font-size: 1.18em; }
            .david-msg-ai h2 { font-size: 1.1em; }
            .david-msg-ai h3 { font-size: 1.02em; }
            .david-msg-ai p { margin: 0 0 10px; }
            .david-msg-ai p:last-child { margin-bottom: 0; }
            .david-msg-ai ul, .david-msg-ai ol { margin: 0 0 12px; padding-left: 20px; }
            .david-msg-ai li { margin-bottom: 5px; }
            .david-msg-ai li::marker { color: var(--gold); }
            .david-msg-ai strong { color: #fff; font-weight: 600; }
            .david-msg-ai a { color: var(--gold); }
            .david-msg-ai img { max-width: 100%; border-radius: 8px; }
            .david-msg-ai hr { border: none; border-top: 1px solid var(--bdr2); margin: 14px 0; }
            .david-msg-ai blockquote {
                margin: 0 0 12px;
                padding: 8px 14px;
                border-left: 2px solid var(--gold-bd);
                background: var(--s1);
                border-radius: 0 8px 8px 0;
                color: var(--txt2);
            }
            .david-msg-ai code {
                font-family: var(--dv-mono);
                font-size: .88em;
                background: var(--s2);
                border: 1px solid var(--bdr);
                padding: 1px 5px;
                border-radius: 5px;
            }
            .david-msg-ai pre {
                background: #0a0e20;
                border: 1px solid var(--bdr);
                border-radius: 8px;
                padding: 12px 14px;
                overflow-x: auto;
                margin: 0 0 12px;
            }
            .david-msg-ai pre code { background: none; border: none; padding: 0; font-size: 12px; }
            /* display:block + overflow lets wide tables scroll inside the message
               instead of blowing out the layout on small screens */
            .david-msg-ai table {
                display: block;
                max-width: max-content;
                width: fit-content;
                overflow-x: auto;
                border-collapse: collapse;
                margin: 12px 0;
                font-size: 12.5px;
                border: 1px solid var(--bdr2);
                border-radius: 8px;
                background: rgba(0,0,0,.15);
            }
            .david-msg-ai th {
                background: var(--s2);
                color: var(--gold);
                font-weight: 600;
                text-transform: uppercase;
                font-size: 10px;
                letter-spacing: .08em;
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid var(--bdr2);
                white-space: nowrap;
            }
            .david-msg-ai td { padding: 8px 12px; border-bottom: 1px solid var(--bdr); vertical-align: top; }
            .david-msg-ai tr:last-child td { border-bottom: none; }
            /* tables scroll sideways instead of breaking words mid-cell */
            .david-msg-ai table, .david-msg-ai th, .david-msg-ai td { overflow-wrap: normal; word-break: normal; }

            /* Message tools (copy / edit) */
            .david-msg-actions { display: flex; gap: 6px; margin-top: 8px; }
            @media (hover: hover) {
                .david-msg-actions { opacity: 0; transition: opacity .15s; }
                .david-msg-ai:hover .david-msg-actions, .david-msg-ai:focus-within .david-msg-actions { opacity: 1; }
            }
            .david-action-btn {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 4px 10px;
                border: 1px solid var(--bdr2);
                border-radius: 7px;
                background: transparent;
                color: var(--txt3);
                font-size: 10.5px;
                font-weight: 600;
                cursor: pointer;
                transition: all .15s;
            }
            .david-action-btn:hover { background: var(--gold-bg); border-color: var(--gold-bd); color: var(--gold); }
            .david-edit-btn {
                margin-left: 8px;
                font-size: 10px;
                line-height: 1;
                padding: 3px 8px;
                border-radius: 6px;
                border: 1px solid rgba(23,18,4,.25);
                background: rgba(255,255,255,.16);
                color: #171204;
                cursor: pointer;
                opacity: .75;
                vertical-align: middle;
                transition: opacity .15s;
            }
            .david-edit-btn:hover { opacity: 1; }

            /* Streaming: inherit the body face — no font flash, no pre-wrap gaps */
            .david-streaming-content { display: inline; }
            .david-cursor {
                display: inline-block;
                width: 7px;
                height: 15px;
                background: var(--gold);
                margin-left: 3px;
                border-radius: 2px;
                animation: david-blink .8s infinite;
                vertical-align: text-bottom;
            }
            @keyframes david-blink { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }

            /* Empty state */
            .david-hero { margin: auto; text-align: center; max-width: 420px; padding: 20px; }
            .david-hero-seal {
                width: 52px;
                height: 52px;
                border-radius: 14px;
                margin: 0 auto 16px;
                background: linear-gradient(135deg, #d8b23c, #7a5c0d);
                color: #0a0700;
                font-weight: 800;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 6px 24px rgba(196,154,32,.25);
            }
            .david-hero h3 { margin: 0 0 8px; font-size: 19px; font-weight: 700; color: var(--txt); }
            .david-hero p { margin: 0; font-size: 12.5px; color: var(--txt2); line-height: 1.6; }

            /* Jump to latest */
            .david-jump-latest {
                position: absolute;
                right: 18px;
                bottom: 14px;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                border: 1px solid var(--gold-bd);
                background: var(--s2);
                color: var(--gold);
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 5;
                box-shadow: 0 4px 14px rgba(0,0,0,.45);
            }
            .david-jump-latest:hover { background: var(--s3); }

            /* ── Bottom dock: chips + composer ── */
            .david-dock {
                flex-shrink: 0;
                border-top: 1px solid var(--bdr);
                background: var(--s1);
                padding: 10px 16px calc(12px + env(safe-area-inset-bottom));
                padding-left: max(16px, calc((100% - var(--dv-col)) / 2));
                padding-right: max(16px, calc((100% - var(--dv-col)) / 2));
            }
            .david-chips-row {
                display: flex;
                gap: 7px;
                overflow-x: auto;
                padding: 2px 0 8px;
                scrollbar-width: none;
            }
            .david-chips-row::-webkit-scrollbar { display: none; }
            .david-qa-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: var(--s2);
                border: 1px solid var(--bdr2);
                color: var(--txt2);
                padding: 6px 13px;
                border-radius: 16px;
                font-size: 11.5px;
                font-weight: 500;
                cursor: pointer;
                white-space: nowrap;
                flex-shrink: 0;
                transition: all .15s;
            }
            .david-qa-btn:hover { border-color: var(--gold-bd); color: var(--gold); background: var(--gold-bg); }
            .david-chips-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 14px;
                padding-top: 12px;
                border-top: 1px dashed var(--bdr2);
            }

            .david-input-wrapper {
                display: flex;
                align-items: flex-end;
                gap: 10px;
                background: var(--s2);
                border: 1px solid var(--bdr2);
                border-radius: 14px;
                padding: 8px 8px 8px 16px;
                transition: border-color .2s, box-shadow .2s;
            }
            .david-input-wrapper:focus-within {
                border-color: var(--gold-bd);
                box-shadow: 0 0 0 3px rgba(196,154,32,.12);
            }
            .david-input-wrapper textarea {
                flex: 1;
                background: transparent;
                border: none;
                color: var(--txt);
                padding: 9px 0;
                font-size: 14.5px;
                line-height: 1.5;
                outline: none;
                resize: none;
                min-height: 24px;
                max-height: 160px;
                overflow-y: auto;
                font-family: inherit;
            }
            .david-input-wrapper textarea::placeholder { color: var(--txt3); }
            .david-send-btn {
                background: linear-gradient(135deg, #d8b23c, var(--gold));
                color: #141005;
                border: none;
                border-radius: 10px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                flex-shrink: 0;
                transition: filter .15s, transform .15s;
            }
            .david-send-btn:hover { filter: brightness(1.08); }
            .david-send-btn:active { transform: scale(.94); }
            .david-send-btn:disabled { background: var(--s3); color: var(--txt3); cursor: not-allowed; filter: none; }

            /* ── Citations, evidence, charts ── */
            .david-citation-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: var(--gold-bg);
                color: var(--gold);
                border: 1px solid var(--gold-bd);
                padding: 2px 9px;
                border-radius: 11px;
                font-size: 10px;
                font-weight: 600;
                cursor: pointer;
                margin-left: 6px;
                text-transform: uppercase;
                letter-spacing: .05em;
                vertical-align: middle;
                transition: background .15s;
            }
            .david-citation-badge:hover { background: rgba(196,154,32,.2); }
            .david-evidence-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 12px;
                background: var(--s2);
                border-radius: 8px;
                overflow: hidden;
            }
            .david-evidence-table th {
                background: rgba(255,255,255,.04);
                padding: 8px 12px;
                text-align: left;
                color: var(--gold);
                font-weight: 600;
                font-size: 10.5px;
                text-transform: uppercase;
                letter-spacing: .06em;
            }
            .david-evidence-table td { padding: 8px 12px; border-top: 1px solid var(--bdr); color: var(--txt); }

            .david-chart-container {
                background: var(--s1);
                border: 1px solid var(--bdr);
                border-radius: 10px;
                padding: 14px 16px;
                margin: 12px 0;
            }
            .david-chart-title {
                color: var(--gold);
                font-weight: 600;
                font-size: 11px;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: .08em;
            }
            .david-chart-bar-wrap { display: flex; align-items: center; margin-bottom: 7px; }
            .david-chart-label {
                width: 92px;
                font-size: 11px;
                color: var(--txt2);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-right: 10px;
                flex-shrink: 0;
            }
            .david-chart-bar-track {
                flex: 1;
                background: rgba(255,255,255,.05);
                height: 10px;
                border-radius: 5px;
                overflow: hidden;
            }
            .david-chart-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, rgba(196,154,32,.65), #d8b23c);
                border-radius: 5px;
                transition: width 1s ease-out;
            }
            .david-chart-value {
                width: 42px;
                font-size: 11px;
                color: var(--txt);
                text-align: right;
                font-family: var(--dv-mono);
                margin-left: 10px;
                flex-shrink: 0;
            }

            /* ── Action card ── */
            .david-action-card {
                background: var(--s1);
                border: 1px solid var(--bdr2);
                border-radius: 12px;
                padding: 14px 16px;
                margin-top: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: 420px;
            }
            .david-action-card h4 { margin: 0; font-size: 13px; color: var(--gold); }
            .david-action-card p { margin: 0; font-size: 12px; color: var(--txt2); }
            .david-card-btn {
                background: var(--gold);
                color: #141005;
                border: none;
                border-radius: 7px;
                padding: 9px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
                transition: filter .15s;
            }
            .david-card-btn:hover { filter: brightness(1.1); }

            /* ── Modal ── */
            .david-modal-overlay {
                position: absolute;
                inset: 0;
                background: rgba(4,6,18,.7);
                -webkit-backdrop-filter: blur(4px);
                backdrop-filter: blur(4px);
                z-index: 50;
                align-items: center;
                justify-content: center;
                padding: 20px;
                opacity: 0;
                animation: david-fadeIn .18s forwards;
            }
            .david-modal-content {
                background: var(--s1);
                border: 1px solid var(--bdr2);
                border-radius: 14px;
                padding: 22px;
                max-width: 440px;
                width: 100%;
                max-height: 100%;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,.5);
                transform: translateY(14px);
                animation: david-slideUp .25s forwards cubic-bezier(.16, 1, .3, 1);
            }
            .david-modal-title { margin: 0 0 10px; color: var(--txt); font-size: 16px; font-weight: 700; }
            .david-modal-text { margin: 0 0 16px; color: var(--txt2); font-size: 13px; line-height: 1.6; }
            .david-modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
            .david-modal-btn {
                padding: 9px 16px;
                border-radius: 8px;
                font-size: 12.5px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                transition: all .15s;
            }
            .david-modal-cancel { background: transparent; border: 1px solid var(--bdr2); color: var(--txt); }
            .david-modal-cancel:hover { background: var(--s2); }
            .david-modal-confirm { background: var(--err); color: #fff; }
            .david-modal-confirm:hover { background: #dc2626; }
            .david-modal-confirm.david-btn-gold { background: var(--gold); color: #141005; }
            .david-modal-confirm.david-btn-gold:hover { filter: brightness(1.1); }
            @keyframes david-slideUp { to { transform: translateY(0); } }
            @keyframes david-fadeIn { to { opacity: 1; } }
            @keyframes david-chip-in {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            .david-fade-in-up { animation: david-chip-in .3s cubic-bezier(.16, 1, .3, 1); }

            /* ── Drawer sidebar + backdrop ── */
            .david-sidebar-backdrop {
                display: none;
                position: absolute;
                inset: 0;
                background: rgba(0,0,0,.55);
                z-index: 25;
                -webkit-backdrop-filter: blur(2px);
                backdrop-filter: blur(2px);
            }
            .david-sidebar-backdrop.open { display: block; }

            /* Scrollbars */
            .david-messages-area::-webkit-scrollbar, .david-session-list::-webkit-scrollbar { width: 8px; }
            .david-messages-area::-webkit-scrollbar-thumb, .david-session-list::-webkit-scrollbar-thumb {
                background: var(--s3);
                border-radius: 4px;
            }
            .david-messages-area::-webkit-scrollbar-track, .david-session-list::-webkit-scrollbar-track { background: transparent; }

            /* ── Responsive ── */
            @media (max-width: 900px) {
                .david-mobile-toggle { display: inline-flex; }
                .david-sessions-sidebar {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 80%;
                    max-width: 300px;
                    z-index: 30;
                    transform: translateX(-100%);
                    transition: transform .25s ease;
                    box-shadow: 8px 0 32px rgba(0,0,0,.5);
                    border-right: 1px solid var(--bdr2);
                }
                .david-sessions-sidebar.open { transform: translateX(0); }
                .david-chat-header { padding: 10px 12px; }
                .david-mode-tabs { padding: 7px 12px; }
                .david-messages-area { padding: 18px 14px 14px; }
                .david-dock { padding: 8px 12px calc(10px + env(safe-area-inset-bottom)); }
                .david-msg-user { max-width: 92%; }
                /* 16px stops iOS zoom-on-focus */
                .david-input-wrapper textarea { font-size: 16px; }
            }
            @media (max-width: 480px) {
                .david-msg { font-size: 13px; }
                .david-messages-area { padding: 14px 12px 12px; }
                .david-container { border-radius: 8px; }
            }
            @media (prefers-reduced-motion: reduce) {
                .david-msg, .david-status-dot, .david-fade-in-up, .david-cursor { animation: none; }
                .david-modal-overlay { animation: none; opacity: 1; }
                .david-modal-content { animation: none; transform: none; }
                .david-sessions-sidebar { transition: none; }
            }
        `;
        document.head.appendChild(style);
    }

    renderIn(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const _st = (typeof ST !== 'undefined') ? ST : {};
        const user = _st.user || { role: 'admin', name: 'Admin' };
        const roleLabel = (user.role || 'admin').replace(/_/g, ' ').toUpperCase();
        const isStaffUser = user.role === 'staff_member';

        // M.2 mode tabs for this role (persist the active mode across re-renders).
        const _modes = davidModesForRole(user.role);
        if (!this.activeMode || !_modes.some(m => m.id === this.activeMode)) this.activeMode = _modes[0] ? _modes[0].id : null;
        const _modeTabs = _modes.map(m => `<button type="button" class="david-mode-tab${m.id === this.activeMode ? ' active' : ''}" data-mode="${m.id}" title="${m.desc}" onclick="DAVID.switchMode('${m.id}')">${m.label}</button>`).join('');

        // Role-aware quick actions + composer placeholder.
        const _qa = isStaffUser ? [
            ['Next belt progress', 'How close am I to my next belt?'],
            ['Quiz me', 'Quiz me on my current belt'],
            ['What to practice', 'What should I practice next?'],
        ] : [
            ['Scope audit', 'Summarize authorized facility activity'],
            ['Competency distribution', 'Analyze competency distribution in my scope'],
            ['Priority analysis', 'What are the most urgent tasks for me?'],
        ];
        const qaButtons = _qa.map(([label, q]) => `<button class="david-qa-btn" type="button" onclick="DAVID.handleQA('${q.replace(/'/g, "\\'")}')">${label}</button>`).join('');
        const placeholder = isStaffUser
            ? 'Ask about your belt or studies…'
            : 'Ask about staff or readiness…';

        container.innerHTML = `
            <div class="david-container">
                <div class="david-layout">
                    <div class="david-sidebar-backdrop" id="david-sidebar-backdrop" onclick="DAVID.toggleSidebar(false)"></div>
                    <div class="david-sessions-sidebar" id="david-sessions-sidebar">
                        <button class="david-new-chat-btn" id="david-new-chat" type="button">
                            <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 2v10M2 7h10"/></svg>
                            New conversation
                        </button>
                        <div class="david-sidebar-label">Conversations</div>
                        <div class="david-session-list" id="david-session-list"></div>
                    </div>
                    <div class="david-main">
                        <div class="david-chat-header">
                            <button class="david-mobile-toggle" aria-label="Toggle conversations" onclick="DAVID.toggleSidebar()" type="button">
                                <svg viewBox="0 0 18 18" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 4h14M2 9h14M2 14h14"/></svg>
                            </button>
                            <div class="david-avatar" aria-hidden="true">D</div>
                            <div class="david-head-id">
                                <h2>David OG</h2>
                                <p><span class="david-status-dot"></span>Online &bull; ${roleLabel} scope</p>
                            </div>
                            <button class="david-icon-btn" onclick="DAVID.showMetaMemory()" title="Manage meta-memory" aria-label="Manage meta-memory" type="button">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                            </button>
                        </div>
                        <div class="david-mode-tabs" id="david-mode-tabs">${_modeTabs}</div>
                        <div class="david-msgs-wrap">
                            <div class="david-messages-area" id="david-msgs"></div>
                            <button type="button" class="david-jump-latest" id="david-jump-latest" title="Jump to latest" aria-label="Jump to latest message">
                                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v10M3.5 8.5L8 13l4.5-4.5"/></svg>
                            </button>
                        </div>
                        <div class="david-dock">
                            <div id="david-dynamic-chips" class="david-chips-row" style="display:none"></div>
                            <div class="david-chips-row" id="david-qa">${qaButtons}</div>
                            <div class="david-input-wrapper">
                                <textarea placeholder="${placeholder}" id="david-query" rows="1"></textarea>
                                <button class="david-send-btn" id="david-btn" aria-label="Send message" type="button">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Appended Modal Overlay -->
                <div class="david-modal-overlay" id="david-modal" style="display: none;">
                    <div class="david-modal-content">
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

        // Jump-to-latest arrow (Iiggie's ask): appears when scrolled up, jumps to newest.
        const jumpBtn = container.querySelector('#david-jump-latest');
        if (jumpBtn) {
            jumpBtn.onclick = () => { this.msgArea.scrollTop = this.msgArea.scrollHeight; };
            this.msgArea.addEventListener('scroll', () => {
                const nearBottom = this.msgArea.scrollHeight - this.msgArea.scrollTop - this.msgArea.clientHeight < 80;
                jumpBtn.style.display = nearBottom ? 'none' : 'flex';
            });
        }

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

    // M.2 — switch the active mode (tab click). Restyles tabs; takes effect on the next send.
    switchMode(modeId) {
        this.activeMode = modeId;
        const tabs = this.container && this.container.querySelectorAll('#david-mode-tabs [data-mode]');
        if (tabs) tabs.forEach(b => b.classList.toggle('active', b.getAttribute('data-mode') === modeId));
    }

    // M.2 — the active mode's directive, appended to the system prompt.
    getActiveModeDirective() {
        try {
            const role = (typeof ST !== 'undefined' && ST.user) ? ST.user.role : null;
            const modes = davidModesForRole(role);
            const m = modes.find(x => x.id === this.activeMode) || modes[0];
            return m ? `\n\n[ACTIVE MODE: ${m.label}] ${m.directive}` : '';
        } catch (e) { return ''; }
    }

    // M.3 — cheaper model for low-stakes modes (Knowledge/Study); Sonnet for analysis/coaching.
    // The edge function allowlists this and falls back to Sonnet for anything unrecognized.
    getActiveModel() {
        const CHEAP = ['knowledge', 'study'];
        return CHEAP.includes(this.activeMode) ? 'anthropic/claude-haiku-4.5' : 'anthropic/claude-sonnet-4.5';
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
            this.maybeShowProactiveBriefing();   // P3: unsolicited alert briefing for leaders on a fresh chat
        } catch (e) {
            console.warn('[DAVID] Failed to load sessions:', e);
            this.renderGreetingOnly();
        }
    }

    // P3 — on open, a leader with a fresh/empty chat gets an unsolicited briefing of active alerts.
    // Rendered transiently (not persisted to the session) and only once per page load.
    async maybeShowProactiveBriefing() {
        try {
            if (this._briefingShown) return;
            const _st = (typeof ST !== 'undefined') ? ST : null;
            const role = _st && _st.user ? _st.user.role : null;
            const leaderRoles = ['facility_admin', 'hospital', 'system_admin', 'master_admin', 'staff_admin'];
            if (!leaderRoles.includes(role)) return;
            if (this.history && this.history.length > 0) return;   // only on a fresh/empty chat
            if (!window.DavidAlerts) return;
            let scope = 'admin', id = null;
            if (role === 'facility_admin' || role === 'hospital') { scope = 'facility'; id = _st.user.fid; }
            else if (role === 'system_admin') { scope = 'system'; id = _st.user.systemId; }
            const alerts = await window.DavidAlerts.scanAlerts(scope, id);
            if (alerts && alerts.length) {
                this._briefingShown = true;
                const top = alerts.slice(0, 8).map(a => `- ${a.message}`).join('\n');
                const more = alerts.length > 8 ? `\n…and ${alerts.length - 8} more.` : '';
                this.addParsedMessage(`**Briefing — what's changed since your last visit** (${alerts.length} alert${alerts.length > 1 ? 's' : ''}):\n\n${top}${more}\n\n_Ask me about any of these for a recommended action._`, 'ai');
            }
        } catch (e) { /* briefing is best-effort */ }
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
                    <div class="david-session-title">${s.title}</div>
                    <div class="david-session-date">${timeStr}</div>
                </div>
                <div class="david-session-delete" title="Delete conversation">
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M2.5 4h11M6.5 4V2.8a.8.8 0 01.8-.8h1.4a.8.8 0 01.8.8V4m2.7 0l-.5 9.2a1 1 0 01-1 .95H5.3a1 1 0 01-1-.95L3.8 4M6.5 7v4M9.5 7v4"/></svg>
                </div>
                <div class="david-session-confirm-wrapper">
                    <div class="david-session-action david-session-confirm" title="Confirm delete">Delete</div>
                    <div class="david-session-action david-session-cancel" title="Cancel">Cancel</div>
                </div>
            `;
            
            div.onclick = () => {
                if (div.classList.contains('confirming')) return; // Prevent switching when confirming delete
                this.loadSession(s.id);
                if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
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
            this.addParsedMessage(msg.content, msg.role, idx === this.history.length - 1, idx);
        });
        this.msgArea.scrollTop = this.msgArea.scrollHeight;
    }

    renderGreetingOnly() {
        if (!this.msgArea) return;
        const user = (typeof ST !== 'undefined' && ST.user) ? ST.user : { name: 'Admin', first: 'Admin' };
        const firstName = user.first || (user.name || 'Admin').split(' ')[0] || 'Admin';
        const sub = user.role === 'staff_member'
            ? 'Ask about your belt progress, study material, or what to focus on next — I read your live training record.'
            : 'Ask about staff readiness, the assessment queue, or belt curriculum — I pull the live data for your scope.';
        this.msgArea.innerHTML = `
            <div class="david-hero fade-in">
                <div class="david-hero-seal">D</div>
                <h3>Hey ${firstName}.</h3>
                <p>${sub}</p>
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
        return noThinking || "I started working through that but didn't land on a clear answer for you — I may still be loading the material for it. Mind rephrasing, or asking me something else?";
    }

    addParsedMessage(text, role, isLatest = false, messageIndex = null) {
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
            editBtn.onclick = () => {
                this.input.value = displayContent;
                this.input.style.height = 'auto';
                this.input.focus();
                this.input.scrollIntoView({ block: 'nearest' });
            };
            div.appendChild(editBtn);
        }
        if (formatRole === 'ai') {
            const pairedUser = this.findPairedUserMessage(messageIndex);
            this.appendMessageActions(div, pairedUser ? pairedUser.content : '');
        }
        // Only stamp live messages: restored history has no stored send time, and
        // stamping it with "now" showed wrong times on old messages.
        if (messageIndex === null) {
            const ts = document.createElement('div');
            ts.className = 'david-msg-time';
            ts.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            div.appendChild(ts);
        }

        this.msgArea.appendChild(div);
        this.msgArea.scrollTop = this.msgArea.scrollHeight;
    }

    copyMessage(btn) {
        const msgDiv = btn.closest('.david-msg-ai');
        if (!msgDiv) return;
        const actionsDiv = msgDiv.querySelector('.david-msg-actions');
        const text = actionsDiv ? msgDiv.innerText.replace(actionsDiv.innerText, '').trim() : msgDiv.innerText.trim();
        navigator.clipboard.writeText(text).then(() => {
            const copyBtn = btn.tagName === 'BUTTON' ? btn : btn.closest('button');
            if (!copyBtn) return;
            const orig = copyBtn.innerHTML;
            copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 18 18" fill="none"><path d="M2 9l4.5 4.5 9-9" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied`;
            setTimeout(() => { copyBtn.innerHTML = orig; }, 1800);
        }).catch(() => {});
    }

    appendMessageActions(msgDiv, promptText = '') {
        const actions = document.createElement('div');
        actions.className = 'david-msg-actions';
        actions.dataset.editPrompt = promptText || '';
        actions.innerHTML = `
            <button class="david-action-btn" title="Copy response" onclick="DAVID.copyMessage(this)">
                <svg width="13" height="13" viewBox="0 0 18 18" fill="none"><rect x="6" y="6" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 12H3a1 1 0 01-1-1V3a1 1 0 011-1h8a1 1 0 011 1v1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                Copy
            </button>
            <button class="david-action-btn" title="Edit your message" onclick="DAVID.editUserMessageForResponse(this)">
                <svg width="13" height="13" viewBox="0 0 18 18" fill="none"><path d="M11 2l5 5L6 17H1v-5L11 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
                Edit
            </button>`;
        msgDiv.appendChild(actions);
    }

    findPairedUserMessage(messageIndex = null) {
        if (typeof messageIndex === 'number') {
            for (let i = messageIndex - 1; i >= 0; i--) {
                if (this.history[i] && this.history[i].role === 'user') return this.history[i];
            }
        }
        return [...this.history].reverse().find(m => m.role === 'user') || null;
    }

    setInputFromMessage(text) {
        if (!text || !this.input) return;
        this.input.value = text;
        this.input.focus();
        this.input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    editUserMessageForResponse(btn) {
        const actions = btn.closest('.david-msg-actions');
        const prompt = actions ? actions.dataset.editPrompt : '';
        if (prompt) this.setInputFromMessage(prompt);
        else this.editLastUserMessage();
    }

    editLastUserMessage() {
        const lastUser = [...this.history].reverse().find(m => m.role === 'user');
        if (!lastUser) return;
        this.setInputFromMessage(lastUser.content);
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

        // M.0 part 3 — STAFF SELF-SCOPE: a staff member's David sees ONLY their own record.
        // Return a self-only snapshot; never expose other staff, facilities, or network data.
        if (role === 'staff_member') {
            return this.buildStaffSelfContext(_db, _st);
        }

        // 1. Filter Facilities — scoped by role.
        // NOTE: the mapped user object uses `fid` / `systemId` / `assignedFids` (mapUserFromBackend);
        // there is NO `user.facility_id`. The previous code compared against `user.facility_id`
        // (undefined), so facility_admin/hospital/system_admin all received an EMPTY snapshot.
        const sysFids = (role === 'system_admin' && user.systemId)
            ? (_db.facilities || []).filter(f => f.systemId === user.systemId).map(f => f.id)
            : [];
        const authorizedFacilities = (_db.facilities || []).filter(f =>
            isMaster
            || assignedFids.includes(f.id)                                                   // staff_admin
            || ((role === 'facility_admin' || role === 'hospital') && f.id === user.fid)      // single-facility leaders
            || (role === 'system_admin' && sysFids.includes(f.id))                            // system admin
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

    // M.0 part 3 — self-only context for a staff_member. Exposes nothing about anyone else.
    buildStaffSelfContext(_db, _st) {
        const me = (_db.staff || []).find(s => String(s.id) === String(_st.staffId));
        if (!me) return "No personal training record is loaded yet for this account.";
        const myFac = (_db.facilities || []).find(f => f.id === me.fid);
        const g = (x) => x || '—';
        const ps = me.ps || {};
        return `
            DAVID PERSONAL COACHING SNAPSHOT — you are coaching THIS person about THEIR OWN progress only:
            - Name: ${`${me.first || ''} ${me.last || ''}`.trim() || 'Technician'}
            - Facility: ${myFac ? myFac.name : '—'}
            - Current belt: ${g(me.belt)} (${me.stars || 0} star${me.stars === 1 ? '' : 's'})
            - Current-belt gates: Competency=${g(me.cur?.c)}, Simulation=${g(me.cur?.s)}, Observation=${g(me.cur?.o)}
            - Next-belt gates: Competency=${g(me.nxt?.c)}, Simulation=${g(me.nxt?.s)}, Observation=${g(me.nxt?.o)}
            - Position School: enrolled=${ps.enrolled ? 'yes' : 'no'}, completed=${ps.done ? 'yes' : 'no'}${ps.track ? `, track=${ps.track}` : ''}
            - Practice scores (best % per belt/mode): ${JSON.stringify(me.practiceScores || {})}
            [SCOPE]: You can see ONLY this person's own record. You have NO access to other staff, other facilities, the assessment queue, or network data. If asked about anyone else, say you can only help them with their own training.
        `.trim();
    }

    // M.0 part 4 — role-aware system persona. Directives 8 (curriculum) & 9 (standards copyright)
    // are legally load-bearing and kept verbatim for EVERY role.
    buildPersonality() {
        const _st = (typeof ST !== 'undefined') ? ST : null;
        const role = (_st && _st.user && _st.user.role) || 'master_admin';
        const isExec = role === 'master_admin' || role === 'staff_admin';
        const isStaff = role === 'staff_member';

        const CURRICULUM = `CURRICULUM COACHING (KNOWLEDGE BASE): For ANY question about the SBD belt or position-school curriculum — belt requirements, study material, practice questions, situational scenarios, sterile-processing procedures, assessment prep, or how a candidate advances or should be coached — you MUST first search your knowledge base to pull the exact SBD curriculum for the relevant belt/level, then coach strictly from what it returns (Learner Guide content, the question/answer keys, fail indicators, and observation-gate criteria). Name the belt/level you are drawing from. Do NOT invent or approximate curriculum from general knowledge; if the search returns nothing for that topic, say the content for that belt/area is not loaded yet rather than guessing.`;
        const COPYRIGHT = `STANDARDS SAFE-USE (COPYRIGHT COMPLIANCE — overrides curriculum coaching for external standards): SBD curriculum and Sterile by Design materials are OUR intellectual property and may be quoted exactly. External standards are NOT: NEVER reproduce verbatim text, tables, figures, diagrams, or appendices from AAMI, HSPA, Joint Commission, NFPA, ANSI, or any other copyrighted standard. Teach the principle — the purpose, the risk, the best practice, the operational application — in original Sterile by Design language, and CITE the standard you drew from (e.g. "per ANSI/AAMI ST79") while directing the user to consult the current edition of the official publication for authoritative requirements. If a user asks what a standard SAYS or requests its official wording, do not quote it — explain the requirement in your own words and refer them to the publisher's official publication. Prefer public regulatory sources (CDC, CMS, OSHA, FDA) where public guidance fits. You are never a digital copy of any standard: you are the Sterile by Design Operations Coach, built on SBD OS methodologies, SOPs, competencies, and quality systems.`;
        const BRAND = `STRICT BRAND EXCLUSIVITY: SIPS Healthcare Solutions uses SBD OS (Sterile By Design OS) and OTIS exclusively. NEVER recommend, mention, or train users on competitor technologies; use ONLY OTIS and SBD OS as examples. Absolutely DO NOT mention CensiTrac, Censis, SPM, T-DOC, Impress, or any other third-party tracking system.`;
        const OUTPUT = `OUTPUT FORMAT: You may use a brief <thinking>...</thinking> block for private reasoning, but you MUST ALWAYS follow it with your actual answer as plain text OUTSIDE the thinking block. The user only sees text outside <thinking>; never respond with only a thinking block. Never output raw SQL, JSON, or technical logs — synthesize and present results conversationally.`;

        if (isStaff) {
            return `
                PERSONALITY & ROLE:
                You are David OG, a warm, encouraging personal Sterile Processing coach speaking DIRECTLY to one technician. Always use the second person ("you", "your"). You help THIS person understand their belt progress, prepare for their next assessment, and study the curriculum. Be supportive, specific, and practical — like a great preceptor.

                ${OUTPUT}
                ${BRAND}
                ${CURRICULUM}
                ${COPYRIGHT}

                SCOPE: You can only see this person's own record. You cannot see or discuss other technicians, other facilities, or network-wide data, and you have no database access. If asked about anyone else or for data you don't have, gently redirect to coaching them on their own progress.
            `.trim();
        }

        if (isExec) {
            return `
                PERSONALITY & CAPABILITIES:
                You are David OG, the highly intelligent and highly conversational operational partner for SIPS Healthcare Solutions.

                ${OUTPUT}
                WARM, HUMAN EXCELLENCE: Speak with warmth, high emotional intelligence, and sharp operational awareness — a trusted, top-tier Director of Operations who happens to have instantaneous database access.
                AGGRESSIVE INTELLIGENCE: Challenge flawed premises quietly when you see bad data, but keep it friendly.
                PRE-COGNITION: Anticipate the real "why" behind a prompt; synthesize what the data means, don't just list it.
                ${BRAND}
                MASTER ADMIN PRECISION: You are reporting to the Master Admin (CEO / COO) of a large healthcare enterprise. Provide ruthless, executive-level insight: cross-facility benchmarking, risk exposure, resource allocation. Do not assume the org is small from sparse test data.
                ${CURRICULUM}
                ${COPYRIGHT}
                COMMAND CENTER — CROSS-PERSON ANALYSIS: When asked to compare people, judge who is struggling, or find trends, operate as the operations analyst. Pull the real data, then synthesize across as many people as the question needs: (a) COMPARE & CONTRAST individuals; (b) FLAG AT-RISK staff with the recommended intervention; (c) SURFACE PATTERNS across assessments, study habits, and facilities. Render a chart when comparing people or showing a trend, and close with the operational takeaway.

                Execute your tasks perfectly while maintaining casual, highly intelligent human conversation.
            `.trim();
        }

        // Facility / system leaders (hospital, facility_admin, system_admin): scoped, third-person.
        return `
            PERSONALITY & CAPABILITIES:
            You are David OG, the operational partner for a SIPS Healthcare Solutions facility leader. Speak in the third person about their team (use names). You help them run their OWN facility/system: staff readiness, assessment backlog, coaching priorities, and compliance.

            ${OUTPUT}
            WARM, HUMAN EXCELLENCE: Warm, emotionally intelligent, operationally sharp — a trusted Director of Operations for their site(s).
            PRE-COGNITION: Anticipate the real "why"; synthesize what the data means for their team.
            ${BRAND}
            LEADERSHIP ANALYSIS: Within the leader's OWN facility or system only: (a) compare and contrast their technicians' strengths, gaps, belt and assessment history; (b) flag at-risk staff with the recommended intervention; (c) surface patterns in study habits and readiness. Render a chart when comparing people or showing a trend, and close with the operational takeaway. You have NO access to other facilities or the wider network.
            ${CURRICULUM}
            ${COPYRIGHT}
        `.trim();
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text || this.btn.disabled) return;
        if (typeof logActivity === 'function') logActivity('david_query', {});  // P1

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
            const personality = this.buildPersonality();
            const modeDirective = this.getActiveModeDirective();

            // Channel A (P0.3 + P1) — append dynamic per-entity context. Staff get their own
            // practice history + engagement; facility leaders get facility-wide engagement.
            // Best-effort; never blocks the send.
            let channelA = '';
            try {
                const _st = (typeof ST !== 'undefined') ? ST : null;
                const _role = _st && _st.user ? _st.user.role : null;
                const S = window.DavidSerializers;
                const A = window.DavidAlerts;
                if (S && _role === 'staff_member') {
                    const parts = await Promise.all([
                        S.aiSerializePracticeHistory(_st.staffId),
                        S.aiSerializeEngagement(_st.staffId),
                        S.aiSerializeVelocity(_st.staffId),
                        A ? A.aiSerializeAlerts('staff', _st.staffId) : '',
                    ]);
                    channelA = parts.filter(Boolean).join('\n\n');
                } else if ((_role === 'facility_admin' || _role === 'hospital') && _st.user.fid) {
                    const parts = await Promise.all([
                        S ? S.aiSerializeFacilityEngagement(_st.user.fid) : '',
                        S ? S.aiSerializeComplianceForecast(_st.user.fid) : '',
                        A ? A.aiSerializeAlerts('facility', _st.user.fid) : '',
                    ]);
                    channelA = parts.filter(Boolean).join('\n\n');
                } else if (_role === 'system_admin' && _st.user.systemId && A) {
                    channelA = await A.aiSerializeAlerts('system', _st.user.systemId) || '';
                }
            } catch (e) { /* context enrichment is optional */ }

            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    message: text,
                    history: this.history,
                    model: this.getActiveModel(),   // M.3 — server allowlists + falls back to Sonnet
                    systemPrompt: personality + modeDirective + "\n\nCONTEXT:\n" + snapshot + (channelA ? "\n\n" + channelA : "")
                })
            });

            if (!res.ok) {
                let errorJson = {};
                try {
                    errorJson = await res.json();
                } catch(e) {}
                
                if (res.status === 403 && errorJson.action === 'ACTION_QUOTA_EXHAUSTED') {
                    const isStaff = errorJson.role === 'staff';
                    contentTarget.innerHTML = `
                        <div class="david-upsell-card" style="padding: 16px; border-radius: 8px; background: rgba(239,68,68,0.08); border: 1px solid #ef4444; text-align: center; margin-top: 8px;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="margin-bottom: 8px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            <h3 style="color: #ef4444; margin-top: 0; font-size: 15px;">Monthly Question Limit Reached</h3>
                            <p style="font-size: 13px; color: var(--txt); opacity: 0.85; line-height: 1.4;">${isStaff
                                ? "Your facility has used all of this month's David questions. A manager or administrator can still ask from the reserve, or upgrade the facility's SIPS plan."
                                : "This facility's monthly David questions — including the manager reserve — are used up. Questions reset on the 1st, or upgrade the SIPS plan to add capacity now."}</p>
                        </div>
                    `;
                    const cursor = msgDiv.querySelector('.david-cursor');
                    if (cursor) cursor.style.display = 'none';
                    this.isThinking = false;
                    this.btn.disabled = false;
                    return;
                }

                if (res.status === 403 && errorJson.action === 'ACTION_UPSELL') {
                    contentTarget.innerHTML = `
                        <div class="david-upsell-card" style="padding: 16px; border-radius: 8px; background: rgba(196,154,32,0.1); border: 1px solid var(--gold); text-align: center; margin-top: 8px;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" style="margin-bottom: 8px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            <h3 style="color: var(--gold); margin-top: 0; font-size: 15px;">David OG Intelligence Locked</h3>
                            <p style="font-size: 13px; color: var(--txt); opacity: 0.8; line-height: 1.4;">Your facility currently does not have access to SBD Operational Intelligence.</p>
                            <button onclick="alert('Contacting Sales...')" style="margin-top: 12px; padding: 8px 16px; background: var(--gold); color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.2s;">Unlock Facility Intelligence</button>
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
                                } else if (json.meta && json.meta.quota) {
                                    // Gap 2 — non-blocking heads-up at 75% (NOTICE) / 90% (UPGRADE).
                                    this.renderQuotaNotice(msgDiv, json.meta.quota);
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
                this.appendMessageActions(msgDiv, text);
                const _ts = document.createElement('div');
                _ts.className = 'david-msg-time';
                _ts.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                msgDiv.appendChild(_ts);

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
            <button class="david-card-btn" onclick="${payload.on_click}">
                ${payload.btn_text || 'Download Report'}
            </button>
        `;
        this.msgArea.appendChild(card);
        this.msgArea.scrollTop = this.msgArea.scrollHeight;
    }

    // Gap 2 — non-blocking quota heads-up banner (75% NOTICE / 90% UPGRADE). Inserted once
    // per message, above the streamed answer. Questions/plan language only — never cost.
    renderQuotaNotice(msgDiv, quota) {
        if (!msgDiv || !quota) return;
        if (msgDiv.querySelector('.david-quota-notice')) return; // one banner per message
        const isUpgrade = quota.state === 'UPGRADE';
        const color = isUpgrade ? '#ef4444' : '#f59e0b';
        const title = isUpgrade
            ? `Approaching your monthly question limit (${quota.percent}% used)`
            : `Heads up — ${quota.percent}% of this month's questions used`;
        const body = isUpgrade
            ? "Your facility is close to its monthly David question allowance. Consider upgrading your SIPS plan to avoid interruption."
            : "You're past 75% of your facility's monthly David questions for this period.";
        const banner = document.createElement('div');
        banner.className = 'david-quota-notice';
        banner.style.cssText = `margin: 0 0 10px; padding: 10px 14px; border-radius: 8px; background: ${color}1a; border: 1px solid ${color}; font-size: 12px; line-height: 1.4; color: var(--txt);`;
        banner.innerHTML = `<strong style="color: ${color};">${title}</strong><br>${body}`;
        msgDiv.insertBefore(banner, msgDiv.firstChild);
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
                customHtml = `<pre style="background:rgba(0,0,0,0.3); padding:12px; border-radius:6px; font-family:ui-monospace,Menlo,monospace;"><code style="color:var(--gold)">${data}</code></pre>`;
            } else {
                customHtml = `<pre style="background:rgba(0,0,0,0.3); padding:12px; border-radius:6px; font-family:ui-monospace,Menlo,monospace; white-space:pre-wrap; word-wrap:break-word;"><code>${JSON.stringify(data, null, 2)}</code></pre>`;
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
                customHtml: `<textarea id="david-meta-edit" style="width:100%; height:120px; background:var(--bg); border:1px solid var(--bdr); color:var(--txt); border-radius:8px; padding:12px; font-family:ui-monospace,Menlo,monospace; outline:none; resize:none;">${blob}</textarea>`,
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
