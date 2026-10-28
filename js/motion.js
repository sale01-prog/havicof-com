// HAVICO — motion and small UX helpers. The hero intro itself is pure CSS.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  // loading screen: fills as the first-screen images and fonts arrive, then lifts away
  const loader = $(".loader");
  if (loader && !document.documentElement.classList.contains("seen")) {
    const bar = $(".bar i", loader), pct = $(".pct", loader), t0 = performance.now();
    const imgs = $$("img").filter(i => i.getBoundingClientRect().top < innerHeight && !i.closest(".loader"));
    const jobs = [...imgs.map(i => i.decode ? i.decode().catch(() => {}) : Promise.resolve()), document.fonts ? document.fonts.ready : Promise.resolve()];
    let done = 0;
    const show = p => { bar.style.setProperty("--p", p); pct.textContent = Math.round(p * 100) + "%"; };
    jobs.forEach(j => j.then(() => show(.08 + .92 * (++done / jobs.length))));
    const finish = () => {
      show(1);
      setTimeout(() => {
        loader.classList.add("done");
        document.documentElement.classList.remove("is-loading");
        try { sessionStorage.setItem("hv-seen", "1"); } catch (e) {}
        setTimeout(() => loader.remove(), 1200);
      }, Math.max(250, 900 - (performance.now() - t0)));  // long enough to read, never longer than needed
    };
    Promise.race([Promise.all(jobs), new Promise(r => setTimeout(r, 2600))]).then(finish);
  } else if (loader) loader.remove();

  // smooth, inertial scrolling (skipped when the visitor prefers less motion)
  let lenis = null;
  if (!still && window.Lenis) {
    lenis = new Lenis({ lerp: .085, wheelMultiplier: .9 });
    window.__lenis = lenis;
    $$('a[href^="#"], a[href*=".html#"]').forEach(a => a.addEventListener("click", e => {
      const url = new URL(a.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const t = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!t) return;
      e.preventDefault(); history.replaceState(null, "", url.hash);
      lenis.scrollTo(t, { offset: -72, duration: 1.4 });
    }));
  }

  // home header: fixed and solid once the hero has scrolled away
  const nav = $(".nav:not(.nav-solid)"), hero = $(".hero");
  const stick = () => nav && hero && nav.classList.toggle("is-stuck", scrollY > hero.offsetHeight - 80);
  stick();

  // pointer state shared by the effects below
  const ptr = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0, inHero: false };
  addEventListener("pointermove", e => {
    ptr.x = e.clientX; ptr.y = e.clientY;
    ptr.nx = e.clientX / innerWidth - .5; ptr.ny = e.clientY / innerHeight - .5;
    if (ring && ring.style.opacity) ring.style.opacity = "";  // back after leaving the window
  }, { passive: true });
  if (hero) {
    hero.addEventListener("pointerenter", () => ptr.inHero = true);
    hero.addEventListener("pointerleave", () => ptr.inHero = false);
  }

  // soft cursor: a ring that trails the pointer and turns into a label over products
  let ring = null;
  if (fine) {
    ring = document.createElement("div");
    ring.className = "cursor"; ring.setAttribute("aria-hidden", "true");
    ring.innerHTML = "<span></span>";
    document.body.appendChild(ring);
    const label = $("span", ring);
    const setMode = el => {
      const card = el && el.closest(".card, .cat, .strip a"), zoom = el && el.closest(".gallery-main");
      const hot = el && el.closest("a, button, [role=button], .chip");
      ring.className = "cursor" + (card ? " is-view" : zoom ? " is-zoom" : hot ? " is-hot" : "");
      label.textContent = card ? "View" : zoom ? "Zoom" : "";
    };
    document.addEventListener("pointerover", e => setMode(e.target));
    document.addEventListener("pointerdown", () => ring.classList.add("is-down"));
    document.addEventListener("pointerup", () => ring.classList.remove("is-down"));
    document.documentElement.addEventListener("pointerleave", () => ring.style.opacity = 0);
    document.documentElement.addEventListener("pointerenter", () => ring.style.opacity = "");
  }

  // magnetic buttons: pulled a little toward the pointer, eased back on leave
  if (fine) $$(".btn-solid, .round, .quick a").forEach(b => {
    b.addEventListener("pointermove", e => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - r.left - r.width / 2) * .25}px ${(e.clientY - r.top - r.height / 2) * .35}px`;
    });
    b.addEventListener("pointerleave", () => b.style.translate = "");
  });

  // product photos drift toward the pointer inside their tile
  if (fine) document.addEventListener("pointermove", e => {
    const ph = e.target.closest && e.target.closest(".card .ph, .cat");
    $$(".card .ph.tilt, .cat.tilt").forEach(el => { if (el !== ph) { el.classList.remove("tilt"); el.style.removeProperty("--mx"); el.style.removeProperty("--my"); } });
    if (!ph) return;
    const r = ph.getBoundingClientRect();
    ph.classList.add("tilt");
    ph.style.setProperty("--mx", ((e.clientX - r.left) / r.width - .5).toFixed(3));
    ph.style.setProperty("--my", ((e.clientY - r.top) / r.height - .5).toFixed(3));
  }, { passive: true });

  // one animation loop: smooth scroll, eased cursor, hero depth
  const stage = $(".hero-stage"), flute = !fine && $(".flute");
  const fw0 = flute ? flute.offsetWidth / flute.parentElement.offsetWidth * 100 : 0;  // the width site.css gives it
  const s = { cx: ptr.x, cy: ptr.y, py: 0, tx: 0, ty: 0, fw: fw0 };
  const frame = t => {
    if (lenis) lenis.raf(t);
    if (ring) {
      s.cx = lerp(s.cx, ptr.x, .2); s.cy = lerp(s.cy, ptr.y, .2);
      ring.style.transform = `translate3d(${s.cx}px, ${s.cy}px, 0)`;
    }
    if (stage) {
      // scroll parallax moves on its own, so it stays off for reduced motion; the pointer tilt follows the visitor
      if (!still) s.py = lerp(s.py, Math.min(scrollY, innerHeight * 1.2), .12);
      const k = fine && ptr.inHero ? (still ? .4 : 1) : 0;
      s.tx = lerp(s.tx, ptr.nx * k, .06); s.ty = lerp(s.ty, ptr.ny * k, .06);
      stage.style.setProperty("--py", s.py.toFixed(1) + "px");
      stage.style.setProperty("--tx", s.tx.toFixed(4));
      stage.style.setProperty("--ty", s.ty.toFixed(4));
    }
    if (flute) {
      // full width at the top, fully drawn back after 40% of a screen of scrolling
      s.fw = lerp(s.fw, fw0 * Math.max(0, 1 - scrollY / (innerHeight * .4)), .15);
      flute.style.width = s.fw.toFixed(2) + "%";
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // reveal sections once as they enter the viewport (a fade only when the visitor prefers less motion)
  const groups = $$(".sec-head, .cats, .grid, .strip, .craft-grid, .factory-grid, .facts, .partner-grid, .scenes, .page-head");
  let pending = [];
  groups.forEach(g => {
    const kids = g.matches(".cats, .grid, .strip, .facts, .factory-grid, .scenes, .craft-grid, .partner-grid") ? [...g.children] : [g];
    kids.forEach((el, i) => { el.setAttribute("data-reveal", ""); el.style.setProperty("--i", Math.min(i, 7)); pending.push(el); });
  });
  document.documentElement.classList.add("reveal-on");
  // anything that has reached the viewport, or been jumped past (anchor links), is shown
  const check = () => {
    pending = pending.filter(el => el.getBoundingClientRect().top < innerHeight * .92 ? (el.classList.add("in"), false) : true);
  };
  let queued = false;
  addEventListener("scroll", () => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; check(); stick(); });
  }, { passive: true });
  check();
  const grid = $("[data-grid]");
  if (grid) new MutationObserver(() => $$("[data-reveal]", grid).forEach(el => el.classList.add("in"))).observe(grid, { childList: true });

  // close-up strip: arrow buttons scroll one photo at a time
  $$("[data-strip]").forEach(b => b.addEventListener("click", () => {
    const strip = $("[data-scenes]"), step = strip.firstElementChild ? strip.firstElementChild.offsetWidth + 12 : 300;
    strip.scrollBy({ left: step * +b.dataset.strip, behavior: still ? "auto" : "smooth" });
  }));

  // mobile menu closes after choosing a link
  $$(".nav ul a").forEach(a => a.addEventListener("click", () => {
    const n = a.closest(".nav"); n.classList.remove("open"); $(".menu-btn", n)?.setAttribute("aria-expanded", "false");
  }));

  // quick contact: phone and WhatsApp, always one tap away
  const q = document.createElement("div");
  q.className = "quick";
  q.innerHTML = `<a href="tel:+84704898888" aria-label="Call +84 704 898 888"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1z"/></svg></a>
    <a href="https://wa.me/840704898888" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.4.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4z"/></svg></a>`;
  document.body.appendChild(q);
  if (fine) $$("a", q).forEach(b => {
    b.addEventListener("pointermove", e => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - r.left - r.width / 2) * .3}px ${(e.clientY - r.top - r.height / 2) * .3}px`;
    });
    b.addEventListener("pointerleave", () => b.style.translate = "");
  });
})();
