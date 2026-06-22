// ============================================================
// ovs-guidance.js  --  Observer guidance content (OVS)
// Per-item coaching shown on the observation capture screen:
// what the item checks, what a pass/miss looks like, how to see
// it on the floor, and how to run a drill if it doesn't occur live.
// Keyed by instrument belt -> item id (ids match observation_checklists).
// Content only; no logic, no demo data.
// ============================================================
window.OVS_GUIDE = {
"White":{
"w1":{
"what":"Whether they answer every phone call from the operating rooms using the exact approved wording, called Script 1, with no improvising.",
"pass":"Every call is answered with the same set opening, word for word. They do not ad-lib or shorten it.",
"miss":"They answer casually, change the words, or skip the script on a call they think is routine.",
"surface":"Just listen to their phone calls during the shift. Calls happen on their own; no setup needed."
},
"w2":{
"what":"Whether they write down all five required pieces of information for every call (the call log).",
"pass":"For each call they record all five fields: who called, the time, what was asked, what they did, and any follow-up.",
"miss":"They leave fields blank, fill them in later from memory, or skip logging a call entirely.",
"surface":"Look at their call log during or right after calls. Compare what was said on the phone to what they wrote."
},
"w3":{
"what":"Whether they pass every caller's request to the Lead (the person in charge of the department that shift) instead of answering it themselves.",
"pass":"They take the request and route it to the Lead. They do not give the caller a status, a time estimate, or a guess.",
"miss":"They tell the caller 'it'll be ready in ten minutes' or otherwise answer on their own authority.",
"surface":"Listen to how calls end. Note whether the answer comes from them or gets handed to the Lead."
},
"w4":{
"what":"Whether they stick to the script even when a caller pushes, pressures, or gets impatient.",
"pass":"Under pressure they stay on the approved wording and still route to the Lead. They do not cave.",
"miss":"When a caller pushes, they abandon the script and start improvising or making promises.",
"surface":"If no pushy call happens naturally, ask the Lead to have someone call in and press for an answer while you watch.",
"drill":"Make the call yourself and press hard for a time. The pass is holding the approved wording and routing to the Lead anyway."
},
"w5":{
"what":"Whether they note urgency in their written log when a caller says something is urgent.",
"pass":"When a caller flags urgency, that urgency is written into the log so the Lead sees it.",
"miss":"The caller stresses urgency but it never makes it onto the written record.",
"surface":"Listen for a caller signaling urgency, then check whether it appears in the log. Or ask the Lead to stage an urgent call.",
"drill":"Call in something flagged urgent, then check the written log for the urgency."
},
"w6":{
"what":"Whether they avoid promising to handle an operating-room request on their own.",
"pass":"They never commit to personally fixing or delivering something the OR asks for; they route it.",
"miss":"They say 'I'll take care of it' or otherwise take on a request they should have passed up.",
"surface":"Listen across calls. The tell is any personal commitment to the OR instead of routing."
},
"w7":{
"what":"Whether they confirm out loud what item is being handed over and where it is going on every delivery (the runner exchange, when items move between areas), using approved wording (Script 2).",
"pass":"On each delivery they state the item and destination clearly and get acknowledgment before walking away.",
"miss":"They drop items without saying what they are or where they go, or assume the other person knows.",
"surface":"Watch any handoff of trays or items between people or areas. These happen throughout a shift."
},
"w8":{
"what":"Whether they confirm out loud what item they are receiving and where it came from on every pickup (Script 2).",
"pass":"On each pickup they verbally confirm the item and its source before taking it.",
"miss":"They grab items without confirming what they are or where they came from.",
"surface":"Watch any pickup of items. No setup needed; they occur naturally."
},
"w9":{
"what":"Whether they complete the exchange paperwork at the moment of the handoff, not later.",
"pass":"The handoff is documented right then, with the required fields filled in at the time.",
"miss":"They do the paperwork later from memory, or skip it.",
"surface":"Watch a handoff and check whether the paperwork is done on the spot."
},
"w10":{
"what":"Whether they require the other person to verbally confirm before treating a handoff as finished.",
"pass":"They wait for a clear 'got it' from the other person before considering the exchange complete.",
"miss":"They consider it done the moment they set it down, with no confirmation.",
"surface":"Watch any handoff. The tell is whether they wait for acknowledgment."
},
"w11":{
"what":"Whether they keep the Lead informed of every handoff they make or receive.",
"pass":"The Lead is told about exchanges; nothing moves silently.",
"miss":"Items move in and out without the Lead being informed.",
"surface":"Watch handoffs and note whether the Lead is kept in the loop."
},
"w12":{
"what":"Whether they avoid releasing items without the Lead's approval when approval is required.",
"pass":"They hold items that need sign-off until the Lead approves their release.",
"miss":"They release items on their own that should have waited for approval.",
"surface":"Ask the Lead which items at this facility require approval before release, then watch whether the rule is followed."
},
"w13":{
"what":"Whether they pass information to the Lead exactly as it was recorded (the time, who called, the request), without changing it.",
"pass":"What they tell the Lead matches the log word for word.",
"miss":"They summarize loosely, drop details, or change what was said.",
"surface":"Compare what they report to the Lead against what is in their log."
},
"w14":{
"what":"Whether they document events as they happen rather than reconstructing them afterward.",
"pass":"Writing happens in real time, at the event.",
"miss":"They batch their notes at the end of a shift or fill them in from memory.",
"surface":"Watch when the writing actually occurs relative to the event."
},
"w15":{
"what":"Whether they find the next available Lead or Supervisor when the main Lead is not around.",
"pass":"If the Lead is unavailable, they locate the backup rather than acting alone or waiting indefinitely.",
"miss":"When the Lead is gone, they either guess and act alone or let things stall.",
"surface":"If it does not happen naturally, ask the Lead to step away briefly and watch what the operator does with a request.",
"drill":"Have the Lead step out for ten minutes, then hand the candidate a request that needs an answer."
},
"w16":{
"what":"Whether they relay information without adding their own opinion or commentary.",
"pass":"They pass facts only. No editorializing, no 'I think the OR is being unreasonable.'",
"miss":"They color the message with opinion or complaint.",
"surface":"Listen to how they relay messages to the Lead."
},
"w17":{
"what":"Whether they can name cutting and dissecting instruments (the tools that cut tissue, like scissors and scalpel handles) from a set you show them.",
"pass":"Shown a set, they correctly name the cutting and dissecting instruments.",
"miss":"They misname them, guess, or cannot identify them.",
"surface":"Lay out a mixed set of instruments and ask them to point out and name the cutting and dissecting ones."
},
"w18":{
"what":"Whether they can name grasping and holding instruments (tools that grip tissue or objects) from a set.",
"pass":"They correctly identify the grasping and holding instruments.",
"miss":"They misname or cannot identify them.",
"surface":"Show a mixed set and ask them to name the grasping and holding instruments."
},
"w19":{
"what":"Whether they can name clamping instruments (tools that clamp shut, often to stop bleeding) from a set.",
"pass":"They correctly identify the clamping instruments.",
"miss":"They misname or cannot identify them.",
"surface":"Show a mixed set and ask them to name the clamping instruments."
},
"w20":{
"what":"Whether they can name retractors (tools that hold an opening apart so the surgeon can see) from a set.",
"pass":"They correctly identify the retractors.",
"miss":"They misname or cannot identify them.",
"surface":"Show a mixed set and ask them to name the retractors."
},
"w21":{
"what":"Whether they can name the six basic tray types (a tray is the metal container holding a grouped set of instruments) and describe what each mainly contains.",
"pass":"They name all six basic trays and describe the primary contents of each.",
"miss":"They miss trays or cannot describe what is in them.",
"surface":"Ask them to list the basic tray sets and walk you through what each one holds."
},
"w22":{
"what":"Whether they spot instrument problems (soil left on it, rust, damage) and report them to the Lead.",
"pass":"They catch dirty, rusted, or damaged instruments and flag them up rather than passing them along.",
"miss":"They let a soiled or damaged instrument continue through the process.",
"surface":"Watch them handle and inspect instruments. If needed, ask the Lead to place a visibly soiled or damaged instrument in a set."
},
"w23":{
"what":"Whether they avoid deciding on their own what happens to a questionable instrument.",
"pass":"They report a questionable instrument and let the Lead decide its fate.",
"miss":"They make the call themselves to keep it, toss it, or pass it on.",
"surface":"Watch what they do when they find a problem instrument."
},
"w24":{
"what":"Whether they keep outside communication limited to the two approved scripts (Scripts 1 and 2) and route everything else.",
"pass":"They handle only what the two scripts cover and pass everything else to the Lead.",
"miss":"They take on conversations or requests beyond the two scripts.",
"surface":"Listen across their external interactions for anything beyond the two approved scripts."
},
"w25":{
"what":"Whether they avoid giving operating-room staff status, time estimates, or case information.",
"pass":"They give the OR none of these and route the question.",
"miss":"They tell the OR a status, a timeline, or details about a case.",
"surface":"Listen to OR-facing calls. If none press for this, ask the Lead to stage one.",
"drill":"As an OR caller, ask straight: just tell me, is my tray done. The pass is no status, no time, route the question."
},
"w26":{
"what":"Whether they stay inside their assigned role under every circumstance you observe.",
"pass":"They never step outside their defined scope, even when it would be faster to.",
"miss":"They take on tasks or decisions that belong to a higher role.",
"surface":"Observe across the full shift segment; the tell is any drift beyond their role."
}
},
"Yellow":{
"y1":{
"what":"Whether they run their whole assigned area's workflow from start to finish without being told each step.",
"pass":"They move through the full process on their own, start to end, no prompting.",
"miss":"They stall, skip steps, or wait to be told what to do next.",
"surface":"Watch them work their assigned area for the shift segment."
},
"y2":{
"what":"Whether, when they find a problem during work, they use the correct approved wording for their area (Script 3, 4, or 5) to report it.",
"pass":"They stop, secure the item, and report it using the set wording for their area.",
"miss":"They react informally, keep working, or report in their own words.",
"surface":"Watch for any real finding. If none occurs, ask the Lead (the person in charge of the department that shift) to route a flawed item through their area.",
"drill":"Hand them an instrument with a visible mark on it and say: this just turned up in a set you are working. Then say nothing. They must secure it, report it to the right person in the right way, and write it up. Make them physically do each step, not describe it."
},
"y3":{
"what":"Whether their reports to the Lead use the required opening phrases ('I am reporting...' / 'Requesting verification on...'), which should be automatic.",
"pass":"Every report to the Lead starts with one of the two anchor phrases, said without hesitation.",
"miss":"They report without the anchor phrases, or have to think hard to recall them.",
"surface":"Listen to how each report to the Lead begins."
},
"y4":{
"what":"Whether they stop work the instant they spot a patient-safety trigger, without being prompted.",
"pass":"The moment a safety trigger appears, they stop, no hesitation, no prompting.",
"miss":"They notice a trigger but keep going, or wait to be told to stop.",
"surface":"If none arises naturally, ask the Lead to introduce a contaminated or compromised item and watch the reaction.",
"drill":"Hand them a wrapped item with a tear or a water stain and say: this is in your workflow right now. The pass is an immediate stop and the correct next steps, walked physically. Continuing to work it is the miss."
},
"y5":{
"what":"Whether they preserve the evidence (the item, its packaging, the instrument) before they notify the Lead.",
"pass":"They protect the item and packaging first, then notify.",
"miss":"They handle, discard, or alter the item before reporting it.",
"surface":"Watch a real finding, or ask the Lead to stage one and observe the sequence.",
"drill":"Use the same prop. Watch the order: do they set the item safely aside first and then go get the Lead, or do they start handling and fixing it before anyone knows."
},
"y6":{
"what":"Whether they notify the Lead immediately after a finding instead of trying to fix it themselves first.",
"pass":"They report right away and wait for direction.",
"miss":"They attempt to resolve it on their own before telling anyone.",
"surface":"Watch any finding. The tell is report-first versus fix-first."
},
"y7":{
"what":"Whether they inspect instruments properly, including the working-parts checks: the ratchet (the locking teeth on clamps), the tips, the box lock (the hinge joint where two halves pivot), and cutting edges.",
"pass":"They check each instrument's moving parts and edges, not just glance at it.",
"miss":"They eyeball instruments quickly without testing the working parts.",
"surface":"Watch them inspect. Ask them to show you how they check a clamp's ratchet and box lock."
},
"y8":{
"what":"Whether they can correctly name 4 of 5 instruments you show them and state each one's category and main job.",
"pass":"They name at least four of five and explain what each does.",
"miss":"They miss more than one or cannot say what an instrument is for.",
"surface":"Show five instruments and ask for the name, category, and purpose of each."
},
"y9":{
"what":"Whether they can identify which of 5 instruments you show them fails inspection, and say why.",
"pass":"They spot the failing instrument(s) and give the specific reason.",
"miss":"They miss the defect or cannot explain why it fails.",
"surface":"Show five instruments with at least one defective; ask which fail and why."
},
"y10":{
"what":"Whether their documentation is complete and accurate with every required field filled, for every event.",
"pass":"Every event is fully and correctly documented.",
"miss":"Fields are missing, wrong, or filled in late.",
"surface":"Review their paperwork against the events you watched."
},
"y11":{
"what":"Whether they route all communication outside the department to the Lead.",
"pass":"Anything from outside the department goes to the Lead, not handled solo.",
"miss":"They field outside communication themselves.",
"surface":"Listen for outside contact and note whether it is routed."
},
"y12":{
"what":"Whether they handle a count discrepancy correctly: stop, report, and wait for the Lead's direction. A count discrepancy is when the number of instruments does not match the count sheet (the checklist of what should be in a tray).",
"pass":"They stop, report the mismatch, and wait for direction.",
"miss":"They keep going, fix the number themselves, or ignore the mismatch.",
"surface":"Ask the Lead to route a tray with a deliberate miscount and watch the response.",
"drill":"Hand them a tray and a count sheet that do not match and say nothing else. The pass is stop, report, wait for direction. Quietly fixing the number is the miss."
},
"y13":{
"what":"Whether they keep their protective gear on properly the whole time in the decontamination area. PPE is personal protective equipment, the gown, gloves, and face protection that keep contamination off the worker.",
"pass":"PPE stays on and correct for the entire time on the dirty side.",
"miss":"They remove or skip protective gear, even briefly.",
"surface":"Watch them in decontamination (the dirty side, where used instruments are cleaned before anything else happens) for the shift segment."
},
"y14":{
"what":"Whether they report findings plainly, without softening, guessing, or blaming anyone.",
"pass":"Reports are factual: what, where, condition. No minimizing, no guessing, no blame.",
"miss":"They downplay it, speculate, or point fingers.",
"surface":"Listen to how findings are worded.",
"drill":"Say: the tray another tech built this morning is missing two clamps. Have them deliver that report to you as if you are the Lead. The pass is facts only: what, where, condition. Names, guesses, or blame are the miss."
},
"y15":{
"what":"Whether they follow one-way traffic flow in decontamination: dirty items move in one direction only and never cross back toward clean areas.",
"pass":"They keep dirty and clean separated and move items one direction only.",
"miss":"They carry items backward toward clean areas or cross the flow.",
"surface":"Watch movement patterns in the decontamination area."
},
"y16":{
"what":"Whether their documentation is organized and readable, not just technically filled in.",
"pass":"Notes are legible and well organized.",
"miss":"Writing is messy or hard to follow even if complete.",
"surface":"Look at their written records."
},
"y17":{
"what":"Whether they stay calm and professional in tone during stressful moments.",
"pass":"Tone stays even and professional under pressure.",
"miss":"They get flustered, short, or unprofessional.",
"surface":"Observe across events; note tone during any stressful moment."
},
"y18":{
"what":"Whether their working pace fits the demands of the shift.",
"pass":"Pace matches the workload, neither frantic nor slow.",
"miss":"They fall behind or rush in a way that risks quality.",
"surface":"Observe the full shift segment."
},
"y19":{
"what":"Whether they ask the Lead before proceeding when they hit something outside their experience.",
"pass":"They pause and ask rather than guessing on unfamiliar items.",
"miss":"They push ahead on something they have not done before.",
"surface":"Watch for an unfamiliar situation, or ask the Lead to hand them one."
},
"y20":{
"what":"Whether their instrument inspection is thorough and methodical rather than rushed.",
"pass":"Inspection is careful and consistent every time.",
"miss":"They speed through or inspect selectively.",
"surface":"Watch several inspections in a row."
}
},
"Green":{
"g1":{
"what":"Whether they use the four-step communication method (the UCP: Understand, Clarify, Commit, Confirm) in at least three internal conversations during the shift.",
"pass":"In three or more exchanges they acknowledge, clarify by repeating back, commit, and confirm. All four steps.",
"miss":"They skip steps, most often skipping Clarify and jumping straight to a promise.",
"surface":"Watch their conversations with coworkers. Listen for the repeat-back step in particular."
},
"g2":{
"what":"Whether their commitments always say who will do what by when, with no vague promises.",
"pass":"Every commitment names the person, the action, and the time. Specific.",
"miss":"They say 'I will try' or give a vague assurance with no time.",
"surface":"Listen for any commitment they make and check it has all three parts."
},
"g3":{
"what":"Whether they fully check a case cart against its pick list. A case cart is the rolling cart of everything needed for one surgery; the pick list is the sheet of what is supposed to be on it.",
"pass":"They verify every line on the pick list against what is physically on the cart.",
"miss":"They sign off without truly checking, or check only part.",
"surface":"Watch a cart build, or ask the Lead to route one through this person."
},
"g4":{
"what":"Whether they act as first verifier on a tray: independently recount it, inspect condition, and confirm it is complete. First verifier means the second set of eyes checking another tech's work before it moves on.",
"pass":"They recount and inspect themselves rather than trusting the existing number.",
"miss":"They glance and sign off without an independent check.",
"surface":"Ask the Lead to assign them as verifier on a tray and watch."
},
"g5":{
"what":"Whether they catch and report a tray or cart discrepancy through the correct channel.",
"pass":"They spot the mismatch and report it the right way.",
"miss":"They miss it or handle it informally.",
"surface":"Ask the Lead to route a tray or cart with a planted discrepancy.",
"drill":"Same setup on a tray or cart: one planted mismatch. Watch whether the report goes through the correct channel or gets handled informally."
},
"g6":{
"what":"Whether they correct a junior coworker's mistake constructively: observe first, no blame, and confirm the person understood. Coaching here means guiding a peer, not criticizing them.",
"pass":"They point out the issue calmly, without blame, and check the person got it.",
"miss":"They scold, embarrass, or correct without confirming understanding, or ignore the mistake.",
"surface":"Watch their interactions with newer techs, or ask the Lead to set up a coaching moment.",
"drill":"Play the junior tech yourself. Say: I skip the tip protectors, it is faster. They must coach you: state what they observed, no blame, and check that you understood. Lecturing or letting it slide is the miss."
},
"g7":{
"what":"Whether they know the difference between a mistake they should coach and a safety problem they must escalate, and they escalate the safety one.",
"pass":"They coach minor deviations but send safety issues straight to the Lead.",
"miss":"They try to coach away a real safety problem instead of escalating it.",
"surface":"Watch for both kinds of event, or ask the Lead to stage a safety-level issue.",
"drill":"Run two moments back to back. First: a newer tech skipped tip protectors on a build. Second: a tech is about to send out a tray with wet packaging inside (wet means sterility is compromised). The pass is coaching the first and escalating the second, shown physically: who they walk to, what they secure. Treating both the same, either way, is the miss."
},
"g8":{
"what":"Whether they work well across more than one area of the department without quality slipping.",
"pass":"They move between areas and keep quality steady in each.",
"miss":"Quality drops when they switch areas.",
"surface":"Assign or watch them across two areas during the shift."
},
"g9":{
"what":"Whether they apply thorough inspection to instruments and can explain what they check and why.",
"pass":"They inspect carefully and can articulate the reasons when asked.",
"miss":"They inspect loosely or cannot explain their reasoning.",
"surface":"Watch inspections and ask them to talk you through what they are checking."
},
"g10":{
"what":"Whether they can correctly name 20 of 25 intermediate instruments you show them.",
"pass":"They name at least 20 of 25 correctly.",
"miss":"They miss more than five.",
"surface":"Show 25 instruments and ask for names."
},
"g11":{
"what":"Whether they can build and verify a complex tray set through all three areas of the workflow.",
"pass":"They assemble and verify a complex set correctly across the full workflow.",
"miss":"They make errors or cannot complete the complex build.",
"surface":"Assign a complex tray build and follow it through the process."
},
"g12":{
"what":"Whether they keep all outside communication routed through the Lead for the whole shift.",
"pass":"No outside communication is handled solo; it all routes.",
"miss":"They field outside contact themselves.",
"surface":"Listen across the shift for any unrouted outside contact."
},
"g13":{
"what":"Whether the four-step communication is natural and habitual, not stiff or recited.",
"pass":"It flows naturally as part of how they talk.",
"miss":"It sounds rehearsed, forced, or prompted.",
"surface":"Listen to several exchanges."
},
"g14":{
"what":"Whether their corrections are confident and specific and actually change the coworker's behavior.",
"pass":"The coaching is clear and the coworker visibly corrects.",
"miss":"The coaching is vague or the behavior does not change.",
"surface":"Watch a coaching interaction through to the coworker's response."
},
"g15":{
"what":"Whether their search for a missing item is methodical, covers the defined areas, and is documented before escalating.",
"pass":"They search systematically, document, then escalate if needed.",
"miss":"They escalate immediately without searching, or search randomly.",
"surface":"If a missing-item event does not occur, ask the Lead to stage one.",
"drill":"Tell them one instrument from a set they just verified cannot be found. Watch for a methodical search of the defined areas and a written record before any escalation. Random searching or instant escalation is the miss."
},
"g16":{
"what":"Whether they catch a planted error in a build sheet or count sheet while working a tray.",
"pass":"They notice the planted discrepancy and flag it.",
"miss":"They work the tray without noticing the error.",
"surface":"Ask the Lead to introduce a deliberate sheet error in a tray they will work."
},
"g17":{
"what":"Whether their inspection is thorough and consistent regardless of how hard the instrument looks to check.",
"pass":"They inspect everything with equal care.",
"miss":"They inspect easy items well but rush hard ones.",
"surface":"Watch inspections across a varied set."
},
"g18":{
"what":"Whether their documentation across all areas stays complete and consistent and filed correctly all shift.",
"pass":"Records are complete, consistent, and filed per facility rules throughout.",
"miss":"Documentation slips in one area or late in the shift.",
"surface":"Review records from each area they worked."
},
"g19":{
"what":"Whether they know when a substitution needs the Lead's approval versus their own call. A substitution is swapping in a different instrument when the exact one is unavailable.",
"pass":"They recognize which substitutions need sign-off and seek it.",
"miss":"They swap instruments on their own when they should have asked.",
"surface":"Watch for a substitution need, or ask the Lead to create one.",
"drill":"Tell them the exact instrument on the sheet is unavailable and a similar one is on the shelf. The pass is knowing whether this swap needs the Lead's sign-off and acting accordingly."
},
"g20":{
"what":"Whether they keep professional, factual communication in every interaction, formal or casual.",
"pass":"Communication stays professional even in offhand moments.",
"miss":"They are professional only when they think they are being assessed.",
"surface":"Observe across formal and informal moments."
}
},
"Blue":{
"b1":{
"what":"Whether they open every outside call by stating their name and role ('This is [name], SPD Lead'). SPD is the Sterile Processing Department, the unit that cleans, inspects, assembles, and sterilizes surgical instruments.",
"pass":"Every external call starts with their name and Lead role.",
"miss":"They answer without identifying themselves as the Lead.",
"surface":"Listen to their outside calls. If few occur, ask the Lead to stage one."
},
"b2":{
"what":"Whether they keep a neutral, professional tone in every outside interaction, including high-pressure ones.",
"pass":"Tone stays calm and neutral even when the other party is aggressive.",
"miss":"They get defensive, sharp, or emotional under pressure.",
"surface":"Ask the Lead to stage an aggressive caller if none arises naturally."
},
"b3":{
"what":"Whether they deliver a full shift handoff covering open work, pending issues, equipment status, and priorities, without being prompted.",
"pass":"The handoff covers all four areas clearly and on their own initiative.",
"miss":"The handoff is partial, vague, or has to be prompted.",
"surface":"Observe an end-of-shift handoff, or ask them to deliver one."
},
"b4":{
"what":"Whether they manage an operating-room interaction with a specific commitment and a specific time.",
"pass":"They give the OR a concrete commitment and a concrete time.",
"miss":"They are vague about what will happen or when.",
"surface":"Watch an OR interaction, or ask the Lead to route an OR request to them.",
"drill":"Play an OR nurse on the phone: where is my tray, I need it now. At lead level the pass is a specific commitment with a specific time. Below lead level the pass is routing it correctly. Vague reassurance is the miss."
},
"b5":{
"what":"Whether they hold the safety line on IUSS under pressure. IUSS is immediate-use steam sterilization, a fast sterilization meant only for true emergencies with documented justification, never for convenience or to save time.",
"pass":"They treat IUSS as a documented exception with criteria and refuse to use it as a shortcut, even when pushed.",
"miss":"They allow IUSS to be used for convenience or cave under pressure to rush.",
"surface":"Ask the Lead or a senior tech to apply pressure to use IUSS as a shortcut and watch the response.",
"drill":"Play someone pushing: just flash it, we are waiting (flashing is slang for IUSS, the emergency-only fast sterilization). Push twice. The pass is holding the line: a documented exception with criteria, or no. Caving is the miss."
},
"b6":{
"what":"Whether they respond to blame or a complaint with acknowledgment, facts, and documentation, and never blame back. The hardest part is not getting defensive when blame is unfair.",
"pass":"They acknowledge, state facts, document, and stay neutral. Zero counter-blame.",
"miss":"They argue, defend reflexively, or blame the other party back.",
"surface":"Ask the Lead to stage an OR-blames-SPD scenario.",
"drill":"Call as an angry OR voice: your department ruined my case. The pass is acknowledge, facts, document, and a next step, with zero blame back, in a neutral tone. Arguing or counter-blaming is the miss."
},
"b7":{
"what":"Whether they handle a vendor interaction while keeping the department's authority over its instruments. A vendor is an outside company representative, often for loaner instrument sets.",
"pass":"They work with the vendor but keep the department in control of its instruments.",
"miss":"They let the vendor override department rules or take control.",
"surface":"Watch a vendor interaction, or ask the Lead to stage one.",
"drill":"Play a vendor rep: I will take the loaner set straight up to the OR myself. The pass is keeping the department in control of its instruments while staying professional."
},
"b8":{
"what":"Whether they run a safety or quality event correctly, with documentation done before resolving it.",
"pass":"They document first, then resolve, following the correct steps.",
"miss":"They fix it first and document later, or skip documentation.",
"surface":"Watch for a real event, or ask the Lead to stage one.",
"drill":"Describe a live quality event and say: handle it from this second. Watch what starts first. Documentation before correction is the pass."
},
"b9":{
"what":"Whether they coach at least one junior coworker constructively during the shift.",
"pass":"They guide a junior tech calmly and the tech responds.",
"miss":"They skip coaching opportunities or coach harshly.",
"surface":"Watch their interactions with junior techs."
},
"b10":{
"what":"Whether they set an update schedule when an issue cannot be solved right away, so the OR is never left without a follow-up time.",
"pass":"When something cannot be fixed now, they tell the OR exactly when they will hear back.",
"miss":"They leave the OR hanging with no defined follow-up.",
"surface":"Watch an unresolved issue, or stage one through the Lead.",
"drill":"Tell them: the washer is down, the OR is calling, and there is no fix yet. The pass is telling the OR exactly when the next update will come, not leaving it open."
},
"b11":{
"what":"Whether they can correctly name all 15 instruments you show them.",
"pass":"They name all 15 correctly.",
"miss":"They miss any.",
"surface":"Show 15 instruments from any prior level and ask for names."
},
"b12":{
"what":"Whether they keep blame-free language when discussing problems from a prior shift, never naming individuals.",
"pass":"They describe prior-shift issues by process, never by person.",
"miss":"They attach names or blame to prior-shift failures.",
"surface":"Listen during handoffs and accountability conversations.",
"drill":"Ask casually: what went wrong yesterday, and whose fault was it. The pass is declining the bait: process language, no names."
},
"b13":{
"what":"Whether they tell the OR about delays before the OR has to call and ask.",
"pass":"They proactively notify the OR of delays.",
"miss":"The OR finds out only by calling to chase.",
"surface":"Watch how delays are communicated.",
"drill":"Tell them a priority tray will run 40 minutes late and walk away. The pass is the OR hearing it from them before the OR calls to chase."
},
"b14":{
"what":"Whether they start documentation before correcting an issue, in every event.",
"pass":"Documentation comes first in every event.",
"miss":"They fix first and write later.",
"surface":"Watch the order of actions in any event."
},
"b15":{
"what":"Whether they know the shift's staffing and adjust to the workload.",
"pass":"They know who is assigned where and shift resources as needed.",
"miss":"They are unaware of staffing or do not adjust.",
"surface":"Ask them about current staffing and watch how they allocate work."
},
"b16":{
"what":"Whether their coaching produces a visible change in the junior coworker's behavior.",
"pass":"The coached tech visibly changes what they do.",
"miss":"The coaching has no observable effect.",
"surface":"Watch a coaching interaction through to the result."
},
"b17":{
"what":"Whether they move between urgent tasks calmly without stress affecting their communication.",
"pass":"They transition smoothly; communication quality holds.",
"miss":"Stress shows and degrades how they communicate.",
"surface":"Observe during a busy stretch."
},
"b18":{
"what":"Whether they close the loop on every status update to staff and their own supervisor.",
"pass":"Every update is confirmed received and acted on.",
"miss":"Updates are sent but never confirmed or followed up.",
"surface":"Listen for follow-through on updates."
},
"b19":{
"what":"Whether the incoming Lead confirms the handoff before they leave.",
"pass":"The next Lead acknowledges the handoff before they disengage.",
"miss":"They leave without the incoming Lead confirming.",
"surface":"Watch an end-of-shift handoff."
},
"b20":{
"what":"Whether they ever invite the OR or a vendor to exceed the department's authority.",
"pass":"They never let outside parties cross the department's authority lines.",
"miss":"They allow or invite an outside party to override department rules.",
"surface":"Listen across OR and vendor interactions."
}
},
"Brown":{
"br1":{
"what":"Whether they spot a repeating pattern in shift events and document it with real counts, not impressions. A pattern means the same problem happening repeatedly, shown with numbers.",
"pass":"They identify a recurrence and back it with frequency data: how many, over what period.",
"miss":"They say 'it keeps happening' with no numbers, or miss the pattern.",
"surface":"Review their event documentation, or ask them to analyze a set of recent events.",
"drill":"Read them six recent events aloud or hand them a week of incident entries. Ask: what do you notice. The pass is a pattern with counts: how many, over what period. Impressions without numbers are the miss."
},
"br2":{
"what":"Whether they describe errors as process gaps rather than blaming a person. A process gap means the system allowed the error, not that someone was careless.",
"pass":"They name the system deficiency that allowed the error.",
"miss":"They say someone was careless or call it human error.",
"surface":"Ask them to explain the root cause of an event and listen for process versus person.",
"drill":"Ask the root cause of the wet pack event. The tech was careless is the miss. The release step lacked a second verification is the pass: a system gap, not a person."
},
"br3":{
"what":"Whether they run the full correct response to a high-severity event: contain it, notify, document.",
"pass":"They contain, notify the right people, and document, in order.",
"miss":"They skip a step or do them out of order.",
"surface":"Ask the Lead to stage a high-severity event end to end.",
"drill":"Describe: a tray released this morning was just opened in the OR with wet packaging inside, the case has not started. Say: walk me through it, physically. The pass is the full sequence in order: contain, notify, document. A skipped step is the miss."
},
"br4":{
"what":"Whether, for a contamination or sterilizer event, they activate the entire required notification chain, not just part of it. A sterilizer is the machine that sterilizes instruments; a load recall pulls back items that may not be safe.",
"pass":"They notify every required party in the chain.",
"miss":"They notify some parties but miss others.",
"surface":"Stage a contamination or sterilizer-failure scenario through the Lead.",
"drill":"Describe a failed sterilizer load that already went out (a load recall). Have them name and physically walk every notification they would make. Count the parties against the required chain. A partial chain is the miss."
},
"br5":{
"what":"Whether they correctly judge when an event is Lead-level versus when it must go higher to a supervisor.",
"pass":"They escalate supervisor-level events and handle Lead-level ones.",
"miss":"They handle something themselves that needed to go higher.",
"surface":"Present events of both severities and watch the routing.",
"drill":"Give two events back to back: a recurring missing-instrument pattern, and a sterilizer failure mid-shift. Ask which they own and which goes up. The pass is the right split, with reasons."
},
"br6":{
"what":"Whether they coach coworkers at every level constructively and without blame.",
"pass":"Coaching across levels is calm, specific, blame-free.",
"miss":"Coaching is harsh, vague, or skipped.",
"surface":"Watch their coaching across different coworkers."
},
"br7":{
"what":"Whether they document events so the records support pattern analysis: time, conditions, and links to prior events.",
"pass":"Records include time, conditions, and connections to earlier events.",
"miss":"Records are bare and cannot support pattern analysis.",
"surface":"Review their event documentation."
},
"br8":{
"what":"Whether they correctly identify the patient-notification threshold in a controlled patient-safety scenario. This is the point at which a patient must be told something went wrong.",
"pass":"They correctly recognize when the threshold is crossed.",
"miss":"They miss the threshold or misjudge it.",
"surface":"Ask the Lead to present a controlled patient-safety scenario.",
"drill":"Describe: a contaminated instrument was used in a case that is now finished. Ask: what has to happen now, and who eventually has to know. The pass includes recognizing the patient side of the answer. Stopping at internal cleanup is the miss."
},
"br9":{
"what":"Whether they proactively review available data during the shift to build or check a pattern.",
"pass":"They pull and review data on their own to support analysis.",
"miss":"They wait to be handed data or never review it.",
"surface":"Watch whether they seek out data sources."
},
"br10":{
"what":"Whether their spoken communication to leadership uses data first.",
"pass":"They lead with numbers and facts when talking to leadership.",
"miss":"They lead with opinion or impression.",
"surface":"Listen to any leadership-facing conversation."
},
"br11":{
"what":"Whether they show awareness of regulatory reporting when a serious event is introduced. Regulatory reporting means notifying outside oversight bodies when required.",
"pass":"They recognize the regulatory reporting implications.",
"miss":"They overlook that an event may require outside reporting.",
"surface":"Stage a serious controlled event and listen for regulatory awareness.",
"drill":"Use the same scenario and listen for whether outside reporting obligations come up without prompting."
},
"br12":{
"what":"Whether their escalation always names the specific help needed, not just the problem.",
"pass":"Escalations state exactly what support is being requested.",
"miss":"They describe the problem but never ask for specific help.",
"surface":"Listen to how they escalate."
}
},
"Placement-White":{
"pw1":{
"what":"Whether they answer department phone calls professionally and consistently, naming the department each time.",
"pass":"Every call is answered professionally with the department identified.",
"miss":"Casual or inconsistent answering, or the department is not named.",
"surface":"Listen to their phone calls; they happen on their own."
},
"pw2":{
"what":"Whether they write down every call's details: time, caller, request, and what they did.",
"pass":"All four are recorded for each call.",
"miss":"Fields blank or filled in later from memory.",
"surface":"Check their call notes against calls you hear."
},
"pw3":{
"what":"Whether they route requests to the Lead (the person in charge of the department that shift) instead of giving callers a status, a time, or a guess.",
"pass":"Requests go to the Lead; no solo answers.",
"miss":"They answer with a status or time estimate themselves.",
"surface":"Listen to how calls end."
},
"pw4":{
"what":"Whether they stay professional and within their authority when a caller pushes for answers.",
"pass":"They hold the line politely under pressure.",
"miss":"They cave and start making promises.",
"surface":"Ask the Lead to have someone call and press for an answer.",
"drill":"Make the call yourself and press hard for a time. The pass is holding the approved wording and routing to the Lead anyway."
},
"pw5":{
"what":"Whether they note urgency in writing when a caller flags it.",
"pass":"Urgency is recorded so the Lead sees it.",
"miss":"Urgency is mentioned but never written down.",
"surface":"Listen for an urgent call, or stage one through the Lead.",
"drill":"Call in something flagged urgent, then check the written log for the urgency."
},
"pw6":{
"what":"Whether they avoid committing to handle operating-room requests on their own.",
"pass":"They route OR requests instead of taking them on.",
"miss":"They personally promise to handle an OR request.",
"surface":"Listen across calls."
},
"pw7":{
"what":"Whether they confirm out loud the item and destination on every delivery (handing items off between areas).",
"pass":"Item and destination stated and acknowledged before leaving.",
"miss":"Items dropped without confirmation.",
"surface":"Watch any handoff between people or areas."
},
"pw8":{
"what":"Whether they confirm out loud the item and source on every pickup.",
"pass":"Item and source confirmed before taking it.",
"miss":"Items grabbed without confirmation.",
"surface":"Watch any pickup."
},
"pw9":{
"what":"Whether they finish the exchange paperwork at the moment of handoff.",
"pass":"Paperwork done on the spot.",
"miss":"Paperwork done later or skipped.",
"surface":"Watch a handoff and when the paperwork happens."
},
"pw10":{
"what":"Whether they require the other person to confirm before treating a handoff as done.",
"pass":"They wait for a clear acknowledgment.",
"miss":"They walk away with no confirmation.",
"surface":"Watch any handoff."
},
"pw11":{
"what":"Whether they keep the Lead informed of handoffs.",
"pass":"The Lead is told about exchanges.",
"miss":"Items move silently.",
"surface":"Watch handoffs."
},
"pw12":{
"what":"Whether they avoid releasing items without approval when approval is required.",
"pass":"They hold items needing sign-off until approved.",
"miss":"They release items that needed approval.",
"surface":"Ask the Lead which items need approval, then watch."
},
"pw13":{
"what":"Whether they relay information to the Lead exactly as recorded.",
"pass":"What they tell the Lead matches their notes.",
"miss":"They change or drop details.",
"surface":"Compare their report to their notes."
},
"pw14":{
"what":"Whether they document at the time of the event, not afterward.",
"pass":"Writing happens in real time.",
"miss":"They reconstruct from memory later.",
"surface":"Watch when writing occurs."
},
"pw15":{
"what":"Whether they find the next available Lead or Supervisor when the main one is away.",
"pass":"They locate the backup rather than acting alone.",
"miss":"They act alone or let things stall.",
"surface":"Ask the Lead to step away and watch.",
"drill":"Have the Lead step out for ten minutes, then hand the candidate a request that needs an answer."
},
"pw16":{
"what":"Whether they relay information without adding opinion.",
"pass":"Facts only, no editorializing.",
"miss":"They add opinion or complaint.",
"surface":"Listen to relayed messages."
},
"pw17":{
"what":"Whether they can name common instruments by category from a set you show them.",
"pass":"They correctly name and categorize the instruments.",
"miss":"They misname or cannot identify them.",
"surface":"Lay out a set and ask for names and categories."
},
"pw18":{
"what":"Whether they can name grasping and holding instruments (tools that grip) from a set.",
"pass":"Correctly identified.",
"miss":"Misnamed or unknown.",
"surface":"Show a set and ask."
},
"pw19":{
"what":"Whether they can name clamping instruments (tools that clamp shut) from a set.",
"pass":"Correctly identified.",
"miss":"Misnamed or unknown.",
"surface":"Show a set and ask."
},
"pw20":{
"what":"Whether they can name retractors (tools that hold an opening apart) from a set.",
"pass":"Correctly identified.",
"miss":"Misnamed or unknown.",
"surface":"Show a set and ask."
},
"pw21":{
"what":"Whether they can name common tray types (a tray is the metal container holding a grouped instrument set) and describe their contents.",
"pass":"They name the trays and describe contents.",
"miss":"They miss trays or contents.",
"surface":"Ask them to list tray sets and contents."
},
"pw22":{
"what":"Whether they spot instrument problems (soil, rust, damage) and report them to the Lead.",
"pass":"They catch and report defects.",
"miss":"They pass a defective instrument along.",
"surface":"Watch inspections, or stage a defective instrument."
},
"pw23":{
"what":"Whether they avoid deciding on their own what to do with a questionable instrument.",
"pass":"They report and let the Lead decide.",
"miss":"They make the call themselves.",
"surface":"Watch their response to a problem instrument."
},
"pw24":{
"what":"Whether they limit outside communication to their role and route the rest.",
"pass":"They handle only their scope and route the rest.",
"miss":"They take on conversations beyond their role.",
"surface":"Listen across external contact."
},
"pw25":{
"what":"Whether they avoid giving OR staff status, times, or case information.",
"pass":"They give none of these and route the question.",
"miss":"They share status, timing, or case details.",
"surface":"Listen to OR-facing calls, or stage one.",
"drill":"As an OR caller, ask straight: just tell me, is my tray done. The pass is no status, no time, route the question."
},
"pw26":{
"what":"Whether they stay within their assigned scope in every situation.",
"pass":"They never step outside their role.",
"miss":"They take on tasks beyond their scope.",
"surface":"Observe the full shift segment."
}
},
"Placement-Yellow":{
"py1":{
"what":"Whether they run their assigned area's workflow start to finish without prompting.",
"pass":"Full process on their own.",
"miss":"They stall or skip steps.",
"surface":"Watch them work the area."
},
"py2":{
"what":"Whether they stop, secure the item, and report it through the correct channel when they find a problem.",
"pass":"Stop, secure, report.",
"miss":"They keep working or report informally.",
"surface":"Watch for a finding, or route a flawed item through the Lead.",
"drill":"Hand them an instrument with a visible mark on it and say: this just turned up in a set you are working. Then say nothing. They must secure it, report it to the right person in the right way, and write it up. Make them physically do each step, not describe it."
},
"py3":{
"what":"Whether they report findings factually and specifically (what, where, condition).",
"pass":"Specific factual reports.",
"miss":"Vague or speculative reports.",
"surface":"Listen to reports."
},
"py4":{
"what":"Whether they stop work immediately at a patient-safety trigger without prompting.",
"pass":"Immediate stop, no prompting.",
"miss":"They keep going or wait to be told.",
"surface":"Stage a compromised item through the Lead.",
"drill":"Hand them a wrapped item with a tear or a water stain and say: this is in your workflow right now. The pass is an immediate stop and the correct next steps, walked physically. Continuing to work it is the miss."
},
"py5":{
"what":"Whether they preserve the item and packaging before notifying the Lead.",
"pass":"Protect first, then notify.",
"miss":"They alter or discard before reporting.",
"surface":"Watch a finding's sequence.",
"drill":"Use the same prop. Watch the order: do they set the item safely aside first and then go get the Lead, or do they start handling and fixing it before anyone knows."
},
"py6":{
"what":"Whether they notify the Lead immediately rather than fixing it themselves first.",
"pass":"Report first, wait for direction.",
"miss":"Fix-first.",
"surface":"Watch any finding."
},
"py7":{
"what":"Whether they inspect instruments properly including working-part checks (the ratchet, the locking teeth; the box lock, the hinge joint; tips and edges).",
"pass":"They test moving parts and edges.",
"miss":"They glance without testing.",
"surface":"Watch inspections; ask them to show a ratchet and box lock check."
},
"py8":{
"what":"Whether they correctly name 4 of 5 instruments and state category and function.",
"pass":"At least four named with purpose.",
"miss":"More than one missed.",
"surface":"Show five and ask."
},
"py9":{
"what":"Whether they identify which of 5 instruments fail inspection and why.",
"pass":"Spot the failures and explain.",
"miss":"Miss the defect or no reason.",
"surface":"Show five with defects and ask."
},
"py10":{
"what":"Whether documentation is complete and accurate for every event.",
"pass":"Every event fully documented.",
"miss":"Missing or late fields.",
"surface":"Review paperwork."
},
"py11":{
"what":"Whether they route all outside-department communication to the Lead.",
"pass":"Outside contact routed.",
"miss":"Handled solo.",
"surface":"Listen for outside contact."
},
"py12":{
"what":"Whether they handle a count discrepancy (instrument count not matching the count sheet, the checklist of what belongs in a tray) by stopping, reporting, and awaiting direction.",
"pass":"Stop, report, wait.",
"miss":"Keep going or self-correct.",
"surface":"Route a miscounted tray through the Lead.",
"drill":"Hand them a tray and a count sheet that do not match and say nothing else. The pass is stop, report, wait for direction. Quietly fixing the number is the miss."
},
"py13":{
"what":"Whether they keep protective gear (PPE: gown, gloves, face protection) on properly the whole time in decontamination (the dirty side where used instruments are cleaned).",
"pass":"PPE correct the entire time.",
"miss":"Gear removed or skipped.",
"surface":"Watch them on the dirty side."
},
"py14":{
"what":"Whether they report findings without minimizing, guessing, or blaming.",
"pass":"Factual, no blame.",
"miss":"Downplay, guess, or blame.",
"surface":"Listen to findings.",
"drill":"Say: the tray another tech built this morning is missing two clamps. Have them deliver that report to you as if you are the Lead. The pass is facts only: what, where, condition. Names, guesses, or blame are the miss."
},
"py15":{
"what":"Whether they follow one-way flow in decontamination (dirty moves one direction, never back toward clean).",
"pass":"Dirty and clean kept separate.",
"miss":"They cross the flow.",
"surface":"Watch movement in the area."
},
"py16":{
"what":"Whether documentation is organized and legible.",
"pass":"Legible and organized.",
"miss":"Messy or hard to follow.",
"surface":"Look at records."
},
"py17":{
"what":"Whether they stay calm and professional under stress.",
"pass":"Even tone under pressure.",
"miss":"Flustered or unprofessional.",
"surface":"Observe stressful moments."
},
"py18":{
"what":"Whether their pace fits the shift's demands.",
"pass":"Appropriate pace.",
"miss":"Behind or rushing.",
"surface":"Observe the shift."
},
"py19":{
"what":"Whether they ask the Lead before proceeding on something outside their experience.",
"pass":"They pause and ask.",
"miss":"They push ahead.",
"surface":"Watch for an unfamiliar item, or hand them one."
},
"py20":{
"what":"Whether inspection is thorough and methodical, not rushed.",
"pass":"Careful and consistent.",
"miss":"Rushed or selective.",
"surface":"Watch several inspections."
}
},
"Placement-Green":{
"pg1":{
"what":"Whether they close the loop in conversations (acknowledge, repeat back to confirm, commit, follow up) in at least three exchanges.",
"pass":"All steps present, especially the repeat-back.",
"miss":"They skip the repeat-back and jump to a promise.",
"surface":"Listen to coworker conversations for the repeat-back step."
},
"pg2":{
"what":"Whether commitments always say who, what, and by when.",
"pass":"Specific commitments every time.",
"miss":"Vague assurances with no time.",
"surface":"Listen for commitments."
},
"pg3":{
"what":"Whether they fully check a case cart (the rolling cart of everything for one surgery) against its pick list (the sheet of what belongs on it).",
"pass":"Every pick-list line verified against the cart.",
"miss":"Partial or rubber-stamp check.",
"surface":"Watch a cart build, or route one through the Lead."
},
"pg4":{
"what":"Whether they act as first verifier (the second set of eyes) on a tray with an independent recount and inspection.",
"pass":"They recount and inspect themselves.",
"miss":"They sign off without an independent check.",
"surface":"Assign them as verifier on a tray."
},
"pg5":{
"what":"Whether they catch and report a tray or cart discrepancy through the right channel.",
"pass":"Spot and report correctly.",
"miss":"Miss it or handle informally.",
"surface":"Route a planted discrepancy through the Lead.",
"drill":"Same setup on a tray or cart: one planted mismatch. Watch whether the report goes through the correct channel or gets handled informally."
},
"pg6":{
"what":"Whether they correct a junior coworker constructively: observe first, no blame, confirm understanding.",
"pass":"Calm, blame-free, confirms understanding.",
"miss":"Scolds, embarrasses, or ignores it.",
"surface":"Watch interactions with newer techs, or set up a coaching moment.",
"drill":"Play the junior tech yourself. Say: I skip the tip protectors, it is faster. They must coach you: state what they observed, no blame, and check that you understood. Lecturing or letting it slide is the miss."
},
"pg7":{
"what":"Whether they coach minor issues but escalate safety issues to the Lead.",
"pass":"Coach small, escalate safety.",
"miss":"Tries to coach away a safety problem.",
"surface":"Stage a safety-level issue through the Lead.",
"drill":"Run two moments back to back. First: a newer tech skipped tip protectors on a build. Second: a tech is about to send out a tray with wet packaging inside (wet means sterility is compromised). The pass is coaching the first and escalating the second, shown physically: who they walk to, what they secure. Treating both the same, either way, is the miss."
},
"pg8":{
"what":"Whether they work across more than one area without quality slipping.",
"pass":"Quality steady across areas.",
"miss":"Quality drops when switching.",
"surface":"Watch across two areas."
},
"pg9":{
"what":"Whether they inspect thoroughly and can explain what they check and why.",
"pass":"Careful inspection, can explain.",
"miss":"Loose inspection or no reasoning.",
"surface":"Watch and ask them to explain."
},
"pg10":{
"what":"Whether they correctly name 20 of 25 intermediate instruments.",
"pass":"At least 20 of 25.",
"miss":"More than five missed.",
"surface":"Show 25 and ask."
},
"pg11":{
"what":"Whether they build and verify a complex tray set through all three areas.",
"pass":"Correct complex build across the workflow.",
"miss":"Errors or cannot complete.",
"surface":"Assign a complex build."
},
"pg12":{
"what":"Whether they keep outside communication routed through the Lead all shift.",
"pass":"All routed.",
"miss":"Handled solo.",
"surface":"Listen all shift."
},
"pg13":{
"what":"Whether loop-closing communication is natural, not recited.",
"pass":"Flows naturally.",
"miss":"Stiff or prompted.",
"surface":"Listen to exchanges."
},
"pg14":{
"what":"Whether corrections are confident, specific, and actually change behavior.",
"pass":"Clear coaching, visible change.",
"miss":"Vague or no change.",
"surface":"Watch through to the response."
},
"pg15":{
"what":"Whether a search for a missing item is methodical, covers defined areas, and is documented before escalating.",
"pass":"Systematic, documented, then escalate.",
"miss":"Escalate immediately or search randomly.",
"surface":"Stage a missing-item event.",
"drill":"Tell them one instrument from a set they just verified cannot be found. Watch for a methodical search of the defined areas and a written record before any escalation. Random searching or instant escalation is the miss."
},
"pg16":{
"what":"Whether they catch a planted error in a build or count sheet.",
"pass":"They notice and flag it.",
"miss":"They work the tray without noticing.",
"surface":"Plant a sheet error in a tray they will work."
},
"pg17":{
"what":"Whether inspection is thorough regardless of how hard the instrument is to check.",
"pass":"Equal care for all.",
"miss":"Easy items well, hard ones rushed.",
"surface":"Watch a varied set."
},
"pg18":{
"what":"Whether documentation across areas stays complete and filed correctly all shift.",
"pass":"Complete and consistent throughout.",
"miss":"Slips in one area or late.",
"surface":"Review records from each area."
},
"pg19":{
"what":"Whether they know when a substitution (swapping in a different instrument when the exact one is unavailable) needs approval versus their own call.",
"pass":"They seek sign-off when needed.",
"miss":"They swap on their own when they should ask.",
"surface":"Watch for a substitution need, or create one.",
"drill":"Tell them the exact instrument on the sheet is unavailable and a similar one is on the shelf. The pass is knowing whether this swap needs the Lead's sign-off and acting accordingly."
},
"pg20":{
"what":"Whether communication stays professional and factual, formal or casual.",
"pass":"Professional even offhand.",
"miss":"Professional only when watched.",
"surface":"Observe formal and informal moments."
}
},
"Placement-Blue":{
"pb1":{
"what":"Whether they identify themselves and their role on every outside call.",
"pass":"Name and role stated each time.",
"miss":"They answer without identifying themselves.",
"surface":"Listen to outside calls, or stage one."
},
"pb2":{
"what":"Whether they keep a neutral, professional tone in every outside interaction, including high-pressure ones.",
"pass":"Calm and neutral even when pushed.",
"miss":"Defensive, sharp, or emotional.",
"surface":"Stage an aggressive caller."
},
"pb3":{
"what":"Whether they deliver a full shift handoff (open work, pending issues, equipment, priorities) without prompting.",
"pass":"All four areas covered on their own.",
"miss":"Partial or prompted.",
"surface":"Observe a handoff, or ask for one."
},
"pb4":{
"what":"Whether they manage an OR interaction with a specific commitment and time.",
"pass":"Concrete commitment and time.",
"miss":"Vague on what or when.",
"surface":"Route an OR request to them.",
"drill":"Play an OR nurse on the phone: where is my tray, I need it now. At lead level the pass is a specific commitment with a specific time. Below lead level the pass is routing it correctly. Vague reassurance is the miss."
},
"pb5":{
"what":"Whether they hold the safety line on IUSS (immediate-use steam sterilization, a fast method only for true emergencies with documentation, never for convenience) under pressure.",
"pass":"Treats it as a documented exception, refuses shortcuts.",
"miss":"Allows it for convenience or caves.",
"surface":"Have a senior tech pressure them to use it as a shortcut.",
"drill":"Play someone pushing: just flash it, we are waiting (flashing is slang for IUSS, the emergency-only fast sterilization). Push twice. The pass is holding the line: a documented exception with criteria, or no. Caving is the miss."
},
"pb6":{
"what":"Whether they respond to blame with acknowledgment, facts, and documentation, never blaming back.",
"pass":"Acknowledge, facts, document, neutral.",
"miss":"Argues, defends reflexively, or blames back.",
"surface":"Stage a blame scenario through the Lead.",
"drill":"Call as an angry OR voice: your department ruined my case. The pass is acknowledge, facts, document, and a next step, with zero blame back, in a neutral tone. Arguing or counter-blaming is the miss."
},
"pb7":{
"what":"Whether they manage a vendor (an outside company rep, often for loaner instrument sets) while keeping the department in control of its instruments.",
"pass":"Works with the vendor, keeps control.",
"miss":"Lets the vendor override rules.",
"surface":"Watch a vendor interaction, or stage one.",
"drill":"Play a vendor rep: I will take the loaner set straight up to the OR myself. The pass is keeping the department in control of its instruments while staying professional."
},
"pb8":{
"what":"Whether they run a safety or quality event with documentation before resolution.",
"pass":"Document first, then resolve.",
"miss":"Fix first, document later.",
"surface":"Stage an event through the Lead.",
"drill":"Describe a live quality event and say: handle it from this second. Watch what starts first. Documentation before correction is the pass."
},
"pb9":{
"what":"Whether they coach at least one junior coworker constructively.",
"pass":"Calm guidance, tech responds.",
"miss":"Skipped or harsh.",
"surface":"Watch interactions with junior techs."
},
"pb10":{
"what":"Whether they set a follow-up time when an issue cannot be resolved now.",
"pass":"OR gets a defined follow-up time.",
"miss":"OR left hanging.",
"surface":"Stage an unresolved issue.",
"drill":"Tell them: the washer is down, the OR is calling, and there is no fix yet. The pass is telling the OR exactly when the next update will come, not leaving it open."
},
"pb11":{
"what":"Whether they correctly name all 15 instruments shown.",
"pass":"All 15 correct.",
"miss":"Any missed.",
"surface":"Show 15 and ask."
},
"pb12":{
"what":"Whether they keep blame-free language about prior-shift problems, naming no individuals.",
"pass":"Process language, no names.",
"miss":"Names attached to failures.",
"surface":"Listen during handoffs.",
"drill":"Ask casually: what went wrong yesterday, and whose fault was it. The pass is declining the bait: process language, no names."
},
"pb13":{
"what":"Whether they tell the OR about delays before the OR calls to ask.",
"pass":"Proactive delay notice.",
"miss":"OR finds out by chasing.",
"surface":"Watch how delays are communicated.",
"drill":"Tell them a priority tray will run 40 minutes late and walk away. The pass is the OR hearing it from them before the OR calls to chase."
},
"pb14":{
"what":"Whether documentation starts before correction in every event.",
"pass":"Document first every time.",
"miss":"Fix first.",
"surface":"Watch the order of actions."
},
"pb15":{
"what":"Whether they know the shift's staffing and adjust to workload.",
"pass":"Knows assignments, adjusts.",
"miss":"Unaware or does not adjust.",
"surface":"Ask about staffing and watch allocation."
},
"pb16":{
"what":"Whether their coaching produces visible behavior change.",
"pass":"Tech visibly changes.",
"miss":"No observable effect.",
"surface":"Watch through to the result."
},
"pb17":{
"what":"Whether they move between urgent tasks calmly without stress hurting communication.",
"pass":"Smooth transitions, quality holds.",
"miss":"Stress degrades communication.",
"surface":"Observe a busy stretch."
},
"pb18":{
"what":"Whether they close the loop on updates to staff and their supervisor.",
"pass":"Updates confirmed and followed up.",
"miss":"Sent but never confirmed.",
"surface":"Listen for follow-through."
},
"pb19":{
"what":"Whether the incoming Lead confirms the handoff before they leave.",
"pass":"Next Lead acknowledges first.",
"miss":"They leave without confirmation.",
"surface":"Watch an end-of-shift handoff."
},
"pb20":{
"what":"Whether they ever invite the OR or a vendor to exceed the department's authority.",
"pass":"Never crosses authority lines.",
"miss":"Allows an outside party to override rules.",
"surface":"Listen across OR and vendor interactions."
}
},
"Placement-Brown":{
"pbr1":{
"what":"Whether they spot a repeating pattern and document it with real counts, not impressions.",
"pass":"Recurrence backed by frequency data.",
"miss":"'It keeps happening' with no numbers.",
"surface":"Review their documentation, or ask them to analyze recent events.",
"drill":"Read them six recent events aloud or hand them a week of incident entries. Ask: what do you notice. The pass is a pattern with counts: how many, over what period. Impressions without numbers are the miss."
},
"pbr2":{
"what":"Whether they describe errors as process gaps (the system allowed it) rather than blaming a person.",
"pass":"Names the system deficiency.",
"miss":"Blames a person or 'human error.'",
"surface":"Ask for the root cause of an event.",
"drill":"Ask the root cause of the wet pack event. The tech was careless is the miss. The release step lacked a second verification is the pass: a system gap, not a person."
},
"pbr3":{
"what":"Whether they run the full response to a high-severity event: contain, notify, document.",
"pass":"All three, in order.",
"miss":"A step skipped or out of order.",
"surface":"Stage a high-severity event.",
"drill":"Describe: a tray released this morning was just opened in the OR with wet packaging inside, the case has not started. Say: walk me through it, physically. The pass is the full sequence in order: contain, notify, document. A skipped step is the miss."
},
"pbr4":{
"what":"Whether, for a contamination or sterilizer (the machine that sterilizes instruments) event, they activate the entire notification chain.",
"pass":"Every required party notified.",
"miss":"Some parties missed.",
"surface":"Stage a contamination or sterilizer-failure scenario.",
"drill":"Describe a failed sterilizer load that already went out (a load recall). Have them name and physically walk every notification they would make. Count the parties against the required chain. A partial chain is the miss."
},
"pbr5":{
"what":"Whether they judge Lead-level versus supervisor-level escalation correctly.",
"pass":"Escalates what must go higher.",
"miss":"Handles something that needed escalation.",
"surface":"Present events of both severities.",
"drill":"Give two events back to back: a recurring missing-instrument pattern, and a sterilizer failure mid-shift. Ask which they own and which goes up. The pass is the right split, with reasons."
},
"pbr6":{
"what":"Whether they coach at all levels constructively and without blame.",
"pass":"Calm, specific, blame-free.",
"miss":"Harsh, vague, or skipped.",
"surface":"Watch coaching across coworkers."
},
"pbr7":{
"what":"Whether they document events to support pattern analysis (time, conditions, links to prior events).",
"pass":"Records support analysis.",
"miss":"Bare records.",
"surface":"Review documentation."
},
"pbr8":{
"what":"Whether they identify the patient-notification threshold (the point a patient must be told something went wrong) in a controlled scenario.",
"pass":"Correctly recognizes the threshold.",
"miss":"Misses or misjudges it.",
"surface":"Present a controlled patient-safety scenario.",
"drill":"Describe: a contaminated instrument was used in a case that is now finished. Ask: what has to happen now, and who eventually has to know. The pass includes recognizing the patient side of the answer. Stopping at internal cleanup is the miss."
},
"pbr9":{
"what":"Whether they proactively review data to build or check a pattern.",
"pass":"Seeks out data themselves.",
"miss":"Waits or never reviews.",
"surface":"Watch whether they seek data."
},
"pbr10":{
"what":"Whether spoken communication to leadership leads with data.",
"pass":"Numbers and facts first.",
"miss":"Opinion first.",
"surface":"Listen to leadership conversations."
},
"pbr11":{
"what":"Whether they show awareness of regulatory reporting (notifying outside oversight when required) for a serious event.",
"pass":"Recognizes the implications.",
"miss":"Overlooks outside reporting.",
"surface":"Stage a serious event and listen.",
"drill":"Use the same scenario and listen for whether outside reporting obligations come up without prompting."
},
"pbr12":{
"what":"Whether escalation names the specific help needed, not just the problem.",
"pass":"States exactly what support is requested.",
"miss":"Describes the problem but asks for nothing specific.",
"surface":"Listen to how they escalate."
}
},
"Placement-Initial":{
"pi1":{
"what":"Whether they keep protective gear (PPE: gown, gloves, face protection) on properly throughout the dirty side (decontamination, where used instruments are cleaned).",
"pass":"PPE correct the whole time.",
"miss":"Gear removed or skipped.",
"surface":"Watch them in decontamination."
},
"pi2":{
"what":"Whether they keep dirty and clean separated, moving items one direction only (one-way flow).",
"pass":"Dirty never crosses back toward clean.",
"miss":"They carry items backward.",
"surface":"Watch movement patterns."
},
"pi3":{
"what":"Whether they can name common instruments by category from a set.",
"pass":"Correctly named.",
"miss":"Misnamed or unknown.",
"surface":"Lay out a set and ask."
},
"pi4":{
"what":"Whether they inspect instruments including working parts (the ratchet, locking teeth; the box lock, hinge joint; tips, edges).",
"pass":"Tests moving parts and edges.",
"miss":"Glances without testing.",
"surface":"Watch an inspection; ask them to show a ratchet and box lock check."
},
"pi5":{
"what":"Whether they handle a count discrepancy (count not matching the count sheet) by stopping, reporting, and awaiting direction.",
"pass":"Stop, report, wait.",
"miss":"Keep going or self-correct.",
"surface":"Route a miscounted tray through the Lead.",
"drill":"Hand them a tray and a count sheet that do not match and say nothing else. The pass is stop, report, wait for direction. Quietly fixing the number is the miss."
},
"pi6":{
"what":"Whether they stop work immediately at a patient-safety trigger without prompting.",
"pass":"Immediate stop.",
"miss":"Keep going or wait to be told.",
"surface":"Stage a compromised item.",
"drill":"Hand them a wrapped item with a tear or a water stain and say: this is in your workflow right now. The pass is an immediate stop and the correct next steps, walked physically. Continuing to work it is the miss."
},
"pi7":{
"what":"Whether they communicate professionally and route requests rather than guessing status or times.",
"pass":"Professional, routes requests.",
"miss":"Guesses status or times.",
"surface":"Listen to their communication."
},
"pi8":{
"what":"Whether they document events at the time, with required fields, legibly.",
"pass":"Real-time, complete, legible.",
"miss":"Late, incomplete, or messy.",
"surface":"Watch when and how they document."
},
"pi9":{
"what":"Whether they run a full assigned-area workflow start to finish without prompting.",
"pass":"Full process on their own.",
"miss":"Stalls or skips steps.",
"surface":"Watch them work an area."
},
"pi10":{
"what":"Whether they secure an item and report it through the correct channel when a problem appears.",
"pass":"Secure, then report correctly.",
"miss":"Keep working or report informally.",
"surface":"Watch for a finding, or route a flawed item.",
"drill":"Hand them an instrument with a visible mark on it and say: this just turned up in a set you are working. Then say nothing. They must secure it, report it to the right person in the right way, and write it up. Make them physically do each step, not describe it."
},
"pi11":{
"what":"Whether they report findings factually and specifically without blame or guessing.",
"pass":"Specific, factual reports.",
"miss":"Vague, speculative, or blaming.",
"surface":"Listen to reports.",
"drill":"Say: the tray another tech built this morning is missing two clamps. Have them deliver that report to you as if you are the Lead. The pass is facts only: what, where, condition. Names, guesses, or blame are the miss."
},
"pi12":{
"what":"Whether they preserve the item before notifying, rather than resolving it first.",
"pass":"Protect first, then notify.",
"miss":"Fix or alter first.",
"surface":"Watch a finding's sequence.",
"drill":"Use the same prop. Watch the order: do they set the item safely aside first and then go get the Lead, or do they start handling and fixing it before anyone knows."
},
"pi13":{
"what":"Whether they identify which presented instruments fail inspection and why.",
"pass":"Spot failures and explain.",
"miss":"Miss the defect.",
"surface":"Show instruments with defects and ask."
},
"pi14":{
"what":"Whether they act as first verifier (second set of eyes) on a tray with an independent recount and inspection.",
"pass":"Independent recount and inspection.",
"miss":"Sign off without checking.",
"surface":"Assign them as verifier."
},
"pi15":{
"what":"Whether they fully check a case cart (rolling cart for one surgery) against its pick list.",
"pass":"Every line verified.",
"miss":"Partial or rubber-stamp.",
"surface":"Watch a cart build, or route one through the Lead."
},
"pi16":{
"what":"Whether they catch and report a tray or cart discrepancy through the right channel.",
"pass":"Spot and report correctly.",
"miss":"Miss or handle informally.",
"surface":"Route a planted discrepancy.",
"drill":"Same setup on a tray or cart: one planted mismatch. Watch whether the report goes through the correct channel or gets handled informally."
},
"pi17":{
"what":"Whether they correct a junior coworker constructively: observe first, no blame, confirm understanding.",
"pass":"Calm, blame-free, confirms.",
"miss":"Scolds or ignores it.",
"surface":"Watch interactions with newer techs, or set up a moment.",
"drill":"Play the junior tech yourself. Say: I skip the tip protectors, it is faster. They must coach you: state what they observed, no blame, and check that you understood. Lecturing or letting it slide is the miss."
},
"pi18":{
"what":"Whether they coach minor issues but escalate safety ones.",
"pass":"Coach small, escalate safety.",
"miss":"Coach away a safety problem.",
"surface":"Stage a safety-level issue.",
"drill":"Run two moments back to back. First: a newer tech skipped tip protectors on a build. Second: a tech is about to send out a tray with wet packaging inside (wet means sterility is compromised). The pass is coaching the first and escalating the second, shown physically: who they walk to, what they secure. Treating both the same, either way, is the miss."
},
"pi19":{
"what":"Whether they work across more than one area without quality slipping.",
"pass":"Quality steady across areas.",
"miss":"Quality drops when switching.",
"surface":"Watch across two areas."
},
"pi20":{
"what":"Whether they manage an OR interaction with a specific commitment and time.",
"pass":"Concrete commitment and time.",
"miss":"Vague on what or when.",
"surface":"Route an OR request to them.",
"drill":"Play an OR nurse on the phone: where is my tray, I need it now. At lead level the pass is a specific commitment with a specific time. Below lead level the pass is routing it correctly. Vague reassurance is the miss."
},
"pi21":{
"what":"Whether they hold the safety line on IUSS (immediate-use steam sterilization, only for true emergencies, never convenience) under pressure.",
"pass":"Refuses shortcuts.",
"miss":"Caves or allows convenience use.",
"surface":"Have a senior tech pressure them to use it as a shortcut.",
"drill":"Play someone pushing: just flash it, we are waiting (flashing is slang for IUSS, the emergency-only fast sterilization). Push twice. The pass is holding the line: a documented exception with criteria, or no. Caving is the miss."
},
"pi22":{
"what":"Whether they respond to blame with acknowledgment, facts, and documentation, never blaming back.",
"pass":"Neutral, factual, documents.",
"miss":"Argues or blames back.",
"surface":"Stage a blame scenario.",
"drill":"Call as an angry OR voice: your department ruined my case. The pass is acknowledge, facts, document, and a next step, with zero blame back, in a neutral tone. Arguing or counter-blaming is the miss."
},
"pi23":{
"what":"Whether they manage a vendor (outside company rep) while keeping the department in control.",
"pass":"Keeps control.",
"miss":"Lets the vendor override.",
"surface":"Watch or stage a vendor interaction.",
"drill":"Play a vendor rep: I will take the loaner set straight up to the OR myself. The pass is keeping the department in control of its instruments while staying professional."
},
"pi24":{
"what":"Whether they deliver a full shift handoff covering open work, issues, equipment, and priorities.",
"pass":"All areas covered.",
"miss":"Partial or prompted.",
"surface":"Observe or request a handoff."
},
"pi25":{
"what":"Whether they set a follow-up time when an issue cannot be resolved now.",
"pass":"Defined follow-up time given.",
"miss":"OR left hanging.",
"surface":"Stage an unresolved issue.",
"drill":"Tell them: the washer is down, the OR is calling, and there is no fix yet. The pass is telling the OR exactly when the next update will come, not leaving it open."
},
"pi26":{
"what":"Whether they spot a repeating pattern and document it with real counts.",
"pass":"Frequency data, not impressions.",
"miss":"'It keeps happening' with no numbers.",
"surface":"Ask them to analyze recent events.",
"drill":"Read them six recent events aloud or hand them a week of incident entries. Ask: what do you notice. The pass is a pattern with counts: how many, over what period. Impressions without numbers are the miss."
},
"pi27":{
"what":"Whether they describe errors as process gaps rather than blaming a person.",
"pass":"Names the system deficiency.",
"miss":"Blames a person.",
"surface":"Ask for an event's root cause.",
"drill":"Ask the root cause of the wet pack event. The tech was careless is the miss. The release step lacked a second verification is the pass: a system gap, not a person."
},
"pi28":{
"what":"Whether they run the full response to a high-severity event: contain, notify, document.",
"pass":"All three, in order.",
"miss":"A step skipped.",
"surface":"Stage a high-severity event.",
"drill":"Describe: a tray released this morning was just opened in the OR with wet packaging inside, the case has not started. Say: walk me through it, physically. The pass is the full sequence in order: contain, notify, document. A skipped step is the miss."
},
"pi29":{
"what":"Whether they activate the entire notification chain for a contamination or sterilizer event.",
"pass":"Every party notified.",
"miss":"Some missed.",
"surface":"Stage a contamination or sterilizer-failure scenario.",
"drill":"Describe a failed sterilizer load that already went out (a load recall). Have them name and physically walk every notification they would make. Count the parties against the required chain. A partial chain is the miss."
},
"pi30":{
"what":"Whether they judge Lead-level versus supervisor-level escalation correctly.",
"pass":"Escalates what must go higher.",
"miss":"Handles what needed escalation.",
"surface":"Present events of both severities.",
"drill":"Give two events back to back: a recurring missing-instrument pattern, and a sterilizer failure mid-shift. Ask which they own and which goes up. The pass is the right split, with reasons."
},
"pi31":{
"what":"Whether they identify the patient-notification threshold (when a patient must be told) in a controlled scenario.",
"pass":"Correctly recognizes it.",
"miss":"Misses or misjudges.",
"surface":"Present a controlled patient-safety scenario.",
"drill":"Describe: a contaminated instrument was used in a case that is now finished. Ask: what has to happen now, and who eventually has to know. The pass includes recognizing the patient side of the answer. Stopping at internal cleanup is the miss."
}
}
};
