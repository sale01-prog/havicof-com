// Products live in data/products.json, edited in Pages CMS (app.pagescms.org) or by _build/gen_data.py.
// shortcut: synchronous load so site.js and motion.js run unchanged; switch to fetch if the file grows past a few hundred KB.
(() => {
  const x = new XMLHttpRequest();
  x.open("GET", "data/products.json", false);
  x.send();
  window.HV = { products: x.status === 200 ? JSON.parse(x.responseText) : [] };
})();
