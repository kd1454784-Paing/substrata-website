/* =========================================================
   SUBSTRATA — shared site script
   Header, footer, cart (localStorage), language, motion and
   per-page logic. Each HTML page sets <body data-page="...">.
   Load order: i18n.js → data.js → main.js
   ========================================================= */

/* ---------- helpers ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const yen = n => "¥ " + Math.round(n).toLocaleString("ja-JP");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const JP = LANG === "ja";
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- cart (localStorage) ---------- */
const CART_KEY = "substrata-cart";
const Cart = {
  get() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  },
  save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateBagCount(true);
  },
  add(id, format = "print", frame = "black", qty = 1) {
    const items = Cart.get();
    const key = `${id}|${format}|${format === "psd" ? "-" : frame}`;
    const found = items.find(i => i.key === key);
    if (found) found.qty = format === "psd" ? 1 : found.qty + qty;
    else items.push({ key, id, format, frame: format === "psd" ? "-" : frame, qty: format === "psd" ? 1 : qty });
    Cart.save(items);
  },
  setQty(key, qty) {
    Cart.save(Cart.get().map(i => (i.key === key ? { ...i, qty: Math.max(1, Math.min(10, qty)) } : i)));
  },
  remove(key) { Cart.save(Cart.get().filter(i => i.key !== key)); },
  clear() { Cart.save([]); },
  count() { return Cart.get().reduce((n, i) => n + i.qty, 0); },
  unitPrice(item) { return PRICES[item.format]; },
  subtotal() { return Cart.get().reduce((s, i) => s + Cart.unitPrice(i) * i.qty, 0); },
  needsShipping() { return Cart.get().some(i => i.format === "print"); }
};
const taxIncluded = total => total - total / (1 + TAX_RATE);

const FRAME_NAMES = { black: "Black", white: "White", natural: "Natural oak" };
const frameName = f => t(FRAME_NAMES[f] || f);
const itemDesc = i => i.format === "psd"
  ? t("PSD file · Digital download")
  : `A4 · ${frameName(i.frame)} ${t("frame")}`;

/* =========================================================
   PAGE TRANSITIONS
   The curtain that lifts on load is pure CSS (body::before).
   On leaving, we drop a curtain in, then navigate.
   ========================================================= */
function transitionTo(url) {
  if (REDUCED) { location.href = url; return; }
  let c = $(".curtain-in");
  if (!c) {
    c = document.createElement("div");
    c.className = "curtain-in";
    c.innerHTML = "<span>SUBSTRATA</span>";
    document.body.append(c);
  }
  requestAnimationFrame(() => c.classList.add("go"));
  setTimeout(() => {
    if (url === location.href) location.reload();
    else location.href = url;
  }, 520);
}

document.addEventListener("click", e => {
  const a = e.target.closest("a[href]");
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  if (a.target === "_blank" || a.hasAttribute("download")) return;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
  const url = new URL(a.href, location.href);
  if (url.protocol !== location.protocol || url.host !== location.host) return;
  // same page, only the hash differs → let the browser scroll
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
  e.preventDefault();
  transitionTo(url.href);
});
// coming back with the back button: remove the exit curtain
window.addEventListener("pageshow", e => { if (e.persisted) $(".curtain-in")?.remove(); });

/* ---------- header & footer ---------- */
function langToggleHTML() {
  return `<button class="lang-toggle" type="button" aria-label="${JP ? "Switch to English" : "日本語に切り替え"}">
    <span class="${JP ? "" : "on"}" data-lang="en">EN</span><i>/</i><span class="${JP ? "on" : ""}" data-lang="ja">日本語</span>
  </button>`;
}

function renderHeader() {
  const page = document.body.dataset.page;
  const link = (href, label, key, extra = "") =>
    `<a href="${href}" class="${page === key ? "active" : ""}"><span class="roll" data-text="${t(label)}">${t(label)}</span>${extra}</a>`;
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a href="index.html" class="logo" aria-label="SUBSTRATA home">SUBSTRATA<sup>✦</sup></a>
    <nav class="nav" aria-label="Main">
      ${link("shop.html", "Works", "shop", `<sup>(${PRODUCTS.length})</sup>`)}
      ${link("collections.html", "Collections", "collections")}
      ${link("index.html#archive", "Archive", "archive")}
      ${link("about.html", "About", "about")}
    </nav>
    <div class="clock" id="clock"></div>
    <div class="header-tools">
      <a href="shop.html" class="search" aria-label="Search works">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="m11 11 4 4"/></svg>
      </a>
      ${langToggleHTML()}
      <a href="cart.html" class="bag-link">
        <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 5h12l-1 10H2L1 5Z"/><path d="M4.5 5V3.5a2.5 2.5 0 0 1 5 0V5"/></svg>
        <span class="bag-word">${t("BAG")} </span>(<span class="bag-count">00</span>)
      </a>
    </div>
    <button class="menu-btn" aria-expanded="false" aria-controls="mobile-menu">${t("MENU")}</button>`;
  document.body.prepend(header);

  const menu = document.createElement("div");
  menu.className = "mobile-menu";
  menu.id = "mobile-menu";
  menu.innerHTML = `
    <nav>
      <a href="shop.html" style="--i:0">${t("Works")} <span>(${PRODUCTS.length})</span></a>
      <a href="collections.html" style="--i:1">${t("Collections")} <span>(04)</span></a>
      <a href="index.html#archive" style="--i:2">${t("Archive")} <span>→</span></a>
      <a href="about.html" style="--i:3">${t("About")} <span>→</span></a>
      <a href="cart.html" style="--i:4">${t("Bag")} <span>(<span class="bag-count">00</span>)</span></a>
    </nav>
    <div class="menu-foot">${langToggleHTML()}<span class="mono muted">Instagram — Are.na</span></div>`;
  header.after(menu);

  const btn = $(".menu-btn", header);
  const closeMenu = () => {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = t("MENU");
    document.body.style.overflow = "";
  };
  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
    btn.textContent = open ? t("CLOSE") : t("MENU");
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$("a", menu).forEach(a => a.addEventListener("click", closeMenu));

  $$(".lang-toggle").forEach(b => b.addEventListener("click", e => {
    const picked = e.target.closest("[data-lang]")?.dataset.lang;
    const next = picked || (JP ? "en" : "ja");
    if (next !== LANG) setLang(next);
  }));

  // hide header on scroll down, show on scroll up
  let lastY = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    header.classList.toggle("hide", y > lastY && y > 300 && !menu.classList.contains("open"));
    header.classList.toggle("scrolled", y > 10);
    lastY = y;
  }, { passive: true });

  updateBagCount();
  tickClock();
  setInterval(tickClock, 30000);
}

function tickClock() {
  const el = $("#clock");
  if (!el) return;
  const tm = tz => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  el.textContent = `${t("TOKYO")} ${tm("Asia/Tokyo")} — ${t("BERLIN")} ${tm("Europe/Berlin")}`;
}

function updateBagCount(bump = false) {
  const n = pad(Cart.count());
  $$(".bag-count").forEach(el => {
    el.textContent = n;
    if (bump && !REDUCED) {
      const link = el.closest(".bag-link") || el.closest("a");
      link?.classList.remove("bump");
      void link?.offsetWidth;
      link?.classList.add("bump");
    }
  });
}

function renderFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="footer-top">
      <div>
        <div class="eyebrow" data-i18n>( Transmissions )</div>
        <h2 class="serif serif-l" style="margin:14px 0 0" data-i18n>Letters from<br>below the surface.</h2>
      </div>
      <form class="newsletter" id="newsletter">
        <input type="email" required placeholder="your@email.jp" data-i18n-ph aria-label="Email address">
        <button type="submit" data-i18n>Subscribe</button>
      </form>
    </div>
    <div class="footer-cols">
      <div><h4 data-i18n>SHOP</h4><a href="shop.html" data-i18n>All Works</a><a href="collections.html" data-i18n>Collections</a><a href="shop.html?format=psd" data-i18n>PSD Files</a><a href="#" data-i18n>Gift Cards</a></div>
      <div><h4 data-i18n>INFO</h4><a href="#" data-i18n>Shipping &amp; Returns</a><a href="#" data-i18n>Print Care</a><a href="#" data-i18n>Editions &amp; COA</a><a href="#" data-i18n>FAQ</a></div>
      <div><h4 data-i18n>ELSEWHERE</h4><a href="#">Instagram</a><a href="#">Are.na</a><a href="#">Behance</a><a href="#">Newsletter</a></div>
      <div><h4 data-i18n>STUDIO</h4><span>Basement Studio 3</span><span data-i18n>Kobe ⟷ Berlin</span><a href="mailto:studio@substrata.art">studio@substrata.art</a><span data-i18n>By appointment only</span></div>
    </div>
    <div class="footer-word" aria-hidden="true">${"SUBSTRATA".split("").map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join("")}</div>
    <div class="footer-bottom">
      <span data-i18n>© 2026 SUBSTRATA — Independent underground art</span>
      <span data-i18n>Printed in small numbers. Never restocked.</span>
      <span data-i18n>Privacy — Terms — Imprint</span>
    </div>`;
  document.body.append(footer);

  $("#newsletter").addEventListener("submit", e => {
    e.preventDefault();
    e.target.reset();
    toast(t("You’re on the list. Drops land 24h early."));
  });
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, withLink = false) {
  let el = $(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.innerHTML = `<span>${msg}</span>${withLink ? `<a href="cart.html">${t("View bag →")}</a>` : ""}`;
  el.classList.remove("show");
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("show")));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

/* ---------- shared components ---------- */
function stockText(p) {
  if (p.stock === 0) return t("SOLD OUT");
  if (p.stock <= 35) return JP ? `${t("LEFT")} ${p.stock}` : `${p.stock} LEFT`;
  return t("AVAILABLE");
}

function cardHTML(p, opts = {}) {
  const sold = p.stock === 0;
  const remain = p.stock && p.stock <= 35 ? (JP ? ` 残り ${p.stock}/50` : ` ${p.stock} of 50 remain.`) : "";
  return `
    <a class="card ${sold ? "is-sold" : ""} reveal" href="product.html?id=${p.id}" data-cursor="${JP ? "見る" : "View"}">
      <div class="card-meta mono"><span class="num">N°${p.no}</span><span>A4 — ${sold ? t("PSD ONLY") : t("FRAMED")}</span></div>
      <div class="card-img">
        <img src="${IMG + p.image}" alt="${esc(p.name)} poster" loading="lazy">
        ${sold ? "" : `<button class="card-quick" data-add="${p.id}" type="button"><span>${t("Add to bag")}</span><span>+</span></button>`}
      </div>
      <div class="card-row">
        <h3 class="display">${esc(p.name)}</h3>
        ${sold ? `<span class="sold-label">${t("SOLD OUT")}</span>` : `<span class="price">${yen(PRICES.print)}</span>`}
      </div>
      ${opts.noText ? "" : `<p class="small muted">${esc(tf(p, "short"))}${remain}</p>`}
    </a>`;
}

/* quick add buttons inside cards (event delegation) */
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const p = getProduct(btn.dataset.add);
  Cart.add(p.id, "print", "black", 1);
  toast(JP ? `${p.name}（A4 額装）${t("added")}` : `${p.name} — A4 framed added`, true);
  flyToBag(btn.closest(".card-img")?.querySelector("img"));
}, true);

function archiveHTML(list) {
  return list.map((p, i) => `
    <a class="archive-row reveal" style="--d:${i * 50}ms" href="product.html?id=${p.id}" data-img="${IMG + p.image}">
      <span>${p.no}</span>
      <span class="title">${esc(p.name)}</span>
      <span class="date">${p.date}</span>
      <span class="fmt">A4</span>
      <span class="ed">50</span>
      <span class="st ${p.stock === 0 ? "sold" : ""}">${stockText(p)}</span>
      <span class="p">${p.stock === 0 ? "—" : yen(PRICES.print)}</span>
    </a>`).join("");
}

/* archive hover preview that trails the cursor smoothly */
function initArchivePreview(container) {
  if (!FINE_POINTER) return;
  let img = $(".archive-preview");
  if (!img) {
    img = document.createElement("img");
    img.className = "archive-preview";
    img.alt = "";
    document.body.append(img);
  }
  let x = 0, y = 0, cx = 0, cy = 0, running = false;
  const loop = () => {
    cx += (x - cx) * 0.18;
    cy += (y - cy) * 0.18;
    const tilt = Math.max(-12, Math.min(12, (x - cx) * 0.08));
    img.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) rotate(${3 + tilt}deg)`;
    if (running) requestAnimationFrame(loop);
  };
  $$(".archive-row", container).forEach(row => {
    row.addEventListener("mouseenter", e => {
      img.src = row.dataset.img;
      img.classList.add("show");
      if (!running) { cx = x = e.clientX + 160; cy = y = e.clientY; running = true; loop(); }
    });
    row.addEventListener("mouseleave", () => { img.classList.remove("show"); running = false; });
    row.addEventListener("mousemove", e => { x = e.clientX + 160; y = e.clientY; });
  });
}

/* =========================================================
   MOTION
   ========================================================= */

/* scroll reveals (cards, rows, headings, images) */
let revealObserver;
function initReveal() {
  // auto-add the rise effect to big headings
  $$(".section-head .display, .chapter-head .display, .page-head .display, .about-hero .display").forEach(el => el.classList.add("rise"));
  // stagger siblings inside grids
  $$(".grid, .selected .col, .method, .stats, .timeline, .chapter-index").forEach(g => {
    [...g.children].forEach((c, i) => { if (!c.style.getPropertyValue("--d")) c.style.setProperty("--d", `${(i % 4) * 90}ms`); });
  });

  const els = $$(".reveal:not(.in), .rise:not(.in), .wipe:not(.in)");
  if (REDUCED || !("IntersectionObserver" in window)) return els.forEach(el => el.classList.add("in"));
  revealObserver ||= new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      revealObserver.unobserve(en.target);
      if (en.target.matches("[data-count]")) countUp(en.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach(el => revealObserver.observe(el));
  $$("[data-count]:not(.in)").forEach(el => revealObserver.observe(el));
}

/* numbers that count up when they come into view */
function countUp(el) {
  const end = Number(el.dataset.count);
  const width = el.textContent.trim().length;
  if (REDUCED || !end) return;
  const start = performance.now();
  const dur = 1400;
  const step = now => {
    const k = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - k, 4);
    el.textContent = String(Math.round(end * eased)).padStart(width, "0");
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* split a word into letters for the hero intro */
function splitLetters(el) {
  const text = el.textContent;
  el.setAttribute("aria-label", text);
  el.innerHTML = text.split("").map((ch, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${ch}</span>`).join("");
}

/* hero: letters rise in, then parallax on scroll */
function initHero() {
  const hero = $(".hero");
  if (!hero) return;
  $$(".hero-word", hero).forEach(splitLetters);
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add("ready")));
  if (REDUCED) return;

  const after = $(".hero-word.after", hero);
  const burn = $(".hero-word.burn", hero);
  const poster = $(".hero-poster", hero);
  let ticking = false;
  const update = () => {
    const y = Math.min(scrollY, innerHeight * 1.2);
    after.style.translate = `${-y * 0.25}px ${y * 0.1}px`;
    burn.style.translate = `${y * 0.25}px ${-y * 0.05}px`;
    poster.style.translate = `0 ${y * 0.18}px`;
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });

  // poster tilts toward the mouse
  if (FINE_POINTER) {
    hero.addEventListener("mousemove", e => {
      const r = hero.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      poster.style.transform = `perspective(1200px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg)`;
    });
    hero.addEventListener("mouseleave", () => { poster.style.transform = ""; });
  }
}

/* marquee follows the scroll direction and speeds up with scroll speed */
function initMarquee() {
  const track = $(".marquee-track");
  if (!track || REDUCED || !track.getAnimations) return;
  const anim = track.getAnimations()[0];
  if (!anim) return;
  let lastY = scrollY, speed = 1, dir = 1, raf;
  const settle = () => {
    speed += (1 - speed) * 0.06;
    anim.playbackRate = speed * dir;
    if (Math.abs(speed - 1) > 0.01) raf = requestAnimationFrame(settle);
  };
  addEventListener("scroll", () => {
    const dy = scrollY - lastY;
    lastY = scrollY;
    if (dy !== 0) dir = dy > 0 ? 1 : -1;
    speed = Math.min(5, 1 + Math.abs(dy) * 0.08);
    cancelAnimationFrame(raf);
    settle();
  }, { passive: true });
}

/* custom cursor (desktop only) */
function initCursor() {
  if (!FINE_POINTER || REDUCED) return;
  const dot = document.createElement("div");
  dot.className = "cursor";
  dot.innerHTML = "<span></span>";
  document.body.append(dot);
  document.documentElement.classList.add("has-cursor");
  let x = -100, y = -100, cx = x, cy = y;
  addEventListener("mousemove", e => { x = e.clientX; y = e.clientY; }, { passive: true });
  const loop = () => {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    dot.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  };
  loop();
  document.addEventListener("mouseover", e => {
    const card = e.target.closest("[data-cursor]");
    const link = e.target.closest("a, button, label, summary, select, input, textarea");
    const onButton = !!e.target.closest("button");
    dot.classList.toggle("label", !!card && !onButton);
    dot.classList.toggle("link", (!card || onButton) && !!link);
    $("span", dot).textContent = card && !onButton ? card.dataset.cursor : "";
  });
  document.addEventListener("mouseleave", () => dot.classList.add("gone"));
  document.addEventListener("mouseenter", () => dot.classList.remove("gone"));
}

/* magnetic pull on the big buttons (desktop only) */
function initMagnetic() {
  if (!FINE_POINTER || REDUCED) return;
  document.addEventListener("mousemove", e => {
    const b = e.target.closest(".btn");
    $$(".btn.magnet").forEach(x => { if (x !== b) { x.classList.remove("magnet"); x.style.translate = ""; } });
    if (!b) return;
    const r = b.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    b.classList.add("magnet");
    b.style.translate = `${dx * 0.12}px ${dy * 0.25}px`;
  }, { passive: true });
}

/* little poster that flies into the bag when you add to cart */
function flyToBag(fromImg) {
  const bag = $(".bag-link");
  if (!fromImg || !bag || REDUCED || !bag.offsetParent) return;
  const a = fromImg.getBoundingClientRect();
  const b = bag.getBoundingClientRect();
  const ghost = fromImg.cloneNode();
  ghost.className = "fly";
  ghost.removeAttribute("loading");
  Object.assign(ghost.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
  document.body.append(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  ghost.animate([
    { transform: "translate(0,0) scale(1)", opacity: 1 },
    { transform: `translate(${dx}px, ${dy}px) scale(.04) rotate(12deg)`, opacity: .4 }
  ], { duration: 750, easing: "cubic-bezier(.6,0,.2,1)" }).onfinish = () => ghost.remove();
}

/* =========================================================
   PAGES
   ========================================================= */
const Pages = {

  /* ---------- HOME ---------- */
  home() {
    const featured = getProduct("phantom-glint");
    $("#feature").innerHTML = `
      <a class="card reveal" href="product.html?id=${featured.id}" data-cursor="${JP ? "見る" : "View"}">
        <div class="card-img"><img src="${IMG + featured.image}" alt="Phantom Glint poster"></div>
      </a>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <h3 class="display feature-title rise">Phantom<br>Glint</h3>
        <div style="text-align:right;margin-top:20px"><div class="mono ember">N°${featured.no}</div><div class="price">${yen(PRICES.print)}</div><div class="mono muted" style="font-size:9px">${t("A4 — 50 prints")}</div></div>
      </div>
      <p class="serif serif-m fog reveal" style="margin:0">${esc(tf(featured, "text"))}</p>`;

    const pick = ids => ids.map(id => cardHTML(getProduct(id))).join("");
    $("#col-2").innerHTML = pick(["everything-hurts", "treat-me"]);
    $("#col-3").innerHTML = pick(["afterburn", "wild-frequencies"]);

    const archive = $("#archive-list");
    archive.innerHTML = archiveHTML([...PRODUCTS].sort((a, b) => b.no - a.no).slice(0, 8));
    initArchivePreview(archive);

    // In the wild slider (buttons + drag on desktop)
    const track = $("#wild-track");
    const counter = $("#wild-count");
    const total = $$("figure", track).length;
    const w = () => $("figure", track).offsetWidth + 20;
    $("#wild-prev").addEventListener("click", () => track.scrollBy({ left: -w(), behavior: "smooth" }));
    $("#wild-next").addEventListener("click", () => track.scrollBy({ left: w(), behavior: "smooth" }));
    track.addEventListener("scroll", () => {
      const i = Math.min(total, Math.round(track.scrollLeft / w()) + 1);
      counter.textContent = `${pad(i)} / ${pad(total)}`;
    }, { passive: true });
    let down = false, sx = 0, sl = 0;
    track.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; sx = e.clientX; sl = track.scrollLeft; track.classList.add("dragging"); e.preventDefault(); });
    addEventListener("pointerup", () => { if (!down) return; down = false; track.classList.remove("dragging"); });
    addEventListener("pointermove", e => { if (down) track.scrollLeft = sl - (e.clientX - sx); });
  },

  /* ---------- SHOP ---------- */
  shop() {
    const params = new URLSearchParams(location.search);
    const state = {
      collection: params.get("collection") || "all",
      format: params.get("format") || "all",
      sort: "newest",
      view: "grid"
    };
    $("#count").textContent = `(${PRODUCTS.length})`;

    const chips = $("#chips");
    chips.innerHTML = [`<button class="chip" data-col="all">${t("All")}</button>`]
      .concat(COLLECTIONS.map(c => `<button class="chip" data-col="${c.id}">${esc(c.name)}</button>`)).join("");

    const render = () => {
      $$(".chip", chips).forEach(c => c.classList.toggle("active", c.dataset.col === state.collection));
      $$("[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === state.view));
      let list = PRODUCTS.filter(p => state.collection === "all" || p.collection === state.collection);
      if (state.format === "print") list = list.filter(p => p.stock > 0);
      const sorters = {
        newest: (a, b) => b.no - a.no,
        oldest: (a, b) => a.no - b.no,
        name: (a, b) => a.name.localeCompare(b.name),
        scarce: (a, b) => (a.stock || 99) - (b.stock || 99)
      };
      list.sort(sorters[state.sort]);

      const out = $("#results");
      if (!list.length) {
        out.className = "grid";
        out.innerHTML = `<p class="empty-note mono">${t("Nothing in this chapter yet.")}</p>`;
      } else if (state.view === "index") {
        out.className = "archive";
        out.innerHTML = archiveHTML(list);
        initArchivePreview(out);
      } else {
        out.className = "grid cols-4";
        const cards = list.map(p => cardHTML(p));
        if (cards.length > 4) {
          cards.splice(4, 0, `
            <div class="interlude reveal">
              <div class="wipe"><img src="${IMG}mock-wall.jpg" alt="Phantom Glint installed on a tiled wall" loading="lazy"></div>
              <div>
                <div class="eyebrow">${t("( Interlude )")}</div>
                <p class="serif serif-l" style="margin:16px 0">${t("“The poster is the only light in the room.”")}</p>
                <div class="mono muted">${t("Phantom Glint — installed, Osaka line")}</div>
              </div>
            </div>`);
        }
        out.innerHTML = cards.join("");
      }
      $("#shown").textContent = `${pad(list.length)} / ${pad(PRODUCTS.length)} ${t("works shown")}`;
      initReveal();
    };

    chips.addEventListener("click", e => {
      const b = e.target.closest(".chip");
      if (!b) return;
      state.collection = b.dataset.col;
      render();
    });
    $("#sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
    $("#format").value = state.format;
    $("#format").addEventListener("change", e => { state.format = e.target.value; render(); });
    $$("[data-view]").forEach(b => b.addEventListener("click", () => { state.view = b.dataset.view; render(); }));
    render();
  },

  /* ---------- PRODUCT ---------- */
  product() {
    const id = new URLSearchParams(location.search).get("id") || "afterburn";
    const p = getProduct(id) || getProduct("afterburn");
    const col = getCollection(p.collection);
    const sold = p.stock === 0;
    document.title = `${p.name} — SUBSTRATA`;

    const state = { format: sold ? "psd" : "print", frame: "black", qty: 1 };
    const gallery = p.gallery;
    const [w1, w2] = p.name.toUpperCase().split(/ (.+)/);

    $("#pdp").innerHTML = `
      <div class="pdp-gallery">
        <div class="full wipe"><img src="${IMG + p.image}" alt="${esc(p.name)} poster"></div>
        ${gallery.slice(0, 2).map(g => `<div class="half wipe"><img src="${IMG + g}" alt="${esc(p.name)} detail" loading="lazy"></div>`).join("")}
        ${gallery[2] ? `<div class="full wipe"><img src="${IMG + gallery[2]}" alt="${esc(p.name)} in situ" loading="lazy" style="aspect-ratio:4/3"></div>` : ""}
      </div>
      <aside class="pdp-info">
        <div class="crumbs"><a href="index.html">${t("Home")}</a> / <a href="collections.html#${col.id}">${esc(col.name)}</a> / ${esc(p.name)}</div>
        <div class="mono ember" style="margin-top:28px">N°${p.no} — ${p.date}</div>
        <h1 class="display pdp-title rise">${w1}${w2 ? "<br>" + w2 : ""}</h1>
        <div class="pdp-price">
          <span class="price" id="pdp-price">${yen(PRICES[state.format])}</span>
          <span class="tag ${sold ? "sold" : ""}">${sold ? t("Print sold out") : (JP ? `残り ${p.stock} / 50` : `${p.stock} of 50 remain`)}</span>
        </div>
        <p class="serif serif-m fog" style="margin:0">${esc(tf(p, "text"))}</p>

        <div class="opt-label mono muted"><span>${t("Format")}</span><span>${t("Tax incl.")}</span></div>
        <div class="opt-group" id="opt-format">
          <button class="opt" data-format="print" ${sold ? "disabled" : ""}><b>${t("A4 Print")}</b><span>${t("Framed")} — ${yen(PRICES.print)}</span></button>
          <button class="opt" data-format="psd"><b>${t("PSD File")}</b><span>${t("Layered source")} — ${yen(PRICES.psd)}</span></button>
        </div>

        <div id="frame-wrap">
          <div class="opt-label mono muted"><span>${t("Frame finish")}</span><span>A4 — 21 × 29.7 cm</span></div>
          <div class="opt-group three" id="opt-frame">
            ${["black", "white", "natural"].map(f => `<button class="opt" data-frame="${f}"><b>${frameName(f)}</b><span>${t("Included")}</span></button>`).join("")}
          </div>
        </div>

        <div class="buy-row">
          <div class="qty" id="qty-wrap"><button type="button" data-q="-1" aria-label="Less">−</button><span id="qty">01</span><button type="button" data-q="1" aria-label="More">+</button></div>
          <button class="btn btn-ember" id="add"><span id="add-label"></span><span class="arrow">→</span></button>
        </div>
        <div class="pdp-sub mono muted" style="font-size:10px"><span>${t("♡ Add to wishlist")}</span><span>${t("Ships flat in 3–7 days")}</span></div>

        <div class="accordion">
          <details open><summary>${t("Details")}</summary><div class="acc-body"><p>${t("Pigment print on 308gsm cotton rag, edition of fifty, signed and numbered by hand. The PSD file is the full layered source, delivered as an instant download after payment.")}</p></div></details>
          <details><summary>${t("Paper &amp; print")}</summary><div class="acc-body"><p>${t("Archival pigment inks on 308gsm cotton rag. A4 (210 × 297 mm), framed behind glass with a 2 cm border.")}</p></div></details>
          <details><summary>${t("Shipping &amp; Returns")}</summary><div class="acc-body"><p>${t("Yamato Transport")} ${yen(SHIPPING.yamato.price)} (1–2 ${t("days")}) / ${t("Japan Post")} ${yen(SHIPPING.post.price)} (3–5 ${t("days")}). ${t("14-day returns on prints. Digital files are non-refundable.")}</p></div></details>
          <details><summary>${t("Certificate of authenticity")}</summary><div class="acc-body"><p>${t("Every print carries a numbered certificate signed in pencil.")}</p></div></details>
        </div>
      </aside>`;

    $("#specs").innerHTML = [
      ["Number", p.no], ["Medium", t("Pigment / cotton rag")], ["Weight", "308 GSM"],
      ["Edition", "50"], ["Signed", t("Yes, pencil")], ["Studio", t("Kobe, JP")]
    ].map(([k, v], i) => `<div class="reveal" style="--d:${i * 70}ms"><div class="mono muted">${t(k)}</div><div class="display">${v}</div></div>`).join("");

    $("#quote").textContent = JP ? `「${tf(p, "quote") || tf(p, "text")}」` : `“${p.quote || p.text}”`;
    $("#quote-img").src = IMG + (gallery[0] || p.image);

    const related = PRODUCTS.filter(x => x.id !== p.id && x.collection === p.collection)
      .concat(PRODUCTS.filter(x => x.id !== p.id && x.collection !== p.collection)).slice(0, 3);
    $("#related").innerHTML = related.map(r => cardHTML(r)).join("");
    $("#related-link").href = `collections.html#${col.id}`;
    $("#related-link").textContent = `${col.name} — ${t("all works →")}`;

    const sync = () => {
      $$("#opt-format .opt").forEach(b => b.classList.toggle("active", b.dataset.format === state.format));
      $$("#opt-frame .opt").forEach(b => b.classList.toggle("active", b.dataset.frame === state.frame));
      const isPrint = state.format === "print";
      $("#frame-wrap").classList.toggle("collapsed", !isPrint);
      $("#qty-wrap").style.visibility = isPrint ? "" : "hidden";
      if (!isPrint) state.qty = 1;
      $("#qty").textContent = pad(state.qty);
      $("#pdp-price").textContent = yen(PRICES[state.format]);
      $("#add-label").textContent = `${isPrint ? t("Acquire now") : t("Buy PSD")} — ${yen(PRICES[state.format] * state.qty)}`;
    };
    $("#opt-format").addEventListener("click", e => { const b = e.target.closest(".opt"); if (b) { state.format = b.dataset.format; sync(); } });
    $("#opt-frame").addEventListener("click", e => { const b = e.target.closest(".opt"); if (b) { state.frame = b.dataset.frame; sync(); } });
    $("#qty-wrap").addEventListener("click", e => {
      const b = e.target.closest("[data-q]");
      if (!b) return;
      state.qty = Math.max(1, Math.min(Math.min(10, p.stock || 1), state.qty + Number(b.dataset.q)));
      sync();
    });
    $("#add").addEventListener("click", () => {
      Cart.add(p.id, state.format, state.frame, state.qty);
      const what = state.format === "psd" ? t("PSD File") : `A4 · ${frameName(state.frame)}`;
      toast(JP ? `${p.name}（${what}）${t("added")}` : `${p.name} — ${what} added`, true);
      flyToBag($(".pdp-gallery img"));
    });
    sync();

    // lightbox
    const lb = $("#lightbox");
    $$(".pdp-gallery img").forEach(img => img.addEventListener("click", () => {
      $("img", lb).src = img.src;
      lb.classList.add("open");
    }));
    lb.addEventListener("click", () => lb.classList.remove("open"));
    document.addEventListener("keydown", e => { if (e.key === "Escape") lb.classList.remove("open"); });
  },

  /* ---------- COLLECTIONS ---------- */
  collections() {
    $("#chapter-index").innerHTML = COLLECTIONS.map((c, i) => {
      const n = PRODUCTS.filter(p => p.collection === c.id).length;
      return `<a href="#${c.id}" class="reveal"><div class="mono muted">( 0${i + 1} )</div><div class="display d-s" style="margin-top:10px">${esc(c.name)}</div><div class="mono muted" style="margin-top:8px">${pad(n)} ${t("works")}</div></a>`;
    }).join("");

    $("#chapters").innerHTML = COLLECTIONS.map((c, i) => {
      const works = PRODUCTS.filter(p => p.collection === c.id);
      const meta = JP
        ? `${pad(works.length)} 作品 — ${tf(c, "period")} — ${yen(PRICES.print)}から`
        : `${pad(works.length)} works — ${c.period} — from ${yen(PRICES.print)}`;
      return `
        <section class="chapter" id="${c.id}">
          <div class="chapter-head">
            <div>
              <div class="eyebrow">( 0${i + 1} ) — ${t("Chapter")}</div>
              <h2 class="display d-l" style="margin-top:12px">${esc(c.name)}</h2>
            </div>
            <div class="reveal">
              <p class="lead" style="margin:0 0 16px">${esc(tf(c, "text"))}</p>
              <div class="mono muted">${meta}</div>
            </div>
          </div>
          <div class="grid">${works.map(p => cardHTML(p)).join("")}</div>
          <div style="margin-top:48px"><a class="link-arrow" href="shop.html?collection=${c.id}">${JP ? `${esc(c.name)} を見る →` : `Shop ${esc(c.name)} →`}</a></div>
        </section>`;
    }).join("");
  },

  /* ---------- CART ---------- */
  cart() {
    const root = $("#cart-root");

    // reservation timer (15 min, resets per visit)
    let left = 15 * 60;
    setInterval(() => {
      const el = $("#timer");
      if (!el) return;
      left = Math.max(0, left - 1);
      el.textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
    }, 1000);

    const render = () => {
      const items = Cart.get();
      $("#bag-n").textContent = `(${pad(Cart.count())})`;
      if (!items.length) {
        const ab = getProduct("afterburn");
        root.innerHTML = `
          <div class="empty-state">
            <h2 class="display d-l rise">${t("Nothing here. Yet.")}</h2>
            <p>${t("Your bag is as empty as a gallery at 4am. Editions don’t wait —")} ${ab.stock} ${t("prints of Afterburn remain.")}</p>
            <a class="btn btn-ember" href="shop.html"><span>${t("Enter the archive")}</span><span class="arrow">→</span></a>
          </div>`;
        initReveal();
        return;
      }
      const sub = Cart.subtotal();
      const firstPrint = items.find(i => i.format === "print");
      const hasPsdOf = id => items.some(i => i.id === id && i.format === "psd");
      const upsellP = firstPrint && !hasPsdOf(firstPrint.id) ? getProduct(firstPrint.id) : null;
      const upsellText = upsellP && (JP
        ? `${esc(upsellP.name)} のレイヤー付きPSDを ${yen(PRICES.psd)} で追加 — お支払い後すぐにダウンロード。`
        : `Get the layered PSD of ${esc(upsellP.name)} for ${yen(PRICES.psd)} — instant download after payment.`);

      root.innerHTML = `
        <div class="cart-layout">
          <div>
            <div class="mono" style="margin-bottom:28px">${t("Editions reserved for")} <span class="timer" id="timer">15:00</span></div>
            <div class="cart-head mono"><span>${t("Work")}</span><span>${t("Price")}</span><span>${t("Qty")}</span><span style="text-align:right">${t("Total")}</span></div>
            ${items.map(i => {
              const p = getProduct(i.id);
              const unit = Cart.unitPrice(i);
              return `
                <div class="cart-item">
                  <div class="work">
                    <a href="product.html?id=${p.id}"><img src="${IMG + p.image}" alt="${esc(p.name)}"></a>
                    <div>
                      <div class="mono ember">N°${p.no}</div>
                      <div class="display">${esc(p.name)}</div>
                      <div class="small muted">${itemDesc(i)}${i.format === "print" ? ` · ${t("Ed. of 50")}` : ""}</div>
                      <button class="remove" data-remove="${i.key}">${t("Remove ×")}</button>
                    </div>
                  </div>
                  <span class="price unit">${yen(unit)}</span>
                  ${i.format === "psd"
                    ? `<span class="mono muted">01</span>`
                    : `<div class="qty"><button data-key="${i.key}" data-d="-1" aria-label="Less">−</button><span>${pad(i.qty)}</span><button data-key="${i.key}" data-d="1" aria-label="More">+</button></div>`}
                  <span class="price line">${yen(unit * i.qty)}</span>
                </div>`;
            }).join("")}
            ${upsellP ? `
              <div class="upsell">
                <span class="small">${upsellText}</span>
                <button class="btn btn-ghost" style="height:48px" data-upsell="${upsellP.id}"><span>${t("Add PSD")}</span><span>+</span></button>
              </div>` : ""}
            <label class="gift"><input type="checkbox" id="gift"> ${t("THIS IS A GIFT — HIDE PRICES, ADD A HANDWRITTEN NOTE")}</label>
            <textarea class="gift-note" id="gift-note" placeholder="${t("Your note (we write it by hand)")}"></textarea>
          </div>
          <aside class="summary">
            <h3 class="display d-xs" style="margin:0 0 16px">${t("Summary")}</h3>
            <div class="sum-row"><span>${t("Subtotal")}</span><span class="price">${yen(sub)}</span></div>
            <div class="sum-row"><span>${t("Shipping")}</span><span class="small muted">${Cart.needsShipping() ? (JP ? `${yen(SHIPPING.post.price)}〜（${t("chosen at checkout")}）` : `from ${yen(SHIPPING.post.price)}, chosen at checkout`) : t("Digital — free")}</span></div>
            <div class="promo"><input id="promo" placeholder="${t("Promo code")}"><button id="promo-btn" type="button">${t("APPLY")}</button></div>
            <div class="sum-row total"><span class="label">${t("Total")}</span><span class="price">${yen(sub)}</span></div>
            <div class="small muted" style="text-align:right">${t("Includes")} ${yen(taxIncluded(sub))} ${t("consumption tax (10%)")}</div>
            <a class="btn btn-ember btn-block" href="checkout.html" style="margin-top:20px"><span>${t("Checkout")}</span><span class="arrow">→</span></a>
            <div class="mono muted" style="margin-top:14px;font-size:9px;line-height:1.8">${t("Secure — Visa · Mastercard · Amex · Apple Pay · Konbini")}</div>
            <ul class="assure">
              <li>${t("Ships flat in a rigid archival folder, 3–7 days.")}</li>
              <li>${t("14-day returns on prints.")}</li>
              <li>${t("Every print carries a numbered certificate.")}</li>
            </ul>
          </aside>
        </div>`;

      const gift = $("#gift");
      gift.checked = localStorage.getItem("substrata-gift") === "1";
      $("#gift-note").classList.toggle("show", gift.checked);
      $("#gift-note").value = localStorage.getItem("substrata-gift-note") || "";
      gift.addEventListener("change", () => {
        localStorage.setItem("substrata-gift", gift.checked ? "1" : "0");
        $("#gift-note").classList.toggle("show", gift.checked);
      });
      $("#gift-note").addEventListener("input", e => localStorage.setItem("substrata-gift-note", e.target.value));
      $("#promo-btn").addEventListener("click", () => toast(t("That code isn’t valid (promo codes are placeholders)")));
    };

    root.addEventListener("click", e => {
      const rm = e.target.closest("[data-remove]");
      const q = e.target.closest("[data-d]");
      const up = e.target.closest("[data-upsell]");
      if (rm) {
        rm.closest(".cart-item").classList.add("leaving");
        setTimeout(() => { Cart.remove(rm.dataset.remove); render(); }, REDUCED ? 0 : 320);
      }
      if (q) {
        const item = Cart.get().find(i => i.key === q.dataset.key);
        Cart.setQty(item.key, item.qty + Number(q.dataset.d));
        render();
      }
      if (up) { Cart.add(up.dataset.upsell, "psd"); toast(t("PSD file added")); render(); }
    });
    render();
  },

  /* ---------- CHECKOUT ---------- */
  checkout() {
    const items = Cart.get();
    if (!items.length) { location.href = "cart.html"; return; }
    const needsShip = Cart.needsShipping();

    // Japanese prefecture names (same order as the English list in checkout.html)
    if (JP) {
      const PREF_JA = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];
      $$("#pref option").slice(1).forEach((o, i) => { o.textContent = PREF_JA[i]; });
      $("#pref option").textContent = t("Select…");
    }

    $("#shipping-block").style.display = needsShip ? "" : "none";
    $("#ship-options").innerHTML = Object.entries(SHIPPING).map(([k, s], i) => `
      <label class="ship-opt">
        <input type="radio" name="ship" value="${k}" ${i === 0 ? "checked" : ""}>
        <span><b>${JP ? t(s.label) : s.label.toUpperCase()}</b><span class="small">${t(s.note)}</span></span>
        <span class="price">${s.price ? yen(s.price) : t("FREE")}</span>
      </label>`).join("");

    $("#side-items").innerHTML = items.map(i => {
      const p = getProduct(i.id);
      return `
        <div class="side-item">
          <img src="${IMG + p.image}" alt="">
          <div><div class="display">${esc(p.name)}</div><div class="small muted">${itemDesc(i)}${i.format === "print" ? ` · ×${i.qty}` : ""}</div></div>
          <span class="price">${yen(Cart.unitPrice(i) * i.qty)}</span>
        </div>`;
    }).join("");
    $("#side-n").textContent = `(${pad(Cart.count())})`;

    const totals = () => {
      const sub = Cart.subtotal();
      const shipKey = needsShip ? $("input[name=ship]:checked").value : null;
      const ship = shipKey ? SHIPPING[shipKey].price : 0;
      const total = sub + ship;
      $("#t-sub").textContent = yen(sub);
      $("#t-ship").textContent = needsShip ? (ship ? yen(ship) : t("FREE")) : t("Digital — free");
      $("#t-tax").textContent = yen(taxIncluded(total));
      $("#t-total").textContent = yen(total);
      $("#pay-label").textContent = JP ? `${yen(total)} を${t("Pay")}` : `Pay ${yen(total)}`;
      return total;
    };
    $("#ship-options").addEventListener("change", totals);
    totals();

    $$(".express button").forEach(b => b.addEventListener("click", () => toast(t("Express pay is a demo — fill in the form below"))));

    $("#checkout-form").addEventListener("submit", e => {
      e.preventDefault();
      const form = e.target;
      let ok = true;
      $$(".field", form).forEach(f => {
        const input = $("input, select", f);
        if (!input || !input.offsetParent) return;
        const valid = input.checkValidity();
        f.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        toast(t("Please check the highlighted fields"));
        const first = $(".field.invalid", form);
        first?.classList.remove("shake");
        void first?.offsetWidth;
        first?.classList.add("shake");
        $("input, select", first)?.focus();
        return;
      }
      const total = totals();
      const order = "SUB-" + Date.now().toString(36).toUpperCase().slice(-6);
      const email = $("#email").value;
      Cart.clear();
      $("#checkout-root").innerHTML = `
        <section class="success">
          <div class="eyebrow">${t("Order")} ${order}</div>
          <h1 class="display d-xl rise" style="margin:16px 0 24px">${t("It’s yours.")}</h1>
          <p class="lead fog">${JP
            ? `${t("Thank you.")} ${yen(total)} ${t("received (demo — no real payment was taken). Your edition numbers will be confirmed at")} <b>${esc(email)}</b>`
            : `Thank you. ${yen(total)} received (demo — no real payment was taken). Your edition numbers will be confirmed at <b>${esc(email)}</b> within the hour.`}</p>
          <p class="serif serif-m" style="margin:40px 0">${t("“Hang it somewhere it can watch you.”")}</p>
          <a class="btn btn-ember" href="shop.html"><span>${t("Back to the archive")}</span><span class="arrow">→</span></a>
        </section>`;
      window.scrollTo(0, 0);
      initReveal();
    });

    $("#card")?.addEventListener("input", e => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    });
    $("#exp")?.addEventListener("input", e => {
      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
      e.target.value = v.length > 2 ? v.slice(0, 2) + " / " + v.slice(2) : v;
    });
  },

  about() {}
};

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  renderHeader();
  if (page !== "checkout") renderFooter();
  applyI18n();
  if (Pages[page]) Pages[page]();
  initHero();
  initReveal();
  initMarquee();
  initCursor();
  initMagnetic();
});
