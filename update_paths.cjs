const fs = require('fs');
const file = 'C:\\Users\\Shorang\\.gemini\\antigravity\\scratch\\engineer-it\\src\\data\\round2Questions.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/image: '\/images\/scenarios\/scenario_(\d\d)\.png'/g, "image: '/round2/q$1.webp'");
fs.writeFileSync(file, content);
console.log('Done');
