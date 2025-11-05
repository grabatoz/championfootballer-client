# 🎯 Quick Start Guide

## Installation

```powershell
# Run setup script
.\setup.ps1
```

Or manually:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd api && npm install && cd ..

# Type check
npm run type-check
```

## Development

### Frontend
```bash
# Start with Turbopack (recommended)
npm run dev

# Start with Webpack
npm run dev:webpack
```

### Backend
```bash
cd api
npm run dev
```

## Production

### Build
```bash
# Build frontend
npm run build

# Build backend
cd api && npm run build
```

### Deploy
```bash
# Start production frontend
npm start

# Start production backend
cd api && npm start
```

## Key Features

✅ **Optimized Performance**
- Turbopack for fast development
- Code splitting for smaller bundles
- Smart caching strategies
- Image optimization

✅ **PWA Support**
- Service Worker for offline support
- Installable on mobile/desktop
- Auto-updates

✅ **Monitoring**
- Web Vitals tracking
- Performance metrics
- Error tracking

✅ **Security**
- Security headers
- CORS protection
- Rate limiting
- Input validation

## Performance Tips

1. **Use the bundle analyzer**
   ```bash
   npm run build:analyze
   ```

2. **Monitor Web Vitals**
   - Check browser console in production
   - LCP should be < 2.5s
   - FID should be < 100ms
   - CLS should be < 0.1

3. **Optimize Images**
   - Use next/image component
   - Provide dimensions
   - Use WebP/AVIF formats

4. **Cache Strategically**
   - Static assets: 1 year
   - API responses: 5-30 minutes
   - HTML: stale-while-revalidate

## Troubleshooting

**Build Errors?**
- Clear cache: `npm run clean && npm install`
- Check Node version: `node --version` (should be 18+)

**Slow Performance?**
- Run bundle analyzer
- Check Network tab in DevTools
- Monitor memory usage

**API Issues?**
- Check CORS configuration
- Verify environment variables
- Check API server logs

## Learn More

- [OPTIMIZATION-APPLIED.md](./OPTIMIZATION-APPLIED.md) - Complete optimization guide
- [Next.js Docs](https://nextjs.org/docs)
- [Web Vitals](https://web.dev/vitals/)

---

Happy Coding! 🚀
