# Nyan — Creative Producer

Flagship portfolio for **Nyan**, creative producer (commercials · film · music videos · events).
Built with [Astro](https://astro.build) (static output, near-zero JS), deployed to GitHub Pages
on the custom domain **[nyanproduction.me](https://nyanproduction.me)**.

> Immersive, minimalist, cinematic. The video is the design — everything else gets out of its way.

---

## Quick start

```bash
npm install
npm run dev        # local dev server → http://localhost:4321
npm run build      # static build → ./dist
npm run preview    # preview the production build
```

Requires Node 18.20+, 20.3+, or 22+ (CI uses Node 20). `ffmpeg` + `cwebp` are only needed
when **adding/optimizing video** (see below), not to run the site.

---

## How it's organised

```
src/
  data/
    videos.json     ← the work manifest (every clip + its metadata)   ★ edit content here
    site.js         ← brand name, contact, socials, filter categories ★ edit brand here
  styles/
    tokens.css      ← THE DESIGN SYSTEM (colors, type, spacing, motion) ★ retheme here
    global.css      ← reset + base typography + layout primitives
  components/        ← Nav, Hero, WorkGrid, WorkCard, Lightbox, About, Contact, Footer
  layouts/Base.astro ← <head>, SEO/OG/Twitter meta, JSON-LD, fonts
  scripts/main.js    ← all interactivity (nav, reveal, hover-preview, filters, lightbox) — 4.3 kB
  pages/index.astro  ← assembles the one page
public/
  media/poster/      ← poster stills (jpg + webp) — the LCP images, committed
  media/video/       ← optimized MP4s. Short clips are committed; long-form is gitignored
  CNAME, robots.txt, favicon.*, og-image.jpg, apple-touch-icon.png
```

### Where the design tokens live

**`src/styles/tokens.css`** is the single source of truth. Every color, font, type step,
spacing value, radius, and motion duration is a CSS custom property there. Components reference
those vars and never hard-code values, so a full retheme = editing that one file.

---

## Video strategy (important)

GitHub Pages is **not** a video host (≈100 MB/file hard limit, ~1 GB repo guidance,
~100 GB/mo bandwidth, and Git LFS is **not** reliably served). So:

- **Posters** (≈3 MB total) and **short clips** are served straight from the repo.
- **Long-form** (music videos, trailers, brand films, events) is served from **YouTube/Vimeo**
  unlisted embeds — their heavy local files are gitignored.

Each clip in `videos.json` carries both a local `src` and optional `youtube` / `vimeo` IDs.
The player **prefers the embed when an ID is set**, otherwise plays the local MP4. So the site
works fully in local preview, and you go live on the heavy pieces just by pasting IDs.

### To put a long-form clip live (YouTube/Vimeo)

1. Upload the **original** (or the optimized MP4) to YouTube/Vimeo as *unlisted*.
2. In `src/data/videos.json`, find the clip and set its `"youtube"` (the 11-char ID from
   `youtube.com/watch?v=XXXXXXXXXXX`) or `"vimeo"` (numeric ID).
3. Commit. The heavy local file stays out of the repo (already gitignored).

---

## Adding a new project / video

1. **Drop the source file** anywhere outside the repo (or in `_originals/`, which is gitignored).
2. **Optimize it** with the same recipe used for everything here:

   ```bash
   # Landscape → cap long edge at 1920 (1080p):
   ffmpeg -i "INPUT.mp4" -vf "scale='min(1920,iw)':-2:flags=lanczos" \
     -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p \
     -c:a aac -b:a 128k -movflags +faststart \
     "public/media/video/CATEGORY_client_descriptor_1080p.mp4"

   # Portrait → cap long edge (height) at 1920 (→ 1080×1920):
   ffmpeg -i "INPUT.mp4" -vf "scale=-2:'min(1920,ih)':flags=lanczos" \
     -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p \
     -c:a aac -b:a 128k -movflags +faststart \
     "public/media/video/CATEGORY_client_descriptor_4k-v.mp4"
   ```

3. **Make the poster** (jpg + webp):

   ```bash
   STEM="public/media/poster/CATEGORY_client_descriptor_1080p"
   ffmpeg -ss 00:00:01 -i "INPUT.mp4" -frames:v 1 \
     -vf "scale='if(gt(iw,ih),1280,-2)':'if(gt(iw,ih),-2,1280)'" -q:v 3 "$STEM.jpg"
   cwebp -q 80 "$STEM.jpg" -o "$STEM.webp"
   ```

4. **Register it** in `src/data/videos.json`:

   ```jsonc
   {
     "id": "commercial_client_descriptor_1080p",
     "title": "Client – Spot",
     "category": "commercial",      // commercial | film | mv | event
     "client": "Client", "role": "Creative Producer", "year": 2024,
     "blurb": "One-line description.",
     "orientation": "landscape",    // or "portrait"
     "width": 1920, "height": 1080,
     "duration": 30,
     "poster": "/media/poster/<id>.jpg",
     "posterWebp": "/media/poster/<id>.webp",
     "host": "local",               // "local" (in-repo) | "youtube" | "vimeo"
     "youtube": null, "vimeo": null,
     "src": "/media/video/<id>.mp4"
   }
   ```

   `width`/`height` drive the card's aspect ratio (no cropping) and the lightbox sizing.

### Naming convention

```
{category}_{client-or-title}_{descriptor}_{resolution}.{ext}
   commercial_bella_perfume_1080p.mp4
   mv_phyo-myat-aung_music-video_1080p.mp4
   event_new-age-creative_day-4_4k.mp4
```

lowercase · hyphenated · sortable · self-describing. Append `-v` to the resolution token for
vertical clips (e.g. `4k-v`), since a `1080p` landscape and a `1080p` vertical are different shapes.

---

## Optimization recipe (what was used here)

- **Codec:** H.264 (`libx264`), `-crf 23 -preset slow`, `-pix_fmt yuv420p`
- **Streaming:** `-movflags +faststart` (mandatory — enables progressive playback)
- **Audio:** AAC 128 kbps; stripped (`-an`) for the silent hero loop
- **Resolution:** capped to 1080p-class (long edge ≤ 1920); 4K/HEVC sources transcoded to H.264
- **Posters:** single frame, jpg `-q:v 3` + webp `cwebp -q 80`
- Raw library (~7.8 GB) → curated optimized set; ~3× reduction at 1080p.

The corrupt source `KH 1.mp4` ("moov atom not found") is excluded — re-export it from the original
to include that clip.

---

## Deployment (GitHub Pages + Namecheap)

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "Nyan portfolio"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

### 2. Enable Pages

Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The included workflow (`.github/workflows/deploy.yml`) builds Astro and deploys on every push to `main`.
The `public/CNAME` file (`nyanproduction.me`) is published automatically. Tick **Enforce HTTPS**.

### 3. DNS at Namecheap

Namecheap → Domain List → **Manage → Advanced DNS**. Remove any default parking records, then add:

| Type  | Host | Value                  | TTL       |
|-------|------|------------------------|-----------|
| A     | `@`  | `185.199.108.153`      | Automatic |
| A     | `@`  | `185.199.109.153`      | Automatic |
| A     | `@`  | `185.199.110.153`      | Automatic |
| A     | `@`  | `185.199.111.153`      | Automatic |
| CNAME | `www`| `<username>.github.io.`| Automatic |

Apex (`nyanproduction.me`) and `www` will both resolve to the site. DNS can take up to a few hours;
GitHub then issues the TLS cert (Enforce HTTPS may take a little longer to become available).

---

## Accessibility & performance notes

- Keyboard-navigable cards/lightbox, visible focus rings, focus trap + `Esc` to close, skip link.
- Every animation respects `prefers-reduced-motion` (hero shows a static poster; reveals/parallax off).
- LCP is the hero **poster**, not raw video; below-the-fold media is lazy-loaded; non-hero video is
  `preload="none"`/`"metadata"`. Client JS is ~4.3 kB (1.7 kB gzipped).
- `sitemap-index.xml`, `robots.txt`, Open Graph + Twitter cards, and `Person` JSON-LD are included.
