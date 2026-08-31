// ============================================================================
// T108 / #720 — Endoscopy modules, assignable to named people from the first release
//
// Client ask (Iggie brief 2026-08-13, Priority 3): endoscopy is not a belt
// requirement and not a facility-wide rollout — not everyone in a department
// works endoscopy. A leader assigns the module to one named person; nobody
// else at that person's belt level ever sees it. No belt trigger, no
// facility-wide trigger, not part of onboarding's "All 10" bundle.
//
// STORAGE: rides foundations_assignments/foundations_progress with
// module_id='en-01' (free text, no CHECK/FK in any migration — verified by
// reading all 8 migrations that touch the table). Zero migration. The four
// generic SB.*Foundations* CRUD functions and getModuleGates() work as-is.
// getFoundationsAssignments() (foundations.js) filters the 'en-' prefix out,
// same guard shape as T92/T92a's SCRIPTS_MODULE_ID filter, so this never
// turns the Foundations "N/10" convention into N/11 and never appears in the
// onboarding "All 10" button (assignAllModules() iterates FOUNDATIONS_MODULES
// only — ENDOSCOPY_MODULES is a separate constant, never merged into it).
//
// GATES: two client scoring decisions, reviewed and closed 2026-08-28 (see
// docs/decisions/2026-08-28-t108-endoscopy-build.md):
//   G1 Knowledge — 14 auto-scored items (8 True/False + 6 fill-in-the-blank;
//     all six blanks are single-word/fixed-phrase answers, normalized-string
//     matched). PASS REQUIRES ALL 14 CORRECT, not a percentage threshold — a
//     fixed 8-item T/F bank passing at "7 of 8" is guessable in ~28 attempts
//     on average with the unlimited free retakes every other gate allows;
//     requiring 100% closes that outright without inventing a cooldown or a
//     session-attempt-limit. Retakes stay free and unlimited for practice.
//   G2 Simulation — no scenario bank exists in the content. Seeded pre-passed
//     at assignment time (endoAssignModule) and never shown. One seed line to
//     remove if a scenario bank arrives later.
//   G3 Observation — the Preceptor Guide's Module 13 Competency Verification:
//     28 items in 5 groups, unlocked by G1 alone (no G2 requirement, since G2
//     is a stand-in). Plus a 6th group, "Written Answers" — the 4 short-answer
//     Final Assessment questions (15–18) that cannot be auto-marked; the
//     leader sees the answer key as a hint, the staffer sees the question only.
//
// Preceptor Guide's SAY/ASK script (Modules 1–12) is NOT rendered in-app —
// Dr. Jake: "We only need [the bottom part] — it's after module 13." Only the
// Competency Verification list feeds G3.
// ============================================================================
'use strict';

// ENDO_MODULE_PREFIX ('en-') is declared in foundations.js, which loads first
// and whose getFoundationsAssignments() filter needs it (same load-order
// reasoning as SCRIPTS_MODULE_ID). Consumed here, not redeclared — a second
// top-level `const` of the same name is a SyntaxError.

// ── Content, as converted from the two client documents. Held as top-level
// constants rather than inlined in one module object: #1073 splits endoscopy
// into one module per chapter, and every module reads its slice out of these
// same arrays. One copy of the content, fourteen views over it.
const ENDO_SECTIONS = ['1. Why Endoscope Reprocessing Matters','2. Understanding Endoscope Anatomy','3. Personal Protective Equipment','4. Pre-Cleaning At Point Of Use','5. Transport To Reprocessing','6. Leak Testing','7. Manual Cleaning','8. High-Level Disinfection','9. Rinsing','10. Drying','11. Storage','12. Documentation & Traceability','13. Troubleshooting','14. Quick Reference: Complete Workflow'];
const ENDO_SECTION_CONTENT = [
    '<div class="fnd-h">THE PATIENT SAFETY IMPERATIVE</div><p>Flexible endoscopes are inserted into body cavities and come into direct contact with mucous membranes. When contaminated endoscopes are used on patients, serious infections occur-including multi-drug resistant organisms that can be fatal.</p><p>Between 2010 and 2023, hundreds of patients were infected by inadequately reprocessed endoscopes. Some died. These were not equipment failures-they were reprocessing failures. The scopes looked clean. They had been through automated reprocessors. But critical steps were missed or performed incorrectly.</p><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">LIVES ARE AT STAKE</div><p>A single contaminated endoscope can infect dozens of patients before the problem is discovered. Outbreaks have closed endoscopy units, resulted in massive lawsuits, and ended careers. Your attention to every step of reprocessing directly affects whether patients live or die.</p></div><div class="fnd-h">WHY ENDOSCOPES ARE DIFFERENT</div><p>Most surgical instruments can be steam sterilized in an autoclave. Flexible endoscopes cannot-the heat and pressure would destroy their delicate optics and electronics.</p><p>Instead, endoscopes require High-Level Disinfection (HLD), which kills all microorganisms except high numbers of bacterial spores. This level is acceptable because endoscopes contact mucous membranes, which are not sterile.</p><p>The challenge is the endoscope design itself:</p><ul class="fnd-ul"><li>Long, narrow channels impossible to see inside</li><li>Complex internal lumens that trap organic material</li><li>Delicate components that limit cleaning methods</li><li>Elevator mechanisms (duodenoscopes) with hidden crevices</li></ul><div class="fnd-note fnd-note-tip"><div class="fnd-note-t">THE FUNDAMENTAL PRINCIPLE</div><p>High-level disinfection only works on CLEAN surfaces. If organic material (blood, tissue, secretions) remains, disinfectant cannot reach the microorganisms underneath. Cleaning is not preparation for disinfection-cleaning IS the foundation of safe reprocessing.</p></div><div class="fnd-h">REGULATORY FRAMEWORK</div><p>Endoscope reprocessing is governed by multiple standards and guidelines:</p><ul class="fnd-ul"><li>AAMI ST91 - Flexible and semi-rigid endoscope processing in health care facilities</li><li>SGNA - Standards of Infection Prevention in Reprocessing Flexible GI Endoscopes</li><li>CDC - Guideline for Disinfection and Sterilization in Healthcare Facilities</li><li>FDA - Guidance on reprocessing of reusable medical devices</li><li>Manufacturer IFUs - Instructions For Use specific to each scope model</li></ul><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">IFU IS PRIMARY</div><p>When manufacturer instructions conflict with general guidelines, follow the manufacturer IFU. The IFU is validated for that specific device. Always have the current IFU available during reprocessing.</p></div><div class="fnd-h">YOUR RESPONSIBILITY</div><p>You are the last line of defense between a contaminated device and a patient. There are no shortcuts in endoscope reprocessing:</p><ul class="fnd-ul"><li>Every channel must be brushed-every time</li><li>Every step must be completed-no skipping</li><li>Every parameter must be met-no approximations</li><li>Every scope must be documented-no exceptions</li></ul><p>When you do this job correctly, patients stay safe. When corners are cut, patients get hurt.</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I understand that reprocessing failures have caused patient deaths</div><div class="fnd-note-li">I understand that cleaning must occur before disinfection can work</div><div class="fnd-note-li">I understand that the manufacturer IFU is the primary reference</div><div class="fnd-note-li">I accept personal responsibility for every scope I reprocess</div></div>',
    '<div class="fnd-h">WHY ANATOMY MATTERS</div><p>You cannot properly clean something you do not understand. Every component of an endoscope requires specific attention during reprocessing. Missing any area creates infection risk.</p><div class="fnd-h">MAJOR COMPONENTS</div><div class="fnd-h3">Control Handle (Control Body)</div><p>The section the operator holds during procedures. Contains:</p><ul class="fnd-ul"><li>Angulation knobs - Control bending section movement</li><li>Air/Water button - Activates insufflation and lens washing</li><li>Suction button - Activates suction through the channel</li><li>Biopsy port - Where instruments enter the working channel</li><li>Electrical connector - Connects to video processor</li></ul><p>The buttons contain valves that must be removed and cleaned separately. These valves are a common source of contamination when cleaning is inadequate.</p><div class="fnd-h3">Insertion Tube</div><p>The long, flexible tube inserted into the patient. Contains:</p><ul class="fnd-ul"><li>Outer sheath - Smooth surface that contacts patient tissue</li><li>Internal channels - Run the full length of the tube</li><li>Bending section - Near the distal tip, allows angulation</li></ul><p>The bending section is articulated and can be damaged by sharp bending or excessive force. Handle with care.</p><div class="fnd-h3">Distal Tip</div><p>The working end that enters the patient first. Contains:</p><ul class="fnd-ul"><li>Objective lens - Camera that captures the image</li><li>Light guides - Illuminate the viewing area</li><li>Air/Water nozzle - Insufflates and cleans the lens</li><li>Instrument channel opening - Where biopsy forceps exit</li><li>Elevator (duodenoscopes only) - Raises/lowers accessories</li></ul><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">DUODENOSCOPE ELEVATOR</div><p>The elevator mechanism on duodenoscopes has caused multiple infection outbreaks. It has crevices that are extremely difficult to clean. If your facility uses duodenoscopes, additional cleaning steps are required. Never assume a duodenoscope elevator is clean.</p></div><div class="fnd-h3">Umbilical Cord (Light Guide Tube)</div><p>Connects the endoscope to the light source and processor:</p><ul class="fnd-ul"><li>Contains electrical cables for video signal</li><li>Contains channels that connect to processor</li><li>Connector must be protected during reprocessing</li></ul><div class="fnd-h">INTERNAL CHANNELS</div><p>Channels are where contamination hides. You cannot see inside them. Every channel must be cleaned.</p><div class="fnd-tw"><table class="fnd-table"><tbody><tr><td>Channel</td><td>Purpose</td><td>Cleaning Priority</td></tr><tr><td>Air Channel</td><td>Insufflates body cavity</td><td>High - Narrow lumen</td></tr><tr><td>Water Channel</td><td>Flushes lens, irrigates</td><td>High - Narrow lumen</td></tr><tr><td>Suction/Biopsy Channel</td><td>Suction and instrument passage</td><td>Critical - Largest exposure to patient material</td></tr><tr><td>Auxiliary Water (if present)</td><td>Additional irrigation</td><td>High - Follow IFU</td></tr><tr><td>Elevator Channel (duodenoscopes)</td><td>Elevator mechanism access</td><td>Critical - Most difficult to clean</td></tr></tbody></table></div><div class="fnd-note fnd-note-tip"><div class="fnd-note-t">CHANNEL CONFIGURATION VARIES</div><p>Different endoscope models have different channel configurations. Some have separate air and water channels; some have a combined air/water channel. Some have auxiliary channels. Always consult the specific IFU to identify all channels.</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Obtain the IFU for each endoscope model your department uses. Document the channel configuration for each.</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I can identify the control handle, insertion tube, distal tip, and umbilical cord</div><div class="fnd-note-li">I understand that all internal channels must be cleaned</div><div class="fnd-note-li">I understand the duodenoscope elevator requires special attention</div><div class="fnd-note-li">I know to consult the IFU for scope-specific channel configurations</div></div>',
    '<div class="fnd-h">PROTECTING YOURSELF</div><p>Endoscope reprocessing exposes you to bloodborne pathogens, chemical hazards, and infectious material. Proper PPE is required throughout the reprocessing workflow.</p><div class="fnd-h">REQUIRED PPE</div><div class="fnd-tw"><table class="fnd-table"><tbody><tr><td>PPE Item</td><td>Requirement</td><td>Purpose</td></tr><tr><td>Gloves</td><td>Chemical-resistant, appropriate for disinfectant used</td><td>Protects from chemicals and biological material</td></tr><tr><td>Gown</td><td>Fluid-resistant, long-sleeved, tied at back</td><td>Protects clothing and skin from splashes</td></tr><tr><td>Eye Protection</td><td>Face shield OR goggles with side shields</td><td>Protects eyes from splashes and aerosols</td></tr><tr><td>Mask</td><td>Surgical mask minimum; N95 if aerosol risk</td><td>Protects respiratory system</td></tr><tr><td>Shoe Covers</td><td>Fluid-resistant</td><td>Protects footwear, prevents tracking contamination</td></tr></tbody></table></div><div class="fnd-h">WHEN TO WEAR WHAT</div><div class="fnd-h3">Full PPE Required</div><ul class="fnd-ul"><li>Pre-cleaning at point of use</li><li>Transporting contaminated scopes</li><li>Leak testing</li><li>Manual cleaning</li><li>Loading/unloading AER</li><li>Handling high-level disinfectants</li></ul><div class="fnd-h3">Gloves and Gown Required</div><ul class="fnd-ul"><li>Handling scopes after disinfection</li><li>Rinsing</li><li>Drying</li><li>Placing scopes in storage</li></ul><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">CHEMICAL HAZARDS</div><p>High-level disinfectants (glutaraldehyde, OPA, peracetic acid) are hazardous. They can cause respiratory sensitization, chemical burns, and eye damage. Ensure adequate ventilation. Know the location of eyewash stations and spill kits.</p></div><div class="fnd-h">DONNING AND DOFFING</div><div class="fnd-h3">Donning Order (Putting On)</div><ul class="fnd-ul"><li>1. Hand hygiene</li><li>2. Gown - Tie at neck and waist</li><li>3. Mask - Secure over nose and mouth</li><li>4. Eye protection - Ensure seal around eyes</li><li>5. Gloves - Pull cuffs over gown sleeves</li></ul><div class="fnd-h3">Doffing Order (Removing)</div><ul class="fnd-ul"><li>1. Gloves - Peel off without touching exterior</li><li>2. Eye protection - Remove by touching only earpieces/headband</li><li>3. Gown - Unfasten ties, roll away from body, dispose</li><li>4. Mask - Remove by ear loops only, never touch front</li><li>5. Hand hygiene - Immediately</li></ul><div class="fnd-note fnd-note-tip"><div class="fnd-note-t">GLOVE CHANGES</div><p>Change gloves: between contaminated and clean activities, when torn or punctured, when moving from one scope to another, after contact with high-level disinfectants.</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Know the location of PPE supplies, eyewash stations, and chemical spill kits in your reprocessing area.</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I know what PPE is required for each reprocessing step</div><div class="fnd-note-li">I know the correct order for donning and doffing PPE</div><div class="fnd-note-li">I understand the chemical hazards of high-level disinfectants</div><div class="fnd-note-li">I know when to change gloves</div></div>',
    '<div class="fnd-h">WHY PRE-CLEANING CANNOT WAIT</div><p>Pre-cleaning begins IMMEDIATELY after the endoscope is removed from the patient-while still in the procedure room. This is the most time-critical step in reprocessing.</p><p>Organic material (blood, mucus, tissue, feces) begins drying within minutes. Once dried, this material becomes extremely difficult to remove. Biofilm can begin forming in as little as 20 minutes.</p><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">TIME IS CRITICAL</div><p>Pre-cleaning must begin within minutes of procedure completion. There is no acceptable delay. A scope that sits uncleaned becomes a scope that may not be safely reprocessable. Every minute matters.</p></div><div class="fnd-h">PRE-CLEANING PROCEDURE</div><div class="fnd-h3">STEP 1: WIPE THE INSERTION TUBE</div><p>While the scope is still connected to the light source, use a soft lint-free cloth moistened with enzymatic detergent. Wipe from the control handle toward the distal tip. Remove all visible debris.</p><div class="fnd-h3">STEP 2: FLUSH SUCTION CHANNEL</div><p>Place the distal tip in enzymatic detergent solution. Activate suction to draw solution through the suction channel. Continue until solution runs clear.</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Minimum suction volume: _____ mL per manufacturer IFU</p></div><div class="fnd-h3">STEP 3: FLUSH AIR/WATER CHANNELS</div><p>Depress air and water buttons to flush detergent solution through these channels. Alternate between air and water.</p><div class="fnd-h3">STEP 4: DISCONNECT FROM PROCESSOR</div><p>Remove the scope from the light source and video processor.</p><div class="fnd-h3">STEP 5: ATTACH PROTECTIVE CAP</div><p>Cover the electrical connector with the water-resistant cap to prevent damage during transport and cleaning.</p><div class="fnd-h3">STEP 6: PLACE IN TRANSPORT CONTAINER</div><p>Place the scope in an approved, closed transport container.</p><div class="fnd-h">ENZYMATIC DETERGENT</div><p>Enzymatic detergents contain proteins that break down organic material. They are more effective than water alone.</p><ul class="fnd-ul"><li>Use detergent approved for endoscope use</li><li>Prepare fresh solution per manufacturer instructions</li><li>Never reuse enzymatic solution between scopes</li><li>Observe correct dilution and temperature</li></ul><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Approved enzymatic detergent: _____________</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Dilution ratio: _____ per manufacturer instructions</p></div><div class="fnd-note fnd-note-tip"><div class="fnd-note-t">PRE-CLEANING IS NOT DISINFECTION</div><p>Pre-cleaning removes gross contamination. It does not disinfect the scope. A pre-cleaned scope is still contaminated and must be transported and handled as biohazardous.</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">CHECKPOINT BEFORE TRANSPORT</div><p>Insertion tube wiped? ☐  Suction channel flushed? ☐  Air/water channels flushed? ☐  Protective cap attached? ☐  Scope in closed container? ☐</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I understand that pre-cleaning must begin immediately after the procedure</div><div class="fnd-note-li">I know to wipe the insertion tube from handle toward tip</div><div class="fnd-note-li">I know to flush all channels with enzymatic detergent</div><div class="fnd-note-li">I understand that pre-cleaned scopes are still contaminated</div></div>',
    '<div class="fnd-h">SAFE TRANSPORT</div><p>After pre-cleaning, the scope must be transported to the reprocessing area. During transport, you must prevent environmental contamination and protect the scope from damage.</p><div class="fnd-h">TRANSPORT REQUIREMENTS</div><ul class="fnd-ul"><li>Use a closed, leak-proof container</li><li>Container must be labeled as biohazardous</li><li>Container must be large enough to prevent coiling</li><li>Scope should not contact sides of container</li><li>Transport immediately-do not allow scope to dry</li></ul><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">NEVER TRANSPORT UNCONTAINED</div><p>Never carry a contaminated endoscope through hallways without a closed container. This spreads pathogens, violates infection control standards, and risks damage to the scope.</p></div><div class="fnd-h">TIMING</div><p>The scope should arrive at the reprocessing area and begin leak testing as quickly as possible:</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Maximum transport time: _____ minutes</p></div><p>If any delay is unavoidable:</p><ul class="fnd-ul"><li>Keep the scope moist with enzymatic-soaked towels</li><li>Document the delay and reason</li><li>Notify reprocessing staff of the delay</li></ul><div class="fnd-note fnd-note-tip"><div class="fnd-note-t">MOISTURE IS CRITICAL</div><p>A moist scope can be cleaned. A dry scope may not be. If pre-cleaned material dries in the channels, it may bond to surfaces and become impossible to remove. Preventing drying is essential.</p></div><div class="fnd-h">HANDOFF COMMUNICATION</div><p>When delivering the scope to reprocessing, communicate:</p><ul class="fnd-ul"><li>Scope identifier (serial number or facility ID)</li><li>Procedure performed</li><li>Any problems during procedure (scope dropped, difficult cleaning)</li><li>Time pre-cleaning was completed</li></ul><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I know to use a closed, labeled container for transport</div><div class="fnd-note-li">I understand why the scope must not dry during transport</div><div class="fnd-note-li">I know what information to communicate during handoff</div></div>',
    '<div class="fnd-h">PURPOSE OF LEAK TESTING</div><p>The endoscope\'s outer sheath protects internal components (optics, electronics) from fluid. If this sheath is punctured, fluid enters the scope during cleaning and disinfection, causing:</p><ul class="fnd-ul"><li>Damage to internal electronics (costly repair)</li><li>Damage to optics (image quality loss)</li><li>Creation of areas where microorganisms can hide</li><li>Progressive damage with each subsequent use</li></ul><p>Leak testing detects damage BEFORE immersion. A scope that fails leak testing should never be submerged.</p><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">TEST BEFORE IMMERSION</div><p>Leak testing is performed BEFORE the scope enters the cleaning sink. If you discover a leak after immersion, you have already caused additional internal damage. The leak test is your protection - and the scope\'s.</p></div><div class="fnd-h">LEAK TESTING PROCEDURE</div><div class="fnd-h3">STEP 1: ATTACH LEAK TESTER</div><p>Connect the leak tester to the scope\'s venting connector. This is a specific port designed for leak testing-consult the IFU for location.</p><div class="fnd-h3">STEP 2: PRESSURIZE</div><p>Inflate the scope to the pressure specified in the manufacturer IFU.</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Leak test pressure: _____ mmHg per scope IFU</p></div><div class="fnd-h3">STEP 3: SUBMERGE</div><p>While maintaining pressure, completely submerge the scope in water.</p><div class="fnd-h3">STEP 4: OBSERVE FOR BUBBLES</div><p>Watch for a continuous stream of bubbles from any location. Check: • Entire insertion tube • Bending section (flex in all directions while observing) • Distal tip • Control body and buttons • All seams and connections</p><div class="fnd-h3">STEP 5: MAINTAIN OBSERVATION</div><p>Continue observing for the time specified in the IFU.</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Observation time: _____ seconds per scope IFU</p></div><div class="fnd-h3">STEP 6: RECORD RESULT</div><p>Document PASS or FAIL.</p><div class="fnd-h">INTERPRETING RESULTS</div><div class="fnd-tw"><table class="fnd-table"><tbody><tr><td>Observation</td><td>Interpretation</td><td>Action</td></tr><tr><td>No bubbles, pressure holds</td><td>PASS</td><td>Proceed to cleaning</td></tr><tr><td>Steady stream of bubbles from any location</td><td>FAIL</td><td>Remove from service immediately</td></tr><tr><td>Single bubble, then stops</td><td>Possible trapped air</td><td>Retest-if uncertain, treat as FAIL</td></tr><tr><td>Pressure drops but no visible bubbles</td><td>Possible slow leak</td><td>Check connections, retest</td></tr><tr><td>Bubbles from channel opening</td><td>NORMAL</td><td>Channels are not sealed-this is expected</td></tr></tbody></table></div><div class="fnd-h">IF LEAK TEST FAILS</div><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">STOP - DO NOT CONTINUE</div><p>If the scope fails the leak test: 1. Remove from water IMMEDIATELY 2. Do NOT continue cleaning or disinfection 3. Dry the exterior to prevent further water intrusion 4. Tag as "Out of Service - Leak Test Failure" 5. Notify supervisor 6. Initiate repair process per facility protocol</p></div><p>A scope that fails leak testing cannot be safely reprocessed. There are no exceptions. Attempting to clean or disinfect a leaking scope causes additional damage and creates infection risk.</p><div class="fnd-h">COMMON LEAK LOCATIONS</div><ul class="fnd-ul"><li>Bending section - Most common; flexed repeatedly during procedures</li><li>Distal tip - Contact with instruments and tissue</li><li>Insertion tube - Bite damage, crushing in doors/drawers</li><li>Control body buttons - Repeated use causes wear</li></ul><div class="fnd-note fnd-note-key"><div class="fnd-note-t">CHECKPOINT BEFORE PROCEEDING</div><p>Leak tester properly attached? ☐  Correct pressure achieved? ☐  Scope fully submerged? ☐  Bending section flexed during observation? ☐  Full observation time completed? ☐  Result documented? ☐</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I understand why leak testing must occur before immersion</div><div class="fnd-note-li">I know the proper sequence for leak testing</div><div class="fnd-note-li">I can interpret leak test results</div><div class="fnd-note-li">I know exactly what to do if a scope fails the leak test</div></div>',
    '<div class="fnd-h">THE MOST CRITICAL STEP</div><p>Manual cleaning is the foundation of safe reprocessing. No amount of high-level disinfection can compensate for inadequate cleaning. Studies consistently show that 15-30% of endoscopes fail visual cleanliness checks-meaning cleaning is often done poorly.</p><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">CLEANING IS NON-NEGOTIABLE</div><p>If organic material remains after cleaning, high-level disinfectant cannot reach the surface beneath. Microorganisms survive under the bioburden, and patients become infected. There is no shortcut. There is no substitute. Every channel must be cleaned.</p></div><div class="fnd-h">EQUIPMENT AND SUPPLIES</div><ul class="fnd-ul"><li>Clean sink dedicated to endoscope cleaning</li><li>Fresh enzymatic detergent at correct dilution</li><li>Channel cleaning brushes (correct sizes per IFU)</li><li>Cleaning adapters for channel flushing</li><li>Syringes or powered irrigation device</li><li>Lint-free cloths or sponges</li><li>Clean rinse water</li><li>Full PPE</li></ul><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">SINGLE-USE BRUSHES</div><p>Many facilities use single-use brushes. Check your facility policy. If reusable brushes are used, they must be cleaned, inspected for damage, and high-level disinfected or sterilized between uses per manufacturer instructions.</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Brush type: ☐ Single-use  ☐ Reusable with HLD/sterilization</p></div><div class="fnd-h">PREPARE THE CLEANING SOLUTION</div><ul class="fnd-ul"><li>Mix enzymatic detergent fresh for each scope</li><li>Follow manufacturer dilution instructions exactly</li><li>Use water at the temperature specified by detergent manufacturer</li><li>Never reuse enzymatic solution-it becomes saturated and ineffective</li></ul><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Enzymatic detergent: _____________</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Dilution: _____________</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Water temperature: _____________</p></div><div class="fnd-h">CLEANING PROCEDURE</div><div class="fnd-h3">STEP 1: IMMERSE AND SOAK</div><p>Submerge the scope completely in enzymatic detergent solution. Ensure all channels fill with solution (no air pockets). Soak for the time specified by detergent manufacturer.</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Minimum soak time: _____ minutes</p></div><div class="fnd-h3">STEP 2: CLEAN EXTERNAL SURFACES</div><p>Using a soft cloth or sponge saturated with detergent: • Wipe the entire insertion tube from handle to tip • Clean the control body, including around buttons • Clean the distal tip thoroughly • Clean the umbilical cord • Pay attention to all crevices and seams</p><div class="fnd-h3">STEP 3: REMOVE AND CLEAN VALVES</div><p>Remove all detachable valves and buttons: • Disassemble per manufacturer IFU • Clean all surfaces with brush and detergent • Brush internal ports and openings • Set aside in detergent solution</p><div class="fnd-h3">STEP 4: BRUSH ALL CHANNELS</div><p>This is the most critical cleaning step.</p><div class="fnd-note fnd-note-tip"><div class="fnd-note-t">BRUSHING TECHNIQUE</div><p>For each channel: 1. Select the correct brush size (must contact channel walls) 2. Insert brush at one end 3. Advance until brush exits the other end 4. Withdraw brush while rotating 5. Inspect brush for debris 6. Clean brush in detergent 7. Repeat until brush emerges clean (minimum 3 passes) 8. Never force a brush-if resistance is met, stop and investigate</p></div><p>Every channel must be brushed. There are no exceptions. Channels that "look clean" still harbor invisible contamination.</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Document brush sizes for each scope model in your department.</p></div><div class="fnd-h3">STEP 5: FLUSH ALL CHANNELS</div><p>Using syringes or powered irrigation: • Flush each channel with enzymatic detergent • Use the volume and pressure specified in the IFU • Ensure solution exits all channel openings</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Minimum flush volume per channel: _____ mL</p></div><div class="fnd-h3">STEP 6: CLEAN ELEVATOR (DUODENOSCOPES ONLY)</div><p>If processing a duodenoscope: • Raise and lower elevator repeatedly while submerged • Brush around and under elevator with specific elevator brush • Flush elevator channel with detergent • This step is critical-elevator contamination has caused outbreaks</p><div class="fnd-h3">STEP 7: RINSE THOROUGHLY</div><p>Rinse all channels and surfaces with clean water to remove detergent and loosened debris.</p><div class="fnd-h">VISUAL INSPECTION</div><p>After cleaning, visually inspect the scope:</p><ul class="fnd-ul"><li>Examine the distal tip lens-should be clear</li><li>Check all channel openings for visible debris</li><li>Inspect the bending section for smooth movement</li><li>Look for any damage (cuts, cracks, discoloration)</li></ul><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">VISIBLE DEBRIS = RECLEAN</div><p>If you see any visible debris after cleaning, the scope is not adequately cleaned. Return to brushing and flushing. Do NOT proceed to high-level disinfection.</p></div><div class="fnd-h">COMMON CLEANING ERRORS</div><ul class="fnd-ul"><li>Insufficient brushing - biofilm remains in channels</li><li>Wrong brush size - brush doesn\'t contact channel walls</li><li>Not brushing all channels - assuming some are "clean"</li><li>Reusing enzymatic solution - saturated solution is ineffective</li><li>Insufficient flush volume - debris remains in channels</li><li>Not cleaning valves - major contamination source</li><li>Rushing - inadequate contact time and attention</li></ul><div class="fnd-note fnd-note-key"><div class="fnd-note-t">CHECKPOINT BEFORE HLD</div><p>Enzymatic soak completed? ☐  All external surfaces cleaned? ☐  All valves removed and cleaned? ☐  Every channel brushed until clean? ☐  All channels flushed? ☐  Elevator cleaned (if duodenoscope)? ☐  Visual inspection passed? ☐</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I understand that cleaning is the most critical reprocessing step</div><div class="fnd-note-li">I know to brush every channel until the brush emerges clean</div><div class="fnd-note-li">I understand why enzymatic solution must not be reused</div><div class="fnd-note-li">I know to stop and reclean if visible debris remains</div></div>',
    '<div class="fnd-h">WHAT HLD ACHIEVES</div><p>High-Level Disinfection (HLD) kills all microorganisms except high numbers of bacterial spores. This level of disinfection is required for semi-critical devices-those that contact mucous membranes or non-intact skin.</p><p>HLD is not sterilization. Some bacterial spores may survive. This is acceptable for endoscopes because mucous membranes are not sterile.</p><div class="fnd-note fnd-note-tip"><div class="fnd-note-t">HLD REQUIREMENTS</div><p>For HLD to be effective, four conditions must be met: 1. The scope must be thoroughly CLEANED first 2. Disinfectant must be at or above Minimum Effective Concentration (MEC) 3. Full contact time must be achieved 4. Correct temperature must be maintained</p></div><div class="fnd-h">HLD METHODS</div><div class="fnd-h3">Automated Endoscope Reprocessor (AER)</div><p>Most facilities use AERs for HLD. Benefits:</p><ul class="fnd-ul"><li>Standardized, reproducible process</li><li>Automatic channel perfusion</li><li>Temperature and time control</li><li>Cycle documentation</li><li>Reduced staff chemical exposure</li></ul><p>AER does NOT clean the scope. Manual cleaning must be completed BEFORE loading.</p><div class="fnd-h3">Manual HLD</div><p>When AER is unavailable, manual HLD may be performed. This requires meticulous technique and documentation.</p><div class="fnd-h">COMMON HIGH-LEVEL DISINFECTANTS</div><div class="fnd-tw"><table class="fnd-table"><tbody><tr><td>Disinfectant</td><td>Typical Contact Time</td><td>Key Considerations</td></tr><tr><td>Glutaraldehyde (≥2%)</td><td>20-90 min at 20-25°C</td><td>Respiratory sensitizer; requires ventilation</td></tr><tr><td>OPA (Ortho-phthalaldehyde)</td><td>10-12 min at 20°C</td><td>Stains proteins gray; monitor for anaphylaxis</td></tr><tr><td>Peracetic acid</td><td>Per manufacturer</td><td>Fast acting; check material compatibility</td></tr><tr><td>Hydrogen peroxide solutions</td><td>Per manufacturer</td><td>Various formulations; follow specific IFU</td></tr></tbody></table></div><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">CHEMICAL COMPATIBILITY</div><p>Not all disinfectants are compatible with all endoscopes. Verify compatibility in BOTH the disinfectant IFU AND the endoscope IFU before use.</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Approved HLD chemical: _____________</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Contact time: _____________</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Temperature requirement: _____________</p></div><div class="fnd-h">MINIMUM EFFECTIVE CONCENTRATION (MEC)</div><p>Disinfectant concentration decreases with use and time. Before EVERY use, you must verify the solution meets the Minimum Effective Concentration (MEC).</p><ul class="fnd-ul"><li>Test solution with the manufacturer\'s test strip</li><li>Compare to the MEC threshold on the test strip bottle</li><li>If below MEC, discard the solution and prepare fresh</li><li>Document the test result</li></ul><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">NEVER USE SUB-MEC SOLUTION</div><p>Solution below MEC will not achieve high-level disinfection. Microorganisms survive. Patients become infected. There are no exceptions-if MEC fails, replace the solution.</p></div><div class="fnd-h">AER PROCEDURE</div><div class="fnd-h3">STEP 1: VERIFY AER STATUS</div><p>Confirm the AER has passed its self-test and MEC testing is current.</p><div class="fnd-h3">STEP 2: LOAD THE SCOPE</div><p>Place the scope in the AER basin: • Connect all channel adapters to appropriate ports • Ensure no kinks in the insertion tube • Verify all connections are secure</p><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">ALL CHANNELS CONNECTED</div><p>If a channel is not connected to the AER, disinfectant does not flow through it. That channel remains contaminated. Verify every connection before starting the cycle.</p></div><div class="fnd-h3">STEP 3: LOAD VALVES AND COMPONENTS</div><p>Place valves and other detachable components in the AER per manufacturer instructions.</p><div class="fnd-h3">STEP 4: CLOSE AND START CYCLE</div><p>Close the AER and initiate the appropriate cycle.</p><div class="fnd-h3">STEP 5: MONITOR CYCLE</div><p>Remain available during the cycle: • Do not open the AER during the cycle • Respond to any alarms immediately • Do not assume completion-verify cycle completed successfully</p><div class="fnd-h3">STEP 6: VERIFY COMPLETION</div><p>Confirm the cycle completed without errors. Print or document the cycle record.</p><div class="fnd-h">MANUAL HLD PROCEDURE</div><p>If AER is unavailable:</p><div class="fnd-h3">STEP 1: TEST CONCENTRATION</div><p>Verify disinfectant meets MEC using test strip.</p><div class="fnd-h3">STEP 2: IMMERSE COMPLETELY</div><p>Submerge the scope with no air pockets.</p><div class="fnd-h3">STEP 3: FILL ALL CHANNELS</div><p>Use syringes to fill every channel with disinfectant. Confirm solution exits all openings.</p><div class="fnd-h3">STEP 4: MAINTAIN CONTACT TIME</div><p>Set a timer. Maintain immersion for the FULL contact time specified. Do not remove early for any reason.</p><div class="fnd-h3">STEP 5: MAINTAIN TEMPERATURE</div><p>Monitor temperature if required by the disinfectant.</p><div class="fnd-h3">STEP 6: DOCUMENT</div><p>Record: chemical used, lot number, MEC test result, contact time, temperature.</p><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">CONTACT TIME IS MINIMUM</div><p>The specified contact time is the MINIMUM required to kill microorganisms. Removing the scope even one minute early can leave viable pathogens. Set a timer. Do not estimate.</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">CHECKPOINT AFTER HLD</div><p>MEC verified before cycle? ☐  All channels connected/filled? ☐  Full contact time achieved? ☐  Temperature maintained (if required)? ☐  Cycle completed without errors? ☐  Result documented? ☐</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I understand that cleaning must occur before HLD</div><div class="fnd-note-li">I know to test disinfectant concentration before every use</div><div class="fnd-note-li">I understand that all channels must contact the disinfectant</div><div class="fnd-note-li">I know that contact time is a minimum, not a target</div></div>',
    '<div class="fnd-h">PURPOSE OF RINSING</div><p>After high-level disinfection, all disinfectant residue must be removed from the scope. Residual disinfectant can cause:</p><ul class="fnd-ul"><li>Mucosal irritation or burns to the next patient</li><li>Chemical damage to scope components</li><li>Interference with subsequent procedures</li></ul><div class="fnd-h">RINSE WATER QUALITY</div><p>The quality of rinse water matters. Tap water may contain microorganisms that recontaminate the scope.</p><div class="fnd-tw"><table class="fnd-table"><tbody><tr><td>Rinse Stage</td><td>Acceptable Water Quality</td></tr><tr><td>First rinse (remove bulk disinfectant)</td><td>Tap water may be acceptable per IFU</td></tr><tr><td>Final rinse</td><td>Per IFU-may require sterile, filtered, or bacteria-free water</td></tr></tbody></table></div><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">FOLLOW THE IFU</div><p>If the disinfectant or endoscope IFU specifies sterile water for final rinse, using tap water creates recontamination risk. Follow the IFU exactly.</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Final rinse water specification: _____________</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Source of rinse water: _____________</p></div><div class="fnd-h">RINSE PROCEDURE</div><div class="fnd-h3">STEP 1: FLUSH ALL CHANNELS</div><p>Flush each channel with appropriate rinse water. Use the volume specified in the IFU.</p><div class="fnd-h3">STEP 2: RINSE EXTERIOR SURFACES</div><p>Rinse all external surfaces to remove disinfectant.</p><div class="fnd-h3">STEP 3: REPEAT IF REQUIRED</div><p>Some disinfectants require multiple rinse cycles. Follow the disinfectant IFU.</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Number of rinse cycles required: _____________</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Rinse volume per channel: _____________</p></div><div class="fnd-h3">STEP 4: RINSE VALVES AND COMPONENTS</div><p>Rinse all detachable parts that were disinfected.</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I understand why rinsing is necessary after HLD</div><div class="fnd-note-li">I know the rinse water quality requirements for my facility</div><div class="fnd-note-li">I know to follow the IFU for number of rinse cycles</div></div>',
    '<div class="fnd-h">WHY DRYING IS CRITICAL</div><p>Moisture enables microbial growth. A properly disinfected endoscope that is stored wet will become contaminated. Drying is not optional-it is essential to maintaining the disinfected state.</p><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">WET STORAGE = CONTAMINATION</div><p>Microorganisms need moisture to survive and multiply. Even a perfectly disinfected scope will grow bacteria if stored wet. Within hours, waterborne organisms can multiply to dangerous levels. Dry completely before storage.</p></div><div class="fnd-h">DRYING PROCEDURE</div><div class="fnd-h3">Alcohol Flush</div><p>Flushing channels with alcohol displaces water and aids evaporation:</p><div class="fnd-h3">STEP 1: PREPARE ALCOHOL</div><p>Use 70% isopropyl alcohol or 70% ethyl alcohol.</p><div class="fnd-h3">STEP 2: FLUSH ALL CHANNELS</div><p>Pass alcohol through every channel using syringes or irrigation adapters.</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Alcohol flush volume per channel: _____ mL</p></div><div class="fnd-h3">STEP 3: PURGE WITH AIR</div><p>Follow alcohol flush with forced air to remove the alcohol.</p><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">ALCOHOL COMPATIBILITY</div><p>Verify alcohol flush is compatible with your endoscope model. Some manufacturers have specific requirements. Check the IFU.</p></div><div class="fnd-h3">Forced Air Drying</div><div class="fnd-h3">STEP 1: CONNECT TO AIR SOURCE</div><p>Use filtered, compressed air or connect to a drying cabinet.</p><div class="fnd-h3">STEP 2: DRY ALL CHANNELS</div><p>Force air through every channel for the time specified in your facility protocol.</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Minimum forced air drying time: _____ minutes</p></div><div class="fnd-h3">STEP 3: DRY EXTERIOR</div><p>Wipe exterior surfaces with a lint-free cloth.</p><div class="fnd-h3">STEP 4: VERIFY DRYING</div><p>Visually confirm no moisture is visible. Channels should expel only air, no droplets.</p><div class="fnd-h3">Drying Cabinets</div><p>Many facilities use dedicated drying cabinets that provide:</p><ul class="fnd-ul"><li>HEPA-filtered air circulation</li><li>Controlled environment</li><li>Direct channel connections</li><li>Documentation of drying time</li></ul><p>If your facility uses drying cabinets, follow the manufacturer\'s instructions for connection and minimum drying time.</p><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Drying cabinet model: _____________</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Minimum cabinet drying time: _____________</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">CHECKPOINT BEFORE STORAGE</div><p>Alcohol flush completed? ☐  All channels purged with air? ☐  Minimum drying time achieved? ☐  No visible moisture on exterior? ☐  No droplets from channels? ☐</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I understand that wet storage causes recontamination</div><div class="fnd-note-li">I know the drying procedure for my facility</div><div class="fnd-note-li">I know to verify channels are completely dry before storage</div></div>',
    '<div class="fnd-h">STORAGE REQUIREMENTS</div><p>How you store endoscopes directly affects whether they remain safe for patient use. Improper storage can undo all your reprocessing work.</p><div class="fnd-h3">Vertical Hanging</div><ul class="fnd-ul"><li>Store scopes hanging vertically</li><li>Distal tip points down to allow drainage</li><li>Control handle at top</li><li>Insertion tube hangs freely-do not coil</li></ul><div class="fnd-h3">Ventilated Cabinet</div><ul class="fnd-ul"><li>Dedicated cabinet for endoscope storage only</li><li>HEPA-filtered air circulation preferred</li><li>Clean, dry, dust-free environment</li><li>Individual positions for each scope-no contact between scopes</li></ul><div class="fnd-h3">Valves Removed</div><ul class="fnd-ul"><li>Store valves separately (not attached to scope)</li><li>This allows air circulation through channels</li><li>Prevents moisture accumulation</li></ul><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">NEVER STORE SCOPES:</div><p>• In transport containers • In closed cases or trays • Coiled in drawers • Touching other scopes • With valves attached • Wet or damp  These practices cause recontamination.</p></div><div class="fnd-h">REPROCESSING WINDOW (HANG TIME)</div><p>A reprocessed endoscope does not stay disinfected indefinitely. Your facility defines a maximum storage time-the "reprocessing window" or "hang time"-after which the scope must be reprocessed again before use.</p><div class="fnd-tw"><table class="fnd-table"><tbody><tr><td>Organization</td><td>Recommendation</td></tr><tr><td>SGNA</td><td>Reprocess if stored &gt;7 days</td></tr><tr><td>Many facilities</td><td>24-72 hours</td></tr><tr><td>Your facility</td><td>[Per facility policy]</td></tr></tbody></table></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Maximum storage time before reprocessing: _____________</p></div><div class="fnd-note fnd-note-warn"><div class="fnd-note-t">EXPIRED = REPROCESS</div><p>If a scope has exceeded the reprocessing window, it must be reprocessed before patient use-even if it was properly processed initially. Do not use an expired scope.</p></div><div class="fnd-h">STORAGE LABELING</div><p>Each stored scope should be labeled with:</p><ul class="fnd-ul"><li>Scope identifier (serial number or facility code)</li><li>Date and time reprocessing completed</li><li>Expiration date/time (when reprocessing window ends)</li><li>Initials of person who reprocessed</li></ul><div class="fnd-h">CABINET MAINTENANCE</div><ul class="fnd-ul"><li>Clean cabinet interior regularly per facility protocol</li><li>Replace HEPA filters per manufacturer schedule</li><li>Document cleaning and maintenance</li></ul><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Storage cabinet cleaning frequency: _____________</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">CHECKPOINT - PROPER STORAGE</div><p>Scope hanging vertically? ☐  Distal tip down? ☐  Not coiled? ☐  Not touching other scopes? ☐  Valves removed? ☐  Completely dry? ☐  Labeled with expiration? ☐  In ventilated cabinet? ☐</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I know to store scopes hanging vertically with valves removed</div><div class="fnd-note-li">I understand why coiled storage causes contamination</div><div class="fnd-note-li">I know my facility\'s reprocessing window</div><div class="fnd-note-li">I know to reprocess if the storage window is exceeded</div></div>',
    '<div class="fnd-h">WHY DOCUMENTATION MATTERS</div><p>Documentation proves you did the work correctly. When a patient develops an infection or a surveyor asks questions, your documentation is your evidence.</p><div class="fnd-note fnd-note-tip"><div class="fnd-note-t">IF IT\'S NOT DOCUMENTED, IT DIDN\'T HAPPEN</div><p>In healthcare, documentation is proof. Without records, you cannot demonstrate compliance, investigate problems, or defend your practice. Document everything.</p></div><div class="fnd-h">WHAT TO DOCUMENT</div><p>For every reprocessing cycle, record:</p><div class="fnd-tw"><table class="fnd-table"><tbody><tr><td>Step</td><td>Document</td></tr><tr><td>Pre-cleaning</td><td>Time completed, initials</td></tr><tr><td>Leak test</td><td>Pass/Fail, scope identifier</td></tr><tr><td>Manual cleaning</td><td>Completion verified, initials</td></tr><tr><td>HLD</td><td>Chemical, lot #, MEC test result, cycle #, pass/fail</td></tr><tr><td>Drying</td><td>Method, completion time</td></tr><tr><td>Storage</td><td>Date, time, location, expiration</td></tr><tr><td>Patient use</td><td>Patient ID, procedure, date, scope identifier</td></tr></tbody></table></div><div class="fnd-h">TRACEABILITY</div><p>You must be able to trace in both directions:</p><div class="fnd-h3">Scope → Patients</div><p>Given a scope identifier, you can find every patient on whom it was used.</p><div class="fnd-h3">Patient → Scope</div><p>Given a patient, you can find which scope was used and its complete reprocessing history.</p><div class="fnd-note fnd-note-tip"><div class="fnd-note-t">INVESTIGATION SCENARIO</div><p>A patient develops an infection 3 days after endoscopy. Investigators need to know: • Which scope was used • Who reprocessed it and when • Were all steps completed correctly • What other patients were exposed to that scope  Your documentation answers these questions.</p></div><div class="fnd-h">DOCUMENTATION QUALITY</div><ul class="fnd-ul"><li>Complete - Every required field filled</li><li>Accurate - Times and values are correct</li><li>Legible - Can be read by anyone</li><li>Timely - Recorded at time of activity, not later</li><li>Indelible - Cannot be erased or altered without detection</li></ul><p>If you make an error, draw a single line through it, write the correction, initial, and date. Never erase or white-out.</p><div class="fnd-h">RECORD RETENTION</div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">FACILITY-SPECIFIC</div><p>Reprocessing record retention period: _____ years</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I understand that documentation is proof of compliance</div><div class="fnd-note-li">I know what must be documented for each reprocessing cycle</div><div class="fnd-note-li">I understand scope-to-patient traceability</div><div class="fnd-note-li">I know how to correct documentation errors properly</div></div>',
    '<div class="fnd-h">COMMON PROBLEMS</div><div class="fnd-h3">Leak Test Failure</div><div class="fnd-tw"><table class="fnd-table"><tbody><tr><td>Situation</td><td>Action</td></tr><tr><td>Bubbles from insertion tube or bending section</td><td>FAIL - Remove from service, dry exterior, tag out, notify supervisor, initiate repair</td></tr><tr><td>Bubbles from channel opening</td><td>NORMAL - Channels are not sealed</td></tr><tr><td>Pressure won\'t hold, no visible bubbles</td><td>Check all connections, retest; if still fails, treat as failure</td></tr><tr><td>Uncertain result</td><td>Retest; if still uncertain, treat as failure</td></tr></tbody></table></div><div class="fnd-h3">Cleaning Issues</div><div class="fnd-tw"><table class="fnd-table"><tbody><tr><td>Situation</td><td>Action</td></tr><tr><td>Visible debris after cleaning</td><td>Reclean - Return to brushing step</td></tr><tr><td>Brush won\'t pass through channel</td><td>Check brush size, check for blockage, do not force; if blocked, remove from service</td></tr><tr><td>ATP fails (if used)</td><td>Reclean - Manual cleaning was inadequate</td></tr><tr><td>Scope was not pre-cleaned</td><td>Document deviation, extend enzymatic soak, clean thoroughly</td></tr></tbody></table></div><div class="fnd-h3">HLD Issues</div><div class="fnd-tw"><table class="fnd-table"><tbody><tr><td>Situation</td><td>Action</td></tr><tr><td>MEC test fails</td><td>Discard solution, prepare fresh, retest before use</td></tr><tr><td>AER cycle aborts/errors</td><td>Review alarm code, troubleshoot per AER manual, reprocess from beginning</td></tr><tr><td>Contact time interrupted</td><td>Restart entire HLD cycle</td></tr><tr><td>Wrong chemical used</td><td>Stop, consult supervisor, may need to remove scope from service</td></tr></tbody></table></div><div class="fnd-h3">Storage Issues</div><div class="fnd-tw"><table class="fnd-table"><tbody><tr><td>Situation</td><td>Action</td></tr><tr><td>Scope exceeds reprocessing window</td><td>Must reprocess before patient use</td></tr><tr><td>Scope found stored wet</td><td>Reprocess - assume contaminated</td></tr><tr><td>Scope found coiled</td><td>Inspect for damage, reprocess</td></tr><tr><td>Scope stored with valves attached</td><td>Reprocess - channels may have moisture</td></tr></tbody></table></div><div class="fnd-h">WHEN TO ESCALATE</div><p>Notify your supervisor immediately for:</p><ul class="fnd-ul"><li>Repeated leak test failures on the same scope</li><li>Suspected infection linked to endoscopy</li><li>AER malfunctions</li><li>Chemical spills or exposure</li><li>Any situation where you are unsure of the correct action</li></ul><div class="fnd-note fnd-note-tip"><div class="fnd-note-t">WHEN IN DOUBT, ASK</div><p>If you are ever uncertain whether a scope is safe for patient use, STOP and ask your supervisor. No one will criticize you for being cautious. The consequences of using a contaminated scope are severe.</p></div><div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div><p>Before proceeding, confirm you understand:</p><div class="fnd-note-li">I know what to do if a scope fails the leak test</div><div class="fnd-note-li">I know what to do if cleaning appears inadequate</div><div class="fnd-note-li">I know what to do if a scope exceeds the reprocessing window</div><div class="fnd-note-li">I know when to escalate to my supervisor</div></div>',
    '<div class="fnd-h3">STEP 1: PRE-CLEAN</div><p>Immediately at point of use. Wipe insertion tube, flush channels with enzymatic detergent, attach protective cap, place in transport container.</p><div class="fnd-h3">STEP 2: TRANSPORT</div><p>Closed, labeled container. Deliver promptly-do not allow scope to dry.</p><div class="fnd-h3">STEP 3: LEAK TEST</div><p>Before immersion. Pressurize, submerge, observe for bubbles. PASS → proceed. FAIL → remove from service.</p><div class="fnd-h3">STEP 4: MANUAL CLEAN</div><p>Fresh enzymatic solution. Clean exterior, remove/clean valves, brush EVERY channel until clean, flush all channels, visual inspection.</p><div class="fnd-h3">STEP 5: HIGH-LEVEL DISINFECT</div><p>Verify MEC. Connect all channels (AER) or fill all channels (manual). Complete full contact time. Document.</p><div class="fnd-h3">STEP 6: RINSE</div><p>Remove all disinfectant. Use appropriate water quality per IFU. Rinse all channels and surfaces.</p><div class="fnd-h3">STEP 7: DRY</div><p>Alcohol flush all channels. Forced air drying. Verify no moisture remains.</p><div class="fnd-h3">STEP 8: STORE</div><p>Hang vertically, distal tip down. Valves removed. Ventilated cabinet. Label with expiration.</p><div class="fnd-h3">STEP 9: DOCUMENT</div><p>Complete record of all steps, times, results, personnel.</p><div class="fnd-h3">STEP 10: BEFORE PATIENT USE</div><p>Verify scope is within reprocessing window. Visual inspection. Attach valves.</p><div class="fnd-h">Every step. Every channel. Every time.</div><p>Patient safety depends on your diligence.</p>'
];

  // ── The manual's Final Assessment: 14 auto-scored items (8 T/F + 6 fill-in)
// backing the capstone module's Knowledge gate. ALL required to pass. ───────
  // Verbatim from the Self-Study Manual's Final Assessment + Answer Key.
const ENDO_FINAL_QUESTIONS = [
    {type:'tf',q:'Pre-cleaning can be delayed until the scope reaches the reprocessing area.',opts:['True','False'],ans:1},
    {type:'tf',q:'Leak testing is performed after manual cleaning.',opts:['True','False'],ans:1},
    {type:'tf',q:'Manual cleaning is the most critical step in reprocessing.',opts:['True','False'],ans:0},
    {type:'tf',q:'If a scope looks clean, brushing is optional.',opts:['True','False'],ans:1},
    {type:'tf',q:'HLD contact time can be shortened if the scope was cleaned thoroughly.',opts:['True','False'],ans:1},
    {type:'tf',q:'A scope stored wet may become contaminated.',opts:['True','False'],ans:0},
    {type:'tf',q:'Scopes should be stored hanging vertically with valves removed.',opts:['True','False'],ans:0},
    {type:'tf',q:'If a scope exceeds the reprocessing window, it can still be used in an emergency.',opts:['True','False'],ans:1},
    {type:'fill',q:'Pre-cleaning must begin _____________ after procedure completion.',accepted:['immediately']},
    {type:'fill',q:'If a scope fails the leak test, it must be _____________ from service.',accepted:['removed']},
    {type:'fill',q:'Every channel must be brushed until the brush comes out _____________.',accepted:['clean']},
    {type:'fill',q:'MEC stands for _____________ _____________ _____________.',accepted:['minimum effective concentration']},
    {type:'fill',q:'Alcohol flush before storage helps _____________ the channels.',accepted:['dry']},
    {type:'fill',q:'Scopes should be stored with the _____________ tip pointing down.',accepted:['distal']}
];

  // ── G3: Observation — 28 competency items in 5 groups (Preceptor Guide, ──
  // Module 13, verbatim) ──────────────────────────────────────────────────
const ENDO_COMPETENCY_ITEMS = [
    {id:'eo-1',group:'Pre-Cleaning & Transport',text:'Wipes insertion tube correctly (handle to tip)'},
    {id:'eo-2',group:'Pre-Cleaning & Transport',text:'Flushes all channels with enzymatic detergent'},
    {id:'eo-3',group:'Pre-Cleaning & Transport',text:'Attaches protective cap'},
    {id:'eo-4',group:'Pre-Cleaning & Transport',text:'Uses closed transport container'},
    {id:'eo-5',group:'Leak Testing',text:'Connects leak tester correctly'},
    {id:'eo-6',group:'Leak Testing',text:'Achieves correct pressure'},
    {id:'eo-7',group:'Leak Testing',text:'Submerges completely'},
    {id:'eo-8',group:'Leak Testing',text:'Observes all areas including bending section'},
    {id:'eo-9',group:'Leak Testing',text:'Correctly interprets PASS/FAIL'},
    {id:'eo-10',group:'Leak Testing',text:'Verbalizes correct action for FAIL'},
    {id:'eo-11',group:'Manual Cleaning',text:'Prepares fresh enzymatic solution at correct dilution'},
    {id:'eo-12',group:'Manual Cleaning',text:'Immerses and soaks for correct time'},
    {id:'eo-13',group:'Manual Cleaning',text:'Cleans all external surfaces'},
    {id:'eo-14',group:'Manual Cleaning',text:'Removes and cleans all valves'},
    {id:'eo-15',group:'Manual Cleaning',text:'Selects correct brush sizes'},
    {id:'eo-16',group:'Manual Cleaning',text:'Brushes each channel through FULL length'},
    {id:'eo-17',group:'Manual Cleaning',text:'Continues until brush emerges clean'},
    {id:'eo-18',group:'Manual Cleaning',text:'Flushes all channels'},
    {id:'eo-19',group:'Manual Cleaning',text:'Performs visual inspection'},
    {id:'eo-20',group:'HLD, Rinse, Dry, Storage',text:'Tests MEC before use'},
    {id:'eo-21',group:'HLD, Rinse, Dry, Storage',text:'Connects all channels (AER) or fills all channels (manual)'},
    {id:'eo-22',group:'HLD, Rinse, Dry, Storage',text:'Achieves full contact time'},
    {id:'eo-23',group:'HLD, Rinse, Dry, Storage',text:'Rinses with appropriate water quality'},
    {id:'eo-24',group:'HLD, Rinse, Dry, Storage',text:'Performs alcohol flush'},
    {id:'eo-25',group:'HLD, Rinse, Dry, Storage',text:'Achieves complete drying'},
    {id:'eo-26',group:'HLD, Rinse, Dry, Storage',text:'Stores correctly (vertical, valves removed, labeled)'},
    {id:'eo-27',group:'Documentation',text:'Completes all required documentation'},
    {id:'eo-28',group:'Documentation',text:'Records accurately and legibly'}
];

  // ── G3, 6th group: the 4 short-answer Final Assessment questions (15–18) ─
  // that cannot be auto-marked. Leader sees `key` as a marking hint; the
  // staff-facing renderer never reads this field.
const ENDO_WRITTEN_ANSWERS = [
    {id:'ew-1',q:'List four things that must be documented for each reprocessing cycle.',key:'Any four: Scope identifier, date/time, person performing, leak test result, cleaning verification, HLD parameters (chemical, lot #, MEC result, cycle/time), drying, storage location/expiration, patient use'},
    {id:'ew-2',q:'What do you do if you see visible debris on a scope after completing manual cleaning?',key:'Return to manual cleaning. Reclean and re-brush until clean. Do NOT proceed to HLD.'},
    {id:'ew-3',q:'Why must endoscopes be stored dry?',key:'Moisture enables microbial growth. A wet scope will become contaminated even after proper HLD.'},
    {id:'ew-4',q:'What are three situations that require immediate supervisor notification?',key:'Any three: Repeated leak test failures, suspected infection linked to endoscopy, AER malfunctions, chemical spills/exposure, uncertain situations'}
];

// ── #1073: fourteen modules, one per chapter of the manual ──────────────────
//
// Client ask (31 Aug, via Sriman): the Endoscopy tab holds 14 modules, one per
// chapter, each assignable by name and each with its own questions. Read against
// the two source documents, "14" is the client's own material exactly:
//
//   * the Self-Study Manual has THIRTEEN chapters (1 Why It Matters .. 13
//     Troubleshooting), then Final Assessment, Answer Key, Quick Reference.
//     There is no fourteenth chapter.
//   * the Preceptor Guide's own module 13 is "REVIEW & COMPETENCY VERIFICATION"
//     — not Troubleshooting. Its 28-item competency list sits once, at the
//     bottom, after every module.
//
// So en-01..en-13 are the thirteen chapters and en-14 is the capstone the
// Preceptor Guide already defines. That is the fourteenth module, and it is
// where the whole-manual Final Assessment and the 28 competency items keep
// living — both documents put them there, so splitting them across chapters
// would be our invention rather than the client's content.
//
// PER-CHAPTER QUESTION BANKS DO NOT EXIST YET. Verified by reading both files:
// the manual's 49 KNOWLEDGE CHECK items are self-attestation ("I understand
// that...") and cannot be scored; the Preceptor Guide's 24 ASK/WAIT FOR pairs
// are oral prompts, 0-2 per chapter, and chapter 9 has none. The client is
// writing them. Each chapter therefore ships questions:[] and its Knowledge
// gate renders as pending — drop a bank into ENDO_CHAPTER_QUESTIONS[i] and that
// chapter's gate turns on with no other change anywhere.
//
// GATE SHAPE PER MODULE:
//   chapters (en-01..en-13) — Knowledge only. No observation list: competency
//     verification is one hands-on sit-down over the whole workflow, not
//     thirteen of them. assignEndoModule() seeds g3 as an explicit
//     not-applicable pass for these — same shape, and the same reasoning, as
//     #720 having the server force g2. See the note there.
//   capstone (en-14) — Knowledge (the 18 Final Assessment items: 14
//     auto-scored + 4 leader-marked) AND Observation (the 28 competency items
//     in 5 groups, plus the 4 written answers as a 6th). Unchanged from T108.
//
// Module ids keep the 'en-' prefix, so getFoundationsAssignments()'s filter and
// #720's `module_id like 'en-%'` guard cover en-02..en-14 with no new migration.

// One slot per chapter, indexes matching ENDO_SECTIONS. Empty until the client
// sends each chapter's bank; a filled slot needs no other change to go live.
const ENDO_CHAPTER_QUESTIONS = [[], [], [], [], [], [], [], [], [], [], [], [], []];

const ENDO_CHAPTER_COUNT = 13;   // ENDO_SECTIONS[13] is the Quick Reference, not a chapter
const ENDO_SUBTITLE = 'High-Level Disinfection · AAMI ST91 / SGNA Standards';

const ENDOSCOPY_MODULES = ENDO_SECTIONS.slice(0, ENDO_CHAPTER_COUNT).map(function (title, i) {
  return {
    id: 'en-' + String(i + 1).padStart(2, '0'),
    num: i + 1,
    // Section titles carry their own "N. " prefix; `num` renders the number.
    title: title.replace(/^\d+\.\s*/, ''),
    subtitle: ENDO_SUBTITLE,
    domain: 'Endoscopy',
    desc: 'Chapter ' + (i + 1) + ' of the SIPS Endoscope Reprocessing Self-Study Manual. Assigned by name to staff who work endoscopy.',
    sections: [title],
    sectionContent: [ENDO_SECTION_CONTENT[i]],
    questions: ENDO_CHAPTER_QUESTIONS[i] || [],
    observations: [],
    writtenAnswers: []
  };
}).concat([{
  id: 'en-14',
  num: 14,
  title: 'Review & Competency Verification',
  subtitle: 'Final Assessment · 28-Item Competency Verification',
  domain: 'Endoscopy',
  desc: 'The capstone: the manual\'s Final Assessment over the whole workflow, and the hands-on competency verification a preceptor confirms before independent practice.',
  sections: [ENDO_SECTIONS[ENDO_CHAPTER_COUNT]],
  sectionContent: [ENDO_SECTION_CONTENT[ENDO_CHAPTER_COUNT]],
  questions: ENDO_FINAL_QUESTIONS,
  observations: ENDO_COMPETENCY_ITEMS,
  writtenAnswers: ENDO_WRITTEN_ANSWERS
}]);

// A chapter with no bank yet cannot be assessed; a module with no observation
// list has nothing for a leader to confirm. Every renderer and assignEndoModule
// branch on these rather than on the module id, so behaviour follows the content
// and a bank arriving needs no code change.
function endoHasQuiz(m) { return !!(m && m.questions && m.questions.length); }
function endoHasObs(m) { return !!(m && ((m.observations || []).length || (m.writtenAnswers || []).length)); }

// ── Assignment + progress (reuses foundations.js's generic sync helpers —
// _fndSaveAssignment/_fndSaveProgress/_fndSaveAssignmentStatus map staffId/
// moduleId/g1/g2/g3/complete to the backend row regardless of which module
// owns them, so nothing endoscopy-specific needs to exist in api-supabase.js) ─
function getEndoAssignments(staffId){return (DB.foundationsAssignments||[]).filter(a=>a.staffId===staffId&&String(a.moduleId).indexOf(ENDO_MODULE_PREFIX)===0);}
function isEndoModuleAssigned(staffId,moduleId){return (DB.foundationsAssignments||[]).some(a=>a.staffId===staffId&&a.moduleId===moduleId);}
// getModuleGates() (foundations.js) is module-id-generic — reused as-is.

function endoCanAssign(){
 const u=ST.user;
 return !!(u&&!['staff_admin','assessor','staff_member'].includes(u.role));
}

// Returns true if a new assignment was created, false if it already existed
// (UNIQUE(staff_id,module_id) backs this, same contract as assignModule()).
function assignEndoModule(staffId,moduleId,assignedBy,trigger){
 if(!DB.foundationsAssignments) DB.foundationsAssignments=[];
 if(DB.foundationsAssignments.find(a=>a.staffId===staffId&&a.moduleId===moduleId)) return false;
 const s=(typeof getStaff==='function')?getStaff(staffId):(DB.staff||[]).find(x=>x.id===staffId);
 const a={id:'ea-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),staffId,moduleId,assignedBy,type:'remediation',trigger:trigger||null,facilityId:s?s.fid:null,assignedDate:new Date().toISOString().slice(0,10),status:'assigned'};
 DB.foundationsAssignments.push(a);
 if(!DB.foundationsProgress) DB.foundationsProgress=[];
 let p=DB.foundationsProgress.find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 if(!p){
   // G2 seeded pre-passed: no scenario bank exists for endoscopy (D2, design
   // note 2026-08-28). Since #720 the server forces this too, for en-% — the
   // seed is now belt-and-braces and still serves the local/demo path.
   //
   // G3 (#1073): a chapter module carries no observation list, so there is
   // nothing for a leader to confirm and the gate must not hold completion
   // shut forever. Seeded as an explicit not-applicable pass, marked "na" the
   // same way #720 marks the forced g2, so it can never be read back as an
   // earned confirmation. This survives the write: sbd_fi_progress_guard
   // resets g3 on INSERT only when the actor is NOT a leader, and #1073 is
   // leader-assign-only. Completion for a chapter is then g1 alone, under the
   // server's unchanged three-gate rule.
   //
   // ponytail: the na-pass is decided client-side from module content the
   // server cannot see. If endoscopy ever gains a content table, move the
   // branch into the guard alongside the g2 override.
   p=_endoNewProgress(staffId,moduleId);
   DB.foundationsProgress.push(p);
 }
 _fndSaveAssignment(a); _fndSaveProgress(p);
 return true;
}

// One definition of a fresh endoscopy progress row (Standards B6): both the
// assign path and saveEndoGateScore's fallback need it, and the g3 shape below
// is a decision, not a default — see assignEndoModule.
function _endoNewProgress(staffId,moduleId){
 const m=ENDOSCOPY_MODULES.find(x=>x.id===moduleId);
 const g3=endoHasObs(m)?{status:'open',items:[]}:{status:'pass',score:100,items:[],na:true};
 return {staffId,moduleId,g1:{status:'open',score:0,attempts:[]},g2:{status:'pass',score:100,attempts:[]},g3,complete:false};
}

// G1 pass rule (D1, reviewed 2026-08-28): ALL items correct, not a percentage
// threshold — see the file-header note for why.
function endoGatePassed(g){return !!(g&&g.status==='pass');}
function endoObsReady(p){return endoGatePassed(p.g1);}

function saveEndoGateScore(staffId,moduleId,score,total){
 if(!DB.foundationsProgress) DB.foundationsProgress=[];
 let p=DB.foundationsProgress.find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 if(!p){p=_endoNewProgress(staffId,moduleId);DB.foundationsProgress.push(p);}
 const g=p.g1;
 const pct=Math.round((score/total)*100);
 g.attempts.push({date:new Date().toISOString().slice(0,10),score:pct});
 g.score=Math.max(g.score||0,pct);
 if(score===total) g.status='pass';
 else if(g.status!=='pass') g.status='attempted';
 if(g.status==='pass'&&p.g3.status==='pass'){
   p.complete=true;
   const a=(DB.foundationsAssignments||[]).find(x=>x.staffId===staffId&&x.moduleId===moduleId);
   if(a) a.status='completed';
 }
 _fndSaveProgress(p);
 if(p.complete) _fndSaveAssignmentStatus(staffId,moduleId,'completed');
 return p;
}

function markEndoG3Item(staffId,moduleId,itemId,confirmed,confirmedBy){
 if(!DB.foundationsProgress) DB.foundationsProgress=[];
 let p=DB.foundationsProgress.find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 if(!p) return;
 // Observation unlocks on G1 alone (G2 is a seeded stand-in, not a real gate).
 if(confirmed&&!p.complete&&!endoObsReady(p)){
   if(typeof toast==='function') toast('Observation is locked: the Knowledge gate must be passed first (every item correct).','err');
   return;
 }
 const existing=p.g3.items.find(i=>i.id===itemId);
 if(existing){existing.confirmed=confirmed;existing.confirmedBy=confirmedBy;existing.date=new Date().toISOString().slice(0,10);}
 else{p.g3.items.push({id:itemId,confirmed,confirmedBy,date:new Date().toISOString().slice(0,10)});}
 const m=ENDOSCOPY_MODULES.find(x=>x.id===moduleId);
 if(m){
   const all=m.observations.concat(m.writtenAnswers.map(w=>({id:w.id})));
   const allDone=all.every(o=>p.g3.items.some(i=>i.id===o.id&&i.confirmed));
   if(allDone){p.g3.status='pass';p.g3.score=100;}
   else if(p.g3.status==='pass'){p.g3.status='open';p.g3.score=0;}
 }
 const a=(DB.foundationsAssignments||[]).find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 if(endoGatePassed(p.g1)&&p.g3.status==='pass'){
   p.complete=true; if(a)a.status='completed';
 } else if(p.complete){
   p.complete=false; if(a)a.status='assigned';
   _fndSaveAssignmentStatus(staffId,moduleId,'assigned');
 }
 _fndSaveProgress(p);
 if(p.complete) _fndSaveAssignmentStatus(staffId,moduleId,'completed');
}

// ── Staff portal nav gate: the tab exists only for someone actually assigned
function applyEndoscopyNavGate(staffId){
 const n=document.getElementById('s-nav-endoscopy');
 if(n) n.style.display=getEndoAssignments(staffId).length>0?'flex':'none';
}

// ── Staff portal: list of assigned endoscopy modules ────────────────────────
function renderSEndoscopy(){
 const el=document.getElementById('s-endoscopy');if(!el)return;
 const s=getStaff(ST.staffId);if(!s){el.innerHTML='<div class="empty-state"><div class="empty-ttl">No Staff Record</div></div>';return;}
 const assignments=getEndoAssignments(s.id);
 if(!assignments.length){
   // Reachable if a stale saved view routes here after unassignment — same
   // re-check pattern as Scripts/observation consoles.
   el.innerHTML='<div class="empty-state"><div class="empty-ttl">Not Assigned</div><div class="empty-desc">No endoscopy modules are currently assigned to you.</div></div>';
   return;
 }
 let html='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Endoscopy</div>';
 const done=assignments.filter(a=>a.status==='completed').length;
 html+='<span class="pill p-gold">'+done+'/'+assignments.length+' completed</span></div><div class="card-body">';
 html+='<p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0">Flexible endoscope reprocessing training. Your leader assigned this module directly — it is not part of the standard belt curriculum.</p>';
 html+='</div></div>';
 ENDOSCOPY_MODULES.forEach(m=>{
   if(!isEndoModuleAssigned(s.id,m.id)) return;
   const gates=getModuleGates(s.id,m.id);
   const complete=gates.complete;
   html+='<div class="card mb16 fnd-card fnd-unlocked">';
   html+='<div class="card-hd" style="flex-wrap:wrap;gap:8px"><div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1">';
   html+='<div class="fnd-num'+(complete?' fnd-num-done':'')+'">'+m.num+'</div>';
   html+='<div style="min-width:0"><div class="card-ttl" style="font-size:14px;margin:0">'+m.title+'</div>';
   html+='<div style="font-size:11px;color:#64748b;margin-top:2px">'+m.subtitle+'</div></div></div>';
   html+='<div style="display:flex;gap:4px;align-items:center" title="Knowledge'+(endoHasObs(m)?' | Observation':'')+'">';
   html+=fndGateBadge(gates.g1.status)+(endoHasObs(m)?fndGateBadge(gates.g3.status):'')+'</div></div>';
   html+='<div class="card-body" style="padding-top:0">';
   html+='<p style="font-size:12.5px;color:#94a3b8;line-height:1.5;margin:0 0 8px">'+m.desc+'</p>';
   html+='<div style="display:flex;gap:12px;flex-wrap:wrap;margin:10px 0">';
   // #1073: a chapter whose bank the client has not sent yet says so plainly,
   // rather than showing a Knowledge gate nobody can open.
   html+=endoHasQuiz(m)
     ? '<div class="fnd-gate-lbl">'+fndGateBadge(gates.g1.status)+'<span>Knowledge'+(gates.g1.status==='pass'?' (Passed)':'')+'</span></div>'
     : '<div class="fnd-gate-lbl"><span class="tc-muted" style="font-size:12px">Knowledge check coming soon</span></div>';
   if(endoHasObs(m)) html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g3.status)+'<span>Observation'+(gates.g3.status==='pass'?' (Confirmed)':'')+'</span></div>';
   html+='</div>';
   html+='<button class="btn btn-gold btn-sm" style="margin-top:8px" onclick="openEndoModule(\''+m.id+'\')">'+(complete?'Review':'Open Module')+'</button>';
   html+='</div></div>';
 });
 el.innerHTML=html;
}

function openEndoModule(moduleId){
 const m=ENDOSCOPY_MODULES.find(x=>x.id===moduleId);if(!m) return;
 const s=getStaff(ST.staffId);if(!s) return;
 const gates=getModuleGates(s.id,m.id);
 ST._endoTab=ST._endoTab||'content';
 renderEndoModuleTab(m,s,gates,ST._endoTab);
}

function renderEndoModuleTab(m,s,gates,tab){
 ST._endoTab=tab;
 const el=document.getElementById('s-endoscopy');
 const tabBtn=(id,label,active)=>'<div class="tab'+(active?' on':'')+'" onclick="ST._endoTab=\''+id+'\';openEndoModule(\''+m.id+'\')">'+label+'</div>';
 let html='<div class="fnd-reader">';
 html+='<button class="btn btn-ghost btn-sm" onclick="renderSEndoscopy()" style="margin-bottom:12px">&larr; Back</button>';
 html+='<div style="font-size:11px;color:#c49a20;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">ENDOSCOPY MODULE '+m.num+'</div>';
 html+='<div style="font-size:20px;font-weight:700;color:#e2e8f0">'+m.title+'</div>';
 html+='<div style="font-size:13px;color:#94a3b8;margin-top:2px">'+m.subtitle+'</div>';
 html+='<div style="display:flex;gap:14px;margin:12px 0">';
 html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g1.status)+'<span>Knowledge</span></div>';
 if(endoHasObs(m)) html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g3.status)+'<span>Observation</span></div>';
 html+='</div>';
 html+='<div class="tab-bar" style="margin-bottom:16px">';
 html+=tabBtn('content','Content',tab==='content');
 html+=tabBtn('gate1','Knowledge',tab==='gate1');
 // #1073: chapter modules have no observation list — the whole-workflow
 // competency verification is the capstone module's gate, not thirteen copies.
 if(endoHasObs(m)) html+=tabBtn('gate3','Observation',tab==='gate3');
 html+='</div>';
 if(tab==='content'){
   m.sections.forEach((sec,i)=>{
     html+='<div class="fnd-section">';
     html+='<div class="fnd-section-head"><span class="fnd-section-title">'+sec+'</span></div>';
     html+='<div class="fnd-section-body">'+fndFmtBody(m.sectionContent[i])+'</div></div>';
   });
 } else if(tab==='gate1'){
   html+=renderEndoGateAssessment(m,s);
 } else if(tab==='gate3'&&endoHasObs(m)){
   html+=renderEndoG3View(m,s,gates);
 }
 html+='</div>';
 el.innerHTML=html;
 el.scrollTop=0;
}

// ── Gate 1: 14 fixed items (8 T/F radios + 6 fill-in-the-blank text inputs),
// every attempt sees the same bank (nothing to sample — the bank is small),
// ALL must be correct to pass. ──────────────────────────────────────────────
function renderEndoGateAssessment(m,s){
 const gates=getModuleGates(s.id,m.id);
 const g=gates.g1;
 const passed=endoGatePassed(g);
 // #1073: the client is writing the per-chapter banks. Until one lands, say so
 // — a zero-question quiz would otherwise submit and "pass" 0 of 0.
 if(!endoHasQuiz(m)){
   return '<div class="fnd-kc"><div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">Knowledge Check</div>'
     +'<div style="background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.25);border-radius:var(--r);padding:14px 16px;font-size:12.5px;color:#94a3b8;line-height:1.6">'
     +'The questions for this chapter are being finalised by SIPS. Read the chapter now — the knowledge check appears here as soon as it is added, and this module completes once you pass it.</div></div>';
 }
 let h='<div class="fnd-kc">';
 h+='<div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">Knowledge Check</div>';
 h+='<div style="font-size:12px;color:#94a3b8;margin-bottom:16px">Answer every question. All '+m.questions.length+' must be correct to pass. You may retake this as many times as needed.</div>';
 if(passed){
   h+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px;text-align:center;margin-bottom:16px">';
   h+='<div style="font-size:16px;font-weight:700;color:#4ade80">Gate Complete &mdash; '+m.questions.length+' of '+m.questions.length+' correct</div>';
   h+='<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="retakeEndoGate(\''+m.id+'\')">Retake (practice)</button></div>';
 } else if((g.attempts||[]).length>0){
   h+='<div style="background:rgba(196,154,32,.08);border:1px solid rgba(196,154,32,.25);border-radius:var(--r);padding:10px 14px;margin-bottom:16px;font-size:12px;color:#94a3b8">Last attempt: <b style="color:#fbbf24">'+g.score+'%</b>. All '+m.questions.length+' items must be correct to pass &mdash; review and try again.</div>';
 }
 const locked=passed&&!ST._endoRetake;
 h+='<div id="endo-gate-questions">';
 m.questions.forEach((item,qi)=>{
   h+='<div class="fnd-q" data-qi="'+qi+'">';
   h+='<div class="fnd-q-text">'+(qi+1)+'. '+item.q+'</div>';
   if(item.type==='tf'){
     item.opts.forEach((opt,oi)=>{
       h+='<label class="fnd-q-opt"><input type="radio" name="endo-q-'+qi+'" value="'+oi+'"'+(locked?' disabled':'')+'><span class="fnd-q-lbl">'+opt+'</span></label>';
     });
   } else {
     h+='<input type="text" class="form-input" id="endo-fill-'+qi+'" style="max-width:320px"'+(locked?' disabled':'')+' placeholder="Type your answer">';
   }
   h+='</div>';
 });
 h+='</div>';
 if(!locked) h+='<button class="btn btn-gold" style="margin-top:16px;width:100%" onclick="submitEndoGate(\''+m.id+'\')">Submit</button>';
 h+='<div id="endo-gate-result"></div></div>';
 return h;
}
function retakeEndoGate(moduleId){ ST._endoRetake=true; ST._endoTab='gate1'; openEndoModule(moduleId); }

function _endoNormalize(v){return String(v||'').toLowerCase().trim().replace(/\s+/g,' ').replace(/[.]+$/,'');}

function submitEndoGate(moduleId){
 const m=ENDOSCOPY_MODULES.find(x=>x.id===moduleId);if(!m) return;
 const s=getStaff(ST.staffId);if(!s) return;
 delete ST._endoRetake;
 let correct=0;
 const results=[];
 m.questions.forEach((item,qi)=>{
   let ok=false;
   if(item.type==='tf'){
     const sel=document.querySelector('input[name="endo-q-'+qi+'"]:checked');
     ok=!!(sel&&parseInt(sel.value)===item.ans);
   } else {
     const el=document.getElementById('endo-fill-'+qi);
     const v=_endoNormalize(el?el.value:'');
     ok=item.accepted.some(a=>_endoNormalize(a)===v);
   }
   if(ok) correct++;
   results.push(ok);
 });
 const p=saveEndoGateScore(s.id,m.id,correct,m.questions.length);
 const passed=correct===m.questions.length;
 // Mark each item so a wrong answer is visible on screen.
 m.questions.forEach((item,qi)=>{
   if(item.type==='tf'){
     const opts=document.querySelectorAll('input[name="endo-q-'+qi+'"]');
     opts.forEach((opt,oi)=>{const lbl=opt.closest('.fnd-q-opt');if(!lbl)return;opt.disabled=true;if(oi===item.ans)lbl.classList.add('fnd-q-correct');else if(opt.checked&&oi!==item.ans)lbl.classList.add('fnd-q-wrong');});
   } else {
     const el=document.getElementById('endo-fill-'+qi);
     if(el){el.disabled=true; el.style.borderColor=results[qi]?'#4ade80':'#f87171';}
   }
 });
 const rEl=document.getElementById('endo-gate-result');
 if(rEl){
   const score=Math.round((correct/m.questions.length)*100);
   if(passed){
     const obsNow=endoObsReady(p)&&p.g3.status!=='pass';
     rEl.innerHTML='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#4ade80">'+correct+'/'+m.questions.length+'</div><div style="font-size:13px;color:#4ade80;font-weight:600;margin:4px 0">Gate Complete</div><div style="font-size:12px;color:#94a3b8">'+(obsNow?'Observation is now unlocked.':'')+'</div></div>';
     toast('Knowledge gate complete ('+correct+'/'+m.questions.length+')','ok');
   } else {
     rEl.innerHTML='<div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#f87171">'+correct+'/'+m.questions.length+'</div><div style="font-size:13px;color:#f87171;font-weight:600;margin:4px 0">Not Yet Passing</div><div style="font-size:12px;color:#94a3b8">All '+m.questions.length+' must be correct. Review the highlighted answers and try again.</div><button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="openEndoModule(\''+moduleId+'\')">Try Again</button></div>';
     toast('Score: '+score+'%. All '+m.questions.length+' must be correct.','err');
   }
 }
}

// ── Gate 3 view (staff, read-only): grouped 28 + Written Answers (question
// text only — no key). ──────────────────────────────────────────────────────
function renderEndoG3View(m,s,gates){
 let h='<div class="fnd-kc">';
 h+='<div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">Observation / Competency Verification</div>';
 h+='<div style="font-size:12px;color:#94a3b8;margin-bottom:16px">Your leader confirms each item below after observing you perform it, and marks your written answers separately. You cannot self-confirm these items.</div>';
 if(!gates.complete&&!endoObsReady(gates)){
   h+='<div style="background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.25);border-radius:var(--r);padding:12px 14px;margin-bottom:16px;font-size:12px;color:#94a3b8">Observation unlocks after the <b style="color:#e2e8f0">Knowledge</b> gate is passed (every item correct).</div>';
 }
 if(gates.g3.status==='pass'){
   h+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px;text-align:center;margin-bottom:16px"><div style="font-size:16px;font-weight:700;color:#4ade80">All Items Confirmed</div></div>';
 }
 const groups=[];
 m.observations.forEach(o=>{if(groups.indexOf(o.group)===-1) groups.push(o.group);});
 groups.forEach(gr=>{
   h+='<div style="font-size:11px;font-weight:700;color:#c49a20;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 4px">'+gr+'</div>';
   m.observations.filter(o=>o.group===gr).forEach(obs=>{
     const confirmed=gates.g3.items.find(i=>i.id===obs.id&&i.confirmed);
     h+=_endoObsRow(obs.text,confirmed);
   });
 });
 h+='<div style="font-size:11px;font-weight:700;color:#c49a20;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 4px">Written Answers</div>';
 m.writtenAnswers.forEach(w=>{
   const confirmed=gates.g3.items.find(i=>i.id===w.id&&i.confirmed);
   h+=_endoObsRow(w.q,confirmed);
 });
 h+='</div>';
 return h;
}
function _endoObsRow(text,confirmed){
 let h='<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">';
 if(confirmed){
   h+='<svg viewBox="0 0 18 18" width="16" height="16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="9" cy="9" r="8" fill="rgba(74,222,128,.15)" stroke="#4ade80" stroke-width="1.3"/><path d="M5.5 9.5l2.5 2.5L13 7" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
   h+='<div><div style="font-size:13px;color:#4ade80">'+text+'</div>';
   h+='<div style="font-size:11px;color:#64748b;margin-top:2px">Confirmed by '+Security.sanitize(confirmed.confirmedBy||'—')+' on '+Security.sanitize(confirmed.date||'')+'</div></div>';
 } else {
   h+='<svg viewBox="0 0 18 18" width="16" height="16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="9" cy="9" r="8" stroke="#475569" stroke-width="1.3"/></svg>';
   h+='<div style="font-size:13px;color:#94a3b8">'+text+'</div>';
 }
 h+='</div>';
 return h;
}

// ── Leader: the Endoscopy tab (#1073) ───────────────────────────────────────
//
// Until now endoscopy was assigned from one column inside the Foundations
// Training table. The client asked (31 Aug) for its own side-panel tab so a
// leader never enters Foundations to assign it — so that column is gone and
// this is the surface. Renders into h-endoscopy, or a-endoscopy for network
// admins, the same container-by-portal trick renderHTraining uses.
function renderHEndoscopy(){
 const el=document.getElementById(ST.portal==='admin'?'a-endoscopy':'h-endoscopy');if(!el)return;
 const _u=ST.user;
 // Same role scope as Foundations/Instruments (RLS Addendum v1.1 §6).
 const isSystemWide=!!(_u&&['master_admin','admin','staff_admin','assessor'].includes(_u.role));
 let scopeFacs=DB.facilities.filter(f=>f.active!==false);
 if(isSystemWide&&_u.role==='staff_admin'&&(_u.assignedFids||[]).length) scopeFacs=scopeFacs.filter(f=>_u.assignedFids.includes(f.id));
 let staff;
 if(isSystemWide){
   staff=DB.staff.filter(s=>scopeFacs.some(f=>f.id===s.fid));
   const ff=ST._endoFacFilter||'all';
   if(ff!=='all') staff=staff.filter(s=>s.fid===ff);
 } else {
   staff=DB.staff.filter(s=>s.fid===ST.hFid);
 }
 const canAssign=endoCanAssign();
 const rows=staff.map(s=>{
   const asgns=getEndoAssignments(s.id);
   return {s,assigned:asgns.length,done:asgns.filter(a=>a.status==='completed').length};
 });
 // Assigned-by-name only: the roster is everyone in scope, but the counters
 // describe the people actually enrolled, not the department.
 const enrolled=rows.filter(r=>r.assigned>0);
 const totalA=enrolled.reduce((n,r)=>n+r.assigned,0);
 const totalC=enrolled.reduce((n,r)=>n+r.done,0);
 const pending=ENDOSCOPY_MODULES.filter(m=>!endoHasQuiz(m)).length;

 let html='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Endoscopy'+(isSystemWide?' <span style="font-size:11px;color:#64748b;font-weight:500">(all facilities)</span>':'')+'</div>'
   +'<span class="pill p-gold">'+ENDOSCOPY_MODULES.length+' modules</span></div><div class="card-body">';
 html+='<p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 12px">Endoscope reprocessing training, one module per chapter of the Self-Study Manual plus the competency verification capstone. '
   +'This is not a belt requirement and not a facility-wide rollout &mdash; assign it by name to the people who work endoscopy, and nobody else at their belt level sees it.</p>';
 if(pending){
   html+='<div style="background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.25);border-radius:var(--r);padding:10px 14px;margin-bottom:14px;font-size:12px;color:#94a3b8">'
     +'<b style="color:#e2e8f0">'+pending+' of '+ENDOSCOPY_MODULES.length+' modules are reading-only for now.</b> Their knowledge checks are still being written by SIPS. '
     +'You can assign them today; each one starts scoring itself the moment its questions are added.</div>';
 }
 if(isSystemWide){
   html+='<div style="margin-bottom:14px"><select class="form-select" style="max-width:280px" onchange="ST._endoFacFilter=this.value;renderHEndoscopy()"><option value="all"'+((ST._endoFacFilter||'all')==='all'?' selected':'')+'>All Facilities</option>'
     +scopeFacs.slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(f=>'<option value="'+f.id+'"'+(ST._endoFacFilter===f.id?' selected':'')+'>'+f.name+'</option>').join('')+'</select></div>';
 }
 html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px">';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Enrolled</div><div class="stat-val">'+enrolled.length+'</div></div>';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Assigned</div><div class="stat-val">'+totalA+'</div></div>';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Completed</div><div class="stat-val" style="color:#4ade80">'+totalC+'</div></div>';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Rate</div><div class="stat-val">'+(totalA>0?Math.round(totalC/totalA*100):0)+'%</div></div>';
 html+='</div></div></div>';

 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Staff</div></div>';
 html+='<div class="card-body" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th>'+(isSystemWide?'<th>Facility</th>':'')+'<th>Belt</th><th>Modules</th><th>Actions</th></tr></thead><tbody>';
 rows.sort((a,b)=>fullName(a.s).localeCompare(fullName(b.s)));
 if(!rows.length) html+='<tr><td colspan="'+(isSystemWide?5:4)+'" style="text-align:center;color:#64748b;padding:18px">No staff in scope.</td></tr>';
 rows.forEach(r=>{
   html+='<tr><td style="font-weight:600">'+fullName(r.s)+'</td>';
   if(isSystemWide){const _fn=(DB.facilities.find(f=>f.id===r.s.fid)||{}).name||'—';html+='<td style="font-size:12px;color:#94a3b8">'+_fn+'</td>';}
   html+='<td><span class="bb bb-'+r.s.belt+'">'+r.s.belt+'</span></td>';
   const pct=r.assigned>0?Math.round(r.done/r.assigned*100):0;
   html+='<td>'+(r.assigned>0?'<span class="'+(pct===100?'tc-ok':pct>0?'tc-warn':'tc-muted')+'">'+r.done+'/'+r.assigned+'</span>':'<span class="tc-muted">None</span>')+'</td>';
   html+='<td style="white-space:nowrap">';
   if(r.assigned>0) html+='<button class="btn btn-ghost btn-xs" onclick="hEndoStaffDetail(\''+r.s.id+'\')">View</button> ';
   if(canAssign&&r.assigned<ENDOSCOPY_MODULES.length) html+='<button class="btn btn-gold btn-xs" onclick="hAssignEndoscopyModal(\''+r.s.id+'\')">Assign</button>';
   if(!canAssign&&!r.assigned) html+='<span class="tc-muted">None</span>';
   html+='</td></tr>';
 });
 html+='</tbody></table></div></div></div>';
 el.innerHTML=html;
}


function hAssignEndoscopyModal(staffId){
 if(!endoCanAssign()){toast('Assessors cannot assign modules','err');return;}
 const s=getStaff(staffId);if(!s) return;
 const existing=getEndoAssignments(s.id);
 const unassigned=ENDOSCOPY_MODULES.filter(m=>!existing.some(a=>a.moduleId===m.id));
 if(!unassigned.length){toast('All endoscopy modules already assigned','info');return;}
 let html='<div style="margin-bottom:12px;font-size:13px;color:var(--txt2)">Assign endoscopy modules to <strong style="color:var(--txt)">'+fullName(s)+'</strong>. This is not part of the belt curriculum &mdash; nobody else at their belt sees it.</div>';
 html+='<div style="margin-bottom:12px"><label style="display:block;font-size:12px;color:var(--txt2);margin-bottom:4px">Reason <span style="color:var(--txt3)">(optional)</span></label>';
 html+='<input id="endo-assign-trigger" type="text" class="form-input" placeholder="e.g. reassigned to GI suite"></div>';
 html+='<div style="max-height:260px;overflow-y:auto">';
 unassigned.forEach(m=>{
   html+='<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;font-size:13px;color:#cbd5e1">';
   html+='<input type="checkbox" class="endo-assign-cb" value="'+m.id+'" style="accent-color:#c49a20">';
   html+='<span><strong>'+m.num+'.</strong> '+m.title
     +(endoHasQuiz(m)?'':' <span class="tc-muted" style="font-size:11px">&middot; reading only for now</span>')+'</span></label>';
 });
 html+='</div><div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">';
 html+='<button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button>';
 html+='<button class="btn btn-gold btn-sm" onclick="hDoAssignEndoscopy(\''+s.id+'\')">Assign</button></div>';
 openModal('Assign Endoscopy',html,'modal-sm');
}
function hDoAssignEndoscopy(staffId){
 if(!endoCanAssign()){toast('Assessors cannot assign modules','err');return;}
 const cbs=document.querySelectorAll('.endo-assign-cb:checked');
 if(!cbs.length){toast('Select at least one module','err');return;}
 const nm=ST.user?ST.user.name:'Manager';
 const trigEl=document.getElementById('endo-assign-trigger');
 const trigger=(trigEl&&trigEl.value.trim())?trigEl.value.trim():null;
 let assigned=0,skipped=0;
 cbs.forEach(cb=>{ if(assignEndoModule(staffId,cb.value,nm,trigger)) assigned++; else skipped++; });
 closeModal();
 if(assigned) toast(assigned+' endoscopy module'+(assigned>1?'s':'')+' assigned','ok');
 if(skipped) toast(skipped+' already assigned — skipped','info');
 renderHEndoscopy();
}

function hEndoStaffDetail(staffId){
 const s=getStaff(staffId);if(!s) return;
 const el=document.getElementById(ST.portal==='admin'?'a-endoscopy':'h-endoscopy');if(!el) return;
 let html='<button class="btn btn-ghost btn-sm" onclick="renderHEndoscopy()" style="margin-bottom:12px">&larr; Back</button>';
 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">'+fullName(s)+' &mdash; Endoscopy</div><span class="bb bb-'+s.belt+'">'+s.belt+'</span></div>';
 html+='<div class="card-body"><div style="font-size:13px;color:#94a3b8">'+s.role+'</div></div></div>';
 ENDOSCOPY_MODULES.forEach(m=>{
   if(!isEndoModuleAssigned(s.id,m.id)) return;
   const gates=getModuleGates(s.id,m.id);
   const a=getEndoAssignments(s.id).find(x=>x.moduleId===m.id);
   html+='<div class="card mb16"><div class="card-hd" style="flex-wrap:wrap;gap:8px">';
   html+='<div style="display:flex;align-items:center;gap:8px"><div class="fnd-num'+(gates.complete?' fnd-num-done':'')+'">'+m.num+'</div>';
   html+='<div class="card-ttl" style="font-size:14px;margin:0">'+m.title+'</div></div>';
   html+='<div style="display:flex;gap:4px;align-items:center">'+fndGateBadge(gates.g1.status)+(endoHasObs(m)?fndGateBadge(gates.g3.status):'');
   if(ST.user&&ST.user.role==='master_admin') html+='<button class="btn btn-ghost btn-xs" style="margin-left:8px;border-color:rgba(239,68,68,.4);color:#f87171" onclick="hUnassignEndo(\''+s.id+'\',\''+m.id+'\')">Unassign</button>';
   html+='</div></div><div class="card-body" style="padding-top:0">';
   html+='<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:#94a3b8">';
   html+='<span>Knowledge: '+(!endoHasQuiz(m)?'<span class="tc-muted">questions pending from SIPS</span>':gates.g1.status==='pass'?'<span class="tc-ok">'+gates.g1.score+'%</span>':'<span class="tc-muted">'+gates.g1.status+'</span>')+'</span>';
   if(endoHasObs(m)) html+='<span>Observation: '+(gates.g3.status==='pass'?'<span class="tc-ok">Confirmed</span>':'<span class="tc-warn">Pending</span>')+'</span>';
   html+='</div>';
   if(a){
     html+='<div style="font-size:11px;color:#64748b;margin-bottom:12px">Assigned by '+Security.sanitize(a.assignedBy||'—')+(a.assignedDate?' &middot; '+Security.sanitize(a.assignedDate):'')+(a.trigger?' &middot; '+Security.sanitize(a.trigger):'')+'</div>';
   }
   if(!endoHasObs(m)){
     html+='<div style="font-size:12px;color:#64748b;line-height:1.6">Reading module &mdash; there is nothing to confirm here. The hands-on competency verification is the <b style="color:#94a3b8">Review &amp; Competency Verification</b> module.</div>';
     html+='</div></div>'; return;
   }
   const groups=[];
   m.observations.forEach(o=>{if(groups.indexOf(o.group)===-1) groups.push(o.group);});
   groups.forEach(gr=>{
     html+='<div style="font-size:11px;font-weight:700;color:#c49a20;text-transform:uppercase;letter-spacing:.5px;margin:14px 0 4px">'+gr+'</div>';
     m.observations.filter(o=>o.group===gr).forEach(obs=>{
       const confirmed=gates.g3.items.find(i=>i.id===obs.id&&i.confirmed);
       html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">';
       html+='<input type="checkbox" style="accent-color:#4ade80;flex-shrink:0" '+(confirmed?'checked':'')+' onchange="markEndoG3Wrap(\''+s.id+'\',\''+m.id+'\',\''+obs.id+'\',this.checked)">';
       html+='<span style="font-size:12.5px;color:'+(confirmed?'#4ade80':'#94a3b8')+'">'+obs.text+'</span></div>';
     });
   });
   html+='<div style="font-size:11px;font-weight:700;color:#c49a20;text-transform:uppercase;letter-spacing:.5px;margin:14px 0 4px">Written Answers</div>';
   m.writtenAnswers.forEach(w=>{
     const confirmed=gates.g3.items.find(i=>i.id===w.id&&i.confirmed);
     html+='<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">';
     html+='<div style="display:flex;align-items:center;gap:8px">';
     html+='<input type="checkbox" style="accent-color:#4ade80;flex-shrink:0" '+(confirmed?'checked':'')+' onchange="markEndoG3Wrap(\''+s.id+'\',\''+m.id+'\',\''+w.id+'\',this.checked)">';
     html+='<span style="font-size:12.5px;color:'+(confirmed?'#4ade80':'#94a3b8')+'">'+w.q+'</span></div>';
     html+='<div style="font-size:11px;color:#64748b;margin:4px 0 0 26px">Key: '+w.key+'</div></div>';
   });
   html+='</div></div>';
 });
 el.innerHTML=html;
}
function markEndoG3Wrap(staffId,moduleId,itemId,checked){
 const assignerName=ST.user?ST.user.name:'Manager';
 markEndoG3Item(staffId,moduleId,itemId,checked,assignerName);
 hEndoStaffDetail(staffId);
}

function hUnassignEndo(staffId,moduleId){
 if(!(ST.user&&ST.user.role==='master_admin')){toast('Only the Master Admin can unassign modules','err');return;}
 if(!confirm('Unassign this endoscopy module? The staff member loses access; progress history is kept.'))return;
 DB.foundationsAssignments=(DB.foundationsAssignments||[]).filter(a=>!(a.staffId===staffId&&a.moduleId===moduleId));
 try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.deleteFoundationsAssignment){SB.deleteFoundationsAssignment(staffId,moduleId).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Endoscopy unassign');});}}catch(e){}
 toast('Endoscopy module unassigned','info');
 if(getEndoAssignments(staffId).length>0) hEndoStaffDetail(staffId); else renderHEndoscopy();
}
