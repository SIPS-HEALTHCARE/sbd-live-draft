const puppeteer = require('puppeteer-core');
const fs = require('fs');

const TEST_STAFF_ID = '00000000-0000-0000-0000-000000000099';

(async () => {
    console.log("=== PLACEMENT ASSESSMENT QA (TEST STAFF ONLY) ===\n");

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();
    let errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('api.anthropic.com')) errors.push(msg.text());
    });

    // LOGIN
    console.log("Navigating to site...");
    await page.goto('https://belt.sterilebydesign.ai/', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('#si-email', { visible: true });
    await page.type('#si-email', 'izambrano@sipsconsults.com', { delay: 40 });
    await page.type('#si-pass', 'Gatorade4!', { delay: 40 });
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
        page.click('button.btn-gold')
    ]);
    await new Promise(r => setTimeout(r, 5000));
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Skip'));
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    console.log("✅ Logged in.\n");

    // Inject test staff into local DB
    await page.evaluate((testId) => {
        if (typeof DB !== 'undefined' && DB.staff) {
            DB.staff = DB.staff.filter(s => s.id !== testId);
            DB.staff.push({
                id: testId, fid: '9bae7ab8-bfdc-481f-8f6b-db0f9b3809bb',
                first: 'QA', last: 'TestBot', role: 'SPD Technician I', belt: 'White',
                since: null, stars: 0, promo: false,
                cur: { c: null, s: null, o: null }, nxt: { c: null, s: null, o: null },
                ps: { enrolled: false, done: false, track: null, mod: null, tracks: {} },
                oip: null, history: [], placementNeeded: true
            });
        }
    }, TEST_STAFF_ID);
    await page.evaluate(() => localStorage.removeItem('sbd_pa_state'));

    // Open assessment
    console.log("🚀 Opening Placement Assessment for QA TestBot...");
    await page.evaluate((id) => {
        const s = typeof getStaff === 'function' ? getStaff(id) : null;
        if (s && typeof showPlacementAssessment === 'function') showPlacementAssessment(s);
    }, TEST_STAFF_ID);
    await new Promise(r => setTimeout(r, 2000));

    // Begin
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Begin Assessment'));
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Answer all 60
    const total = 60;
    for (let n = 1; n <= total; n++) {
        const q = await page.evaluate(() => {
            if (typeof PA === 'undefined' || typeof getPAQuestions !== 'function') return null;
            const qs = getPAQuestions(), cur = qs[PA.currentQ - 1];
            return cur ? { id: cur.id, type: cur.type, q: cur.q.substring(0, 70), correct: cur.correct, kw: cur.keywords || [] } : null;
        });
        if (!q) { console.log(`  Q${n} — state unavailable, may have submitted.`); break; }

        if (q.type === 'knowledge') {
            process.stdout.write(`  Q${n}/60 [KC] `);
            await page.evaluate((id, idx) => { if (typeof paSelectKnowledge === 'function') paSelectKnowledge(id, idx); }, q.id, q.correct);
        } else {
            process.stdout.write(`  Q${n}/60 [SR] `);
            const kw = q.kw;
            const ans = `Following protocol, I would ${kw[0]||'assess'} and ${kw[1]||'follow procedure'}. Critical to ${kw[2]||'document'} and ${kw[3]||'notify supervisor'}. Ensure ${kw[4]||'patient safety'} by ${kw[5]||'following guidelines'}. Proper ${kw[6]||'communication'}. Would ${kw[7]||'verify'} and ${kw[8]||'complete docs'} for ${kw[9]||'compliance'} with ${kw[10]||'standards'}.`;
            await page.evaluate((id, a) => { if (typeof paSimInput === 'function') paSimInput(id, a); }, q.id, ans);
        }
        console.log(q.q + '...');
        await page.evaluate(() => { if (typeof paNext === 'function') paNext(); });
        await new Promise(r => setTimeout(r, n === total ? 0 : 250));
    }

    // Wait for parallel AI scoring + backend submission (now parallel = ~5s max)
    console.log("\n📝 Submitted! Waiting for parallel AI scoring + backend sync...");
    
    // Poll for completion instead of fixed wait
    let submitted = false;
    for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(r => setTimeout(r, 2000));
        const text = await page.evaluate(() => {
            const el = document.getElementById('placement-content');
            return el ? el.innerText : '';
        });
        if (text.includes('Submitted') || text.includes('submitted') || text.includes('Assessment Complete') || text.includes('Dashboard')) {
            submitted = true;
            console.log(`   ✅ UI confirmed submission after ${(attempt+1)*2} seconds.`);
            break;
        }
        if (attempt % 5 === 4) console.log(`   Still scoring... (${(attempt+1)*2}s elapsed)`);
    }

    if (!submitted) {
        const text = await page.evaluate(() => document.getElementById('placement-content')?.innerText || '');
        console.log("⚠️  Timed out. Current screen:", text.substring(0, 300));
    }

    // Verify in DB
    console.log("\nVerifying database...");
    const db = await page.evaluate(async (id) => {
        try {
            const sb = window._supabase || (typeof supabase !== 'undefined' ? supabase : null);
            if (sb) {
                const { data } = await sb.from('placement_reviews').select('*').eq('staff_id', id).order('submitted_at', { ascending: false }).limit(1);
                if (data && data.length) return { found: true, r: { id: data[0].id, name: data[0].staff_name, belt: data[0].tentative_belt, status: data[0].status, at: data[0].submitted_at, cnt: data[0].responses?.length } };
            }
        } catch(e) {}
        return { found: false };
    }, TEST_STAFF_ID);

    if (db.found) {
        console.log("\n✅ DATABASE VERIFICATION PASSED:");
        console.log(`   Staff Name:     ${db.r.name}`);
        console.log(`   Tentative Belt: ${db.r.belt}`);
        console.log(`   Status:         ${db.r.status}`);
        console.log(`   Submitted At:   ${db.r.at}`);
        console.log(`   Responses:      ${db.r.cnt} questions`);
    } else {
        console.log("⚠️  Could not verify via in-page client. Will check server-side.");
    }

    if (errors.length) {
        console.log(`\n⚠️  ${errors.length} non-CORS error(s):`);
        errors.slice(0, 5).forEach((e, i) => console.log(`   ${i+1}. ${e.substring(0, 120)}`));
    } else {
        console.log("\n✅ Zero non-CORS console errors.");
    }

    console.log("\n=== QA COMPLETE ===");
    console.log("Browser open 20s for inspection...");
    await new Promise(r => setTimeout(r, 20000));
    await browser.close();
    console.log("Done.");
})();
