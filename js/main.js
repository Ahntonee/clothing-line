/* =========================================
   FRANKO CLOTHING - Main JavaScript
   Cart, Scroll Reveal, Navigation, WhatsApp
   ========================================= */

/* WhatsApp number for the client */
const WHATSAPP_NUMBER = '2408605101'; 

/* =========================================
   CART STATE
   ========================================= */
let cart = JSON.parse(localStorage.getItem('franko_cart') || '[]');

/* Save cart to localStorage */
function saveCart() {
  localStorage.setItem('franko_cart', JSON.stringify(cart));
  updateCartUI();
}

/* Add item to cart */
function addToCart(name, price, category, imgSrc) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, category, imgSrc, qty: 1 });
  }
  saveCart();
  showCartFeedback(name);
}

/* Remove item from cart */
function removeFromCart(name) {
  cart = cart.filter(item => item.name !== name);
  saveCart();
}

/* Update item quantity */
function updateQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(name);
    else saveCart();
  }
}

/* Get cart total */
function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/* Get total item count */
function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

/* =========================================
   CART UI
   ========================================= */
function updateCartUI() {
  /* Update badge count on all pages */
  document.querySelectorAll('.cart-badge').forEach(badge => {
    const count = getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });

  /* Render cart items if sidebar exists */
  const cartItemsContainer = document.getElementById('cartItems');
  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <i class="bi bi-bag-x"></i>
        <p>Your cart is empty</p>
        <a href="/pages/shop.html" class="btn btn-outline" style="font-size:0.7rem;">Explore Collection</a>
      </div>`;
  } else {
    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          ${item.imgSrc
            ? `<img src="${item.imgSrc}" alt="${item.name}">`
            : `<div class="img-placeholder"><i class="bi bi-image"></i></div>`}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price.toLocaleString()}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="updateQty('${item.name}', -1)"><i class="bi bi-dash"></i></button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty('${item.name}', 1)"><i class="bi bi-plus"></i></button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.name}')">
          <i class="bi bi-trash"></i>
        </button>
      </div>`).join('');
  }

  /* Update total */
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) {
    totalEl.textContent = '$' + getCartTotal().toLocaleString();
  }
}

/* Show brief feedback toast when item added */
function showCartFeedback(name) {
  let toast = document.getElementById('cartToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cartToast';
    toast.style.cssText = `
      position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
      background:var(--dark); color:#fff; padding:0.8rem 1.6rem;
      font-size:0.78rem; letter-spacing:0.06em; z-index:9999;
      opacity:0; transition:opacity 0.3s ease; pointer-events:none;
      border-left:3px solid var(--gold);`;
    document.body.appendChild(toast);
  }
  toast.textContent = `"${name}" added to cart`;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

/* Open/close cart sidebar */
function openCart() {
  document.getElementById('cartSidebar')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* Checkout via WhatsApp */
function checkoutViaWhatsApp() {
  if (cart.length === 0) return;
  const items = cart.map(i => `• ${i.name} x${i.qty} — $${(i.price * i.qty).toLocaleString()}`).join('\n');
  const total = '$' + getCartTotal().toLocaleString();
  const message = `Hello FRANKO CLOTHING 👋\n\nI'd like to place an order:\n\n${items}\n\n*Total: ${total}*\n\nPlease provide payment details. Thank you!`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/* Direct "Buy Now" WhatsApp message */
function buyNow(name, price) {
  const message = `Hello FRANKO CLOTHING 👋\n\nI'm interested in purchasing:\n\n• *${name}* — $${price.toLocaleString()}\n\nPlease share payment details and further information. Thank you!`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/* =========================================
   MOTION PREFERENCE
   ========================================= */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =========================================
   SCROLL REVEAL
   Idempotent — safe to call again after new
   content is injected (shop / blog grids).
   ========================================= */
let _revealObserver = null;
let _revealScrollBound = false;

/* Reveal anything currently within (or above) the viewport. Acts as the
   fallback path when IntersectionObserver is unavailable or never fires
   (some embedded / headless webviews report a 0-height viewport). */
function _revealSweep() {
  const vh = window.innerHeight || document.documentElement.clientHeight || 900;
  document.querySelectorAll('.reveal[data-reveal-bound]:not(.visible)').forEach(el => {
    if (el.getBoundingClientRect().top < vh - 40) el.classList.add('visible');
  });
}

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal:not([data-reveal-bound])');
  if (!reveals.length) return;

  /* If the visitor prefers less motion, just show everything. */
  if (prefersReducedMotion()) {
    reveals.forEach(el => {
      el.classList.add('visible');
      el.setAttribute('data-reveal-bound', '');
    });
    return;
  }

  if (!_revealObserver && 'IntersectionObserver' in window) {
    _revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          _revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  reveals.forEach(el => {
    el.setAttribute('data-reveal-bound', '');

    /* Auto-stagger siblings that don't already carry an authored delay */
    if (!el.style.transitionDelay) {
      const sibs = el.parentElement
        ? Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'))
        : [];
      const idx = sibs.indexOf(el);
      if (idx > 0) {
        el.style.setProperty('--reveal-delay', (Math.min(idx, 6) * 0.08).toFixed(2) + 's');
      }
    }

    if (_revealObserver) _revealObserver.observe(el);
  });

  /* Fallback triggers — cover browsers/webviews where IntersectionObserver
     is unavailable or never fires, plus bfcache restores. */
  if (!_revealScrollBound) {
    _revealScrollBound = true;
    window.addEventListener('scroll', _revealSweep, { passive: true });
    window.addEventListener('resize', _revealSweep);
    window.addEventListener('load', _revealSweep);
    window.addEventListener('pageshow', _revealSweep);
  }
  requestAnimationFrame(_revealSweep);
  [150, 500, 1200].forEach(t => setTimeout(_revealSweep, t));

  /* Last resort: never leave content invisible. */
  setTimeout(() => {
    document.querySelectorAll('.reveal[data-reveal-bound]:not(.visible)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 900) * 1.5) el.classList.add('visible');
    });
  }, 3500);
}

/* =========================================
   NAVIGATION SCROLL EFFECT
   Condenses on scroll + hides on scroll-down,
   reappears on scroll-up.
   ========================================= */
function initNavScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      navbar.classList.toggle('scrolled', y > 40);

      if (!prefersReducedMotion()) {
        if (y > lastY && y > 320) {
          navbar.classList.add('nav-hidden');
        } else {
          navbar.classList.remove('nav-hidden');
        }
      }
      lastY = y;
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}

/* =========================================
   SCROLL PROGRESS BAR
   ========================================= */
function initScrollProgress() {
  if (document.querySelector('.scroll-progress')) return;
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* =========================================
   BACK TO TOP
   ========================================= */
function initBackToTop() {
  if (document.querySelector('.back-to-top')) return;
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<i class="bi bi-arrow-up"></i>';
  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
  });
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
}

/* =========================================
   PAGE TRANSITIONS
   Soft fade-out before navigating to another
   page on this site. Falls back safely.
   ========================================= */
function initPageTransitions() {
  /* Clear the leaving state if the page is restored from bfcache */
  window.addEventListener('pageshow', () => {
    document.body.classList.remove('page-leaving');
  });

  if (prefersReducedMotion()) return;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest('a');
    if (!a) return;

    const href = a.getAttribute('href');
    if (!href) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('javascript:')) return;
    if (a.hasAttribute('onclick')) return;

    let url;
    try { url = new URL(a.href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) return;

    e.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(() => { window.location.href = a.href; }, 250);
  });
}

/* Mobile hamburger toggle */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (!hamburger || !mobileNav) return;
  hamburger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
  /* Close when a link is clicked */
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileNav.classList.remove('open'));
  });
}

/* =========================================
   FILTER TABS (Shop page)
   ========================================= */
function initFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.product-card[data-category]');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.filter;

      cards.forEach(card => {
        if (cat === 'all' || card.dataset.category === cat) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* =========================================
   CART OVERLAY CLICK CLOSE
   ========================================= */
function initCartOverlay() {
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
}

/* =========================================
   ACTIVE NAV LINK HIGHLIGHT
   ========================================= */
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    if (link.getAttribute('href') && path.includes(link.getAttribute('href').replace('../', '').replace('./', ''))) {
      link.classList.add('active');
    }
  });
}

/* =========================================
   INIT ALL ON DOM READY
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initNavScroll();
  initMobileNav();
  initFilterTabs();
  initCartOverlay();
  setActiveNav();
  updateCartUI();
  initScrollProgress();
  initBackToTop();
  initPageTransitions();
});
