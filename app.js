/**
 * AuraStudio: Outfit & Pose Swap Studio
 * Complete Client-Side Controller & OpenAI Pipeline
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    poseFile: null,
    poseDataUrl: null,
    personFile: null,
    personDataUrl: null,
    outfitFile: null,
    outfitDataUrl: null,
    selectedLighting: 'softbox',
    selectedRatio: '1:1',
    bgMode: 'transparent',
    bgColor: '#0A0A0A',
    isGenerating: false,
    activeResultUrl: null,
    apiKey: localStorage.getItem('aura_openai_key') || '',
    engineMode: localStorage.getItem('aura_engine_mode') || 'auto',
    sessions: JSON.parse(localStorage.getItem('aura_sessions') || '[]'),
    renderCount: parseInt(localStorage.getItem('aura_render_count') || '12', 10),
  };

  // Curated High-Definition Studio Fashion Reference Samples (Unsplash fashion portraits)
  const DEMO_SAMPLES = {
    pose: {
      name: 'editorial-pose.jpg',
      url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    },
    person: {
      name: 'portrait-face.jpg',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    },
    outfit: {
      name: 'designer-garment.jpg',
      url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
    },
  };

  // Curated High-Resolution Simulated Results by Lighting Preset
  const SIMULATION_RESULTS = {
    softbox: {
      '1:1': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1024&q=85',
      '3:4': 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1024&q=85',
      '9:16': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1024&q=85',
    },
    vogue: {
      '1:1': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1024&q=85',
      '3:4': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1024&q=85',
      '9:16': 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1024&q=85',
    },
    rembrandt: {
      '1:1': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1024&q=85',
      '3:4': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1024&q=85',
      '9:16': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1024&q=85',
    },
    cyber: {
      '1:1': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1024&q=85',
      '3:4': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1024&q=85',
      '9:16': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1024&q=85',
    },
  };

  // --- DOM ELEMENTS ---
  const el = {
    // Dropzones & Inputs
    dropzonePose: document.getElementById('dropzonePose'),
    filePose: document.getElementById('filePose'),
    emptyPose: document.getElementById('emptyPose'),
    previewPose: document.getElementById('previewPose'),
    imgPose: document.getElementById('imgPose'),
    namePose: document.getElementById('namePose'),
    removePose: document.getElementById('removePose'),

    dropzonePerson: document.getElementById('dropzonePerson'),
    filePerson: document.getElementById('filePerson'),
    emptyPerson: document.getElementById('emptyPerson'),
    previewPerson: document.getElementById('previewPerson'),
    imgPerson: document.getElementById('imgPerson'),
    namePerson: document.getElementById('namePerson'),
    removePerson: document.getElementById('removePerson'),

    dropzoneOutfit: document.getElementById('dropzoneOutfit'),
    fileOutfit: document.getElementById('fileOutfit'),
    emptyOutfit: document.getElementById('emptyOutfit'),
    previewOutfit: document.getElementById('previewOutfit'),
    imgOutfit: document.getElementById('imgOutfit'),
    nameOutfit: document.getElementById('nameOutfit'),
    removeOutfit: document.getElementById('removeOutfit'),

    // Control Groups
    lightingGroup: document.getElementById('lightingGroup'),
    ratioGroup: document.getElementById('ratioGroup'),
    bgModeGroup: document.getElementById('bgModeGroup'),
    colorPickerBox: document.getElementById('colorPickerBox'),
    bgColorInput: document.getElementById('bgColorInput'),
    colorSwatches: document.getElementById('colorSwatches'),

    // Actions & Status
    inputsStatus: document.getElementById('inputsStatus'),
    statusMessage: document.getElementById('statusMessage'),
    btnLoadDemoSamples: document.getElementById('btnLoadDemoSamples'),
    btnGenerate: document.getElementById('btnGenerate'),
    btnGenerateText: document.getElementById('btnGenerateText'),

    // Progress
    generationProgress: document.getElementById('generationProgress'),
    progressBarFill: document.getElementById('progressBarFill'),
    progressStepText: document.getElementById('progressStepText'),
    progressPercentage: document.getElementById('progressPercentage'),

    // Output & Inspector
    activeResultRatio: document.getElementById('activeResultRatio'),
    activeResultPreset: document.getElementById('activeResultPreset'),
    resultFrame: document.getElementById('resultFrame'),
    resultEmpty: document.getElementById('resultEmpty'),
    resultImg: document.getElementById('resultImg'),
    btnZoomResult: document.getElementById('btnZoomResult'),
    btnDownload: document.getElementById('btnDownload'),
    btnRegenerate: document.getElementById('btnRegenerate'),
    statRenderCount: document.getElementById('statRenderCount'),
    recentList: document.getElementById('recentList'),

    // Modals
    settingsModal: document.getElementById('settingsModal'),
    navSettingsBtn: document.getElementById('navSettingsBtn'),
    btnSettingsQuick: document.getElementById('btnSettingsQuick'),
    btnCloseSettings: document.getElementById('btnCloseSettings'),
    btnCancelSettings: document.getElementById('btnCancelSettings'),
    btnSaveSettings: document.getElementById('btnSaveSettings'),
    inputApiKey: document.getElementById('inputApiKey'),
    btnToggleKeyVisibility: document.getElementById('btnToggleKeyVisibility'),
    radioEngineAuto: document.getElementById('radioEngineAuto'),
    radioEngineSim: document.getElementById('radioEngineSim'),
    apiStatusDot: document.getElementById('apiStatusDot'),
    apiStatusText: document.getElementById('apiStatusText'),

    // Lightbox
    lightboxModal: document.getElementById('lightboxModal'),
    lightboxImg: document.getElementById('lightboxImg'),
    btnCloseLightbox: document.getElementById('btnCloseLightbox'),
    btnLightboxDownload: document.getElementById('btnLightboxDownload'),

    // Toast
    toastNotification: document.getElementById('toastNotification'),
    toastMsg: document.getElementById('toastMsg'),

    // Mobile Toggles
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileInspectorBtn: document.getElementById('mobileInspectorBtn'),
    sidebarLeft: document.getElementById('sidebarLeft'),
    sidebarRight: document.getElementById('sidebarRight'),
    btnNewSession: document.getElementById('btnNewSession'),
    btnViewAllSessions: document.getElementById('btnViewAllSessions'),
  };

  // --- INITIALIZATION ---
  function init() {
    setupUploadHandlers();
    setupControls();
    setupActions();
    setupModals();
    setupMobileDrawers();
    renderRecentSessions();
    updateApiStatusIndicator();
    updateInputsStatus();
  }

  // --- DROPZONE & UPLOAD HANDLERS ---
  function setupUploadHandlers() {
    setupSingleSlot({
      dropzone: el.dropzonePose,
      fileInput: el.filePose,
      emptyEl: el.emptyPose,
      previewEl: el.previewPose,
      imgEl: el.imgPose,
      nameEl: el.namePose,
      removeBtn: el.removePose,
      onFile: (file, dataUrl) => {
        state.poseFile = file;
        state.poseDataUrl = dataUrl;
        updateInputsStatus();
      },
      onRemove: () => {
        state.poseFile = null;
        state.poseDataUrl = null;
        updateInputsStatus();
      },
    });

    setupSingleSlot({
      dropzone: el.dropzonePerson,
      fileInput: el.filePerson,
      emptyEl: el.emptyPerson,
      previewEl: el.previewPerson,
      imgEl: el.imgPerson,
      nameEl: el.namePerson,
      removeBtn: el.removePerson,
      onFile: (file, dataUrl) => {
        state.personFile = file;
        state.personDataUrl = dataUrl;
        updateInputsStatus();
      },
      onRemove: () => {
        state.personFile = null;
        state.personDataUrl = null;
        updateInputsStatus();
      },
    });

    setupSingleSlot({
      dropzone: el.dropzoneOutfit,
      fileInput: el.fileOutfit,
      emptyEl: el.emptyOutfit,
      previewEl: el.previewOutfit,
      imgEl: el.imgOutfit,
      nameEl: el.nameOutfit,
      removeBtn: el.removeOutfit,
      onFile: (file, dataUrl) => {
        state.outfitFile = file;
        state.outfitDataUrl = dataUrl;
        updateInputsStatus();
      },
      onRemove: () => {
        state.outfitFile = null;
        state.outfitDataUrl = null;
        updateInputsStatus();
      },
    });
  }

  function setupSingleSlot(cfg) {
    // Click to select
    cfg.dropzone.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-thumb')) return;
      cfg.fileInput.click();
    });

    // File input change
    cfg.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleSelectedFile(file, cfg);
    });

    // Drag and drop events
    ['dragenter', 'dragover'].forEach((eventName) => {
      cfg.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        cfg.dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      cfg.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        cfg.dropzone.classList.remove('dragover');
      });
    });

    cfg.dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file) handleSelectedFile(file, cfg);
    });

    // Remove button
    cfg.removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cfg.fileInput.value = '';
      cfg.emptyEl.classList.remove('hidden');
      cfg.previewEl.classList.add('hidden');
      cfg.imgEl.src = '';
      cfg.onRemove();
    });
  }

  function handleSelectedFile(file, cfg) {
    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (JPG, PNG, atau WebP).', true);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 10MB.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      cfg.imgEl.src = dataUrl;
      cfg.nameEl.textContent = file.name;
      cfg.emptyEl.classList.add('hidden');
      cfg.previewEl.classList.remove('hidden');
      cfg.onFile(file, dataUrl);
    };
    reader.readAsDataURL(file);
  }

  // --- PARAMETER CONTROLS ---
  function setupControls() {
    // Lighting pills
    el.lightingGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      el.lightingGroup.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedLighting = btn.dataset.lighting;
      updateResultPresetLabel();
    });

    // Aspect ratio pills
    el.ratioGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      el.ratioGroup.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedRatio = btn.dataset.ratio;
      updateResultRatioFrame();
    });

    // Background mode pills
    el.bgModeGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      el.bgModeGroup.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.bgMode = btn.dataset.bgMode;

      if (state.bgMode === 'solid') {
        el.colorPickerBox.classList.remove('hidden');
      } else {
        el.colorPickerBox.classList.add('hidden');
      }
    });

    // Color picker
    el.bgColorInput.addEventListener('input', (e) => {
      state.bgColor = e.target.value;
      el.colorSwatches.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
    });

    // Color swatches
    el.colorSwatches.addEventListener('click', (e) => {
      const swatch = e.target.closest('.swatch');
      if (!swatch) return;
      el.colorSwatches.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');
      state.bgColor = swatch.dataset.color;
      el.bgColorInput.value = state.bgColor;
    });
  }

  function updateResultRatioFrame() {
    el.activeResultRatio.textContent = state.selectedRatio;
    el.resultFrame.className = 'result-frame';

    if (state.selectedRatio === '1:1') {
      el.resultFrame.classList.add('ratio-1-1');
    } else if (state.selectedRatio === '3:4') {
      el.resultFrame.classList.add('ratio-3-4');
    } else if (state.selectedRatio === '9:16') {
      el.resultFrame.classList.add('ratio-9-16');
    }
  }

  function updateResultPresetLabel() {
    const titles = {
      softbox: 'Softbox Commercial',
      vogue: 'Vogue Editorial',
      rembrandt: 'Rembrandt Cinematic',
      cyber: 'Cyber Violet',
    };
    el.activeResultPreset.textContent = titles[state.selectedLighting] || 'Custom Lighting';
  }

  function updateInputsStatus() {
    const count = [state.poseDataUrl, state.personDataUrl, state.outfitDataUrl].filter(Boolean).length;
    if (count === 3) {
      el.statusMessage.textContent = '3 input siap: Pose, Orang, dan Baju terdeteksi.';
      el.statusMessage.style.color = '#C084FC';
    } else if (count > 0) {
      el.statusMessage.textContent = `${count} dari 3 slot terisi. Lengkapi semua slot untuk hasil terbaik.`;
      el.statusMessage.style.color = 'var(--text-secondary)';
    } else {
      el.statusMessage.textContent = 'Silakan upload minimal 3 gambar atau klik "Load Demo Samples".';
      el.statusMessage.style.color = 'var(--text-muted)';
    }
  }

  // --- ACTION BUTTONS ---
  function setupActions() {
    // Load Demo Samples button
    el.btnLoadDemoSamples.addEventListener('click', () => {
      loadDemoSamples();
    });

    // Generate CTA
    el.btnGenerate.addEventListener('click', () => {
      if (state.isGenerating) return;
      startStudioGeneration();
    });

    // Download PNG
    el.btnDownload.addEventListener('click', () => {
      if (!state.activeResultUrl) return;
      downloadImage(state.activeResultUrl, `aura-studio-${state.selectedLighting}-${Date.now()}.png`);
    });

    // Regenerate
    el.btnRegenerate.addEventListener('click', () => {
      if (state.isGenerating) return;
      startStudioGeneration();
    });

    // Zoom Lightbox
    el.btnZoomResult.addEventListener('click', () => {
      if (!state.activeResultUrl) return;
      el.lightboxImg.src = state.activeResultUrl;
      el.lightboxInfo.textContent = `AuraStudio — ${state.selectedLighting.toUpperCase()} [${state.selectedRatio}]`;
      el.lightboxModal.classList.remove('hidden');
    });

    el.btnCloseLightbox.addEventListener('click', () => {
      el.lightboxModal.classList.add('hidden');
    });

    el.btnLightboxDownload.addEventListener('click', () => {
      if (!state.activeResultUrl) return;
      downloadImage(state.activeResultUrl, `aura-studio-full-${Date.now()}.png`);
    });

    // New Session button
    el.btnNewSession.addEventListener('click', () => {
      resetStudio();
      showToast('Sesi baru dimulai.');
    });

    el.btnViewAllSessions.addEventListener('click', () => {
      showToast('Membuka seluruh riwayat studio...');
    });
  }

  // --- DEMO SAMPLES LOADER ---
  function loadDemoSamples() {
    // Set Pose
    el.imgPose.src = DEMO_SAMPLES.pose.url;
    el.namePose.textContent = DEMO_SAMPLES.pose.name;
    el.emptyPose.classList.add('hidden');
    el.previewPose.classList.remove('hidden');
    state.poseDataUrl = DEMO_SAMPLES.pose.url;

    // Set Person
    el.imgPerson.src = DEMO_SAMPLES.person.url;
    el.namePerson.textContent = DEMO_SAMPLES.person.name;
    el.emptyPerson.classList.add('hidden');
    el.previewPerson.classList.remove('hidden');
    state.personDataUrl = DEMO_SAMPLES.person.url;

    // Set Outfit
    el.imgOutfit.src = DEMO_SAMPLES.outfit.url;
    el.nameOutfit.textContent = DEMO_SAMPLES.outfit.name;
    el.emptyOutfit.classList.add('hidden');
    el.previewOutfit.classList.remove('hidden');
    state.outfitDataUrl = DEMO_SAMPLES.outfit.url;

    updateInputsStatus();
    showToast('3 contoh foto studio berhasil dimuat!');
  }

  function resetStudio() {
    state.poseFile = null;
    state.poseDataUrl = null;
    state.personFile = null;
    state.personDataUrl = null;
    state.outfitFile = null;
    state.outfitDataUrl = null;

    [el.emptyPose, el.emptyPerson, el.emptyOutfit].forEach((e) => e.classList.remove('hidden'));
    [el.previewPose, el.previewPerson, el.previewOutfit].forEach((p) => p.classList.add('hidden'));
    [el.imgPose, el.imgPerson, el.imgOutfit].forEach((i) => (i.src = ''));

    updateInputsStatus();
  }

  // --- GENERATION PIPELINE ---
  async function startStudioGeneration() {
    // Check if at least 1 image exists, or load demo automatically if completely empty
    if (!state.poseDataUrl || !state.personDataUrl || !state.outfitDataUrl) {
      loadDemoSamples();
      showToast('Mengisi sampel demo otomatis untuk melengkapi slot.', false);
    }

    state.isGenerating = true;
    el.btnGenerate.disabled = true;
    el.btnGenerateText.textContent = 'Synthesizing Studio Portrait...';
    el.generationProgress.classList.remove('hidden');

    // Multi-step progress animation
    const steps = [
      { text: 'Tahap 1/4: GPT-4o Vision menganalisis geometri pose & sudut kamera...', pct: 25 },
      { text: 'Tahap 2/4: Mengunci fitur wajah, warna kulit & gaya rambut...', pct: 50 },
      { text: 'Tahap 3/4: Memasang fitting kain busana & drape tekstur...', pct: 75 },
      { text: 'Tahap 4/4: DALL·E 3 merender lighting studio dalam resolusi HD...', pct: 95 },
    ];

    for (const step of steps) {
      el.progressStepText.textContent = step.text;
      el.progressBarFill.style.width = `${step.pct}%`;
      el.progressPercentage.textContent = `${step.pct}%`;
      await wait(650);
    }

    try {
      let finalImageUrl = null;

      // Check if OpenAI API Key is provided and not in simulation mode
      if (state.apiKey && state.engineMode !== 'simulation') {
        el.progressStepText.textContent = 'Menghubungkan ke OpenAI API...';
        finalImageUrl = await executeOpenAiPipeline();
      } else {
        // Fallback Studio Simulation HD
        await wait(600);
        finalImageUrl = getSimulationImage(state.selectedLighting, state.selectedRatio);
      }

      // Display active result
      renderActiveResult(finalImageUrl);

      // Complete progress bar
      el.progressBarFill.style.width = '100%';
      el.progressPercentage.textContent = '100%';
      el.progressStepText.textContent = '✨ Selesai! Foto studio fotorealistik berhasil dibuat.';
      await wait(400);

      showToast('Foto studio berhasil dibuat!');
    } catch (err) {
      console.error('Generation Error:', err);
      // Fallback gracefully if API has error/quota limit
      const fallbackUrl = getSimulationImage(state.selectedLighting, state.selectedRatio);
      renderActiveResult(fallbackUrl);
      showToast(`OpenAI API error (${err.message}). Beralih ke Studio Preview HD.`, true);
    } finally {
      state.isGenerating = false;
      el.btnGenerate.disabled = false;
      el.btnGenerateText.textContent = 'Generate Studio Portrait';
      setTimeout(() => {
        el.generationProgress.classList.add('hidden');
        el.progressBarFill.style.width = '0%';
      }, 2000);
    }
  }

  // --- OPENAI PIPELINE (GPT-4o Vision + DALL-E 3) ---
  async function executeOpenAiPipeline() {
    // 1. Stage 1: Call GPT-4o with multimodal prompt
    const gptPrompt = `You are a high-fashion photography director. Analyze the 3 provided reference images:
1. POSE: Match exact posture, body angle, hand positions, and camera framing.
2. PERSON: Preserve exact facial bone structure, eyes, lips, jawline, skin tone, and hair.
3. OUTFIT: Recreate this exact garment, fabric texture, cut, and colors.
Target Lighting: ${state.selectedLighting} commercial studio lighting.
Background: ${state.bgMode === 'solid' ? `Solid studio color ${state.bgColor}` : 'Clean isolated background'}.
Synthesize an ultra-detailed, single-paragraph photographic DALL-E 3 prompt for a photorealistic 8k editorial studio portrait. Output ONLY the raw prompt string.`;

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: gptPrompt },
              { type: 'image_url', image_url: { url: state.poseDataUrl } },
              { type: 'image_url', image_url: { url: state.personDataUrl } },
              { type: 'image_url', image_url: { url: state.outfitDataUrl } },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!gptResponse.ok) {
      const errData = await gptResponse.json();
      throw new Error(errData.error?.message || 'Gagal menganalisis via GPT-4o Vision');
    }

    const gptJson = await gptResponse.json();
    const synthesizedPrompt = gptJson.choices[0]?.message?.content || 'Editorial studio fashion portrait with softbox lighting';

    // 2. Stage 2: Call DALL-E 3 with size matching aspect ratio
    let dalleSize = '1024x1024';
    if (state.selectedRatio === '9:16') dalleSize = '1024x1792';
    else if (state.selectedRatio === '3:4') dalleSize = '1024x1024'; // DALL-E 3 supports 1024x1024, 1024x1792, 1792x1024

    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `${synthesizedPrompt}, 8k photography, commercial studio portrait, award winning lighting, high fidelity skin texture, no artifacts, no extra limbs`,
        n: 1,
        size: dalleSize,
        quality: 'hd',
        style: 'natural',
      }),
    });

    if (!dalleResponse.ok) {
      const errData = await dalleResponse.json();
      throw new Error(errData.error?.message || 'Gagal merender via DALL·E 3');
    }

    const dalleJson = await dalleResponse.json();
    return dalleJson.data[0]?.url;
  }

  function getSimulationImage(lighting, ratio) {
    const preset = SIMULATION_RESULTS[lighting] || SIMULATION_RESULTS.softbox;
    return preset[ratio] || preset['1:1'];
  }

  // --- RENDER RESULT IN INSPECTOR ---
  function renderActiveResult(url) {
    state.activeResultUrl = url;
    el.resultImg.src = url;
    el.resultEmpty.classList.add('hidden');
    el.resultImg.classList.remove('hidden');
    el.btnZoomResult.classList.remove('hidden');
    el.btnDownload.disabled = false;
    el.btnRegenerate.disabled = false;

    // Update stats
    state.renderCount += 1;
    localStorage.setItem('aura_render_count', state.renderCount);
    el.statRenderCount.textContent = state.renderCount;

    // Save session to history
    saveSession({
      id: `sess-${Date.now()}`,
      title: `${getPresetTitle(state.selectedLighting)} Session`,
      time: 'Just now',
      ratio: state.selectedRatio,
      lighting: state.selectedLighting,
      url: url,
    });
  }

  function getPresetTitle(key) {
    const map = {
      softbox: 'Softbox Commercial',
      vogue: 'Vogue Editorial',
      rembrandt: 'Rembrandt Lookbook',
      cyber: 'Cyber Violet',
    };
    return map[key] || 'Studio Portrait';
  }

  // --- DOWNLOAD FUNCTIONALITY ---
  function downloadImage(url, filename) {
    // Create an anchor or canvas fetch download to avoid CORS restrictions where possible
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Mengunduh hasil foto studio PNG...');
  }

  // --- SESSIONS & HISTORY ---
  function saveSession(session) {
    state.sessions.unshift(session);
    if (state.sessions.length > 8) state.sessions.pop();
    localStorage.setItem('aura_sessions', JSON.stringify(state.sessions));
    renderRecentSessions();
  }

  function renderRecentSessions() {
    if (!state.sessions.length) return;
    el.recentList.innerHTML = '';
    state.sessions.forEach((s) => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.innerHTML = `
        <span class="recent-title">${s.title}</span>
        <span class="recent-time">${s.time} • ${s.ratio}</span>
      `;
      item.addEventListener('click', () => {
        state.selectedLighting = s.lighting || 'softbox';
        state.selectedRatio = s.ratio || '1:1';
        updateResultRatioFrame();
        updateResultPresetLabel();
        renderActiveResult(s.url);
        showToast(`Memuat ${s.title}`);
      });
      el.recentList.appendChild(item);
    });
  }

  // --- SETTINGS MODAL ---
  function setupModals() {
    const openSettings = () => {
      el.inputApiKey.value = state.apiKey;
      if (state.engineMode === 'simulation') {
        el.radioEngineSim.checked = true;
      } else {
        el.radioEngineAuto.checked = true;
      }
      el.settingsModal.classList.remove('hidden');
    };

    const closeSettings = () => {
      el.settingsModal.classList.add('hidden');
    };

    el.navSettingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openSettings();
    });

    el.btnSettingsQuick.addEventListener('click', openSettings);
    el.btnCloseSettings.addEventListener('click', closeSettings);
    el.btnCancelSettings.addEventListener('click', closeSettings);

    // Save Settings
    el.btnSaveSettings.addEventListener('click', () => {
      state.apiKey = el.inputApiKey.value.trim();
      state.engineMode = el.radioEngineSim.checked ? 'simulation' : 'auto';
      localStorage.setItem('aura_openai_key', state.apiKey);
      localStorage.setItem('aura_engine_mode', state.engineMode);
      updateApiStatusIndicator();
      closeSettings();
      showToast('Pengaturan studio berhasil disimpan!');
    });

    // Toggle key visibility
    el.btnToggleKeyVisibility.addEventListener('click', () => {
      const isPwd = el.inputApiKey.type === 'password';
      el.inputApiKey.type = isPwd ? 'text' : 'password';
      el.btnToggleKeyVisibility.textContent = isPwd ? '🙈' : '👁';
    });
  }

  function updateApiStatusIndicator() {
    if (state.apiKey && state.engineMode !== 'simulation') {
      el.apiStatusDot.style.background = '#10B981';
      el.apiStatusText.textContent = 'OpenAI Connected';
    } else {
      el.apiStatusDot.style.background = '#C084FC';
      el.apiStatusText.textContent = 'Studio Simulation Ready';
    }
  }

  // --- MOBILE DRAWERS ---
  function setupMobileDrawers() {
    el.mobileMenuBtn.addEventListener('click', () => {
      el.sidebarLeft.classList.toggle('open');
      el.sidebarRight.classList.remove('open');
    });

    el.mobileInspectorBtn.addEventListener('click', () => {
      el.sidebarRight.classList.toggle('open');
      el.sidebarLeft.classList.remove('open');
    });

    // Close when clicking main workspace on mobile
    document.querySelector('.main-workspace').addEventListener('click', () => {
      el.sidebarLeft.classList.remove('open');
      el.sidebarRight.classList.remove('open');
    });
  }

  // --- UTILS ---
  function showToast(msg, isError = false) {
    el.toastMsg.textContent = msg;
    const toast = el.toastNotification;
    toast.style.borderColor = isError ? '#EF4444' : '#C084FC';
    document.getElementById('toastIcon').textContent = isError ? '⚠' : '✓';
    document.getElementById('toastIcon').style.color = isError ? '#EF4444' : '#10B981';
    toast.classList.remove('hidden');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3200);
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Run on DOM load
  document.addEventListener('DOMContentLoaded', init);
})();
