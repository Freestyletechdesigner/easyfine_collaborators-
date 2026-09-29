/**
 * OneSignal Push Notification Initialiser
 * =========================================
 * - Initialises the OneSignal SDK on every page
 * - Shows a friendly custom prompt to visitors (no login required)
 * - Anyone who clicks "Allow" joins the "All" segment and will
 *   receive push notifications when new properties are posted
 * - Tags logged-in agents with their External ID for targeted alerts
 */

window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal) {

    await OneSignal.init({
        appId:                     '6eea95f8-d4eb-43fc-b6ee-6fa8c52a2816',
        notifyButton:              { enable: false },  // we use a custom prompt below
        allowLocalhostAsSecureOrigin: true,
        // Don't auto-prompt — we control the timing ourselves
        promptOptions: {
            autoPrompt: false,
        },
    });

    // ── Tag logged-in agent ───────────────────────────────
    try {
        const r = await fetch('/api/agent/profile', { credentials: 'include' });
        const d = await r.json();
        if (d.success && d.agent) {
            await OneSignal.login(d.agent._id.toString());
            await OneSignal.User.addTags({
                role:       'agent',
                agent_name:  d.agent.name  || '',
                agent_email: d.agent.email || '',
            });
        }
    } catch (_) {}

    // ── Show custom subscribe prompt to unsubscribed visitors ──
    // Wait 4 seconds so the page loads first
    setTimeout(async () => {
        try {
            const permission = await OneSignal.Notifications.permissionNative;
            // Only show if user hasn't responded to the native prompt yet
            if (permission !== 'default') return;

            // Don't show if we already showed it this session
            if (sessionStorage.getItem('onesignal_prompt_shown')) return;
            sessionStorage.setItem('onesignal_prompt_shown', '1');

            showSubscribePrompt(OneSignal);
        } catch (_) {}
    }, 4000);
});

// ── Custom slide-down prompt ──────────────────────────────
function showSubscribePrompt(OneSignal) {
    // Don't inject twice
    if (document.getElementById('ef-push-prompt')) return;

    const prompt = document.createElement('div');
    prompt.id = 'ef-push-prompt';
    prompt.innerHTML = `
        <div id="ef-push-inner">
            <div id="ef-push-icon">🏠</div>
            <div id="ef-push-text">
                <strong>Get new property alerts</strong>
                <span>We'll notify you whenever a new listing is posted — for free.</span>
            </div>
            <div id="ef-push-btns">
                <button id="ef-push-yes">Allow</button>
                <button id="ef-push-no">Not now</button>
            </div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        #ef-push-prompt {
            position: fixed;
            top: -120px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 99999;
            width: min(94vw, 500px);
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 8px 40px rgba(0,0,0,.18);
            border: 1px solid #e0f5f3;
            padding: 16px 18px;
            transition: top .4s cubic-bezier(.34,1.56,.64,1);
            font-family: 'Poppins', Arial, sans-serif;
        }
        #ef-push-prompt.show { top: 16px; }
        #ef-push-inner { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
        #ef-push-icon { font-size:2rem; flex-shrink:0; }
        #ef-push-text { flex:1; min-width:0; }
        #ef-push-text strong { display:block; font-size:14px; color:#111; font-weight:700; }
        #ef-push-text span { font-size:12.5px; color:#666; }
        #ef-push-btns { display:flex; gap:8px; flex-shrink:0; }
        #ef-push-yes {
            padding:8px 18px; border-radius:20px;
            background:#0d7068; color:#fff; border:none;
            font-size:13px; font-weight:600; cursor:pointer;
        }
        #ef-push-yes:hover { background:#055361; }
        #ef-push-no {
            padding:8px 14px; border-radius:20px;
            background:#f3f4f6; color:#555; border:none;
            font-size:13px; cursor:pointer;
        }
        #ef-push-no:hover { background:#e5e7eb; }
    `;

    document.head.appendChild(style);
    document.body.appendChild(prompt);

    // Slide in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => prompt.classList.add('show'));
    });

    function dismiss() {
        prompt.classList.remove('show');
        setTimeout(() => prompt.remove(), 500);
    }

    document.getElementById('ef-push-yes').addEventListener('click', async () => {
        dismiss();
        try {
            // Request the real browser permission
            await OneSignal.Notifications.requestPermission();
        } catch (_) {}
    });

    document.getElementById('ef-push-no').addEventListener('click', dismiss);

    // Auto-dismiss after 12 seconds
    setTimeout(dismiss, 12000);
}
