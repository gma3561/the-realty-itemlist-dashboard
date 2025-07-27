const fs = require('fs');
const path = require('path');

// Read the index.html file
const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Fix favicon and apple-touch-icon paths
html = html.replace('href="/favicon.ico"', 'href="/the-realty-itemlist-dashboard/favicon.ico"');
html = html.replace('href="/apple-touch-icon.png"', 'href="/the-realty-itemlist-dashboard/apple-touch-icon.png"');

// Write the updated HTML back
fs.writeFileSync(indexPath, html);

console.log('Fixed asset paths in index.html');