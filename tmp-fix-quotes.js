const fs = require('fs');
const path = './src/js/ui-views.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /(const FULL_CURRICULUM_DATA = \{[\s\S]*?\n  \};\n)/;
const match = content.match(regex);

if (match) {
  let jsonStringPart = match[1];
  
  // Replace unescaped class="..." with class=\"...\"
  // However we need to be careful not to double escape if they are already escaped.
  // We look for class=" not preceded by \
  jsonStringPart = jsonStringPart.replace(/([^\\])class="([^"]+)"/g, '$1class=\\"$2\\"');
  
  let newContent = content.replace(regex, jsonStringPart);
  fs.writeFileSync(path, newContent, 'utf8');
  console.log("Fixed quotes in FULL_CURRICULUM_DATA");
} else {
  console.log("Could not find FULL_CURRICULUM_DATA");
}
