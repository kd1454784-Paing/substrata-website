# SUBSTRATA — poster shop website

Plain HTML, CSS and JavaScript. No build step, no frameworks.

## Folder layout

```
substrata-website/
├── index.html        Homepage
├── shop.html         All works (filter, sort, grid / index view)
├── product.html      Product details  (product.html?id=afterburn)
├── collections.html  The four chapters
├── about.html        About the label
├── cart.html         Shopping bag (saved in localStorage)
├── checkout.html     Checkout (demo, no real payment)
├── css/style.css     All styles + mobile breakpoints
├── js/i18n.js        English / Japanese text (add translations here)
├── js/data.js        Products, prices, shipping  ← edit this to change content
├── js/main.js        Header, footer, cart and page logic
└── images/           Put the poster JPGs here
```

## Setup

1. Copy every JPG from `_SUBSTRATA website assets` into `substrata-website/images/`
   (keep the file names: afterburn.jpg, phantom.jpg, mock-wall.jpg …).
2. Open the folder in VS Code.
3. Right-click `index.html` → **Open with Live Server** (install the "Live Server"
   extension if you don't have it). Double-clicking index.html also works.

## Change things

- Prices / shipping / tax: top of `js/data.js` (`PRICES`, `SHIPPING`, `TAX_RATE`).
- Add a poster: add one object to `PRODUCTS` in `js/data.js` and drop its JPG in `images/`.
- Prints left: the `stock` number on each product (0 = print sold out, PSD still sold).
- Colours and fonts: the `:root` variables at the top of `css/style.css`.
- Brand name: search the project for `SUBSTRATA`.

## Language (English / 日本語)

- The EN / 日本語 switch is in the header (and in the mobile menu). The choice is remembered.
- First-time visitors with a Japanese browser see Japanese automatically.
- To translate more text: add `"English text": "日本語"` to `js/i18n.js`, and put `data-i18n`
  on the HTML element that holds that English text.
- Product descriptions in Japanese are the `short_ja`, `text_ja`, `quote_ja` fields in `js/data.js`.

## Motion

All animation is in the MOTION section of `css/style.css` plus a few functions in `js/main.js`
(page curtain, hero letters, scroll reveals, glitch hover, custom cursor, marquee, count-up numbers).
Everything turns off automatically if the visitor's system is set to reduce motion.
