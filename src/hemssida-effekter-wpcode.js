// ═══════════════════════════════════════════════════════
//  VÄDER&KLÄDER – Visuella effekter på hemsidan
//  WPCode → JavaScript Snippet → Kör bara på framsidan
// ═══════════════════════════════════════════════════════

(function() {
  // Inject CSS
  var css = `
    /* ── VÄDER&KLÄDER logo/rubrik ── */
    .vk-logo {
      background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6, #3b82f6);
      background-size: 300% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: vk-logo-shift 4s ease infinite;
      display: inline-block;
    }
    @keyframes vk-logo-shift {
      0%   { background-position: 0% center; }
      50%  { background-position: 100% center; }
      100% { background-position: 0% center; }
    }

    /* ── Sociala länkar ── */
    .vk-social {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      border-radius: 999px;
      border: 1.5px solid rgba(99,102,241,0.25);
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
    }
    .vk-social::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.08));
      opacity: 0;
      transition: opacity 0.25s;
    }
    .vk-social:hover::before { opacity: 1; }
    .vk-social:hover {
      border-color: rgba(99,102,241,0.55);
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(99,102,241,0.18);
      text-decoration: none;
    }
    .vk-social-ig:hover { border-color: #e1306c; box-shadow: 0 4px 14px rgba(225,48,108,0.2); }
    .vk-social-fb:hover { border-color: #1877f2; box-shadow: 0 4px 14px rgba(24,119,242,0.2); }
    .vk-social-x:hover  { border-color: #000;    box-shadow: 0 4px 14px rgba(0,0,0,0.15); }

    /* ── Väderbaserade Klädförslag ── */
    .vk-hero {
      opacity: 0;
      animation: vk-hero-in 0.9s cubic-bezier(0.22,1,0.36,1) 0.2s forwards;
    }
    @keyframes vk-hero-in {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .vk-hero-word {
      display: inline-block;
      transition: color 0.2s, transform 0.2s;
    }
    .vk-hero-word:hover {
      color: #6366f1;
      transform: translateY(-3px);
    }
  `;

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function applyEffects() {

    // ── VÄDER&KLÄDER ─────────────────────────────────────
    document.querySelectorAll('a, h1, h2, h3, .site-title, .logo').forEach(function(el) {
      var txt = el.textContent.trim().replace(/\s+/g, '');
      if (txt === 'VÄDER&KLÄDER' || txt === 'VÄDER&amp;KLÄDER') {
        if (!el.querySelector('.vk-logo')) {
          el.innerHTML = '<span class="vk-logo">' + el.textContent + '</span>';
        }
      }
    });

    // ── Sociala länkar ────────────────────────────────────
    document.querySelectorAll('a').forEach(function(el) {
      var txt = el.textContent.trim();
      var href = (el.getAttribute('href') || '').toLowerCase();

      if (el.classList.contains('vk-social')) return;

      if (txt === 'Instagram' || href.includes('instagram.com')) {
        el.classList.add('vk-social', 'vk-social-ig');
        if (!el.querySelector('svg')) {
          el.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>' + txt;
        }
      } else if (txt === 'Facebook' || href.includes('facebook.com')) {
        el.classList.add('vk-social', 'vk-social-fb');
        if (!el.querySelector('svg')) {
          el.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>' + txt;
        }
      } else if ((txt === 'X' && (href.includes('x.com') || href.includes('twitter.com'))) || href.includes('twitter.com')) {
        el.classList.add('vk-social', 'vk-social-x');
        if (!el.querySelector('svg')) {
          el.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' + txt;
        }
      }
    });

    // ── Väderbaserade Klädförslag ─────────────────────────
    document.querySelectorAll('h1, h2, h3').forEach(function(el) {
      if (el.textContent.includes('Väderbaserade') && !el.classList.contains('vk-hero')) {
        el.classList.add('vk-hero');
        // Gör varje ord hover-bart
        el.innerHTML = el.textContent.split(' ').map(function(w) {
          return '<span class="vk-hero-word">' + w + '</span>';
        }).join(' ');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyEffects);
  } else {
    applyEffects();
  }
})();
