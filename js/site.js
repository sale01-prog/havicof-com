// HAVICO — havicof.com. Product data comes from data/products.json via js/data.js (window.HV).
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  // The CMS can leave fields empty (null) and new products have no family, so fill the gaps;
  // family is the first word of the name, like gen_data.py. Products without a photo are skipped.
  const P = ((window.HV && window.HV.products) || [])
    .map(p => ({ ...p, cover: p.cover || "cutout", scenes: p.scenes || [], details: p.details || [],
      variants: (p.variants || []).map(v => ({ ...v, label: v.label || "", images: v.images || [] })).filter(v => v.images.length),
      family: p.family || (p.name || "").split(" ")[0] }))
    .filter(p => p.slug && p.name && p.variants.length);
  const SW = { Natural: "#d9b58a", Walnut: "#6b4a33", Black: "#25292a", White: "#f2f0ec", Green: "#5d7262", "Orange red": "#d0532f", "Two-tone": "linear-gradient(90deg,#d9b58a 50%,#6b4a33 50%)" };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const src = (p, f) => f.replace(/^\//, "");  // CMS stores /img/...; relative keeps local previews working
  const cover = p => p.variants[0].images[0];
  const second = p => p.variants[0].images[1] || (p.variants[1] && p.variants[1].images[0]);

  const SOCIAL = [
    ["Facebook", "https://www.facebook.com/havicof/", '<path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z"/>'],
    ["YouTube", "https://www.youtube.com/@HavicoWood", '<path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/>'],
    ["TikTok", "https://www.tiktok.com/@havicowood", '<path d="M16.6 3c.3 2.1 1.6 3.6 3.9 3.8v3a7 7 0 0 1-3.8-1.2v6.1a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 1 0 1.8 2.4V3z"/>'],
    ["Shopee", "https://shopee.vn/havico", '<path d="M12 2.5a4 4 0 0 0-4 3.8H4.6l1.1 13.4A2.2 2.2 0 0 0 7.9 21.7h8.2a2.2 2.2 0 0 0 2.2-2L19.4 6.3H16a4 4 0 0 0-4-3.8zm0 1.6a2.4 2.4 0 0 1 2.4 2.2H9.6A2.4 2.4 0 0 1 12 4.1zm.1 5.3c1.4 0 2.4.5 2.9 1.2l-1 .9c-.5-.5-1.1-.8-1.9-.8-.8 0-1.3.4-1.3.9 0 1.5 4.6.8 4.6 3.8 0 1.4-1.2 2.6-3.4 2.6-1.4 0-2.6-.5-3.3-1.4l1-1c.6.7 1.4 1 2.3 1 1 0 1.6-.4 1.6-1 0-1.6-4.6-.8-4.6-3.8 0-1.4 1.3-2.4 3.1-2.4z"/>'],
    ["WhatsApp", "https://wa.me/840704898888", '<path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.4.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4z"/>'],
    ["Google Maps", "https://maps.app.goo.gl/oybtcz1inXaJqWVU8", '<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>']
  ];
  $$("[data-social]").forEach(el => el.innerHTML = SOCIAL.map(([n, u, d]) =>
    `<a href="${u}" target="_blank" rel="noopener" aria-label="${n}" title="${n}"><svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg></a>`).join(""));

  // mobile menu
  const nav = $(".nav"), mb = $(".menu-btn");
  if (mb) mb.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    mb.setAttribute("aria-expanded", open);
  });

  const swatches = p => {
    const v = p.variants.filter(v => SW[v.label]);
    return v.length > 1 ? `<div class="swatches">${v.map(x => `<span class="sw" title="${esc(x.label)}" style="background:${SW[x.label]}"></span>`).join("")}</div>` : "";
  };
  const card = p => {
    const a = cover(p), b = second(p);
    const opts = p.variants.length > 1 ? `${p.variants.length} options` : "";
    return `<a class="card" href="products/${p.slug}.html">
      <div class="ph${p.cover === "photo" ? " photo" : ""}">${a ? `<img class="${b ? "has-alt" : ""}" src="${src(p, a)}" alt="${esc(p.name)}" loading="lazy">` : ""}
        ${b ? `<img class="alt" src="${src(p, b)}" alt="" loading="lazy">` : ""}</div>
      <div class="meta"><h3>${esc(p.name)}</h3>${p.code ? `<span class="code">${p.code}</span>` : ""}</div>
      <p class="sub">${esc(p.category)}${opts ? " · " + opts : ""}</p>${swatches(p)}</a>`;
  };

  // Similar pieces (same family, e.g. MAI chair and MAI armchair) should not sit side by side.
  const spread = list => {
    const rest = [...list], out = [];
    while (rest.length) {
      const last = out.length ? out[out.length - 1].family : null, count = {};
      rest.forEach(p => count[p.family] = (count[p.family] || 0) + 1);
      // a family that fills over half of what is left must go now, or its items end up side by side
      const urgent = Object.keys(count).find(f => f !== last && count[f] * 2 > rest.length);
      let i = urgent ? rest.findIndex(p => p.family === urgent) : rest.findIndex(p => p.family !== last);
      out.push(rest.splice(i < 0 ? 0 : i, 1)[0]);
    }
    return out;
  };
  // Home shows each product once, and one product per family in each section.
  const used = new Set(), fam = new Set(), pick = (list, n) => {
    const out = [];
    for (const p of list) if (out.length < n && !used.has(p.slug) && !fam.has(p.family)) { out.push(p); fam.add(p.family); used.add(p.slug); }
    return out;
  };

  // home: featured, categories, close-ups
  const cats = [...new Set(P.map(p => p.category))];
  const feat = $("[data-featured]");
  if (feat) feat.innerHTML = pick([...P.filter(p => p.featured), ...P.filter(p => !p.featured)], 8).map(card).join("");
  const catEl = $("[data-cats]");
  if (catEl) catEl.innerHTML = cats.map(c => {
    // Beds and Storage hold only one family, so fall back to an unused product of it.
    const list = P.filter(p => p.category === c), cut = list.filter(x => x.cover === "cutout");
    const p = pick(cut, 1)[0] || cut.find(x => !used.has(x.slug)) || list[0], a = cover(p);
    used.add(p.slug);
    return `<a class="cat" href="products.html#${encodeURIComponent(c)}"><img src="${src(p, a)}" alt="" loading="lazy"><div><b>${esc(c)}</b><span>${list.length}</span></div></a>`;
  }).join("");

  const strip = $("[data-scenes]");
  if (strip) strip.innerHTML = pick(P.filter(p => p.details && p.details.length), 10).map(p => {
    const s = p.details[0];
    return `<figure><a href="products/${p.slug}.html"><img src="${src(p, s)}" alt="Close-up of the ${esc(p.name)}" loading="lazy"></a><figcaption>${esc(p.name)}</figcaption></figure>`;
  }).join("");

  // catalogue
  const grid = $("[data-grid]"), filt = $("[data-filters]");
  if (grid && filt) {
    const render = c => {
      grid.innerHTML = spread(P.filter(p => !c || p.category === c)).map(card).join("");
      grid.classList.remove("swap"); void grid.offsetWidth; grid.classList.add("swap");
      $$(".chip", filt).forEach(b => b.setAttribute("aria-pressed", b.dataset.c === (c || "")));
      $("[data-count]").textContent = `${grid.children.length} products`;
    };
    filt.innerHTML = [["", "All", P.length], ...cats.map(c => [c, c, P.filter(p => p.category === c).length])]
      .map(([v, l, n]) => `<button class="chip" data-c="${esc(v)}" aria-pressed="false">${esc(l)}<small>${n}</small></button>`).join("");
    filt.addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      history.replaceState(null, "", b.dataset.c ? "#" + encodeURIComponent(b.dataset.c) : location.pathname);
      render(b.dataset.c);
    });
    render(decodeURIComponent(location.hash.slice(1)));
  }

  // product page
  const pdp = $("[data-pdp]");
  if (pdp) {
    const p = P.find(x => x.slug === pdp.dataset.slug);
    if (!p) {
      pdp.innerHTML = `<div class="page-head"><h1>Product not found</h1><p class="lead" style="margin-top:16px">This product is no longer listed. <a class="link" href="products.html">See all products</a></p></div>`;
      return;
    }
    let vi = 0, ii = 0;
    const mail = () => `mailto:sale01@havicof.com?subject=${encodeURIComponent("Quote request: " + p.name + (p.code ? " (" + p.code + ")" : "") + (p.variants[vi].label ? ", " + p.variants[vi].label : ""))}`;
    const draw = () => {
      const v = p.variants[vi], im = v.images[ii] || v.images[0];
      pdp.innerHTML = `<div class="pdp">
        <div>
          <div class="gallery-main${p.cover === "photo" ? " photo" : ""}" tabindex="0" role="button" aria-label="Open photo viewer">${im ? `<img src="${src(p, im)}" alt="${esc(p.name)}${v.label ? ", " + esc(v.label) : ""}">` : ""}</div>
          ${v.images.length > 1 ? `<div class="thumbs">${v.images.map((x, i) => `<button data-i="${i}" aria-current="${i === ii}" aria-label="View image ${i + 1}"><img src="${src(p, x)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
        </div>
        <div class="pdp-info">
          <p class="crumbs"><a href="products.html">Products</a> / <a href="products.html#${encodeURIComponent(p.category)}">${esc(p.category)}</a></p>
          <h1>${esc(p.name)}</h1>
          ${p.code ? `<p class="code">${p.code}</p>` : ""}
          <p class="desc">${esc(p.desc)}</p>
          ${p.variants.length > 1 ? `<div class="opts"><p>${p.optLabel || "Finish"}: ${esc(v.label)}</p><div class="filters" style="margin:0">${p.variants.map((x, i) => `<button class="chip" data-v="${i}" aria-pressed="${i === vi}">${esc(x.label)}</button>`).join("")}</div></div>` : ""}
          <div class="pdp-actions"><a class="btn btn-solid" href="${mail()}">Request a quote</a><a class="btn" href="files/HAVICO-Catalogue-EN.pdf" download>Download catalogue</a></div>
          <p class="muted" style="font-size:14px;margin-top:12px">Or call / WhatsApp / WeChat <a class="link" href="tel:+84704898888">+84 704 898 888</a></p>
          <dl class="specs">
            <div><dt>Category</dt><dd>${esc(p.category)}</dd></div>
            ${p.material ? `<div><dt>Material</dt><dd>${esc(p.material)}</dd></div>` : ""}
            ${p.dims ? `<div><dt>Dimensions</dt><dd>${esc(p.dims)}</dd></div>` : ""}
            ${p.finish ? `<div><dt>Finish &amp; upholstery</dt><dd>${esc(p.finish)}</dd></div>` : ""}
            <div><dt>Made in</dt><dd>HAVICO factory, Hai Phong, Vietnam</dd></div>
            <div><dt>OEM / ODM</dt><dd>Custom sizes, woods, finishes and your own branding</dd></div>
          </dl>
        </div></div>
        ${p.scenes.length ? `<h2 style="font-size:clamp(26px,3vw,40px);margin:8px 0 24px">More photos</h2><div class="scenes">${p.scenes.map(s => `<img src="${src(p, s)}" alt="${esc(p.name)} in an interior" loading="lazy">`).join("")}</div>` : ""}`;
    };
    // swap only the main photo when a thumbnail is chosen, with a short crossfade
    const show = i => {
      const v = p.variants[vi], im = v.images[i], main = $(".gallery-main img", pdp);
      if (!im || !main || i === ii) return;
      ii = i;
      $$(".thumbs button", pdp).forEach(b => b.setAttribute("aria-current", +b.dataset.i === i));
      main.classList.add("out");
      const next = new Image(); next.src = src(p, im);
      next.decode().catch(() => {}).then(() => { main.src = next.src; main.classList.remove("out"); });
    };
    // full-screen viewer for the current finish plus the extra photos
    const lightbox = start => {
      const list = [...p.variants[vi].images, ...p.scenes];
      let k = start;
      const box = document.createElement("div");
      box.className = "lb"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", p.name + " photos");
      box.innerHTML = `<button class="round prev" aria-label="Previous photo"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
        <img alt=""><button class="round next" aria-label="Next photo"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
        <button class="round close" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><p class="count"></p>`;
      const set = () => { $("img", box).src = src(p, list[k]); $(".count", box).textContent = `${k + 1} / ${list.length}`; };
      const go = d => { k = (k + d + list.length) % list.length; set(); };
      const close = () => { box.remove(); document.removeEventListener("keydown", key); document.body.style.overflow = ""; window.__lenis && window.__lenis.start(); $(".gallery-main", pdp).focus(); };
      const key = e => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
      box.addEventListener("click", e => {
        if (e.target.closest(".prev")) go(-1); else if (e.target.closest(".next")) go(1);
        else if (e.target.closest(".close") || e.target === box) close();
      });
      document.addEventListener("keydown", key);
      document.body.style.overflow = "hidden"; window.__lenis && window.__lenis.stop();
      document.body.appendChild(box); set(); $(".close", box).focus();
    };
    pdp.addEventListener("click", e => {
      const t = e.target.closest("[data-i],[data-v]");
      if (t && t.dataset.v) { vi = +t.dataset.v; ii = 0; draw(); $(".gallery-main img", pdp)?.animate([{ opacity: 0 }, { opacity: 1 }], 350); return; }
      if (t) return show(+t.dataset.i);
      if (e.target.closest(".gallery-main")) lightbox(ii);
    });
    pdp.addEventListener("keydown", e => {
      if (e.target.closest(".gallery-main") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); lightbox(ii); }
    });
    draw();

    // phones: keep "Request a quote" in reach once the main buttons scroll away
    const bar = document.createElement("div");
    bar.className = "quote-bar";
    bar.innerHTML = `<b>${esc(p.name)}</b><a class="btn btn-solid" href="${mail()}">Request a quote</a>`;
    document.body.appendChild(bar);
    const onScroll = () => {
      const a = $(".pdp-actions", pdp);  // re-rendered on finish change, so look it up each time
      bar.classList.toggle("show", !!a && a.getBoundingClientRect().bottom < 0);
      $("a", bar).href = mail();
    };
    addEventListener("scroll", onScroll, { passive: true });
    const rel = $("[data-related]");
    if (rel) {
      used.add(p.slug); fam.add(p.family);
      const others = P.filter(x => x.family !== p.family);
      rel.innerHTML = pick([...others.filter(x => x.category === p.category), ...others], 4).map(card).join("");
    }
  }
})();
