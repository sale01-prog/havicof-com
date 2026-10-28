"""data/products.json -> products/<slug>.html (one static page per product, for search engines) + sitemap.xml.
Run after every product change; GitHub Actions also runs it on each push (.github/workflows/publish.yml)."""
import json, os, glob, datetime
from html import escape as e
from urllib.parse import quote

O = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://havicof.com/"
TPL = open(os.path.join(O, "_build", "product.html"), encoding="utf-8").read()
# same filtering as js/site.js: products without a slug, a name or a photo are not listed
P = [p for p in json.load(open(os.path.join(O, "data", "products.json"), encoding="utf-8"))
     if p.get("slug") and p.get("name") and any(v.get("images") for v in p.get("variants") or [])]
assert P, "no products in data/products.json"
assert len({p["slug"] for p in P}) == len(P), "duplicate slug in data/products.json"

def page(p):
    url = f"{BASE}products/{p['slug']}.html"
    imgs = [i for v in p["variants"] for i in (v.get("images") or [])] + (p.get("scenes") or [])
    v0 = next(v for v in p["variants"] if v.get("images"))
    desc = (p.get("desc") or "").strip()
    meta = f"{desc} Solid wood furniture made by HAVICO in Hai Phong, Vietnam. OEM and ODM.".strip()
    ld = [{"@context": "https://schema.org", "@type": "Product", "name": p["name"], "url": url,
           "image": [BASE + i.lstrip("/") for i in imgs[:10]], "description": desc or meta,
           "brand": {"@type": "Brand", "name": "HAVICO"}, "category": p.get("category") or "",
           "manufacturer": {"@type": "Organization", "name": "HAVICO Wood Joint Stock Company", "url": BASE},
           "countryOfOrigin": "VN",
           **({"sku": p["code"]} if p.get("code") else {}), **({"material": p["material"]} if p.get("material") else {})},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Products", "item": BASE + "products.html"},
              {"@type": "ListItem", "position": 2, "name": p.get("category") or "Products", "item": BASE + "products.html#" + quote(p.get("category") or "")},
              {"@type": "ListItem", "position": 3, "name": p["name"], "item": url}]}]
    title = f"{p['name']} | HAVICO, solid wood furniture manufacturer"
    head = "\n".join([
        f"<title>{e(title)}</title>",
        f'<meta name="description" content="{e(meta)}">',
        f'<link rel="canonical" href="{url}">',
        '<meta property="og:type" content="product">',
        '<meta property="og:site_name" content="HAVICO">',
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(meta)}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{BASE + v0["images"][0].lstrip("/")}">',
        '<script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False).replace("</", "<\\/") + "\n</script>"])
    # what crawlers read before js/site.js draws the full gallery over it
    specs = [("Category", p.get("category")), ("Material", p.get("material")), ("Dimensions", p.get("dims")),
             ("Finish &amp; upholstery", p.get("finish"))]
    body = f"""<div class="pdp">
        <div><div class="gallery-main{' photo' if p.get('cover') == 'photo' else ''}"><img src="{e(v0['images'][0].lstrip('/'))}" alt="{e(p['name'])}"></div></div>
        <div class="pdp-info">
          <p class="crumbs"><a href="products.html">Products</a> / <a href="products.html#{quote(p.get('category') or '')}">{e(p.get('category') or '')}</a></p>
          <h1>{e(p['name'])}</h1>
          {f'<p class="code">{e(p["code"])}</p>' if p.get('code') else ''}
          <p class="desc">{e(desc)}</p>
          <div class="pdp-actions"><a class="btn btn-solid" href="index.html#contact">Request a quote</a></div>
          <dl class="specs">
            {''.join(f'<div><dt>{k}</dt><dd>{e(x)}</dd></div>' for k, x in specs if x)}
            <div><dt>Made in</dt><dd>HAVICO factory, Hai Phong, Vietnam</dd></div>
            <div><dt>OEM / ODM</dt><dd>Custom sizes, woods, finishes and your own branding</dd></div>
          </dl>
        </div></div>"""
    return TPL.replace("{{HEAD}}", head).replace("{{SLUG}}", e(p["slug"])).replace("{{BODY}}", body)

out = os.path.join(O, "products")
os.makedirs(out, exist_ok=True)
for f in glob.glob(os.path.join(out, "*.html")):  # products removed in the CMS lose their page
    os.remove(f)
for p in P:
    with open(os.path.join(out, p["slug"] + ".html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(page(p))

today = datetime.date.today().isoformat()
urls = [BASE, BASE + "products.html"] + [f"{BASE}products/{p['slug']}.html" for p in P]
with open(os.path.join(O, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    f.writelines(f"  <url><loc>{e(u)}</loc><lastmod>{today}</lastmod></url>\n" for u in urls)
    f.write("</urlset>\n")
print(len(P), "product pages -> products/, sitemap.xml")
