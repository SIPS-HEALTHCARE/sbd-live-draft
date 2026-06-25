SBD_Foundations_Code.js
// ============================================================
// SBD FOUNDATIONS - STANDALONE CODE EXTRACTION
// ============================================================
// INTEGRATION INSTRUCTIONS:
//
// 1. NAV ITEMS TO ADD:
//    Staff Portal: Add nav item with data-view="s-foundations" after Study & Practice
//    Hospital Portal: Add nav item with data-view="h-training" after Position School
//
// 2. VIEW CONTAINERS TO ADD:
//    Staff: <div id="s-foundations" class="hidden"></div>
//    Hospital: <div id="h-training" class="hidden"></div>
//
// 3. VIEW ARRAYS TO UPDATE:
//    renderSView: add 's-foundations' to the forEach array
//    renderHView: add 'h-training' to the forEach array
//
// 4. FUNCTION MAP TO UPDATE:
//    Staff:   's-foundations': renderSFoundations,
//    Hospital: 'h-training': () => renderHTraining(),
//
// 5. DB KEYS TO ADD:
//    Add 'foundationsAssignments' and 'foundationsProgress' to _DB_SAVE_KEYS
//    Add: if(!DB.foundationsAssignments) DB.foundationsAssignments = [];
//    Add: if(!DB.foundationsProgress) DB.foundationsProgress = [];
//
// 6. CSS: Add the contents of SBD_Foundations_Instruments_CSS.css
//    to the stylesheet before </style>
//
// 7. DEPENDENCIES: This code uses these existing platform functions:
//    getStaff(), fullName(), saveDemoData(), showToast(),
//    openModal(), closeModal(), fndGateBadge() (defined in this file)
//
// ============================================================
 
// ============================================================ SBD FOUNDATIONS (3-GATE MODEL)
// Phase 1: Content + Knowledge (Gate 1) + Simulation (Gate 2) + Observation (Gate 3)
// Visible But Locked. 80% threshold on Gates 1 and 2. Gate 3 educator-confirmed.
 
const FOUNDATIONS_MODULES = [
 {id:'fm-01',num:1,title:'Foundations',subtitle:'Why This Work Matters',domain:'Departmental',
  desc:'The mission of sterile processing, microbiology basics, chain of infection, Spaulding Classification, regulatory standards, and the SBD operating philosophy.',
  sections:['1.1 The Mission','1.2 Microbiology','1.3 Chain of Infection','1.4 Spaulding Classification','1.5 Standards & Regulations','1.6 The SBD Method','1.7 Professional Responsibility'],
  sectionContent:[
    'The SPD exists for one reason: to ensure every reusable medical device is safe. When sterile processing fails, patients get Healthcare-Associated Infections (HAIs) or Surgical Site Infections (SSIs). This job requires attention to detail, consistency, integrity, humility, and pride.',
    'Microorganisms include bacteria, viruses, fungi, and parasites. Pathogens cause disease. Bacterial spores are the most resistant form of microbial life and your sterilization benchmark. Bioburden is the microorganism load on an item before processing. Sterilization cannot work on dirty instruments.',
    'The Chain of Infection has six links: Infectious Agent, Reservoir, Portal of Exit, Mode of Transmission, Portal of Entry, Susceptible Host. SPD breaks Link 4 by ensuring contaminated instruments do not transmit infection.',
    'Critical items enter sterile tissue and must be sterilized. Semi-critical items contact mucous membranes and require high-level disinfection minimum. Non-critical items contact intact skin and need low-level disinfection.',
    'Key organizations: AAMI (standards), AORN (perioperative guidelines), TJC (accreditation), FDA (device regulation), CMS (Medicare conditions), CDC (infection prevention), OSHA (worker safety). AAMI ST79 governs steam sterilization. IFUs are legally required.',
    'SBD four pillars: Standardization (reduces variability), Verification (catches errors before patients), Documentation (creates traceable records), Communication (prevents misunderstandings).',
    'Sterile processing is a profession with standards, ethics, and responsibilities. Certification through HSPA (CRCST) or CBSPD (CSPDT) validates knowledge. Professional ethics: patient-first decisions, honest reporting, following procedures when unobserved.'
  ],
  questions:[
    {q:'What is the primary purpose of the Sterile Processing Department?',opts:['Organize surgical supply inventory','Ensure reusable medical devices are safe for patient use','Track surgical case schedules','Order new instruments for the OR'],ans:1},
    {q:'Which microorganism type is the most resistant to sterilization?',opts:['Viruses','Fungi','Bacterial spores','Parasites'],ans:2},
    {q:'What does bioburden refer to?',opts:['The weight of a sterilization load','The number and type of microorganisms on an item before processing','The amount of detergent required','The total instruments in a tray'],ans:1},
    {q:'Which link in the Chain of Infection does SPD primarily break?',opts:['Link 1: Infectious Agent','Link 3: Portal of Exit','Link 4: Mode of Transmission','Link 6: Susceptible Host'],ans:2},
    {q:'Under Spaulding Classification, which items MUST be sterilized?',opts:['Non-critical items','Semi-critical items','Critical items','All items regardless of contact'],ans:2},
    {q:'What is the minimum processing for semi-critical items?',opts:['Low-level disinfection','Intermediate disinfection','High-level disinfection','No processing required'],ans:2},
    {q:'Which standard is the primary reference for steam sterilization?',opts:['OSHA 1910','AAMI ST79','FDA 510(k)','CDC HICPAC'],ans:1},
    {q:'Why must manufacturer IFUs be followed?',opts:['They are optional recommendations','Following them is required by law','They only apply to new instruments','They are facility-specific'],ans:1},
    {q:'Which SBD pillar requires real-time records, not end-of-shift?',opts:['Standardization','Verification','Documentation','Communication'],ans:2},
    {q:'What is biofilm?',opts:['A protective colony of bacteria resistant to killing','A type of sterilization packaging','A cleaning solution for ultrasonics','A quality test for washers'],ans:0}
  ],
  simulations:[
    {s:'A surgeon tells you that sterile processing is "just cleaning." How do you understand your role?',opts:['They are correct, it is mostly cleaning','SPD ensures every reusable device is safe through cleaning, inspection, sterilization, and verified processes','SPD only handles sterilization, not cleaning','Cleaning is housekeeping, SPD does packaging'],ans:1},
    {s:'You find a surgical instrument with visible tissue on it after sterilization. What does this tell you?',opts:['Sterilization killed everything so it is safe','The cleaning step failed and this item cannot be considered sterile','This is normal for complex instruments','Report it next week during the staff meeting'],ans:1},
    {s:'A coworker says "the sterilizer kills everything anyway" and skips thorough cleaning. Is this correct?',opts:['Yes, sterilization eliminates all risk','No, organic matter shields microorganisms and sterilization cannot penetrate debris','Only true for gravity cycles','Only incorrect for implants'],ans:1},
    {s:'A blood pressure cuff falls on the floor. Under Spaulding Classification, what level of processing does it need?',opts:['Sterilization','High-level disinfection','Low-level disinfection (wipe with hospital-grade disinfectant)','No processing, intact skin contact only'],ans:2},
    {s:'A flexible bronchoscope contacts the patient respiratory tract. What is the minimum required processing?',opts:['Low-level disinfection','Intermediate disinfection','High-level disinfection','Steam sterilization only'],ans:2},
    {s:'A surveyor from The Joint Commission asks if your department follows manufacturer IFUs. What is the correct answer?',opts:['We follow them when convenient','Yes, following IFUs is required by law and is standard practice','We use our own procedures instead','IFUs are suggestions, not requirements'],ans:1},
    {s:'You notice a coworker documenting sterilization load records at the end of their shift from memory. What SBD pillar does this violate?',opts:['Standardization','Verification','Documentation','Communication'],ans:2},
    {s:'You find an error in your own work. Nobody saw it. What do you do?',opts:['Fix it quietly and move on','Report it through proper channels because integrity requires honest reporting','Wait to see if anyone notices','Only report if it involves an implant'],ans:1},
    {s:'A new tech asks why there are so many rules in SPD. What is the best explanation?',opts:['Because management likes paperwork','Each rule exists to break a link in the chain of infection and protect patients','The rules are mostly for accreditation purposes','Most rules are outdated but still enforced'],ans:1},
    {s:'Which of the following would be classified as a critical item under Spaulding?',opts:['A stethoscope','A bed rail','A surgical scalpel that enters sterile tissue','A blood pressure cuff'],ans:2}
  ],
  observations:[
    {id:'o1-1',text:'Can state the primary purpose of the SPD in their own words'},
    {id:'o1-2',text:'Can name all three Spaulding Classification categories and give an example of each'},
    {id:'o1-3',text:'Can identify at least three regulatory organizations that govern SPD (AAMI, AORN, TJC, FDA, CMS, CDC, OSHA)'},
    {id:'o1-4',text:'Can state the four SBD pillars from memory'},
    {id:'o1-5',text:'Demonstrates documentation in real time during observed work, not after the fact'},
    {id:'o1-6',text:'Can explain why cleaning must happen before sterilization'}
  ]},
 {id:'fm-02',num:2,title:'Decontamination',subtitle:'The Foundation of Safe Processing',domain:'Cleaning',
  desc:'PPE requirements, point-of-use treatment, transport, receiving and sorting, manual cleaning techniques, ultrasonic cleaning, automated washer operation, and quality verification.',
  sections:['2.1 PPE','2.2 Point-of-Use Treatment','2.3 Transport','2.4 Receiving & Sorting','2.5 Manual Cleaning','2.6 Ultrasonic Cleaning','2.7 Automated Washers','2.8 Quality Verification'],
  sectionContent:[
    'Required PPE: fluid-resistant gown, face shield or goggles with mask, heavy-duty gloves, shoe covers, hair cover. Donning maximizes protection. Doffing prevents self-contamination with hand hygiene between steps.',
    'Point-of-use treatment happens in the OR immediately after use. Blood and tissue dry within minutes. Dried bioburden forms biofilm. Pre-treatment: enzymatic foam/gel, saline-moistened towels, immediate transport.',
    'Transport containers must be leak-proof, puncture-resistant, covered, labeled biohazardous, and cleanable. Never transport uncovered contaminated items. Keep contaminated and clean routes separate.',
    'Sort by contamination level, instrument type (general, lumened, power, delicate, complex), and processing method. Always check for sharps. Disassemble multi-part instruments before cleaning.',
    'Manual cleaning: water, detergent, mechanical action. Brush serrations in direction of ridges. Open box locks fully. Brush lumens completely through. Cannulated instruments need manufacturer-specific accessories.',
    'Ultrasonic uses cavitation (microscopic bubbles imploding). Test with aluminum foil: 20-30 seconds, check for even pitting. Do not mix dissimilar metals. Follow solution concentration and temperature per IFU.',
    'Automated washers provide standardized cleaning and thermal disinfection. Open all hinged instruments. Disassemble multi-part items. Connect lumened instruments to flushing ports. Thermal disinfection uses the A0 concept.',
    'Visual inspection is the most important verification. Use 2x-5x magnification. Check box locks, serrations, ratchets, lumens. If you see soil, it is not clean. Additional: protein residual testing, ATP testing.'
  ],
  questions:[
    {q:'What is the correct doffing order for PPE?',opts:['Gloves, gown, face protection, hand hygiene','Face protection, gloves, gown, hand hygiene','Gown, gloves, hand hygiene, face protection','Remove everything at once'],ans:0},
    {q:'Why is point-of-use treatment important?',opts:['It eliminates need for further processing','Blood and tissue dry quickly, making later removal much harder','Required only for orthopedic instruments','It replaces manual cleaning'],ans:1},
    {q:'Transport containers for contaminated items must be:',opts:['Any available cart','Open wire basket','Leak-proof, puncture-resistant, covered, labeled biohazardous','Standard cardboard box'],ans:2},
    {q:'When brushing lumens during manual cleaning, the brush must:',opts:['Be inserted halfway and withdrawn','Pass completely through the lumen','Only be used on lumens wider than 5mm','Be the same size as the opening'],ans:1},
    {q:'What is cavitation in ultrasonic cleaning?',opts:['Air pockets in detergent','Microscopic bubbles forming and collapsing to dislodge soil','A method of drying instruments','The rotation cycle of the basket'],ans:1},
    {q:'How do you verify ultrasonic cleaner effectiveness?',opts:['Listen for humming','Run empty test cycle','Aluminum foil test: check for even pitting after 20-30 seconds','Visual inspection of transducers'],ans:2},
    {q:'When loading an automated washer, hinged instruments must be:',opts:['Closed and locked','Open with box locks unlocked','In peel pouches first','Stacked to maximize capacity'],ans:1},
    {q:'What does the A0 concept measure?',opts:['Detergent concentration','Thermal disinfection exposure (time and temperature)','Water pressure','Number of instruments per load'],ans:1},
    {q:'What is the most important decontamination verification step?',opts:['ATP testing','Protein residual testing','Visual inspection with magnification','Washer printout review'],ans:2},
    {q:'Why should dissimilar metals NOT be placed together in ultrasonics?',opts:['Too much noise','Electrolytic corrosion and damage','Cannot handle mixed weights','OSHA regulation'],ans:1}
  ],
  simulations:[
    {s:'You arrive at your decontam station and realize your face shield has a crack. What do you do?',opts:['Use it anyway, the crack is small','Replace it before handling any contaminated items','Tape over the crack','Skip face protection for this shift'],ans:1},
    {s:'Instruments arrive from OR with heavy dried blood. What does this indicate and what is your response?',opts:['Normal, proceed with standard cleaning','Point-of-use treatment was inadequate or delayed; these need extended soaking before cleaning','Reject them and send back to OR','Sterilize them as-is'],ans:1},
    {s:'You notice a coworker brushing lumens by inserting the brush halfway and pulling it back. What is wrong?',opts:['Nothing, that is the correct technique','The brush must pass completely through the lumen, not just be inserted and withdrawn','Lumens do not need brushing','Only large lumens need full pass-through'],ans:1},
    {s:'After running the ultrasonic cleaner, you perform the aluminum foil test and see pitting only on one side. What does this mean?',opts:['The cleaner is working perfectly','Uneven cavitation indicates a problem; the cleaner needs maintenance','Only one side matters','This test is not reliable'],ans:1},
    {s:'A complex multi-part instrument arrives in decontam fully assembled. What do you do first?',opts:['Clean it assembled to save time','Disassemble it per IFU before cleaning','Put it directly in the washer','Soak it in enzyme overnight'],ans:1},
    {s:'You find a loose scalpel blade in a transport container with no sharps protection. What do you do?',opts:['Pick it up carefully with your gloved hand','This is a sharps hazard; use a hemostat or forceps to pick it up, report the sharps safety violation','Leave it and clean around it','Ask someone else to handle it'],ans:1},
    {s:'The automated washer completes a cycle but the printout shows the thermal disinfection temperature was 5 degrees below target. What do you do?',opts:['Accept it since it was close enough','Do not release the load; the thermal disinfection parameters were not met; reprocess or report','Check if any instruments look clean and release those','Ignore printout, they look clean'],ans:1},
    {s:'A new tech asks if they really need to wear all PPE components since decontam "is not that dirty." What do you tell them?',opts:['They can skip shoe covers','All PPE components are required because every item in decontam is contaminated with potentially infectious material','Gloves alone are enough','PPE is optional for experienced staff'],ans:1},
    {s:'You finish manually cleaning a set and visually inspect it. Under magnification, you see residual soil in a box lock. What do you do?',opts:['It is sterilization-ready','The item is not clean; re-clean the box lock area until soil is removed','Mark it and move on','Soil in box locks is acceptable'],ans:1},
    {s:'Two different metal types (stainless and aluminum) need ultrasonic cleaning. Can you put them in together?',opts:['Yes, the cleaner handles everything','No, dissimilar metals can cause galvanic corrosion; process them separately','Only if they are the same size','Yes, if you add extra detergent'],ans:1}
  ],
  observations:[
    {id:'o2-1',text:'Correctly dons and doffs PPE in the proper sequence'},
    {id:'o2-2',text:'Performs manual cleaning with instruments fully open and submerged'},
    {id:'o2-3',text:'Brushes lumens completely through (brush exits distal end)'},
    {id:'o2-4',text:'Inspects instruments under magnification after cleaning'},
    {id:'o2-5',text:'Loads automated washer with hinged instruments open and positioned for drainage'},
    {id:'o2-6',text:'Identifies at least one instrument that needs re-cleaning during quality verification'},
    {id:'o2-7',text:'Can explain the purpose of the aluminum foil test for ultrasonic cleaners'}
  ]},
 {id:'fm-03',num:3,title:'Inspection & Identification',subtitle:'The Critical Eye of Quality',domain:'Inspection',
  desc:'Visual inspection techniques, the SIPS Inspection Sequence, functional testing of instruments, damage identification, instrument marking, and removal from service criteria.',
  sections:['3.1 Purpose of Inspection','3.2 Visual Inspection','3.3 Functional Testing','3.4 Damage & Defects','3.5 Identification Methods','3.6 Instrument Categories','3.7 Removing Items from Service'],
  sectionContent:[
    'Inspection verifies cleanliness, function, and condition. Primary responsibility: after decontamination and during assembly.',
    'Use direct bright shadow-free light and 2x-5x magnification. SIPS Sequence: overall condition, working surfaces, joints/hinges, handles/shafts, lumens/channels, markings/labels.',
    'Box Lock: smooth open/close, no stiffness/looseness/grinding. Ratchet: engages each position, holds, clicks, releases clean. Jaw Alignment: tips meet evenly, no gaps, parallel. Scissors: cut cleanly to tips. Needle Holders: grip test, no rotation, cross-hatching intact.',
    'Corrosion: surface rust, pitting, stress cracking, galvanic. Physical: bent tips, cracked handles, loose joints, worn serrations. Insulation damage on electrosurgical instruments requires immediate removal.',
    'Markings on shank, shaft, handle, or blade. Resources: count sheets, manufacturer catalogs, reference books, digital tools, experienced colleagues. When in doubt, ask.',
    'Categories: Cutting/Dissecting, Grasping/Holding, Clamping/Occluding, Retracting/Exposing, Suturing/Stapling, Irrigation/Suctioning, Measuring/Probing.',
    'Immediate removal: visible soil, cracks, severe corrosion, broken parts, insulation damage, bent/misaligned, ratchets that fail, sharp burrs. Separate, tag, document, repair area, notify.'
  ],
  questions:[
    {q:'What are the three functions of inspection?',opts:['Count, sort, package','Verify cleanliness, verify function, verify condition','Identify, label, track','Clean, test, store'],ans:1},
    {q:'Recommended magnification range for inspection?',opts:['1x only','2x to 5x','10x to 20x','None needed'],ans:1},
    {q:'During the Ratchet Test, what should you feel?',opts:['Smooth sliding without clicks','A positive click with secure hold at each position','Increasing resistance','No engagement until final position'],ans:1},
    {q:'How do you test scissors?',opts:['Close tips and look for gaps','Cut through test material smoothly to tips without dragging','Measure blade length','Check weight against catalog'],ans:1},
    {q:'Insulation damage on electrosurgical instruments requires:',opts:['Monitoring over time','Immediate removal from service','Repair with tape','Notation in log only'],ans:1},
    {q:'Where are instrument markings typically found?',opts:['Only on the box','On the shank, shaft, handle, or blade','On a separate card','Only on count sheet'],ans:1},
    {q:'Kellys, Kochers, and Mosquitos belong to which category?',opts:['Cutting','Grasping','Clamping and Occluding','Retracting'],ans:2},
    {q:'When you encounter an unrecognized instrument?',opts:['Discard it','Set it aside','Ask an experienced colleague or use identification resources','Guess and place in nearest tray'],ans:2},
    {q:'Correct procedure when an instrument fails inspection?',opts:['Place back in tray','Separate, tag, document, repair area, notify supervisor','Clean again and retest','Send to OR with warning'],ans:1},
    {q:'Pitting on an instrument surface indicates:',opts:['Normal wear','Corrosion creating small holes in metal','Safe manufacturing defect','Recent sharpening'],ans:1}
  ],
  simulations:[
    {s:'You are inspecting a hemostat. The ratchet holds at positions 1 and 3 but slips at position 2. What do you do?',opts:['Use it, two positions work','Remove from service; ratchet must engage securely at every position','Oil the ratchet and retest','Only report if it slips at all positions'],ans:1},
    {s:'Under magnification you notice a needle holder jaw surface has smooth worn spots where the cross-hatching is gone. What action?',opts:['Acceptable wear for older instruments','Remove from service; worn jaw surface cannot grip needles securely','Use it for small needles only','Re-sterilize and it will be fine'],ans:1},
    {s:'A laparoscopic instrument has a small crack in its insulation coating. It is barely visible. What do you do?',opts:['It is small enough to ignore','Remove from service immediately; any insulation compromise is a patient burn risk','Mark it for repair next month','Use it for this case only'],ans:1},
    {s:'You find an instrument you do not recognize in a tray you are assembling. What is your first action?',opts:['Throw it away','Leave it out of the tray','Use identification resources or ask an experienced colleague before proceeding','Put it in the tray anyway'],ans:2},
    {s:'During inspection, scissors cut cleanly at the tips but drag in the middle of the blade. What does this indicate?',opts:['Normal for long scissors','The blades are misaligned or dull in the middle; remove for repair','Acceptable if tips cut well','This only matters for tissue scissors'],ans:1},
    {s:'You inspect a retractor and find a sharp burr on the edge that was not there before. What do you do?',opts:['File it smooth yourself','Remove from service; sharp burrs are a safety hazard for OR staff and patients','Use it but note the burr on the tray sheet','It will smooth out during sterilization'],ans:1},
    {s:'An instrument has brown discoloration on the shaft. How do you determine if it is staining or active rust?',opts:['All discoloration is rust','Staining is cosmetic and does not progress; active rust shows pitting and will worsen. Evaluate and consult lead if uncertain','Ignore discoloration on shafts','All discoloration requires removal from service'],ans:1},
    {s:'You are inspecting forceps. When closed, you can see light between the tips. What does this mean?',opts:['Normal for all forceps','Tips are misaligned; the forceps cannot grip properly and should be removed for repair','Only a problem for toothed forceps','Acceptable if the gap is small'],ans:1},
    {s:'A tray arrives from decontam and under magnification you see residual soil in several serration grooves. What do you do?',opts:['Sterilization will handle it','Return the instruments for re-cleaning; residual soil means decontamination was not effective','Wipe them with alcohol','Only re-clean if soil is on more than half the instruments'],ans:1},
    {s:'You need to identify an instrument but the etched markings on the shaft are illegible. What resources do you use?',opts:['Give up and discard it','Use count sheets, manufacturer catalogs, digital tools, or ask an experienced colleague','Guess based on the shape','Leave it for the next shift'],ans:1}
  ],
  observations:[
    {id:'o3-1',text:'Uses magnification during instrument inspection (not naked eye only)'},
    {id:'o3-2',text:'Performs box lock test: open/close through full range checking for resistance or looseness'},
    {id:'o3-3',text:'Performs ratchet test: engages each position and checks for slipping'},
    {id:'o3-4',text:'Performs jaw alignment check on at least one hinged instrument'},
    {id:'o3-5',text:'Correctly identifies an instrument that should be removed from service and follows the removal procedure'},
    {id:'o3-6',text:'Can name at least five of the seven basic instrument categories from memory'}
  ]},
 {id:'fm-04',num:4,title:'Assembly & Tray Building',subtitle:'Building Sets with Precision',domain:'Assembly',
  desc:'Clean area requirements, count sheet processes, tray organization, instrument protection, building common tray types, and container systems.',
  sections:['4.1 Assembly Workstation','4.2 Count Sheets','4.3 Tray Organization','4.4 Instrument Protection','4.5 Common Tray Types','4.6 Container Systems'],
  sectionContent:[
    'Clean area: 68-73F, 30-60% RH, positive pressure vs decontam, filtered air, restricted access. Attire: clean scrubs, bouffant cap, lint-free gloves, no jewelry, short clean nails.',
    'Count sheets specify exactly which instruments belong. SIPS process: obtain current sheet (check revision date), review, gather, verify each instrument, check off, final count, sign/date.',
    'Goals: sterilization effectiveness, instrument protection, OR usability, accurate counting, drainage. Hinged instruments open. Single layer. Heaviest on bottom. Concave surfaces down.',
    'Handle one at a time, by the body not tips, gently placed. Tip protectors on delicate instruments. Blade guards on cutting edges. Foam/silicone padding. All must be sterilization-compatible.',
    'General: liner, retractors first, clamps on stringers, scissors grouped, needle holders positioned. Orthopedic: heavy, specific racks, weight limits critical. Laparoscopic: protect shafts, ensure lumen access.',
    'Container components: base, lid, filter/retention plate, gaskets, latches, label area. Assembly: inspect, check gaskets, install filter, load per count sheet, internal indicator, close/latch, external indicator, label.'
  ],
  questions:[
    {q:'Required temperature range in the assembly area?',opts:['55-65F','68-73F','75-85F','Uncontrolled'],ans:1},
    {q:'Why positive pressure in assembly vs decontam?',opts:['Keep area warmer','Prevent contaminated air from flowing into clean area','Reduce humidity','Improve comfort'],ans:1},
    {q:'First step in the SIPS count sheet process?',opts:['Gather instruments','Verify each instrument','Obtain current count sheet and check revision date','Sign and date'],ans:2},
    {q:'Why must hinged instruments be open in the tray?',opts:['Easier to count','Steam can reach all surfaces during sterilization','Prevent rust','Take less space'],ans:1},
    {q:'How should instruments be handled during assembly?',opts:['In handfuls','One at a time, by the body, placed gently','Quickly tossed','By the tips for precision'],ans:1},
    {q:'Tip protectors must be compatible with:',opts:['The sterilization process','Instrument manufacturer only','Container brand','Any material works'],ans:0},
    {q:'Heaviest instruments placed where in tray?',opts:['On top','In the middle','On the bottom','Wherever space allows'],ans:2},
    {q:'Critical step when assembling rigid containers?',opts:['Verify gaskets are intact and properly seated','Tape the lid','Add extra padding','Stack containers'],ans:0},
    {q:'Concave surfaces (bowls) placed face down because:',opts:['Protect the rim','Allow water to drain and not pool','Save space','They are lighter'],ans:1},
    {q:'What goes inside every package before sterilization?',opts:['Patient label','Internal chemical indicator','Biological indicator','Expiration sticker'],ans:1}
  ],
  simulations:[
    {s:'You begin assembling a tray and notice the count sheet is dated 6 months ago but has a handwritten correction. What do you do?',opts:['Use it with the correction','Stop work; verify you have the current revision before proceeding','Cross out the correction and continue','Count from memory instead'],ans:1},
    {s:'During assembly, you count 23 instruments but the count sheet says 24. What is your action?',opts:['Close enough, proceed','Stop. Discrepancy must be resolved before the tray advances. Search for the missing instrument and notify lead','Add a similar instrument to make 24','Note the discrepancy on the sheet and release'],ans:1},
    {s:'You notice a coworker placing instruments in a tray with ratchets closed. What is wrong?',opts:['Nothing, that protects the ratchets','Ratchets must be open so steam can reach all surfaces during sterilization','Only matters for large clamps','Closed is faster and equally effective'],ans:1},
    {s:'A rigid container gasket looks slightly compressed and dry. What do you do?',opts:['Use it, gaskets last forever','Replace the gasket; a compromised gasket cannot maintain sterile barrier','Add lubricant and proceed','Report it next quarter'],ans:1},
    {s:'You are assembling a laparoscopic tray and a 14-inch shaft instrument does not fit without bending slightly. What do you do?',opts:['Bend it gently to fit','Do not force it; select the correct tray size or consult the count sheet for proper positioning','Trim the handle','Leave it out'],ans:1},
    {s:'The internal chemical indicator for the tray is missing from supplies. Can you proceed without it?',opts:['Yes, the external indicator is enough','No, every package must have an internal indicator before sterilization','Only implant trays need internal indicators','Use a piece of autoclave tape instead'],ans:1},
    {s:'While assembling a tray, you find an instrument with a manufacturer marking you do not recognize. What do you do?',opts:['Leave it out','Include it anyway','Use identification resources to verify it belongs in this set before including it','Throw it away'],ans:2},
    {s:'A coworker asks you to sign off on a tray count you did not personally verify. What is your response?',opts:['Sign it as a favor','Never sign for something you did not personally verify','Sign if you trust the coworker','Only refuse for implant trays'],ans:1},
    {s:'You drop a sterile tip protector on the floor. What do you do?',opts:['Wipe it and use it','Discard it and get a new sterile one','Five-second rule applies','Rinse under water'],ans:1},
    {s:'During container assembly, you install the filter and notice it has a small tear at the edge. What is your action?',opts:['It is small, proceed','Replace the filter; any compromise prevents proper sterilization','Tape over the tear','Use the container without a filter'],ans:1}
  ],
  observations:[
    {id:'o4-1',text:'Verifies count sheet is current revision before beginning assembly'},
    {id:'o4-2',text:'Places all hinged instruments in open position in the tray'},
    {id:'o4-3',text:'Handles instruments one at a time, by the body, placed gently'},
    {id:'o4-4',text:'Uses tip protectors on delicate instruments'},
    {id:'o4-5',text:'Completes final count matching count sheet before closing/wrapping'},
    {id:'o4-6',text:'Places internal chemical indicator inside package before closure'}
  ]},
 {id:'fm-05',num:5,title:'Packaging & Wrapping',subtitle:'Protecting Sterility to Point of Use',domain:'Packaging',
  desc:'Sterile barrier systems, wrap types, wrapping techniques, peel pouches, chemical indicator classification, labeling, and event-related sterility.',
  sections:['5.1 Purpose of Packaging','5.2 Wrap Types','5.3 Wrapping Techniques','5.4 Peel Pouches','5.5 Chemical Indicators','5.6 Labeling','5.7 Package Integrity'],
  sectionContent:[
    'Packaging allows sterilant penetration, provides sterile barrier, protects contents, enables aseptic opening. The complete package is the sterile barrier system (SBS).',
    'Woven (reusable) fabric wraps. Nonwoven (disposable) bonded fiber wraps (most common today). Selection: sterilization compatibility, item size/weight, storage conditions, IFU.',
    'Envelope fold (parallel) most common for rectangular items. Square fold for smaller/odd items. Sequential (double) wrapping for two barrier layers. Cuffs enable aseptic opening.',
    'Paper/film side for sterilant. Plastic side for visibility. 1 inch larger than item on all sides. Handle first for hinged instruments. Double pouch: paper-to-paper or plastic-to-plastic.',
    'Class 1: process indicator (external tape). Class 4: multi-parameter. Class 5: integrating (all critical parameters). Class 6: emulating (specific cycle). CIs do NOT prove sterility.',
    'Required: contents ID, sterilization date, sterilizer ID, load/lot number, expiration (if applicable), operator initials. Write on plastic side of pouches. Use approved markers.',
    'Event-related sterility: items remain sterile until an event compromises the package. Events: tears, holes, moisture, broken seals, contamination. Time alone does not cause sterility loss.'
  ],
  questions:[
    {q:'Four functions of packaging?',opts:['Clean, dry, seal, label','Allow sterilant penetration, sterile barrier, protect contents, aseptic opening','Contain, transport, sterilize, store','Identify, protect, track, document'],ans:1},
    {q:'Most common wrap type today?',opts:['Woven fabric','Aluminum foil','Nonwoven disposable','Paper bags'],ans:2},
    {q:'Purpose of cuffs in wrapping?',opts:['Professional appearance','Allow aseptic opening without touching sterile surface','Extra strength','Identify wrap type'],ans:1},
    {q:'Hinged instrument in peel pouch, which end first?',opts:['Tips','Handle','Either','Heaviest end'],ans:1},
    {q:'What does a Class 1 indicator prove?',opts:['Package is sterile','Parameters met','Package was exposed to sterilization process','BI passed'],ans:2},
    {q:'Which CI class responds to ALL critical parameters?',opts:['Class 1','Class 3','Class 5 (integrating)','Class 6'],ans:2},
    {q:'Event-related sterility means?',opts:['Items expire on fixed date','Items remain sterile until event compromises package','Depends on season','Must re-sterilize after every event'],ans:1},
    {q:'Where to write on a peel pouch?',opts:['Paper side','Plastic side','Separate label inside','Anywhere'],ans:1},
    {q:'Double pouching orientation?',opts:['Paper-to-paper or plastic-to-plastic','Paper-to-plastic','Any orientation','Upside down'],ans:0},
    {q:'Can CIs replace BIs as proof of sterility?',opts:['Yes, Class 5 equivalent','Yes with two indicators','No, only BIs verify sterilization killed microorganisms','Yes for routine loads'],ans:2}
  ],
  simulations:[
    {s:'You wrap a tray and realize you forgot the internal CI. The wrap is already sealed. What do you do?',opts:['It is fine, external indicator is enough','Open the package, add the internal indicator, and rewrap','Note it on the label','Add it to the next tray instead'],ans:1},
    {s:'A peel pouch seal has a small channel (gap) in the heat seal. Is this acceptable?',opts:['Yes if the gap is tiny','No; any channel in the seal compromises the sterile barrier. Re-seal or repackage','Only a problem for implants','Acceptable if less than 1mm'],ans:1},
    {s:'After sterilization, you find a wrapped package with moisture on the outside. What is this called and what do you do?',opts:['Condensation, it is normal','This is a wet pack; do not use, do not store, repackage and reprocess','Dry it with a towel and release','Only a concern if dripping wet'],ans:1},
    {s:'A coworker writes labeling information on the paper side of a peel pouch with a permanent marker. What is wrong?',opts:['Nothing, that is correct','Labels should be on the plastic side; ink on the paper side can wick through and contaminate contents','They should use pencil instead','Only wrong if using red ink'],ans:1},
    {s:'A sterile package stored for 3 months with no damage is questioned by a nurse who says "it is too old." What do you explain?',opts:['They are right, reprocess it','Under event-related sterility, items remain sterile until an event compromises the package, not based on time alone','All packages expire at 90 days','Only containers have no time limit'],ans:1},
    {s:'You are selecting wrapping material for an item going through hydrogen peroxide sterilization. Can you use standard paper/plastic peel pouches?',opts:['Yes, all pouches work everywhere','No; cellulose/paper materials are not compatible with H2O2 sterilization. Use compatible nonwoven packaging','Only if double-wrapped','Paper works in all methods'],ans:1},
    {s:'The external indicator tape on a wrapped tray did not change color after sterilization. What does this mean?',opts:['The tray is sterile anyway','The package may not have been exposed to the sterilization process; do not use, investigate','The tape was expired, ignore','Only matters if internal CI also failed'],ans:1},
    {s:'An instrument is too large for available peel pouches. What is your alternative?',opts:['Force it into the largest pouch','Use a wrap or rigid container appropriate for the item size','Cut a pouch to make it larger','Leave it unwrapped'],ans:1},
    {s:'You notice a wrapped tray has a small tear in the outer wrap layer but the inner wrap appears intact (sequential wrapping). Is it OK to use?',opts:['Yes, the inner wrap is the sterile barrier','No; both wraps are part of the sterile barrier system. Repackage and reprocess','Only if the tear is on top','Tape over the tear'],ans:1},
    {s:'A package arrives at point of use and the CI inside shows incomplete color change. What action?',opts:['Use it if the external indicator passed','Do not use; incomplete CI change means sterilization conditions may not have been met inside the package','Use it for non-critical items only','Re-incubate the CI'],ans:1}
  ],
  observations:[
    {id:'o5-1',text:'Wraps a tray using correct envelope fold technique with proper cuffs'},
    {id:'o5-2',text:'Prepares a peel pouch with correct sizing (1 inch clearance) and handle-first orientation'},
    {id:'o5-3',text:'Places internal CI inside package before sealing'},
    {id:'o5-4',text:'Applies external indicator and labels with all required information'},
    {id:'o5-5',text:'Can explain the difference between Class 1 and Class 5 chemical indicators'},
    {id:'o5-6',text:'Inspects sealed packages for integrity before releasing to sterilization'}
  ]},
 {id:'fm-06',num:6,title:'Sterilization',subtitle:'Eliminating Microbial Life',domain:'Sterilization',
  desc:'Steam sterilization (gravity, prevacuum), low-temperature methods, loading, cycle monitoring, biological indicators, Bowie-Dick testing, documentation.',
  sections:['6.1 Principles','6.2 Steam Sterilization','6.3 Low-Temperature','6.4 Loading','6.5 Monitoring','6.6 Biological Indicators','6.7 Documentation'],
  sectionContent:[
    'Sterilization: complete elimination of all microbial life including spores. Heat denatures proteins. Chemical agents alkylate DNA or oxidize cells. Key factors: contact, time, temperature, concentration.',
    'Gravity: air exits by gravity; 250F/121C, 30 min. Prevacuum: vacuum removes air; 270F/132C, 4 min. SFPP: steam/pressure pulses without deep vacuum.',
    'H2O2 Plasma: 100-130F, 28-75 min. VHP: processes longer lumens. EO: 6-12 hour cycles with aeration. Ozone: 85-95F, ~4 hours.',
    'Do not overload. Allow expansion. Position for drainage. 1+ inch between packages. Packages off chamber walls. Paper/plastic: paper-to-paper or plastic-to-plastic.',
    'Physical: gauges, displays, printouts. Chemical: external (Class 1) and internal (Class 4/5/6). Biological: gold standard. Bowie-Dick: daily before first prevacuum load.',
    'BIs: live spores killed by effective sterilization. Steam: Geobacillus stearothermophilus. EO: Bacillus atrophaeus. Negative = PASS. Positive = FAIL: quarantine, recall, investigate.',
    'Document: sterilizer ID, cycle type, load number, parameters, operator, date/time, BI results, irregularities. Review every printout. Verify temp, time, no alarms.'
  ],
  questions:[
    {q:'Definition of sterilization?',opts:['Removing visible soil','Killing most bacteria','Complete elimination of all microbial life including spores','Reducing counts to safe level'],ans:2},
    {q:'Typical prevacuum steam parameters?',opts:['250F/121C, 30 min','270F/132C, 4 min','300F/149C, 1 min','212F/100C, 60 min'],ans:1},
    {q:'Key advantage of prevacuum over gravity?',opts:['Cheaper','Active air removal provides better steam penetration for wrapped items','No BI testing needed','Can sterilize liquids'],ans:1},
    {q:'Which low-temp method needs 6-12 hour cycles?',opts:['H2O2 Plasma','VHP','Ethylene Oxide','Ozone'],ans:2},
    {q:'When is Bowie-Dick test performed?',opts:['Weekly','Daily before first prevacuum load','Monthly','Only after repairs'],ans:1},
    {q:'Steam BI organism?',opts:['Bacillus atrophaeus','E. coli','Geobacillus stearothermophilus','Staph aureus'],ans:2},
    {q:'Positive BI means?',opts:['Success','Spores survived, sterilization failed','BI expired','Incubator malfunction'],ans:1},
    {q:'Response to positive BI?',opts:['Re-incubate','Quarantine, do not use, recall if distributed, investigate','Run another load','Ignore if CI passed'],ans:1},
    {q:'What packaging NOT for H2O2 systems?',opts:['Tyvek','Nonwoven polypropylene','Cellulose/paper','Rigid containers with compatible filters'],ans:2},
    {q:'After every cycle, review:',opts:['Supply inventory','Cycle printout verifying all parameters met','OR schedule','Washer log'],ans:1}
  ],
  simulations:[
    {s:'A prevacuum cycle printout shows 270F was reached but exposure time was only 2 minutes instead of 4. What do you do?',opts:['Close enough, release the load','Do not release; sterilization parameters were not met. The load must be reprocessed','Release items that look dry','Only holds for implant loads'],ans:1},
    {s:'It is 6:30 AM. The first load of wrapped trays is ready for the prevacuum sterilizer. You have not run the Bowie-Dick test yet. Can you proceed?',opts:['Yes, Bowie-Dick can wait','No; Bowie-Dick must be run daily before the first processed load in prevacuum sterilizers','Only if the sterilizer passed yesterday','Bowie-Dick is only weekly'],ans:1},
    {s:'A BI result comes back positive for a load that was distributed to OR 2 hours ago. What is your immediate action?',opts:['Wait to see if any patient gets an infection','Immediately notify your supervisor, quarantine any remaining items, initiate recall of distributed items','Re-run the BI to confirm','Document it for the monthly report'],ans:1},
    {s:'An OR nurse brings an item for IUSS (Immediate Use Steam Sterilization) that was dropped on the floor. The item is visibly soiled. Can you IUSS it directly?',opts:['Yes, IUSS handles everything','No; the item must be cleaned first. IUSS is sterilization, not cleaning. A soiled item cannot be sterilized effectively','IUSS is only for implants','Clean it with alcohol then IUSS'],ans:1},
    {s:'You are loading the sterilizer and notice packages are touching the chamber walls. What is the problem?',opts:['No problem, walls are hot too','Packages must not touch chamber walls; steam circulation is blocked and sterilization may not be effective','Only matters for gravity cycles','Only a problem if tightly packed'],ans:1},
    {s:'A new tech loads peel pouches in the sterilizer with paper side facing plastic side of the adjacent pouch. What correction is needed?',opts:['None, any orientation works','Pouches should be loaded paper-to-paper or plastic-to-plastic to allow steam penetration through the paper side','Only matters in H2O2','Pouches should not be sterilized in steam'],ans:1},
    {s:'The sterilizer alarm goes off mid-cycle indicating a fault. What do you do?',opts:['Reset and continue','Do not open until safe. Record the fault code. The load is not sterile. Follow manufacturer troubleshooting and report','Open the door to check','Ignore if the alarm stops'],ans:1},
    {s:'An implant tray has been sterilized. The BI for the load is still incubating. Can you release the implant tray?',opts:['Yes, CIs passed','No; implant loads must be quarantined until BI results are negative, unless emergency release protocol applies','Implants do not need BI testing','Release after 30 minutes of incubation'],ans:1},
    {s:'After unloading, you notice a tray is still hot and wet. Can you place it in storage?',opts:['Yes, it will cool in storage','No; wet items compromise sterility (wet pack). Allow proper cooling time and verify items are dry before storage','Fan it to speed drying','Place in plastic bag to contain moisture'],ans:1},
    {s:'The digital printout for a gravity cycle shows 250F for 30 minutes. All indicators passed. Is this load acceptable?',opts:['Yes, parameters were met for a gravity cycle','Review all parameters holistically: temp, time, pressure, and check for any alarms. If all confirm, the load meets requirements','Only if it was unwrapped items','Gravity cycles are never acceptable'],ans:1}
  ],
  observations:[
    {id:'o6-1',text:'Can state the difference between gravity and prevacuum sterilization cycles'},
    {id:'o6-2',text:'Loads sterilizer with proper spacing (1+ inch between packages, not touching walls)'},
    {id:'o6-3',text:'Reviews cycle printout after completion and verifies all parameters'},
    {id:'o6-4',text:'Can explain when and why the Bowie-Dick test is performed'},
    {id:'o6-5',text:'Can describe the proper response to a positive biological indicator'},
    {id:'o6-6',text:'Documents sterilization load with all required fields (sterilizer ID, cycle type, load number, operator)'}
  ]},
 {id:'fm-07',num:7,title:'Storage & Distribution',subtitle:'Protecting Sterility Until Use',domain:'Storage',
  desc:'Storage requirements, shelving specs, event-related sterility, FIFO, par levels, case carts, transport, and recall response.',
  sections:['7.1 Storage Requirements','7.2 Event-Related Sterility','7.3 Pre-Storage Inspection','7.4 Inventory Management','7.5 Distribution','7.6 Case Carts','7.7 Recalls'],
  sectionContent:[
    '68-73F, below 70% RH. Shelving: 8-10 inches from floor, 18 inches from ceiling, 2 inches from walls. Open wire preferred. No cardboard, personal items, trash.',
    'Properly packaged items remain sterile until event compromises packaging. Events: tears, holes, moisture, broken seals, contamination, improper storage.',
    'Post-sterilization checklist: external indicator changed, package dry, no damage, seals intact, labels legible. Failed items: segregate, identify, correct, document.',
    'FIFO: oldest used first. Par levels: minimum and maximum quantities. Like with like. Consistent locations. Clear labeling. Frequent items accessible.',
    'Protect from damage, moisture, contamination. Minimize handling. Dedicated carts. Covered during transport. Clean corridors. Never mix sterile with contaminated.',
    'Receive schedule, verify surgeon/procedure/date, review pick list, verify each item, inspect packages, organize cart (heavy bottom), double-check, document.',
    'Stop use immediately. Identify affected items by lot/dates. Quarantine. Follow facility protocol. Document.'
  ],
  questions:[
    {q:'Bottom shelf distance from floor?',opts:['2-4 inches','8-10 inches','18 inches','24 inches'],ans:1},
    {q:'Distance from outside walls?',opts:['No minimum','At least 2 inches','At least 6 inches','12 inches'],ans:1},
    {q:'Event-related sterility means?',opts:['Fixed calendar expiration','Sterile until event compromises package','Depends on season','Must re-sterilize after every event'],ans:1},
    {q:'FIFO stands for?',opts:['Final Inspection For Output','First In, First Out','Facility Instrument Flow Order','Filtered Items For OR'],ans:1},
    {q:'Package found with moisture in storage?',opts:['Dry with towel','Use if indicator passed','Remove from service, compromised','Re-sterilize without repackaging'],ans:2},
    {q:'First step when recall identified?',opts:['Complete paperwork','Stop use immediately, identify affected items','Wait for supervisor','Continue until replacement arrives'],ans:1},
    {q:'Case cart verification checks:',opts:['Item name and quantity only','Correct item, quantity, intact package, valid date','Expiration only','That package looks clean'],ans:0},
    {q:'Why no cardboard in sterile storage?',opts:['Takes too much space','Harbors dust, pests, moisture','Too heavy','No restriction'],ans:1},
    {q:'Case cart organization?',opts:['Alphabetical','Heavy top','Heavy bottom, lighter top, packages protected','All peel packs bottom'],ans:2},
    {q:'A par level is?',opts:['Minimum quality score','Minimum and maximum quantity to maintain','Staff per shift','Sterilization parameter'],ans:1}
  ],
  simulations:[
    {s:'You find a wrapped tray on a bottom shelf with the bottom of the wrap touching the floor. What do you do?',opts:['It is fine since it is wrapped','Remove from service; shelf items must be 8-10 inches from the floor. This package may be compromised','Move it up one shelf','Only a problem if the floor is wet'],ans:1},
    {s:'A nurse returns an unopened sterile tray to SPD saying she "did not end up needing it." The package appears intact. Can you put it back in storage?',opts:['Yes, it is still sealed','Inspect it carefully for any compromise. If packaging is intact with no events, it can be returned per facility policy','Always reprocess returned items','Ask the nurse to keep it'],ans:1},
    {s:'You are building a case cart and discover the surgeon preference card lists an item your facility does not stock. What do you do?',opts:['Leave it off the cart and hope nobody notices','Document the shortage, note the substitution if available, and notify the OR coordinator before the cart leaves SPD','Cancel the case','Borrow from another facility without documenting'],ans:1},
    {s:'During case cart pick, you find the last remaining tray of a specific set has a torn external wrap. What is your action?',opts:['Use it since it is the last one','Do not include a compromised package. Notify lead about the shortage. The tray must be reprocessed','Tape the tear','Include it with a note to OR'],ans:1},
    {s:'You notice new stock was placed in front of older stock on a storage shelf. What principle does this violate?',opts:['Nothing, stock is stock','FIFO (First In, First Out); older items must be in front so they are used first','Only matters for medications','Only matters for perishables'],ans:1},
    {s:'A manufacturer recall notice arrives for a specific lot number of peel pouches. Some have already been used to package instruments. What do you do?',opts:['Wait until the pouches run out','Immediately stop use, identify all instruments packaged with the recalled lot, quarantine affected items, and follow facility recall protocol','Only worry about unopened pouches','File the notice for next month'],ans:1},
    {s:'Sterile storage humidity reads 75% RH, above the 70% maximum. What is your action?',opts:['It is only 5% over, ignore','Report the environmental excursion. Elevated humidity can compromise packaging integrity. Follow corrective action protocol','Open a window','Move items to another room'],ans:1},
    {s:'A case cart is ready but the pick list shows a biological indicator result is still pending for one of the trays. What do you do?',opts:['Send the cart, results are usually fine','Hold the tray until the BI result is confirmed negative. Document the hold. Include the tray only after confirmation','Send it with a note to check later','Ask OR if they want to wait'],ans:1},
    {s:'You drop a sterile peel-packed instrument during transport. The package appears intact when you pick it up. What do you do?',opts:['If it looks intact, put it on the cart','Carefully inspect all surfaces of the package. A dropped item is an event. If any compromise is found, remove from service. Document the drop either way','Wipe it off','Only a concern if it landed on a dirty floor'],ans:1},
    {s:'A sprinkler head in sterile storage is leaking slightly, and droplets have landed on several stored packages. What do you do?',opts:['Move the packages and wipe them dry','Remove all affected packages from service. Water exposure is an event that compromises sterility. Report the leak for facility maintenance. Document all affected items','Only remove packages that are visibly wet','Wait until maintenance fixes it'],ans:1}
  ],
  observations:[
    {id:'o7-1',text:'Can identify correct shelving distances (8-10 inches floor, 18 inches ceiling, 2 inches walls)'},
    {id:'o7-2',text:'Applies FIFO when stocking: places new items behind existing stock'},
    {id:'o7-3',text:'Inspects packages for integrity before placing in storage'},
    {id:'o7-4',text:'Builds a case cart verifying each item against the pick list'},
    {id:'o7-5',text:'Can describe proper response to a product recall'},
    {id:'o7-6',text:'Transports sterile items using covered cart on clean corridors'}
  ]},
 {id:'fm-08',num:8,title:'High-Level Disinfection',subtitle:'Processing Heat-Sensitive Devices',domain:'HLD',
  desc:'HLD vs. sterilization, endoscope anatomy, manual cleaning, leak testing, HLD agents, AER operation, drying, storage, documentation.',
  sections:['8.1 Understanding HLD','8.2 Endoscope Anatomy','8.3 Manual Cleaning','8.4 HLD Agents','8.5 AERs','8.6 Drying & Storage','8.7 Documentation'],
  sectionContent:[
    'HLD destroys all microorganisms except high numbers of spores. Used for semi-critical items. Cleaning is the most important step. Correct cleaning removes up to 99.9% of bioburden.',
    'Flexible endoscopes: insertion tube, bending section, control body, light guide, multiple channels (suction, air/water, auxiliary, instrument). Channel architecture makes reprocessing complex.',
    'Pre-clean at bedside immediately. Leak test BEFORE immersion: bubbles mean leak, do not proceed. Brush all channels completely through. Multiple passes until clean.',
    'OPA (12-min soak, low odor). Glutaraldehyde (longer contact, strong odor). Peracetic acid (rapid, automated). Test MEC before each use.',
    'AERs automate HLD. Pre-cycle: verify disinfectant level/concentration. Connect ALL channels per IFU. Post-cycle: review printout, proceed to drying immediately.',
    'Purge channels with air. Alcohol flush if per protocol. Final air purge. Store vertically, valves removed, caps off, ventilated cabinet. Facility sets max hang time.',
    'Document: scope ID, patient ID, technician, cleaning steps, leak test result, disinfectant lot/expiration, AER cycle data, drying steps, storage location.'
  ],
  questions:[
    {q:'HLD destroys:',opts:['Only bacteria','All microorganisms including all spores','All microorganisms except high numbers of spores','Only viruses and fungi'],ans:2},
    {q:'Most important step in endoscope reprocessing?',opts:['HLD','Sterilization','Manual cleaning','Automated processing'],ans:2},
    {q:'When must leak test be performed?',opts:['After HLD','Before immersing scope in any liquid','Monthly','Only when damage suspected'],ans:1},
    {q:'Bubbles during leak test mean:',opts:['Normal operation','Scope has a leak, do not proceed, remove from service','Add more pressure','Dry and retest'],ans:1},
    {q:'MEC stands for?',opts:['Maximum Effective Cycle','Minimum Effective Concentration','Medical Equipment Compliance','Monitored Endoscope Cleaning'],ans:1},
    {q:'How should endoscopes be stored?',opts:['Coiled in drawer','Vertically in ventilated cabinet, valves removed','In sealed plastic bag','Horizontally on shelf'],ans:1},
    {q:'Why remove valves during storage?',opts:['Prevent theft','Allow air circulation and prevent moisture','Make scope lighter','Valves are single-use'],ans:1},
    {q:'AER cycle failure response:',opts:['Use if looks clean','Scope may not be disinfected; do not use, reprocess from manual cleaning','Run AER again without cleaning','Notify manufacturer only'],ans:1},
    {q:'When test HLD solution concentration?',opts:['Weekly','Monthly','Per manufacturer, typically daily or before each use','Annually'],ans:2},
    {q:'Why moisture in channels creates risk?',opts:['Electrical shorts','Residual water supports bacterial growth and biofilm','Degrades disinfectant','Makes scope heavy'],ans:1}
  ],
  simulations:[
    {s:'You perform a leak test on an endoscope and observe a single small bubble coming from the bending section. What do you do?',opts:['One bubble is acceptable','A bubble indicates a leak. Do not proceed with immersion. Remove the scope from service and report','Run the test again without looking closely','Submerge it to see if more bubbles appear'],ans:1},
    {s:'An AER cycle completes but the printout shows a fault code indicating incomplete disinfectant contact. What is your action?',opts:['The scope looks clean, release it','Do not use the scope. It may not be adequately disinfected. Return to manual cleaning and restart the entire process','Just run the AER again','Use for the next patient and reprocess after'],ans:1},
    {s:'You test the HLD solution concentration and it is below MEC. There are three scopes waiting for processing. What do you do?',opts:['Use it anyway, it is close enough','Do not use sub-MEC solution. Replace the solution, verify new solution meets MEC, then proceed','Dilute it with water to increase volume','Add more concentrate without testing'],ans:1},
    {s:'A scope has been hanging in the cabinet for 8 days. Your facility policy sets a 7-day hang time limit. What must happen?',opts:['Use it, one extra day is fine','The scope has exceeded hang time and must be reprocessed before use','Only reprocess if it looks dirty','Extend the policy to 10 days'],ans:1},
    {s:'After HLD processing, you notice a scope channel still has visible debris when you flush it. What does this indicate?',opts:['HLD will have handled it','Pre-cleaning was inadequate. The scope is not safe for use. It must be manually cleaned again and reprocessed through the full cycle','Flush it one more time and release','Only a problem for the suction channel'],ans:1},
    {s:'A physician asks you to skip the drying step because they need the scope urgently for the next patient. What do you do?',opts:['Skip drying to help the physician','Drying is a required step because moisture supports bacterial growth. The scope must be properly dried before use regardless of urgency','Partially dry it as a compromise','Let them use it wet'],ans:1},
    {s:'You connect a scope to the AER but are unsure if all channels are properly connected. What should you do?',opts:['Start the cycle and hope it works','Verify every channel connection per the scope and AER IFU before starting. Unconnected channels will not be disinfected','Only the main channel matters','Ask someone else to check later'],ans:1},
    {s:'Two different scope models need reprocessing. Can you use the same brushes for both?',opts:['Yes, brushes are universal','No; use the brush size and type specified in each scope IFU. Wrong brush size means inadequate cleaning','Only if they are the same brand','Clean the brush between scopes'],ans:1},
    {s:'The HLD solution was opened 20 days ago. The manufacturer says maximum reuse life is 14 days. MEC test still shows adequate concentration. Can you use it?',opts:['Yes, MEC passed','No; the solution has exceeded its maximum reuse life regardless of MEC result. Discard and replace','Use for one more day','Only discard if MEC fails'],ans:1},
    {s:'After reprocessing, you store a scope in the cabinet but forget to remove the valves. A coworker points this out. What is the risk?',opts:['No risk','Valves left on prevent air circulation through channels, allowing moisture to remain and bacteria to grow','Only matters for storage over 24 hours','Valves protect the channels'],ans:1}
  ],
  observations:[
    {id:'o8-1',text:'Performs leak test on an endoscope before immersion'},
    {id:'o8-2',text:'Brushes all channels completely through (brush exits distal end)'},
    {id:'o8-3',text:'Tests HLD solution MEC before use and documents result'},
    {id:'o8-4',text:'Connects all scope channels to AER per IFU before starting cycle'},
    {id:'o8-5',text:'Completes drying protocol: air purge through all channels, exterior wipe'},
    {id:'o8-6',text:'Stores scope vertically with valves removed in ventilated cabinet'}
  ]},
 {id:'fm-09',num:9,title:'Quality Assurance',subtitle:'Building a Culture of Excellence',domain:'Quality',
  desc:'Quality indicators, error reporting, root cause analysis, 5 Whys, PDCA cycle, standards, and quality culture.',
  sections:['9.1 Quality in SPD','9.2 Indicators & Metrics','9.3 Error Reporting','9.4 Root Cause Analysis','9.5 PDCA','9.6 Standards','9.7 Quality Culture'],
  sectionContent:[
    'Quality: consistently delivering instruments safe for patient use. QA ensures baseline. QI improves continuously beyond baseline.',
    'Indicators: BI pass rate, wet pack rate, set error rate, case cart accuracy, instrument repair turnaround, IUSS rate. Data cycle: Collect, Analyze, Act, Monitor.',
    'Event types: near-miss (caught before patient), adverse event (reached patient), sentinel event (death/serious harm). Report all. Every error teaches. Multiple reports reveal systemic issues.',
    'RCA identifies underlying causes. 5 Whys: keep asking why until root cause found. Contributing factors: human, equipment, process, environmental, communication, organizational.',
    'PDCA: Plan (identify problem), Do (implement change small-scale), Check (measure results), Act (adopt, modify, or abandon).',
    'Key organizations: AAMI, AORN, TJC, FDA, CMS, CDC, OSHA. Surveyors check: policies, documentation, competency, equipment maintenance, water quality, BI/Bowie-Dick, storage, IFU compliance.',
    'Quality culture: patient-centered, open communication, learning not blame, continuous improvement, accountability, teamwork. Daily: do your job right, speak up, support team, keep learning.'
  ],
  questions:[
    {q:'Difference between QA and QI?',opts:['Same thing','QA ensures baseline; QI improves beyond baseline','QA for managers; QI for techs','QA mandatory; QI optional'],ans:1},
    {q:'A near-miss is?',opts:['Error caught before reaching patient','Event that harmed patient','Failed BI','Scheduling conflict'],ans:0},
    {q:'Why report near-misses?',opts:['Assign blame','They reveal systemic issues and help prevent actual harm','OSHA only','They do not need reporting'],ans:1},
    {q:'Purpose of the 5 Whys?',opts:['Ask five people','Identify root cause by asking why repeatedly','Five quality checks per tray','Review five days of records'],ans:1},
    {q:'PDCA stands for?',opts:['Process, Document, Certify, Audit','Plan, Do, Check, Act','Prepare, Deliver, Count, Approve','Prevent, Detect, Correct, Advance'],ans:1},
    {q:'IUSS rate tracks?',opts:['BI pass rate','Wet pack rate','Unnecessary immediate-use sterilization cycles','Set error rate'],ans:2},
    {q:'Wet pack discovered after release is what type of event?',opts:['Near-miss','Adverse event','Sentinel event','Minor inconvenience'],ans:1},
    {q:'TJC surveyors check in SPD:',opts:['Only sterilizer records','Only certification status','Policies, documentation, competency, equipment, storage, IFU compliance, and more','Only infection logs'],ans:2},
    {q:'In quality culture, errors lead to:',opts:['Termination','Learning and process improvement, not blame','Cover-up','Private management action'],ans:1},
    {q:'Benchmarking is?',opts:['Setting a timer','Comparing performance to standards or peers','Counting instruments on bench','Marking instruments for ID'],ans:1}
  ],
  simulations:[
    {s:'You catch a tray with a missing instrument before it leaves SPD. The tray is corrected and released complete. Should you still report this?',opts:['No, it was fixed','Yes; this is a near-miss and should be reported. It reveals a process gap that could lead to an error reaching the OR next time','Only if it involved an implant','Only report actual errors'],ans:1},
    {s:'Your department has experienced 4 wet packs in the past week. Using the 5 Whys, your first question is:',opts:['Who made the wet packs?','Why are wet packs occurring?','When do wet packs happen?','How many more wet packs are acceptable?'],ans:1},
    {s:'A coworker makes an error but asks you not to report it because "nothing bad happened." What do you do?',opts:['Agree to keep it quiet','Report it through proper channels. Error reporting protects patients and enables learning. Concealing errors is a greater risk','Only report if a patient was harmed','Let the coworker report it themselves or not'],ans:1},
    {s:'During a TJC survey, an inspector asks to see your BI testing documentation for the past 3 months. You discover some dates are missing. What does this reveal?',opts:['Minor paperwork issue','A documentation gap that may indicate testing was not performed or not recorded, both of which are compliance failures','Surveyors do not check BI records','Only an issue if results were positive'],ans:1},
    {s:'Your department IUSS rate is 15%. The benchmark target is under 5%. Using PDCA, what is your first step?',opts:['Immediately ban all IUSS','Plan: investigate why IUSS is happening. Review OR schedules, instrument availability, and turnaround times to identify root causes before implementing changes','Buy more instruments','Do: tell staff to stop using IUSS'],ans:1},
    {s:'A surgeon complains that "SPD is always slow." Rather than getting defensive, what quality approach should you take?',opts:['Ignore the complaint','Treat it as customer feedback. Collect data on turnaround times. Identify if there is a legitimate process issue. Respond with facts and an improvement plan','Tell the surgeon they are wrong','Blame staffing'],ans:1},
    {s:'You are asked to participate in a root cause analysis meeting about a wrong-instrument event. What is your role?',opts:['Defend your shift','Provide honest, factual information about what happened without blame. Focus on identifying process and system factors that contributed','Point out who made the error','Avoid participating'],ans:1},
    {s:'The department achieves a 99.8% BI pass rate for the quarter. Is there room for improvement?',opts:['No, that is perfect','Yes; investigate the 0.2% failure rate to understand root causes and prevent recurrence. Continuous improvement means always looking for better','Only improve if below 95%','Celebrate and stop tracking'],ans:1},
    {s:'A new policy requires double-checking case cart contents before release. Some staff resist because "it slows us down." How do you support the change?',opts:['Agree that it is unnecessary','Explain that verification catches errors before they reach patients. Speed without accuracy is not quality. Support the policy consistently','Only follow it when supervisors watch','Suggest eliminating it at the next meeting'],ans:1},
    {s:'You notice the same type of instrument keeps failing inspection across multiple trays. What quality action should you take?',opts:['Keep removing them one at a time','Report the pattern. Recurring failures suggest a systemic issue: vendor quality, cleaning process, or handling problem. Pattern identification prevents future failures','It is just coincidence','Only report after 10 failures'],ans:1}
  ],
  observations:[
    {id:'o9-1',text:'Can explain the difference between a near-miss and an adverse event'},
    {id:'o9-2',text:'Can describe the 5 Whys technique and apply it to a hypothetical scenario'},
    {id:'o9-3',text:'Can state the four steps of PDCA from memory'},
    {id:'o9-4',text:'Reports an error or near-miss through proper channels when observed'},
    {id:'o9-5',text:'Can identify at least three quality indicators tracked in SPD'},
    {id:'o9-6',text:'Demonstrates non-blame approach when discussing errors or process failures'}
  ]},
 {id:'fm-10',num:10,title:'Professional Development',subtitle:'Building Your Career',domain:'Professional',
  desc:'SPD as a profession, certification (CRCST, CSPDT, CIS), exam preparation, continuing education, career paths, and professional organizations.',
  sections:['10.1 SPD as a Profession','10.2 Certifications','10.3 Exam Preparation','10.4 Continuing Education','10.5 Career Paths','10.6 Organizations','10.7 Growth Plan'],
  sectionContent:[
    'SPD evolved from a support function to a recognized healthcare profession. Professional characteristics: knowledge, competence, accountability, ethics, continuous learning, certification.',
    'HSPA: CRCST (entry, 400+ hours). CBSPD: CSPDT (equivalent). Advanced: CIS/CSIS (instrument specialist), CER (endoscope), CHL (leader). Many states mandate certification.',
    'Start early. Official study materials. Practice tests. Study groups. Connect study to daily practice. Exam day: sleep well, arrive early, read carefully, manage time.',
    'CE: credits during each renewal cycle (typically 12 annually). Sources: conferences, online courses, webinars, journals, in-service, vendor education.',
    'Ladder: Technician, Senior/Lead, Educator/Preceptor, Supervisor, Manager, Director. Specialties: instrument specialist, endoscope, QA, education, vendor/industry, consulting.',
    'HSPA (myhspa.org), CBSPD (cbspd.net), AAMI (aami.org). Publications: Communique. Networking: local chapters, conferences, professional groups.',
    'SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound. Write down, share with supervisor, identify resources, take first step today.'
  ],
  questions:[
    {q:'CRCST stands for?',opts:['Certified Registered Central Service Technician','Central Room Cleaning and Sterilization Technician','Certified Reprocessing and Central Supply Technician','Credentialed Registered Cleaning Specialist'],ans:0},
    {q:'Which organization offers CRCST?',opts:['CBSPD','AAMI','HSPA (formerly IAHCSMM)','TJC'],ans:2},
    {q:'Typical CRCST experience requirement?',opts:['100 hours','200 hours','400 hours','1000 hours'],ans:2},
    {q:'CIS certification is?',opts:['Certified Infection Specialist','Certified Instrument Specialist','Central Inventory Supervisor','Clinical Instrument Sterilizer'],ans:1},
    {q:'Why pursue certification?',opts:['Required in all states','Validates knowledge, improves employability, often leads to higher pay','Replaces CE need','Guarantees management'],ans:1},
    {q:'Typical annual CE credits required?',opts:['6','12','24','None'],ans:1},
    {q:'Career level after Senior/Lead Tech?',opts:['Director','Educator/Preceptor or Supervisor','CEO','Consultant'],ans:1},
    {q:'SMART stands for?',opts:['Simple, Meaningful, Accurate, Relevant, Tested','Specific, Measurable, Achievable, Relevant, Time-bound','Surgical, Medical, Administrative, Regulatory, Technical','Standard, Managed, Assigned, Recorded, Tracked'],ans:1},
    {q:'HSPA official publication?',opts:['Lancet','JAMA','Communique','NEJM'],ans:2},
    {q:'First step in your development plan?',opts:['Wait for supervisor','Write down goals and share with supervisor','Apply for most advanced cert','Transfer departments'],ans:1}
  ],
  simulations:[
    {s:'A coworker says certification "does not matter because I have been doing this for 20 years." How do you view this?',opts:['They are right, experience is everything','Experience is valuable but certification validates current knowledge against a national standard. The field evolves and certification ensures you stay current','Certification is only for new people','Agree and do not pursue certification'],ans:1},
    {s:'You passed your CRCST six months ago. Renewal requires 12 CE credits in the next year. You have earned zero so far. What is your plan?',opts:['Wait until the last month','Create a plan to earn credits consistently: attend webinars, complete online modules, participate in in-services throughout the year','CE is optional if you passed the exam','Ask someone else to earn credits for you'],ans:1},
    {s:'Your state just passed a law requiring SPD certification within 18 months of hire. A coworker who has been there 10 years says this does not apply to them. Are they correct?',opts:['Yes, experienced staff are exempt','Check the specific law. Many mandatory certification laws apply to all staff regardless of tenure, with defined grace periods','Only new hires need certification','Experience replaces certification in every state'],ans:1},
    {s:'You are interested in becoming an Educator/Preceptor. What is the logical next step in your career development?',opts:['Apply for the Director position','Discuss your interest with your supervisor, identify what qualifications and experience you need, and create a development plan','Wait to be promoted','Educating is not a real career path'],ans:1},
    {s:'A vendor offers a free in-service on a new sterilization technology. Can this count toward CE credits?',opts:['No, only paid courses count','Potentially yes; vendor education can qualify for CE credits. Verify with your certifying body and keep documentation','Vendor education is never valid','Only if it is longer than 4 hours'],ans:1},
    {s:'You are 3 weeks from your CRCST exam. Which study strategy is most effective at this point?',opts:['Read the entire textbook cover to cover','Focus on practice tests to identify weak areas, review those areas specifically, and connect study to daily work','Stop studying, you either know it or you do not','Only study the night before'],ans:1},
    {s:'Your department has an opening for a Lead Tech position. You are a certified tech with strong performance. What strengthens your candidacy?',opts:['Seniority alone','Certification, demonstrated competency, additional training (like CIS), leadership initiative, and a track record of quality work','Asking the most times','Being the only applicant'],ans:1},
    {s:'You are offered overtime on a day you planned to attend a professional conference. What do you consider?',opts:['Always take the overtime','Weigh both: overtime meets immediate needs but professional development builds long-term career value. Make an informed decision based on your goals','Conferences are a waste of time','Your supervisor should decide for you'],ans:1},
    {s:'A new AAMI standard is published that changes a procedure your facility has been doing for years. What is the correct response?',opts:['Ignore it, the old way works','Review the new standard, discuss with leadership, and update facility procedures to align with current evidence-based practice','Standards change too often to follow','Only change if TJC makes you'],ans:1},
    {s:'You set a SMART goal: "Get better at my job." Is this a good goal?',opts:['Yes, it covers everything','No; it is not specific, measurable, or time-bound. A SMART goal would be: "Pass the CIS exam within 12 months by studying 30 minutes daily and completing 2 practice tests monthly"','Goals do not need to be specific','Only managers need SMART goals'],ans:1}
  ],
  observations:[
    {id:'o10-1',text:'Can name the two primary certification organizations (HSPA and CBSPD) and their entry-level certifications'},
    {id:'o10-2',text:'Can describe their own professional development goals and next steps'},
    {id:'o10-3',text:'Can identify at least two sources of continuing education'},
    {id:'o10-4',text:'Demonstrates professional behavior: follows procedures, documents accurately, reports concerns'},
    {id:'o10-5',text:'Can explain why certification matters even for experienced technicians'}
  ]}
];
 
// ── Live persistence (#22/#26): mirror each in-memory write to Supabase ──
// Optimistic: the UI updates from the in-memory DB immediately; the row syncs
// in the background. Replaces the old demo saveDemoData() path.
function _fndProgToBackend(p){return {staff_id:p.staffId,module_id:p.moduleId,g1:p.g1,g2:p.g2,g3:p.g3,complete:p.complete,updated_at:new Date().toISOString()};}
function _fndSaveProgress(p){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.upsertFoundationsProgress){SB.upsertFoundationsProgress(_fndProgToBackend(p)).catch(e=>console.warn('[fnd] progress sync',e&&e.message));}}catch(e){console.warn('[fnd] progress sync',e);}}
function _fndSaveAssignment(a){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.createFoundationsAssignment){SB.createFoundationsAssignment({staff_id:a.staffId,module_id:a.moduleId,assigned_by:a.assignedBy||null,type:a.type,trigger:a.trigger,assigned_date:a.assignedDate,status:a.status}).catch(e=>console.warn('[fnd] assignment sync',e&&e.message));}}catch(e){console.warn('[fnd] assignment sync',e);}}
function _fndSaveAssignmentStatus(staffId,moduleId,status){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.updateFoundationsAssignmentStatus){SB.updateFoundationsAssignmentStatus(staffId,moduleId,status).catch(e=>console.warn('[fnd] status sync',e&&e.message));}}catch(e){}}

// ── Foundations 3-Gate Data Helpers ──
function getFoundationsAssignments(staffId){return (DB.foundationsAssignments||[]).filter(a=>a.staffId===staffId);}
function isModuleAssigned(staffId,moduleId){return (DB.foundationsAssignments||[]).some(a=>a.staffId===staffId&&a.moduleId===moduleId);}
function getModuleGates(staffId,moduleId){
 const p=(DB.foundationsProgress||[]).find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 return p||{g1:{status:'locked',score:0,attempts:[]},g2:{status:'locked',score:0,attempts:[]},g3:{status:'locked',items:[]},complete:false};
}
function isModuleComplete(staffId,moduleId){const p=getModuleGates(staffId,moduleId);return p.complete===true;}
function assignModule(staffId,moduleId,assignedBy,type,trigger){
 if(!DB.foundationsAssignments) DB.foundationsAssignments=[];
 if(DB.foundationsAssignments.find(a=>a.staffId===staffId&&a.moduleId===moduleId)) return;
 const _a={id:'fa-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),staffId,moduleId,assignedBy,type:type||'remediation',trigger:trigger||null,assignedDate:new Date().toISOString().slice(0,10),status:'assigned'};
 DB.foundationsAssignments.push(_a);
 // Init progress with 3 gates
 if(!DB.foundationsProgress) DB.foundationsProgress=[];
 let _p=DB.foundationsProgress.find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 if(!_p){ _p={staffId,moduleId,g1:{status:'open',score:0,attempts:[]},g2:{status:'open',score:0,attempts:[]},g3:{status:'open',items:[]},complete:false}; DB.foundationsProgress.push(_p); }
 _fndSaveAssignment(_a); _fndSaveProgress(_p);
}
function assignAllModules(staffId,assignedBy){FOUNDATIONS_MODULES.forEach(m=>assignModule(staffId,m.id,assignedBy,'onboarding',null));}
function saveGateScore(staffId,moduleId,gate,score){
 if(!DB.foundationsProgress) DB.foundationsProgress=[];
 let p=DB.foundationsProgress.find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 if(!p){p={staffId,moduleId,g1:{status:'open',score:0,attempts:[]},g2:{status:'open',score:0,attempts:[]},g3:{status:'open',items:[]},complete:false};DB.foundationsProgress.push(p);}
 const g=p[gate];
 g.attempts.push({date:new Date().toISOString().slice(0,10),score});
 g.score=score;
 g.status=score>=80?'pass':'attempted';
 // Check if all 3 gates pass
 if(p.g1.status==='pass'&&p.g2.status==='pass'&&p.g3.status==='pass'){
   p.complete=true;
   const a=(DB.foundationsAssignments||[]).find(x=>x.staffId===staffId&&x.moduleId===moduleId);
   if(a) a.status='completed';
 }
 _fndSaveProgress(p);
 if(p.complete) _fndSaveAssignmentStatus(staffId,moduleId,'completed');
 return p;
}
function markG3Item(staffId,moduleId,itemId,confirmed,confirmedBy){
 if(!DB.foundationsProgress) DB.foundationsProgress=[];
 let p=DB.foundationsProgress.find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 if(!p) return;
 const existing=p.g3.items.find(i=>i.id===itemId);
 if(existing){existing.confirmed=confirmed;existing.confirmedBy=confirmedBy;existing.date=new Date().toISOString().slice(0,10);}
 else{p.g3.items.push({id:itemId,confirmed,confirmedBy,date:new Date().toISOString().slice(0,10)});}
 // Check if all G3 items confirmed
 const m=FOUNDATIONS_MODULES.find(x=>x.id===moduleId);
 if(m){const allDone=m.observations.every(o=>p.g3.items.some(i=>i.id===o.id&&i.confirmed));if(allDone){p.g3.status='pass';p.g3.score=100;}}
 if(p.g1.status==='pass'&&p.g2.status==='pass'&&p.g3.status==='pass'){p.complete=true;const a=(DB.foundationsAssignments||[]).find(x=>x.staffId===staffId&&x.moduleId===moduleId);if(a)a.status='completed';}
 _fndSaveProgress(p);
 if(p.complete) _fndSaveAssignmentStatus(staffId,moduleId,'completed');
}
 
// ── Gate Status Badge HTML ──
function fndGateBadge(status){
 if(status==='pass') return '<div class="fnd-gate-dot fnd-gate-pass"><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(74,222,128,.15)" stroke="#4ade80" stroke-width="1.3"/><path d="M5 8.5l2 2L11.5 6" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
 if(status==='attempted') return '<div class="fnd-gate-dot fnd-gate-att"><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(251,191,36,.1)" stroke="#fbbf24" stroke-width="1.3"/><path d="M8 5v4M8 11v.5" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round"/></svg></div>';
 if(status==='open') return '<div class="fnd-gate-dot"><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="7" stroke="#475569" stroke-width="1.3"/></svg></div>';
 return '<div class="fnd-gate-dot"><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="7" stroke="#334155" stroke-width="1.3" stroke-dasharray="3 3"/></svg></div>';
}
 
// ── Staff Portal: Render Foundations ──
function renderSFoundations(){
 const el=document.getElementById('s-foundations');if(!el)return;
 const s=getStaff(ST.staffId);if(!s){el.innerHTML='<div class="empty-state"><div class="empty-ttl">No Staff Record</div></div>';return;}
 const assignments=getFoundationsAssignments(s.id);
 const totalAssigned=assignments.length;
 const totalComplete=assignments.filter(a=>a.status==='completed').length;
 
 let html='<div class="card mb16"><div class="card-hd"><div class="card-ttl">SBD Foundations</div>';
 if(totalAssigned>0) html+='<span class="pill p-gold">'+totalComplete+'/'+totalAssigned+' completed</span>';
 html+='</div><div class="card-body">';
 html+='<p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 12px">The knowledge foundation for sterile processing. Each module requires three gates: Knowledge, Simulation, and Observed Demonstration. Modules are activated by your educator or manager.</p>';
 if(totalAssigned>0&&totalComplete===totalAssigned){
   html+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:12px 16px;display:flex;align-items:center;gap:10px">';
   html+='<svg viewBox="0 0 20 20" width="20" height="20" fill="none"><circle cx="10" cy="10" r="9" stroke="#4ade80" stroke-width="1.5"/><path d="M6 10.5l2.5 2.5L14 7.5" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
   html+='<span style="font-size:13px;color:#4ade80;font-weight:600">All assigned modules completed</span></div>';
 }
 html+='</div></div>';
 
 FOUNDATIONS_MODULES.forEach(m=>{
   const assigned=isModuleAssigned(s.id,m.id);
   const gates=getModuleGates(s.id,m.id);
   const complete=gates.complete;
 
   html+='<div class="card mb16 fnd-card'+(assigned?' fnd-unlocked':' fnd-locked')+'">';
   html+='<div class="card-hd" style="flex-wrap:wrap;gap:8px"><div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1">';
   html+='<div class="fnd-num'+(complete?' fnd-num-done':'')+'">'+m.num+'</div>';
   html+='<div style="min-width:0"><div class="card-ttl" style="font-size:14px;margin:0">'+m.title+'</div>';
   html+='<div style="font-size:11px;color:#64748b;margin-top:2px">'+m.subtitle+'</div></div></div>';
 
   if(assigned){
     html+='<div style="display:flex;gap:4px;align-items:center" title="Gate 1: Knowledge | Gate 2: Simulation | Gate 3: Observation">';
     html+=fndGateBadge(gates.g1.status)+fndGateBadge(gates.g2.status)+fndGateBadge(gates.g3.status);
     html+='</div>';
   } else {
     html+='<span class="pill p-muted" style="opacity:.5"><svg viewBox="0 0 14 14" width="11" height="11" fill="none" style="margin-right:3px;vertical-align:-1px"><rect x="1" y="5" width="12" height="8" rx="2" stroke="#64748b" stroke-width="1.3"/><path d="M4 5V4a3 3 0 016 0v1" stroke="#64748b" stroke-width="1.3" stroke-linecap="round"/></svg>Locked</span>';
   }
   html+='</div>';
   html+='<div class="card-body" style="padding-top:0">';
   html+='<p style="font-size:12.5px;color:#94a3b8;line-height:1.5;margin:0 0 8px">'+m.desc+'</p>';
 
   if(assigned){
     // Gate status bar
     html+='<div style="display:flex;gap:12px;flex-wrap:wrap;margin:10px 0">';
     html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g1.status)+'<span>Knowledge'+(gates.g1.score>0?' ('+gates.g1.score+'%)':'')+'</span></div>';
     html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g2.status)+'<span>Simulation'+(gates.g2.score>0?' ('+gates.g2.score+'%)':'')+'</span></div>';
     html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g3.status)+'<span>Observation'+(gates.g3.status==='pass'?' (Confirmed)':'')+'</span></div>';
     html+='</div>';
     html+='<button class="btn btn-gold btn-sm" style="margin-top:8px" onclick="openFndModule(\''+m.id+'\')">'+( complete?'Review':'Open Module')+'</button>';
   } else {
     html+='<div class="fnd-sections">';
     m.sections.forEach(sec=>{html+='<div class="fnd-sec-item" style="font-size:12px;color:#64748b;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04)">'+sec+'</div>';});
     html+='</div>';
   }
   html+='</div></div>';
 });
 el.innerHTML=html;
}
 
// ── Module Viewer with 3-Gate Tabs ──
function openFndModule(moduleId){
 const m=FOUNDATIONS_MODULES.find(x=>x.id===moduleId);if(!m) return;
 const s=getStaff(ST.staffId);if(!s) return;
 const gates=getModuleGates(s.id,m.id);
 ST._fndTab=ST._fndTab||'content';
 renderFndModuleTab(m,s,gates,ST._fndTab);
}
function renderFndModuleTab(m,s,gates,tab){
 ST._fndTab=tab;
 const el=document.getElementById('s-foundations');
 const tabBtn=(id,label,active)=>'<div class="tab'+(active?' on':'')+'" onclick="ST._fndTab=\''+id+'\';openFndModule(\''+m.id+'\')">'+label+'</div>';
 
 let html='<div class="fnd-reader">';
 html+='<button class="btn btn-ghost btn-sm" onclick="renderSFoundations()" style="margin-bottom:12px">&larr; Back</button>';
 html+='<div style="font-size:11px;color:#c49a20;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">MODULE '+m.num+'</div>';
 html+='<div style="font-size:20px;font-weight:700;color:#e2e8f0">'+m.title+'</div>';
 html+='<div style="font-size:13px;color:#94a3b8;margin-top:2px">'+m.subtitle+'</div>';
 // Gate indicators
 html+='<div style="display:flex;gap:14px;margin:12px 0">';
 html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g1.status)+'<span>Knowledge</span></div>';
 html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g2.status)+'<span>Simulation</span></div>';
 html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g3.status)+'<span>Observation</span></div>';
 html+='</div>';
 // Tabs
 html+='<div class="tab-bar" style="margin-bottom:16px">';
 html+=tabBtn('content','Content',tab==='content');
 html+=tabBtn('gate1','Gate 1: Knowledge',tab==='gate1');
 html+=tabBtn('gate2','Gate 2: Simulation',tab==='gate2');
 html+=tabBtn('gate3','Gate 3: Observation',tab==='gate3');
 html+='</div>';
 
 if(tab==='content'){
   m.sections.forEach((sec,i)=>{
     html+='<div class="fnd-section"><div class="fnd-section-title">'+sec+'</div>';
     html+='<div class="fnd-section-body">'+m.sectionContent[i]+'</div></div>';
   });
 } else if(tab==='gate1'){
   html+=renderFndGateAssessment(m,s,'g1',m.questions,'Knowledge Check','Select the best answer for each question. 80% required to pass.');
 } else if(tab==='gate2'){
   html+=renderFndGateAssessment(m,s,'g2',m.simulations,'Simulation Assessment','Read each scenario and select the best response. 80% required to pass.');
 } else if(tab==='gate3'){
   html+=renderFndG3View(m,s,gates);
 }
 html+='</div>';
 el.innerHTML=html;
 el.scrollTop=0;
}
 
function renderFndGateAssessment(m,s,gateKey,items,title,desc){
 const gates=getModuleGates(s.id,m.id);
 const g=gates[gateKey];
 let h='<div class="fnd-kc">';
 h+='<div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">'+title+'</div>';
 h+='<div style="font-size:12px;color:#94a3b8;margin-bottom:16px">'+desc+'</div>';
 if(g.status==='pass'){
   h+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px;text-align:center;margin-bottom:16px">';
   h+='<div style="font-size:20px;font-weight:700;color:#4ade80">'+g.score+'%</div>';
   h+='<div style="font-size:13px;color:#4ade80;font-weight:600">Passed</div></div>';
 }
 h+='<div id="fnd-gate-questions">';
 const qKey=gateKey==='g1'?'q':'s';
 items.forEach((item,qi)=>{
   h+='<div class="fnd-q" data-qi="'+qi+'">';
   h+='<div class="fnd-q-text">'+(qi+1)+'. '+(item[qKey]||item.q||item.s)+'</div>';
   item.opts.forEach((opt,oi)=>{
     h+='<label class="fnd-q-opt"><input type="radio" name="fnd-'+gateKey+'-'+m.id+'-'+qi+'" value="'+oi+'"'+(g.status==='pass'?' disabled':'')+'><span class="fnd-q-lbl">'+opt+'</span></label>';
   });
   h+='</div>';
 });
 h+='</div>';
 if(g.status!=='pass'){
   h+='<button class="btn btn-gold" style="margin-top:16px;width:100%" onclick="submitFndGate(\''+m.id+'\',\''+gateKey+'\')">Submit</button>';
 }
 h+='<div id="fnd-gate-result"></div></div>';
 return h;
}
 
function renderFndG3View(m,s,gates){
 let h='<div class="fnd-kc">';
 h+='<div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">Observation / Demonstration</div>';
 h+='<div style="font-size:12px;color:#94a3b8;margin-bottom:16px">Your educator or manager confirms each item below after observing you demonstrate the skill in the work environment. You cannot self-confirm these items.</div>';
 if(gates.g3.status==='pass'){
   h+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px;text-align:center;margin-bottom:16px">';
   h+='<div style="font-size:16px;font-weight:700;color:#4ade80">All Items Confirmed</div></div>';
 }
 m.observations.forEach(obs=>{
   const confirmed=gates.g3.items.find(i=>i.id===obs.id&&i.confirmed);
   h+='<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">';
   if(confirmed){
     h+='<svg viewBox="0 0 18 18" width="16" height="16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="9" cy="9" r="8" fill="rgba(74,222,128,.15)" stroke="#4ade80" stroke-width="1.3"/><path d="M5.5 9.5l2.5 2.5L13 7" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
     h+='<div><div style="font-size:13px;color:#4ade80">'+obs.text+'</div>';
     h+='<div style="font-size:11px;color:#64748b;margin-top:2px">Confirmed by '+confirmed.confirmedBy+' on '+confirmed.date+'</div></div>';
   } else {
     h+='<svg viewBox="0 0 18 18" width="16" height="16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="9" cy="9" r="8" stroke="#475569" stroke-width="1.3"/></svg>';
     h+='<div style="font-size:13px;color:#94a3b8">'+obs.text+'</div>';
   }
   h+='</div>';
 });
 h+='</div>';
 return h;
}
 
function submitFndGate(moduleId,gateKey){
 const m=FOUNDATIONS_MODULES.find(x=>x.id===moduleId);if(!m) return;
 const s=getStaff(ST.staffId);if(!s) return;
 const items=gateKey==='g1'?m.questions:m.simulations;
 let correct=0;
 items.forEach((item,qi)=>{
   const sel=document.querySelector('input[name="fnd-'+gateKey+'-'+m.id+'-'+qi+'"]:checked');
   if(sel&&parseInt(sel.value)===item.ans) correct++;
 });
 const score=Math.round((correct/items.length)*100);
 saveGateScore(s.id,m.id,gateKey,score);
 const passed=score>=80;
 const gateLabel=gateKey==='g1'?'Knowledge':'Simulation';
 // Highlight answers
 items.forEach((item,qi)=>{
   const opts=document.querySelectorAll('input[name="fnd-'+gateKey+'-'+m.id+'-'+qi+'"]');
   opts.forEach((opt,oi)=>{const lbl=opt.closest('.fnd-q-opt');if(!lbl)return;opt.disabled=true;if(oi===item.ans)lbl.classList.add('fnd-q-correct');else if(opt.checked&&oi!==item.ans)lbl.classList.add('fnd-q-wrong');});
 });
 const rEl=document.getElementById('fnd-gate-result');
 if(rEl){
   if(passed){
     rEl.innerHTML='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#4ade80">'+score+'%</div><div style="font-size:13px;color:#4ade80;font-weight:600;margin:4px 0">'+gateLabel+' Gate Passed</div><div style="font-size:12px;color:#94a3b8">'+correct+' of '+items.length+' correct.</div></div>';
     showToast(gateLabel+' gate passed: '+score+'%','ok');
   } else {
     rEl.innerHTML='<div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#f87171">'+score+'%</div><div style="font-size:13px;color:#f87171;font-weight:600;margin:4px 0">Not Yet Passing</div><div style="font-size:12px;color:#94a3b8">'+correct+' of '+items.length+' correct. 80% required.</div><button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="openFndModule(\''+moduleId+'\')">Try Again</button></div>';
     showToast('Score: '+score+'%. 80% required.','err');
   }
 }
}
 
// ── Hospital Portal: Render Training ──
function renderHTraining(){
 const el=document.getElementById('h-training');if(!el)return;
 const fid=ST.hFid;const staff=DB.staff.filter(s=>s.fid===fid);
 let totalA=0,totalC=0,staffWith=0;
 const rows=[];
 staff.forEach(s=>{
   const asgns=getFoundationsAssignments(s.id);
   const done=asgns.filter(a=>a.status==='completed').length;
   if(asgns.length>0){staffWith++;totalA+=asgns.length;totalC+=done;}
   rows.push({s,assigned:asgns.length,done,pct:asgns.length>0?Math.round(done/asgns.length*100):0});
 });
 
 let html='<div class="card mb16"><div class="card-hd"><div class="card-ttl">SBD Foundations</div></div><div class="card-body">';
 html+='<p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 16px">Assign training modules for onboarding or targeted remediation. Each module requires three gates: Knowledge, Simulation, and Observed Demonstration.</p>';
 html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:8px">';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Enrolled</div><div class="stat-val">'+staffWith+'</div></div>';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Assigned</div><div class="stat-val">'+totalA+'</div></div>';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Completed</div><div class="stat-val" style="color:#4ade80">'+totalC+'</div></div>';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Rate</div><div class="stat-val">'+(totalA>0?Math.round(totalC/totalA*100):0)+'%</div></div>';
 html+='</div></div></div>';
 
 // Staff table
 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Staff Training</div></div>';
 html+='<div class="card-body" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Belt</th><th>Modules</th><th>Actions</th></tr></thead><tbody>';
 rows.sort((a,b)=>fullName(a.s).localeCompare(fullName(b.s)));
 rows.forEach(r=>{
   html+='<tr><td style="font-weight:600">'+fullName(r.s)+'</td>';
   html+='<td><span class="bb bb-'+r.s.belt+'">'+r.s.belt+'</span></td>';
   html+='<td>'+(r.assigned>0?'<span class="'+(r.pct===100?'tc-ok':r.pct>0?'tc-warn':'tc-muted')+'">'+r.done+'/'+r.assigned+'</span>':'<span class="tc-muted">None</span>')+'</td>';
   html+='<td style="white-space:nowrap">';
   if(r.assigned>0) html+='<button class="btn btn-ghost btn-xs" onclick="hFndStaffDetail('+r.s.id+')">View</button> ';
   if(r.assigned<10) html+='<button class="btn btn-gold btn-xs" onclick="hAssignFndModal('+r.s.id+')">Assign</button> ';
   if(r.assigned===0) html+='<button class="btn btn-blue btn-xs" onclick="hAssignAllFnd('+r.s.id+')">All 10</button>';
   html+='</td></tr>';
 });
 html+='</tbody></table></div></div></div>';
 el.innerHTML=html;
}
 
// ── Hospital: Staff Detail with Gate 3 Marking ──
function hFndStaffDetail(staffId){
 const s=getStaff(staffId);if(!s) return;
 const el=document.getElementById('h-training');if(!el) return;
 const assignments=getFoundationsAssignments(s.id);
 const assignerName=ST.user?ST.user.name:'Manager';
 
 let html='<button class="btn btn-ghost btn-sm" onclick="renderHTraining()" style="margin-bottom:12px">&larr; Back</button>';
 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">'+fullName(s)+'</div><span class="bb bb-'+s.belt+'">'+s.belt+'</span></div>';
 html+='<div class="card-body"><div style="font-size:13px;color:#94a3b8">'+s.role+'</div></div></div>';
 
 FOUNDATIONS_MODULES.forEach(m=>{
   if(!isModuleAssigned(s.id,m.id)) return;
   const gates=getModuleGates(s.id,m.id);
   html+='<div class="card mb16"><div class="card-hd" style="flex-wrap:wrap;gap:8px">';
   html+='<div style="display:flex;align-items:center;gap:8px"><div class="fnd-num'+(gates.complete?' fnd-num-done':'')+'">'+m.num+'</div>';
   html+='<div class="card-ttl" style="font-size:14px;margin:0">'+m.title+'</div></div>';
   html+='<div style="display:flex;gap:4px">'+fndGateBadge(gates.g1.status)+fndGateBadge(gates.g2.status)+fndGateBadge(gates.g3.status)+'</div>';
   html+='</div><div class="card-body" style="padding-top:0">';
   // Gate status
   html+='<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:#94a3b8">';
   html+='<span>G1: '+(gates.g1.status==='pass'?'<span class="tc-ok">'+gates.g1.score+'%</span>':'<span class="tc-muted">'+gates.g1.status+'</span>')+'</span>';
   html+='<span>G2: '+(gates.g2.status==='pass'?'<span class="tc-ok">'+gates.g2.score+'%</span>':'<span class="tc-muted">'+gates.g2.status+'</span>')+'</span>';
   html+='<span>G3: '+(gates.g3.status==='pass'?'<span class="tc-ok">Confirmed</span>':'<span class="tc-warn">Pending</span>')+'</span>';
   html+='</div>';
   // Gate 3 observation items (editable by manager)
   if(gates.g3.status!=='pass'){
     html+='<div style="font-size:12px;font-weight:600;color:#c49a20;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Gate 3: Confirm Observed Demonstrations</div>';
     m.observations.forEach(obs=>{
       const confirmed=gates.g3.items.find(i=>i.id===obs.id&&i.confirmed);
       html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">';
       html+='<input type="checkbox" style="accent-color:#4ade80;flex-shrink:0" '+(confirmed?'checked':'')+' onchange="markFndG3('+s.id+',\''+m.id+'\',\''+obs.id+'\',this.checked)">';
       html+='<span style="font-size:12.5px;color:'+(confirmed?'#4ade80':'#94a3b8')+'">'+obs.text+'</span>';
       html+='</div>';
     });
   }
   html+='</div></div>';
 });
 el.innerHTML=html;
}
function markFndG3(staffId,moduleId,itemId,checked){
 const assignerName=ST.user?ST.user.name:'Manager';
 markG3Item(staffId,moduleId,itemId,checked,assignerName);
 hFndStaffDetail(staffId);
}
 
// ── Hospital: Assignment Modal ──
function hAssignFndModal(staffId){
 const s=getStaff(staffId);if(!s) return;
 const existing=getFoundationsAssignments(s.id);
 const unassigned=FOUNDATIONS_MODULES.filter(m=>!existing.some(a=>a.moduleId===m.id));
 if(!unassigned.length){showToast('All modules assigned','info');return;}
 let html='<div style="margin-bottom:12px;font-size:13px;color:#94a3b8">Assign to <strong style="color:#e2e8f0">'+fullName(s)+'</strong>:</div>';
 html+='<div style="max-height:300px;overflow-y:auto">';
 unassigned.forEach(m=>{
   html+='<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;font-size:13px;color:#cbd5e1">';
   html+='<input type="checkbox" class="fnd-assign-cb" value="'+m.id+'" style="accent-color:#c49a20">';
   html+='<span><strong>'+m.num+'.</strong> '+m.title+'</span></label>';
 });
 html+='</div><div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">';
 html+='<button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button>';
 html+='<button class="btn btn-gold btn-sm" onclick="hDoAssignFnd('+s.id+')">Assign</button></div>';
 openModal('Assign Foundations',html,'modal-sm');
}
function hDoAssignFnd(staffId){
 const cbs=document.querySelectorAll('.fnd-assign-cb:checked');
 if(!cbs.length){showToast('Select at least one','err');return;}
 const nm=ST.user?ST.user.name:'Manager';
 cbs.forEach(cb=>assignModule(staffId,cb.value,nm,'remediation',null));
 closeModal();showToast(cbs.length+' module'+(cbs.length>1?'s':'')+' assigned','ok');renderHTraining();
}
function hAssignAllFnd(staffId){
 assignAllModules(staffId,ST.user?ST.user.name:'Manager');
 showToast('All 10 modules assigned','ok');renderHTraining();
}
