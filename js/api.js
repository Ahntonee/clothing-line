/* =========================================
   FRANKO CLOTHING — API Client
   Wraps Strapi REST API calls.
   Falls back to localStorage (store.js) when
   window.STRAPI_URL is empty.
   ========================================= */

const FrankoAPI = (() => {
  'use strict';

  function base() {
    return (window.STRAPI_URL || '').replace(/\/$/, '');
  }

  /* ── Normalise a product video from an upload URL and/or a pasted link ──
     Returns { videoType: 'file' | 'youtube' | 'vimeo' | '', video: <src> }
     - file   → direct URL for a <video> element (uploaded MP4 or direct link)
     - youtube/vimeo → an embeddable player URL for an <iframe>            */
  function parseVideo(uploadUrl, linkUrl) {
    if (uploadUrl) return { videoType: 'file', video: uploadUrl };

    const link = (linkUrl || '').trim();
    if (!link) return { videoType: '', video: '' };

    const yt = link.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
    );
    if (yt) return { videoType: 'youtube', video: `https://www.youtube.com/embed/${yt[1]}` };

    const vm = link.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return { videoType: 'vimeo', video: `https://player.vimeo.com/video/${vm[1]}` };

    /* Fall back to treating it as a direct video file URL */
    return { videoType: 'file', video: link };
  }

  /* ── Strapi response → flat product object ── */
  function toProduct(item) {
    const a   = item.attributes;
    const img = a.image?.data?.attributes ?? null;
    /* Prefer medium format, fall back to original */
    const url = img
      ? (img.formats?.medium?.url ?? img.formats?.small?.url ?? img.url ?? '')
      : '';

    const vid = a.video?.data?.attributes ?? null;
    const { videoType, video } = parseVideo(vid?.url ?? '', a.videoUrl ?? '');

    return {
      id:          String(item.id),
      name:        a.name        ?? '',
      price:       Number(a.price) || 0,
      category:    a.category    ?? 'suits',
      badge:       a.badge       ?? '',
      featured:    Boolean(a.featured),
      image:       url,
      description: a.description ?? '',
      video,
      videoType,
    };
  }

  /* ── Strapi response → flat blog post object ── */
  function toPost(item) {
    const a     = item.attributes;
    const cover = a.coverImage?.data?.attributes ?? null;
    const coverUrl = cover
      ? (cover.formats?.medium?.url ?? cover.formats?.small?.url ?? cover.url ?? '')
      : '';

    return {
      id:         String(item.id),
      title:      a.title    ?? '',
      slug:       a.slug     ?? '',
      excerpt:    a.excerpt  ?? '',
      content:    a.content  ?? '',
      coverImage: coverUrl,
      category:   a.category ?? '',
      date:       (a.publishedAt ?? a.createdAt ?? '').split('T')[0],
      published:  Boolean(a.publishedAt),
    };
  }

  /* ── Generic fetch ── */
  async function apiFetch(path) {
    const res = await fetch(`${base()}${path}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Strapi API ${res.status} — ${path}`);
    return res.json();
  }

  /* ── Public methods ── */

  async function getProducts() {
    /* No Strapi URL configured — use localStorage store */
    if (!base()) {
      return typeof window._storeGetProducts === 'function'
        ? window._storeGetProducts()
        : [];
    }
    try {
      const json = await apiFetch(
        '/api/products' +
        '?populate=*' +
        '&pagination[pageSize]=200' +
        '&sort=createdAt:asc' +
        '&publicationState=live'
      );
      return (json.data ?? []).map(toProduct);
    } catch (err) {
      console.warn('[FrankoAPI] Products fetch failed, using local store:', err.message);
      return typeof window._storeGetProducts === 'function'
        ? window._storeGetProducts()
        : [];
    }
  }

  async function getBlogPosts() {
    if (!base()) {
      return typeof window._storeGetBlogPosts === 'function'
        ? window._storeGetBlogPosts()
        : [];
    }
    try {
      const json = await apiFetch(
        '/api/blog-posts' +
        '?populate=coverImage' +
        '&pagination[pageSize]=100' +
        '&sort=publishedAt:desc' +
        '&publicationState=live'
      );
      return (json.data ?? []).map(toPost);
    } catch (err) {
      console.warn('[FrankoAPI] Blog fetch failed, using local store:', err.message);
      return typeof window._storeGetBlogPosts === 'function'
        ? window._storeGetBlogPosts()
        : [];
    }
  }

  return { getProducts, getBlogPosts };
})();
