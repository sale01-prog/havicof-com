// HAVICO — scroll-driven storytelling on the home page (GSAP + ScrollTrigger).
// motion.js keeps the loader, cursor, Lenis and the card reveals; this file times the sections to the scroll.
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("gsap-on");
  const once = (trigger, start = "top 86%") => ({ trigger, start, once: true });
  // large mouse-driven screens get the slower, pinned "cinema" version of some sections; phones keep the light one
  const mm = gsap.matchMedia();
  const BIG = "(min-width: 961px) and (hover: hover) and (pointer: fine)";

  // keep ScrollTrigger in step with Lenis smooth scrolling
  const lenis = window.__lenis;
  if (lenis) lenis.on("scroll", ScrollTrigger.update);

  /* hero: as it scrolls away it shrinks into a rounded card and the text lifts off */
  const hero = $(".hero");
  if (hero) {
    const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
    gsap.fromTo(hero, { clipPath: "inset(0% 0% 0% 0% round 0px)" },
      { clipPath: "inset(6% 3% 0% 3% round 28px)", ease: "none", scrollTrigger: st });
    // the text lifts off only once it has been read and is leaving the top of the screen
    gsap.to(".hero-foot", { yPercent: -40, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: ".hero-foot", start: "top 15%", end: "bottom top", scrub: true } });
  }

  /* headings: each word rises out of its own mask */
  $$("main h2").forEach(h => {
    if (h.closest(".hero")) return;
    h.innerHTML = h.textContent.trim().split(/\s+/)
      .map(w => `<span class="w"><span>${w.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span></span>`).join(" ");
    h.setAttribute("aria-label", h.textContent);
    gsap.from($$(".w > span", h), { yPercent: 110, rotate: 3, duration: 1.2, ease: "expo.out", stagger: .05, scrollTrigger: once(h, "top 88%") });
  });
  $$("main .lead, .sec-head .link, .strip-nav, .steps-title, .partners h3").forEach(el => {
    if (el.closest(".hero")) return;
    gsap.from(el, { autoAlpha: 0, y: 24, duration: 1.1, ease: "expo.out", delay: .15, scrollTrigger: once(el, "top 92%") });
  });

  /* key figures: the rule draws across, then numbers count up to their value */
  const fmt = n => Math.round(n).toLocaleString("en-US");
  $$(".facts").forEach(box => {
    const tl = gsap.timeline({ scrollTrigger: once(box, "top 88%") });
    tl.fromTo(box, { "--rule": 0 }, { "--rule": 1, duration: 1.2, ease: "expo.inOut" });
    tl.from(box.children, { autoAlpha: 0, y: 26, duration: 1, ease: "expo.out", stagger: .08 }, "<.3");
    $$("b", box).forEach(b => {
      const m = b.textContent.match(/^([\d,]+)(.*)$/s);
      if (!m) return;
      const end = +m[1].replace(/,/g, ""), o = { v: 0 }, rest = m[2];
      b.textContent = "0" + rest;
      tl.to(o, { v: end, duration: 2, ease: "power3.out", onUpdate: () => b.textContent = fmt(o.v) + rest }, "<");
    });
  });

  /* six reasons: cells open from the bottom edge, one after another */
  $$(".why").forEach(g => gsap.from(g.children, {
    clipPath: "inset(100% 0% 0% 0%)", y: 30, duration: 1.2, ease: "expo.out", stagger: .07, scrollTrigger: once(g)
  }));

  /* order steps: one line runs through the sequence with the scroll; each step lights up as it is reached */
  const steps = $(".steps");
  if (steps) {
    const items = $$("li", steps);
    const paint = p => items.forEach((li, i) => {
      const f = gsap.utils.clamp(0, 1, p * items.length - i);
      li.style.setProperty("--f", f.toFixed(3));
      li.classList.toggle("on", f > 0);
    });
    paint(0);
    // big screens: the title and steps hold still while the line runs from the first step to the last
    const block = document.createElement("div");
    block.className = "steps-block";
    const title = steps.previousElementSibling;
    steps.before(block); block.append(title, steps);
    mm.add({ big: BIG }, ctx => {
      if (ctx.conditions.big) {
        ScrollTrigger.create({ trigger: block, start: "top top", end: () => "+=" + innerHeight * 1.2, pin: true, scrub: true, onUpdate: s => paint(s.progress) });
        gsap.from(items, { autoAlpha: 0, y: 60, duration: 1.4, ease: "expo.out", stagger: .12, scrollTrigger: once(block, "top 80%") });
      } else {
        ScrollTrigger.create({ trigger: steps, start: "top 85%", end: "bottom 45%", scrub: true, onUpdate: s => paint(s.progress) });
        gsap.from(items, { autoAlpha: 0, y: 30, duration: 1.1, ease: "expo.out", stagger: .09, scrollTrigger: once(steps) });
      }
    });
  }

  /* photographs: a blue panel wipes across, then the picture settles from a slight zoom */
  $$(".craft-img, .factory-grid img").forEach((el, i) => {
    const box = el.tagName === "IMG" ? el.parentElement : el;
    const img = el.tagName === "IMG" ? el : $("img", el);
    let holder = el;
    if (el.tagName === "IMG") {  // give each factory photo its own frame for the wipe
      holder = document.createElement("div");
      holder.className = "wipe-frame" + (el.classList.contains("big") ? " big" : "");
      box.insertBefore(holder, el); holder.appendChild(el); el.classList.remove("big");
    }
    holder.classList.add("wipe");
    const wipe = document.createElement("i");
    holder.appendChild(wipe);
    gsap.set(img, { autoAlpha: 0, scale: 1.25 });
    gsap.timeline({ scrollTrigger: once(holder, "top 85%"), delay: (i % 3) * .1 })
      .to(wipe, { scaleX: 1, duration: .7, ease: "expo.in" })
      .set(img, { autoAlpha: 1 })
      .set(wipe, { transformOrigin: "right" })
      .to(wipe, { scaleX: 0, duration: .9, ease: "expo.out" })
      .to(img, { scale: 1, duration: 1.6, ease: "expo.out" }, "<");
  });
  const craftImg = $(".craft-img img");
  const points = $$(".points > div, .checks li");
  mm.add({ big: BIG }, ctx => {
    if (ctx.conditions.big && craftImg) {
      // big screens: the section holds; the photo opens from a framed crop to its full size
      // while the four details come forward one after another
      gsap.timeline({ scrollTrigger: { trigger: ".craft", start: () => $(".craft").offsetHeight > innerHeight ? "top top" : "center center", end: () => "+=" + innerHeight * 1.3, pin: true, scrub: true } })
        .fromTo(".craft-img", { clipPath: "inset(14% 12% 14% 12% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 6px)", ease: "power2.inOut", duration: 1 }, 0)
        .fromTo(points, { autoAlpha: .15, x: 40 }, { autoAlpha: 1, x: 0, ease: "power2.out", duration: .35, stagger: .12 }, .1);
    } else {
      if (craftImg) gsap.fromTo(craftImg.parentElement, { yPercent: 6 }, { yPercent: -6, ease: "none",
        scrollTrigger: { trigger: ".craft", start: "top bottom", end: "bottom top", scrub: true } });
      points.forEach((el, i) =>
        gsap.from(el, { autoAlpha: 0, x: 30, duration: 1, ease: "expo.out", delay: (i % 4) * .08, scrollTrigger: once(el, "top 92%") }));
    }
  });

  /* big screens: the close-up photos travel sideways while the section holds */
  const strip = $("[data-scenes]");
  if (strip) mm.add(BIG, () => {
    const section = strip.closest("section");
    const dist = () => Math.max(0, strip.scrollWidth - strip.clientWidth);
    if (!dist()) return;
    strip.classList.add("is-driven");
    gsap.to(strip, { scrollLeft: dist, ease: "none", scrollTrigger: { trigger: section, start: "center center", end: () => "+=" + dist() * 1.1, pin: true, scrub: .6, invalidateOnRefresh: true } });
    return () => strip.classList.remove("is-driven");
  });

  /* big screens: the factory photos come forward from a smaller frame, like a camera pushing in */
  mm.add(BIG, () => {
    gsap.fromTo(".factory-grid", { scale: .84 }, { scale: 1, ease: "none",
      scrollTrigger: { trigger: ".factory-grid", start: "top bottom", end: "top 20%", scrub: true } });
  });

  /* certificates tip up into place; on a mouse they lean toward the pointer */
  const certs = $$(".cert-grid > div");
  if (certs.length) {
    gsap.from(certs, { autoAlpha: 0, y: 70, rotateX: -25, transformOrigin: "50% 100%", transformPerspective: 900,
      duration: 1.3, ease: "expo.out", stagger: .1, scrollTrigger: once(".cert-grid") });
    gsap.from(".badges img", { autoAlpha: 0, scale: .6, duration: .9, ease: "back.out(1.8)", stagger: .06, scrollTrigger: once(".badges", "top 90%") });
    if (fine) certs.forEach(c => {
      const rx = gsap.quickTo(c, "rotateX", { duration: .6, ease: "power3" }), ry = gsap.quickTo(c, "rotateY", { duration: .6, ease: "power3" });
      gsap.set(c, { transformPerspective: 900 });
      c.addEventListener("pointermove", e => {
        const r = c.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - .5) * 10); rx(-((e.clientY - r.top) / r.height - .5) * 10);
      });
      c.addEventListener("pointerleave", () => { rx(0); ry(0); });
    });
  }

  /* partner logos: an endless belt that speeds up and leans with the scroll */
  const logos = $(".logos");
  if (logos) {
    const track = document.createElement("div");
    track.className = "logos-track";
    track.append(...logos.children);
    track.innerHTML += track.innerHTML;  // two copies, wrapped at the halfway point
    $$("img", track).forEach((im, i) => i >= track.children.length / 2 && (im.alt = "", im.setAttribute("aria-hidden", "true")));
    logos.appendChild(track); logos.classList.add("belt");
    let x = 0, w = track.scrollWidth / 2;
    const measure = () => w = track.scrollWidth / 2;
    addEventListener("resize", measure); addEventListener("load", measure);
    let hover = false;
    logos.addEventListener("pointerenter", () => hover = true);
    logos.addEventListener("pointerleave", () => hover = false);
    const skew = gsap.quickTo(track, "skewX", { duration: .5, ease: "power3" });
    gsap.ticker.add(() => {
      const v = lenis ? lenis.velocity : 0;
      x -= (hover ? .15 : .6) + Math.abs(v) * .25;
      if (x <= -w) x += w;
      gsap.set(track, { x });
      skew(gsap.utils.clamp(-8, 8, -v * .3));
    });
  }

  /* catalogue band opens out from a narrow strip to full width */
  const band = $(".cat-band");
  if (band) {
    gsap.fromTo(band, { clipPath: "inset(0% 6% 0% 6% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
      scrollTrigger: { trigger: band, start: "top bottom", end: "top 45%", scrub: true } });
    gsap.from(".cat-band .btn", { scale: .6, autoAlpha: 0, duration: 1.2, ease: "back.out(1.6)", scrollTrigger: once(band, "top 75%") });
  }

  /* contact: form fields and details arrive in reading order */
  gsap.from(".quote > label, .quote > .actions", { autoAlpha: 0, y: 24, duration: 1, ease: "expo.out", stagger: .06, scrollTrigger: once(".quote", "top 88%") });
  gsap.from(".contact-list > div", { autoAlpha: 0, x: 40, duration: 1.1, ease: "expo.out", stagger: .08, scrollTrigger: once(".contact-list", "top 88%") });

  // pins change everything below them: put the triggers back in page order before measuring
  ScrollTrigger.sort(); ScrollTrigger.refresh();

  // images and fonts change section heights after load
  addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
