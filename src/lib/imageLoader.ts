// Optimized image loader for Cloudinary and other sources
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // If it's a Cloudinary URL, use their transformation API
  if (src.includes('res.cloudinary.com')) {
    const params = [`w_${width}`, `q_${quality || 75}`, 'f_auto', 'c_limit'];
    const baseUrl = src.split('/upload/')[0];
    const imagePath = src.split('/upload/')[1];
    return `${baseUrl}/upload/${params.join(',')}/${imagePath}`;
  }

  // For other sources, return as-is
  return src;
}

// Helper function to generate blur data URL
export function getBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) {
    // Server-side fallback
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWUiLz48L3N2Zz4=';
  }
  
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#eee';
    ctx.fillRect(0, 0, width, height);
  }
  return canvas.toDataURL();
}

// Utility to prefetch images
export function prefetchImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Lazy load images with Intersection Observer
export function lazyLoadImage(img: HTMLImageElement, src: string) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      });
    });
    observer.observe(img);
  } else {
    // Fallback for older browsers
    img.src = src;
  }
}
