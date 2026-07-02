// SBD_Instruments_Code.js
// ============================================================
// SBD INSTRUMENTS - STANDALONE CODE EXTRACTION
// ============================================================
// INTEGRATION INSTRUCTIONS:
//
// 1. NAV ITEMS TO ADD:
//    Staff Portal: Add nav item with data-view="s-instruments" after Foundations
//    Hospital Portal: Add nav item with data-view="h-instruments" after Foundations
//
// 2. VIEW CONTAINERS TO ADD:
//    Staff: <div id="s-instruments" class="hidden"></div>
//    Hospital: <div id="h-instruments" class="hidden"></div>
//
// 3. VIEW ARRAYS TO UPDATE:
//    renderSView: add 's-instruments' to the forEach array
//    renderHView: add 'h-instruments' to the forEach array
//
// 4. FUNCTION MAP TO UPDATE:
//    Staff:   's-instruments': renderSInstruments,
//    Hospital: 'h-instruments': () => renderHInstruments(),
//
// 5. DB KEYS TO ADD:
//    Add 'instrumentAssignments' and 'instrumentProgress' to _DB_SAVE_KEYS
//    Add: if(!DB.instrumentAssignments) DB.instrumentAssignments = [];
//    Add: if(!DB.instrumentProgress) DB.instrumentProgress = [];
//
// 6. CSS: Shares the same CSS as Foundations (fnd-* classes).
//    No additional CSS needed if Foundations CSS is already added.
//
// 7. DEPENDENCIES: This code uses these existing platform functions:
//    getStaff(), fullName(), saveDemoData(), showToast(),
//    openModal(), closeModal(), fndGateBadge() (defined in Foundations code)
//
// IMPORTANT: Foundations code MUST be loaded before Instruments code
// because Instruments reuses fndGateBadge() from Foundations.
//
// ============================================================
 
// ============================================================ INSTRUMENT MASTERY (3-GATE MODEL)
// 4 modules by belt level: White (30), Yellow (+20=50), Green (+25=80), Blue (+20=100)
// Same 3-Gate engine as Foundations. Separate DB keys: instrumentAssignments, instrumentProgress
 
const INSTRUMENT_MODULES = [
 {id:'im-wb',num:1,title:'White Belt Instruments',subtitle:'30 Instruments, 6 Tray Sets',belt:'White',domain:'Foundation Instrumentation',
  desc:'Seven instrument categories, 30 named instruments, and 6 foundational tray sets. Identification by name, category, and basic inspection awareness.',
  sections:['Cutting & Dissecting','Grasping & Holding','Clamping & Occluding','Retracting & Exposing','Suturing & Stapling','Irrigation & Suctioning','Measuring & Probing','White Belt Tray Sets'],
  sectionContent:[
    'Scalpel handles (#3, #4, #7): flat with blade groove. Mayo scissors (straight and curved): heavy, short. Metzenbaum scissors: longer, lighter, curved blades. Iris scissors: very small, fine tips. Tissue scissors: general cutting.',
    'Tissue forceps (smooth and toothed): tweezers-style. Adson forceps: small, fine tips. Russian forceps: circular serrated tips. Allis clamps: teeth for grasping tissue. Babcock clamps: smooth jaws for delicate tissue. DeBakey forceps: long, atraumatic serrations.',
    'Kelly clamps (curved and straight): medium hemostats. Kocher clamps: heavy with teeth at tips. Mosquito clamps: small, delicate. Rochester-Pean clamps: large, heavy. Towel clamps: perforating or non-perforating for securing drapes. All have box locks and ratchets.',
    'Army-Navy retractors: double-ended, handheld. Richardson retractors: right-angle blade. Deaver retractors: large curved blade for deep retraction. Weitlaner self-retaining retractors: ratcheted, holds itself open. Rake retractors: pronged for skin.',
    'Mayo-Hegar needle holders: standard, cross-hatched jaws. Webster needle holders: smaller for fine suturing. Olsen-Hegar needle holders: combines needle holder with scissors. Heaney needle holders: heavy, for deep pelvic suturing.',
    'Yankauer suction: large, rigid, most common. Poole suction: multiple holes along shaft for pooled fluid. Bulb syringe: manual irrigation. Frazier suction: small, used in neuro and ortho for precise suctioning.',
    'Probes (straight and malleable): smooth rounded tips for exploring. Dilators: graduated sizes to enlarge openings. Depth gauges: plunger with graduated measurements for screw sizing.',
    'Basic Soft Tissue Set: scalpel handles, scissors, forceps, needle holders, retractors, clamps, Yankauer. Minor Procedure Tray: limited instruments for wound closures and small procedures. Basin Set: basins, graduated pitcher, medicine cup. Lap/General Surgery Basic Set: extended soft tissue with larger retractors and bowel clamps. Laparoscopic Basic Tray: trocars, lap scissors, graspers, clip applier. Orthopedic Basic Soft Tissue Set: heavier instruments, periosteal elevators, bone curettes.'
  ],
  questions:[
    {q:'What distinguishes Metzenbaum scissors from Mayo scissors?',opts:['They are identical','Metzenbaum are longer and lighter with curved blades; Mayo are heavier and shorter','Mayo are always curved; Metzenbaum are always straight','Metzenbaum are for bone; Mayo are for tissue'],ans:1},
    {q:'What type of instrument is a Kelly clamp?',opts:['Retractor','Forceps','Hemostat/clamping instrument with box lock and ratchet','Scissors'],ans:2},
    {q:'DeBakey forceps are identified by their:',opts:['Teeth at the tips','Long atraumatic serrated jaws','Ratchet mechanism','Double-ended blades'],ans:1},
    {q:'What is the key feature of a Weitlaner retractor?',opts:['It is handheld only','It is self-retaining with a ratchet mechanism','It is single-ended','It has no moving parts'],ans:1},
    {q:'What makes an Olsen-Hegar needle holder unique?',opts:['It is the smallest needle holder','It combines a needle holder with built-in scissors','It has no ratchet','It is only for cardiac surgery'],ans:1},
    {q:'How do you distinguish a Yankauer from a Poole suction?',opts:['They are the same','Yankauer has a single opening; Poole has multiple holes along its shaft','Poole is rigid; Yankauer is flexible','Yankauer is smaller'],ans:1},
    {q:'Kocher clamps are distinguished from Kelly clamps by:',opts:['Size only','Kocher clamps have teeth at the tips; Kelly clamps do not','Color coding','Kocher are curved only'],ans:1},
    {q:'What tray set would you expect to find larger retractors (Richardson, Deaver) and bowel clamps?',opts:['Minor Procedure Tray','Basin Set','Lap/General Surgery Basic Set','Laparoscopic Basic Tray'],ans:2},
    {q:'Which instrument category includes Army-Navy and Richardson?',opts:['Cutting and Dissecting','Clamping and Occluding','Retracting and Exposing','Suturing and Stapling'],ans:2},
    {q:'What is a depth gauge used for?',opts:['Measuring temperature','Measuring screw length for orthopedic hardware placement','Measuring blood loss','Testing sterilizer depth'],ans:1}
  ],
  simulations:[
    {s:'You are handed a double-ended handheld retractor. One end has a narrow blade, the other a wider blade. What is it?',opts:['Richardson retractor','Army-Navy retractor','Deaver retractor','Weitlaner retractor'],ans:1},
    {s:'A surgeon requests "a Metz" during a case. Which instrument should be pulled?',opts:['A metallic probe','Metzenbaum scissors','A Mayo scissors','A mallet'],ans:1},
    {s:'You are assembling a Basic Soft Tissue Set and notice the count sheet lists 6 Kelly clamps but you only have 5. What do you do?',opts:['Use 5 and close the tray','Stop. Discrepancy must be resolved before the tray advances. Locate the missing clamp or notify the Lead','Substitute a Mosquito clamp','Add a Kocher to make up the count'],ans:1},
    {s:'You are inspecting a pair of scissors. They cut cleanly at the tips but drag in the middle section. What is your assessment?',opts:['Acceptable for use','The blades are misaligned or dull; remove for repair','Normal for older scissors','Only a problem if they are Iris scissors'],ans:1},
    {s:'A tray arrives with an instrument you cannot identify. It has tweezers-style tips with circular serrated ends. What is it?',opts:['Adson forceps','DeBakey forceps','Russian forceps','Allis clamps'],ans:2},
    {s:'You find a needle holder with smooth, worn jaw surfaces where the cross-hatching used to be. Can it be used?',opts:['Yes, smooth jaws work fine','No, worn jaw cross-hatching means it cannot grip needles securely; remove from service','Only for large needles','Re-sterilize and recheck'],ans:1},
    {s:'Someone hands you a suction device with many small holes along the shaft instead of a single opening at the tip. What is it?',opts:['Yankauer','Frazier','Poole suction','Bulb syringe'],ans:2},
    {s:'You are building a laparoscopic tray. Which instruments would NOT belong?',opts:['Trocars and laparoscopic scissors','Laparoscopic grasper and clip applier','Richardson retractors and Deaver retractors','Suction/irrigation cannula'],ans:2},
    {s:'A clamp in the tray has a ratchet that clicks at position 1 and 3 but slips past position 2. What do you do?',opts:['Use it, two positions work','Remove from service; the ratchet must engage at every position','Oil the mechanism','Only report if it slips at all positions'],ans:1},
    {s:'You pick up a heavy curved retractor blade about 12 inches long with no moving parts. What is it most likely?',opts:['Weitlaner retractor','Army-Navy retractor','Deaver retractor','Rake retractor'],ans:2}
  ],
  observations:[
    {id:'oi1-1',text:'Can name at least five instruments from the Cutting & Dissecting category without reference'},
    {id:'oi1-2',text:'Can distinguish between Kelly, Kocher, and Mosquito clamps by sight'},
    {id:'oi1-3',text:'Can identify all four retractor types (Army-Navy, Richardson, Deaver, Weitlaner) from a mixed set'},
    {id:'oi1-4',text:'Can name all six White Belt tray sets and describe primary contents'},
    {id:'oi1-5',text:'Can distinguish Yankauer from Poole suction by sight and describe the difference'},
    {id:'oi1-6',text:'Can identify a needle holder and describe the jaw cross-hatching inspection point'},
    {id:'oi1-7',text:'Can sort a mixed group of 10+ instruments into correct categories'}
  ]},
 {id:'im-yb',num:2,title:'Yellow Belt Instruments',subtitle:'20 Additional Instruments (Total 50)',belt:'Yellow',domain:'Specialty Instrumentation',
  desc:'Laparoscopic, electrosurgical, orthopedic bone, and neurosurgical instruments. Plus the 9-point inspection standard for all instruments.',
  sections:['Laparoscopic Instruments','Electrosurgical Instruments','Orthopedic Bone Instruments','Neurosurgical Instruments','Other Specialty','9-Point Inspection Standard'],
  sectionContent:[
    '#31 Trocar: port access with sharp/blunt obturator, inspect lumen and valve. #32 Laparoscopic Scissors: insulated shaft, inspect insulation and tip alignment. #33 Laparoscopic Grasper: insulated, inspect jaw closure and ratchet. #34 Laparoscopic Clip Applier: check lumen and jaw mechanism.',
    '#35 Bipolar Forceps: insulation at all contact points, check tips for buildup. #36 Monopolar Electrosurgical Pencil: inspect electrode and insulation, verify activation. Any insulation damage on electrosurgical instruments requires IMMEDIATE removal.',
    '#37 Bone Rongeur: cutting edges for chips, check spring action. #38 Kerrison Rongeur: footplate and cutting edge, check for chips. #39 Pituitary Rongeur: cup jaws, hinge, check for cracks. #40 Periosteal Elevator: blade edge for chips/curling. #41 Curette: cup edge for chips/deformity. #42 Osteotome: cutting edge for chips, handle secure. #43 Mallet: head-handle junction for cracks. #44 Gigli Saw: wire for kinks/breaks, handle attachment. #45 Bone File/Rasp: surface for clogging/corrosion. #46 Stille-Luer Bone Rongeur: jaw edges, spring return.',
    '#47 Nerve Hook: tip for deformity, shaft for kinks. #48 Dural Hook: tip sharpness, shaft straight.',
    '#49 Suction Irrigator (combined): lumen patency, all ports clear, seals intact. #50 Trocar Obturator: tip for burrs, verify fit with matching trocar.',
    'The 9-point inspection standard at Yellow Belt: (1) Cleanliness, (2) Ratchet Function, (3) Box Lock/Hinge, (4) Cutting Edges, (5) Serrations, (6) Tips, (7) Corrosion, (8) Insulation, (9) Lumens. Each point has a pass/fail criterion. An instrument that fails any single point is removed from service.'
  ],
  questions:[
    {q:'What must you inspect on EVERY laparoscopic instrument?',opts:['Weight','Insulation integrity along the entire shaft','Color coding','Manufacturer logo'],ans:1},
    {q:'Any insulation damage on an electrosurgical instrument requires:',opts:['Monitoring over time','Notation in log','Immediate removal from service','Repair with tape'],ans:2},
    {q:'What is a Kerrison rongeur used for and what is its key inspection point?',opts:['Cutting bone; inspect footplate and cutting edge for chips','Suturing; inspect jaw cross-hatching','Retraction; inspect blade integrity','Suctioning; inspect lumen'],ans:0},
    {q:'What is the difference between a bone rongeur and a Kerrison rongeur?',opts:['They are the same','A bone rongeur has opposing jaws; a Kerrison has a footplate and a single cutting blade','Kerrison is for tissue only','Bone rongeur is electrosurgical'],ans:1},
    {q:'How many inspection criteria are in the Yellow Belt standard?',opts:['5','7','9','12'],ans:2},
    {q:'A trocar obturator tip has a small burr. What do you do?',opts:['Use it carefully','Remove from service; burrs can cause tissue damage during port insertion','File it smooth','Only matters for sharp trocars'],ans:1},
    {q:'Bipolar forceps differ from monopolar instruments because:',opts:['They are larger','Energy passes between the two tips rather than through the patient to a grounding pad','They do not need insulation','They are single-use only'],ans:1},
    {q:'When inspecting a Gigli saw, what are you looking for?',opts:['Blade sharpness','Wire for kinks or breaks and secure handle attachment','Insulation integrity','Ratchet function'],ans:1},
    {q:'What does the suction irrigator combine?',opts:['Cutting and grasping','Suction and irrigation in one instrument','Retraction and clamping','Electrosurgical and suctioning'],ans:1},
    {q:'If a bone rongeur spring does not return the jaws to the open position, what do you do?',opts:['Force it open manually','Remove from service; the spring mechanism has failed','Oil the spring','Use it in the closed position'],ans:1}
  ],
  simulations:[
    {s:'You are inspecting a laparoscopic grasper and notice a tiny crack in the insulation near the tip. The crack does not expose bare metal yet. What is your action?',opts:['Acceptable since metal is not exposed','Remove from service immediately; any insulation compromise is a patient safety risk','Monitor and check again next use','Mark it for repair next week'],ans:1},
    {s:'During assembly, you test a Kerrison rongeur and the footplate does not spring back cleanly after biting. What does this indicate?',opts:['Normal for Kerrison rongeurs','The spring mechanism is failing; remove from service','It needs lubrication','Only a problem if the footplate is chipped'],ans:1},
    {s:'A coworker says bone instruments "do not need the full 9-point inspection because they are just heavy metal." Is this correct?',opts:['Yes, bone instruments are simple','No; every instrument gets the full 9-point inspection regardless of type. Bone instruments have specific inspection points like cutting edges, spring action, and handle integrity','Only rongeurs need full inspection','Correct for mallets but not osteotomes'],ans:1},
    {s:'You are building a tray and need to identify instrument #49. It has a long shaft with both a suction port and an irrigation port, and fluid connections at the proximal end. What is it?',opts:['Yankauer suction','Poole suction','Suction Irrigator (combined)','Frazier suction'],ans:2},
    {s:'An osteotome cutting edge has a visible chip about 1mm wide. The rest of the edge looks sharp. Can it be used?',opts:['Yes, the chip is small','No; any chip on a cutting edge means the instrument cannot cut cleanly and may fragment bone improperly. Remove from service','Only if the chip is on the non-working side','File the chip smooth and use'],ans:1},
    {s:'You pick up a small hooked instrument with a very fine tip. The shaft is thin and straight. Based on the neurosurgical instruments you learned, this is most likely a:',opts:['Skin hook','Nerve hook','Frazier suction','Periosteal elevator'],ans:1},
    {s:'A bipolar forceps has darkened residue on the tips from previous use. Is this acceptable after cleaning?',opts:['Yes, darkening is cosmetic','No; residual buildup on bipolar tips affects electrical conductivity and must be completely removed. If cleaning does not remove it, the instrument needs specialized cleaning or repair','Only matters for monopolar','Carbon buildup improves conductivity'],ans:1},
    {s:'You test a trocar valve and air leaks through when the obturator is removed. What does this mean?',opts:['Normal operation','The valve seal is compromised; the trocar cannot maintain pneumoperitoneum. Remove from service','Trocars are single-use anyway','Only matters for 12mm trocars'],ans:1},
    {s:'A mallet head feels slightly loose when you grip the handle and push on the head. What is your assessment?',opts:['Normal for mallets','The head-handle junction is compromised; a loose mallet head is a safety hazard. Remove from service','Tighten it yourself','Only a problem if the head wobbles visibly'],ans:1},
    {s:'You are inspecting a periosteal elevator. The blade edge has started to curl slightly at one corner. What do you do?',opts:['Acceptable for a periosteal elevator','Remove from service; a curled blade edge indicates deformation that affects function and can damage tissue','Straighten it with pliers','Only matters for sharp elevators'],ans:1}
  ],
  observations:[
    {id:'oi2-1',text:'Can identify all four laparoscopic instruments (#31-34) by sight and name'},
    {id:'oi2-2',text:'Performs insulation inspection on a laparoscopic or electrosurgical instrument'},
    {id:'oi2-3',text:'Can identify at least five orthopedic bone instruments (#37-46) by sight'},
    {id:'oi2-4',text:'Performs the 9-point inspection on a hinged instrument (box lock, ratchet, jaws, tips, serrations, corrosion, cutting edge, insulation, lumen)'},
    {id:'oi2-5',text:'Can distinguish between a bone rongeur, Kerrison rongeur, and pituitary rongeur'},
    {id:'oi2-6',text:'Correctly identifies an instrument that should be removed from service and follows removal procedure'}
  ]},
 {id:'im-gb',num:3,title:'Green Belt Instruments',subtitle:'25 Additional Instruments, 12 Tray Sets (Total 80)',belt:'Green',domain:'Advanced & Multi-Service Instrumentation',
  desc:'Complex retractor systems, vascular clamps, thoracic instruments, neurosurgical instruments, and 12 advanced tray sets spanning all major service lines.',
  sections:['Retractor Systems','Clamping Specialties','Vascular Instruments','Thoracic Instruments','Neurosurgical Instruments','General Specialty','Green Belt Tray Sets'],
  sectionContent:[
    '#56 Bookwalter Retractor System: table-mounted, multiple blades/arms/connectors. #57 Thompson Retractor: table-mounted for abdominal/thoracic. #58 Omni-Tract Retractor: flexible arm system. #59 Balfour Retractor: self-retaining with center blade and lateral arms. #60 O\'Sullivan-O\'Connor: gynecologic self-retaining. #61 Finochietto Rib Spreader: thoracic, ratchet mechanism. #62 Malleable/Ribbon Retractor: flexible, shaped by surgeon. #63 Harrington Retractor: curved, deep abdominal.',
    '#64 Backhaus Towel Clip: perforating drape clamp. #65 Jones Towel Clip: non-perforating. #66 Right Angle (Mixter) Clamp: 90-degree tip for dissecting around structures. #67 Tonsil Clamp (Schnidt): long angled hemostat. #68 Pean Clamp: rounded jaw for large vessels.',
    '#69 Satinsky Clamp: partial occlusion vascular clamp, precise jaw alignment required. #70 Bulldog Clamp: small temporary vessel occlusion, inspect spring tension.',
    '#71 Chest Tube Clamp: heavy, for chest tubes. #72 Lung Clamp (Duval): fenestrated triangular jaw for lung tissue.',
    '#73 Intestinal Clamp (Doyen): atraumatic bowel clamp. #74 Pituitary Rongeur (neuro): small-cup for disc removal. #75 Dura Scissors: very fine, magnification inspection. #76 Bipolar Bayonet Forceps: angled for neurosurgical coagulation. #77 Frazier Dural Hook: fine hook for dura.',
    '#78 Probe and Groove Director: combined probing and incision guide. #79 Skin Hook: fine single/double hook for skin retraction. #80 Breast Biopsy Needle/Localization Wire: verify single-use status before reprocessing.',
    '12 tray sets: Major Laparotomy (80+ instruments), Open Cholecystectomy, Bowel Resection (intestinal clamps), Thoracotomy (rib spreaders, lung clamps), Vascular Surgery (Satinsky, bulldog, vessel loops), Craniotomy (delicate neuro instruments), Laminectomy/Spine (heavy rongeurs, elevators), Shoulder Arthroplasty (trials, reamers, power), Laparoscopic Colectomy, Laparoscopic Hysterectomy, CABG (cardiac, high-precision), Bookwalter/Retractor System Assembly.'
  ],
  questions:[
    {q:'What is a Bookwalter retractor system?',opts:['A handheld retractor','A table-mounted mechanical retraction system with multiple blade, arm, and connector components','A self-retaining skin retractor','A type of rib spreader'],ans:1},
    {q:'What is the function of a Satinsky clamp?',opts:['Full occlusion of a vessel','Partial occlusion for vascular procedures','Grasping lung tissue','Clamping chest tubes'],ans:1},
    {q:'A Doyen clamp is used for:',opts:['Vascular occlusion','Atraumatic bowel clamping','Rib spreading','Dural retraction'],ans:1},
    {q:'What distinguishes a Backhaus towel clip from a Jones towel clip?',opts:['Size only','Backhaus is perforating; Jones is non-perforating','Color coding','Backhaus is disposable'],ans:1},
    {q:'How many total instruments should a Green Belt tech be able to identify?',opts:['30','50','80','100'],ans:2},
    {q:'What is critical when inspecting a Satinsky clamp?',opts:['Weight','Precise curved jaw alignment','Handle color','Label placement'],ans:1},
    {q:'A Finochietto rib spreader uses what mechanism to hold open?',opts:['Spring tension','A ratchet mechanism','Magnetic closure','Screw lock'],ans:1},
    {q:'Dura scissors require inspection under:',opts:['Normal light','Magnification due to very fine tips','Ultraviolet light','No special inspection'],ans:1},
    {q:'A right angle (Mixter) clamp has a tip at what angle?',opts:['45 degrees','90 degrees','180 degrees','Variable'],ans:1},
    {q:'Before reprocessing a breast biopsy needle/localization wire, what must you verify?',opts:['The brand','Whether it is single-use (most facilities use single-use)','The color','The surgeon preference'],ans:1}
  ],
  simulations:[
    {s:'You are disassembling a Bookwalter retractor system after decontamination. The count sheet lists 14 components. You count 13. What do you do?',opts:['Close enough for a retractor system','Stop. Account for every component. A missing blade or connector could be left in the patient field. Search thoroughly and report the discrepancy','Add a similar component','Document 13 and proceed'],ans:1},
    {s:'You are inspecting a Satinsky clamp and notice the curved jaws do not align precisely when closed. There is a 0.5mm gap at one point. Is this acceptable?',opts:['Yes, small gaps are normal for curved clamps','No; Satinsky clamps require precise jaw alignment for partial vessel occlusion. A misaligned jaw can cause vessel damage. Remove for repair','Only matters for full-occlusion clamps','Acceptable if the gap is less than 1mm'],ans:1},
    {s:'A Finochietto rib spreader ratchet engages when opening but does not hold position under resistance. What is wrong?',opts:['Normal operation','The ratchet is failing; a rib spreader that cannot maintain position is dangerous during thoracic surgery. Remove from service','Add lubricant','The surgeon adjusts it during the case'],ans:1},
    {s:'You are building a Craniotomy tray. These instruments are very fine and delicate. How should you handle them during assembly?',opts:['Same as any other instruments','Handle each individually, use tip protectors, inspect under magnification, place carefully to prevent contact damage','Group them together for efficiency','Only the neurosurgeon handles these'],ans:1},
    {s:'A malleable retractor has a visible crack along one of its bend lines. Can it still be bent by the surgeon?',opts:['Yes, cracks are from normal bending','No; a crack indicates metal fatigue. The retractor could fracture during use. Remove from service immediately','Only if the crack is small','Heat-treat it to seal the crack'],ans:1},
    {s:'You are verifying a CABG set. This is a cardiac set with extremely complex, high-precision instruments. What level of inspection is required?',opts:['Standard inspection','Every instrument may require magnification inspection. Cardiac instruments demand the highest precision because failure during open-heart surgery is catastrophic','Visual inspection only','Spot-check 50% of instruments'],ans:1},
    {s:'A bulldog clamp spring feels weak compared to others in the set. It still closes but with noticeably less tension. What do you do?',opts:['It still closes, so it works','Remove from service; weak spring tension means the clamp may not maintain occlusion on a vessel during surgery','Test it on paper to confirm','Replace the spring yourself'],ans:1},
    {s:'During assembly of a Thoracotomy set, you notice the chest tube clamp has residual dried material in the jaw serrations despite going through decontam. What is your action?',opts:['Sterilization will handle it','Return for re-cleaning; the instrument is not clean and cannot proceed to sterilization. High bioburden from thoracic cases requires thorough cleaning','Wipe it with alcohol','Note it and proceed'],ans:1},
    {s:'You are asked to identify an instrument with a fenestrated triangular jaw. What is it?',opts:['Doyen clamp','Satinsky clamp','Lung clamp (Duval)','Pean clamp'],ans:2},
    {s:'A surgeon preference card requests a "Mixter." What instrument do they want?',opts:['A mixing bowl','A right angle clamp','A Metzenbaum scissors','A malleable retractor'],ans:1}
  ],
  observations:[
    {id:'oi3-1',text:'Can identify components of a retractor system (Bookwalter or equivalent) and verify count'},
    {id:'oi3-2',text:'Can identify Satinsky and bulldog clamps by sight and describe their vascular function'},
    {id:'oi3-3',text:'Can identify at least three neurosurgical instruments (dura scissors, bipolar bayonet, Frazier dural hook, pituitary rongeur)'},
    {id:'oi3-4',text:'Can name at least eight of the twelve Green Belt tray sets'},
    {id:'oi3-5',text:'Demonstrates magnification inspection on a fine/delicate instrument'},
    {id:'oi3-6',text:'Can distinguish between Doyen (bowel), Satinsky (vascular), and Duval (lung) clamps by sight and function'},
    {id:'oi3-7',text:'Performs a complete tray build and count verification on a complex multi-service-line set'}
  ]},
 {id:'im-bb',num:4,title:'Blue Belt Instruments',subtitle:'20 Additional Instruments, 12 Tray Sets (Total 100)',belt:'Blue',domain:'Lead-Level Instrumentation Mastery',
  desc:'Cardiac, microsurgery, ophthalmology, arthroscopy, energy devices, robotic, and urology instruments. Plus 12 advanced tray sets for department-wide instrumentation command.',
  sections:['Cardiac Instruments','Microsurgery & Ophthalmology','Arthroscopy & Orthopedic','Laparoscopic Advanced','Energy Devices','Urology & Endoscopy','Blue Belt Tray Sets'],
  sectionContent:[
    '#81 Sternal Saw: powered for sternotomy, manufacturer-specific cleaning. #87 Coronary Suction Tip (Malleable): flexible cardiac field suction, inspect for kinks. #88 Aortic Root Retractor: cardiac root exposure, inspect blade and ratchet. #83 Aortic Punch: creates precise holes in aorta for graft anastomosis.',
    '#86 Micro Scissors: extremely fine for microsurgical work. #87 Castroviejo Micro Needle Driver: spring-handled for microsurgical suturing. #88 Corneal Scissors: curved, fine for ophthalmic procedures. #89 Phacoemulsification Handpiece: ultrasonic for cataract surgery, manufacturer-specific processing.',
    '#90 Arthroscopy Shaver Handpiece: powered for joint debridement, disassemble completely. #91 Arthroscopy Pump Tubing: fluid management system. #92 Hip Portal Set: instruments for hip arthroscopy access.',
    '#93 Endoscopic Clip Applier: multi-fire for laparoscopic hemostasis. #94 Laparoscopic Stapler: fires staples and cuts, complex instrument. #84 Ligaclip Applier: open vascular clip application. #85 Vessel Loops: single-use silicone for vessel identification.',
    '#95 Harmonic Scalpel Handpiece: ultrasonic energy for cutting/coagulating, manufacturer-specific cleaning. #96 LigaSure/Vessel Sealing Device: tissue fusion, inspect jaw surfaces and cable.',
    '#99 Ureteroscope (Flexible): ureteral/renal access, leak test required, channel inspection. #100 Cystoscope (Rigid): bladder examination, inspect optics, light post, seals.',
    '12 tray sets: Open Heart/CABG, Valve Replacement, Laparoscopic Bariatric, Robotic (da Vinci), FESS/Endoscopic Sinus, Cochlear Implant, Spinal Fusion, Knee Arthroscopy, Hip Replacement Revision, Laparoscopic Bowel Resection, Liver Resection, Exploratory Laparotomy (Trauma).'
  ],
  questions:[
    {q:'A sternal saw requires what type of cleaning protocol?',opts:['Standard manual cleaning','Manufacturer-specific cleaning due to powered components','Ultrasonic only','No cleaning, it is single-use'],ans:1},
    {q:'What is a Castroviejo micro needle driver identified by?',opts:['Ratchet mechanism','Spring-handled design for microsurgical suturing','Large jaw surface','Electrosurgical connection'],ans:1},
    {q:'Before processing a flexible ureteroscope, what test is required?',opts:['Ratchet test','Leak test','Weight test','Electrical test'],ans:1},
    {q:'A Harmonic Scalpel uses what type of energy?',opts:['Electrical','Thermal','Ultrasonic','Radiofrequency'],ans:2},
    {q:'What distinguishes robotic (da Vinci) instruments from standard laparoscopic instruments?',opts:['They are identical','They have manufacturer-specific cleaning protocols and articulating wrist mechanisms requiring specific handling','They are larger','They do not need inspection'],ans:1},
    {q:'An arthroscopy shaver handpiece must be:',opts:['Cleaned assembled','Completely disassembled before cleaning, with all seals inspected','Wiped and autoclaved','Cleaned by the surgeon'],ans:1},
    {q:'What is an aortic punch used for?',opts:['Punching holes in sterile packaging','Creating precise holes in the aorta for graft anastomosis','Testing aortic valve function','Marking instruments'],ans:1},
    {q:'Vessel loops are typically:',opts:['Reusable after sterilization','Single-use silicone used for vessel identification and retraction','Metal clamps','Suture material'],ans:1},
    {q:'A LigaSure device seals tissue by:',opts:['Suturing','Stapling','Fusing tissue with controlled electrical energy and pressure','Ultrasonic vibration'],ans:2},
    {q:'How many total named instruments should a Blue Belt tech know?',opts:['50','80','100','150'],ans:2}
  ],
  simulations:[
    {s:'A sternal saw arrives in decontam after a cardiac case. The OR scrub says "just throw it in the washer." What is your response?',opts:['Follow their instruction','Powered instruments require manufacturer-specific cleaning. Consult the IFU before processing. A sternal saw cannot simply go in the washer','Soak it overnight','Send it to biomedical engineering'],ans:1},
    {s:'You are inspecting a flexible ureteroscope. During the leak test, you observe a single tiny bubble near the bending section. What do you do?',opts:['One bubble is insignificant','Any bubble indicates a leak. Do not proceed with immersion. Remove from service and report','Wait 30 seconds to see if more appear','Proceed with extra careful handling'],ans:1},
    {s:'A Harmonic Scalpel handpiece has darkened residue on the blade that standard cleaning did not remove. What is your action?',opts:['Acceptable after multiple uses','Follow the manufacturer IFU for stubborn residue removal. If it cannot be removed per IFU, the instrument needs specialized service','Scrub harder with a wire brush','Sterilization will carbonize it'],ans:1},
    {s:'You are verifying a Robotic Surgery (da Vinci) instrument set. One instrument has a use-count indicator showing it has reached its maximum number of uses. What do you do?',opts:['Use it one more time','Remove it from the set. Da Vinci instruments have manufacturer-defined use limits. An instrument at max count cannot be used regardless of condition','Reset the counter','Ignore use counts for reusable instruments'],ans:1},
    {s:'During arthroscopy shaver handpiece disassembly, a small O-ring falls out and you are not sure where it goes. What do you do?',opts:['Discard it and reassemble without it','Stop. Consult the IFU for the correct component configuration. Every seal and O-ring is essential for function and safety','Put it back anywhere it fits','Order a replacement for next time'],ans:1},
    {s:'A coronary suction tip (malleable) has a kink in the shaft. Can it still be used?',opts:['Yes, it is malleable and can be re-shaped','No; a kinked malleable suction tip has compromised lumen patency and structural integrity. Remove from service','Straighten it carefully','Only a problem if fully kinked'],ans:1},
    {s:'You are building an Exploratory Laparotomy (Trauma) set. This is a rapid deployment set. Why does the Lead need to know every instrument in it?',opts:['For billing purposes','The Lead must assess immediate availability. In trauma, any missing instrument delays care. Complete knowledge of the set profile enables instant readiness assessment','It is the smallest set','Trauma sets do not need full verification'],ans:1},
    {s:'A cystoscope rigid optic has a small scratch on the lens. Images appear slightly foggy. What is your assessment?',opts:['Acceptable for an older scope','A scratched optic degrades visualization for the surgeon. Remove for evaluation and possible repair or replacement','Clean the lens again','Only matters for flexible scopes'],ans:1},
    {s:'You are training a Green Belt tech on CABG instrumentation. They say they are uncomfortable handling cardiac instruments because they have never seen them before. What is the correct approach?',opts:['Tell them to figure it out','Walk through each instrument by name, category, and function. Demonstrate inspection points. Confirm understanding before letting them handle independently. This is what coaching authority looks like','Let them skip cardiac sets','Assign them to a different area permanently'],ans:1},
    {s:'A phacoemulsification handpiece arrived from the ophthalmic OR. You have never processed one before. What is your first step?',opts:['Process it like any other instrument','Locate and read the manufacturer IFU before touching it. Ophthalmic instruments have specific processing requirements, and TASS (Toxic Anterior Segment Syndrome) is a known risk from improper cleaning','Ask the OR to clean it themselves','Put it in the ultrasonic'],ans:1}
  ],
  observations:[
    {id:'oi4-1',text:'Can identify at least three cardiac instruments (sternal saw, aortic punch, coronary suction tip, aortic root retractor)'},
    {id:'oi4-2',text:'Can describe the manufacturer-specific processing requirement for at least one powered instrument (Harmonic, sternal saw, or shaver)'},
    {id:'oi4-3',text:'Can identify a microsurgical instrument (Castroviejo, micro scissors) and describe handling requirements'},
    {id:'oi4-4',text:'Can identify at least one endoscopic instrument (ureteroscope or cystoscope) and state the leak test requirement'},
    {id:'oi4-5',text:'Can name at least eight of the twelve Blue Belt tray sets'},
    {id:'oi4-6',text:'Demonstrates appropriate response when encountering an unfamiliar instrument (consults IFU before processing)'},
    {id:'oi4-7',text:'Can describe the difference between Harmonic (ultrasonic) and LigaSure (electrical/pressure) energy devices'}
  ]}
];
 
// ── Instruments Helpers (mirror Foundations pattern with different DB keys) ──
function getInstrumentAssignments(sid){return (DB.instrumentAssignments||[]).filter(a=>a.staffId===sid);}
function isInstModuleAssigned(sid,mid){return (DB.instrumentAssignments||[]).some(a=>a.staffId===sid&&a.moduleId===mid);}
function getInstModuleGates(sid,mid){
 const p=(DB.instrumentProgress||[]).find(x=>x.staffId===sid&&x.moduleId===mid);
 return p||{g1:{status:'locked',score:0,attempts:[]},g2:{status:'locked',score:0,attempts:[]},g3:{status:'locked',items:[]},complete:false};
}
// ── Live persistence (#22/#26): mirror each in-memory write to Supabase ──
function _instProgToBackend(p){return {staff_id:p.staffId,module_id:p.moduleId,g1:p.g1,g2:p.g2,g3:p.g3,complete:p.complete,updated_at:new Date().toISOString()};}
function _instSaveProgress(p){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.upsertInstrumentProgress){SB.upsertInstrumentProgress(_instProgToBackend(p)).catch(e=>console.warn('[inst] progress sync',e&&e.message));}}catch(e){console.warn('[inst] progress sync',e);}}
function _instSaveAssignment(a){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.createInstrumentAssignment){SB.createInstrumentAssignment({staff_id:a.staffId,module_id:a.moduleId,assigned_by:a.assignedBy||null,type:a.type,trigger:a.trigger,assignment_type:a.type,trigger_event:a.trigger,facility_id:a.facilityId||null,assigned_date:a.assignedDate,status:a.status}).catch(e=>console.warn('[inst] assignment sync',e&&e.message));}}catch(e){console.warn('[inst] assignment sync',e);}}
function _instSaveAssignmentStatus(sid,mid,status){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.updateInstrumentAssignmentStatus){SB.updateInstrumentAssignmentStatus(sid,mid,status).catch(e=>console.warn('[inst] status sync',e&&e.message));}}catch(e){}}

function assignInstModule(sid,mid,by,type,trigger){
 if(!DB.instrumentAssignments) DB.instrumentAssignments=[];
 if(DB.instrumentAssignments.find(a=>a.staffId===sid&&a.moduleId===mid)) return;
 const _s=(typeof getStaff==='function')?getStaff(sid):(DB.staff||[]).find(x=>x.id===sid);
 const _a={id:'ia-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),staffId:sid,moduleId:mid,assignedBy:by,type:type||'remediation',trigger:trigger||null,facilityId:_s?_s.fid:null,assignedDate:new Date().toISOString().slice(0,10),status:'assigned'};
 DB.instrumentAssignments.push(_a);
 if(!DB.instrumentProgress) DB.instrumentProgress=[];
 let _p=DB.instrumentProgress.find(x=>x.staffId===sid&&x.moduleId===mid);
 if(!_p){ _p={staffId:sid,moduleId:mid,g1:{status:'open',score:0,attempts:[]},g2:{status:'open',score:0,attempts:[]},g3:{status:'open',items:[]},complete:false}; DB.instrumentProgress.push(_p); }
 _instSaveAssignment(_a); _instSaveProgress(_p);
}
function assignAllInstModules(sid,by){INSTRUMENT_MODULES.forEach(m=>assignInstModule(sid,m.id,by,'onboarding',null));}
function saveInstGateScore(sid,mid,gate,score){
 if(!DB.instrumentProgress) DB.instrumentProgress=[];
 let p=DB.instrumentProgress.find(x=>x.staffId===sid&&x.moduleId===mid);
 if(!p){p={staffId:sid,moduleId:mid,g1:{status:'open',score:0,attempts:[]},g2:{status:'open',score:0,attempts:[]},g3:{status:'open',items:[]},complete:false};DB.instrumentProgress.push(p);}
 const g=p[gate];g.attempts.push({date:new Date().toISOString().slice(0,10),score});g.score=score;g.status=score>=80?'pass':'attempted';
 if(p.g1.status==='pass'&&p.g2.status==='pass'&&p.g3.status==='pass'){p.complete=true;const a=(DB.instrumentAssignments||[]).find(x=>x.staffId===sid&&x.moduleId===mid);if(a)a.status='completed';}
 _instSaveProgress(p);
 if(p.complete) _instSaveAssignmentStatus(sid,mid,'completed');
 return p;
}
function markInstG3Item(sid,mid,itemId,confirmed,by){
 let p=(DB.instrumentProgress||[]).find(x=>x.staffId===sid&&x.moduleId===mid);if(!p) return;
 const ex=p.g3.items.find(i=>i.id===itemId);
 if(ex){ex.confirmed=confirmed;ex.confirmedBy=by;ex.date=new Date().toISOString().slice(0,10);}
 else{p.g3.items.push({id:itemId,confirmed,confirmedBy:by,date:new Date().toISOString().slice(0,10)});}
 const m=INSTRUMENT_MODULES.find(x=>x.id===mid);
 if(m){const allDone=m.observations.every(o=>p.g3.items.some(i=>i.id===o.id&&i.confirmed));if(allDone){p.g3.status='pass';p.g3.score=100;}}
 if(p.g1.status==='pass'&&p.g2.status==='pass'&&p.g3.status==='pass'){p.complete=true;const a=(DB.instrumentAssignments||[]).find(x=>x.staffId===sid&&x.moduleId===mid);if(a)a.status='completed';}
 _instSaveProgress(p);
 if(p.complete) _instSaveAssignmentStatus(sid,mid,'completed');
}
 
// ── Staff Portal: Render Instruments (reuses Foundations UI patterns) ──
function renderSInstruments(){
 const el=document.getElementById('s-instruments');if(!el)return;
 const s=getStaff(ST.staffId);if(!s){el.innerHTML='<div class="empty-state"><div class="empty-ttl">No Staff Record</div></div>';return;}
 const assignments=getInstrumentAssignments(s.id);
 const totalA=assignments.length,totalC=assignments.filter(a=>a.status==='completed').length;
 let html='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Instruments</div>';
 if(totalA>0) html+='<span class="pill p-gold">'+totalC+'/'+totalA+' completed</span>';
 html+='</div><div class="card-body"><p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 12px">100 instruments and 30 tray sets across four belt levels. Each module requires three gates: Knowledge, Simulation, and Observed Demonstration. Modules are activated by your educator or manager.</p>';
 if(totalA>0&&totalC===totalA){html+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:12px 16px;display:flex;align-items:center;gap:10px"><svg viewBox="0 0 20 20" width="20" height="20" fill="none"><circle cx="10" cy="10" r="9" stroke="#4ade80" stroke-width="1.5"/><path d="M6 10.5l2.5 2.5L14 7.5" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font-size:13px;color:#4ade80;font-weight:600">All assigned modules completed</span></div>';}
 html+='</div></div>';
 INSTRUMENT_MODULES.forEach(m=>{
   const assigned=isInstModuleAssigned(s.id,m.id),gates=getInstModuleGates(s.id,m.id),complete=gates.complete;
   html+='<div class="card mb16 fnd-card'+(assigned?' fnd-unlocked':' fnd-locked')+'"><div class="card-hd" style="flex-wrap:wrap;gap:8px"><div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1"><div class="fnd-num'+(complete?' fnd-num-done':'')+'">'+m.num+'</div><div style="min-width:0"><div class="card-ttl" style="font-size:14px;margin:0">'+m.title+'</div><div style="font-size:11px;color:#64748b;margin-top:2px">'+m.subtitle+'</div></div></div>';
   if(assigned){html+='<div style="display:flex;gap:4px;align-items:center" title="G1: Knowledge | G2: Simulation | G3: Observation">'+fndGateBadge(gates.g1.status)+fndGateBadge(gates.g2.status)+fndGateBadge(gates.g3.status)+'</div>';}
   else{html+='<span class="pill p-muted" style="opacity:.5"><svg viewBox="0 0 14 14" width="11" height="11" fill="none" style="margin-right:3px;vertical-align:-1px"><rect x="1" y="5" width="12" height="8" rx="2" stroke="#64748b" stroke-width="1.3"/><path d="M4 5V4a3 3 0 016 0v1" stroke="#64748b" stroke-width="1.3" stroke-linecap="round"/></svg>Locked</span>';}
   html+='</div><div class="card-body" style="padding-top:0"><p style="font-size:12.5px;color:#94a3b8;line-height:1.5;margin:0 0 8px">'+m.desc+'</p>';
   if(assigned){html+='<div style="display:flex;gap:12px;flex-wrap:wrap;margin:10px 0"><div class="fnd-gate-lbl">'+fndGateBadge(gates.g1.status)+'<span>Knowledge'+(gates.g1.score>0?' ('+gates.g1.score+'%)':'')+'</span></div><div class="fnd-gate-lbl">'+fndGateBadge(gates.g2.status)+'<span>Simulation'+(gates.g2.score>0?' ('+gates.g2.score+'%)':'')+'</span></div><div class="fnd-gate-lbl">'+fndGateBadge(gates.g3.status)+'<span>Observation'+(gates.g3.status==='pass'?' (Confirmed)':'')+'</span></div></div><button class="btn btn-gold btn-sm" style="margin-top:8px" onclick="openInstModule(\''+m.id+'\')">'+(complete?'Review':'Open Module')+'</button>';}
   else{html+='<div class="fnd-sections">';m.sections.forEach(sec=>{html+='<div class="fnd-sec-item" style="font-size:12px;color:#64748b;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04)">'+sec+'</div>';});html+='</div>';}
   html+='</div></div>';
 });
 el.innerHTML=html;
}
 
// ── Instrument Module Viewer (reuses Foundations gate UI) ──
function openInstModule(mid){
 const m=INSTRUMENT_MODULES.find(x=>x.id===mid);if(!m)return;
 const s=getStaff(ST.staffId);if(!s)return;
 const gates=getInstModuleGates(s.id,m.id);
 ST._instTab=ST._instTab||'content';
 const el=document.getElementById('s-instruments');
 const tab=ST._instTab;
 const tabBtn=(id,lbl,on)=>'<div class="tab'+(on?' on':'')+'" onclick="ST._instTab=\''+id+'\';openInstModule(\''+m.id+'\')">'+lbl+'</div>';
 let html='<div class="fnd-reader"><button class="btn btn-ghost btn-sm" onclick="renderSInstruments()" style="margin-bottom:12px">&larr; Back</button>';
 html+='<div style="font-size:11px;color:#c49a20;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">'+m.belt.toUpperCase()+' BELT</div>';
 html+='<div style="font-size:20px;font-weight:700;color:#e2e8f0">'+m.title+'</div><div style="font-size:13px;color:#94a3b8;margin-top:2px">'+m.subtitle+'</div>';
 html+='<div style="display:flex;gap:14px;margin:12px 0"><div class="fnd-gate-lbl">'+fndGateBadge(gates.g1.status)+'<span>Knowledge</span></div><div class="fnd-gate-lbl">'+fndGateBadge(gates.g2.status)+'<span>Simulation</span></div><div class="fnd-gate-lbl">'+fndGateBadge(gates.g3.status)+'<span>Observation</span></div></div>';
 html+='<div class="tab-bar" style="margin-bottom:16px">'+tabBtn('content','Instruments',tab==='content')+tabBtn('gate1','Gate 1',tab==='gate1')+tabBtn('gate2','Gate 2',tab==='gate2')+tabBtn('gate3','Gate 3',tab==='gate3')+'</div>';
 if(tab==='content'){m.sections.forEach((sec,i)=>{html+='<div class="fnd-section"><div class="fnd-section-title">'+sec+'</div><div class="fnd-section-body">'+m.sectionContent[i]+'</div></div>';});}
 else if(tab==='gate1'){html+=renderInstGate(m,s,'g1',m.questions,'Knowledge Check','Identify instruments, categories, functions, and inspection points. 80% required.');}
 else if(tab==='gate2'){html+=renderInstGate(m,s,'g2',m.simulations,'Simulation','Real-world instrument scenarios. 80% required.');}
 else if(tab==='gate3'){html+=renderInstG3(m,s,gates);}
 html+='</div>';
 el.innerHTML=html;el.scrollTop=0;
}
function renderInstGate(m,s,gk,items,title,desc){
 const gates=getInstModuleGates(s.id,m.id),g=gates[gk];
 let h='<div class="fnd-kc"><div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">'+title+'</div><div style="font-size:12px;color:#94a3b8;margin-bottom:16px">'+desc+'</div>';
 if(g.status==='pass'){h+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px;text-align:center;margin-bottom:16px"><div style="font-size:20px;font-weight:700;color:#4ade80">'+g.score+'%</div><div style="font-size:13px;color:#4ade80;font-weight:600">Passed</div></div>';}
 const qk=gk==='g1'?'q':'s';
 items.forEach((item,qi)=>{h+='<div class="fnd-q" data-qi="'+qi+'"><div class="fnd-q-text">'+(qi+1)+'. '+(item[qk]||item.q||item.s)+'</div>';item.opts.forEach((opt,oi)=>{h+='<label class="fnd-q-opt"><input type="radio" name="inst-'+gk+'-'+m.id+'-'+qi+'" value="'+oi+'"'+(g.status==='pass'?' disabled':'')+'><span class="fnd-q-lbl">'+opt+'</span></label>';});h+='</div>';});
 if(g.status!=='pass') h+='<button class="btn btn-gold" style="margin-top:16px;width:100%" onclick="submitInstGate(\''+m.id+'\',\''+gk+'\')">Submit</button>';
 h+='<div id="inst-gate-result"></div></div>';return h;
}
function renderInstG3(m,s,gates){
 let h='<div class="fnd-kc"><div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">Observation / Demonstration</div><div style="font-size:12px;color:#94a3b8;margin-bottom:16px">Your educator confirms each item after observing you demonstrate the skill with real instruments.</div>';
 if(gates.g3.status==='pass') h+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px;text-align:center;margin-bottom:16px"><div style="font-size:16px;font-weight:700;color:#4ade80">All Items Confirmed</div></div>';
 m.observations.forEach(obs=>{const conf=gates.g3.items.find(i=>i.id===obs.id&&i.confirmed);h+='<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">';if(conf){h+='<svg viewBox="0 0 18 18" width="16" height="16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="9" cy="9" r="8" fill="rgba(74,222,128,.15)" stroke="#4ade80" stroke-width="1.3"/><path d="M5.5 9.5l2.5 2.5L13 7" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><div><div style="font-size:13px;color:#4ade80">'+obs.text+'</div><div style="font-size:11px;color:#64748b;margin-top:2px">Confirmed by '+conf.confirmedBy+' on '+conf.date+'</div></div>';}else{h+='<svg viewBox="0 0 18 18" width="16" height="16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="9" cy="9" r="8" stroke="#475569" stroke-width="1.3"/></svg><div style="font-size:13px;color:#94a3b8">'+obs.text+'</div>';}h+='</div>';});
 h+='</div>';return h;
}
function submitInstGate(mid,gk){
 const m=INSTRUMENT_MODULES.find(x=>x.id===mid);if(!m)return;const s=getStaff(ST.staffId);if(!s)return;
 const items=gk==='g1'?m.questions:m.simulations;let correct=0;
 items.forEach((item,qi)=>{const sel=document.querySelector('input[name="inst-'+gk+'-'+m.id+'-'+qi+'"]:checked');if(sel&&parseInt(sel.value)===item.ans) correct++;});
 const score=Math.round((correct/items.length)*100);saveInstGateScore(s.id,m.id,gk,score);
 items.forEach((item,qi)=>{const opts=document.querySelectorAll('input[name="inst-'+gk+'-'+m.id+'-'+qi+'"]');opts.forEach((opt,oi)=>{const lbl=opt.closest('.fnd-q-opt');if(!lbl)return;opt.disabled=true;if(oi===item.ans)lbl.classList.add('fnd-q-correct');else if(opt.checked&&oi!==item.ans)lbl.classList.add('fnd-q-wrong');});});
 const rEl=document.getElementById('inst-gate-result');const gateLabel=gk==='g1'?'Knowledge':'Simulation';
 if(rEl){if(score>=80){rEl.innerHTML='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#4ade80">'+score+'%</div><div style="font-size:13px;color:#4ade80;font-weight:600;margin:4px 0">'+gateLabel+' Gate Passed</div><div style="font-size:12px;color:#94a3b8">'+correct+' of '+items.length+' correct.</div></div>';showToast(gateLabel+' passed: '+score+'%','ok');}
 else{rEl.innerHTML='<div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#f87171">'+score+'%</div><div style="font-size:13px;color:#f87171;font-weight:600;margin:4px 0">Not Yet Passing</div><div style="font-size:12px;color:#94a3b8">'+correct+' of '+items.length+' correct. 80% required.</div><button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="openInstModule(\''+mid+'\')">Try Again</button></div>';showToast('Score: '+score+'%. 80% required.','err');}}
}
 
// ── Hospital Portal: Render Instruments ──
function renderHInstruments(){
 const el=fndContainer('a-instruments','h-instruments');if(!el)return;
 const sys=fndIsSystemWide(),canAssign=fndCanAssign();
 const staff=getFoundationsVisibleStaff();
 let totalA=0,totalC=0,staffWith=0;const rows=[];
 staff.forEach(s=>{const asgns=getInstrumentAssignments(s.id);const done=asgns.filter(a=>a.status==='completed').length;if(asgns.length>0){staffWith++;totalA+=asgns.length;totalC+=done;}rows.push({s,assigned:asgns.length,done,pct:asgns.length>0?Math.round(done/asgns.length*100):0});});
 let html='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Instruments</div></div><div class="card-body"><p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 16px">Assign instrument training by belt level for onboarding or targeted remediation. Each module requires three gates.</p>';
 html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:8px"><div class="stat-card-mini"><div class="stat-lbl">Enrolled</div><div class="stat-val">'+staffWith+'</div></div><div class="stat-card-mini"><div class="stat-lbl">Assigned</div><div class="stat-val">'+totalA+'</div></div><div class="stat-card-mini"><div class="stat-lbl">Completed</div><div class="stat-val" style="color:#4ade80">'+totalC+'</div></div><div class="stat-card-mini"><div class="stat-lbl">Rate</div><div class="stat-val">'+(totalA>0?Math.round(totalC/totalA*100):0)+'%</div></div></div></div></div>';
 if(sys&&typeof adminFilterBar==='function') html+=adminFilterBar(true,fndVisibleFacs(),'renderHInstruments');
 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Staff Instrument Training</div></div><div class="card-body" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Belt</th>'+(sys?'<th>Facility</th>':'')+'<th>Modules</th><th>Actions</th></tr></thead><tbody>';
 rows.sort((a,b)=>fullName(a.s).localeCompare(fullName(b.s)));
 rows.forEach(r=>{html+='<tr><td style="font-weight:600">'+fullName(r.s)+'</td><td><span class="bb bb-'+r.s.belt+'">'+r.s.belt+'</span></td>'+(sys?'<td style="font-size:12px;color:#94a3b8">'+((getFac(r.s.fid)||{}).name||'&mdash;')+'</td>':'')+'<td>'+(r.assigned>0?'<span class="'+(r.pct===100?'tc-ok':r.pct>0?'tc-warn':'tc-muted')+'">'+r.done+'/'+r.assigned+'</span>':'<span class="tc-muted">None</span>')+'</td><td style="white-space:nowrap">';
 if(r.assigned>0) html+='<button class="btn btn-ghost btn-xs" onclick="hInstStaffDetail(\''+r.s.id+'\')">View</button> ';
 if(canAssign&&r.assigned<4) html+='<button class="btn btn-gold btn-xs" onclick="hAssignInstModal(\''+r.s.id+'\')">Assign</button> ';
 if(canAssign&&r.assigned===0) html+='<button class="btn btn-blue btn-xs" onclick="hAssignAllInst(\''+r.s.id+'\')">All 4</button>';
 html+='</td></tr>';});
 html+='</tbody></table></div></div></div>';el.innerHTML=html;
}
function hInstStaffDetail(sid){
 const s=getStaff(sid);if(!s)return;const el=fndContainer('a-instruments','h-instruments');if(!el)return;
 let html='<button class="btn btn-ghost btn-sm" onclick="renderHInstruments()" style="margin-bottom:12px">&larr; Back</button>';
 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">'+fullName(s)+'</div><span class="bb bb-'+s.belt+'">'+s.belt+'</span></div><div class="card-body"><div style="font-size:13px;color:#94a3b8">'+s.role+'</div></div></div>';
 INSTRUMENT_MODULES.forEach(m=>{
   if(!isInstModuleAssigned(s.id,m.id)) return;const gates=getInstModuleGates(s.id,m.id);
   html+='<div class="card mb16"><div class="card-hd" style="flex-wrap:wrap;gap:8px"><div style="display:flex;align-items:center;gap:8px"><div class="fnd-num'+(gates.complete?' fnd-num-done':'')+'">'+m.num+'</div><div class="card-ttl" style="font-size:14px;margin:0">'+m.title+'</div></div><div style="display:flex;gap:4px">'+fndGateBadge(gates.g1.status)+fndGateBadge(gates.g2.status)+fndGateBadge(gates.g3.status)+'</div></div><div class="card-body" style="padding-top:0">';
   html+='<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:#94a3b8"><span>G1: '+(gates.g1.status==='pass'?'<span class="tc-ok">'+gates.g1.score+'%</span>':'<span class="tc-muted">'+gates.g1.status+'</span>')+'</span><span>G2: '+(gates.g2.status==='pass'?'<span class="tc-ok">'+gates.g2.score+'%</span>':'<span class="tc-muted">'+gates.g2.status+'</span>')+'</span><span>G3: '+(gates.g3.status==='pass'?'<span class="tc-ok">Confirmed</span>':'<span class="tc-warn">Pending</span>')+'</span></div>';
   if(gates.g3.status!=='pass'){html+='<div style="font-size:12px;font-weight:600;color:#c49a20;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Gate 3: Confirm Observations</div>';
   m.observations.forEach(obs=>{const conf=gates.g3.items.find(i=>i.id===obs.id&&i.confirmed);html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)"><input type="checkbox" style="accent-color:#4ade80;flex-shrink:0" '+(conf?'checked':'')+' onchange="markInstG3Wrap(\''+s.id+'\',\''+m.id+'\',\''+obs.id+'\',this.checked)"><span style="font-size:12.5px;color:'+(conf?'#4ade80':'#94a3b8')+'">'+obs.text+'</span></div>';});}
   html+='</div></div>';
 });el.innerHTML=html;
}
function markInstG3Wrap(sid,mid,itemId,checked){const by=ST.user?ST.user.name:'Manager';markInstG3Item(sid,mid,itemId,checked,by);hInstStaffDetail(sid);}
function hAssignInstModal(sid){
 if(!fndCanAssign()){showToast('Assessors cannot assign modules','err');return;}
 const s=getStaff(sid);if(!s)return;const existing=getInstrumentAssignments(s.id);const unassigned=INSTRUMENT_MODULES.filter(m=>!existing.some(a=>a.moduleId===m.id));
 if(!unassigned.length){showToast('All modules assigned','info');return;}
 let html='<div style="margin-bottom:12px;font-size:13px;color:#94a3b8">Assign to <strong style="color:#e2e8f0">'+fullName(s)+'</strong>:</div><div style="max-height:300px;overflow-y:auto">';
 unassigned.forEach(m=>{html+='<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;font-size:13px;color:#cbd5e1"><input type="checkbox" class="inst-assign-cb" value="'+m.id+'" style="accent-color:#c49a20"><span><strong>'+m.num+'.</strong> '+m.title+'</span></label>';});
 html+='</div><div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button><button class="btn btn-gold btn-sm" onclick="hDoAssignInst(\''+s.id+'\')">Assign</button></div>';
 openModal('Assign Instrument Modules',html,'modal-sm');
}
function hDoAssignInst(sid){if(!fndCanAssign()){showToast('Assessors cannot assign modules','err');return;}const cbs=document.querySelectorAll('.inst-assign-cb:checked');if(!cbs.length){showToast('Select at least one','err');return;}const nm=ST.user?ST.user.name:'Manager';cbs.forEach(cb=>assignInstModule(sid,cb.value,nm,'remediation',null));closeModal();showToast(cbs.length+' module'+(cbs.length>1?'s':'')+' assigned','ok');renderHInstruments();}
function hAssignAllInst(sid){if(!fndCanAssign()){showToast('Assessors cannot assign modules','err');return;}assignAllInstModules(sid,ST.user?ST.user.name:'Manager');showToast('All 4 instrument modules assigned','ok');renderHInstruments();}


