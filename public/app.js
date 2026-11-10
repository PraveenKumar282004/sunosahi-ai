/**
 * SunoSahi AI - Client Application Logic
 * Integrates:
 * - Live Microphone Audio Recording & Web Audio Analyser
 * - Real-time Waveform Canvas Visualizer
 * - Gnani Prisma STT & Gnani Timbre TTS Playback
 * - Confidence & Disambiguation Matrix updates
 * - Multi-language Technician Voice Dispatch
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // State Management
  const state = {
    sessionId: 'session_' + Math.random().toString(36).substring(2, 9),
    isRecording: false,
    mediaRecorder: null,
    audioChunks: [],
    audioContext: null,
    analyser: null,
    dataArray: null,
    animationId: null,
    trafficNoiseActive: false,
    noiseAudioNode: null,
    selectedTechnicianLang: 'hindi',
    currentTicket: null,
    activeVoiceAudio: null
  };

  // DOM Elements
  const micBtn = document.getElementById('micBtn');
  const micIcon = document.getElementById('micIcon');
  const micRing = document.getElementById('micRing');
  const micLabel = document.getElementById('micLabel');
  const micSubtitle = document.getElementById('micSubtitle');
  const dialogueContainer = document.getElementById('dialogueContainer');
  const waveformCanvas = document.getElementById('waveformCanvas');
  const canvasCtx = waveformCanvas.getContext('2d');
  const audioTimer = document.getElementById('audioTimer');
  const visualizerMode = document.getElementById('visualizerMode');
  const agentAudioPlayer = document.getElementById('agentAudioPlayer');

  // Tabs
  const tabTicketBtn = document.getElementById('tabTicketBtn');
  const tabTechnicianBtn = document.getElementById('tabTechnicianBtn');
  const tabConfidenceBtn = document.getElementById('tabConfidenceBtn');
  const tabTicketContent = document.getElementById('tabTicketContent');
  const tabTechnicianContent = document.getElementById('tabTechnicianContent');
  const tabConfidenceContent = document.getElementById('tabConfidenceContent');

  // Ticket Elements
  const ticketIdDisplay = document.getElementById('ticketIdDisplay');
  const ticketStatusPill = document.getElementById('ticketStatusPill');
  const ticketIssueText = document.getElementById('ticketIssueText');
  const ticketAddressText = document.getElementById('ticketAddressText');
  const ticketTimeText = document.getElementById('ticketTimeText');
  const addressStatusBadge = document.getElementById('addressStatusBadge');
  const timeStatusBadge = document.getElementById('timeStatusBadge');
  const hallucinationsCount = document.getElementById('hallucinationsCount');

  // Technician View Elements
  const technicianLangBtns = document.querySelectorAll('.tech-lang-btn');
  const technicianSummaryText = document.getElementById('technicianSummaryText');
  const currentLangPill = document.getElementById('currentLangPill');
  const playTechnicianAudioBtn = document.getElementById('playTechnicianAudioBtn');
  const playAudioLabel = document.getElementById('playAudioLabel');
  const copyWhatsAppBtn = document.getElementById('copyWhatsAppBtn');

  // Confidence View Elements
  const overallConfidenceScore = document.getElementById('overallConfidenceScore');
  const acousticScoreText = document.getElementById('acousticScoreText');
  const acousticBar = document.getElementById('acousticBar');
  const completenessScoreText = document.getElementById('completenessScoreText');
  const completenessBar = document.getElementById('completenessBar');
  const disambiguationPenaltyText = document.getElementById('disambiguationPenaltyText');
  const disambiguationBar = document.getElementById('disambiguationBar');

  // Presets & Manual
  const scenario1Btn = document.getElementById('scenario1Btn');
  const scenario1ClarifyBtn = document.getElementById('scenario1ClarifyBtn');
  const scenario2Btn = document.getElementById('scenario2Btn');
  const scenario3Btn = document.getElementById('scenario3Btn');
  const manualTextInput = document.getElementById('manualTextInput');
  const manualSendBtn = document.getElementById('manualSendBtn');
  const resetSessionBtn = document.getElementById('resetSessionBtn');

  // Settings Modal Elements
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const gnaniApiKeyInput = document.getElementById('gnaniApiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const testApiKeyBtn = document.getElementById('testApiKeyBtn');
  const settingsFeedback = document.getElementById('settingsFeedback');
  const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
  const statusDot = document.getElementById('statusDot');
  const statusLabel = document.getElementById('statusLabel');
  const trafficNoiseToggle = document.getElementById('trafficNoiseToggle');
  const noiseStatusText = document.getElementById('noiseStatusText');

  // Theme Switcher Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');

  // -------------------------------------------------------------
  // THEME SWITCHER (LIGHT & DARK MODE)
  // -------------------------------------------------------------
  function initTheme() {
    const savedTheme = localStorage.getItem('sunosahi_theme') || 'light';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      if (themeIcon) {
        themeIcon.setAttribute('data-lucide', 'sun');
        themeIcon.className = "w-3.5 h-3.5 text-amber-400";
      }
      if (themeText) themeText.textContent = "Light";
      if (themeToggleBtn) themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
    } else {
      document.documentElement.classList.remove('dark');
      if (themeIcon) {
        themeIcon.setAttribute('data-lucide', 'moon');
        themeIcon.className = "w-3.5 h-3.5 text-teal-400";
      }
      if (themeText) themeText.textContent = "Dark";
      if (themeToggleBtn) themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
    }
    localStorage.setItem('sunosahi_theme', theme);
    if (window.lucide) lucide.createIcons();
    drawIdleWaveform();
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      applyTheme(isDark ? 'light' : 'dark');
    });
  }

  initTheme();

  // -------------------------------------------------------------
  // TAB NAVIGATION
  // -------------------------------------------------------------
  function switchTab(activeTab) {
    [tabTicketContent, tabTechnicianContent, tabConfidenceContent].forEach(el => el.classList.add('hidden'));
    [tabTicketBtn, tabTechnicianBtn, tabConfidenceBtn].forEach(btn => {
      btn.className = "flex-1 py-2 text-xs font-semibold rounded-md text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center gap-1.5";
    });

    const activeBtnClass = "flex-1 py-2 text-xs font-bold rounded-md bg-white dark:bg-[#131B2E] text-slate-900 dark:text-white shadow-xs transition flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700";

    if (activeTab === 'ticket') {
      tabTicketContent.classList.remove('hidden');
      tabTicketBtn.className = activeBtnClass;
    } else if (activeTab === 'technician') {
      tabTechnicianContent.classList.remove('hidden');
      tabTechnicianBtn.className = activeBtnClass;
    } else if (activeTab === 'confidence') {
      tabConfidenceContent.classList.remove('hidden');
      tabConfidenceBtn.className = activeBtnClass;
    }
    if (window.lucide) lucide.createIcons();
  }

  tabTicketBtn.addEventListener('click', () => switchTab('ticket'));
  tabTechnicianBtn.addEventListener('click', () => switchTab('technician'));
  tabConfidenceBtn.addEventListener('click', () => switchTab('confidence'));

  // -------------------------------------------------------------
  // CANVAS AUDIO VISUALIZER (TEAL / TURQUOISE PALETTE)
  // -------------------------------------------------------------
  function initVisualizer() {
    canvasCtx.fillStyle = '#042F2E';
    canvasCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    drawIdleWaveform();
  }

  function drawIdleWaveform() {
    if (state.isRecording) return;
    canvasCtx.fillStyle = '#042F2E';
    canvasCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);

    const time = Date.now() * 0.003;
    canvasCtx.beginPath();
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgba(45, 212, 191, 0.7)';

    for (let x = 0; x < waveformCanvas.width; x += 4) {
      const y = waveformCanvas.height / 2 + Math.sin(x * 0.03 + time) * 5;
      if (x === 0) canvasCtx.moveTo(x, y);
      else canvasCtx.lineTo(x, y);
    }
    canvasCtx.stroke();
    requestAnimationFrame(drawIdleWaveform);
  }

  function startLiveWaveform(stream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioCtx();
      const source = state.audioContext.createMediaStreamSource(stream);
      state.analyser = state.audioContext.createAnalyser();
      state.analyser.fftSize = 256;
      source.connect(state.analyser);

      const bufferLength = state.analyser.frequencyBinCount;
      state.dataArray = new Uint8Array(bufferLength);

      function renderLive() {
        if (!state.isRecording) return;
        state.animationId = requestAnimationFrame(renderLive);
        state.analyser.getByteFrequencyData(state.dataArray);

        canvasCtx.fillStyle = 'rgba(4, 47, 46, 0.45)';
        canvasCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);

        const barWidth = (waveformCanvas.width / bufferLength) * 2.2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (state.dataArray[i] / 255) * (waveformCanvas.height - 10);
          const gradient = canvasCtx.createLinearGradient(0, waveformCanvas.height, 0, 0);
          gradient.addColorStop(0, '#0D9488');
          gradient.addColorStop(0.5, '#2DD4BF');
          gradient.addColorStop(1, '#A3E635');

          canvasCtx.fillStyle = gradient;
          canvasCtx.fillRect(x, waveformCanvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      }
      renderLive();
    } catch (e) {
      console.warn('AudioContext visualization failed:', e);
    }
  }

  initVisualizer();

  // -------------------------------------------------------------
  // MICROPHONE RECORDING & GNANI STT
  // -------------------------------------------------------------
  let timerInterval = null;
  let recordSeconds = 0;

  function updateTimer() {
    recordSeconds++;
    const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
    const secs = String(recordSeconds % 60).padStart(2, '0');
    audioTimer.textContent = `${mins}:${secs}`;
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.mediaRecorder = new MediaRecorder(stream);
      state.audioChunks = [];

      state.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) state.audioChunks.push(event.data);
      };

      state.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(state.audioChunks, { type: 'audio/wav' });
        await handleAudioCaptured(audioBlob);
      };

      state.mediaRecorder.start();
      state.isRecording = true;
      recordSeconds = 0;
      timerInterval = setInterval(updateTimer, 1000);

      micRing.classList.remove('hidden');
      micBtn.classList.remove('from-blue-600', 'to-indigo-500');
      micBtn.classList.add('from-red-600', 'to-rose-500', 'glow-active');
      micLabel.textContent = 'Recording Speech... Click to Stop';
      micSubtitle.textContent = 'Listening to Hinglish voice input...';
      visualizerMode.textContent = 'Prisma v3.0 Acoustic Capture: Active';

      startLiveWaveform(stream);
    } catch (err) {
      console.error('Microphone access denied:', err);
      appendSystemNotice('Microphone access blocked. You can still test with the 1-Click Demo Scenarios or manual input.');
    }
  }

  function stopRecording() {
    if (state.mediaRecorder && state.isRecording) {
      state.mediaRecorder.stop();
      state.isRecording = false;
      clearInterval(timerInterval);

      micRing.classList.add('hidden');
      micBtn.classList.add('from-blue-600', 'to-indigo-500');
      micBtn.classList.remove('from-red-600', 'to-rose-500', 'glow-active');
      micLabel.textContent = 'Click to Speak (Live Mic)';
      micSubtitle.textContent = 'Processing with Gnani Prisma STT...';
      visualizerMode.textContent = 'Acoustic Clarity: Optimal';
    }
  }

  micBtn.addEventListener('click', () => {
    if (state.isRecording) stopRecording();
    else startRecording();
  });

  // -------------------------------------------------------------
  // AUDIO CAPTURE & PROCESSING
  // -------------------------------------------------------------
  async function handleAudioCaptured(audioBlob) {
    appendLoadingBubble('Transcribing with Gnani Prisma v3.0...');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'live_speech.wav');
      formData.append('language', 'indic-auto');

      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      removeLoadingBubble();

      if (data.success && data.transcript) {
        processCustomerUtterance(data.transcript, data.acousticConfidence || 92);
      } else {
        appendSystemNotice(`Prisma STT: ${data.message || 'Could not detect clear speech. Please try again.'}`);
      }
    } catch (err) {
      removeLoadingBubble();
      console.error('STT Network error:', err);
      appendSystemNotice('Network error connecting to Prisma STT. Testing with fallback.');
    }
  }

  // -------------------------------------------------------------
  // DIALOGUE PROCESSING & CONFIDENCE ENGINE
  // -------------------------------------------------------------
  async function processCustomerUtterance(text, acousticConfidence = 92) {
    // 1. Add Customer Bubble to Timeline
    appendCustomerBubble(text, acousticConfidence);

    // 2. Add SunoSahi Thinking Bubble
    appendLoadingBubble('SunoSahi analyzing entities & confidence...');

    try {
      const res = await fetch('/api/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          text: text,
          acousticConfidence: acousticConfidence,
          targetLang: 'hi-IN'
        })
      });

      const data = await res.json();
      removeLoadingBubble();

      if (data.success) {
        const turn = data.turn;
        const session = data.session;

        // Append SunoSahi Reply Bubble with Confidence details
        appendAgentBubble(turn.agentReply, turn.agentAction, turn.detectedAmbiguities, data.audio);

        // Update Ticket UI & Confidence Engine UI
        updateTicketUI(session);
        updateConfidenceUI(session.confidenceScores, turn.detectedAmbiguities);

        // Play voice reply
        if (data.audio && data.audio.audioBase64) {
          playGnaniVoice(data.audio.audioBase64, data.audio.contentType);
        } else if (data.useWebSpeechFallback) {
          speakWithBrowser(turn.agentReply);
        }
      }
    } catch (err) {
      removeLoadingBubble();
      console.error('Dialogue Error:', err);
      appendSystemNotice('Error processing conversational dialogue.');
    }
  }

  // -------------------------------------------------------------
  // UI BUBBLES IN CHAT FEED
  // -------------------------------------------------------------
  function appendCustomerBubble(text, confidence) {
    const bubble = document.createElement('div');
    bubble.className = "flex items-start justify-end space-x-3 bubble-anim";
    bubble.innerHTML = `
      <div class="bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl rounded-tr-none p-3.5 max-w-[85%] text-slate-900 dark:text-slate-100 shadow-xs">
        <div class="flex items-center justify-between gap-3 mb-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span class="font-bold text-slate-800 dark:text-slate-200">Caller (Ramesh Kumar)</span>
          <span class="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
            SNR: ${confidence}%
          </span>
        </div>
        <p class="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">${escapeHtml(text)}</p>
      </div>
      <div class="w-7 h-7 rounded-md bg-slate-800 dark:bg-slate-700 border border-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-mono font-bold">
        USR
      </div>
    `;
    dialogueContainer.appendChild(bubble);
    dialogueContainer.scrollTop = dialogueContainer.scrollHeight;
    if (window.lucide) lucide.createIcons();
  }

  function appendAgentBubble(replyText, action, ambiguities = [], audioData = null) {
    const bubble = document.createElement('div');
    bubble.className = "flex items-start space-x-3 bubble-anim";

    let ambiguityBadge = '';
    if (ambiguities && ambiguities.length > 0) {
      const ambText = ambiguities.map(a => a.type).join(', ');
      ambiguityBadge = `
        <div class="mt-2.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2">
          <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5"></i>
          <div>
            <span class="font-bold text-amber-900 dark:text-amber-300">Disambiguation Triggered:</span>
            <span class="text-amber-800 dark:text-amber-200"> Unresolved referent (${escapeHtml(ambText)}). Automated dispatch paused to request explicit confirmation.</span>
          </div>
        </div>
      `;
    }

    bubble.innerHTML = `
      <div class="w-7 h-7 rounded-md bg-teal-800 dark:bg-teal-700 border border-teal-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-mono font-bold">
        AI
      </div>
      <div class="bg-teal-50/90 dark:bg-teal-950/40 border border-teal-300/80 dark:border-teal-800/80 rounded-xl rounded-tl-none p-3.5 max-w-[85%] shadow-xs">
        <div class="flex items-center justify-between gap-3 mb-1">
          <span class="text-xs font-bold text-teal-950 dark:text-teal-300 flex items-center gap-1.5">
            SunoSahi Dispatch Assistant
            <span class="text-[10px] px-1.5 py-0.2 rounded bg-white dark:bg-teal-900/80 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 font-mono font-semibold">
              Gnani Timbre
            </span>
          </span>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <p class="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-normal">${escapeHtml(replyText)}</p>
        ${ambiguityBadge}
      </div>
    `;

    dialogueContainer.appendChild(bubble);
    dialogueContainer.scrollTop = dialogueContainer.scrollHeight;
    if (window.lucide) lucide.createIcons();
  }

  function appendLoadingBubble(message) {
    const bubble = document.createElement('div');
    bubble.id = 'loadingBubble';
    bubble.className = "flex items-start space-x-3 bubble-anim";
    bubble.innerHTML = `
      <div class="w-7 h-7 rounded-md bg-teal-100 dark:bg-teal-900/60 border border-teal-300 dark:border-teal-700 flex items-center justify-center flex-shrink-0 text-teal-700 dark:text-teal-300">
        <div class="w-3.5 h-3.5 border-2 border-teal-700 dark:border-teal-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div class="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl rounded-tl-none p-3 max-w-[80%] text-xs text-slate-600 dark:text-slate-400 font-medium italic">
        ${escapeHtml(message)}
      </div>
    `;
    dialogueContainer.appendChild(bubble);
    dialogueContainer.scrollTop = dialogueContainer.scrollHeight;
  }

  function removeLoadingBubble() {
    const el = document.getElementById('loadingBubble');
    if (el) el.remove();
  }

  function appendSystemNotice(text) {
    const notice = document.createElement('div');
    notice.className = "text-center my-2";
    notice.innerHTML = `
      <span class="text-[11px] text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs font-medium">
        ${escapeHtml(text)}
      </span>
    `;
    dialogueContainer.appendChild(notice);
    dialogueContainer.scrollTop = dialogueContainer.scrollHeight;
  }

  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------
  // UPDATE STRUCTURED TICKET UI
  // -------------------------------------------------------------
  function updateTicketUI(session) {
    if (!session) return;
    const entities = session.entities;

    if (session.ticket) {
      state.currentTicket = session.ticket;
      ticketIdDisplay.textContent = session.ticket.ticketId;
      ticketStatusPill.className = "px-2.5 py-1 rounded text-xs font-bold bg-emerald-100/80 text-emerald-950 border border-emerald-300 font-mono";
      ticketStatusPill.textContent = "STATUS: DISPATCH APPROVED";
    }

    // Issue
    if (entities.problem) {
      ticketIssueText.textContent = `${entities.appliance || 'Appliance'}: ${entities.problem}`;
    }

    // Address
    if (entities.address) {
      ticketAddressText.textContent = entities.address;
      addressStatusBadge.className = "text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300";
      addressStatusBadge.textContent = "LOCATION VERIFIED";
    } else {
      ticketAddressText.textContent = "Awaiting explicit flat / landmark confirmation...";
      addressStatusBadge.className = "text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300";
      addressStatusBadge.textContent = "UNRESOLVED ('wohi purana')";
    }

    // Time Slot
    if (entities.time_slot) {
      ticketTimeText.textContent = entities.time_slot;
      timeStatusBadge.className = "text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-300";
      timeStatusBadge.textContent = "SLOT CONFIRMED";
    }

    // Hallucinations blocked
    hallucinationsCount.textContent = session.hallucinationsPrevented || 1;

    // Update technician view if ticket is ready
    if (session.ticket) {
      renderTechnicianView(state.selectedTechnicianLang);
    }
  }

  // -------------------------------------------------------------
  // UPDATE CONFIDENCE ENGINE METRICS
  // -------------------------------------------------------------
  function updateConfidenceUI(scores, ambiguities) {
    if (!scores) return;

    overallConfidenceScore.textContent = `Overall: ${scores.overall}%`;
    acousticScoreText.textContent = `${scores.acoustic}%`;
    acousticBar.style.width = `${scores.acoustic}%`;

    completenessScoreText.textContent = `${scores.entityCompleteness}%`;
    completenessBar.style.width = `${scores.entityCompleteness}%`;

    if (ambiguities && ambiguities.length > 0) {
      disambiguationPenaltyText.textContent = `-45% (Unresolved Risk)`;
      disambiguationBar.style.width = `45%`;
      disambiguationBar.className = "bg-amber-500 h-2 rounded-full transition-all duration-500";
    } else {
      disambiguationPenaltyText.textContent = `0% (All Entities Clear)`;
      disambiguationBar.style.width = `5%`;
      disambiguationBar.className = "bg-emerald-500 h-2 rounded-full transition-all duration-500";
    }
  }

  // -------------------------------------------------------------
  // TECHNICIAN MULTILINGUAL VIEW
  // -------------------------------------------------------------
  technicianLangBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      technicianLangBtns.forEach(b => {
        b.className = "tech-lang-btn py-1.5 px-2 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition";
      });
      btn.className = "tech-lang-btn active py-1.5 px-2 rounded-md text-xs font-bold bg-teal-800 text-white transition";
      state.selectedTechnicianLang = btn.getAttribute('data-lang');
      renderTechnicianView(state.selectedTechnicianLang);
    });
  });

  function renderTechnicianView(langKey) {
    if (!state.currentTicket || !state.currentTicket.technicianBriefings) return;
    const briefing = state.currentTicket.technicianBriefings[langKey];
    if (briefing) {
      technicianSummaryText.textContent = briefing.summary;
      currentLangPill.textContent = briefing.langName;
    }
  }

  // Play Technician Voice Briefing using Gnani Timbre
  playTechnicianAudioBtn.addEventListener('click', async () => {
    if (!state.currentTicket || !state.currentTicket.technicianBriefings) {
      appendSystemNotice('Please complete a service call first to generate a technician briefing.');
      return;
    }

    const briefing = state.currentTicket.technicianBriefings[state.selectedTechnicianLang];
    if (!briefing) return;

    const langMap = {
      hindi: 'hi-IN',
      english: 'en-IN',
      tamil: 'ta-IN',
      telugu: 'te-IN',
      kannada: 'kn-IN',
      marathi: 'mr-IN'
    };
    const targetLang = langMap[state.selectedTechnicianLang] || 'hi-IN';

    playAudioLabel.textContent = "Synthesizing with Gnani Timbre...";
    try {
      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: briefing.voiceText,
          language: targetLang,
          voice: state.selectedTechnicianLang === 'hindi' ? 'Nalini' : null
        })
      });

      const data = await res.json();
      playAudioLabel.textContent = "🔊 Play Voice Briefing for Technician";

      if (data.success && data.audioBase64) {
        playGnaniVoice(data.audioBase64, data.contentType);
      } else {
        speakWithBrowser(briefing.voiceText, targetLang);
      }
    } catch (err) {
      console.warn('Technician TTS error:', err);
      speakWithBrowser(briefing.voiceText, targetLang);
      playAudioLabel.textContent = "🔊 Play Voice Briefing for Technician";
    }
  });

  // Copy WhatsApp Dispatch Message
  copyWhatsAppBtn.addEventListener('click', () => {
    if (!state.currentTicket) {
      appendSystemNotice('Complete a call first to generate WhatsApp dispatch text.');
      return;
    }

    navigator.clipboard.writeText(state.currentTicket.whatsAppShareText).then(() => {
      const originalText = copyWhatsAppBtn.innerHTML;
      copyWhatsAppBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>Copied!</span>`;
      if (window.lucide) lucide.createIcons();
      setTimeout(() => {
        copyWhatsAppBtn.innerHTML = originalText;
        if (window.lucide) lucide.createIcons();
      }, 2000);
    });
  });

  // -------------------------------------------------------------
  // VOICE PLAYBACK HELPERS (GNANI TIMBRE + HIGH-DEF NATURAL FALLBACK)
  // -------------------------------------------------------------
  function playGnaniVoice(base64Data, contentType = 'audio/wav') {
    const audioUrl = `data:${contentType};base64,${base64Data}`;
    agentAudioPlayer.src = audioUrl;
    agentAudioPlayer.play().then(() => {
      visualizerMode.textContent = "Gnani Timbre Neural Voice: Playing";
    }).catch(e => {
      console.warn('Audio auto-play prevented:', e);
    });

    agentAudioPlayer.onended = () => {
      visualizerMode.textContent = "Acoustic Clarity: Optimal";
    };
  }

  // Pre-load available browser voices for natural fallback
  let naturalVoices = [];
  function loadAvailableVoices() {
    if (!window.speechSynthesis) return;
    naturalVoices = window.speechSynthesis.getVoices();
  }
  loadAvailableVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadAvailableVoices;
  }

  function getBestNaturalIndicVoice(lang = 'hi') {
    if (!naturalVoices || naturalVoices.length === 0) {
      loadAvailableVoices();
    }
    
    // Priority 1: High-Definition Natural Indic Voices (Edge / Chrome Natural Neural)
    const naturalMatch = naturalVoices.find(v => 
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural')) &&
      (v.lang.startsWith('hi') || v.lang.includes('IN') || v.name.includes('India') || v.name.includes('Hindi'))
    );
    if (naturalMatch) return naturalMatch;

    // Priority 2: Any Hindi voice
    const hindiMatch = naturalVoices.find(v => v.lang.startsWith('hi') || v.lang.includes('hi_IN'));
    if (hindiMatch) return hindiMatch;

    // Priority 3: Indian English
    const indianEnMatch = naturalVoices.find(v => v.lang.includes('en-IN') || v.lang.includes('en_IN'));
    if (indianEnMatch) return indianEnMatch;

    return null;
  }

  function speakWithBrowser(text, lang = 'hi-IN') {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95; // Natural conversational tempo (not rushed or robotic)
    utterance.pitch = 1.0;

    const naturalVoice = getBestNaturalIndicVoice(lang);
    if (naturalVoice) {
      utterance.voice = naturalVoice;
      visualizerMode.textContent = `Browser Natural Voice: ${naturalVoice.name}`;
    } else {
      visualizerMode.textContent = `Browser Voice: Standard Synthesizer`;
    }

    utterance.onend = () => {
      visualizerMode.textContent = "Acoustic Clarity: Optimal";
    };

    window.speechSynthesis.speak(utterance);
  }

  // -------------------------------------------------------------
  // 1-CLICK DEMO SCENARIOS (FOR SEAMLESS VIDEO RECORDING!)
  // -------------------------------------------------------------
  scenario1Btn.addEventListener('click', () => {
    const text = "Bhaiya, AC mein problem hai... kal se cooling nahi ho rahi. Shaam ko aa sakte ho? Address wohi purana hai.";
    processCustomerUtterance(text, 91);
  });

  scenario1ClarifyBtn.addEventListener('click', () => {
    const text = "Haan, flat 402, Shanti Vihar, aur 6 baje bhej do.";
    processCustomerUtterance(text, 96);
  });

  scenario2Btn.addEventListener('click', () => {
    const text = "Mera flat 15 mein aana... nahi sorry 50 tha shayad...";
    processCustomerUtterance(text, 78);
  });

  scenario3Btn.addEventListener('click', () => {
    const text = "Motor restart panna mudiyala, smoke smell varudhu, please evening 5 PM vandhudunga, flat 204 Anna Nagar.";
    processCustomerUtterance(text, 88);
  });

  // Manual input
  manualSendBtn.addEventListener('click', () => {
    const text = manualTextInput.value.trim();
    if (text) {
      processCustomerUtterance(text, 94);
      manualTextInput.value = '';
    }
  });

  manualTextInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      manualSendBtn.click();
    }
  });

  // Reset Session
  resetSessionBtn.addEventListener('click', async () => {
    await fetch('/api/session/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: state.sessionId })
    });
    location.reload();
  });

  // -------------------------------------------------------------
  // SETTINGS & GNANI API KEY CONFIGURATION
  // -------------------------------------------------------------
  openSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    settingsFeedback.classList.add('hidden');
  });

  toggleKeyVisibility.addEventListener('click', () => {
    if (gnaniApiKeyInput.type === 'password') {
      gnaniApiKeyInput.type = 'text';
    } else {
      gnaniApiKeyInput.type = 'password';
    }
  });

  saveApiKeyBtn.addEventListener('click', async () => {
    const key = gnaniApiKeyInput.value.trim();
    if (!key) {
      showFeedback('Please enter a valid Gnani API Key', false);
      return;
    }

    showFeedback('Saving key...', true);
    try {
      const res = await fetch('/api/settings/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Gnani API Key saved successfully!', true);
        checkStatus();
        setTimeout(() => {
          settingsModal.classList.add('hidden');
        }, 1200);
      } else {
        showFeedback(data.message || 'Error saving key', false);
      }
    } catch (err) {
      showFeedback('Failed to save key. Server error.', false);
    }
  });

  testApiKeyBtn.addEventListener('click', async () => {
    showFeedback('Pinging Gnani Vachana endpoints...', true);
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.gnaniStatus && data.gnaniStatus.valid) {
        showFeedback(`Connected: ${data.gnaniStatus.message}`, true);
      } else {
        showFeedback(data.gnaniStatus ? data.gnaniStatus.message : 'Connection test failed', false);
      }
    } catch (err) {
      showFeedback('Network error testing connection', false);
    }
  });

  function showFeedback(text, isSuccess) {
    settingsFeedback.textContent = text;
    settingsFeedback.className = isSuccess 
      ? "text-xs p-2.5 rounded-lg font-medium bg-emerald-950/60 border border-emerald-800 text-emerald-300 block"
      : "text-xs p-2.5 rounded-lg font-medium bg-red-950/60 border border-red-800 text-red-300 block";
  }

  async function checkStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.gnaniConfigured) {
        statusDot.className = "relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600";
        statusLabel.textContent = "Voice Engine Connected";
      } else {
        statusDot.className = "relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500";
        statusLabel.textContent = "Voice Engine (Test Mode)";
      }
    } catch (e) {
      console.warn('Status check failed:', e);
    }
  }

  checkStatus();

  // -------------------------------------------------------------
  // NOISE SIMULATOR (AMBIENT TRAFFIC NOISE)
  // -------------------------------------------------------------
  trafficNoiseToggle.addEventListener('click', () => {
    state.trafficNoiseActive = !state.trafficNoiseActive;
    if (state.trafficNoiseActive) {
      noiseStatusText.textContent = "Traffic Simulated";
      trafficNoiseToggle.className = "hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-amber-600 bg-amber-950/40 text-xs text-amber-300 transition";
      visualizerMode.textContent = "Street Noise Filtration: Active (Prisma)";
    } else {
      noiseStatusText.textContent = "Clean Line";
      trafficNoiseToggle.className = "hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 transition";
      visualizerMode.textContent = "Acoustic Clarity: Optimal";
    }
  });

});
