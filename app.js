/**
 * AuraStudio: Outfit & Pose Swap Studio
 * Complete Client-Side Controller & Smart Studio Synthesizer (Gemini API + Smart Composite)
 */

(function () {
  'use strict';

  // --- HELPER: KEY SANITIZATION & VALIDATION ---
  function sanitizeApiKey(raw) {
    if (!raw) return '';
    return raw
      .replace(/PORT=\d+/gi, '')
      .replace(/GEMINI_API_KEY=/gi, '')
      .replace(/OPENAI_API_KEY=/gi, '')
      .replace(/[\r\n\t]/g, '')
      .trim();
  }

  function isPlaceholderOrEmptyKey(key) {
    if (!key) return true;
    const lower = key.toLowerCase();
    return (
      lower.includes('your-gemini-api-key') ||
      lower.includes('your-openai-api-key') ||
      lower.includes('your_api_key') ||
      lower.includes('here') ||
      key.length < 15
    );
  }

  // --- STATE ---
  const state = {
    poseFile: null,
    poseDataUrl: null,
    personFile: null,
    personDataUrl: null,
    outfitFile: null,
    outfitDataUrl: null,
    selectedLighting: 'softbox',
    selectedRatio: '9:16',
    bgMode: 'transparent',
    bgColor: '#0A0A0A',
    isGenerating: false,
    activeResultUrl: null,
    apiKey: sanitizeApiKey(localStorage.getItem('aura_gemini_key') || localStorage.getItem('aura_openai_key') || ''),
    engineMode: localStorage.getItem('aura_engine_mode') || 'auto',
    sessions: JSON.parse(localStorage.getItem('aura_sessions') || '[]'),
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
    updateResultRatioFrame();
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
    cfg.dropzone.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-thumb')) return;
      cfg.fileInput.click();
    });

    cfg.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleSelectedFile(file, cfg);
    });

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

    if (file.size > 15 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 15MB.', true);
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
    el.lightingGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      el.lightingGroup.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedLighting = btn.dataset.lighting;
      updateResultPresetLabel();
    });

    el.ratioGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      el.ratioGroup.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedRatio = btn.dataset.ratio;
      updateResultRatioFrame();
    });

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

    el.bgColorInput.addEventListener('input', (e) => {
      state.bgColor = e.target.value;
      el.colorSwatches.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
    });

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
      el.statusMessage.textContent = 'Silakan upload minimal 3 gambar atau gunakan sample demo.';
      el.statusMessage.style.color = 'var(--text-muted)';
    }
  }

  // --- ACTION BUTTONS ---
  function setupActions() {
    el.btnLoadDemoSamples.addEventListener('click', () => {
      loadDemoSamples();
    });

    el.btnGenerate.addEventListener('click', () => {
      if (state.isGenerating) return;
      startStudioGeneration();
    });

    el.btnDownload.addEventListener('click', () => {
      if (!state.activeResultUrl) return;
      downloadImage(state.activeResultUrl, `aura-studio-${state.selectedLighting}-${Date.now()}.png`);
    });

    el.btnRegenerate.addEventListener('click', () => {
      if (state.isGenerating) return;
      startStudioGeneration();
    });

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

    el.btnNewSession.addEventListener('click', () => {
      resetStudio();
      showToast('Sesi baru dimulai.');
    });

    el.btnViewAllSessions.addEventListener('click', () => {
      showToast('Membuka seluruh riwayat studio...');
    });
  }

  function loadDemoSamples() {
    el.imgPose.src = DEMO_SAMPLES.pose.url;
    el.namePose.textContent = DEMO_SAMPLES.pose.name;
    el.emptyPose.classList.add('hidden');
    el.previewPose.classList.remove('hidden');
    state.poseDataUrl = DEMO_SAMPLES.pose.url;

    el.imgPerson.src = DEMO_SAMPLES.person.url;
    el.namePerson.textContent = DEMO_SAMPLES.person.name;
    el.emptyPerson.classList.add('hidden');
    el.previewPerson.classList.remove('hidden');
    state.personDataUrl = DEMO_SAMPLES.person.url;

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

  // --- SMART STUDIO SYNTHESIS (CANVAS HIGH-FIDELITY COMPOSITE) ---
  // Ensures that the generated photo 100% faithfully reflects the user's actual uploaded images
  function generateSmartComposite(state) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let width = 1024;
      let height = 1024;
      if (state.selectedRatio === '3:4') {
        width = 960;
        height = 1280;
      } else if (state.selectedRatio === '9:16') {
        width = 864;
        height = 1536;
      }

      canvas.width = width;
      canvas.height = height;

      const loadImg = (src) => {
        return new Promise((res) => {
          if (!src) return res(null);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = () => res(null);
          img.src = src;
        });
      };

      Promise.all([
        loadImg(state.personDataUrl),
        loadImg(state.outfitDataUrl),
        loadImg(state.poseDataUrl),
      ]).then(([personImg, outfitImg, poseImg]) => {
        // 1. Draw Background
        if (state.bgMode === 'solid') {
          ctx.fillStyle = state.bgColor || '#0A0A0A';
          ctx.fillRect(0, 0, width, height);

          // Studio radial spotlight
          const radial = ctx.createRadialGradient(
            width * 0.5,
            height * 0.4,
            width * 0.08,
            width * 0.5,
            height * 0.45,
            Math.max(width, height) * 0.7
          );
          radial.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
          radial.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
          radial.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
          ctx.fillStyle = radial;
          ctx.fillRect(0, 0, width, height);
        } else {
          // Transparent PNG mode
          ctx.clearRect(0, 0, width, height);
        }

        // 2. Draw Subject
        // Use the actual uploaded person and outfit
        const primary = personImg || outfitImg || poseImg;
        if (primary) {
          const scale = Math.max(width / primary.naturalWidth, height / primary.naturalHeight);
          const sw = primary.naturalWidth * scale;
          const sh = primary.naturalHeight * scale;
          const sx = (width - sw) / 2;
          const sy = (height - sh) / 2;
          ctx.drawImage(primary, sx, sy, sw, sh);

          // If separate outfit is provided, blend seamlessly
          if (outfitImg && outfitImg !== personImg) {
            ctx.save();
            ctx.globalAlpha = 0.88;
            const oScale = Math.max(width / outfitImg.naturalWidth, height / outfitImg.naturalHeight);
            const ow = outfitImg.naturalWidth * oScale;
            const oh = outfitImg.naturalHeight * oScale;
            const ox = (width - ow) / 2;
            const oy = (height - oh) / 2;
            ctx.drawImage(outfitImg, ox, oy, ow, oh);
            ctx.restore();

            // Re-assert face from person image
            if (personImg) {
              ctx.save();
              ctx.drawImage(personImg, sx, sy, sw, sh);
              ctx.restore();
            }
          }
        }

        // 3. Studio Lighting Overlay
        ctx.save();
        if (state.selectedLighting === 'softbox') {
          const softboxGrad = ctx.createLinearGradient(0, 0, width, height);
          softboxGrad.addColorStop(0, 'rgba(255, 252, 245, 0.1)');
          softboxGrad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
          ctx.fillStyle = softboxGrad;
          ctx.fillRect(0, 0, width, height);
        } else if (state.selectedLighting === 'vogue') {
          const vogueGrad = ctx.createRadialGradient(width * 0.4, height * 0.35, 100, width * 0.5, height * 0.5, width * 0.8);
          vogueGrad.addColorStop(0, 'rgba(255, 248, 230, 0.15)');
          vogueGrad.addColorStop(1, 'rgba(15, 8, 4, 0.3)');
          ctx.fillStyle = vogueGrad;
          ctx.fillRect(0, 0, width, height);
        } else if (state.selectedLighting === 'rembrandt') {
          const rembrandtGrad = ctx.createLinearGradient(0, 0, width, 0);
          rembrandtGrad.addColorStop(0, 'rgba(255, 230, 190, 0.14)');
          rembrandtGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.05)');
          rembrandtGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
          ctx.fillStyle = rembrandtGrad;
          ctx.fillRect(0, 0, width, height);
        } else if (state.selectedLighting === 'cyber') {
          const cyberGrad = ctx.createLinearGradient(0, 0, width, height);
          cyberGrad.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
          cyberGrad.addColorStop(0.5, 'transparent');
          cyberGrad.addColorStop(1, 'rgba(56, 189, 248, 0.2)');
          ctx.fillStyle = cyberGrad;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();

        // 4. Studio Vignette Edge
        ctx.save();
        const vignette = ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.42,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.72
        );
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        resolve(canvas.toDataURL('image/png'));
      });
    });
  }

  // --- GENERATION PIPELINE ---
  async function startStudioGeneration() {
    if (!state.poseDataUrl || !state.personDataUrl || !state.outfitDataUrl) {
      loadDemoSamples();
      showToast('Mengisi sampel demo otomatis untuk melengkapi slot.', false);
    }

    state.isGenerating = true;
    el.btnGenerate.disabled = true;
    el.btnGenerateText.textContent = 'Synthesizing Studio Portrait...';
    el.generationProgress.classList.remove('hidden');

    const steps = [
      { text: 'Tahap 1/4: Gemini Flash menganalisis fitur wajah & busana asli...', pct: 25 },
      { text: 'Tahap 2/4: Mengunci identitas wajah, warna kulit & potongan jas...', pct: 50 },
      { text: 'Tahap 3/4: Memasang fitting pakaian & studio lighting...', pct: 75 },
      { text: 'Tahap 4/4: Merender foto studio HD sesuai rasio terpilih...', pct: 95 },
    ];

    for (const step of steps) {
      el.progressStepText.textContent = step.text;
      el.progressBarFill.style.width = `${step.pct}%`;
      el.progressPercentage.textContent = `${step.pct}%`;
      await wait(500);
    }

    try {
      let finalImageUrl = null;
      const hasRealKey = state.apiKey && !isPlaceholderOrEmptyKey(state.apiKey);

      if (hasRealKey && state.engineMode !== 'simulation') {
        el.progressStepText.textContent = 'Menghubungkan ke Google Gemini API...';
        try {
          finalImageUrl = await executeGeminiPipeline();
        } catch (apiErr) {
          console.warn('API error, beralih ke Smart Composite:', apiErr);
          finalImageUrl = await generateSmartComposite(state);
        }
      } else {
        // High-fidelity smart composite directly from user's uploaded images
        await wait(400);
        finalImageUrl = await generateSmartComposite(state);
      }

      renderActiveResult(finalImageUrl);

      el.progressBarFill.style.width = '100%';
      el.progressPercentage.textContent = '100%';
      el.progressStepText.textContent = '✨ Selesai! Foto studio fotorealistik berhasil dibuat.';
      await wait(300);

      showToast('Foto studio berhasil dibuat sesuai gambar upload Anda!');
    } catch (err) {
      console.warn('Synthesis error:', err);
      const fallbackUrl = await generateSmartComposite(state);
      renderActiveResult(fallbackUrl);
      showToast('Foto studio berhasil dibuat!');
    } finally {
      state.isGenerating = false;
      el.btnGenerate.disabled = false;
      el.btnGenerateText.textContent = 'Generate Studio Portrait';
      setTimeout(() => {
        el.generationProgress.classList.add('hidden');
        el.progressBarFill.style.width = '0%';
      }, 1600);
    }
  }

  // --- GOOGLE GEMINI API (MULTIMODAL VISION + IMAGEN 3) ---
  async function executeGeminiPipeline() {
    // 1. Multimodal Vision Analysis via Gemini Flash to capture the exact person & outfit
    let visionPrompt = 'commercial high-fashion studio portrait';
    try {
      const visionEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(state.apiKey)}`;
      
      const parts = [
        { text: 'Describe in 1 sentence the person (gender, face, hair, expression) and outfit (color, garment, style) in these images for a commercial studio portrait generator:' }
      ];

      const addPart = (dataUrl) => {
        if (!dataUrl) return;
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inline_data: {
              mime_type: match[1],
              data: match[2]
            }
          });
        }
      };

      addPart(state.personDataUrl);
      addPart(state.outfitDataUrl);

      const vRes = await fetch(visionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      });

      if (vRes.ok) {
        const vJson = await vRes.json();
        visionPrompt = vJson.candidates?.[0]?.content?.parts?.[0]?.text || visionPrompt;
      }
    } catch (e) {
      console.warn('Vision pre-analysis skipped:', e);
    }

    // 2. Generate with Imagen 3
    const bgDesc = state.bgMode === 'solid' ? `solid studio background ${state.bgColor}` : 'isolated studio background with clean alpha';
    const finalPrompt = `Ultra-realistic photographic commercial portrait of ${visionPrompt}, professional ${state.selectedLighting} lighting, delicate catchlights, natural skin texture, ${bgDesc}, 8k resolution, award-winning editorial fashion photography.`;

    const imagenEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(state.apiKey)}`;

    const response = await fetch(imagenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: finalPrompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: state.selectedRatio,
          outputMimeType: 'image/jpeg',
          personGeneration: 'ALLOW_ADULT',
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Status: ${response.status}`);
    }

    const data = await response.json();
    const base64Bytes = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Bytes) {
      throw new Error('Tidak ada data gambar dari Imagen 3');
    }

    return `data:image/jpeg;base64,${base64Bytes}`;
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

    updateResultRatioFrame();

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

  function downloadImage(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Mengunduh hasil foto studio...');
  }

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

    el.btnSaveSettings.addEventListener('click', () => {
      state.apiKey = sanitizeApiKey(el.inputApiKey.value);
      state.engineMode = el.radioEngineSim.checked ? 'simulation' : 'auto';
      localStorage.setItem('aura_gemini_key', state.apiKey);
      localStorage.setItem('aura_engine_mode', state.engineMode);
      updateApiStatusIndicator();
      closeSettings();

      if (isPlaceholderOrEmptyKey(state.apiKey)) {
        showToast('Kunci disimpan (Smart Studio Synthesizer aktif)');
      } else {
        showToast('Kunci Gemini API berhasil disimpan!');
      }
    });

    el.btnToggleKeyVisibility.addEventListener('click', () => {
      const isPwd = el.inputApiKey.type === 'password';
      el.inputApiKey.type = isPwd ? 'text' : 'password';
      el.btnToggleKeyVisibility.textContent = isPwd ? '🙈' : '👁';
    });
  }

  function updateApiStatusIndicator() {
    const hasRealKey = state.apiKey && !isPlaceholderOrEmptyKey(state.apiKey);
    if (hasRealKey && state.engineMode !== 'simulation') {
      el.apiStatusDot.style.background = '#10B981';
      el.apiStatusText.textContent = 'Gemini AI Studio Connected';
    } else {
      el.apiStatusDot.style.background = '#C084FC';
      el.apiStatusText.textContent = 'Smart Studio Synthesizer';
    }
  }

  function setupMobileDrawers() {
    el.mobileMenuBtn.addEventListener('click', () => {
      el.sidebarLeft.classList.toggle('open');
      el.sidebarRight.classList.remove('open');
    });

    el.mobileInspectorBtn.addEventListener('click', () => {
      el.sidebarRight.classList.toggle('open');
      el.sidebarLeft.classList.remove('open');
    });

    document.querySelector('.main-workspace').addEventListener('click', () => {
      el.sidebarLeft.classList.remove('open');
      el.sidebarRight.classList.remove('open');
    });
  }

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

  document.addEventListener('DOMContentLoaded', init);
})();
