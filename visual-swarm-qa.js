const puppeteer = require('puppeteer');

(async () => {
  console.log("Initializing Swarm QA Testing...");
  
  // We will launch 1 agent to visually simulate the swarm
  const NUM_AGENTS = 1;
  const targetUrl = 'https://belt.sterilebydesign.ai/';
  
  const agents = [];
  
  for (let i = 0; i < NUM_AGENTS; i++) {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        `--window-size=800,600`,
        `--window-position=${(i % 2) * 800},${Math.floor(i / 2) * 600}`
      ]
    });
    
    const page = await browser.newPage();
    agents.push({ browser, page, id: i + 1 });
    
    // Inject a visual indicator of the agent
    await page.evaluateOnNewDocument((agentId) => {
      document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.createElement('div');
        overlay.innerHTML = `🤖 QA Agent #${agentId} <br> <span style="font-size:12px">Status: Scanning...</span>`;
        overlay.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0,0,0,0.8);
          color: #00ffcc;
          padding: 10px 15px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 16px;
          z-index: 999999;
          box-shadow: 0 4px 15px rgba(0,255,204,0.3);
          border: 1px solid #00ffcc;
          pointer-events: none;
        `;
        overlay.id = 'qa-agent-overlay';
        document.body.appendChild(overlay);
      });
    }, i + 1);
  }

  console.log(`Launched ${NUM_AGENTS} visual agents.`);

  // Have them all go to the site with slight staggering
  for (let i = 0; i < NUM_AGENTS; i++) {
    setTimeout(async () => {
      const page = agents[i].page;
      try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });
        
        // Function to simulate agent scanning
        const scanPage = async () => {
          // Scroll down slowly
          for (let s = 0; s < 5; s++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
            await new Promise(r => setTimeout(r, 1000));
            
            // Randomly highlight elements to show "testing"
            await page.evaluate(() => {
              const overlay = document.getElementById('qa-agent-overlay');
              if (overlay) overlay.innerHTML = `🤖 QA Agent <br> <span style="font-size:12px; color:#ffcc00;">Status: Testing DOM Elements...</span>`;
              
              const buttons = document.querySelectorAll('button, a, input');
              if (buttons.length > 0) {
                const randomBtn = buttons[Math.floor(Math.random() * buttons.length)];
                const originalBg = randomBtn.style.backgroundColor;
                const originalOutline = randomBtn.style.outline;
                
                randomBtn.style.outline = '3px solid #ff00ff';
                randomBtn.style.backgroundColor = 'rgba(255,0,255,0.2)';
                
                setTimeout(() => {
                  randomBtn.style.outline = originalOutline;
                  randomBtn.style.backgroundColor = originalBg;
                }, 800);
              }
            });
          }
          
          // Click a random link to go to another page
          await page.evaluate(() => {
            const overlay = document.getElementById('qa-agent-overlay');
            if (overlay) overlay.innerHTML = `🤖 QA Agent <br> <span style="font-size:12px; color:#00ffcc;">Status: Navigating...</span>`;
          });
          
          const links = await page.$$('a');
          if (links.length > 0) {
            const randomLink = links[Math.floor(Math.random() * links.length)];
            await randomLink.click().catch(() => {});
            await new Promise(r => setTimeout(r, 3000));
            scanPage(); // recursive loop to keep crawling
          }
        };

        scanPage();
        
      } catch (err) {
        console.error(`Agent ${agents[i].id} encountered an error:`, err.message);
      }
    }, i * 1500); // Stagger starts
  }
  
})();
