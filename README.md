# AuraStudio — Outfit & Pose Swap Studio (AI Fashion Studio)

Aplikasi web modern berdesain **Deep Purple Glassmorphism** (terinspirasi dari konsep ChatGPT Dark Purple UI) yang menggabungkan 3 gambar referensi (*Pose*, *Orang*, dan *Baju*) menjadi 1 foto studio fotorealistik menggunakan arsitektur **OpenAI GPT-4o Vision + DALL·E 3**.

---

## ✨ Fitur Utama
1. **3 Slot Input Gambar:**
   - **Input Pose:** Meniru postur tubuh, gesture tangan, dan sudut kamera.
   - **Input Orang:** Mempertahankan 100% wajah, identitas, warna kulit, dan gaya rambut.
   - **Input Baju:** Memasang pakaian presisi hingga detail tekstur kain, potongan, dan motif.
2. **Studio Controls:**
   - **Studio Lighting Presets:** *Softbox Commercial*, *Vogue Editorial*, *Rembrandt Cinematic*, dan *Cyber Violet*.
   - **Aspect Ratio Selector:** *1:1 Square*, *3:4 Portrait*, *9:16 Story/Reels*.
   - **Background Selector:** *Transparent PNG* (alpha bersih) atau *Solid Studio Color* dengan color picker interaktif.
3. **Eksekusi AI Cerdas (Dual Engine Mode):**
   - **Mode OpenAI API:** Memanfaatkan `gpt-4o` Vision untuk sintesis master prompt anatomi dan pose, lalu `dall-e-3` merender foto HD.
   - **Mode Studio Ultra-Simulation:** Memungkinkan demonstrasi cepat dengan katalog foto komersial HD tanpa memerlukan kuota API.
4. **Output Inspector:**
   - Bingkai foto aktif dengan adaptasi rasio dinamis.
   - Tombol **Download PNG** beresolusi tinggi.
   - Tombol **Regenerate** untuk variasi pencahayaan.
   - Lightbox / Fullscreen Zoom.
5. **Riwayat Sesi (Recent Sessions):**
   - Tersimpan otomatis di browser (`localStorage`) dan dapat dipanggil kembali secara instan.
6. **Mobile-Responsive First:**
   - Drawer geser mulus di tablet dan smartphone.

---

## 🚀 Cara Menjalankan

### Cara 1: Buka Langsung di Browser (Tanpa Instalasi Apapun)
Aplikasi ini dirancang *zero-dependency* di sisi frontend. Cukup:
1. Klik ganda file `index.html` atau buka melalui browser (Google Chrome, Microsoft Edge, Firefox).
2. Klik tombol **"Load Demo Samples"** untuk langsung mencoba simulasi studio 3 gambar.
3. Masukkan `OPENAI_API_KEY` di menu **Studio Settings** (ikon gear di kanan atas) jika ingin menghubungkan langsung ke OpenAI API Anda.

### Cara 2: Menjalankan via Node.js Server (Opsional)
Jika Anda memiliki Node.js di komputer:
1. Salin `.env.example` menjadi `.env` dan masukkan `OPENAI_API_KEY=...` Anda.
2. Jalankan perintah:
   ```bash
   npm install
   npm start
   ```
3. Buka browser di `http://localhost:3000`.
