const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');

(async () => {
    console.log("Starting visible QA session...");

    // Default Mac Chrome Path
    const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    
    if (!fs.existsSync(executablePath)) {
        console.error("Chrome not found at", executablePath);
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        headless: false, // Visible to the user!
        executablePath: executablePath,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // Log console errors to terminal
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`[PAGE ERROR] ${msg.text()}`);
        }
    });

    console.log("Navigating to https://belt.sterilebydesign.ai/ ...");
    await page.goto('https://belt.sterilebydesign.ai/', { waitUntil: 'networkidle2' });

    console.log("Typing credentials...");
    await page.waitForSelector('#si-email', { visible: true });
    await page.type('#si-email', 'izambrano@sipsconsults.com', { delay: 50 });
    await page.type('#si-pass', 'Gatorade4!', { delay: 50 });

    console.log("Clicking Sign In...");
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}), // catch timeout just in case it hydrates
        page.click('button.btn-gold')
    ]);

    await new Promise(r => setTimeout(r, 4000)); // wait for full dashboard load

    // Bypass tour if it exists
    await page.evaluate(() => {
        const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Skip for Now') || b.innerText.includes('Skip'));
        if (skipBtn) skipBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    console.log("Logged in. Commencing QA navigation pass...");

    const tabsToTest = [
        'Network Overview',
        'Leaderboard',
        'All Staff',
        'Staff Scoreboard',
        'All Facilities',
        'Hospital Systems',
        'Registrations',
        'Placement Reviews',
        'Assessment Queue',
        'Staff Progression',
        'Bulk Upload',
        'Reports',
        'DAVID Command Center',
        'Admin Users',
        'Promotion Approvals',
        'Free Agent Registry'
    ];

    for (const tabName of tabsToTest) {
        console.log(`\nTesting tab: ${tabName}`);
        
        const clicked = await page.evaluate((name) => {
            const elements = Array.from(document.querySelectorAll('a, div, span, li, .nav-item'));
            // Find exactly matching text to avoid partial matches
            const target = elements.find(el => el.innerText && el.innerText.trim().startsWith(name));
            if (target) {
                target.click();
                return true;
            }
            return false;
        }, tabName);

        if (clicked) {
            console.log(`✅ Clicked '${tabName}'. Inspecting page...`);
            await new Promise(r => setTimeout(r, 3000)); // Pause so the user can see it!

            // Basic sanity check - extract text snippet
            const text = await page.evaluate(() => document.body.innerText.substring(0, 100).replace(/\n/g, ' '));
            console.log(`Page snippet: ${text}`);
        } else {
            console.log(`⚠️ Tab '${tabName}' not found or not clickable.`);
        }
    }

    console.log("\n✅ QA Navigation Pass Complete.");
    console.log("Browser will close in 5 seconds...");
    await new Promise(r => setTimeout(r, 5000));
    
    await browser.close();
    console.log("QA session ended successfully.");
})();
