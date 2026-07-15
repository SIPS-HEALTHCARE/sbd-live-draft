// SBD_Foundations_Code.js
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
//    getStaff(), fullName(), saveDemoData(), toast(),
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
    {q:'What is biofilm?',opts:['A protective colony of bacteria resistant to killing','A type of sterilization packaging','A cleaning solution for ultrasonics','A quality test for washers'],ans:0},
    {q:'What can result when sterile processing fails?',opts:['Healthcare-Associated Infections or Surgical Site Infections','Longer surgical case times','Increased instrument inventory costs','Delayed OR scheduling'],ans:0},
    {q:'Which set of qualities does the module say this job requires?',opts:['Speed, multitasking, and improvisation','Attention to detail, consistency, integrity, humility, and pride','Physical strength and endurance','Salesmanship and negotiation'],ans:1},
    {q:'According to the module, sterilization cannot be effective on instruments that are:',opts:['Made of stainless steel','Still wet from rinsing','Dirty or soiled','Recently purchased'],ans:2},
    {q:'Which of the following is listed as a type of microorganism?',opts:['Enzymes','Detergents','Surfactants','Fungi'],ans:3},
    {q:'How many links make up the Chain of Infection?',opts:['Four','Five','Six','Seven'],ans:2},
    {q:'What is the final link in the Chain of Infection?',opts:['Infectious Agent','Portal of Exit','Reservoir','Susceptible Host'],ans:3},
    {q:'Which link comes immediately after Portal of Exit?',opts:['Susceptible Host','Portal of Entry','Mode of Transmission','Reservoir'],ans:2},
    {q:'Semi-critical items come into contact with which type of tissue?',opts:['Sterile tissue','Mucous membranes','Intact skin','Bone'],ans:1},
    {q:'Which Spaulding category contacts intact skin and needs only low-level disinfection?',opts:['Non-critical','Semi-critical','Critical','High-risk'],ans:0},
    {q:'Which organization is responsible for worker safety in the SPD?',opts:['OSHA','FDA','AORN','TJC'],ans:0},
    {q:'Which organization provides accreditation to healthcare facilities?',opts:['CDC','The Joint Commission (TJC)','AAMI','CMS'],ans:1},
    {q:'Which SBD pillar reduces variability?',opts:['Verification','Communication','Documentation','Standardization'],ans:3},
    {q:'Which SBD pillar is described as catching errors before they reach patients?',opts:['Standardization','Verification','Documentation','Communication'],ans:1},
    {q:'Which certification is offered through HSPA?',opts:['CRCST','CSPDT','CBSPD','ST79'],ans:0},
    {q:'Professional ethics in sterile processing include:',opts:['Following procedures only when a supervisor is watching','Prioritizing speed over accuracy','Deferring all decisions to the OR','Making patient-first decisions and reporting honestly'],ans:3},
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
    {s:'Which of the following would be classified as a critical item under Spaulding?',opts:['A stethoscope','A bed rail','A surgical scalpel that enters sterile tissue','A blood pressure cuff'],ans:2},
    {s:'You are tempted to skip a small step because you are behind schedule. Which principle from the module should guide your decision?',opts:['The work requires consistency and attention to detail because patient safety depends on it','Speed matters more than thoroughness when busy','Skipping minor steps is fine if no one notices','Only critical instruments require full attention'],ans:0},
    {s:'A colleague says mistakes in SPD do not really affect patients. Based on the module\'s mission, how do you respond?',opts:['They are right, the OR catches everything','SPD failures can lead to Healthcare-Associated Infections or Surgical Site Infections, so our work directly affects patients','Mistakes only matter for implants','Errors are the OR\'s responsibility, not ours'],ans:1},
    {s:'An instrument still has visible soil but a coworker wants to run it through the sterilizer anyway. What is the microbiology problem?',opts:['Nothing, the sterilizer handles soil','Only spores matter, so soil is fine','Sterilization cannot work on dirty instruments, so soil must be removed first','Soil helps the sterilant penetrate'],ans:2},
    {s:'You need to explain to a new tech why spores matter for sterilization. What is the correct point?',opts:['Spores are harmless','Spores are easier to kill than viruses','Spores are a type of packaging','Spores are the most resistant form of microbial life, so they are the sterilization benchmark'],ans:3},
    {s:'A student asks you to name the six links of the Chain of Infection in order. Which sequence is correct?',opts:['Infectious Agent, Reservoir, Portal of Exit, Mode of Transmission, Portal of Entry, Susceptible Host','Reservoir, Infectious Agent, Portal of Entry, Mode of Transmission, Portal of Exit, Susceptible Host','Susceptible Host, Portal of Entry, Mode of Transmission, Portal of Exit, Reservoir, Infectious Agent','Infectious Agent, Portal of Exit, Reservoir, Portal of Entry, Mode of Transmission, Susceptible Host'],ans:0},
    {s:'A patient with a weakened immune system is best described as which link in the Chain of Infection?',opts:['Reservoir','Susceptible Host','Portal of Exit','Infectious Agent'],ans:1},
    {s:'A reusable device will enter a patient\'s sterile tissue during surgery. What Spaulding processing does it require?',opts:['Low-level disinfection','High-level disinfection','Sterilization','No processing'],ans:2},
    {s:'A vaginal speculum contacts a mucous membrane. What is the minimum processing under Spaulding?',opts:['Low-level disinfection','Only rinsing','No processing needed','High-level disinfection'],ans:3},
    {s:'A stethoscope only touches intact skin. What Spaulding category and processing apply?',opts:['Non-critical, low-level disinfection','Semi-critical, high-level disinfection','Critical, sterilization','Critical, high-level disinfection'],ans:0},
    {s:'An auditor asks which organization ties your facility to Medicare conditions of participation. Which do you name?',opts:['CDC','CMS','AORN','AAMI'],ans:1},
    {s:'A new employee asks who sets worker-safety rules such as wearing PPE. Which organization?',opts:['FDA','TJC','OSHA','CDC'],ans:2},
    {s:'Your department wants every tech to build a given tray the same way to reduce errors. Which SBD pillar is this?',opts:['Verification','Documentation','Communication','Standardization'],ans:3},
    {s:'During a second check you catch a wrong instrument in a tray before it reaches the OR. Which SBD pillar does this represent?',opts:['Verification','Standardization','Communication','Documentation'],ans:0},
    {s:'A shift handoff leads to confusion about an incomplete load. Which SBD pillar would have prevented this?',opts:['Standardization','Communication','Verification','Documentation'],ans:1},
    {s:'You want a nationally recognized credential to validate your knowledge. Which certification could you pursue through HSPA?',opts:['ST79','A0','CRCST','CSPDT'],ans:2},
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
    {q:'Why should dissimilar metals NOT be placed together in ultrasonics?',opts:['Too much noise','Electrolytic corrosion and damage','Cannot handle mixed weights','OSHA regulation'],ans:1},
    {q:'What is the purpose of a proper doffing sequence with hand hygiene between steps?',opts:['To prevent self-contamination','To save time','To conserve PPE','To meet dress code'],ans:0},
    {q:'What type of gown is required PPE in decontamination?',opts:['Cloth gown','Fluid-resistant gown','Disposable paper apron','Lead gown'],ans:1},
    {q:'What forms when dried bioburden is left on instruments?',opts:['Rust','Patina','Biofilm','Cavitation'],ans:2},
    {q:'Which of the following is an appropriate point-of-use pre-treatment?',opts:['Air drying the instruments','Wrapping in a dry towel for overnight storage','Leaving instruments to dry before transport','Applying enzymatic foam or gel'],ans:3},
    {q:'How should contaminated and clean items be routed?',opts:['Kept on separate routes','On the same cart to save trips','Clean first, then contaminated on the same path','Route does not matter if items are covered'],ans:0},
    {q:'Contaminated transport containers must be labeled as:',opts:['Fragile','Biohazardous','Clean','Do not stack'],ans:1},
    {q:'What must you always check for when sorting instruments?',opts:['Serial numbers','Manufacturer date','Sharps','Color coding'],ans:2},
    {q:'What must be done to multi-part instruments before cleaning?',opts:['Label them','Weigh them','Wrap them','Disassemble them'],ans:3},
    {q:'Serrations should be brushed:',opts:['In the direction of the ridges','Against the ridges','In a circular motion only','With a dry brush'],ans:0},
    {q:'The three elements of manual cleaning are:',opts:['Heat, pressure, and steam','Water, detergent, and mechanical action','Enzyme, rinse, and dry','Soak, spray, and wipe'],ans:1},
    {q:'How long should the aluminum foil test for an ultrasonic cleaner run?',opts:['5-10 seconds','1-2 minutes','20-30 seconds','5 minutes'],ans:2},
    {q:'Ultrasonic solution concentration and temperature should follow:',opts:['Whatever is convenient','The hottest available setting','Personal preference','The manufacturer IFU'],ans:3},
    {q:'Lumened instruments in an automated washer must be:',opts:['Connected to flushing ports','Laid flat on the shelf','Placed in a peel pouch','Left disassembled in a pile'],ans:0},
    {q:'What magnification is recommended for visual inspection?',opts:['10x-20x','2x-5x','50x','No magnification needed'],ans:1},
    {q:'Which is an additional cleaning verification method beyond visual inspection?',opts:['Weight testing','Color testing','ATP testing','Sound testing'],ans:2},
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
    {s:'Two different metal types (stainless and aluminum) need ultrasonic cleaning. Can you put them in together?',opts:['Yes, the cleaner handles everything','No, dissimilar metals can cause galvanic corrosion; process them separately','Only if they are the same size','Yes, if you add extra detergent'],ans:1},
    {s:'You are about to enter decontam and realize you forgot your hair cover. What should you do?',opts:['Put on the hair cover before starting, it is required PPE','Proceed, hair cover is optional','Only wear it if handling lumens','Tie your hair back instead'],ans:0},
    {s:'You finished decontam work and need to remove PPE. What should you do between steps?',opts:['Remove all PPE at once','Perform hand hygiene between steps to prevent self-contamination','Spray gloves with disinfectant only','Remove gloves last with no hand hygiene'],ans:1},
    {s:'A tray sat in the OR for an hour with no pre-treatment before coming to you. What is the concern?',opts:['No concern, cleaning removes anything','The instruments are now sterile','Blood and tissue dry within minutes and can form biofilm, making cleaning harder','They only need a quick rinse'],ans:2},
    {s:'OR staff ask what they should do to instruments right after a procedure. What point-of-use guidance do you give?',opts:['Let them air dry on the back table','Wrap them dry and send them tomorrow','Rinse with tap water and store','Apply enzymatic foam or saline-moistened towels and transport promptly'],ans:3},
    {s:'You need to move contaminated instruments to decontam but the only cover you can find is torn. What do you do?',opts:['Find a proper covered, leak-proof container before transporting','Transport uncovered since it is a short trip','Use the torn cover anyway','Carry them by hand'],ans:0},
    {s:'A coworker wants to use the same cart for clean and contaminated items to save time. What is your response?',opts:['That is fine if the cart is wiped between','Contaminated and clean routes must be kept separate','Only an issue for lumened instruments','Acceptable during busy periods'],ans:1},
    {s:'While sorting a returned set, you are unsure whether an instrument has multiple parts. What should you do before cleaning?',opts:['Clean it assembled to be safe','Send it to the washer as is','Disassemble multi-part instruments per IFU before cleaning','Skip it'],ans:2},
    {s:'You receive a mixed bin of instruments to sort. What is the safest first action?',opts:['Grab handfuls quickly to sort by type','Weigh the bin','Photograph the contents','Check for sharps before handling to avoid injury'],ans:3},
    {s:'You are manually cleaning a hemostat with serrations. In which direction should you brush?',opts:['In the direction of the ridges','Across the ridges randomly','Only along the handle','It does not matter'],ans:0},
    {s:'A cannulated instrument needs cleaning but you cannot find the correct brush accessory. What should you do?',opts:['Use any brush that fits loosely','Obtain the manufacturer-specific accessory before cleaning the cannula','Skip the cannula and clean the outside only','Run it through ultrasonic instead'],ans:1},
    {s:'You are setting up the ultrasonic cleaner and are unsure of the solution concentration. Where do you find the correct setting?',opts:['Guess based on experience','Use the maximum concentration','Follow the manufacturer IFU for concentration and temperature','Ask a coworker\'s opinion'],ans:2},
    {s:'You need to verify the ultrasonic unit is generating cavitation. Which test do you perform?',opts:['Listen for a humming sound','Feel the water temperature','Count the instruments','Run the aluminum foil test and check for even pitting'],ans:3},
    {s:'You are loading hinged instruments into the automated washer. How should they be positioned?',opts:['Open so all surfaces are exposed to cleaning','Closed and stacked tightly','In peel pouches','Locked to protect the hinges'],ans:0},
    {s:'A tray of lumened instruments is going into the washer. What must you do to ensure the lumens get cleaned?',opts:['Lay them flat and hope for the best','Connect them to the washer\'s flushing ports','Cap the lumen ends','Place them in the ultrasonic instead'],ans:1},
    {s:'After cleaning, you inspect an instrument and see a small amount of soil in a serration under magnification. What is your decision?',opts:['It is clean enough to sterilize','Package it and note the soil','It is not clean; re-clean until no soil is visible','Soil in serrations is acceptable'],ans:2},
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
    {q:'Pitting on an instrument surface indicates:',opts:['Normal wear','Corrosion creating small holes in metal','Safe manufacturing defect','Recent sharpening'],ans:1},
    {q:'When is inspection a primary responsibility in the processing workflow?',opts:['Only during annual instrument audits','After decontamination and during assembly','Only at the point of use in the OR','During transport to sterile storage'],ans:1},
    {q:'What type of lighting should be used for instrument inspection?',opts:['Direct bright shadow-free light','Dim indirect lighting to reduce glare','Ultraviolet light only','Colored surgical spotlights'],ans:0},
    {q:'What is checked first in the SIPS Inspection Sequence?',opts:['Markings and labels','Lumens and channels','Overall condition','Joints and hinges'],ans:2},
    {q:'What is examined last in the SIPS Inspection Sequence?',opts:['Working surfaces','Handles and shafts','Overall condition','Markings and labels'],ans:3},
    {q:'Which area is included in the SIPS Inspection Sequence?',opts:['Lumens and channels','Sterilizer chamber walls','Packaging materials','Count sheet revision dates'],ans:0},
    {q:'During a box lock test, which finding indicates a problem?',opts:['Smooth opening and closing','Quiet movement through the full range','Grinding during open and close','No looseness at the joint'],ans:2},
    {q:'What confirms proper jaw alignment on a hinged instrument?',opts:['Tips overlap slightly when closed','Tips meet evenly with no gaps and jaws are parallel','One jaw sits higher to improve grip','Tips touch only under firm pressure'],ans:1},
    {q:'Which result means a needle holder passes the grip test?',opts:['The needle rotates slightly under pressure','The jaws are polished smooth','The ratchet releases on its own','The needle does not rotate and the cross-hatching is intact'],ans:3},
    {q:'Which list correctly names types of instrument corrosion?',opts:['Surface rust, pitting, stress cracking, galvanic','Bent tips, cracked handles, loose joints, worn serrations','Fatigue, creep, shear, torsion','Staining, fading, dulling, warping'],ans:0},
    {q:'Which finding is an example of physical damage rather than corrosion?',opts:['Surface rust','Galvanic corrosion','Worn serrations','Pitting'],ans:2},
    {q:'Which of the following is listed as an instrument identification resource?',opts:['Sterilizer cycle printouts','Manufacturer catalogs','Biological indicator logs','Water quality reports'],ans:1},
    {q:'How many basic instrument categories does the module describe?',opts:['Five','Six','Seven','Nine'],ans:2},
    {q:'Which of the following is one of the basic instrument categories?',opts:['Cauterizing/Sealing','Suturing/Stapling','Drilling/Boring','Dilating/Expanding'],ans:1},
    {q:'Which finding requires immediate removal from service?',opts:['Severe corrosion','Legible manufacturer markings','Intact cross-hatching on jaw surfaces','A ratchet that clicks and holds at each position'],ans:0},
    {q:'After a failed instrument is separated, tagged, and documented, where is it sent?',opts:['Back to the decontamination sink','Directly to sterile storage','The OR core for evaluation','The repair area'],ans:3},
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
    {s:'You need to identify an instrument but the etched markings on the shaft are illegible. What resources do you use?',opts:['Give up and discard it','Use count sheets, manufacturer catalogs, digital tools, or ask an experienced colleague','Guess based on the shape','Leave it for the next shift'],ans:1},
    {s:'The light at your inspection station burns out, leaving only dim overhead lighting. A coworker says the trays are due and you should keep working. What do you do?',opts:['Keep inspecting; the deadline matters more than lighting','Inspect by feel instead of sight until the light is fixed','Restore direct bright shadow-free lighting before continuing inspection','Skip inspection for small instruments only'],ans:2},
    {s:'You cannot find the magnifier at your station and the instruments look clean to the naked eye. What is the correct practice?',opts:['Naked-eye inspection is acceptable when instruments look clean','Locate 2x-5x magnification before inspecting; the naked eye misses fine defects','Ask a coworker to double-check with their naked eye','Only use magnification for electrosurgical instruments'],ans:1},
    {s:'A coworker thoroughly inspects the exterior of a suction instrument but skips the lumen because it is hard to see inside. What is the problem?',opts:['Nothing; exterior inspection is sufficient for suction devices','Lumens only need inspection once a month','Lumens and channels are part of the SIPS Inspection Sequence and must be checked','Only the OR is responsible for checking lumens'],ans:2},
    {s:'While opening and closing a clamp through its full range, you feel it catch and grind midway even though it appears clean. What do you do?',opts:['Remove it from service; grinding means it fails the box lock test','Work the joint back and forth until it loosens','Pass it since it opens and closes fully','Send it to the OR with a note about the stiffness'],ans:0},
    {s:'During a grip test, a needle held in a needle holder rotates under light pressure even though the cross-hatching looks intact. What is your action?',opts:['Pass it; intact cross-hatching is what matters','Use it only with larger needles','Squeeze harder next time it is used','Remove it from service; the needle must not rotate in the jaws'],ans:3},
    {s:'A hemostat\'s ratchet engages and holds at every position, but you have to wrench it forcefully to release it. What does this mean?',opts:['It passes; holding at each position is the only requirement','It fails the ratchet test; the ratchet must also release cleanly','It should be lubricated at the station and returned to the tray','It is acceptable for large hemostats'],ans:1},
    {s:'You spot a hairline crack in the handle ring of a pair of scissors that still cuts cleanly to the tips. What do you do?',opts:['Keep it in service since it cuts properly','Monitor the crack over the next few cycles','Remove it from service; cracks require immediate removal regardless of function','Fill the crack and continue processing'],ans:2},
    {s:'A clamp\'s tips are slightly bent, and a coworker offers to bend them back into shape with pliers at the workstation. What is the correct response?',opts:['Remove the clamp from service; bent instruments go to the repair area, not station fixes','Let the coworker straighten them if they are experienced','Straighten them only if the bend is small','Sterilize it first, then straighten the tips'],ans:0},
    {s:'An instrument shows deep corrosion with pitting across its working surface. A coworker suggests polishing it at the station and returning it to the tray. What do you do?',opts:['Polish it as suggested and inspect again','Return it to the tray and flag it for the next quarterly review','Soak it in water to loosen the corrosion','Remove it from service immediately; severe corrosion is a removal criterion'],ans:3},
    {s:'You find no marking on an instrument\'s shank while trying to identify it. Where else should you look before turning to other resources?',opts:['The shaft, handle, or blade','The tray liner','The count sheet header only','Nowhere; markings are always on the shank'],ans:0},
    {s:'A trainee sorting loose instruments places a suction tip with the cutting instruments. Based on the module\'s categories, where does it belong?',opts:['Grasping/Holding','Irrigation/Suctioning','Measuring/Probing','Retracting/Exposing'],ans:1},
    {s:'You find a cracked instrument, set it on the counter without a tag, and plan to deal with it after finishing your tray. What is the risk?',opts:['None, as long as you remember where you put it','It might be discarded by housekeeping','The counter may not be clean enough for it','An untagged instrument can be returned to service by mistake; separate and tag it immediately'],ans:3},
    {s:'A coworker removes a broken instrument and carries it straight to the repair area without recording anything. What step was missed?',opts:['Nothing; delivery to repair is all that is required','The removal must be documented and the appropriate person notified','The instrument should have been sterilized first','The instrument should have gone to storage instead'],ans:1},
    {s:'A coworker says inspection is decontam\'s job and assembly should just count instruments quickly. How do you respond?',opts:['Agree; assembly is only about counting','Inspection matters only when the OR reports problems','Inspection is a primary responsibility both after decontamination and during assembly','Only leads are responsible for inspection'],ans:2},
    {s:'Under time pressure, a coworker suggests checking only that instruments are clean and skipping function checks. What is wrong with this?',opts:['Inspection must verify cleanliness, function, and condition, not cleanliness alone','Nothing; function testing is optional when busy','Function checks are needed only for new instruments','Cleanliness checks can be skipped instead since decontam already washed them'],ans:0},
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
    {q:'What goes inside every package before sterilization?',opts:['Patient label','Internal chemical indicator','Biological indicator','Expiration sticker'],ans:1},
    {q:'What relative humidity range is required in the assembly area?',opts:['10-20%','30-60%','65-80%','Above 80%'],ans:1},
    {q:'Which attire is correct for working in the assembly area?',opts:['Clean scrubs, bouffant cap, and lint-free gloves','Sterile gown and double gloves','Street clothes with a lab coat','Scrubs with a wristwatch and rings'],ans:0},
    {q:'Besides temperature and humidity control, which conditions apply to the assembly area?',opts:['Negative pressure and open access','Unfiltered ventilation with restricted access','Filtered air and restricted access','Positive pressure with public access'],ans:2},
    {q:'What do count sheets specify?',opts:['General guidelines for similar trays','Only the total number of instruments','Exactly which instruments belong in the set','The sterilization cycle to use'],ans:2},
    {q:'What is the final step of the SIPS count sheet process?',opts:['Gather the instruments','Perform the final count','Sign and date','Check the revision date'],ans:2},
    {q:'As each instrument is verified during assembly, what should happen?',opts:['It is checked off on the count sheet','It is set aside for a batch check at the end','A second tech logs it separately','It is recorded in the sterilizer log'],ans:0},
    {q:'How should instruments be arranged in the tray?',opts:['Stacked in two layers','Nested inside each other','Piled by category','In a single layer'],ans:3},
    {q:'Which of the following is a stated goal of tray organization?',opts:['Reducing instrument inventory','OR usability','Faster decontamination','Fewer count sheet revisions'],ans:1},
    {q:'Where do blade guards belong?',opts:['On cutting edges','On ratchet teeth','On container latches','On instrument handles'],ans:0},
    {q:'Which padding materials does the module identify for protecting instruments?',opts:['Paper towels','Gauze sponges','Foam or silicone','Bubble wrap'],ans:2},
    {q:'When building a general surgery tray, which instruments are placed first after the liner?',opts:['Needle holders','Scissors','Clamps','Retractors'],ans:3},
    {q:'How are clamps organized in a general surgery tray?',opts:['On stringers','Loose in the tray bottom','In individual peel pouches','Wrapped in towels'],ans:0},
    {q:'What is a critical consideration specific to orthopedic trays?',opts:['Color-coded handles','Weight limits','Alphabetical ordering','Extra chemical indicators'],ans:1},
    {q:'Which of the following is a component of a rigid container system?',opts:['Muslin wrapper','Peel pouch window','Autoclave tape strip','Filter/retention plate'],ans:3},
    {q:'During container assembly, when is the internal chemical indicator placed?',opts:['Before the filter is installed','After loading the instruments and before closing the lid','After the container is latched','Only when requested by the OR'],ans:1},
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
    {s:'During container assembly, you install the filter and notice it has a small tear at the edge. What is your action?',opts:['It is small, proceed','Replace the filter; any compromise prevents proper sterilization','Tape over the tear','Use the container without a filter'],ans:1},
    {s:'The assembly room thermometer reads 78F and the area feels warm. A coworker says it is fine as long as everyone is comfortable. What do you do?',opts:['Agree; comfort is the standard','Report it; the assembly area must be maintained at 68-73F','Open the door to decontam to balance the temperature','Only report it if instruments feel hot'],ans:1},
    {s:'A coworker in assembly is wearing a bracelet and has long polished nails. What is the concern?',opts:['None, as long as gloves are worn over them','Bracelets are fine but nails must be short','Assembly attire requires no jewelry and short clean nails','Only rings are prohibited in assembly'],ans:2},
    {s:'You notice the door between assembly and the decontamination area propped open for convenience. What should happen?',opts:['Close it; the pressure relationship keeps contaminated air out of the clean area','Leave it; the positive pressure works either way','Prop it only during shift change','Ask decontam staff if they mind the airflow'],ans:0},
    {s:'To save time, a coworker gathers all instruments first and plans to check everything off from memory at the end. What is wrong?',opts:['Nothing; the final count catches any errors','Each instrument must be verified and checked off as part of the process, then final counted','Memory checks are fine for small trays','Only implant trays require item-by-item verification'],ans:1},
    {s:'Your final count shows 25 instruments but the count sheet lists 24. Everything on the sheet is present plus one extra clamp. What do you do?',opts:['Leave the extra clamp in; more is safer than fewer','Remove the extra instrument; the count sheet specifies exactly what belongs in the set','Update the count sheet by hand to 25','Send the tray and let the OR remove it'],ans:1},
    {s:'A coworker says the final count is unnecessary because every instrument was already checked off individually. How do you respond?',opts:['Agree and sign the sheet','Skip it only when trays are behind schedule','Ask the lead to waive it','The final count is a required step before signing and dating the sheet'],ans:3},
    {s:'A coworker places a metal bowl face-up in a set so small items can rest inside it. What is the problem?',opts:['Concave items must face down so water drains instead of pooling','Nothing; bowls are convenient holders','Bowls should be wrapped separately, never in sets','Face-up is fine if the bowl is dried afterward'],ans:0},
    {s:'To fit everything into one tray, a tech stacks instruments in two layers. What is the correct practice?',opts:['Two layers are fine if the tray closes','Stack heavier items on the upper layer','Instruments belong in a single layer; use an appropriate tray or configuration','Add extra padding between layers'],ans:2},
    {s:'Running behind, a coworker scoops up several clamps in a handful and drops them into the tray. What is the correct handling?',opts:['Handfuls are acceptable for sturdy clamps','One at a time, held by the body, placed gently','Two at a time if held carefully','Handling speed does not affect instruments'],ans:1},
    {s:'No tip protectors in the right size are available for delicate scissors, so a coworker suggests wrapping the tips in autoclave tape. What do you do?',opts:['Use the tape; it survives sterilization','Leave the tips unprotected this once','Wrap the tips in a paper towel instead','Get proper sterilization-compatible tip protectors before proceeding'],ans:3},
    {s:'An orthopedic tray closes properly but feels extremely heavy after you add every listed instrument. A coworker says to send it on. What do you consider?',opts:['Weight limits are critical for orthopedic trays; verify the tray is within limits before it advances','Weight only matters for wrapped trays, not containers','Heavy trays just need two-person lifting','If it closes, it complies'],ans:0},
    {s:'While building a general surgery tray, a coworker piles loose clamps in a corner of the tray instead of loading them on stringers. What is the issue?',opts:['No issue; clamps are durable','Piling is fine if the ratchets are open','Clamps belong on stringers in a general tray','Stringers are only for needle holders'],ans:2},
    {s:'In a laparoscopic tray, instruments are positioned with their lumen openings pressed flat against the liner. What is the concern?',opts:['None; the liner is clean','The shafts might scratch the liner','Lumens stay cleaner when sealed against a surface','Lumen access must be ensured when assembling laparoscopic trays'],ans:3},
    {s:'Preparing a rigid container, a coworker skips inspecting it and checking the gaskets because it was fine last week. What is the correct practice?',opts:['Container assembly starts with inspection and gasket checks every time','Weekly inspection is sufficient for containers','Only new containers need inspection','Gaskets are checked by the repair vendor, not techs'],ans:0},
    {s:'You latch a container closed and then cannot remember whether you installed the filter. The tray is due at the sterilizer. What do you do?',opts:['Send it; filters rarely matter','Shake the container and listen for the filter','Open the container and verify the filter is installed before it advances','Attach a note asking the sterilizer operator to check'],ans:2},
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
    {q:'Can CIs replace BIs as proof of sterility?',opts:['Yes, Class 5 equivalent','Yes with two indicators','No, only BIs verify sterilization killed microorganisms','Yes for routine loads'],ans:2},
    {q:'What term describes the complete package that maintains sterility of the contents?',opts:['Chemical indicator system','Sterilization assurance level','Sterile barrier system (SBS)','Packaging envelope'],ans:2},
    {q:'In addition to protecting contents, packaging must allow what to reach the item?',opts:['Sterilant penetration','Room humidity','Ambient dust','Body heat'],ans:0},
    {q:'How are woven wraps best described?',opts:['Disposable bonded fiber','Single-use plastic film','Aluminum foil','Reusable fabric'],ans:3},
    {q:'Nonwoven wraps are made of which material?',opts:['Reusable cotton','Disposable bonded fiber','Aluminum foil','Woven polyester'],ans:1},
    {q:'Which factor should guide wrap selection?',opts:['Sterilization compatibility','Color preference','Brand popularity','Cost alone'],ans:0},
    {q:'The envelope (parallel) fold is most commonly used for which items?',opts:['Small odd-shaped items','Lumened devices','Rectangular items','Single loose instruments'],ans:2},
    {q:'The square fold is best suited for which items?',opts:['Large rectangular trays','Smaller or odd-shaped items','Rigid containers','Peel pouches'],ans:1},
    {q:'Sequential (double) wrapping provides what?',opts:['A single barrier layer','No barrier at all','Only a dust cover','Two barrier layers'],ans:3},
    {q:'In a peel pouch, which side is intended to face the sterilant?',opts:['The paper/film side','The plastic side','Neither side','Both block equally'],ans:0},
    {q:'Why is the plastic side of a peel pouch important?',opts:['It absorbs the sterilant','It allows visibility of the contents','It blocks all steam','It is stronger than paper'],ans:1},
    {q:'How much larger than the item should a peel pouch be?',opts:['Exactly the item size','One-half inch larger','One inch larger on all sides','Three inches larger'],ans:2},
    {q:'A Class 4 chemical indicator is classified as which type?',opts:['Process indicator','Integrating indicator','Emulating indicator','Multi-parameter indicator'],ans:3},
    {q:'A Class 6 chemical indicator is which type?',opts:['Emulating (cycle-specific) indicator','Process indicator','Multi-parameter indicator','Integrating indicator'],ans:0},
    {q:'Which is a required labeling element on a sterile package?',opts:['Patient name','Sterilization date','Ambient humidity','Surgeon\'s preference'],ans:1},
    {q:'Which of the following is an event that compromises package sterility?',opts:['Passage of time alone','Correct storage conditions','A passing external indicator','A tear or hole in the wrap'],ans:3},
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
    {s:'A package arrives at point of use and the CI inside shows incomplete color change. What action?',opts:['Use it if the external indicator passed','Do not use; incomplete CI change means sterilization conditions may not have been met inside the package','Use it for non-critical items only','Re-incubate the CI'],ans:1},
    {s:'A colleague argues that as long as the wrap looks clean, the packaging job is done. What do you tell them packaging must actually accomplish?',opts:['They are right, appearance alone is sufficient','Packaging only needs to hold the tray together','Packaging must allow sterilant penetration, provide a sterile barrier, protect contents, and enable aseptic opening','Only the label matters'],ans:2},
    {s:'During in-service training a tech asks what the \'sterile barrier system\' is for a wrapped tray. What is the correct answer?',opts:['The complete package that maintains sterility','Only the internal CI','The label alone','The sterilizer chamber'],ans:0},
    {s:'The department runs out of validated wrap and a coworker suggests substituting a household material not intended for sterilization. What is your response?',opts:['Use it, wrap is wrap','It is fine for gravity cycles only','Double it up to be safe','Only use packaging validated and compatible with the sterilization method per IFU'],ans:3},
    {s:'You must choose a wrap for a heavy orthopedic tray. Which considerations should drive the choice?',opts:['Color only','Sterilization compatibility, item size and weight, storage conditions, and IFU','The cheapest option available','Whatever wrap is closest'],ans:1},
    {s:'You are about to wrap a large rectangular tray. Which fold technique is most appropriate?',opts:['Envelope (parallel) fold','Square fold','No fold is needed','A twist closure'],ans:0},
    {s:'You need to wrap a small, odd-shaped item. Which fold is best suited for it?',opts:['Envelope fold','Sequential fold only','Square fold','No wrap is needed'],ans:2},
    {s:'Your facility requires two barrier layers on wrapped trays. Which technique achieves this?',opts:['A single square fold','One layer with extra tape','A single peel pouch','Sequential (double) wrapping'],ans:3},
    {s:'A tech double-pouches an instrument placing the inner pouch paper side against the outer pouch plastic side. Is this correct?',opts:['Yes, any orientation is acceptable','No; double pouches must be oriented paper-to-paper or plastic-to-plastic','It only matters in H2O2 systems','Remove the inner pouch entirely'],ans:1},
    {s:'A tech places an instrument in a pouch that is exactly the same size as the item, with no clearance. Why should this be redone?',opts:['The pouch should be about one inch larger than the item on all sides to seal properly and allow sterilant flow','Exact-size pouches save material and are preferred','Smaller is always better','Only large items need clearance'],ans:0},
    {s:'A hinged instrument is inserted tip-first into a peel pouch. What correction do you make?',opts:['No correction is needed','Tips should always go in first','Insert the handle end first so it can be grasped aseptically at the opening','Cut the pouch open at both ends'],ans:2},
    {s:'A supervisor asks you to declare a load sterile based on the internal Class 5 CI alone. What do you clarify?',opts:['A Class 5 CI confirms the load is sterile','Class 5 fully replaces the BI','Use the external tape as proof instead','CIs do not prove sterility; they show critical parameters were met, but a BI verifies the microbial kill'],ans:3},
    {s:'Your department wants an indicator designed to react to the parameters of one specific cycle. Which CI class fits?',opts:['Class 1 process indicator','Class 6 emulating (cycle-specific) indicator','Class 4 multi-parameter indicator','Class 5 integrating for all cycles'],ans:1},
    {s:'You are labeling a wrapped tray but write only the contents name. Which required elements are you missing?',opts:['Sterilization date, sterilizer ID, load/lot number, expiration if applicable, and operator initials','Nothing else is required','Only the patient name','Only the room number'],ans:0},
    {s:'A tech grabs a random ballpoint pen to label a peel pouch. What is the concern?',opts:['Any pen works fine on plastic','Just write on the paper side instead','Use only approved markers, since other writing instruments may damage the pouch or fail to stay legible','No labeling is needed if the tray is used today'],ans:2},
    {s:'During pre-sterilization inspection you find a wrapped package with a broken seal. What is your action?',opts:['Release it; seals are cosmetic','Tape over the broken seal','Only reject it if it looks dirty','A broken seal is an event that compromises the barrier; repackage and reprocess'],ans:3},
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
    {q:'After every cycle, review:',opts:['Supply inventory','Cycle printout verifying all parameters met','OR schedule','Washer log'],ans:1},
    {q:'How does heat sterilization kill microorganisms?',opts:['It freezes cells','It removes all oxygen','It denatures proteins','It only dries surfaces'],ans:2},
    {q:'How do chemical sterilizing agents act on microorganisms?',opts:['They alkylate DNA or oxidize cells','They cool cells below freezing','They add nutrients','They only dry them out'],ans:0},
    {q:'Which set of key factors determines sterilization effectiveness?',opts:['Package color','Operator height','Shelf location','Contact, time, temperature, and concentration'],ans:3},
    {q:'What are typical gravity steam parameters?',opts:['270F/132C for 4 min','250F/121C for 30 min','212F/100C for 15 min','300F/149C for 10 min'],ans:1},
    {q:'In a gravity cycle, how is air removed from the chamber?',opts:['A vacuum pump','Compressed nitrogen','Air exits by gravity','It is not removed'],ans:2},
    {q:'How does the SFPP method remove air?',opts:['A single deep vacuum','Gravity alone','Chemical scrubbers','Steam and pressure pulses without a deep vacuum'],ans:3},
    {q:'What is the approximate temperature range for H2O2 plasma sterilization?',opts:['100-130F','250-270F','300-350F','60-80F'],ans:0},
    {q:'Which low-temperature method is noted for processing longer lumens?',opts:['Ozone','VHP','Gravity steam','Immediate-use steam'],ans:1},
    {q:'Ethylene oxide (EO) sterilization requires which additional step?',opts:['A deep vacuum only','No monitoring at all','Aeration','Immediate release'],ans:2},
    {q:'What minimum spacing is recommended between packages in the sterilizer?',opts:['No spacing is needed','Packages should touch','At least 6 inches','At least 1 inch'],ans:3},
    {q:'Packages in the chamber should be kept away from what?',opts:['The chamber walls','Each other only','The door gasket only','The printout'],ans:0},
    {q:'An external chemical indicator is which class?',opts:['Class 1','Class 4','Class 5','Class 6'],ans:0},
    {q:'Which monitoring method is considered the gold standard?',opts:['Physical gauges','Chemical indicators','Biological indicators','Visual inspection'],ans:2},
    {q:'A biological indicator contains what?',opts:['Chemical dye only','Live spores','Distilled water','Class 5 strips'],ans:1},
    {q:'Which of the following must be recorded in sterilization documentation?',opts:['Only the operator\'s name','Sterilizer ID, cycle type, load number, parameters, and BI results','The room temperature outside','The next patient\'s name'],ans:1},
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
    {s:'The digital printout for a gravity cycle shows 250F for 30 minutes. All indicators passed. Is this load acceptable?',opts:['Yes, parameters were met for a gravity cycle','Review all parameters holistically: temp, time, pressure, and check for any alarms. If all confirm, the load meets requirements','Only if it was unwrapped items','Gravity cycles are never acceptable'],ans:1},
    {s:'A trainee says sterilization only needs to kill bacteria, not spores. How do you correct them?',opts:['Sterilization means complete elimination of all microbial life, including spores','They are right, only bacteria matter','Spores are harmless','Only viruses need to be killed'],ans:0},
    {s:'You must sterilize a wrapped instrument set and want the best steam penetration with active air removal. Which cycle type do you choose?',opts:['Gravity','Prevacuum','Ozone','Ethylene oxide'],ans:1},
    {s:'A gravity load will run at 250F and a coworker sets the timer for 10 minutes. What is the concern?',opts:['10 minutes is fine at 250F','Time does not matter for gravity','Gravity at 250F/121C requires about 30 minutes; 10 minutes is insufficient','5 minutes is enough'],ans:2},
    {s:'A heat-sensitive device with a long lumen cannot go through steam. Which low-temperature method is noted for processing longer lumens?',opts:['Gravity steam','Ozone','H2O2 plasma','VHP'],ans:3},
    {s:'An EO-sterilized load has finished its exposure phase and a tech wants to release it immediately. What is missing?',opts:['EO requires an aeration phase before the load can be released','Nothing, release it now','Just wipe it down','Only implants need aeration'],ans:0},
    {s:'You need a low-temperature cycle running around 100-130F using hydrogen peroxide. Which method matches these parameters?',opts:['Gravity steam','H2O2 plasma','Ethylene oxide','Ozone'],ans:1},
    {s:'To fit more in one cycle, a tech packs packages tightly together with no gaps. What is the problem?',opts:['It is more efficient','It only matters for gravity cycles','Packages need at least 1 inch of space between them for steam circulation','Tighter is always better'],ans:2},
    {s:'A large basin is placed flat in the chamber so water could pool inside it. How should it be positioned?',opts:['Lay it flat, it is fine','Fill it with water first','Cover it tightly','Position it on edge for drainage so condensate can drain'],ans:3},
    {s:'A tech overloads the sterilizer cart to save running an extra cycle. What guidance applies?',opts:['Do not overload; allow room for expansion and steam circulation','Overloading saves cycles and is fine','Only gravity cycles can be overloaded','Overloading improves drying'],ans:0},
    {s:'You want to confirm the cycle physically reached its parameters. Which monitoring provides gauges, displays, and printouts?',opts:['Chemical indicators','Physical monitoring (gauges, displays, printouts)','Biological indicators','No monitoring is needed'],ans:1},
    {s:'A load has a passing external Class 1 indicator, but you need internal verification of critical parameters. Which indicators go inside packages?',opts:['The external Class 1 tape','No internal indicator exists','Internal chemical indicators (Class 4, 5, or 6) placed inside packages','Physical gauges only'],ans:2},
    {s:'A steam BI is incubated and the result is negative. What does this indicate?',opts:['It failed, reprocess the load','The BI expired','Re-incubate to be sure','A pass; the spores were killed, indicating effective sterilization'],ans:3},
    {s:'You are selecting a biological indicator for an ethylene oxide cycle. Which organism is used?',opts:['Bacillus atrophaeus','Geobacillus stearothermophilus','E. coli','Staphylococcus aureus'],ans:0},
    {s:'After a cycle you realize the load number was never recorded. Why does this matter?',opts:['It does not matter','Documentation such as load number is required for traceability and recall','Only the date is needed','Load numbers are optional'],ans:1},
    {s:'A chemical sterilant is used, but its concentration was diluted below specification. Which key sterilization factor was compromised?',opts:['Contact','Temperature','Concentration','Package color'],ans:2},
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
    {q:'A par level is?',opts:['Minimum quality score','Minimum and maximum quantity to maintain','Staff per shift','Sterilization parameter'],ans:1},
    {q:'Recommended temperature range for a sterile storage area?',opts:['32-40F','50-60F','80-90F','68-73F'],ans:3},
    {q:'Maximum relative humidity for sterile storage?',opts:['Below 70%','Below 90%','Below 30%','Exactly 100%'],ans:0},
    {q:'Minimum distance stored items should be from the ceiling?',opts:['2 inches','8 inches','18 inches','36 inches'],ans:2},
    {q:'Which shelving type is preferred for sterile storage?',opts:['Solid steel','Open wire','Cardboard shelving','Wooden shelving'],ans:1},
    {q:'Which of the following is an event that compromises package sterility?',opts:['Reaching a labeled shelf date','A changed external indicator','Storage on an upper shelf','Moisture on the package'],ans:3},
    {q:'Which is part of the post-sterilization inspection checklist?',opts:['The package feels warm','The external indicator has changed and seals are intact','The lot number is even','The package is heavier than usual'],ans:1},
    {q:'Correct handling sequence for items that fail post-sterilization inspection?',opts:['Segregate, identify, correct, document','Discard immediately without a record','Return them to circulation','Re-label and store'],ans:0},
    {q:'The inventory principle of storing \'like with like\' means?',opts:['Match quantities to staff count','Always use the oldest items first','Store similar items together','Keep two of everything'],ans:2},
    {q:'Where should frequently used items be located?',opts:['On the highest shelves','In a locked cabinet','Mixed with rarely used items','In accessible locations'],ans:3},
    {q:'How should sterile items be handled during transport?',opts:['Carried by hand uncovered','Covered on dedicated carts','Mixed on any available cart','Left uncovered for ventilation'],ans:1},
    {q:'What is the rule about sterile and contaminated items during distribution?',opts:['They may share a cart if bagged','They can be mixed on clean corridors','They should never be mixed','They can be mixed when carts are short'],ans:2},
    {q:'Which practice reduces contamination risk during distribution?',opts:['Minimize handling','Maximize rehandling','Use uncovered carts','Route through soiled areas'],ans:0},
    {q:'What is the first step when preparing a case cart?',opts:['Organize the cart heavy on top','Receive the schedule and verify surgeon, procedure, and date','Document and deliver','Skip the pick list'],ans:1},
    {q:'During a recall, how are affected items identified?',opts:['By color only','By shelf position','By lot number and dates','By weight'],ans:2},
    {q:'What should be done with recalled items pending resolution?',opts:['Quarantine them','Continue using them','Discard them without documentation','Return them to the OR'],ans:0},
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
    {s:'A sprinkler head in sterile storage is leaking slightly, and droplets have landed on several stored packages. What do you do?',opts:['Move the packages and wipe them dry','Remove all affected packages from service. Water exposure is an event that compromises sterility. Report the leak for facility maintenance. Document all affected items','Only remove packages that are visibly wet','Wait until maintenance fixes it'],ans:1},
    {s:'The sterile storage room thermometer reads 80F, above the recommended range. What is the appropriate action?',opts:['Ignore it since the packages look fine','Report the environmental excursion and follow corrective action; storage must stay within 68-73F','Open the door for a few minutes','Act only if it passes 90F'],ans:1},
    {s:'A coworker sets a cardboard shipping carton of supplies on a sterile storage shelf. What should you do?',opts:['Leave it, cardboard is fine indoors','Only remove it if it looks dusty','Cover it with plastic','Remove the cardboard; it can harbor dust, pests, and moisture and is not permitted in sterile storage'],ans:3},
    {s:'You find a technician has left a coffee cup and a jacket on a sterile storage shelf. What is the correct response?',opts:['Personal items are not allowed in sterile storage; remove them','Personal items are permitted on lower shelves','Only remove the coffee cup','Allow it if the shelf is otherwise empty'],ans:0},
    {s:'Trays are stacked so high they sit only a few inches below the ceiling. Why is this a problem?',opts:['It is not a problem if they fit','It is only a concern near sprinklers','Stored items must be at least 18 inches from the ceiling','Height does not matter for wrapped items'],ans:2},
    {s:'While stocking shelves, you notice a peel pouch with a broken seal. What do you do?',opts:['Store it, the contents look fine','A broken seal is an event that compromises sterility; remove it from service and reprocess','Tape the seal shut','Store it separately for later use'],ans:1},
    {s:'During pre-storage inspection, the label on a wrapped tray is smeared and illegible. What is the correct action?',opts:['Store it, the wrap is intact','Guess the contents and hand-write a label','Store it and fix the label later','It fails inspection; segregate the item, identify and correct the problem, and document it'],ans:3},
    {s:'A package ready for storage has an external chemical indicator that did not change color. What do you do?',opts:['Do not store it; a failed indicator means the package must be segregated, investigated, documented, and reprocessed','Store it since the wrap is dry','Assume the indicator is defective and store it','Only worry if several packages fail'],ans:0},
    {s:'You notice an item has dropped below its established par minimum. What should happen?',opts:['Wait until it runs out completely','Remove the par label','Reorder to bring the item back to its par level','Permanently double the maximum'],ans:2},
    {s:'Instruments are kept in random, changing spots, making picking slow and error-prone. Which inventory practice addresses this?',opts:['Storing everything by weight','Assigning consistent locations and grouping like with like','Rotating locations every week','Removing all labels'],ans:1},
    {s:'A transporter offers to move a soiled instrument cart and a sterile supply cart together in one trip to save time. What is correct?',opts:['Allow it if the sterile items are on top','Allow it if the trip is short','Allow it if both carts are covered','Do not mix sterile and contaminated items; they must be transported separately'],ans:3},
    {s:'Sterile trays are about to be moved through the hallway on an open, uncovered cart. What should you do?',opts:['Cover the load before transport; sterile items must be covered during transport','Proceed, the hallways are clean','Cover it only if it is raining outside','Move quickly to reduce exposure'],ans:0},
    {s:'While building a case cart you verify each item against the pick list but do not inspect the packages. A colleague reminds you. Why does this matter?',opts:['Inspection is only needed at sterilization','The pick list alone is sufficient','Each package must be inspected for integrity before it goes on the cart','Inspection is the OR staff\'s responsibility'],ans:2},
    {s:'The pick list you are working from lists a different surgeon and date than the schedule you received. What do you do?',opts:['Use the pick list, it is usually right','Stop and verify surgeon, procedure, and date, resolving the discrepancy before building the cart','Use whichever is closer to today','Build both carts to be safe'],ans:1},
    {s:'A recall notice arrives. You immediately stop use and complete the documentation, but leave the affected items on the shelf. What key step is missing?',opts:['Quarantine the affected items so they cannot be used','Nothing, documentation is enough','Re-sterilize them right away','Notify the manufacturer only'],ans:0},
    {s:'A recall affects a lot of items, some already delivered to the OR on case carts. What is the correct response?',opts:['Only address items still in SPD','Wait until the cases are finished','Identify affected items by lot and dates, communicate to stop their use, quarantine them, and follow the facility recall protocol','Assume the OR will notice'],ans:2},
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
    {q:'Why moisture in channels creates risk?',opts:['Electrical shorts','Residual water supports bacterial growth and biofilm','Degrades disinfectant','Makes scope heavy'],ans:1},
    {q:'HLD is used to process which category of items?',opts:['Critical items','Semi-critical items','Non-critical items','Environmental surfaces'],ans:1},
    {q:'Correct cleaning removes up to what percentage of bioburden?',opts:['50%','75%','90%','99.9%'],ans:3},
    {q:'Which of the following is a channel found in a flexible endoscope?',opts:['Cooling channel','Optical fiber channel','Suction channel','Battery channel'],ans:2},
    {q:'What makes flexible endoscope reprocessing especially complex?',opts:['Their multiple internal channels','Their large size','Their metal construction','Their disposable design'],ans:0},
    {q:'Which of the following is a part of a flexible endoscope?',opts:['Rigid hinge','Steam port','Cutting jaw','Bending section'],ans:3},
    {q:'When should bedside pre-cleaning of an endoscope be performed?',opts:['Immediately after the procedure at the bedside','The next morning','Only if the scope looks soiled','After leak testing'],ans:0},
    {q:'How thoroughly should endoscope channels be brushed?',opts:['One quick pass','Brushed completely through, with multiple passes until clean','Only the suction channel','Brushing is optional if the channel is flushed'],ans:1},
    {q:'Typical soak time for OPA high-level disinfectant?',opts:['1 minute','5 minutes','12 minutes','60 minutes'],ans:2},
    {q:'Which HLD agent is known for a strong odor and longer contact time?',opts:['OPA','Glutaraldehyde','Peracetic acid','Isopropyl alcohol'],ans:1},
    {q:'Which HLD agent is described as rapid and automated?',opts:['Glutaraldehyde','OPA','Peracetic acid','Hydrogen peroxide gas'],ans:2},
    {q:'What must be verified before starting an AER cycle?',opts:['The disinfectant level and concentration','The room temperature','The scope color','The technician schedule'],ans:0},
    {q:'How many scope channels must be connected in an AER?',opts:['Only the instrument channel','Only the main channel','As many as convenient','All channels, per the IFU'],ans:3},
    {q:'What is the first drying step after HLD?',opts:['Store the scope immediately','Purge the channels with air','Coil the scope in a drawer','Apply lubricant'],ans:1},
    {q:'Who sets the maximum hang time for stored endoscopes?',opts:['The facility','The manufacturer only','The physician','There is no limit'],ans:0},
    {q:'Which item must be documented after endoscope reprocessing?',opts:['The weather that day','The number of people in the room','The leak test result','The scope purchase price'],ans:2},
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
    {s:'After reprocessing, you store a scope in the cabinet but forget to remove the valves. A coworker points this out. What is the risk?',opts:['No risk','Valves left on prevent air circulation through channels, allowing moisture to remain and bacteria to grow','Only matters for storage over 24 hours','Valves protect the channels'],ans:1},
    {s:'A new technician tells you that high-level disinfection sterilizes an endoscope and kills every microorganism, including all spores. How should you respond?',opts:['She is correct, HLD is the same as sterilization','HLD destroys all microorganisms except high numbers of spores; it is not the same as sterilization','HLD only kills viruses','Spores are not a concern with scopes'],ans:1},
    {s:'The schedule is running behind, so a colleague suggests skipping thorough manual cleaning and going straight to HLD. What is the correct response?',opts:['Skip cleaning to save time','Do a light rinse only','Cleaning is the most important step and removes up to 99.9% of bioburden; it cannot be skipped before HLD','HLD compensates for missed cleaning'],ans:2},
    {s:'A technician manually cleans only the instrument channel and ignores the suction and air/water channels. Why is this inadequate?',opts:['All channels must be cleaned and brushed; untreated channels remain contaminated','Only the instrument channel matters','The AER will clean the rest','Air/water channels do not get soiled'],ans:0},
    {s:'A used endoscope was not pre-cleaned at the bedside and has sat for several hours with dried secretions. What is the concern?',opts:['No concern, cleaning is cleaning','It can go straight to HLD','It should be discarded','Pre-cleaning should occur immediately at the bedside; dried soil is harder to remove, so follow the manufacturer cleaning protocol carefully'],ans:3},
    {s:'A technician is about to immerse an endoscope in cleaning solution without performing a leak test. A colleague stops them. Why?',opts:['Leak testing is only needed monthly','The leak test must be performed before immersion to detect leaks and prevent fluid damage to a compromised scope','Leak testing is done after HLD','It is fine to skip if the scope looks intact'],ans:1},
    {s:'While brushing a channel, debris is still visible on the brush after the first pass. What should the technician do?',opts:['Move on to HLD','One pass is always sufficient','Continue brushing the channel completely through with multiple passes until it comes clean','Rinse only and proceed'],ans:2},
    {s:'A technician plans to use OPA from a freshly opened container and says testing the concentration is unnecessary because it is new. What is correct?',opts:['MEC must be tested before each use, regardless of whether the container is new','A new container never needs testing','Test the concentration only weekly','Testing is optional for OPA'],ans:0},
    {s:'A technician soaking an item in glutaraldehyde removes it well before the required contact time to speed things up. What is the problem?',opts:['Contact time does not matter','Glutaraldehyde works instantly','Any soak time is acceptable','Glutaraldehyde requires a longer contact time; the full required contact time must be met for effective disinfection'],ans:3},
    {s:'A technician loads a scope into the AER and starts the cycle without checking the disinfectant. What pre-cycle step was missed?',opts:['Checking the room lights','Verifying the disinfectant level and concentration before the cycle','Coiling the scope','Removing the printout'],ans:1},
    {s:'An AER cycle finishes, but the technician leaves the wet scope sitting on the counter for an hour before drying. Why is this a problem?',opts:['Wet storage is fine after AER','The scope is already sterile','Drying should begin immediately after the cycle; residual moisture supports bacterial growth','Air drying on the counter is preferred'],ans:2},
    {s:'A technician stores a reprocessed endoscope coiled in a closed drawer with the caps and valves still attached. What is the correct storage method?',opts:['Store vertically in a ventilated cabinet with valves removed and caps off','Coiling in a drawer is acceptable','Leave valves on to protect the channels','Any dry location works'],ans:0},
    {s:'Facility protocol calls for an alcohol flush during drying, but a technician skips it to save time. What is correct?',opts:['An alcohol flush is never needed','Skipping it is fine if the scope looks dry','Only the final air purge matters','If protocol calls for an alcohol flush, it must be performed, followed by a final air purge'],ans:3},
    {s:'After reprocessing, a technician records most steps but forgets the disinfectant lot number and expiration. What must be done?',opts:['Complete the record; disinfectant lot and expiration are required documentation','Leave it blank, it is minor','Documentation is optional','Record it only if a problem arises later'],ans:0},
    {s:'An infection-control investigation needs to determine which patient a specific scope was used on. Why is complete reprocessing documentation critical?',opts:['It is only for billing','Records including scope ID and patient ID provide the traceability needed for such investigations','Documentation is unrelated to patient tracing','Only the AER cares about it'],ans:1},
    {s:'The ventilation fan in the endoscope storage cabinet is broken. What is the appropriate action?',opts:['Keep using it, ventilation is optional','Cover the scopes with plastic instead','Report the problem and store scopes in a properly ventilated cabinet; ventilation helps keep channels dry','Store the scopes horizontally until it is fixed'],ans:2},
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
    {q:'Benchmarking is?',opts:['Setting a timer','Comparing performance to standards or peers','Counting instruments on bench','Marking instruments for ID'],ans:1},
    {q:'How does the module define quality in SPD?',opts:['Processing trays as quickly as possible','Consistently delivering instruments safe for patient use','Passing the annual survey with no findings','Using the newest equipment available'],ans:1},
    {q:'Which of the following is a quality indicator tracked in SPD?',opts:['Cafeteria satisfaction scores','Employee commute times','Case cart accuracy','Vendor pricing trends'],ans:2},
    {q:'What are the four steps of the quality data cycle?',opts:['Collect, Analyze, Act, Monitor','Plan, Do, Check, Act','Observe, Record, File, Archive','Report, Review, Retrain, Repeat'],ans:0},
    {q:'An error that reaches the patient is classified as what type of event?',opts:['Near-miss','Sentinel event','Process variance','Adverse event'],ans:3},
    {q:'What defines a sentinel event?',opts:['Any error caught before reaching the patient','Death or serious harm','A failed Bowie-Dick test','Any event that requires documentation'],ans:1},
    {q:'Which events should be reported in SPD?',opts:['Only sentinel events','Only events that harmed a patient','All events, including near-misses','Only events witnessed by a supervisor'],ans:2},
    {q:'Contributing factors examined in root cause analysis include human, equipment, process, environmental, communication, and which other category?',opts:['Organizational','Budgetary','Legal','Promotional'],ans:0},
    {q:'Root cause analysis is designed to identify:',opts:['The individual who should be disciplined','The cost of the error','The fastest available workaround','The underlying causes of a problem'],ans:3},
    {q:'In the PDCA cycle, what does the Do step involve?',opts:['Implementing the change department-wide at once','Implementing the change on a small scale','Documenting the original problem','Delegating the problem to leadership'],ans:1},
    {q:'In the PDCA cycle, what happens during the Check step?',opts:['Results of the change are measured','Staff schedules are verified','The budget is approved','The policy manual is signed'],ans:0},
    {q:'During the Act step of PDCA, the options are to:',opts:['Assign, approve, or announce the change','Audit, archive, or appeal the change','Adopt, modify, or abandon the change','Approve, fund, or outsource the change'],ans:2},
    {q:'Which of the following is listed among the key organizations for SPD standards and oversight?',opts:['AARP','AMA','ADA','AAMI'],ans:3},
    {q:'In addition to policies and documentation, surveyors check which of the following?',opts:['Water quality and BI/Bowie-Dick testing','Employee salary records','Department marketing materials','Patient billing accuracy'],ans:0},
    {q:'Which of the following is a characteristic of a quality culture?',opts:['Blame-focused error reviews','Keeping concerns private until proven','Open communication','Competition between shifts'],ans:2},
    {q:'Which set of daily actions supports a quality culture?',opts:['Work fast, stay quiet, cover for teammates','Do your job right, speak up, support the team, keep learning','Focus only on your own assigned tasks','Report only errors that reach patients'],ans:1},
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
    {s:'You notice the same type of instrument keeps failing inspection across multiple trays. What quality action should you take?',opts:['Keep removing them one at a time','Report the pattern. Recurring failures suggest a systemic issue: vendor quality, cleaning process, or handling problem. Pattern identification prevents future failures','It is just coincidence','Only report after 10 failures'],ans:1},
    {s:'A tray that was improperly sterilized was used in surgery, and the patient suffered serious harm as a result. How is this event classified?',opts:['Near-miss, because SPD did not intend the error','Adverse event, because the patient was involved','Sentinel event, because it resulted in serious harm','It is not classified until legal review is complete'],ans:2},
    {s:'Last month your team began a new drying protocol on a single sterilizer to reduce wet packs, the Do step of PDCA. What should happen next?',opts:['Roll the protocol out to all sterilizers immediately','Check: measure wet pack results on that sterilizer before deciding anything','Abandon the protocol since one month is enough time','Skip to Act and write the new policy'],ans:1},
    {s:'Your PDCA Check step shows the small-scale change cut wet packs in half but created turnaround delays. Under the Act step, what are your options?',opts:['Adopt, modify, or abandon the change; here modifying it to address the delays may be appropriate','Adopt it unchanged since wet packs improved','Abandon it entirely since delays occurred','Restart the whole cycle and discard the data'],ans:0},
    {s:'Three months of case cart accuracy data has been collected, but no one has reviewed it. According to the quality data cycle, what is the missing step?',opts:['Collect more data first','Archive the data for the next survey','Analyze the data so the department can act on it','Delete data older than 30 days'],ans:2},
    {s:'An RCA into a set error finds the technician was new, the count sheet was outdated, and the assembly area lighting was poor. What does this finding illustrate?',opts:['The new technician was the root cause','Problems usually stem from multiple contributing factors: human, process, and environmental','Only equipment factors matter in RCA','The RCA should be repeated until one person is identified'],ans:1},
    {s:'During a 5 Whys exercise, the team stops after two whys at \'the tech was rushed.\' What should you suggest?',opts:['Accept the answer; two whys is the standard','Discipline the tech for rushing','Move straight to writing a new policy','Keep asking why until the true root cause is found, such as why the tech was rushed'],ans:3},
    {s:'You learn that several staff members have each quietly corrected the same labeling mistake without reporting it. Why does this matter?',opts:['It does not matter because each error was fixed','Labeling mistakes are too minor to report','Reporting would embarrass the staff involved','Multiple reports of the same issue would reveal a systemic problem that can be fixed at the process level'],ans:3},
    {s:'During a survey, an inspector asks a technician to demonstrate how they verify the cleaning steps for a specific device. What is the surveyor assessing?',opts:['The technician\'s seniority','Staff competency and IFU compliance, which surveyors routinely check','Whether the device is under warranty','The department\'s staffing budget'],ans:1},
    {s:'Before an upcoming survey, a coworker asks why water quality records matter to SPD. What is the best answer?',opts:['Water quality is one of the items surveyors check in SPD','They do not; water quality is a facilities issue only','They only matter if a sterilizer has failed','Water quality records are optional documentation'],ans:0},
    {s:'You observe a practice on another shift that you believe creates a patient safety risk. It is not your shift or your assignment. What does a quality culture expect of you?',opts:['Stay out of it; it is not your responsibility','Mention it only if someone asks you directly','Speak up through open communication; quality culture is patient-centered','Wait to see if an error actually occurs'],ans:2},
    {s:'A newer technician is struggling with assembly accuracy. How does a quality culture respond?',opts:['Report them to management for discipline','Reassign them to decontamination permanently','Let them figure it out on their own','Support the teammate and treat the struggle as a learning opportunity, not a blame situation'],ans:3},
    {s:'Your department meets every baseline quality requirement each month. A colleague says that means no further changes are needed. How do you respond?',opts:['Agree; meeting the baseline is the end goal','Improvement is only needed after a failure','Only leadership decides whether to improve','QA ensures the baseline, but QI means continuously improving beyond it'],ans:3},
    {s:'Your manager wants to know whether tray assembly quality is improving. Which indicator most directly measures this?',opts:['BI pass rate','IUSS rate','Set error rate','Instrument repair turnaround'],ans:2},
    {s:'A contaminated instrument was used during a procedure, but the patient has shown no harm so far. A coworker calls it a near-miss. Is that correct?',opts:['No; it reached the patient, so it is an adverse event. A near-miss is caught before the patient','Yes; no harm means it is a near-miss','It automatically becomes a sentinel event','It is not reportable unless harm develops'],ans:0},
    {s:'You realize you made an assembly error yesterday on a tray that has already gone to sterile storage. No one else knows. What do you do?',opts:['Report it immediately so the tray can be pulled and corrected; accountability means owning your errors','Quietly fix it if the tray comes back to SPD','Say nothing; it will probably be caught downstream','Wait to see if the OR complains'],ans:0},
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
    {q:'First step in your development plan?',opts:['Wait for supervisor','Write down goals and share with supervisor','Apply for most advanced cert','Transfer departments'],ans:1},
    {q:'According to the module, SPD has evolved from a support function into:',opts:['A fully automated service','A recognized healthcare profession','A clerical support role','An outsourced hospital function'],ans:1},
    {q:'Which of the following is listed as a professional characteristic?',opts:['Seniority','Physical strength','Accountability','Popularity'],ans:2},
    {q:'Which organization offers the CSPDT certification?',opts:['CBSPD','HSPA','AAMI','AORN'],ans:0},
    {q:'The CER certification focuses on which area?',opts:['Leadership','Instrument repair','Quality auditing','Endoscope reprocessing'],ans:3},
    {q:'The CHL certification is intended for which role?',opts:['Entry-level technicians','Leaders','Endoscope technicians','Vendors'],ans:1},
    {q:'What does the module say about state requirements for certification?',opts:['No states require certification','Certification is only required federally','Many states mandate certification','Only managers must be certified'],ans:2},
    {q:'Which exam-day practice does the module recommend?',opts:['Arrive early and manage your time','Stay up late for a final review','Skip questions that look long','Leave as soon as you finish'],ans:0},
    {q:'Which exam preparation strategy is listed in the module?',opts:['Study only unofficial summaries','Avoid practice tests to reduce anxiety','Study alone to avoid distraction','Connect your study material to daily practice'],ans:3},
    {q:'Which of the following is listed as a source of continuing education credits?',opts:['Webinars and journals','Overtime hours worked','Years of experience','Employee evaluations'],ans:0},
    {q:'When must CE credits be earned to maintain certification?',opts:['Only before the initial exam','During each renewal cycle','Once every ten years','Only when changing employers'],ans:1},
    {q:'Which of the following is a specialty path listed in the module?',opts:['Radiology','Phlebotomy','Consulting','Respiratory therapy'],ans:2},
    {q:'What is the highest position on the career ladder described in the module?',opts:['Manager','Supervisor','Educator/Preceptor','Director'],ans:3},
    {q:'Which of the following is a networking opportunity mentioned in the module?',opts:['Local chapters and conferences','Hospital board meetings','Patient support groups','Vendor sales presentations'],ans:0},
    {q:'Which three organizations are listed as professional resources for SPD?',opts:['TJC, FDA, CDC','HSPA, CBSPD, AAMI','OSHA, CMS, EPA','AMA, ANA, ACS'],ans:1},
    {q:'After writing down your goals and sharing them with your supervisor, what does the module say to do?',opts:['Wait for your annual review to revisit them','Keep the goals private until achieved','Identify resources and take the first step today','Set entirely new goals each month'],ans:2},
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
    {s:'You set a SMART goal: "Get better at my job." Is this a good goal?',opts:['Yes, it covers everything','No; it is not specific, measurable, or time-bound. A SMART goal would be: "Pass the CIS exam within 12 months by studying 30 minutes daily and completing 2 practice tests monthly"','Goals do not need to be specific','Only managers need SMART goals'],ans:1},
    {s:'You have registered for the CRCST exam eight months from now. A coworker advises waiting until the final month to begin studying. What is the better approach per the module?',opts:['Wait; studying early just leads to forgetting','Start early with official study materials and practice tests','Skip studying; work experience is enough','Study only the topics you already know well'],ans:1},
    {s:'It is the night before your certification exam and you feel unprepared, so you consider reviewing all night. What does the module recommend for exam day readiness?',opts:['Stay up and cram; every hour counts','Review until 3 a.m. and then sleep in','Sleep well, arrive early, read carefully, and manage your time','Arrive at the last minute to reduce nerves'],ans:2},
    {s:'You hold a CRCST and spend most of your time in endoscope reprocessing, which you enjoy. Which advanced certification best aligns with this interest?',opts:['CER','CHL','CIS','CSPDT'],ans:0},
    {s:'You cannot travel to any conferences this year but still need CE credits for renewal. What options does the module identify?',opts:['None; conferences are the only source','Ask your certifying body for an exemption','Carry over next year\'s credits','Online courses, webinars, journals, and in-service education'],ans:3},
    {s:'A recruiter from an instrument manufacturer approaches you about a role supporting hospital SPD departments. Does the module recognize this career direction?',opts:['Yes; vendor/industry is a listed specialty path','No; leaving the hospital ends an SPD career','Only Directors can move to industry roles','SPD skills do not transfer outside hospitals'],ans:0},
    {s:'A technician tells you they want to become a Director someday. Based on the career ladder in the module, what path should they expect?',opts:['Move directly from Technician to Director with certification','Progress through roles such as Senior/Lead, Supervisor, and Manager on the way to Director','Directors are hired only from nursing','Wait for the current Director to retire'],ans:1},
    {s:'A coworker sets this goal: \'Earn the CER within 18 months by completing one endoscope study module per month and a practice exam each quarter.\' Why does this qualify as a SMART goal?',opts:['It sounds ambitious','It is written down somewhere','It requires no supervisor involvement','It is specific, measurable, achievable, relevant, and time-bound'],ans:3},
    {s:'A friend describes your job as \'just washing instruments.\' Based on the module, what is an accurate response?',opts:['Agree; SPD is only a support function','SPD is a recognized healthcare profession built on knowledge, competence, ethics, and certification','It is unskilled work but pays well','Only nurses do professional work in hospitals'],ans:1},
    {s:'You are asked to sign a competency checklist for a skill you have not actually demonstrated. Which professional characteristics are at stake if you sign?',opts:['None; checklists are a formality','Ethics and accountability','Speed and efficiency','Networking and visibility'],ans:1},
    {s:'You are the only certified technician at a small facility and feel disconnected from the profession. What does the module suggest?',opts:['Accept isolation as part of the job','Change careers to a larger field','Rely only on your original training','Network through local chapters, conferences, and professional groups'],ans:3},
    {s:'You keep losing focus while studying alone for the CSPDT exam. Which module-recommended strategy could help?',opts:['Join a study group','Postpone the exam indefinitely','Study only during work shifts','Memorize practice test answers without review'],ans:0},
    {s:'A technician with strong data skills enjoys tracking department metrics more than bench work. Which listed specialty fits this interest?',opts:['Endoscope specialist','Vendor sales','QA','Anesthesia technology'],ans:2},
    {s:'A new hire with two months of experience wants to sit the CRCST exam right away. What should they understand?',opts:['They can test immediately with no requirements','Only supervisors may take the CRCST','The CRCST requires 400+ hours of experience','They must first earn the CHL'],ans:2},
    {s:'You have a written SMART goal, supervisor support, and identified resources, but you keep postponing the start. What does the module advise?',opts:['Wait until the next performance cycle','Rewrite the goal to be easier','Delegate the goal to a coworker','Take the first step today'],ans:3},
    {s:'A technician says, \'I finished orientation, so my learning is done.\' Based on the professional characteristics in the module, what is wrong with this view?',opts:['Nothing; orientation covers everything','Learning is only required for managers','Continuous learning is a core characteristic of the profession','Learning ends once you are certified'],ans:2},
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
function _fndSaveProgress(p){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.upsertFoundationsProgress){SB.upsertFoundationsProgress(_fndProgToBackend(p)).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Foundations progress');else console.warn('[fnd] progress sync',e&&e.message);});}}catch(e){console.warn('[fnd] progress sync',e);}}
function _fndSaveAssignment(a){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.createFoundationsAssignment){SB.createFoundationsAssignment({staff_id:a.staffId,module_id:a.moduleId,assigned_by:a.assignedBy||null,type:a.type,trigger:a.trigger,assignment_type:a.type,trigger_event:a.trigger,facility_id:a.facilityId||null,assigned_date:a.assignedDate,status:a.status}).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Foundations assignment');else console.warn('[fnd] assignment sync',e&&e.message);});}}catch(e){console.warn('[fnd] assignment sync',e);}}
function _fndSaveAssignmentStatus(staffId,moduleId,status){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.updateFoundationsAssignmentStatus){SB.updateFoundationsAssignmentStatus(staffId,moduleId,status).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Foundations status');else console.warn('[fnd] status sync',e&&e.message);});}}catch(e){}}

// ── Foundations 3-Gate Data Helpers ──
function getFoundationsAssignments(staffId){return (DB.foundationsAssignments||[]).filter(a=>a.staffId===staffId);}
function isModuleAssigned(staffId,moduleId){return (DB.foundationsAssignments||[]).some(a=>a.staffId===staffId&&a.moduleId===moduleId);}
function getModuleGates(staffId,moduleId){
 const p=(DB.foundationsProgress||[]).find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 return p||{g1:{status:'locked',score:0,attempts:[]},g2:{status:'locked',score:0,attempts:[]},g3:{status:'locked',items:[]},complete:false};
}
function isModuleComplete(staffId,moduleId){const p=getModuleGates(staffId,moduleId);return p.complete===true;}
// Returns true if a new assignment was created, false if it was skipped as a
// duplicate (RLS Addendum 8.3 — a UNIQUE(staff_id,module_id) constraint backs
// this; callers surface a toast when skips occur).
function assignModule(staffId,moduleId,assignedBy,type,trigger){
 if(!DB.foundationsAssignments) DB.foundationsAssignments=[];
 if(DB.foundationsAssignments.find(a=>a.staffId===staffId&&a.moduleId===moduleId)) return false;
 const _s=(typeof getStaff==='function')?getStaff(staffId):(DB.staff||[]).find(x=>x.id===staffId);
 const _a={id:'fa-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),staffId,moduleId,assignedBy,type:type||'remediation',trigger:trigger||null,facilityId:_s?_s.fid:null,assignedDate:new Date().toISOString().slice(0,10),status:'assigned'};
 DB.foundationsAssignments.push(_a);
 // Init progress with 3 gates
 if(!DB.foundationsProgress) DB.foundationsProgress=[];
 let _p=DB.foundationsProgress.find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 if(!_p){ _p={staffId,moduleId,g1:{status:'open',score:0,attempts:[]},g2:{status:'open',score:0,attempts:[]},g3:{status:'open',items:[]},complete:false}; DB.foundationsProgress.push(_p); }
 _fndSaveAssignment(_a); _fndSaveProgress(_p);
 return true;
}
// Onboarding bulk-assign. Returns the count of modules actually assigned (skips
// any already assigned, per 8.3) so the caller can report duplicates.
function assignAllModules(staffId,assignedBy){let n=0;FOUNDATIONS_MODULES.forEach(m=>{if(assignModule(staffId,m.id,assignedBy,'onboarding',null))n++;});return n;}
function saveGateScore(staffId,moduleId,gate,score){
 if(!DB.foundationsProgress) DB.foundationsProgress=[];
 let p=DB.foundationsProgress.find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 if(!p){p={staffId,moduleId,g1:{status:'open',score:0,attempts:[]},g2:{status:'open',score:0,attempts:[]},g3:{status:'open',items:[]},complete:false};DB.foundationsProgress.push(p);}
 const g=p[gate];
 g.attempts.push({date:new Date().toISOString().slice(0,10),score});
 // Best score wins; a passed gate never regresses from a practice retake
 g.score=Math.max(g.score||0,score);
 if(score>=80) g.status='pass';
 else if(g.status!=='pass') g.status='attempted';
 // Module complete = 3 passes on G1 AND 3 on G2 (3-pass rule) AND G3 confirmed.
 // Already-complete rows are never demoted here (completion only moves forward).
 if(fndGatePasses(p.g1)>=FND_PASSES_REQUIRED&&fndGatePasses(p.g2)>=FND_PASSES_REQUIRED&&p.g3.status==='pass'){
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
 // 3-pass rule: G3 items cannot be CONFIRMED until 3 Knowledge + 3 Simulation
 // passes are in (unchecking/revoking stays allowed; complete modules exempt).
 if(confirmed&&!p.complete&&!fndObsReady(p)){
   if(typeof toast==='function') toast('Observation is locked: needs 3 Knowledge and 3 Simulation passes first (K '+fndGatePasses(p.g1)+'/'+FND_PASSES_REQUIRED+', S '+fndGatePasses(p.g2)+'/'+FND_PASSES_REQUIRED+').','err');
   return;
 }
 const existing=p.g3.items.find(i=>i.id===itemId);
 if(existing){existing.confirmed=confirmed;existing.confirmedBy=confirmedBy;existing.date=new Date().toISOString().slice(0,10);}
 else{p.g3.items.push({id:itemId,confirmed,confirmedBy,date:new Date().toISOString().slice(0,10)});}
 // Check if all G3 items confirmed. Unchecking cascades (RLS Addendum 8.2): a
 // revoked confirmation reverts G3 pass -> open, and a previously complete
 // module reverts to in-progress (assignment back to 'assigned').
 const m=FOUNDATIONS_MODULES.find(x=>x.id===moduleId);
 if(m){
   const allDone=m.observations.every(o=>p.g3.items.some(i=>i.id===o.id&&i.confirmed));
   if(allDone){p.g3.status='pass';p.g3.score=100;}
   else if(p.g3.status==='pass'){p.g3.status='open';p.g3.score=0;}
 }
 const a=(DB.foundationsAssignments||[]).find(x=>x.staffId===staffId&&x.moduleId===moduleId);
 if(fndGatePasses(p.g1)>=FND_PASSES_REQUIRED&&fndGatePasses(p.g2)>=FND_PASSES_REQUIRED&&p.g3.status==='pass'){
   p.complete=true; if(a)a.status='completed';
 } else if(p.complete){
   p.complete=false; if(a)a.status='assigned';
   _fndSaveAssignmentStatus(staffId,moduleId,'assigned');
 }
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
     html+=fndGateBadge(gates.g1.status)+fndGateBadge(gates.g2.status)+fndGateBadge(gates.g3.status)+'<span style="margin-left:6px">'+fndPassChip(gates)+'</span>';
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
     html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g1.status)+'<span>Knowledge '+Math.min(fndGatePasses(gates.g1),FND_PASSES_REQUIRED)+'/'+FND_PASSES_REQUIRED+(gates.g1.score>0?' ('+gates.g1.score+'%)':'')+'</span></div>';
     html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g2.status)+'<span>Simulation '+Math.min(fndGatePasses(gates.g2),FND_PASSES_REQUIRED)+'/'+FND_PASSES_REQUIRED+(gates.g2.score>0?' ('+gates.g2.score+'%)':'')+'</span></div>';
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
 html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g1.status)+'<span>Knowledge '+Math.min(fndGatePasses(gates.g1),FND_PASSES_REQUIRED)+'/'+FND_PASSES_REQUIRED+'</span></div>';
 html+='<div class="fnd-gate-lbl">'+fndGateBadge(gates.g2.status)+'<span>Simulation '+Math.min(fndGatePasses(gates.g2),FND_PASSES_REQUIRED)+'/'+FND_PASSES_REQUIRED+'</span></div>';
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
 
// Per-attempt shuffled question order + practice-retake flags, keyed moduleId+gateKey.
// The order array maps display index -> original item index; submitFndGate scores
// against it so answers always line up with what the user saw. Each attempt draws
// FND_GATE_DRAW questions from the module's full bank, so attempts vary once the
// bank is larger than the draw.
const FND_GATE_DRAW=10;
let FND_GATE_ORDER={};
let FND_GATE_RETAKE={};
// ── 3-pass rule (client-confirmed 2026-07-13): a G1/G2 gate is DONE after THREE
// passing attempts (>=80%), fresh random questions each attempt; Observation (G3)
// only opens after 3 Knowledge + 3 Simulation passes. Pass counts derive from the
// attempts history already stored on every progress row (no schema change), so
// passes earned before this shipped still count. Instruments reuses these helpers.
const FND_PASSES_REQUIRED=3;
function fndGatePasses(g){return (((g||{}).attempts)||[]).filter(a=>(a.score||0)>=80).length;}
function fndObsReady(gates){return fndGatePasses(gates.g1)>=FND_PASSES_REQUIRED&&fndGatePasses(gates.g2)>=FND_PASSES_REQUIRED;}
function fndPassChip(gates){
 const k=Math.min(fndGatePasses(gates.g1),FND_PASSES_REQUIRED),s2=Math.min(fndGatePasses(gates.g2),FND_PASSES_REQUIRED);
 const c=n=>n>=FND_PASSES_REQUIRED?'#4ade80':'#94a3b8';
 return '<span style="font-size:10.5px;font-weight:700;white-space:nowrap"><span style="color:'+c(k)+'">K '+k+'/'+FND_PASSES_REQUIRED+'</span> <span style="color:'+c(s2)+'">S '+s2+'/'+FND_PASSES_REQUIRED+'</span></span>';
}
function retakeFndGate(moduleId,gateKey){
 FND_GATE_RETAKE[moduleId+gateKey]=true;
 ST._fndTab=gateKey==='g1'?'gate1':'gate2';
 openFndModule(moduleId);
}
function renderFndGateAssessment(m,s,gateKey,items,title,desc){
 const gates=getModuleGates(s.id,m.id);
 const g=gates[gateKey];
 const retake=!!FND_GATE_RETAKE[m.id+gateKey];
 const passes=fndGatePasses(g);
 const gateDone=passes>=FND_PASSES_REQUIRED;
 const locked=gateDone&&!retake;
 const order=shuffleArray(items.map((_,i)=>i)).slice(0,FND_GATE_DRAW);
 FND_GATE_ORDER[m.id+gateKey]=order;
 let h='<div class="fnd-kc">';
 h+='<div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">'+title+'</div>';
 h+='<div style="font-size:12px;color:#94a3b8;margin-bottom:16px">'+desc+'</div>';
 if(locked){
   h+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px;text-align:center;margin-bottom:16px">';
   h+='<div style="font-size:20px;font-weight:700;color:#4ade80">'+passes+' of '+FND_PASSES_REQUIRED+' passes</div>';
   h+='<div style="font-size:13px;color:#4ade80;font-weight:600">Gate Complete &mdash; best score '+g.score+'%</div>';
   h+='<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="retakeFndGate(\''+m.id+'\',\''+gateKey+'\')">Retake (practice)</button></div>';
 } else if(retake&&gateDone){
   h+='<div style="background:rgba(196,154,32,.08);border:1px solid rgba(196,154,32,.25);border-radius:var(--r);padding:10px 14px;margin-bottom:16px;font-size:12px;color:#94a3b8">Practice retake &mdash; your completed gate and best score ('+g.score+'%) are kept even if you score lower.</div>';
 } else if(passes>0){
   h+='<div style="background:rgba(196,154,32,.08);border:1px solid rgba(196,154,32,.25);border-radius:var(--r);padding:10px 14px;margin-bottom:16px;font-size:12px;color:#94a3b8"><b style="color:#fbbf24">Pass '+passes+' of '+FND_PASSES_REQUIRED+'.</b> Take the test again with a fresh set of questions &mdash; every score of 80% or higher counts as a pass. Your best score ('+g.score+'%) is kept.</div>';
 }
 h+='<div id="fnd-gate-questions">';
 const qKey=gateKey==='g1'?'q':'s';
 order.forEach((origIdx,qi)=>{
   const item=items[origIdx];
   h+='<div class="fnd-q" data-qi="'+qi+'">';
   h+='<div class="fnd-q-text">'+(qi+1)+'. '+(item[qKey]||item.q||item.s)+'</div>';
   item.opts.forEach((opt,oi)=>{
     h+='<label class="fnd-q-opt"><input type="radio" name="fnd-'+gateKey+'-'+m.id+'-'+qi+'" value="'+oi+'"'+(locked?' disabled':'')+'><span class="fnd-q-lbl">'+opt+'</span></label>';
   });
   h+='</div>';
 });
 h+='</div>';
 if(!locked){
   h+='<button class="btn btn-gold" style="margin-top:16px;width:100%" onclick="submitFndGate(\''+m.id+'\',\''+gateKey+'\')">Submit</button>';
 }
 h+='<div id="fnd-gate-result"></div></div>';
 return h;
}
 
function renderFndG3View(m,s,gates){
 let h='<div class="fnd-kc">';
 h+='<div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">Observation / Demonstration</div>';
 h+='<div style="font-size:12px;color:#94a3b8;margin-bottom:16px">Your educator or manager confirms each item below after observing you demonstrate the skill in the work environment. You cannot self-confirm these items.</div>';
 if(!gates.complete&&!fndObsReady(gates)){
   h+='<div style="background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.25);border-radius:var(--r);padding:12px 14px;margin-bottom:16px;font-size:12px;color:#94a3b8">Observation unlocks after <b style="color:#e2e8f0">3 Knowledge</b> and <b style="color:#e2e8f0">3 Simulation</b> passes (fresh questions each attempt). Current: '+fndPassChip(gates)+'</div>';
 }
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
     h+='<div style="font-size:11px;color:#64748b;margin-top:2px">Confirmed by '+Security.sanitize(confirmed.confirmedBy||'—')+' on '+Security.sanitize(confirmed.date||'')+'</div></div>';
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
 // Score against the shuffled draw the user actually saw (display idx -> item idx)
 const order=FND_GATE_ORDER[m.id+gateKey]||items.map((_,i)=>i).slice(0,FND_GATE_DRAW);
 delete FND_GATE_RETAKE[m.id+gateKey];
 let correct=0;
 order.forEach((origIdx,qi)=>{
   const sel=document.querySelector('input[name="fnd-'+gateKey+'-'+m.id+'-'+qi+'"]:checked');
   if(sel&&parseInt(sel.value)===items[origIdx].ans) correct++;
 });
 const score=Math.round((correct/order.length)*100);
 saveGateScore(s.id,m.id,gateKey,score);
 const passed=score>=80;
 const gateLabel=gateKey==='g1'?'Knowledge':'Simulation';
 // Highlight answers
 order.forEach((origIdx,qi)=>{
   const item=items[origIdx];
   const opts=document.querySelectorAll('input[name="fnd-'+gateKey+'-'+m.id+'-'+qi+'"]');
   opts.forEach((opt,oi)=>{const lbl=opt.closest('.fnd-q-opt');if(!lbl)return;opt.disabled=true;if(oi===item.ans)lbl.classList.add('fnd-q-correct');else if(opt.checked&&oi!==item.ans)lbl.classList.add('fnd-q-wrong');});
 });
 const rEl=document.getElementById('fnd-gate-result');
 if(rEl){
   if(passed){
     const _g2=getModuleGates(s.id,m.id);
     const _n=Math.min(fndGatePasses(_g2[gateKey]),FND_PASSES_REQUIRED);
     const _done=_n>=FND_PASSES_REQUIRED;
     const _obsNow=_done&&fndObsReady(_g2)&&_g2.g3.status!=='pass';
     rEl.innerHTML='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#4ade80">'+score+'%</div><div style="font-size:13px;color:#4ade80;font-weight:600;margin:4px 0">'+(_done?gateLabel+' Gate Complete &mdash; '+_n+' of '+FND_PASSES_REQUIRED+' passes':gateLabel+' pass '+_n+' of '+FND_PASSES_REQUIRED)+'</div><div style="font-size:12px;color:#94a3b8">'+correct+' of '+order.length+' correct.'+(_done?(_obsNow?' Observation is now unlocked.':''):' Take it again with a fresh set of questions; 80%+ counts as a pass.')+'</div>'+(_done?'':'<button class="btn btn-gold btn-sm" style="margin-top:8px" onclick="openFndModule(\''+moduleId+'\')">Take Again (fresh questions)</button>')+'</div>';
     toast(_done?gateLabel+' gate complete ('+_n+'/'+FND_PASSES_REQUIRED+')':gateLabel+' pass '+_n+' of '+FND_PASSES_REQUIRED,'ok');
   } else {
     rEl.innerHTML='<div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#f87171">'+score+'%</div><div style="font-size:13px;color:#f87171;font-weight:600;margin:4px 0">Not Yet Passing</div><div style="font-size:12px;color:#94a3b8">'+correct+' of '+order.length+' correct. 80% required.</div><button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="openFndModule(\''+moduleId+'\')">Try Again</button></div>';
     toast('Score: '+score+'%. 80% required.','err');
   }
 }
}
 
// ── Hospital Portal: Render Training ──
function renderHTraining(){
 // Renders in the Hospital Portal (h-training) or, for master/staff admins, the
 // Network Admin portal (a-foundations) — same view, container picked by portal.
 const el=document.getElementById(ST.portal==='admin'?'a-foundations':'h-training');if(!el)return;
 // Role scope (RLS Addendum v1.1 section 6): master_admin/admin/staff_admin/assessor see
 // ALL facilities (system-wide); educator/manager/facility_admin/hospital see their own only.
 // Mirrors the Staff Directory / Belt Progress role-filter pattern already in the app.
 const _u=ST.user;
 const isSystemWide=!!(_u&&['master_admin','admin','staff_admin','assessor'].includes(_u.role));
 // On this platform the Assessor IS staff_admin (no legacy literal 'assessor'
 // role existed; new registrations may carry it). Both observe/confirm G3 but
 // never assign (Addendum D1/D3; RLS stays permissive for staff_admin per D1a).
 const isAssessor=!!(_u&&(_u.role==='staff_admin'||_u.role==='assessor'));
 let scopeFacs=DB.facilities.filter(f=>f.active!==false);
 if(isSystemWide&&_u.role==='staff_admin'&&(_u.assignedFids||[]).length) scopeFacs=scopeFacs.filter(f=>_u.assignedFids.includes(f.id));
 let staff;
 if(isSystemWide){
   staff=DB.staff.filter(s=>scopeFacs.some(f=>f.id===s.fid));
   const ff=ST._fndFacFilter||'all';
   if(ff!=='all') staff=staff.filter(s=>s.fid===ff);
 } else {
   staff=DB.staff.filter(s=>s.fid===ST.hFid);
 }
 let totalA=0,totalC=0,staffWith=0;
 const rows=[];
 staff.forEach(s=>{
   const asgns=getFoundationsAssignments(s.id);
   const done=asgns.filter(a=>a.status==='completed').length;
   if(asgns.length>0){staffWith++;totalA+=asgns.length;totalC+=done;}
   rows.push({s,assigned:asgns.length,done,pct:asgns.length>0?Math.round(done/asgns.length*100):0});
 });
 
 let html='<div class="card mb16"><div class="card-hd"><div class="card-ttl">SBD Foundations'+(isSystemWide?' <span style="font-size:11px;color:#64748b;font-weight:500">(all facilities)</span>':'')+'</div></div><div class="card-body">';
 html+='<p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 16px">Assign training modules for onboarding or targeted remediation. Each module requires three gates: Knowledge, Simulation, and Observed Demonstration.</p>';
 if(isSystemWide){
   html+='<div style="margin-bottom:14px"><select class="form-select" style="max-width:280px" onchange="ST._fndFacFilter=this.value;renderHTraining()"><option value="all"'+((ST._fndFacFilter||"all")==="all"?" selected":"")+'>All Facilities</option>'+scopeFacs.slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(f=>'<option value="'+f.id+'"'+(ST._fndFacFilter===f.id?" selected":"")+'>'+f.name+'</option>').join("")+'</select></div>';
 }
 html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:8px">';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Enrolled</div><div class="stat-val">'+staffWith+'</div></div>';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Assigned</div><div class="stat-val">'+totalA+'</div></div>';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Completed</div><div class="stat-val" style="color:#4ade80">'+totalC+'</div></div>';
 html+='<div class="stat-card-mini"><div class="stat-lbl">Rate</div><div class="stat-val">'+(totalA>0?Math.round(totalC/totalA*100):0)+'%</div></div>';
 html+='</div></div></div>';
 
 // Staff table
 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Staff Training</div></div>';
 html+='<div class="card-body" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th>'+(isSystemWide?'<th>Facility</th>':'')+'<th>Belt</th><th>Modules</th><th>Actions</th></tr></thead><tbody>';
 rows.sort((a,b)=>fullName(a.s).localeCompare(fullName(b.s)));
 rows.forEach(r=>{
   html+='<tr><td style="font-weight:600">'+fullName(r.s)+'</td>';
   if(isSystemWide){const _fn=(DB.facilities.find(f=>f.id===r.s.fid)||{}).name||'—';html+='<td style="font-size:12px;color:#94a3b8">'+_fn+'</td>';}
   html+='<td><span class="bb bb-'+r.s.belt+'">'+r.s.belt+'</span></td>';
   html+='<td>'+(r.assigned>0?'<span class="'+(r.pct===100?'tc-ok':r.pct>0?'tc-warn':'tc-muted')+'">'+r.done+'/'+r.assigned+'</span>':'<span class="tc-muted">None</span>')+'</td>';
   html+='<td style="white-space:nowrap">';
   if(r.assigned>0) html+='<button class="btn btn-ghost btn-xs" onclick="hFndStaffDetail(\''+r.s.id+'\')">View</button> ';
   if(!isAssessor){
     if(r.assigned<10) html+='<button class="btn btn-gold btn-xs" onclick="hAssignFndModal(\''+r.s.id+'\')">Assign</button> ';
     if(r.assigned===0) html+='<button class="btn btn-blue btn-xs" onclick="hAssignAllFnd(\''+r.s.id+'\')">All 10</button>';
   }
   html+='</td></tr>';
 });
 html+='</tbody></table></div></div></div>';
 el.innerHTML=html;
}
 
// ── Hospital: Staff Detail with Gate 3 Marking ──
function hFndStaffDetail(staffId){
 const s=getStaff(staffId);if(!s) return;
 const el=document.getElementById(ST.portal==='admin'?'a-foundations':'h-training');if(!el) return;
 const assignments=getFoundationsAssignments(s.id);
 const assignerName=ST.user?ST.user.name:'Manager';
 
 let html='<button class="btn btn-ghost btn-sm" onclick="renderHTraining()" style="margin-bottom:12px">&larr; Back</button>';
 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">'+fullName(s)+'</div><span class="bb bb-'+s.belt+'">'+s.belt+'</span></div>';
 html+='<div class="card-body"><div style="font-size:13px;color:#94a3b8">'+s.role+'</div></div></div>';
 
 FOUNDATIONS_MODULES.forEach(m=>{
   if(!isModuleAssigned(s.id,m.id)) return;
   const gates=getModuleGates(s.id,m.id);
   const a=assignments.find(x=>x.moduleId===m.id);
   html+='<div class="card mb16"><div class="card-hd" style="flex-wrap:wrap;gap:8px">';
   html+='<div style="display:flex;align-items:center;gap:8px"><div class="fnd-num'+(gates.complete?' fnd-num-done':'')+'">'+m.num+'</div>';
   html+='<div class="card-ttl" style="font-size:14px;margin:0">'+m.title+'</div></div>';
   html+='<div style="display:flex;gap:4px;align-items:center">'+fndGateBadge(gates.g1.status)+fndGateBadge(gates.g2.status)+fndGateBadge(gates.g3.status);
   html+='<span style="margin-left:6px">'+fndPassChip(gates)+'</span>';
   // Unassign: RLS Addendum matrix -- delete assignments is Master Admin ONLY.
   if(ST.user&&ST.user.role==='master_admin') html+='<button class="btn btn-ghost btn-xs" style="margin-left:8px;border-color:rgba(239,68,68,.4);color:#f87171" onclick="hUnassignFnd(\''+s.id+'\',\''+m.id+'\')">Unassign</button>';
   html+='</div>';
   html+='</div><div class="card-body" style="padding-top:0">';
   // Gate status
   html+='<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:#94a3b8">';
   html+='<span>G1: '+(gates.g1.status==='pass'?'<span class="tc-ok">'+gates.g1.score+'%</span>':'<span class="tc-muted">'+gates.g1.status+'</span>')+'</span>';
   html+='<span>G2: '+(gates.g2.status==='pass'?'<span class="tc-ok">'+gates.g2.score+'%</span>':'<span class="tc-muted">'+gates.g2.status+'</span>')+'</span>';
   html+='<span>G3: '+(gates.g3.status==='pass'?'<span class="tc-ok">Confirmed</span>':'<span class="tc-warn">Pending</span>')+'</span>';
   html+='</div>';
   // Audit trail (Addendum 7.1): who assigned this, when, why, and what triggered it.
   if(a){
     const _typeLbl=a.type==='onboarding'?'Onboarding':'Remediation';
     html+='<div style="font-size:11px;color:#64748b;margin-bottom:12px">Assigned by '+Security.sanitize(a.assignedBy||'—')+(a.assignedDate?' · '+Security.sanitize(a.assignedDate):'')+' · '+_typeLbl+(a.trigger?' · Trigger: '+Security.sanitize(a.trigger):'')+'</div>';
   }
   // Gate 3 observation items (editable by manager). Rendered even after G3
   // passes so a mis-click can be un-confirmed — the revoke cascade (Addendum
   // 8.2) in markG3Item + the server trigger handle the revert.
   html+='<div style="font-size:12px;font-weight:600;color:#c49a20;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Gate 3: Confirm Observed Demonstrations</div>';
   m.observations.forEach(obs=>{
     const confirmed=gates.g3.items.find(i=>i.id===obs.id&&i.confirmed);
     html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">';
     html+='<input type="checkbox" style="accent-color:#4ade80;flex-shrink:0" '+(confirmed?'checked':'')+' onchange="markFndG3(\''+s.id+'\',\''+m.id+'\',\''+obs.id+'\',this.checked)">';
     html+='<span style="font-size:12.5px;color:'+(confirmed?'#4ade80':'#94a3b8')+'">'+obs.text+'</span>';
     html+='</div>';
   });
   html+='</div></div>';
 });
 el.innerHTML=html;
}
function markFndG3(staffId,moduleId,itemId,checked){
 const assignerName=ST.user?ST.user.name:'Manager';
 markG3Item(staffId,moduleId,itemId,checked,assignerName);
 hFndStaffDetail(staffId);
}

// Unassign a module (Master Admin only, per the RLS Addendum matrix). The
// assignment row is removed; the progress row is KEPT as the historical
// attempt record (Addendum 8.4), so re-assigning later resumes the history.
function hUnassignFnd(staffId,moduleId){
 if(!(ST.user&&ST.user.role==='master_admin')){toast('Only the Master Admin can unassign modules','err');return;}
 if(!confirm('Unassign this module? The staff member loses access; progress history is kept.'))return;
 DB.foundationsAssignments=(DB.foundationsAssignments||[]).filter(a=>!(a.staffId===staffId&&a.moduleId===moduleId));
 try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.deleteFoundationsAssignment){SB.deleteFoundationsAssignment(staffId,moduleId).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Foundations unassign');});}}catch(e){}
 toast('Module unassigned','info');
 if(getFoundationsAssignments(staffId).length>0) hFndStaffDetail(staffId); else renderHTraining();
}
 
// ── Hospital: Assignment Modal ──
function hAssignFndModal(staffId){
 if(ST.user&&(ST.user.role==='staff_admin'||ST.user.role==='assessor')){toast('Assessors cannot assign modules','err');return;}
 const s=getStaff(staffId);if(!s) return;
 const existing=getFoundationsAssignments(s.id);
 const unassigned=FOUNDATIONS_MODULES.filter(m=>!existing.some(a=>a.moduleId===m.id));
 if(!unassigned.length){toast('All modules assigned','info');return;}
 let html='<div style="margin-bottom:12px;font-size:13px;color:#94a3b8">Assign to <strong style="color:#e2e8f0">'+fullName(s)+'</strong>:</div>';
 // Audit trail (Addendum 7.1): capture why this was assigned. Onboarding needs
 // no trigger; remediation records the gate failure / incident that prompted it.
 html+='<div style="margin-bottom:12px"><label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px">Reason</label>';
 html+='<select id="fnd-assign-type" class="form-select" onchange="var w=document.getElementById(\'fnd-trigger-wrap\');if(w)w.style.display=this.value===\'remediation\'?\'block\':\'none\'">';
 html+='<option value="remediation">Remediation (targeted retraining)</option>';
 html+='<option value="onboarding">Onboarding</option>';
 html+='</select></div>';
 html+='<div id="fnd-trigger-wrap" style="margin-bottom:12px"><label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px">Trigger event <span style="color:#64748b">(gate failure or incident reference, optional)</span></label>';
 html+='<input id="fnd-assign-trigger" type="text" class="form-input" placeholder="e.g. G2 fail 2026-07-01 or incident #123"></div>';
 html+='<div style="max-height:300px;overflow-y:auto">';
 unassigned.forEach(m=>{
   html+='<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;font-size:13px;color:#cbd5e1">';
   html+='<input type="checkbox" class="fnd-assign-cb" value="'+m.id+'" style="accent-color:#c49a20">';
   html+='<span><strong>'+m.num+'.</strong> '+m.title+'</span></label>';
 });
 html+='</div><div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">';
 html+='<button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button>';
 html+='<button class="btn btn-gold btn-sm" onclick="hDoAssignFnd(\''+s.id+'\')">Assign</button></div>';
 openModal('Assign Foundations',html,'modal-sm');
}
function hDoAssignFnd(staffId){
 if(ST.user&&(ST.user.role==='staff_admin'||ST.user.role==='assessor')){toast('Assessors cannot assign modules','err');return;}
 const cbs=document.querySelectorAll('.fnd-assign-cb:checked');
 if(!cbs.length){toast('Select at least one','err');return;}
 const nm=ST.user?ST.user.name:'Manager';
 const typeEl=document.getElementById('fnd-assign-type');
 const type=(typeEl&&typeEl.value==='onboarding')?'onboarding':'remediation';
 const trigEl=document.getElementById('fnd-assign-trigger');
 const trigger=(type==='remediation'&&trigEl&&trigEl.value.trim())?trigEl.value.trim():null;
 let assigned=0,skipped=0;
 cbs.forEach(cb=>{ if(assignModule(staffId,cb.value,nm,type,trigger)) assigned++; else skipped++; });
 closeModal();
 if(assigned) toast(assigned+' module'+(assigned>1?'s':'')+' assigned','ok');
 if(skipped) toast(skipped+' already assigned — skipped','info');
 renderHTraining();
}
function hAssignAllFnd(staffId){
 if(ST.user&&(ST.user.role==='staff_admin'||ST.user.role==='assessor')){toast('Assessors cannot assign modules','err');return;}
 const assigned=assignAllModules(staffId,ST.user?ST.user.name:'Manager');
 const skipped=FOUNDATIONS_MODULES.length-assigned;
 if(!assigned) toast('All 10 modules already assigned','info');
 else{ toast(assigned+' module'+(assigned>1?'s':'')+' assigned','ok'); if(skipped) toast(skipped+' already assigned — skipped','info'); }
 renderHTraining();
}
