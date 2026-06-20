import fs from 'fs';

const cssPath = 'src/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');

const replacements = [
  { from: /#6366f1/ig, to: '#059669' }, // Indigo 500 -> Emerald 600
  { from: /#4f46e5/ig, to: '#047857' }, // Indigo 600 -> Emerald 700
  { from: /#818cf8/ig, to: '#34d399' }, // Indigo 400 -> Emerald 400
  { from: /#a5b4fc/ig, to: '#6ee7b7' }, // Indigo 300 -> Emerald 300
  { from: /#e0e7ff/ig, to: '#d1fae5' }, // Indigo 100 -> Emerald 100
  { from: /#eef2ff/ig, to: '#ecfdf5' }, // Indigo 50  -> Emerald 50
  
  // RGB values for rgba()
  { from: /99,\s*102,\s*241/g, to: '5, 150, 105' },
  { from: /79,\s*70,\s*229/g, to: '4, 120, 87' },
  { from: /129,\s*140,\s*248/g, to: '52, 211, 153' }
];

replacements.forEach(r => {
  css = css.replace(r.from, r.to);
});

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Palette updated successfully in styles.css');
