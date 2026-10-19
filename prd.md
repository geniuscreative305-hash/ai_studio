# PRD (Product Requirement Document)
## Projek: Outfit & Pose Swap Studio (AI Photo Studio)
================================================================================
STATUS PRD: DRAFT REVIEW (Menunggu Konfirmasi "OKE TERAPKAN")
VERSI: v1.1.0 (Diperbarui: Migrasi Engine ke OpenAI GPT API)
ARSITEKTUR: Fullstack Node.js + Express (OpenAI GPT-4o Vision + DALL·E 3 Studio Generator)
================================================================================

--------------------------------------------------------------------------------
ZONA ATAS: SPESIFIKASI KEBUTUHAN PRODUK (BLUEPRINT AWAL)
--------------------------------------------------------------------------------

### 1. Problem Statement & Tujuan Produk
- **Masalah:** Menggabungkan referensi pose, identitas wajah seseorang, dan pakaian spesifik ke dalam satu foto studio ultra-realistis biasanya membutuhkan sesi photoshoot mahal atau proses editing manual rumit di Photoshop.
- **Tujuan Produk:** Menghadirkan aplikasi web mandiri berdesain **Deep Purple Glassmorphism** kelas dunia yang menggabungkan 3 gambar (Pose + Orang + Baju) menjadi 1 foto studio fotorealistik menggunakan **OpenAI GPT API (GPT-4o Vision + DALL·E 3 Studio Generator)**, dengan pengaturan rasio, background custom, dan pencahayaan studio.

---

### 2. Peran Pengguna (User Persona)
- **Kreator Konten & Model:** Mencoba berbagai outfit dan pose tanpa harus membeli pakaian atau berganti baju berulang kali.
- **Fashion Brand / Olshop Owner:** Melakukan katalog photoshoot virtual untuk produk pakaian pada berbagai model dan pose studio.
- **Pengguna Umum:** Mengubah foto diri dengan gaya busana dan pose majalah profesional secara instan.

---

### 3. Arsitektur & Lingkungan Kerja
- **Backend:** Node.js + Express.js
  - Mengelola API internal (`/api/generate`, `/api/history`, `/api/health`).
  - Menyimpan `OPENAI_API_KEY` secara aman di file `.env` tanpa bocor ke frontend.
  - Memproses parsing gambar Base64 dari 3 slot upload.
  - **Pipeline 2-Tahap OpenAI:**
    1. *Tahap 1 (Vision Analysis via GPT-4o):* Mengirim 3 gambar ke `gpt-4o` untuk menganalisis geometri pose, detail anatomis wajah & rambut, serta tekstur/potongan busana menjadi prompt master sintesis studio yang presisi.
    2. *Tahap 2 (Studio Rendering via DALL·E 3):* Mengeksekusi rendering resolusi tinggi (HD quality) dengan rasio yang dipilih pengguna.
- **Frontend:** Vanilla HTML5, Vanilla CSS3 (Custom Glassmorphism Design System, CSS Variables, Backdrop Blur), Modern ES6 JavaScript.
  - Desain persis gambar referensi: **ChatGPT Dark Purple Translucent Glassmorphism**.
  - Left Sidebar (Navigasi Studio, History, Presets, Settings).
  - Center Workspace (Header Studio, 3 Glowing Upload Glass Cards, Parameter Bar, Generate Actions).
  - Right Inspector (Model Info Card: "OpenAI Studio Engine", Capabilities, Output Preview, Download/Regenerate).
- **Penyimpanan Riwayat (History):** Local JSON storage di server + in-memory sync di browser untuk akses instan tanpa reload.

---

### 4. Alur Kerja Aplikasi (User Flow)
1. **Langkah 1 - Upload 3 Gambar Input:**
   - Slot 1 (Pose): Foto referensi pose tubuh, gesture tangan, sudut kamera.
   - Slot 2 (Orang): Foto orang yang wajah, identitas, warna kulit, dan gaya rambutnya ingin dipertahankan 100%.
   - Slot 3 (Baju): Foto pakaian/outfit yang tekstur, motif, warna, dan potongannya ingin dikenakan.
2. **Langkah 2 - Konfigurasi Studio:**
   - Latar Belakang: Pilihan *Transparent PNG* atau *Solid Color* (lengkap dengan color picker interaktif).
   - Rasio Gambar: Pilihan *1:1 (Square)*, *3:4 (Portrait)*, *9:16 (Story/Reels)*.
   - Studio Lighting Presets (Nilai Tambah): *Softbox Commercial*, *Vogue Editorial*, *Rembrandt Dramatic*, *Cyber Violet*.
3. **Langkah 3 - Eksekusi Generate:**
   - Pengguna menekan tombol "✨ Generate Studio Photo".
   - Indikator loading interaktif muncul dengan status progress: analyzing inputs -> synthesizing outfit & pose -> rendering high-res studio lighting.
4. **Langkah 4 - Hasil & Aksi:**
   - Hasil foto muncul di panel kanan (Output Inspector) secara dominan dalam bingkai frosted glass glowing.
   - Tombol **Download PNG** beresolusi tinggi.
   - Tombol **Regenerate** untuk mencoba variasi pencahayaan/angle baru dengan input yang sama.
   - Riwayat otomatis tersimpan ke daftar "Recent Studio Sessions" di sidebar kiri.

---

### 5. Aturan Validasi & Logika Sistem AI (Prompt Engineering)
- **Struktur Multi-Image Prompt untuk Gemini:**
  ```text
  [ROLE]: You are an ultra-realistic commercial fashion & studio portrait AI engine.
  [INPUTS PROVIDED]:
  - Image 1 (POSE REFERENCE): Adopt the exact posture, body angle, hand gesture, and camera perspective.
  - Image 2 (PERSON IDENTITY): Strictly preserve the exact face, facial features, eyes, jawline, skin tone, and hairstyle of this person. No face alteration.
  - Image 3 (OUTFIT): Dress the person in this exact clothing garment. Preserve fabric texture, stitching, colors, patterns, and drape accurately.
  [LIGHTING & QUALITY]: Professional high-end studio lighting (softbox key light, subtle rim light, delicate eye catchlight, 8k photographic sharpness, pore-level skin texture, zero uncanny valley, zero extra limbs/artifacts).
  [BACKGROUND]: {User Choice: Clean Transparent Alpha PNG / Solid Studio Color hex code}.
  [ASPECT RATIO]: {User Choice: 1:1 / 3:4 / 9:16}.
  ```
- **Penanganan Error:**
  - Validasi file (format JPG/PNG/WebP, maksimal 10MB per gambar).
  - Pesan error transparan jika API Key belum diset atau kuota habis, disertai panduan penyelesaian yang ramah.
  - Mekanisme simulasi studio fotorealistik jika API Key belum dipasang agar alur tetap dapat diuji coba secara visual.

---

### 6. Rencana Desain Antarmuka (UI/UX Persis Referensi Gambar)
- **Tema:** Dark Deep Violet Glassmorphism (Background: `#090714` dengan radial ambient purple glow, Card: `rgba(26, 20, 48, 0.65)` dengan `backdrop-filter: blur(24px)` dan border glowing tipis `rgba(168, 85, 247, 0.25)`).
- **Tipografi:** Modern Display Font (Inter / Outfit / SF Pro Display) dengan hierarki tegas, letter-spacing elegan.
- **Ikonografi:** Clean inline SVG icons (tanpa emoji norak, sesuai pedoman Desain Anti-AI ZettBOT).
- **Tata Letak 3 Kolom:**
  - **Sidebar Kiri (260px):** Logo "AuraStudio", Menu Items (Studio, Results, Presets, Settings), Riwayat Sesi Terbaru ("Recent Sessions"), Tombol "New Session".
  - **Main Studio (Center Workspace):** Search/Quick Status bar, Hero headline "What outfit & pose shall we craft today?", 3 Upload Cards bertingkat horizontal dengan dropzone interaktif, Quick Action Pills (Lighting presets, ratio, background), tombol utama Generate dengan animasi pulse.
  - **Sidebar Kanan (320px):** Kartu Model "Gemini Vision Pro", Capabilities checklist (Pose Alignment, Face Retention, Garment Transfer), Inspector Hasil Foto Aktif, Tombol Download & Regenerate, Activity Meter (Total sessions, time saved).

---

### 7. Kriteria Pengujian (Quality Checklist)
- [ ] Tampilan UI mencerminkan visual Dark Purple Glassmorphism sesuai foto referensi.
- [ ] Slot 1 (Pose), Slot 2 (Orang), Slot 3 (Baju) dapat menerima drag & drop dan file upload dengan preview instan.
- [ ] Tombol hapus/ganti gambar di tiap slot upload berfungsi mulus.
- [ ] Selector background (Solid Color + Color Picker & Transparent) bekerja dinamis.
- [ ] Selector rasio (1:1, 3:4, 9:16) mengubah proporsi preview frame secara responsif.
- [ ] Tombol Generate menampilkan state loading, memproses via backend `/api/generate`.
- [ ] Hasil generate dapat diunduh (Download PNG) dan di-regenerate.
- [ ] Riwayat sesi tersimpan di sidebar dan dapat diklik untuk memuat ulang hasil sebelumnya.
- [ ] Responsive di layar desktop, tablet, dan smartphone.

--------------------------------------------------------------------------------
ZONA BAWAH: MASTER CONTEXT & LOGIKA SISTEM TERKINI (LIVING CONTEXT)
--------------------------------------------------------------------------------
- **Status Sistem:** Implementasi Penuh Selesai (v1.1.0).
- **Arsitektur Aktif:** Fullstack Frontend (Vanilla HTML5 + Modern CSS3 Glassmorphism + Vanilla JS ES6) + Server Proxy (Node.js/Express) + Dual Engine (OpenAI GPT-4o Vision + DALL·E 3 & Studio Simulation HD).
- **Berkas Kode Terdaftar:**
  - `index.html`: Tata letak antarmuka 3-kolom Dark Purple Glassmorphism, 3 slot upload, dan modal settings.
  - `styles.css`: Sistem desain Glassmorphism lengkap, backdrop blur, ambient cosmic glow, dan mobile responsive.
  - `app.js`: Logika interaktif upload, drag-and-drop, validasi, preview, pipeline OpenAI, download PNG, dan riwayat sesi.
  - `server.js`: Server hosting lokal & proxy backend OpenAI.
  - `package.json` & `.env.example`: Konfigurasi dependensi dan environment variable.
- **Log Pembaruan:** Seluruh fitur Outfit & Pose Swap Studio telah selesai dibangun sesuai cetak biru dan referensi visual.
