# Panduan Deployment Detail

## Persiapan Sebelum Deploy

1. Pastikan semua file ada:
   - `package.json`
   - `next.config.mjs`
   - `tsconfig.json`
   - Folder `app/`, `components/`, `lib/`

2. Test lokal dulu:
```bash
npm install
npm run build
npm start
```

## Deploy ke Vercel (Recommended)

### Kenapa Vercel?
- Gratis unlimited deploys
- Auto SSL certificate
- Global CDN
- Perfect untuk Next.js
- Zero configuration

### Cara Deploy:

#### Metode 1: Dari v0 (Paling Mudah)
1. Klik tombol "Publish" di v0
2. Ikuti instruksi
3. Done!

#### Metode 2: Via GitHub + Vercel
1. Push code ke GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/repo.git
git push -u origin main
```

2. Connect ke Vercel:
   - Buka [vercel.com](https://vercel.com)
   - Sign in dengan GitHub
   - Import repository
   - Klik Deploy

3. Auto-deploy setiap push:
   - Setiap kali push ke GitHub, otomatis deploy

#### Metode 3: Via Vercel CLI
```bash
# Install
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### Custom Domain di Vercel
1. Buka project di Vercel Dashboard
2. Settings → Domains
3. Add domain Anda
4. Update DNS sesuai instruksi
5. Done!

## Deploy ke Netlify

### Via Drag & Drop
1. Build project lokal:
```bash
npm run build
```

2. Buka [netlify.com](https://netlify.com)
3. Drag folder project ke dashboard
4. Done!

### Via GitHub
1. Push ke GitHub
2. New site from Git
3. Connect repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Deploy

### Via CLI
```bash
# Install
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

## Deploy ke Railway

### Kenapa Railway?
- $5 credit gratis per bulan
- Auto deploy dari GitHub
- Simple setup

### Cara Deploy:
1. Push ke GitHub
2. Buka [railway.app](https://railway.app)
3. New Project → Deploy from GitHub
4. Select repository
5. Railway auto-detect Next.js
6. Deploy

## Deploy ke Render

1. Push ke GitHub
2. Buka [render.com](https://render.com)
3. New → Static Site
4. Connect GitHub
5. Build command: `npm run build`
6. Publish directory: `.next`
7. Deploy

## Deploy Standalone HTML (index.html)

Jika hanya ingin deploy file `public/index.html`:

### GitHub Pages
1. Create repo di GitHub
2. Upload file `index.html` ke root
3. Settings → Pages
4. Source: main branch, root folder
5. Save
6. Website live di `username.github.io/repo-name`

### Netlify Drop
1. Buka [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag & drop file `index.html`
3. Done!

## Troubleshooting

### Error: "Command not found: next"
```bash
npm install
```

### Error: Build failed
```bash
# Clear cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Error: Module not found
```bash
npm install --legacy-peer-deps
```

### Port sudah digunakan
```bash
# Kill process di port 3000
npx kill-port 3000

# Atau gunakan port lain
PORT=3001 npm run dev
```

## Environment Variables di Production

### Vercel
1. Project Settings → Environment Variables
2. Add variables:
   - `NEXT_PUBLIC_CLICKDEALER_API_KEY`
   - `NEXT_PUBLIC_CLICKDEALER_AFFILIATE_ID`
3. Redeploy

### Netlify
1. Site Settings → Environment variables
2. Add variables
3. Redeploy

## Post-Deployment

1. Test website:
   - Buka URL production
   - Test semua fitur
   - Check console untuk errors

2. Setup custom domain (opsional)

3. Monitor performance:
   - Vercel Analytics (gratis)
   - Google Analytics

## Update Website

```bash
# Edit code
# Test lokal
npm run dev

# Push ke GitHub
git add .
git commit -m "Update dashboard"
git push

# Auto-deploy (jika connect dengan GitHub)
# Atau manual deploy via CLI
vercel --prod
```

## Tips

1. Gunakan Vercel untuk Next.js (paling optimal)
2. Test build lokal sebelum deploy
3. Monitor error di dashboard hosting
4. Setup custom domain untuk profesional
5. Enable analytics untuk tracking visitors

## Support

Jika ada masalah saat deploy, check:
1. Build logs di dashboard hosting
2. Browser console untuk JS errors
3. Network tab untuk API errors

---

Happy Deploying! 🚀
