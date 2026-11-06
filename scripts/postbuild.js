// Adds Turkish locale, PWA and social meta tags to the exported web shell.
const fs = require('fs');
const p = 'dist/index.html';
let h = fs.readFileSync(p, 'utf8');
h = h.replace('<html lang="en">', '<html lang="tr">');
const meta = `
    <meta name="description" content="Pagoo — okuduklarını kaydet, inceleme ve alıntı paylaş, okurları takip et." />
    <meta name="theme-color" content="#14101F" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta property="og:title" content="Pagoo" />
    <meta property="og:description" content="Okuduğun her sayfa bir iz bırakır." />
    <meta property="og:image" content="/apple-touch-icon.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.json" />`;
if (!h.includes('rel="manifest"')) h = h.replace('</title>', '</title>' + meta);
h = h.replace('width=device-width, initial-scale=1, shrink-to-fit=no', 'width=device-width, initial-scale=1, viewport-fit=cover');
fs.writeFileSync(p, h);
console.log('postbuild ok');
