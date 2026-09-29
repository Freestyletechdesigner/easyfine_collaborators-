'use strict';

// ── State ──────────────────────────────────────────────────────────────────
let currentSessionId = null;
let chatHistory = JSON.parse(localStorage.getItem('easyfind_history')) || [];
const synth = window.speechSynthesis;

// ══════════════════════════════════════════════════════════════════════════
// VISUALIZER ENGINE  (ported from voice2.html)
// ══════════════════════════════════════════════════════════════════════════
const VIZ = (() => {
    // --- shared settings ---
    const settings = {
        particleCount: 180,
        sensitivity:   1.5,
        style:         'orb',
        themeIndex:    0,
        contractStrength: 0.8
    };

    const colorThemes = [
        { name: "Cyan Indigo",  primary:[6,182,212],   secondary:[99,102,241],  accent:[236,72,153]  },
        { name: "Neon Emerald", primary:[16,185,129],  secondary:[59,130,246],  accent:[245,158,11]  },
        { name: "Cyber Gold",   primary:[245,158,11],  secondary:[239,68,68],   accent:[168,85,247]  },
        { name: "Vapor Wave",   primary:[236,72,153],  secondary:[139,92,246],  accent:[6,182,212]   },
    ];

    class DotParticle {
        constructor(index) { this.index = index; this.reset(); }
        reset() {
            this.angle       = Math.random() * Math.PI * 2;
            this.baseRadius  = 50 + Math.random() * 180;
            this.currentRadius = this.baseRadius;
            this.speed       = (Math.random() * 0.008 + 0.002) * (Math.random() > .5 ? 1 : -1);
            this.size        = Math.random() * 2.2 + 1.1;
            this.noiseX      = Math.random() * 1000;
            this.noiseY      = Math.random() * 1000;
            this.x = 0; this.y = 0;
        }
        update(audioLevel, freqValue, w, h) {
            this.angle  += this.speed * (1 + audioLevel * 1.5);
            this.noiseX += 0.005; this.noiseY += 0.005;
            const cx = w / 2, cy = h / 2;
            const contractionFactor = Math.sin(audioLevel * Math.PI) * settings.contractStrength;
            const targetRadius = Math.max(25, this.baseRadius * (1 - contractionFactor * 0.6) + (freqValue / 255) * 35);
            this.currentRadius += (targetRadius - this.currentRadius) * 0.1;
            const floatOffset = Math.sin(this.noiseX) * 12 * (1 - audioLevel * 0.5);
            this.x = cx + Math.cos(this.angle) * (this.currentRadius + floatOffset);
            this.y = cy + Math.sin(this.angle) * (this.currentRadius + floatOffset);
        }
        draw(ctx, audioLevel, freqValue) {
            const theme = colorThemes[settings.themeIndex];
            const ratio = freqValue / 255;
            const r = Math.round(theme.primary[0]*(1-ratio)+theme.accent[0]*ratio);
            const g = Math.round(theme.primary[1]*(1-ratio)+theme.accent[1]*ratio);
            const b = Math.round(theme.primary[2]*(1-ratio)+theme.accent[2]*ratio);
            const sz = this.size * (1 + ratio * 1.8);
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, sz, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${0.4+ratio*0.6})`;
            ctx.shadowColor = `rgba(${r},${g},${b},${Math.min(1, audioLevel*1.5)})`;
            ctx.shadowBlur  = 8 + Math.min(1, audioLevel*1.5) * 12;
            ctx.fill(); ctx.restore();
        }
    }

    // --- one instance per canvas ---
    function createInstance(canvasEl) {
        const ctx    = canvasEl.getContext('2d');
        const dpr    = Math.min(window.devicePixelRatio || 1, 2);
        let w = 0, h = 0;
        let particles = [];
        let audioData = new Uint8Array(64);
        let smoothLevel = 0;
        let appState = 'idle';    // 'idle' | 'simulated_speech' | 'listening'
        let rafId    = null;

        function resize() {
            w = canvasEl.parentElement?.offsetWidth  || window.innerWidth;
            h = canvasEl.parentElement?.offsetHeight || window.innerHeight;
            canvasEl.width  = w * dpr;
            canvasEl.height = h * dpr;
            ctx.scale(dpr, dpr);
            particles = Array.from({ length: settings.particleCount }, (_, i) => new DotParticle(i));
        }

        function updateAudio() {
            if (appState === 'simulated_speech') {
                const t = Date.now() * 0.005;
                const wave = Math.max(0, (Math.sin(t*2)*.4+.5) * (Math.cos(t*3.7)*.3+.3) + (Math.random()*.2-.1));
                const lvl  = wave * settings.sensitivity;
                smoothLevel += (lvl - smoothLevel) * 0.15;
                for (let i = 0; i < audioData.length; i++)
                    audioData[i] = Math.min(255, (Math.sin(t + i*.2)*128+127) * smoothLevel);
            } else {
                smoothLevel += (0.04 + Math.sin(Date.now()*.002)*.02 - smoothLevel) * 0.1;
                for (let i = 0; i < audioData.length; i++) audioData[i] = 8 + Math.random()*12;
            }
        }

        function frame() {
            updateAudio();
            ctx.fillStyle = 'rgba(3,7,18,0.28)';
            ctx.fillRect(0, 0, w, h);
            const cx = w/2, cy = h/2;
            const theme = colorThemes[settings.themeIndex];

            // connections
            const maxConn = 70 + smoothLevel * 40;
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i+1; j < particles.length; j+=3) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const d  = Math.hypot(dx, dy);
                    if (d < maxConn) {
                        const a = (1-d/maxConn)*0.28*(0.3+smoothLevel);
                        ctx.strokeStyle = `rgba(${theme.secondary[0]},${theme.secondary[1]},${theme.secondary[2]},${a})`;
                        ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
                    }
                }
            }
            // core glow
            if (smoothLevel > 0.07) {
                const cr = Math.max(8, 35*smoothLevel);
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr*2.5);
                grad.addColorStop(0, `rgba(${theme.primary[0]},${theme.primary[1]},${theme.primary[2]},${smoothLevel*.38})`);
                grad.addColorStop(0.5, `rgba(${theme.secondary[0]},${theme.secondary[1]},${theme.secondary[2]},${smoothLevel*.14})`);
                grad.addColorStop(1, 'transparent');
                ctx.save(); ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(cx, cy, cr*2.5, 0, Math.PI*2); ctx.fill(); ctx.restore();
            }
            // particles
            for (let i = 0; i < particles.length; i++) {
                const fv = audioData[i % audioData.length] || 0;
                particles[i].update(smoothLevel, fv, w, h);
                particles[i].draw(ctx, smoothLevel, fv);
            }
            rafId = requestAnimationFrame(frame);
        }

        function start(state) {
            appState = state;
            if (!rafId) { resize(); frame(); }
        }
        function stop()  { appState = 'idle'; }
        function destroy() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

        window.addEventListener('resize', () => { if (rafId) resize(); });

        return { start, stop, destroy };
    }

    // lazily initialised instances
    let micViz = null, aiViz = null;

    function getMicViz()  { if (!micViz) micViz = createInstance(document.getElementById('visualizerCanvas'));   return micViz; }
    function getAiViz()   { if (!aiViz)  aiViz  = createInstance(document.getElementById('aiVisualizerCanvas')); return aiViz; }

    return { getMicViz, getAiViz };
})();


// ── Google One-Tap / Login modal ───────────────────────────────────────────
let currentUser = null; // { name, email, profilePicture } once logged in

async function checkSession() {
    try {
        const res  = await fetch('/api/user/session');
        const data = await res.json();
        if (data.loggedIn) {
            const profileRes  = await fetch('/api/user/profile');
            const profileData = await profileRes.json();
            if (profileData.success !== false) {
                currentUser = profileData;
                renderUserProfile();
            }
        } else {
            showLoginPrompt();
            // Show login modal automatically on first visit (not logged in)
            const hasVisited = localStorage.getItem('easyfind_ai_visited');
            if (!hasVisited) {
                localStorage.setItem('easyfind_ai_visited', '1');
                // Small delay so the page finishes rendering before the modal appears
                setTimeout(openLoginModal, 800);
            }
        }
    } catch (_) {
        showLoginPrompt();
    }
}

function renderUserProfile() {
    const profile = document.querySelector('.user-profile');
    if (!profile) return;
    if (currentUser?.profilePicture) {
        profile.innerHTML = `<img src="${currentUser.profilePicture}" alt="profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
        const initial = (currentUser?.name || 'U')[0].toUpperCase();
        profile.textContent = initial;
    }
    profile.style.cursor = 'pointer';
    profile.onclick = () => { window.location.href = '/user-profile'; };

    // Update sidebar name + show logout
    const nameEl   = document.getElementById('sidebarUserName');
    const logoutEl = document.getElementById('sidebarLogoutBtn');
    if (nameEl)   nameEl.textContent = currentUser?.name || 'User';
    if (logoutEl) logoutEl.style.display = 'flex';
}

function showLoginPrompt() {
    const profile = document.querySelector('.user-profile');
    if (profile) {
        profile.innerHTML = '<i class="fa-solid fa-user" style="font-size:15px;"></i>';
        profile.style.cursor = 'pointer';
        profile.title = 'Sign in';
        profile.onclick = openLoginModal;
    }
    const nameEl   = document.getElementById('sidebarUserName');
    const logoutEl = document.getElementById('sidebarLogoutBtn');
    if (nameEl)   nameEl.textContent = 'Login';
    if (logoutEl) logoutEl.style.display = 'none';
}

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function handleModalBackdropClick(e) {
    if (e.target === document.getElementById('loginModal')) closeLoginModal();
}

// Called by Google Sign-In button via data-callback
async function handleGoogleLogin(response) {
    try {
        const res  = await fetch('/api/signup', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ googleToken: response.credential })
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            closeLoginModal();
            renderUserProfile();
        } else {
            alert(data.message || 'Sign-in failed. Please try again.');
        }
    } catch (_) {
        alert('Network error. Please try again.');
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    showLoginPrompt();
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('active');
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
    if (sidebar.classList.contains('active')) renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    chatHistory.slice().reverse().forEach(session => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `<span onclick="loadSession(${session.id})">${session.title}</span><i class="fa-solid fa-trash-can delete-item-btn" onclick="deleteSession(${session.id}, event)"></i>`;
        list.appendChild(item);
    });
}

function startNewChat() {
    currentSessionId = null;
    document.getElementById('messagesWrapper').innerHTML = '';
    document.getElementById('heroContainer').style.display = 'flex';
    document.getElementById('chatContainer').style.display = 'none';
    toggleSidebar();
}

function loadSession(id) {
    const session = chatHistory.find(s => s.id === id);
    if (!session) return;
    currentSessionId = id;
    document.getElementById('heroContainer').style.display = 'none';
    document.getElementById('chatContainer').style.display = 'flex';
    const wrapper = document.getElementById('messagesWrapper');
    wrapper.innerHTML = '';
    session.messages.forEach(msg => appendMessageUI(msg.role, msg.content));
    toggleSidebar();
}

function deleteSession(id, event) {
    event.stopPropagation();
    chatHistory = chatHistory.filter(s => s.id !== id);
    localStorage.setItem('easyfind_history', JSON.stringify(chatHistory));
    if (currentSessionId === id) startNewChat();
    renderHistory();
}

function clearAllHistory() {
    if (confirm('Delete all history?')) {
        chatHistory = [];
        localStorage.removeItem('easyfind_history');
        startNewChat();
        renderHistory();
    }
}

function saveToLocalStorage(role, content) {
    if (!currentSessionId) {
        currentSessionId = Date.now();
        chatHistory.push({ id: currentSessionId, title: content.substring(0, 30) + '...', messages: [] });
    }
    const session = chatHistory.find(s => s.id === currentSessionId);
    session.messages.push({ role, content });
    localStorage.setItem('easyfind_history', JSON.stringify(chatHistory));
}

// ── Typing animation ───────────────────────────────────────────────────────
const typingText   = document.getElementById('typing-text');
const searchQueries = ['Searching for 3 bedroom flat...', 'Find a lodge under 150k...', 'Looking for duplexes...'];
let qIdx = 0, cIdx = 0, isDel = false;

function typeEffect() {
    const q = searchQueries[qIdx];
    typingText.textContent = isDel ? q.substring(0, cIdx--) : q.substring(0, cIdx++);
    let speed = isDel ? 50 : 100;
    if (!isDel && cIdx > q.length)  { isDel = true;  speed = 2000; }
    else if (isDel && cIdx < 0)     { isDel = false; qIdx = (qIdx + 1) % searchQueries.length; speed = 500; }
    setTimeout(typeEffect, speed);
}

window.onload = () => {
    typeEffect();
    checkSession();
};

// ── Voice conversation state ───────────────────────────────────────────────
let isListening      = false;
let voiceModeActive  = false;   // true while the continuous voice loop is running
let pendingTranscript = '';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

// ── helpers to update the unified overlay UI ───────────────────────────────
function _setVoiceStatus(label, dotColor, micActive) {
    document.getElementById('vizStatusText').textContent = label;
    document.getElementById('vizStatusDot').style.background = dotColor;
    document.getElementById('interimText').textContent = label === 'Fred is speaking...'
        ? (pendingTranscript || '...')
        : label;

    const ring = document.getElementById('voiceMicRing');
    if (ring) ring.classList.toggle('speaking', !micActive);
}

// ── Build the recognition object ───────────────────────────────────────────
function _buildRecognition() {
    if (!SpeechRecognition) return;
    recognition = new SpeechRecognition();
    recognition.continuous      = false;   // one utterance per cycle
    recognition.interimResults  = true;

    recognition.onstart = () => {
        isListening = true;
        _setVoiceStatus('Listening...', '#10b981', true);
        VIZ.getMicViz().start('idle');
    };

    recognition.onresult = (e) => {
        let interim = '', final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) final  += e.results[i][0].transcript;
            else                      interim += e.results[i][0].transcript;
        }
        document.getElementById('interimText').textContent = final || interim || 'Listening...';
        if (final) pendingTranscript = final.trim();
    };

    recognition.onend = () => {
        isListening = false;
        if (!voiceModeActive) return;   // user already cancelled

        if (pendingTranscript) {
            const text = pendingTranscript;
            pendingTranscript = '';
            _voiceHandleUserTurn(text);
        } else {
            // nothing heard → listen again
            _startListeningCycle();
        }
    };

    recognition.onerror = (e) => {
        isListening = false;
        if (!voiceModeActive) return;
        // ignore no-speech; anything else → retry
        setTimeout(_startListeningCycle, 600);
    };
}

// ── Start one listen cycle ─────────────────────────────────────────────────
function _startListeningCycle() {
    if (!voiceModeActive) return;
    pendingTranscript = '';
    try {
        recognition.start();
    } catch (_) {
        // recognition may still be running from a prior cycle; abort & retry
        recognition.abort();
        setTimeout(_startListeningCycle, 300);
    }
}

// ── Handle what the user said, get AI reply, speak it, then loop ───────────
function _voiceHandleUserTurn(text) {
    if (!voiceModeActive) return;

    // Show the user turn in chat (same as sendMessage does)
    if (heroContainer.style.display !== 'none') {
        heroContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
    }
    appendMessageUI('user', text);
    saveToLocalStorage('user', text);

    // Update overlay: thinking state
    _setVoiceStatus('Thinking...', '#f59e0b', false);
    document.getElementById('interimText').textContent = 'Thinking...';

    // Simulate API call (mirrors showThinkingAndReply)
    setTimeout(() => {
        if (!voiceModeActive) return;
        const reply = `I've analyzed the market for "${text}". I found matching properties in your requested area.`;
        appendMessageUI('bot', reply);
        saveToLocalStorage('bot', reply);
        _voiceSpeakReply(reply);
    }, 2000);
}

// ── Speak the AI reply, then loop back to listening ───────────────────────
function _voiceSpeakReply(text) {
    if (!voiceModeActive) return;
    if (!synth) { _startListeningCycle(); return; }

    _setVoiceStatus('Fred is speaking...', '#06b6d4', false);
    document.getElementById('interimText').textContent = text;

    VIZ.getMicViz().start('simulated_speech');

    const utterance      = new SpeechSynthesisUtterance(text);
    utterance.rate       = 1;
    utterance.onend      = () => {
        if (!voiceModeActive) return;
        VIZ.getMicViz().stop();
        // slight pause before listening again
        setTimeout(_startListeningCycle, 400);
    };
    utterance.onerror    = () => {
        if (!voiceModeActive) return;
        VIZ.getMicViz().stop();
        setTimeout(_startListeningCycle, 400);
    };
    synth.speak(utterance);
}

// ── Public: start the full voice conversation ─────────────────────────────
function startVoiceMode() {
    if (!SpeechRecognition) return alert('Voice input is not supported in this browser.');
    if (voiceModeActive)    return;

    voiceModeActive = true;
    pendingTranscript = '';

    // Show the unified voice overlay, hide text input
    document.getElementById('voiceOverlay').style.display     = 'flex';
    document.getElementById('mainInputContainer').style.display = 'none';

    _buildRecognition();
    _startListeningCycle();
}

// ── Public: cancel voice mode, return to text UI ──────────────────────────
function cancelVoiceMode() {
    voiceModeActive = false;
    isListening     = false;

    // Stop recognition & speech
    try { recognition && recognition.abort(); } catch (_) {}
    synth && synth.cancel();

    VIZ.getMicViz().stop();

    // Hide overlays, restore text input
    document.getElementById('voiceOverlay').style.display      = 'none';
    document.getElementById('aiSpeakingOverlay').style.display = 'none';
    document.getElementById('mainInputContainer').style.display = 'flex';
    document.getElementById('stopAiBtn').style.display          = 'none';
}

// ── Kept for backward compat (mic button onclick) ─────────────────────────
function toggleVoiceRecognition() {
    if (voiceModeActive) cancelVoiceMode();
    else                 startVoiceMode();
}

// ── AI voice reply (text-chat path — plays then returns to text UI) ────────
function speakAiText(text) {
    // Only called when NOT in voice mode (normal text chat)
    if (voiceModeActive) return;
    if (!synth) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = 1;
    utterance.onstart = () => {
        document.getElementById('aiSpeakingOverlay').style.display = 'flex';
        document.getElementById('aiSpeakingText').textContent      = text;
        document.getElementById('mainInputContainer').style.display = 'none';
        document.getElementById('stopAiBtn').style.display          = 'flex';
        document.getElementById('aiVizStatusText').textContent      = 'Fred is speaking...';
        VIZ.getAiViz().start('simulated_speech');
    };
    utterance.onend = stopAiVoice;
    synth.speak(utterance);
}

function stopAiVoice() {
    synth && synth.cancel();
    document.getElementById('aiSpeakingOverlay').style.display  = 'none';
    document.getElementById('mainInputContainer').style.display  = 'flex';
    document.getElementById('stopAiBtn').style.display           = 'none';
    VIZ.getAiViz().stop();
}

// ── Chat UI ────────────────────────────────────────────────────────────────
const heroContainer    = document.getElementById('heroContainer');
const chatContainer    = document.getElementById('chatContainer');
const messagesWrapper  = document.getElementById('messagesWrapper');
const userInput        = document.getElementById('userInput');
const micBtn           = document.getElementById('micBtn');
const sendBtn          = document.getElementById('sendBtn');

function toggleButtons() {
    const hasText = userInput.value.trim().length > 0;
    micBtn.style.display  = hasText ? 'none' : 'flex';
    sendBtn.style.display = hasText ? 'flex'  : 'none';
}

function appendMessageUI(role, text) {
    const row = document.createElement('div');
    row.className = `chat-row ${role}`;
    let html = `<div class="message-content">${text}</div><div class="message-actions"><i class="fa-regular fa-copy action-icon-small" title="Copy" onclick="copyToClipboard(this)"></i>`;
    if (role === 'bot') html += `<i class="fa-solid fa-share-nodes action-icon-small" onclick="shareResponse(this)"></i><i class="fa-solid fa-rotate-right action-icon-small" onclick="retryLastResponse(this)"></i>`;
    html += '</div>';
    row.innerHTML = html;
    messagesWrapper.appendChild(row);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function copyToClipboard(icon) {
    const text = icon.closest('.chat-row').querySelector('.message-content').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const orig = icon.className;
        icon.className = 'fa-solid fa-check action-icon-small';
        setTimeout(() => icon.className = orig, 2000);
    });
}

function shareResponse(icon) {
    const text = icon.closest('.chat-row').querySelector('.message-content').textContent;
    if (navigator.share) navigator.share({ text });
}

function retryLastResponse(icon) {
    const botRow = icon.closest('.chat-row');
    const session = chatHistory.find(s => s.id === currentSessionId);
    const userMessages = session.messages.filter(m => m.role === 'user');
    const lastUserText = userMessages[userMessages.length - 1].content;
    botRow.remove();
    showThinkingAndReply(lastUserText);
}

function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    if (heroContainer.style.display !== 'none') {
        heroContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
    }
    appendMessageUI('user', text);
    saveToLocalStorage('user', text);
    userInput.value = '';
    toggleButtons();
    showThinkingAndReply(text);
}

function showThinkingAndReply(prompt) {
    const thinkingRow = document.createElement('div');
    thinkingRow.className = 'chat-row bot';
    thinkingRow.id = 'thinkingIndicator';
    thinkingRow.innerHTML = `<div class="researching-status"><i class="fa-solid fa-magnifying-glass-chart"></i> Making research to find your property... <div class="pulse-dot"></div></div>`;
    messagesWrapper.appendChild(thinkingRow);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    setTimeout(() => {
        document.getElementById('thinkingIndicator')?.remove();
        const res = `I've analyzed the market for "${prompt}". I found matching properties in your requested area.`;
        appendMessageUI('bot', res);
        saveToLocalStorage('bot', res);
        speakAiText(res);
    }, 2500);
}

function handleKeyPress(e) { if (e.key === 'Enter') sendMessage(); }
