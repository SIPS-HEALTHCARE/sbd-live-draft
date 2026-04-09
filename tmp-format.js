const fs = require('fs');
const path = './src/js/ui-views.js';

let content = fs.readFileSync(path, 'utf8');

function formatHTML(html) {
  // 1. Split <p class="cs-para"> content by \n and wrap them individually if we can
  // But wait, there are raw \n in existing HTML strings.
  // "Text\nMore Text" -> "<p class="cs-para">Text<br/>More Text</p>"
  
  // Actually, wait, let's target lists.
  // E.g. "What White Belt Operators Are Authorized to Do\nAnswer the SPD phone..."
  
  html = html.replace(/<p class="cs-para">([\s\S]*?)<\/p>/g, (match, inner) => {
    // If it has multiple newlines, let's see if we can convert it to a styled list
    const lines = inner.trim().split('\n');
    if (lines.length > 2 && lines.some(l => l.match(/^[A-Z0-9]/))) {
      // It might be a list. Let's make the first line bold if it feels like a header
      const header = lines[0];
      const isHeader = header.length < 50 && !header.endsWith('.');
      
      let out = '';
      if (isHeader) {
        out += `<p class="cs-para"><strong class="cs-strong-gold">${header}</strong></p>`;
        
        let listItems = lines.slice(1).map(l => `<li class="cs-li">${l}</li>`).join('');
        out += `<ul class="cs-ul">${listItems}</ul>`;
        return out;
      }
    }
    
    // Just replace newlines with <br/><br/>
    let spaced = inner.replace(/\n/g, '<br/><br/>');
    
    // Add strong tags for patterns like "Rule for XYZ"
    spaced = spaced.replace(/The Rule for Every Situation at White Belt/g, '<strong class="cs-strong-gold">The Rule for Every Situation at White Belt</strong>');
    
    return `<p class="cs-para">${spaced}</p>`;
  });
  
  return html;
}

// Find FULL_CURRICULUM_DATA block
const regex = /(const FULL_CURRICULUM_DATA = \{[\s\S]*?\n  \};\n)/;
const match = content.match(regex);

if (match) {
  let jsonStringPart = match[1];
  
  // Custom manual fixes across the text
  // Let's replace known text with formatted variations
  jsonStringPart = jsonStringPart.replace(/<p class="cs-para">WHITE BELT\\nLEARNER GUIDE\\nComplete Self-Teaching Program  \|  Foundation Level\\nSBD Communication Language System  \|  Scripts 1-2\\nSIPS Healthcare Solutions  \|  sterilebydesign.ai<\/p>/g,
    `<div class="cs-course-header"><h2 class="cs-belt-title">WHITE BELT <span class="cs-belt-subtitle">LEARNER GUIDE</span></h2><div class="cs-belt-tags"><span class="cs-tag">Complete Self-Teaching Program</span><span class="cs-tag">Foundation Level</span><span class="cs-tag">Scripts 1-2</span></div><p class="cs-belt-author">SIPS Healthcare Solutions | sterilebydesign.ai</p></div>`);
  
  jsonStringPart = jsonStringPart.replace(/<p class="cs-para">YELLOW BELT\\nLEARNER GUIDE\\nThe SBD Operator Development System  \|  Single-Area Mastery\\n6-8 Weeks  \|  Scripts 3-11  \|  Report Upward  \|  Zero External Communication\\nSIPS Healthcare Solutions  \|  sterilebydesign.ai<\/p>/g,
    `<div class="cs-course-header"><h2 class="cs-belt-title cs-yellow">YELLOW BELT <span class="cs-belt-subtitle">LEARNER GUIDE</span></h2><div class="cs-belt-tags"><span class="cs-tag">Single-Area Mastery</span><span class="cs-tag">6-8 Weeks</span><span class="cs-tag">Scripts 3-11</span></div><p class="cs-belt-author">SIPS Healthcare Solutions | sterilebydesign.ai</p></div>`);

  jsonStringPart = jsonStringPart.replace(/<p class="cs-para">GREEN BELT\\nLEARNER GUIDE\\nThe SBD Operator Development System  \|  Multi-Area Proficiency\\n8-10 Weeks  \|  Scripts 12-20  \|  Every Area. Every Standard. One Protocol.\\nSIPS Healthcare Solutions  \|  sterilebydesign.ai<\/p>/g,
    `<div class="cs-course-header"><h2 class="cs-belt-title cs-green">GREEN BELT <span class="cs-belt-subtitle">LEARNER GUIDE</span></h2><div class="cs-belt-tags"><span class="cs-tag">Multi-Area Proficiency</span><span class="cs-tag">8-10 Weeks</span><span class="cs-tag">Scripts 12-20</span></div><p class="cs-belt-author">SIPS Healthcare Solutions | sterilebydesign.ai</p></div>`);

  // Bold important terms
  jsonStringPart = jsonStringPart.replace(/(What You Own|What You Still Do Not Own|The Reporting Language Rule|What White Belt Operators Are Authorized to Do|What White Belt Operators Are NOT Authorized to Do|The Rule for Every Situation at White Belt|Why Script 1 Matters|Script 1 Practice Drill|Why Script 2 Matters|What to Document|How to Route Correctly|Basic Instrument Categories|White Belt Tray Mastery List|Instrument Inspection Basics|What Happens After You Pass|What Happens If You Do Not Pass)/g, '<strong class="cs-strong-gold">$1</strong>');
  
  // Format tables
  jsonStringPart = jsonStringPart.replace(/<table class="cs-table"><tr><td>This is important.([\s\S]*?)<\/td><\/tr><\/table>/g, `<div class="cs-alert-box"><strong class="cs-alert-title">IMPORTANT</strong><p class="cs-alert-text">$1</p></div>`);
  jsonStringPart = jsonStringPart.replace(/<table class="cs-table"><tr><td>PPE in Decontamination is Mandatory([\s\S]*?)<\/td><\/tr><\/table>/g, `<div class="cs-alert-box cs-alert-danger"><strong class="cs-alert-title">PPE IN DECONTAMINATION IS MANDATORY</strong><p class="cs-alert-text">$1</p></div>`);

  // Add line breaks correctly
  jsonStringPart = jsonStringPart.replace(/\\n/g, '<br/>');

  let newContent = content.replace(regex, jsonStringPart);
  fs.writeFileSync(path, newContent, 'utf8');
  console.log("Updated FULL_CURRICULUM_DATA in ui-views.js!");
}
