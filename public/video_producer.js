/**
 * SunoSahi AI - Indian Cartoon Animated Explainer Video Producer
 * 
 * 100% Self-Explanatory Indian Cartoon Style Animation (No Voiceover)
 * - Scene 1: Sharmaji sweating at home in 44°C Indian heatwave, calling mistri on phone
 * - Scene 2: Ramesh Electrician busy on his Bajaj scooter in Indian traffic, missed schedule
 * - Scene 3: The Disaster & Flying Indian Rupees (₹500 & ₹2000 notes flying away, wasted petrol & time)
 * - Scene 4: SunoSahi AI - The Intelligent Bridge connecting Customer & Technician
 * - Scene 5: Happy Resolution - Ramesh arrives on time, Namaste 🙏, AC blows cold air, Rupee savings!
 * 
 * Built with HTML5 Canvas 1280x720 HD @ 30 FPS + Indian Web Audio Rhythmic Ambient Score
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  const canvas = document.getElementById('videoCanvas');
  const ctx = canvas.getContext('2d');
  const startProductionBtn = document.getElementById('startProductionBtn');
  const overlayStartBtn = document.getElementById('overlayStartBtn');
  const forceStopBtn = document.getElementById('forceStopBtn');
  const startOverlay = document.getElementById('startOverlay');
  const recordingPill = document.getElementById('recordingPill');
  const sceneStatusText = document.getElementById('sceneStatusText');
  const videoDurationTimer = document.getElementById('videoDurationTimer');
  const downloadVideoBtn = document.getElementById('downloadVideoBtn');
  const btnLabel = document.getElementById('btnLabel');

  let mediaRecorder = null;
  let recordedChunks = [];
  let isProducing = false;
  let audioContext = null;
  let audioDestination = null;
  let rhythmTimer = null;
  let timerInterval = null;
  let elapsedSeconds = 0;

  // Preload Real Production Console Screenshots
  const imgDialogue = new Image();
  imgDialogue.src = 'assets/console_dialogue.jpg';

  const imgDark = new Image();
  imgDark.src = 'assets/console_dark.jpg';

  // Initial Standby Screen
  drawStandbyScreen();

  function drawStandbyScreen() {
    ctx.fillStyle = '#080E1A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const rad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 50, canvas.width / 2, canvas.height / 2, 500);
    rad.addColorStop(0, '#042F2E');
    rad.addColorStop(1, '#080E1A');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tech border
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 3;
    roundRect(ctx, 40, 40, canvas.width - 80, canvas.height - 80, 20);
    ctx.stroke();

    ctx.fillStyle = '#2DD4BF';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FULL DEMO: CARTOON STORY ➔ OUTRO ➔ REAL WEBSITE ➔ HACKATHON FINALE', canvas.width / 2, canvas.height / 2 - 60);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px Inter, sans-serif';
    ctx.fillText('SunoSahi AI — The Voice Agent for Bharat', canvas.width / 2, canvas.height / 2 - 15);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '17px Inter, sans-serif';
    ctx.fillText('Cartoon Indian Breakdown • Flying ₹ Rupees • Real Console Proof • 96% Approved Dispatch', canvas.width / 2, canvas.height / 2 + 30);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('Click Start to record the complete 60-second video with automatic download', canvas.width / 2, canvas.height / 2 + 75);
  }

  // Complete Storyboard: Cartoon Part with Outro -> Real Website Walkthrough -> Hackathon Outro (Total ~61s)
  const scenes = [
    {
      id: 1,
      duration: 7,
      title: 'Scene 1: Sharmaji Sweating in 44°C Heatwave',
      status: 'Scene 1/8: Delhi Summer Heatwave • Broken AC • Sweating Customer...',
      draw: drawScene1
    },
    {
      id: 2,
      duration: 7,
      title: 'Scene 2: Busy Electrician Ramesh on Scooter',
      status: 'Scene 2/8: Heavy Traffic • Ringing Phone • Missed Schedule Details...',
      draw: drawScene2
    },
    {
      id: 3,
      duration: 7,
      title: 'Scene 3: The Disaster & Flying Indian Rupees',
      status: 'Scene 3/8: Wrong Direction • Wasted Petrol • Flying ₹500 & ₹2000 Notes...',
      draw: drawScene3
    },
    {
      id: 4,
      duration: 7,
      title: 'Scene 4: SunoSahi AI — The Intelligent Bridge',
      status: 'Scene 4/8: The Bridge: Assured Address, Confirmed Timing & Parts...',
      draw: drawScene4
    },
    {
      id: 5,
      duration: 6,
      title: 'Scene 5: Cartoon Outro • Resolution & Transition to Reality',
      status: 'Scene 5/8: Cool Air Restored • Savings Unlocked • Entering Real App...',
      draw: drawScene5
    },
    {
      id: 6,
      duration: 10,
      title: 'Scene 6: Real Web Console — Live Disambiguation Gate',
      status: 'Scene 6/8: Live Console Proof: Pausing Dispatch On Vague Address with Gnani AI...',
      draw: drawScene6RealConsole
    },
    {
      id: 7,
      duration: 9,
      title: 'Scene 7: Real Engineering Console — Approved Dispatch & ROI',
      status: 'Scene 7/8: Real App Proof: 96% Confidence Dispatch & ₹650 Saved per Call...',
      draw: drawScene7RealTicket
    },
    {
      id: 8,
      duration: 8,
      title: 'Scene 8: Winning Hackathon Outro & Gnani AI Credits',
      status: 'Scene 8/8: Winning Outro: Gnani Prisma STT & Timbre TTS Native Architecture...',
      draw: drawScene8Outro
    }
  ];

  // -------------------------------------------------------------
  // START PRODUCTION & RECORDING
  // -------------------------------------------------------------
  async function startProduction() {
    if (isProducing) return;
    isProducing = true;

    startOverlay.classList.add('hidden');
    recordingPill.className = "h-2.5 w-2.5 rounded-full bg-red-500 animate-ping";
    btnLabel.textContent = "Recording Video...";
    downloadVideoBtn.classList.add('hidden');
    if (forceStopBtn) forceStopBtn.classList.remove('hidden');

    initIndianRhythmAudio();

    const canvasStream = canvas.captureStream(30);
    const combinedTracks = [
      ...canvasStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks()
    ];
    const combinedStream = new MediaStream(combinedTracks);

    recordedChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

    mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = finishProduction;
    mediaRecorder.start();

    elapsedSeconds = 0;
    timerInterval = setInterval(() => {
      elapsedSeconds++;
      const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
      const s = String(elapsedSeconds % 60).padStart(2, '0');
      videoDurationTimer.textContent = `${m}:${s}`;
    }, 1000);

    runSceneSequence(0);
  }

  function runSceneSequence(sceneIndex) {
    if (sceneIndex >= scenes.length) {
      stopProduction();
      return;
    }

    const scene = scenes[sceneIndex];
    sceneStatusText.textContent = scene.status;

    playChimeTone(sceneIndex);

    const startTime = Date.now();
    const durationMs = scene.duration * 1000;

    function renderFrame() {
      if (!isProducing) return;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      try {
        scene.draw(progress, elapsed * 0.001);
      } catch (err) {
        console.error("Frame render error in scene " + sceneIndex + ":", err);
      }

      if (elapsed < durationMs) {
        requestAnimationFrame(renderFrame);
      } else {
        runSceneSequence(sceneIndex + 1);
      }
    }

    renderFrame();
  }

  function stopProduction() {
    if (!isProducing && (!mediaRecorder || mediaRecorder.state === 'inactive')) return;
    isProducing = false;
    clearInterval(timerInterval);
    clearInterval(rhythmTimer);
    if (forceStopBtn) forceStopBtn.classList.add('hidden');
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  function finishProduction() {
    recordingPill.className = "h-2.5 w-2.5 rounded-full bg-emerald-500";
    sceneStatusText.textContent = "✓ Video generation complete! File downloaded.";
    btnLabel.textContent = "🎬 Re-Record Video";
    if (forceStopBtn) forceStopBtn.classList.add('hidden');

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoUrl = URL.createObjectURL(blob);

    downloadVideoBtn.href = videoUrl;
    downloadVideoBtn.download = "SunoSahi_Full_Demo_With_Website_Outro.webm";
    downloadVideoBtn.classList.remove('hidden');
    downloadVideoBtn.className = "flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 animate-bounce";

    // Auto trigger download
    try {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = "SunoSahi_Full_Demo_With_Website_Outro.webm";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 1000);
    } catch (e) {
      console.warn("Auto download note:", e);
    }

    drawCompletionScreen();
  }

  function drawCompletionScreen() {
    ctx.fillStyle = '#080E1A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 4;
    roundRect(ctx, 40, 40, canvas.width - 80, canvas.height - 80, 20);
    ctx.stroke();

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓ Complete Demo Video Produced & Exported!', canvas.width / 2, canvas.height / 2 - 45);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText('File: SunoSahi_Full_Demo_With_Website_Outro.webm (61 Seconds)', canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#2DD4BF';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('Cartoon Story ➔ Outro Transition ➔ Real Web Console ➔ Hackathon Finale', canvas.width / 2, canvas.height / 2 + 40);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('If the download did not start automatically, click the green "Download Video File" button in the top bar.', canvas.width / 2, canvas.height / 2 + 80);
  }

  // -------------------------------------------------------------
  // INDIAN RHYTHMIC SOUNDTRACK ENGINE (UPBEAT TABLA-INSPIRED BEAT)
  // -------------------------------------------------------------
  function initIndianRhythmAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
      audioDestination = audioContext.createMediaStreamDestination();

      // Warm Tanpura Drone (D & A notes: 146.8Hz, 220Hz)
      const droneFreqs = [146.83, 220.00];
      droneFreqs.forEach(freq => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);

        // Lowpass filter for warm wooden acoustic feel
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, audioContext.currentTime);

        gain.gain.setValueAtTime(0.015, audioContext.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioDestination);
        gain.connect(audioContext.destination);
        osc.start();
      });

      // Rhythmic pulses (Gentle percussion groove)
      let beat = 0;
      rhythmTimer = setInterval(() => {
        if (!isProducing || !audioContext) return;
        playPercussionHit(beat % 4 === 0 ? 120 : 200, beat % 4 === 0 ? 0.04 : 0.02);
        beat++;
      }, 350); // ~85 BPM comfortable bounce

    } catch (e) {
      console.warn('Audio init error:', e);
    }
  }

  function playPercussionHit(freq, volume) {
    try {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.12);

      gain.gain.setValueAtTime(volume, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioDestination);
      gain.connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + 0.12);
    } catch (e) {}
  }

  function playChimeTone(sceneIndex) {
    if (!audioContext || !audioDestination) return;
    try {
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      const freq = notes[sceneIndex % notes.length];
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioContext.currentTime);
      gain.gain.setValueAtTime(0.06, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioDestination);
      gain.connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + 0.6);
    } catch (e) {}
  }

  // -------------------------------------------------------------
  // CARTOON ASSETS & SCENE DRAWINGS (1280x720)
  // -------------------------------------------------------------

  // === SCENE 1: Sharmaji Sweating in 44°C Heatwave ===
  function drawScene1(p, t) {
    // Room background: warm yellow walls
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wooden flooring
    ctx.fillStyle = '#D97706';
    ctx.fillRect(0, 560, canvas.width, 160);
    ctx.fillStyle = '#B45309';
    for (let x = 0; x < canvas.width; x += 120) {
      ctx.fillRect(x, 560, 2, 160);
    }

    // Top banner
    drawTopBanner('☀️ 44°C SUMMER HEATWAVE IN DELHI • BROKEN AC • SHARMAJI CALLS FOR HELP', '#EF4444');

    // Room Window with Blazing Indian Sun
    drawWindowWithSun(120, 130, t);

    // Wall Clock Frantically Ticking
    drawCartoonClock(380, 150, t);

    // Broken AC Unit on Wall (Red heat waves leaking)
    drawBrokenAC(750, 110, t);

    // Cartoon Sharmaji on Sofa sweating & calling
    drawSharmajiCustomer(640, 310, t);

    // Call Soundwaves & Speech Bubble
    drawSpeechBubble(ctx, 880, 260, 290, 100, [
      '🗣️ "Emergency! Our AC unit died!',
      'Inside heat is 44°C!',
      'Can you come this evening?!"'
    ]);

    // Bottom English Narrative Subtitle Bar
    drawEnglishSubtitleBar(
      ctx,
      "Delhi Summer Heatwave: The cooling unit broke down, leaving the resident in 44°C heat.",
      "Desperate for relief, he calls his local technician for an emergency repair."
    );
  }

  // === SCENE 2: Busy Mistri on Scooter in Traffic ===
  function drawScene2(p, t) {
    // Sky
    ctx.fillStyle = '#BAE6FD';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // City Buildings silhouette in background
    ctx.fillStyle = '#93C5FD';
    ctx.fillRect(0, 220, canvas.width, 240);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#60A5FA' : '#3B82F6';
      ctx.fillRect(i * 130, 160 + (i % 3) * 30, 110, 300);
      // Shop signboards
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(i * 130 + 15, 230 + (i % 3) * 30, 80, 25);
    }

    // Road
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 460, canvas.width, 260);

    // Moving Road Dashes
    ctx.fillStyle = '#FACC15';
    const roadOffset = (t * 400) % 160;
    for (let x = -160; x < canvas.width + 160; x += 160) {
      ctx.fillRect(x - roadOffset, 580, 90, 16);
    }

    drawTopBanner('🛵 RAMESH THE ELECTRICIAN IS IN HEAVY TRAFFIC • MISSED TIMING & DETAILS!', '#F59E0B');

    // Traffic Horns (Animated PEEN PEEN!)
    drawHonkBubble(140, 260, '📢 PEEN PEEN!', t);
    drawHonkBubble(340, 200, '📯 POM POM!', t + 1);

    // Cartoon Ramesh Riding Scooter
    const scooterBounce = Math.sin(t * 15) * 4;
    drawTechnicianOnScooter(500, 340 + scooterBounce, t);

    // Ringing Phone on Handlebar
    drawRingingPhone(780, 360 + scooterBounce, t);

    // Ramesh confused speech bubble
    drawSpeechBubble(ctx, 750, 180, 310, 95, [
      '🛵 "Hello?! I can barely hear you!',
      'City traffic is too loud!',
      'What is the exact time and location?!"'
    ]);

    // Bottom English Narrative Subtitle Bar
    drawEnglishSubtitleBar(
      ctx,
      "The technician is navigating heavy city traffic on his scooter with horns blaring.",
      "Street noise drowns out the call—the exact location coordinates and time slot are lost."
    );
  }

  // === SCENE 3: The Disaster & Flying Indian Rupees ===
  function drawScene3(p, t) {
    // Red alert gradient background
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#7F1D1D');
    bg.addColorStop(1, '#1E293B');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTopBanner('💸 THE DISASTER OF GUESSWORK: WRONG HOUSE • WRONG TIME • WASTED RUPEES!', '#EF4444');

    // Left Panel: Frustrated Sharmaji Waiting at Home
    ctx.fillStyle = '#111827';
    roundRect(ctx, 60, 110, 360, 560, 16);
    ctx.fill();
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#F87171';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Frustrated Customer Waiting', 240, 150);
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#FECACA';
    ctx.fillText('⏳ 2 Hours Passed... Still Sweating!', 240, 180);

    // Angry Sharmaji drawing
    drawFrustratedSharmaji(240, 340, t);

    // Right Panel: Lost Ramesh 12 KM Away in Wrong Colony
    ctx.fillStyle = '#111827';
    roundRect(ctx, 860, 110, 360, 560, 16);
    ctx.fill();
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#F87171';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Technician Lost in Wrong Area', 1040, 150);
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#FECACA';
    ctx.fillText('❌ Unverified Location = Wrong Sector!', 1040, 180);

    // Lost Ramesh drawing
    drawLostRamesh(1040, 340, t);

    // Center Display: FLYING INDIAN RUPEES (₹500 & ₹2000 NOTES)
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, 450, 130, 380, 500, 20);
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WASTED MONEY & FUEL', 640, 175);

    // Animated Flying Rupees flapping out of open wallet
    drawFlyingRupeesCluster(640, 360, t);

    // Quantitative Wasted Money Counter
    const wastedAmount = Math.min(1500, Math.floor(p * 1500));
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 44px Inter, sans-serif';
    ctx.fillText(`- ₹${wastedAmount}`, 640, 540);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '15px Inter, sans-serif';
    ctx.fillText('Petrol Burned + 50 Mins Wasted', 640, 575);
    ctx.fillText('Zero Work Done!', 640, 600);

    // Bottom English Narrative Subtitle Bar
    drawEnglishSubtitleBar(
      ctx,
      "The disaster of guesswork! The technician is lost 12 km away at an outdated address.",
      "Hours wasted, petrol burned, and ₹1,500+ literally flying out of the pocket with zero work done."
    );
  }

  // === SCENE 4: SunoSahi AI — The Intelligent Bridge ===
  function drawScene4(p, t) {
    // Deep sovereign navy background
    ctx.fillStyle = '#06141D';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTopBanner('🌉 THE SOLUTION: SUNOSAHI AI — THE BRIDGE FOR BHARAT (POWERED BY GNANI AI)', '#10B981');

    // Left Anchor: Customer
    ctx.fillStyle = '#0F2634';
    roundRect(ctx, 50, 120, 240, 520, 16);
    ctx.fill();
    ctx.strokeStyle = '#0284C7';
    ctx.stroke();
    drawMiniCustomer(170, 230, t);
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Caller in Distress', 170, 340);
    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Speaks Conversational Speech', 170, 370);
    ctx.fillText('"Cooling died suddenly...', 170, 400);
    ctx.fillText('Need urgent visit today!"', 170, 425);

    // Right Anchor: Technician
    ctx.fillStyle = '#0F2634';
    roundRect(ctx, 990, 120, 240, 520, 16);
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.stroke();
    drawMiniTechnician(1110, 230, t);
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Technician', 1110, 340);
    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Gets Verified Audio Brief', 1110, 370);
    ctx.fillText('In Preferred Language', 1110, 400);
    ctx.fillText('Direct to Mobile / WhatsApp', 1110, 425);

    // Center Golden Bridge
    drawGlowingDigitalBridge(300, 1000, 340, t);

    // SunoSahi AI Hub in Center
    ctx.fillStyle = '#042F2E';
    roundRect(ctx, 420, 140, 440, 470, 20);
    ctx.fill();
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // AI Badge
    ctx.fillStyle = '#14B8A6';
    roundRect(ctx, 520, 160, 240, 42, 10);
    ctx.fill();
    ctx.fillStyle = '#042F2E';
    ctx.font = 'bold 17px Inter, sans-serif';
    ctx.fillText('⚡ SUNOSAHI AI CORE', 640, 187);

    // 3 Assured Bridge Pillars
    const pillars = [
      {
        icon: '📍',
        title: 'ASSURED ADDRESS',
        val: 'Flat 402, Shanti Hts (Confirmed)',
        sub: 'Asked clarification, zero guesswork'
      },
      {
        icon: '⏰',
        title: 'VERIFIED TIMING',
        val: 'Today @ 6:00 PM Sharp',
        sub: 'Confirmed discrete time window'
      },
      {
        icon: '🔧',
        title: 'CORRECT SPARE PARTS',
        val: '1.5 Ton AC Capacitor (45uF)',
        sub: 'Extracted exact cooling symptoms'
      }
    ];

    pillars.forEach((pil, idx) => {
      const py = 225 + idx * 108;
      ctx.fillStyle = '#0F3741';
      roundRect(ctx, 445, py, 390, 92, 12);
      ctx.fill();
      ctx.strokeStyle = '#0D9488';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#2DD4BF';
      ctx.font = '24px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(pil.icon, 465, py + 42);

      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(pil.title, 505, py + 33);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(pil.val, 505, py + 58);

      ctx.fillStyle = '#99F6E4';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(pil.sub, 505, py + 79);
    });

    // Gnani tech footer badge
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('POWERED BY GNANI PRISMA STT v3.0 & TIMBRE TTS v2.5', 640, 585);

    // Bottom English Narrative Subtitle Bar
    drawEnglishSubtitleBar(
      ctx,
      "SunoSahi AI (Powered by Gnani AI) acts as the intelligent bridge between both parties.",
      "It clarifies ambiguity, locks verified location & 6 PM timing, and sends an instant audio dispatch."
    );
  }

  // === SCENE 5: Happy Resolution & Rupee Savings ===
  function drawScene5(p, t) {
    // Cheerful mint-green background
    ctx.fillStyle = '#ECFDF5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTopBanner('🎉 SUCCESS! RAMESH ARRIVES ON TIME • COOL AIR RESTORED • BIG SAVINGS!', '#059669');

    // Living Room with Working AC Blowing Cool Blue Air!
    drawWorkingAC(640, 120, t);

    // Left Character: Smiling Sharmaji enjoying cool air, Thumbs Up!
    drawHappySharmaji(340, 360, t);

    // Right Character: Ramesh Electrician greeting with Namaste 🙏
    drawNamasteRamesh(940, 360, t);

    // Center Rupee Piggy Bank & Savings Card
    ctx.fillStyle = '#064E3B';
    roundRect(ctx, 470, 360, 340, 240, 18);
    ctx.fill();
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💰 SAVINGS UNLOCKED', 640, 400);

    // Piggy Bank Visual
    drawPiggyBank(640, 460, t);

    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText('+ ₹1,000 SAVED', 640, 540);

    ctx.fillStyle = '#A7F3D0';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('100% First-Time Dispatch Success!', 640, 575);

    // Bottom English Narrative Subtitle Bar
    drawEnglishSubtitleBar(
      ctx,
      "Technician arrives on time with exact parts! Cool air is restored immediately.",
      "Saving ₹1,000+ per visit with 100% verified first-time dispatch. Built for #GnaniAI!"
    );
  }

  // === SCENE 6: Real Web Console — Live Disambiguation Gate ===
  function drawScene6RealConsole(p, t) {
    ctx.fillStyle = '#0B1120';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTopBanner('💻 FROM CARTOON TO REALITY: INSIDE SUNOSAHI LIVE OPERATING CONSOLE', '#0284C7');

    // Draw Browser Window Frame
    const frameX = 80;
    const frameY = 90;
    const frameW = 1120;
    const frameH = 540;

    // Window Header Bar
    ctx.fillStyle = '#1E293B';
    roundRect(ctx, frameX, frameY, frameW, 36, { tl: 12, tr: 12, br: 0, bl: 0 });
    ctx.fill();

    // Window Control Buttons
    ctx.fillStyle = '#EF4444';
    ctx.beginPath(); ctx.arc(frameX + 22, frameY + 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath(); ctx.arc(frameX + 42, frameY + 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10B981';
    ctx.beginPath(); ctx.arc(frameX + 62, frameY + 18, 6, 0, Math.PI * 2); ctx.fill();

    // URL Bar
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, frameX + 90, frameY + 6, 680, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🔒 http://localhost:3000 — SunoSahi Dispatch Gateway (Live App)', frameX + 105, frameY + 22);

    // Live Screenshot of Console Dialogue
    if (imgDialogue.complete && imgDialogue.naturalWidth > 0) {
      ctx.drawImage(imgDialogue, frameX, frameY + 36, frameW, frameH - 36);
    } else {
      // Fallback placeholder if image still loading
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(frameX, frameY + 36, frameW, frameH - 36);
    }

    // Animated Pulsing Highlights on the Screenshot

    // Highlight 1: The Ambiguous Caller Prompt (Bhaiya, address wohi purana hai)
    const pulse1 = Math.sin(t * 8) * 3;
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    roundRect(ctx, frameX + 75, frameY + 180, 520, 85, 8);
    ctx.stroke();

    drawCalloutTag(
      ctx,
      frameX + 600,
      frameY + 220,
      '🎙️ GNANI PRISMA STT v3.0: Captured Indic Code-Mixed Speech',
      '#F59E0B'
    );

    // Highlight 2: Disambiguation Triggered Alert
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3.5;
    roundRect(ctx, frameX + 75, frameY + 355, 520, 75, 8);
    ctx.stroke();

    drawCalloutTag(
      ctx,
      frameX + 600,
      frameY + 390,
      '🛡️ CONFIDENCE SAFETY GATE: Pauses Dispatch On Ambiguity!',
      '#EF4444'
    );

    // Bottom Subtitle
    drawEnglishSubtitleBar(
      ctx,
      "Live Production App: SunoSahi transcribes Indian code-mixed speech using Gnani Prisma STT.",
      "Instead of guessing 'wohi purana address', it triggers a polite clarification using Gnani Timbre."
    );
  }

  // === SCENE 7: Real Web Console — Approved Dispatch & ROI ===
  function drawScene7RealTicket(p, t) {
    ctx.fillStyle = '#0B1120';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTopBanner('⚡ GNANI AI SPEECH ENGINE: ACOUSTIC CLARITY & APPROVED DISPATCH TICKET', '#10B981');

    // Draw Browser Window Frame
    const frameX = 80;
    const frameY = 90;
    const frameW = 1120;
    const frameH = 540;

    // Window Header Bar
    ctx.fillStyle = '#1E293B';
    roundRect(ctx, frameX, frameY, frameW, 36, { tl: 12, tr: 12, br: 0, bl: 0 });
    ctx.fill();

    // Window Control Buttons
    ctx.fillStyle = '#EF4444';
    ctx.beginPath(); ctx.arc(frameX + 22, frameY + 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath(); ctx.arc(frameX + 42, frameY + 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10B981';
    ctx.beginPath(); ctx.arc(frameX + 62, frameY + 18, 6, 0, Math.PI * 2); ctx.fill();

    // URL Bar
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, frameX + 90, frameY + 6, 680, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🔒 http://localhost:3000 — Dark Mode Dispatch Console & Spectrum Analyzer', frameX + 105, frameY + 22);

    // Live Screenshot of Dark Console
    if (imgDark.complete && imgDark.naturalWidth > 0) {
      ctx.drawImage(imgDark, frameX, frameY + 36, frameW, frameH - 36);
    } else {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(frameX, frameY + 36, frameW, frameH - 36);
    }

    // Animated Highlights on the Dark Console

    // Highlight 1: Acoustic Spectrum Analyzer (Top Left)
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 3;
    roundRect(ctx, frameX + 30, frameY + 165, 590, 85, 8);
    ctx.stroke();

    drawCalloutTag(
      ctx,
      frameX + 640,
      frameY + 205,
      '📈 ACOUSTIC ANALYZER: SNR & Optimal Clarity Scoring',
      '#2DD4BF'
    );

    // Highlight 2: Approved Dispatch Ticket (Right Panel)
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3.5;
    roundRect(ctx, frameX + 650, frameY + 215, 430, 240, 10);
    ctx.stroke();

    drawCalloutTag(
      ctx,
      frameX + 280,
      frameY + 395,
      '🎫 96% CONFIDENCE: Location Verified & Slot Confirmed!',
      '#10B981'
    );

    // Bottom Subtitle
    drawEnglishSubtitleBar(
      ctx,
      "Instant Verification: Once the caller provides the missing details, confidence jumps to 96%.",
      "The ticket is approved, preventing misdirected trips and saving ₹650+ on every single field call!"
    );
  }

  // === SCENE 8: Winning Hackathon Outro & Gnani AI Credits ===
  function drawScene8Outro(p, t) {
    // Deep royal navy with subtle radial glow
    const bg = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 40, canvas.width / 2, canvas.height / 2, 600);
    bg.addColorStop(0, '#042F2E');
    bg.addColorStop(1, '#060D1A');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTopBanner('🏆 THE WINNING ADVANTAGE • BUILT FOR #GREATINDIANAIINTERNSHIPCHALLENGE', '#0D9488');

    // Hero Title
    ctx.fillStyle = '#2DD4BF';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SOVEREIGN VOICE AI APPLICATION', canvas.width / 2, 115);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px Inter, sans-serif';
    ctx.fillText('SunoSahi AI — The Voice Agent for Bharat', canvas.width / 2, 165);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('Zero Guesswork • Verified Dispatch • Powered End-to-End by Gnani AI', canvas.width / 2, 205);

    // 3 Enterprise Advantage Cards
    const cards = [
      {
        tag: 'SPEECH-TO-TEXT',
        title: 'Gnani Prisma STT v3.0',
        api: 'api.vachana.ai/stt/v3',
        desc: 'Decodes Indic code-mixed speech, cuts through street traffic noise, and provides inverse text normalization.',
        color: '#14B8A6'
      },
      {
        tag: 'SAFETY GATE',
        title: 'Confidence DST Engine',
        api: 'Disambiguation Algorithm',
        desc: 'Mathematically halts dispatch on vague addresses ("wohi purana") to prevent wasted fuel and lost technicians.',
        color: '#F59E0B'
      },
      {
        tag: 'TEXT-TO-SPEECH',
        title: 'Gnani Timbre TTS v2.5',
        api: 'api.vachana.ai/api/v1/tts',
        desc: 'Synthesizes natural Nalini voice for conversational clarification and regional audio dispatch in Hindi, Tamil & Telugu.',
        color: '#10B981'
      }
    ];

    const boxY = 240;
    cards.forEach((c, idx) => {
      const cx = 100 + idx * 370;
      ctx.fillStyle = '#0F1E2E';
      roundRect(ctx, cx, boxY, 340, 290, 16);
      ctx.fill();
      ctx.strokeStyle = c.color + '88';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tag pill
      ctx.fillStyle = c.color;
      roundRect(ctx, cx + 24, boxY + 24, 110, 26, 6);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(c.tag, cx + 79, boxY + 41);

      // Title & API
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(c.title, cx + 24, boxY + 85);

      ctx.fillStyle = c.color;
      ctx.font = '11px monospace';
      ctx.fillText(c.api, cx + 24, boxY + 110);

      // Desc
      ctx.fillStyle = '#94A3B8';
      ctx.font = '14px Inter, sans-serif';
      wrapText(ctx, c.desc, cx + 24, boxY + 145, 290, 22);

      // Bottom verified badge
      ctx.fillStyle = '#042F2E';
      roundRect(ctx, cx + 20, boxY + 230, 300, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#2DD4BF';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('✓ 100% Native API Integration', cx + 45, boxY + 255);
    });

    // Official Hackathon Nomination Ribbon
    ctx.fillStyle = '#134E4A';
    roundRect(ctx, 100, 555, 1080, 50, 12);
    ctx.fill();
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌟 NOMINATED DEMO FOR GNANI AI GREAT INDIAN AI INTERNSHIP CHALLENGE', canvas.width / 2, 586);

    // Subtitle Bar
    drawEnglishSubtitleBar(
      ctx,
      "Full Sovereign AI Stack: Gnani Prisma STT + Timbre TTS + Confidence Disambiguation Engine.",
      "Zero Guesswork. 100% Verified Field Dispatch. Submitted before Nov 10, 2026 deadline!"
    );
  }

  function drawCalloutTag(c, x, y, text, color) {
    c.save();
    c.font = 'bold 12px Inter, sans-serif';
    const textW = c.measureText(text).width;
    c.fillStyle = '#0F172A';
    roundRect(c, x, y - 18, textW + 28, 32, 6);
    c.fill();
    c.strokeStyle = color;
    c.lineWidth = 1.5;
    c.stroke();

    c.fillStyle = color;
    c.textAlign = 'left';
    c.fillText(text, x + 14, y + 2);
    c.restore();
  }

  // -------------------------------------------------------------
  // REUSABLE CARTOON VECTOR ARTWORK HELPERS
  // -------------------------------------------------------------

  function drawEnglishSubtitleBar(c, line1, line2) {
    const barW = 1180;
    const barH = 56;
    const barX = (canvas.width - barW) / 2;
    const barY = canvas.height - barH - 12;

    c.save();
    c.fillStyle = 'rgba(15, 23, 42, 0.92)';
    roundRect(c, barX, barY, barW, barH, 12);
    c.fill();
    c.strokeStyle = '#2DD4BF';
    c.lineWidth = 1.5;
    c.stroke();

    c.fillStyle = '#F8FAFC';
    c.font = 'bold 15px Inter, sans-serif';
    c.textAlign = 'center';
    c.fillText(line1, canvas.width / 2, barY + 24);

    if (line2) {
      c.fillStyle = '#94A3B8';
      c.font = '13px Inter, sans-serif';
      c.fillText(line2, canvas.width / 2, barY + 45);
    }
    c.restore();
  }

  function drawTopBanner(text, bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, 65);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, 42);
  }

  function drawWindowWithSun(x, y, t) {
    // Window frame
    ctx.fillStyle = '#BAE6FD';
    roundRect(ctx, x, y, 180, 180, 12);
    ctx.fill();
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Blazing Sun
    const sunX = x + 90;
    const sunY = y + 90;
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
    ctx.fill();

    // Animated Sun Rays
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + t * 0.8;
      const r1 = 48;
      const r2 = 64;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * r1, sunY + Math.sin(angle) * r1);
      ctx.lineTo(sunX + Math.cos(angle) * r2, sunY + Math.sin(angle) * r2);
      ctx.stroke();
    }

    // Heat waves
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const waveY = y + 150 + i * 8;
      ctx.moveTo(x + 20, waveY);
      for (let w = 20; w < 160; w += 10) {
        ctx.lineTo(x + w, waveY + Math.sin(w * 0.1 + t * 4) * 4);
      }
      ctx.stroke();
    }
  }

  function drawCartoonClock(x, y, t) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B91C1C';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Hour hand & fast spinning minute hand
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 15, y);
    ctx.stroke();

    const minAngle = t * 12;
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(minAngle) * 30, y + Math.sin(minAngle) * 30);
    ctx.stroke();
  }

  function drawBrokenAC(x, y, t) {
    ctx.fillStyle = '#E2E8F0';
    roundRect(ctx, x, y, 320, 95, 10);
    ctx.fill();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // AC Grill
    ctx.fillStyle = '#64748B';
    for (let gx = x + 30; gx < x + 290; gx += 20) {
      ctx.fillRect(gx, y + 60, 10, 16);
    }

    // Red Tripped Light
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(x + 280, y + 30, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('TRIPPED / 0% COOLING', x + 130, y + 34);

    // Red heat waves pouring out
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const hx = x + 60 + i * 65;
      ctx.beginPath();
      ctx.moveTo(hx, y + 80);
      ctx.quadraticCurveTo(hx - 20, y + 120 + Math.sin(t * 8 + i) * 10, hx, y + 160);
      ctx.stroke();
    }
  }

  function drawSharmajiCustomer(x, y, t) {
    // Kurta Body (Bright Saffron Kurta)
    ctx.fillStyle = '#EA580C';
    roundRect(ctx, x - 55, y + 60, 110, 130, 16);
    ctx.fill();

    // White Pyjama legs
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(x - 45, y + 190, 35, 70);
    ctx.fillRect(x + 10, y + 190, 35, 70);

    // Head (Indian warm skin tone)
    ctx.fillStyle = '#E0AC69';
    ctx.beginPath();
    ctx.arc(x, y, 48, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.arc(x, y - 10, 48, Math.PI, Math.PI * 2);
    ctx.fill();

    // Big Indian Mustache
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.ellipse(x - 18, y + 20, 20, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 20, 20, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (Stressed / Wide)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - 20, y - 5, 12, 0, Math.PI * 2);
    ctx.arc(x + 20, y - 5, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x - 18, y - 5, 6, 0, Math.PI * 2);
    ctx.arc(x + 22, y - 5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Glasses
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x - 20, y - 5, 15, 0, Math.PI * 2);
    ctx.arc(x + 20, y - 5, 15, 0, Math.PI * 2);
    ctx.moveTo(x - 5, y - 5);
    ctx.lineTo(x + 5, y - 5);
    ctx.stroke();

    // Animated Flying Sweat Drops!
    ctx.fillStyle = '#38BDF8';
    for (let i = 0; i < 4; i++) {
      const dropOffset = (t * 60 + i * 20) % 50;
      ctx.beginPath();
      ctx.arc(x + 40 + i * 6, y - 25 + dropOffset, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hand waving newspaper or fan
    const fanAngle = Math.sin(t * 12) * 0.4;
    ctx.save();
    ctx.translate(x - 50, y + 80);
    ctx.rotate(fanAngle);
    ctx.fillStyle = '#F59E0B';
    roundRect(ctx, -10, -50, 45, 60, 6); // Hand fan
    ctx.fill();
    ctx.fillStyle = '#78350F';
    ctx.fillRect(8, 10, 8, 30); // Fan handle
    ctx.restore();

    // Other hand holding phone to ear
    ctx.fillStyle = '#1E293B';
    roundRect(ctx, x + 35, y - 10, 22, 40, 5);
    ctx.fill();
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(x + 38, y - 6, 16, 28);
  }

  function drawTechnicianOnScooter(x, y, t) {
    // Scooter Body (Classic Chetak Teal Scooter)
    ctx.fillStyle = '#0D9488';
    roundRect(ctx, x - 80, y + 40, 160, 40, 12);
    ctx.fill();

    // Scooter Front Cowl & Handlebar
    ctx.fillStyle = '#0F766E';
    roundRect(ctx, x + 40, y - 20, 30, 80, 8);
    ctx.fill();

    // Headlight
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(x + 75, y - 10, 14, 0, Math.PI * 2);
    ctx.fill();

    // Headlight beam
    ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
    ctx.beginPath();
    ctx.moveTo(x + 75, y - 10);
    ctx.lineTo(x + 280, y - 60);
    ctx.lineTo(x + 280, y + 80);
    ctx.closePath();
    ctx.fill();

    // Spinning Wheels
    drawScooterWheel(x - 50, y + 85, t);
    drawScooterWheel(x + 60, y + 85, t);

    // Exhaust Puffs
    ctx.fillStyle = 'rgba(203, 213, 225, 0.6)';
    const puffOffset = (t * 80) % 40;
    ctx.beginPath();
    ctx.arc(x - 100 - puffOffset, y + 70, 12, 0, Math.PI * 2);
    ctx.arc(x - 130 - puffOffset, y + 65, 18, 0, Math.PI * 2);
    ctx.fill();

    // Technician Ramesh Riding
    // Torso (Blue technician uniform with toolbelt)
    ctx.fillStyle = '#2563EB';
    roundRect(ctx, x - 30, y - 40, 60, 80, 12);
    ctx.fill();

    // Toolbelt
    ctx.fillStyle = '#78350F';
    ctx.fillRect(x - 30, y + 25, 60, 12);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(x - 10, y + 15, 6, 25); // Wrench

    // Head
    ctx.fillStyle = '#C68642';
    ctx.beginPath();
    ctx.arc(x, y - 70, 32, 0, Math.PI * 2);
    ctx.fill();

    // Yellow Safety Helmet
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    ctx.arc(x, y - 78, 36, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 36, y - 80, 72, 10);

    // Facial features (busy/shouting)
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(x + 10, y - 70, 5, 0, Math.PI * 2); // Eye
    ctx.fill();
    ctx.fillRect(x + 5, y - 62, 15, 6); // Mustache
    ctx.fillStyle = '#B91C1C';
    ctx.beginPath();
    ctx.arc(x + 12, y - 52, 6, 0, Math.PI); // Open mouth yelling
    ctx.fill();
  }

  function drawScooterWheel(wx, wy, t) {
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(wx, wy, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(wx, wy, 14, 0, Math.PI * 2);
    ctx.fill();

    // Spokes rotating
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + t * 20;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(angle) * 14, wy + Math.sin(angle) * 14);
      ctx.stroke();
    }
  }

  function drawRingingPhone(px, py, t) {
    const ringAngle = Math.sin(t * 30) * 0.2;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ringAngle);

    ctx.fillStyle = '#0F172A';
    roundRect(ctx, -14, -25, 28, 50, 6);
    ctx.fill();
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(-11, -21, 22, 42);

    ctx.restore();

    // Ring soundwaves
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(px + 20, py, i * 12, -0.6, 0.6);
      ctx.stroke();
    }
  }

  function drawFrustratedSharmaji(x, y, t) {
    ctx.fillStyle = '#E0AC69';
    ctx.beginPath();
    ctx.arc(x, y, 45, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.arc(x, y - 10, 45, Math.PI, Math.PI * 2);
    ctx.fill();

    // Angry eyes
    ctx.strokeStyle = '#B91C1C';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 25, y - 15);
    ctx.lineTo(x - 5, y - 5);
    ctx.moveTo(x + 25, y - 15);
    ctx.lineTo(x + 5, y - 5);
    ctx.stroke();

    // Frowning mouth
    ctx.beginPath();
    ctx.arc(x, y + 25, 18, Math.PI, 0);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#EA580C';
    roundRect(ctx, x - 45, y + 55, 90, 110, 14);
    ctx.fill();

    // Tapping foot
    const tapY = y + 170 + Math.sin(t * 15) * 6;
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(x - 20, y + 160, 40, 12);
    ctx.fillStyle = '#78350F';
    ctx.fillRect(x - 20, tapY, 40, 12);
  }

  function drawLostRamesh(x, y, t) {
    ctx.fillStyle = '#C68642';
    ctx.beginPath();
    ctx.arc(x, y, 42, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    ctx.arc(x, y - 8, 45, Math.PI, Math.PI * 2);
    ctx.fill();

    // Scratching head hand
    ctx.fillStyle = '#C68642';
    roundRect(ctx, x + 25, y - 35, 18, 35, 6);
    ctx.fill();

    // Confused question marks ???
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText('???', x - 35, y - 50);

    // Uniform body
    ctx.fillStyle = '#2563EB';
    roundRect(ctx, x - 45, y + 50, 90, 110, 14);
    ctx.fill();

    // Wrong map in hands
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, x - 35, y + 80, 70, 50, 4);
    ctx.fill();
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('❌', x - 12, y + 115);
  }

  // --- FLYING INDIAN RUPEES CLUSTER ---
  function drawFlyingRupeesCluster(cx, cy, t) {
    // Open leather wallet at bottom
    ctx.fillStyle = '#78350F';
    roundRect(ctx, cx - 80, cy + 90, 160, 50, 12);
    ctx.fill();
    ctx.fillStyle = '#92400E';
    roundRect(ctx, cx - 75, cy + 85, 150, 20, 8);
    ctx.fill();

    // 4 Animated Flying Notes with Flapping Wings
    drawFlyingRupeeNote(cx - 70, cy - 60 - Math.sin(t * 3) * 30, 500, t * 15);
    drawFlyingRupeeNote(cx + 40, cy - 110 - Math.sin(t * 3 + 1) * 35, 2000, t * 18);
    drawFlyingRupeeNote(cx - 30, cy - 10 - Math.sin(t * 3 + 2) * 25, 500, t * 14);
    drawFlyingRupeeNote(cx + 60, cy + 30 - Math.sin(t * 3 + 3) * 20, 2000, t * 16);
  }

  function drawFlyingRupeeNote(x, y, denomination, wingPhase) {
    // Note body
    const is500 = denomination === 500;
    const noteColor = is500 ? '#15803D' : '#BE185D'; // Green ₹500, Magenta ₹2000
    const textColor = '#FFFFFF';

    ctx.save();
    ctx.translate(x, y);

    // Flapping Cartoon Wings
    const wingY = Math.sin(wingPhase) * 10;
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;

    // Left Wing
    ctx.beginPath();
    ctx.ellipse(-45, -5 + wingY, 20, 10, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.ellipse(45, -5 + wingY, 20, 10, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Indian Banknote
    ctx.fillStyle = noteColor;
    roundRect(ctx, -38, -18, 76, 36, 6);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Rupee symbol and value
    ctx.fillStyle = textColor;
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`₹${denomination}`, 0, 5);

    ctx.restore();
  }

  function drawRupeeNote(ctx, x, y, denomination, rotation) {
    drawFlyingRupeeNote(x, y, denomination, 0);
  }

  function drawGlowingDigitalBridge(x1, x2, y, t) {
    // Arching golden/cyan beam
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.4)';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.quadraticCurveTo((x1 + x2) / 2, y - 100, x2, y);
    ctx.stroke();

    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.quadraticCurveTo((x1 + x2) / 2, y - 100, x2, y);
    ctx.stroke();

    // Moving particles across the bridge
    const particleProgress = (t * 0.8) % 1;
    const px = x1 + (x2 - x1) * particleProgress;
    const py = y - Math.sin(particleProgress * Math.PI) * 100;
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMiniCustomer(x, y, t) {
    ctx.fillStyle = '#E0AC69';
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.arc(x, y - 5, 32, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#EA580C';
    roundRect(ctx, x - 25, y + 36, 50, 65, 10);
    ctx.fill();
  }

  function drawMiniTechnician(x, y, t) {
    ctx.fillStyle = '#C68642';
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    ctx.arc(x, y - 5, 34, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2563EB';
    roundRect(ctx, x - 25, y + 36, 50, 65, 10);
    ctx.fill();
  }

  function drawWorkingAC(x, y, t) {
    ctx.fillStyle = '#F8FAFC';
    roundRect(ctx, x - 180, y, 360, 95, 12);
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(x + 140, y + 25, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 13px monospace';
    ctx.fillText('COOLING 100% ACTIVE (18°C)', x, y + 30);

    // Cool blue breeze waves flowing down!
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    for (let i = -120; i <= 120; i += 40) {
      const bx = x + i;
      ctx.beginPath();
      ctx.moveTo(bx, y + 80);
      ctx.quadraticCurveTo(bx + Math.sin(t * 8 + i) * 15, y + 140, bx, y + 200);
      ctx.stroke();

      // Snowflake icons ❄️
      ctx.fillStyle = '#0284C7';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('❄️', bx - 8, y + 130 + Math.sin(t * 5 + i) * 15);
    }
  }

  function drawHappySharmaji(x, y, t) {
    ctx.fillStyle = '#E0AC69';
    ctx.beginPath();
    ctx.arc(x, y, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.arc(x, y - 10, 48, Math.PI, Math.PI * 2);
    ctx.fill();

    // Smiling face with mustache
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.ellipse(x - 15, y + 15, 16, 7, -0.2, 0, Math.PI * 2);
    ctx.ellipse(x + 15, y + 15, 16, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y + 26, 12, 0, Math.PI);
    ctx.fill();

    // Body
    ctx.fillStyle = '#EA580C';
    roundRect(ctx, x - 50, y + 55, 100, 120, 16);
    ctx.fill();

    // Thumbs Up Hand 👍
    ctx.fillStyle = '#E0AC69';
    roundRect(ctx, x - 75, y + 70, 25, 40, 6);
    ctx.fill();
    ctx.font = '28px Inter, sans-serif';
    ctx.fillText('👍', x - 75, y + 65);
  }

  function drawNamasteRamesh(x, y, t) {
    ctx.fillStyle = '#C68642';
    ctx.beginPath();
    ctx.arc(x, y, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    ctx.arc(x, y - 10, 50, Math.PI, Math.PI * 2);
    ctx.fill();

    // Smiling face
    ctx.fillStyle = '#111827';
    ctx.fillRect(x - 12, y + 12, 24, 6); // Mustache
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y + 24, 10, 0, Math.PI);
    ctx.fill();

    // Body
    ctx.fillStyle = '#2563EB';
    roundRect(ctx, x - 50, y + 55, 100, 120, 16);
    ctx.fill();

    // Folded Namaste Hands 🙏
    ctx.font = '36px Inter, sans-serif';
    ctx.fillText('🙏', x - 18, y + 90);
  }

  function drawPiggyBank(x, y, t) {
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.arc(x, y, 38, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#FBCFE8';
    ctx.beginPath();
    ctx.ellipse(x - 28, y + 5, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gold coin dropping in
    const coinY = y - 55 + Math.sin(t * 10) * 15;
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(x, coinY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#854D0E';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('₹', x, coinY + 4);
  }

  function drawSpeechBubble(c, x, y, w, h, lines) {
    c.fillStyle = '#FFFFFF';
    roundRect(c, x, y, w, h, 14);
    c.fill();
    c.strokeStyle = '#CBD5E1';
    c.lineWidth = 2;
    c.stroke();

    c.fillStyle = '#0F172A';
    c.font = 'bold 15px Inter, sans-serif';
    c.textAlign = 'left';
    lines.forEach((line, i) => {
      c.fillText(line, x + 16, y + 28 + i * 24);
    });
  }

  function drawHonkBubble(x, y, text, t) {
    const scale = 1 + Math.sin(t * 8) * 0.1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#FEF08A';
    roundRect(ctx, -60, -20, 120, 40, 8);
    ctx.fill();
    ctx.strokeStyle = '#CA8A04';
    ctx.stroke();
    ctx.fillStyle = '#713F12';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, 6);
    ctx.restore();
  }

  function wrapText(c, text, x, y, maxWidth, lineHeight) {
    const words = (text || '').split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = c.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        c.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    c.fillText(line, x, y);
  }

  function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
  }

  startProductionBtn.addEventListener('click', startProduction);
  overlayStartBtn.addEventListener('click', startProduction);
  if (forceStopBtn) forceStopBtn.addEventListener('click', stopProduction);
});
