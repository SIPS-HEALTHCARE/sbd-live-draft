# In-App Approval Modal for DAVID Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the native browser `window.confirm` and `window.alert` popups inside the DAVID AI Chat with a custom, elegantly designed in-app modal interface.

**Architecture:** We will extend `DavidChat.js` to include CSS styles and HTML structure for a reusable internal overlay and dialog. We will then create a central `showModal` method to dispatch the actions and refactor the `deleteSession` method to use this customized UI component for both confirmations and error alerts.

**Tech Stack:** Vanilla JS (ES6 Classes), CSS (Injected Styles), DOM Manipulation

---

### Task 1: Add Modal CSS to `injectStyles`

**Files:**
- Modify: `/Users/iiggie/Desktop/Antigravity/src/components/DavidChat.js`

- [ ] **Step 1: Inject the new CSS rules for the custom modal overlay and content.**

```javascript
/* Inside DavidChat.js around the bottom of the injectStyles textContent string, before the closing backtick */

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
```

- [ ] **Step 2: Commit the CSS updates**

```bash
git add src/components/DavidChat.js
git commit -m "feat(ui): add modal styles for david chat"
```

### Task 2: Inject Modal HTML Markup

**Files:**
- Modify: `/Users/iiggie/Desktop/Antigravity/src/components/DavidChat.js`

- [ ] **Step 1: Update the HTML template inside `renderIn` to embed the modal overlay.**

```javascript
/* Locate the following section inside `renderIn` container.innerHTML block:
            <div class="david-container">
                <div class="david-layout">

Update the innerHTML template to include the modal right before the closing `</div>` of `.david-container`.
*/
                </div>
                <!-- Appended Modal Overlay -->
                <div class="david-modal-overlay" id="david-modal" style="display: none;">
                    <div class="david-modal-content">
                        <h3 class="david-modal-title" id="david-modal-title"></h3>
                        <p class="david-modal-text" id="david-modal-text"></p>
                        <div class="david-modal-actions">
                            <button class="david-modal-btn david-modal-cancel" id="david-modal-cancel">Cancel</button>
                            <button class="david-modal-btn david-modal-confirm" id="david-modal-confirm">Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
```

- [ ] **Step 2: Capture a reference to `.david-container` to restrict DOM queries to our instance.**

```javascript
/* Below this line in renderIn:
        this.msgArea = container.querySelector('#david-msgs');
*/
        this.container = container; 
```

- [ ] **Step 3: Commit the HTML updates**

```bash
git add src/components/DavidChat.js
git commit -m "feat(ui): add modal dom elements to david chat container"
```

### Task 3: Implement `showModal` Controller

**Files:**
- Modify: `/Users/iiggie/Desktop/Antigravity/src/components/DavidChat.js`

- [ ] **Step 1: Add a `showModal` utility method to the class.**

```javascript
/* Add this method anywhere in the class logic, for example right before `getAuthContext()`: */

    showModal(options) {
        if (!this.container) return;
        const modal = this.container.querySelector('#david-modal');
        const titleEl = this.container.querySelector('#david-modal-title');
        const textEl = this.container.querySelector('#david-modal-text');
        const cancelBtn = this.container.querySelector('#david-modal-cancel');
        const confirmBtn = this.container.querySelector('#david-modal-confirm');

        titleEl.textContent = options.title || 'Confirm';
        textEl.textContent = options.text || 'Are you sure?';
        
        // Handle Action Types (Alert vs Confirm)
        if (options.isAlert) {
            cancelBtn.style.display = 'none';
            confirmBtn.textContent = 'OK';
            confirmBtn.className = 'david-modal-btn david-modal-confirm david-btn-gold';
        } else {
            cancelBtn.style.display = 'block';
            cancelBtn.textContent = options.cancelText || 'Cancel';
            confirmBtn.textContent = options.confirmText || 'Yes, Delete';
            confirmBtn.className = 'david-modal-btn david-modal-confirm'; // Defaults to red destuctive color
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
```

- [ ] **Step 2: Commit the controller updates**

```bash
git add src/components/DavidChat.js
git commit -m "feat(logic): implement showModal utility in david chat"
```

### Task 4: Replace `window.confirm` and `window.alert` in `deleteSession`

**Files:**
- Modify: `/Users/iiggie/Desktop/Antigravity/src/components/DavidChat.js`

- [ ] **Step 1: Refactor the `deleteSession` method.**

```javascript
/* Locate the `deleteSession(sessionId)` method and replace the entire behavior. */
    async deleteSession(sessionId) {
        this.showModal({
            title: 'Delete Chat History',
            text: 'Are you sure you want to delete this chat history? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
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
                    this.renderSessionSidebar();
                    
                    if (this.currentSessionId === sessionId) {
                        this.createNewSession();
                    }
                } catch (e) {
                    console.error('[DAVID] Delete failed:', e);
                    this.showModal({
                        title: 'Error',
                        text: 'Failed to delete chat session. Please try again.',
                        isAlert: true
                    });
                }
            }
        });
    }
```

- [ ] **Step 2: Commit the behavior replacements**

```bash
git add src/components/DavidChat.js
git commit -m "refactor(ui): swap window.confirm for in-app modal in deleteSession"
```
