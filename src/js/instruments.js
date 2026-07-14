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
//    getStaff(), fullName(), saveDemoData(), toast(),
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
    {q:'What is a depth gauge used for?',opts:['Measuring temperature','Measuring screw length for orthopedic hardware placement','Measuring blood loss','Testing sterilizer depth'],ans:1},
    {q:'Which scalpel handle sizes are included in the White Belt cutting instruments?',opts:['#3, #4, and #7','#1, #2, and #5','#10, #11, and #15','#6, #8, and #9'],ans:0},
    {q:'Which scissors are described as very small with fine tips?',opts:['Mayo scissors','Metzenbaum scissors','Iris scissors','Tissue scissors'],ans:2},
    {q:'Adson forceps are best described as:',opts:['Long with atraumatic serrations','Small with fine tips','Tweezers-style with circular serrated tips','Heavy with teeth at the tips'],ans:1},
    {q:'Tissue forceps in the Grasping & Holding category come in which two variants?',opts:['Curved and angled','Perforating and non-perforating','Smooth and toothed','Straight and malleable'],ans:2},
    {q:'What feature distinguishes an Allis clamp?',opts:['Teeth for grasping tissue','Smooth jaws for delicate tissue','A large curved blade for deep retraction','Multiple holes along the shaft'],ans:0},
    {q:'Which clamp is described as a large, heavy hemostat?',opts:['Mosquito clamp','Kelly clamp','Towel clamp','Rochester-Pean clamp'],ans:3},
    {q:'Which features are common to all instruments in the Clamping & Occluding category?',opts:['Insulated shafts and valves','Box locks and ratchets','Smooth jaws and fine tips','Graduated measurement markings'],ans:1},
    {q:'What is the purpose of a towel clamp?',opts:['Occluding medium vessels','Grasping delicate tissue','Securing surgical drapes','Holding suture needles'],ans:2},
    {q:'A Richardson retractor is identified by:',opts:['A right-angle blade','Prongs for skin retraction','A self-retaining ratchet','A double-ended handheld design'],ans:0},
    {q:'Which retractor is pronged and used for skin?',opts:['Deaver retractor','Richardson retractor','Army-Navy retractor','Rake retractor'],ans:3},
    {q:'Which needle holder is smaller and used for fine suturing?',opts:['Mayo-Hegar needle holder','Heaney needle holder','Webster needle holder','Olsen-Hegar needle holder'],ans:2},
    {q:'A Heaney needle holder is designed for:',opts:['Fine suturing with a smaller frame','Heavy, deep pelvic suturing','Combined needle holding and suture cutting','Standard suturing with cross-hatched jaws'],ans:1},
    {q:'Probes in the Measuring & Probing category have what tip design?',opts:['Sharp cutting tips','Smooth rounded tips for exploring','Perforating points','Pronged tips'],ans:1},
    {q:'What is the function of dilators?',opts:['Exploring tracts with a rounded tip','Measuring screw length','Manual wound irrigation','Enlarging openings using graduated sizes'],ans:3},
    {q:'Which items make up a Basin Set?',opts:['Basins, graduated pitcher, and medicine cup','Trocars, lap scissors, and graspers','Scalpel handles, forceps, and needle holders','Periosteal elevators and bone curettes'],ans:0},
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
    {s:'You pick up a heavy curved retractor blade about 12 inches long with no moving parts. What is it most likely?',opts:['Weitlaner retractor','Army-Navy retractor','Deaver retractor','Rake retractor'],ans:2},
    {s:'A surgeon asks for a clamp that will hold delicate tissue without crushing it. Which do you pass?',opts:['Allis clamp','Kocher clamp','Babcock clamp','Rochester-Pean clamp'],ans:2},
    {s:'In decontam you pick up a flat metal instrument with a groove at one end and no hinges, ratchets, or moving parts. What is it?',opts:['A malleable probe','A scalpel handle','A depth gauge','A dilator'],ans:1},
    {s:'You need the smallest, most delicate hemostat for a fine case. Which clamp do you select?',opts:['Kelly clamp','Rochester-Pean clamp','Kocher clamp','Mosquito clamp'],ans:3},
    {s:'The count sheet for a Basic Soft Tissue Set calls for the standard needle holder with cross-hatched jaws. Which instrument do you place?',opts:['Webster needle holder','Heaney needle holder','Olsen-Hegar needle holder','Mayo-Hegar needle holder'],ans:3},
    {s:'A minor procedure setup needs a device for manual irrigation with no suction connection. What do you add?',opts:['Yankauer suction','Poole suction','Bulb syringe','Frazier suction'],ans:2},
    {s:'You are picking instruments for a neuro case that needs precise suctioning in a small field. Which suction tip is appropriate?',opts:['Frazier suction','Yankauer suction','Poole suction','Bulb syringe'],ans:0},
    {s:'A clinic requests a tray for a simple wound closure. Which White Belt tray set is designed for this?',opts:['Basin Set','Lap/General Surgery Basic Set','Minor Procedure Tray','Laparoscopic Basic Tray'],ans:2},
    {s:'While assembling a tray, the count sheet lists periosteal elevators and bone curettes. Which tray are you building?',opts:['Basic Soft Tissue Set','Orthopedic Basic Soft Tissue Set','Minor Procedure Tray','Basin Set'],ans:1},
    {s:'The OR asks for towel clamps that will not puncture disposable drapes. Which variant do you provide?',opts:['Perforating towel clamps','Mosquito clamps','Allis clamps','Non-perforating towel clamps'],ans:3},
    {s:'A surgeon wants to explore a tract with an instrument that can be bent to shape and has a smooth rounded tip. What do you provide?',opts:['A depth gauge','A dilator','A malleable probe','Iris scissors'],ans:2},
    {s:'A count sheet lists both curved and straight versions of a medium hemostat. Which instrument is this?',opts:['Kelly clamp','Kocher clamp','Rochester-Pean clamp','Mosquito clamp'],ans:0},
    {s:'A new tech asks what belongs in a Basic Soft Tissue Set. Which contents list is correct?',opts:['Scalpel handles, scissors, forceps, needle holders, retractors, clamps, and a Yankauer','Trocars, lap scissors, graspers, and a clip applier','Basins, a graduated pitcher, and a medicine cup','Periosteal elevators and bone curettes'],ans:0},
    {s:'The surgeon wants general-purpose cutting scissors, not the fine-tipped Iris. Which White Belt scissors are described as general cutting?',opts:['Metzenbaum scissors','Mayo scissors','Laparoscopic scissors','Tissue scissors'],ans:3},
    {s:'You are completing a Laparoscopic Basic Tray that already has trocars, lap scissors, and graspers. Which instrument completes the set?',opts:['Clip applier','Bowel clamp','Periosteal elevator','Depth gauge'],ans:0},
    {s:'During function testing, a Weitlaner retractor\'s ratchet will not hold the arms open under light pressure. What is your assessment?',opts:['Acceptable; an assistant can hold it open','The self-retaining mechanism has failed; remove it from service','Normal wear for retractors','Use it only for shallow cases'],ans:1},
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
    {q:'If a bone rongeur spring does not return the jaws to the open position, what do you do?',opts:['Force it open manually','Remove from service; the spring mechanism has failed','Oil the spring','Use it in the closed position'],ans:1},
    {q:'Trocar obturators come in which two forms?',opts:['Curved and straight','Sharp and blunt','Perforating and non-perforating','Monopolar and bipolar'],ans:1},
    {q:'Which parts of a trocar must be inspected?',opts:['Footplate and blade','Cross-hatched jaws','Lumen and valve','Wire and handle attachment'],ans:2},
    {q:'What are the inspection points for laparoscopic scissors?',opts:['Footplate and cutting edge','Insulation and tip alignment','Wire kinks and handle attachment','Cup jaws and hinge'],ans:1},
    {q:'Where must insulation be intact on bipolar forceps?',opts:['Only at the tips','Only along the mid-shaft','At all contact points','Insulation is not required on bipolar instruments'],ans:2},
    {q:'What are the inspection points for a pituitary rongeur?',opts:['Cup jaws and hinge, checking for cracks','Footplate and cutting edge','Wire tension and handle attachment','Electrode and activation'],ans:0},
    {q:'When inspecting a curette, you examine the:',opts:['Ratchet engagement','Valve seal','Insulation continuity','Cup edge for chips or deformity'],ans:3},
    {q:'A bone file or rasp is inspected for:',opts:['Surface clogging and corrosion','Spring tension','Footplate alignment','Lumen patency'],ans:0},
    {q:'Which inspection points apply to a Stille-Luer bone rongeur?',opts:['Electrode and activation','Tip sharpness and shaft straightness','Jaw edges and spring return','Valve seal and lumen'],ans:2},
    {q:'Besides the cutting edge, what must be checked on an osteotome?',opts:['That the handle is secure','Spring return to open','Footplate travel','Insulation at the grip'],ans:0},
    {q:'What do you inspect on a nerve hook?',opts:['Cup jaws for cracks','The tip for deformity and the shaft for kinks','Insulation along the shaft','The footplate for chips'],ans:1},
    {q:'What is inspected on a dural hook?',opts:['Cup jaws and hinge','Footplate and cutting edge','Tip sharpness and a straight shaft','Spring return and jaw edges'],ans:2},
    {q:'Inspection of the combined suction irrigator includes:',opts:['Cutting edges for chips','Cross-hatched jaw surfaces','Footplate spring action','Lumen patency, clear ports, and intact seals'],ans:3},
    {q:'In addition to checking the tip for burrs, what must be verified for a trocar obturator?',opts:['Fit with its matching trocar','Insulation continuity','Spring return to the open position','Cup edge condition'],ans:0},
    {q:'Under the 9-point standard, an instrument that fails a single inspection point is:',opts:['Passed if the other eight points pass','Removed from service','Used with a notation in the log','Sent to the OR with a caution tag'],ans:1},
    {q:'Which sequence correctly lists the first three points of the 9-point inspection standard?',opts:['Insulation, Lumens, Corrosion','Tips, Serrations, Cutting Edges','Cutting Edges, Cleanliness, Ratchet Function','Cleanliness, Ratchet Function, Box Lock/Hinge'],ans:3},
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
    {s:'You are inspecting a periosteal elevator. The blade edge has started to curl slightly at one corner. What do you do?',opts:['Acceptable for a periosteal elevator','Remove from service; a curled blade edge indicates deformation that affects function and can damage tissue','Straighten it with pliers','Only matters for sharp elevators'],ans:1},
    {s:'You close a pair of laparoscopic scissors and the tips do not meet in alignment, though the insulation is intact. What is your action?',opts:['Release it; insulation is the only critical check','Remove it from service; tip alignment is an inspection point for laparoscopic scissors','Bend the tips back into alignment by hand','Pass it if the shaft is straight'],ans:1},
    {s:'A laparoscopic grasper\'s jaws close fully, but the ratchet will not hold them closed. What do you do?',opts:['Release it; the jaws still close','Ask the OR to hold the handle manually during use','Remove it from service; jaw closure and ratchet must both function','Tape the handle closed'],ans:2},
    {s:'While testing a laparoscopic clip applier, the jaw mechanism sticks halfway through its travel. What is your assessment?',opts:['The jaw mechanism has failed inspection; remove it from service','Acceptable if the lumen is clear','Normal for clip appliers','Work the jaws until they loosen and release it'],ans:0},
    {s:'A monopolar electrosurgical pencil passes the electrode and insulation checks, but you cannot verify activation. Can it be released?',opts:['Yes; electrode and insulation are sufficient','Yes, if it looks undamaged','Yes, the OR can test it at setup','No; activation must be verified before release'],ans:3},
    {s:'You find a small insulation nick on a bipolar forceps at a point where the user\'s hand contacts the instrument. The tips are clean. What do you do?',opts:['Release it; only tip insulation matters on bipolar','Remove it immediately; insulation must be intact at all contact points','Cover the nick and release','Monitor it over the next few uses'],ans:1},
    {s:'A Gigli saw\'s wire has a small kink near the handle attachment, but the wire is not broken. What is your action?',opts:['Remove it from service; kinks in the wire are an inspection failure','Straighten the kink and release','Acceptable as long as the wire is unbroken','Only replace the handle'],ans:0},
    {s:'You inspect a bone rongeur: the spring action is crisp, but one cutting edge has a visible chip. What do you do?',opts:['Release it; the spring is the critical check','Release it and note the chip on the count sheet','Remove it from service; a failed cutting edge check fails the instrument','Use it for soft tissue only'],ans:2},
    {s:'After washing, a bone rasp still has debris clogged in its surface. What is your action?',opts:['Release it; rasps are always textured','Pick out the visible debris at the assembly table and release','Release it and flag it for cleaning next cycle','Do not release it; the surface must be free of clogging before it can pass inspection'],ans:3},
    {s:'You find a hairline crack at the hinge of a pituitary rongeur. The cups close normally. What is your assessment?',opts:['Acceptable while the cups still close','Remove it from service; cracks at the hinge are an inspection failure','Monitor the crack at each reprocessing','Only a problem if the crack reaches the cups'],ans:1},
    {s:'A Kerrison rongeur has a small chip on its footplate, though the spring action is smooth. Can it be released?',opts:['Yes; the spring action is what matters','Yes, if the surgeon is notified','No; the footplate is a Kerrison inspection point and chips fail it','Yes, after smoothing the chip with a file'],ans:2},
    {s:'During inspection, a dural hook\'s tip has dulled compared to a new one. What do you do?',opts:['Remove it from service; tip sharpness is the dural hook\'s inspection point','Release it; dural hooks are meant to be blunt','Sharpen it at the assembly table','Release it if the shaft is straight'],ans:0},
    {s:'You inspect a hinged instrument from a specialty tray and find debris packed in the serrations after washing. Under the 9-point standard, what happens?',opts:['It passes if the ratchet and box lock work','It passes with a note to the next shift','It can be wiped at the assembly table and released','It fails; cleanliness and serrations are inspection points, and failing any point removes it from service'],ans:3},
    {s:'A coworker suggests skipping the lumen check on a suction irrigator because it \'looks clean from the outside.\' How do you respond?',opts:['Agree; visual inspection of the exterior is enough','Decline; lumens are one of the nine inspection points and lumen patency must be verified','Agree if it was machine washed','Check only the suction port to save time'],ans:1},
    {s:'While assembling, you grab a trocar obturator from a different set and it seats loosely in your trocar. What do you do?',opts:['Use it; loose seating is fine for blunt entry','Force it in until it seats tightly','Do not substitute; an obturator must be verified to fit its matching trocar','Wrap the pair and let the OR decide'],ans:2},
    {s:'You spot orange-brown corrosion on the box lock area of an instrument that otherwise functions perfectly. What is your assessment?',opts:['It fails inspection; corrosion is one of the nine points and any failed point removes it from service','It passes because function is normal','Polish it at the assembly table and release','Corrosion only matters on cutting edges'],ans:0},
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
    {q:'Before reprocessing a breast biopsy needle/localization wire, what must you verify?',opts:['The brand','Whether it is single-use (most facilities use single-use)','The color','The surgeon preference'],ans:1},
    {q:'Which Green Belt retractor is described as a flexible arm system?',opts:['Omni-Tract Retractor','Balfour Retractor','Thompson Retractor','Harrington Retractor'],ans:0},
    {q:'What design characterizes the Balfour retractor?',opts:['A ratchet mechanism for spreading ribs','A flexible blade shaped by the surgeon','A self-retaining design with a center blade and lateral arms','A table-mounted frame with multiple connectors'],ans:2},
    {q:'The Harrington retractor is best described as:',opts:['A flexible arm system','A curved retractor for deep abdominal retraction','A gynecologic self-retaining retractor','A perforating drape clamp'],ans:1},
    {q:'What makes the malleable (ribbon) retractor different from the other Green Belt retractors?',opts:['It is table-mounted','It is self-retaining','It uses a ratchet mechanism','It is flexible and can be shaped by the surgeon'],ans:3},
    {q:'The Finochietto rib spreader is used in which surgical specialty?',opts:['Gynecologic','Thoracic','Neurosurgical','Vascular'],ans:1},
    {q:'Which clamp has a rounded jaw designed for large vessels?',opts:['Bulldog Clamp','Right Angle (Mixter) Clamp','Pean Clamp','Backhaus Towel Clip'],ans:2},
    {q:'A bulldog clamp is used for:',opts:['Clamping chest tubes','Atraumatic bowel clamping','Perforating surgical drapes','Small temporary vessel occlusion'],ans:3},
    {q:'A Duval clamp is designed for use on what tissue?',opts:['Lung tissue','Bowel','Dura','Large vessels'],ans:0},
    {q:'What jaw feature does the pituitary rongeur have for disc removal?',opts:['A fenestrated triangular jaw','A 90-degree tip','A small cup','A spring-loaded serrated jaw'],ans:2},
    {q:'Bipolar bayonet forceps are angled for what purpose?',opts:['Neurosurgical coagulation','Lung tissue grasping','Rib spreading','Skin retraction'],ans:0},
    {q:'How many tray sets are included in the Green Belt curriculum?',opts:['8','10','12','14'],ans:2},
    {q:'A probe and groove director combines a probe with what second function?',opts:['A vessel occluder','A bone rongeur','A coagulation tip','An incision guide'],ans:3},
    {q:'The Thompson retractor is designed for retraction in which types of procedures?',opts:['Gynecologic procedures','Abdominal and thoracic procedures','Ophthalmic procedures','Superficial skin procedures'],ans:1},
    {q:'How many instruments does the Major Laparotomy tray set contain?',opts:['80+','40+','25+','120+'],ans:0},
    {q:'Which instruments are specifically noted for the Laminectomy/Spine tray set?',opts:['Trials, reamers, and power equipment','Heavy rongeurs and elevators','Satinsky clamps and vessel loops','Rib spreaders and lung clamps'],ans:1},
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
    {s:'A surgeon preference card requests a "Mixter." What instrument do they want?',opts:['A mixing bowl','A right angle clamp','A Metzenbaum scissors','A malleable retractor'],ans:1},
    {s:'A surgeon preference card for a tonsillectomy lists a \'Schnidt.\' What instrument do you pull?',opts:['A rounded-jaw vessel clamp','A long angled hemostat (tonsil clamp)','A non-perforating towel clip','An atraumatic bowel clamp'],ans:1},
    {s:'The OR reports that towel clips have been puncturing disposable drapes. The surgeon requests clips that will not perforate. Which do you supply?',opts:['Backhaus towel clips','Schnidt clamps','Jones towel clips','Pean clamps'],ans:2},
    {s:'A gynecologic case is posted and the surgeon asks for the self-retaining retractor designed for gynecologic procedures. Which do you send?',opts:['O\'Sullivan-O\'Connor retractor','Finochietto rib spreader','Harrington retractor','Balfour retractor'],ans:0},
    {s:'You are assembling a Vascular Surgery tray. Which items from your Green Belt training should you expect to verify on this set?',opts:['Rib spreaders and lung clamps','Heavy rongeurs and elevators','Intestinal clamps and towel clips','Satinsky clamps, bulldog clamps, and vessel loops'],ans:3},
    {s:'An unlabeled tray arrives at assembly containing a Finochietto rib spreader and Duval lung clamps. Which Green Belt tray set does it most likely belong to?',opts:['Thoracotomy','Bowel Resection','Craniotomy','Shoulder Arthroplasty'],ans:0},
    {s:'At the inspection station you pick up a fine double hook used for skin retraction. What instrument are you holding?',opts:['Frazier dural hook','Skin hook','Probe and groove director','Right angle clamp'],ans:1},
    {s:'You are building a Bowel Resection tray and the count sheet lists intestinal clamps. Which instrument satisfies that line?',opts:['Duval lung clamps','Satinsky clamps','Doyen clamps','Pean clamps'],ans:2},
    {s:'A tray you are verifying contains trials, reamers, and power equipment. Which Green Belt tray set are you working on?',opts:['Shoulder Arthroplasty','Laminectomy/Spine','Major Laparotomy','Open Cholecystectomy'],ans:0},
    {s:'A new tech asks which Green Belt retractors mount to the OR table. What is the correct pair?',opts:['Bookwalter and Thompson','Balfour and O\'Sullivan-O\'Connor','Malleable and Harrington','Finochietto and Omni-Tract'],ans:0},
    {s:'During Craniotomy tray assembly, the count sheet lists a fine hook used on the dura. Which instrument do you place?',opts:['Skin hook','Pituitary rongeur','Dura scissors','Frazier dural hook'],ans:3},
    {s:'Your Lead asks you to stage the two laparoscopic tray sets that appear on the Green Belt tray list. Which pair do you pull?',opts:['Laparoscopic Bariatric and Robotic','Laparoscopic Colectomy and Laparoscopic Hysterectomy','Open Cholecystectomy and CABG','Thoracotomy and Craniotomy'],ans:1},
    {s:'During Thoracotomy set assembly, the count sheet lists a heavy clamp used for chest tubes. Which instrument do you place?',opts:['A bulldog clamp','A Doyen clamp','A chest tube clamp','A Jones towel clip'],ans:2},
    {s:'You are staging case carts and see a Green Belt set labeled \'Retractor System Assembly.\' Which retractor system does the Green Belt tray list pair with this set?',opts:['Thompson','Omni-Tract','Balfour','Bookwalter'],ans:3},
    {s:'After a craniotomy case, the pickup contains dura scissors, bipolar bayonet forceps, a Frazier dural hook, and a Backhaus towel clip. The neuro count sheet lists only neurosurgical instruments. Which item does not belong on that list?',opts:['Dura scissors','Bipolar bayonet forceps','Backhaus towel clip','Frazier dural hook'],ans:2},
    {s:'The Lead asks you to gather the two self-retaining retractors from the Green Belt list for an in-service on retractor mechanisms. Which pair do you gather?',opts:['Bookwalter and Thompson','Balfour and O\'Sullivan-O\'Connor','Malleable and Harrington','Finochietto and skin hook'],ans:1},
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
    {q:'How many total named instruments should a Blue Belt tech know?',opts:['50','80','100','150'],ans:2},
    {q:'An aortic root retractor provides exposure of what structure?',opts:['The sternum','The cardiac root','The lung hilum','The renal pelvis'],ans:1},
    {q:'What is the function of a malleable coronary suction tip?',opts:['Flexible suction of the cardiac surgical field','Creating holes in the aorta','Retracting the aortic root','Clamping coronary vessels'],ans:0},
    {q:'Micro scissors are described as:',opts:['Heavy scissors for dense tissue','Curved scissors for ophthalmic procedures','Extremely fine scissors for microsurgical work','Spring-handled needle drivers'],ans:2},
    {q:'An arthroscopy shaver handpiece is a powered instrument used for:',opts:['Cataract removal','Sternotomy','Vessel sealing','Joint debridement'],ans:3},
    {q:'A phacoemulsification handpiece is used in which procedure?',opts:['Cataract surgery','Hip arthroscopy','Bladder examination','Sinus surgery'],ans:0},
    {q:'How many tray sets are included in the Blue Belt curriculum?',opts:['8','10','12','16'],ans:2},
    {q:'In addition to the leak test, what inspection does a flexible ureteroscope require?',opts:['Ratchet inspection','Channel inspection','Spring tension check','Jaw alignment check'],ans:1},
    {q:'A laparoscopic stapler performs which two actions?',opts:['Suctions and irrigates','Coagulates and retracts','Grasps and dissects','Fires staples and cuts'],ans:3},
    {q:'An endoscopic clip applier is described as:',opts:['Multi-fire, for laparoscopic hemostasis','Single-use silicone for vessel identification','An ultrasonic energy device','A rigid scope for bladder examination'],ans:0},
    {q:'A Harmonic scalpel handpiece uses ultrasonic energy to do what to tissue?',opts:['Fuse it under pressure','Cut and coagulate it','Apply clips to it','Staple and divide it'],ans:1},
    {q:'Which of the following is a Blue Belt tray set?',opts:['Major Laparotomy','Laparoscopic Hysterectomy','Laparoscopic Bariatric','Open Cholecystectomy'],ans:2},
    {q:'Besides the optics, which inspection points are listed for a rigid cystoscope?',opts:['Light post and seals','Ratchet and box lock','Jaw surfaces and cable','Staple cartridge and anvil'],ans:0},
    {q:'Which Blue Belt tray set is designated for trauma?',opts:['Liver Resection','Spinal Fusion','Laparoscopic Bariatric','Exploratory Laparotomy'],ans:3},
    {q:'A sternal saw is a powered instrument used to perform what?',opts:['A craniotomy','A sternotomy','A laminectomy','An arthroscopy'],ans:1},
    {q:'The Blue Belt robotic tray set is associated with which system?',opts:['Bookwalter','Omni-Tract','da Vinci','LigaSure'],ans:2},
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
    {s:'A phacoemulsification handpiece arrived from the ophthalmic OR. You have never processed one before. What is your first step?',opts:['Process it like any other instrument','Locate and read the manufacturer IFU before touching it. Ophthalmic instruments have specific processing requirements, and TASS (Toxic Anterior Segment Syndrome) is a known risk from improper cleaning','Ask the OR to clean it themselves','Put it in the ultrasonic'],ans:1},
    {s:'You are assembling a Valve Replacement set and the aortic root retractor is on the count sheet. Which points does your training list for its inspection?',opts:['Blade and ratchet','Optics and seals','Jaw surfaces and cable','Channels and light post'],ans:0},
    {s:'At the assembly table for an ophthalmology set, you must place the curved, fine scissors used for ophthalmic procedures. Which instrument is it?',opts:['Micro scissors','Corneal scissors','Castroviejo micro needle driver','Aortic punch'],ans:1},
    {s:'The Knee Arthroscopy case cart is missing its fluid management component. Which item do you add?',opts:['Arthroscopy pump tubing','Coronary suction tip','Vessel loops','LigaSure device'],ans:0},
    {s:'An orthopedic surgeon posts a hip arthroscopy and asks for the access instruments. What do you prepare?',opts:['The Knee Arthroscopy set','The Hip Replacement Revision set','The Hip Portal Set','The Spinal Fusion set'],ans:2},
    {s:'A LigaSure vessel sealing device arrives at your inspection station. Which points must you inspect?',opts:['Blade and ratchet','Optics and light post','Channels and seals','Jaw surfaces and cable'],ans:3},
    {s:'In decontam you find micro scissors loose beneath heavy instruments in a transport bin. What is your concern?',opts:['None; scissors are durable instruments','Micro scissors are extremely fine and easily damaged by contact with heavy instruments; inspect them carefully before they proceed','Only visible rust would be a problem','They only require a rinse before assembly'],ans:1},
    {s:'Two cardiac cases are posted for tomorrow. Which two Blue Belt cardiac tray sets do you stage?',opts:['Open Heart/CABG and Valve Replacement','Liver Resection and Spinal Fusion','Laparoscopic Bariatric and Robotic','FESS and Cochlear Implant'],ans:0},
    {s:'Silicone vessel loops arrive in decontam mixed with instruments from an open vascular case. A new tech asks whether to load them in the washer for reuse. What do you tell them?',opts:['Wash and sterilize them with the set','They are single-use silicone items; they are not reprocessed. Discard them per policy','Soak them in enzymatic solution first','Send them out for repair evaluation'],ans:1},
    {s:'Urology posts a procedure requiring ureteral and renal access. Which scope do you prepare?',opts:['Rigid cystoscope','Arthroscopy shaver handpiece','Flexible ureteroscope','Phacoemulsification handpiece'],ans:2},
    {s:'An ENT surgeon posts an endoscopic sinus case. Which Blue Belt tray set do you stage?',opts:['Cochlear Implant','Spinal Fusion','FESS/Endoscopic Sinus','Knee Arthroscopy'],ans:2},
    {s:'Two clip appliers arrive in decontam: one from an open vascular case and one from a laparoscopic case. Which applier belongs to the open case?',opts:['Endoscopic clip applier','Laparoscopic stapler','Harmonic scalpel handpiece','Ligaclip applier'],ans:3},
    {s:'Tomorrow\'s schedule shows a liver resection, a hip revision arthroplasty, and a bariatric laparoscopic case. Which three Blue Belt sets do you pull?',opts:['Liver Resection, Hip Replacement Revision, and Laparoscopic Bariatric','Open Heart/CABG, Valve Replacement, and Robotic','Laparoscopic Bowel Resection, FESS, and Cochlear Implant','Spinal Fusion, Knee Arthroscopy, and Exploratory Laparotomy'],ans:0},
    {s:'You are organizing the energy device storage area. Which two Blue Belt devices belong there?',opts:['Sternal saw and arthroscopy shaver','Harmonic scalpel and LigaSure','Aortic punch and Ligaclip applier','Ureteroscope and cystoscope'],ans:1},
    {s:'Urology posts a bladder examination. Which scope do you prepare?',opts:['Flexible ureteroscope','Rigid ureteroscope','Flexible cystoscope','Rigid cystoscope'],ans:3},
    {s:'A microsurgeon needs the needle driver for microsurgical suturing. Which instrument do you provide?',opts:['Micro scissors','Corneal scissors','Castroviejo micro needle driver','Endoscopic clip applier'],ans:2},
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
function _instSaveProgress(p){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.upsertInstrumentProgress){SB.upsertInstrumentProgress(_instProgToBackend(p)).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Instruments progress');else console.warn('[inst] progress sync',e&&e.message);});}}catch(e){console.warn('[inst] progress sync',e);}}
function _instSaveAssignment(a){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.createInstrumentAssignment){SB.createInstrumentAssignment({staff_id:a.staffId,module_id:a.moduleId,assigned_by:a.assignedBy||null,type:a.type,trigger:a.trigger,assignment_type:a.type,trigger_event:a.trigger,facility_id:a.facilityId||null,assigned_date:a.assignedDate,status:a.status}).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Instruments assignment');else console.warn('[inst] assignment sync',e&&e.message);});}}catch(e){console.warn('[inst] assignment sync',e);}}
function _instSaveAssignmentStatus(sid,mid,status){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.updateInstrumentAssignmentStatus){SB.updateInstrumentAssignmentStatus(sid,mid,status).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Instruments status');else console.warn('[inst] status sync',e&&e.message);});}}catch(e){}}

// Returns true if a new assignment was created, false if skipped as a duplicate
// (RLS Addendum 8.3). Mirrors foundations.js assignModule.
function assignInstModule(sid,mid,by,type,trigger){
 if(!DB.instrumentAssignments) DB.instrumentAssignments=[];
 if(DB.instrumentAssignments.find(a=>a.staffId===sid&&a.moduleId===mid)) return false;
 const _s=(typeof getStaff==='function')?getStaff(sid):(DB.staff||[]).find(x=>x.id===sid);
 const _a={id:'ia-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),staffId:sid,moduleId:mid,assignedBy:by,type:type||'remediation',trigger:trigger||null,facilityId:_s?_s.fid:null,assignedDate:new Date().toISOString().slice(0,10),status:'assigned'};
 DB.instrumentAssignments.push(_a);
 if(!DB.instrumentProgress) DB.instrumentProgress=[];
 let _p=DB.instrumentProgress.find(x=>x.staffId===sid&&x.moduleId===mid);
 if(!_p){ _p={staffId:sid,moduleId:mid,g1:{status:'open',score:0,attempts:[]},g2:{status:'open',score:0,attempts:[]},g3:{status:'open',items:[]},complete:false}; DB.instrumentProgress.push(_p); }
 _instSaveAssignment(_a); _instSaveProgress(_p);
 return true;
}
// Onboarding bulk-assign. Returns the count actually assigned (skips duplicates, 8.3).
function assignAllInstModules(sid,by){let n=0;INSTRUMENT_MODULES.forEach(m=>{if(assignInstModule(sid,m.id,by,'onboarding',null))n++;});return n;}
function saveInstGateScore(sid,mid,gate,score){
 if(!DB.instrumentProgress) DB.instrumentProgress=[];
 let p=DB.instrumentProgress.find(x=>x.staffId===sid&&x.moduleId===mid);
 if(!p){p={staffId:sid,moduleId:mid,g1:{status:'open',score:0,attempts:[]},g2:{status:'open',score:0,attempts:[]},g3:{status:'open',items:[]},complete:false};DB.instrumentProgress.push(p);}
 const g=p[gate];g.attempts.push({date:new Date().toISOString().slice(0,10),score});
 // Best score wins; a passed gate never regresses from a practice retake
 g.score=Math.max(g.score||0,score);
 if(score>=80) g.status='pass'; else if(g.status!=='pass') g.status='attempted';
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
 // Unchecking cascades (RLS Addendum 8.2): revoked confirmation reverts G3
 // pass -> open; a previously complete module reverts to in-progress.
 const m=INSTRUMENT_MODULES.find(x=>x.id===mid);
 if(m){
   const allDone=m.observations.every(o=>p.g3.items.some(i=>i.id===o.id&&i.confirmed));
   if(allDone){p.g3.status='pass';p.g3.score=100;}
   else if(p.g3.status==='pass'){p.g3.status='open';p.g3.score=0;}
 }
 const a=(DB.instrumentAssignments||[]).find(x=>x.staffId===sid&&x.moduleId===mid);
 if(p.g1.status==='pass'&&p.g2.status==='pass'&&p.g3.status==='pass'){
   p.complete=true; if(a)a.status='completed';
 } else if(p.complete){
   p.complete=false; if(a)a.status='assigned';
   _instSaveAssignmentStatus(sid,mid,'assigned');
 }
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
// Per-attempt shuffled question order + practice-retake flags (mirrors foundations.js).
// The order array maps display index -> original item index; submitInstGate scores against it.
// Each attempt draws INST_GATE_DRAW questions from the module's full bank.
const INST_GATE_DRAW=10;
let INST_GATE_ORDER={};
let INST_GATE_RETAKE={};
function retakeInstGate(mid,gk){
 INST_GATE_RETAKE[mid+gk]=true;
 ST._instTab=gk==='g1'?'gate1':'gate2';
 openInstModule(mid);
}
function renderInstGate(m,s,gk,items,title,desc){
 const gates=getInstModuleGates(s.id,m.id),g=gates[gk];
 const retake=!!INST_GATE_RETAKE[m.id+gk];
 const locked=g.status==='pass'&&!retake;
 const order=shuffleArray(items.map((_,i)=>i)).slice(0,INST_GATE_DRAW);
 INST_GATE_ORDER[m.id+gk]=order;
 let h='<div class="fnd-kc"><div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">'+title+'</div><div style="font-size:12px;color:#94a3b8;margin-bottom:16px">'+desc+'</div>';
 if(locked){h+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px;text-align:center;margin-bottom:16px"><div style="font-size:20px;font-weight:700;color:#4ade80">'+g.score+'%</div><div style="font-size:13px;color:#4ade80;font-weight:600">Passed</div><button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="retakeInstGate(\''+m.id+'\',\''+gk+'\')">Retake (practice)</button></div>';}
 else if(retake&&g.status==='pass'){h+='<div style="background:rgba(196,154,32,.08);border:1px solid rgba(196,154,32,.25);border-radius:var(--r);padding:10px 14px;margin-bottom:16px;font-size:12px;color:#94a3b8">Practice retake &mdash; your passed status and best score ('+g.score+'%) are kept even if you score lower.</div>';}
 const qk=gk==='g1'?'q':'s';
 order.forEach((origIdx,qi)=>{const item=items[origIdx];h+='<div class="fnd-q" data-qi="'+qi+'"><div class="fnd-q-text">'+(qi+1)+'. '+(item[qk]||item.q||item.s)+'</div>';item.opts.forEach((opt,oi)=>{h+='<label class="fnd-q-opt"><input type="radio" name="inst-'+gk+'-'+m.id+'-'+qi+'" value="'+oi+'"'+(locked?' disabled':'')+'><span class="fnd-q-lbl">'+opt+'</span></label>';});h+='</div>';});
 if(!locked) h+='<button class="btn btn-gold" style="margin-top:16px;width:100%" onclick="submitInstGate(\''+m.id+'\',\''+gk+'\')">Submit</button>';
 h+='<div id="inst-gate-result"></div></div>';return h;
}
function renderInstG3(m,s,gates){
 let h='<div class="fnd-kc"><div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">Observation / Demonstration</div><div style="font-size:12px;color:#94a3b8;margin-bottom:16px">Your educator confirms each item after observing you demonstrate the skill with real instruments.</div>';
 if(gates.g3.status==='pass') h+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px;text-align:center;margin-bottom:16px"><div style="font-size:16px;font-weight:700;color:#4ade80">All Items Confirmed</div></div>';
 m.observations.forEach(obs=>{const conf=gates.g3.items.find(i=>i.id===obs.id&&i.confirmed);h+='<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">';if(conf){h+='<svg viewBox="0 0 18 18" width="16" height="16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="9" cy="9" r="8" fill="rgba(74,222,128,.15)" stroke="#4ade80" stroke-width="1.3"/><path d="M5.5 9.5l2.5 2.5L13 7" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><div><div style="font-size:13px;color:#4ade80">'+obs.text+'</div><div style="font-size:11px;color:#64748b;margin-top:2px">Confirmed by '+Security.sanitize(conf.confirmedBy||'—')+' on '+Security.sanitize(conf.date||'')+'</div></div>';}else{h+='<svg viewBox="0 0 18 18" width="16" height="16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="9" cy="9" r="8" stroke="#475569" stroke-width="1.3"/></svg><div style="font-size:13px;color:#94a3b8">'+obs.text+'</div>';}h+='</div>';});
 h+='</div>';return h;
}
function submitInstGate(mid,gk){
 const m=INSTRUMENT_MODULES.find(x=>x.id===mid);if(!m)return;const s=getStaff(ST.staffId);if(!s)return;
 const items=gk==='g1'?m.questions:m.simulations;
 // Score against the shuffled draw the user actually saw (display idx -> item idx)
 const order=INST_GATE_ORDER[m.id+gk]||items.map((_,i)=>i).slice(0,INST_GATE_DRAW);
 delete INST_GATE_RETAKE[m.id+gk];
 let correct=0;
 order.forEach((origIdx,qi)=>{const sel=document.querySelector('input[name="inst-'+gk+'-'+m.id+'-'+qi+'"]:checked');if(sel&&parseInt(sel.value)===items[origIdx].ans) correct++;});
 const score=Math.round((correct/order.length)*100);saveInstGateScore(s.id,m.id,gk,score);
 order.forEach((origIdx,qi)=>{const item=items[origIdx];const opts=document.querySelectorAll('input[name="inst-'+gk+'-'+m.id+'-'+qi+'"]');opts.forEach((opt,oi)=>{const lbl=opt.closest('.fnd-q-opt');if(!lbl)return;opt.disabled=true;if(oi===item.ans)lbl.classList.add('fnd-q-correct');else if(opt.checked&&oi!==item.ans)lbl.classList.add('fnd-q-wrong');});});
 const rEl=document.getElementById('inst-gate-result');const gateLabel=gk==='g1'?'Knowledge':'Simulation';
 if(rEl){if(score>=80){rEl.innerHTML='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#4ade80">'+score+'%</div><div style="font-size:13px;color:#4ade80;font-weight:600;margin:4px 0">'+gateLabel+' Gate Passed</div><div style="font-size:12px;color:#94a3b8">'+correct+' of '+order.length+' correct.</div></div>';toast(gateLabel+' passed: '+score+'%','ok');}
 else{rEl.innerHTML='<div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#f87171">'+score+'%</div><div style="font-size:13px;color:#f87171;font-weight:600;margin:4px 0">Not Yet Passing</div><div style="font-size:12px;color:#94a3b8">'+correct+' of '+order.length+' correct. 80% required.</div><button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="openInstModule(\''+mid+'\')">Try Again</button></div>';toast('Score: '+score+'%. 80% required.','err');}}
}
 
// ── Hospital Portal: Render Instruments ──
function renderHInstruments(){
 // Renders in the Hospital Portal (h-instruments) or, for master/staff admins, the
 // Network Admin portal (a-instruments) — same view, container picked by portal.
 const el=document.getElementById(ST.portal==='admin'?'a-instruments':'h-instruments');if(!el)return;
 // Role scope (RLS Addendum v1.1 section 6): master_admin/admin/staff_admin/assessor see ALL
 // facilities; educator/manager/facility_admin/hospital see their own. Same pattern as Foundations.
 const _u=ST.user;
 const isSystemWide=!!(_u&&['master_admin','admin','staff_admin','assessor'].includes(_u.role));
 // Assessor = staff_admin on this platform (see foundations.js renderHTraining note).
 const isAssessor=!!(_u&&(_u.role==='staff_admin'||_u.role==='assessor'));
 let scopeFacs=DB.facilities.filter(f=>f.active!==false);
 if(isSystemWide&&_u.role==='staff_admin'&&(_u.assignedFids||[]).length) scopeFacs=scopeFacs.filter(f=>_u.assignedFids.includes(f.id));
 let staff;
 if(isSystemWide){
   staff=DB.staff.filter(s=>scopeFacs.some(f=>f.id===s.fid));
   const ff=ST._instFacFilter||'all';
   if(ff!=='all') staff=staff.filter(s=>s.fid===ff);
 } else {
   staff=DB.staff.filter(s=>s.fid===ST.hFid);
 }
 let totalA=0,totalC=0,staffWith=0;const rows=[];
 staff.forEach(s=>{const asgns=getInstrumentAssignments(s.id);const done=asgns.filter(a=>a.status==='completed').length;if(asgns.length>0){staffWith++;totalA+=asgns.length;totalC+=done;}rows.push({s,assigned:asgns.length,done,pct:asgns.length>0?Math.round(done/asgns.length*100):0});});
 let html='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Instruments'+(isSystemWide?' <span style="font-size:11px;color:#64748b;font-weight:500">(all facilities)</span>':'')+'</div></div><div class="card-body"><p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 16px">Assign instrument training by belt level for onboarding or targeted remediation. Each module requires three gates.</p>';
 if(isSystemWide){html+='<div style="margin-bottom:14px"><select class="form-select" style="max-width:280px" onchange="ST._instFacFilter=this.value;renderHInstruments()"><option value="all"'+((ST._instFacFilter||"all")==="all"?" selected":"")+'>All Facilities</option>'+scopeFacs.slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(f=>'<option value="'+f.id+'"'+(ST._instFacFilter===f.id?" selected":"")+'>'+f.name+'</option>').join("")+'</select></div>';}
 html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:8px"><div class="stat-card-mini"><div class="stat-lbl">Enrolled</div><div class="stat-val">'+staffWith+'</div></div><div class="stat-card-mini"><div class="stat-lbl">Assigned</div><div class="stat-val">'+totalA+'</div></div><div class="stat-card-mini"><div class="stat-lbl">Completed</div><div class="stat-val" style="color:#4ade80">'+totalC+'</div></div><div class="stat-card-mini"><div class="stat-lbl">Rate</div><div class="stat-val">'+(totalA>0?Math.round(totalC/totalA*100):0)+'%</div></div></div></div></div>';
 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Staff Instrument Training</div></div><div class="card-body" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th>'+(isSystemWide?'<th>Facility</th>':'')+'<th>Belt</th><th>Modules</th><th>Actions</th></tr></thead><tbody>';
 rows.sort((a,b)=>fullName(a.s).localeCompare(fullName(b.s)));
 rows.forEach(r=>{html+='<tr><td style="font-weight:600">'+fullName(r.s)+'</td>'+(isSystemWide?'<td style="font-size:12px;color:#94a3b8">'+((DB.facilities.find(f=>f.id===r.s.fid)||{}).name||'—')+'</td>':'')+'<td><span class="bb bb-'+r.s.belt+'">'+r.s.belt+'</span></td><td>'+(r.assigned>0?'<span class="'+(r.pct===100?'tc-ok':r.pct>0?'tc-warn':'tc-muted')+'">'+r.done+'/'+r.assigned+'</span>':'<span class="tc-muted">None</span>')+'</td><td style="white-space:nowrap">';
 if(r.assigned>0) html+='<button class="btn btn-ghost btn-xs" onclick="hInstStaffDetail(\''+r.s.id+'\')">View</button> ';
 if(!isAssessor){
 if(r.assigned<4) html+='<button class="btn btn-gold btn-xs" onclick="hAssignInstModal(\''+r.s.id+'\')">Assign</button> ';
 if(r.assigned===0) html+='<button class="btn btn-blue btn-xs" onclick="hAssignAllInst(\''+r.s.id+'\')">All 4</button>';
 }
 html+='</td></tr>';});
 html+='</tbody></table></div></div></div>';el.innerHTML=html;
}
function hInstStaffDetail(sid){
 const s=getStaff(sid);if(!s)return;const el=document.getElementById(ST.portal==='admin'?'a-instruments':'h-instruments');if(!el)return;
 let html='<button class="btn btn-ghost btn-sm" onclick="renderHInstruments()" style="margin-bottom:12px">&larr; Back</button>';
 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">'+fullName(s)+'</div><span class="bb bb-'+s.belt+'">'+s.belt+'</span></div><div class="card-body"><div style="font-size:13px;color:#94a3b8">'+s.role+'</div></div></div>';
 INSTRUMENT_MODULES.forEach(m=>{
   if(!isInstModuleAssigned(s.id,m.id)) return;const gates=getInstModuleGates(s.id,m.id);
   const a=getInstrumentAssignments(s.id).find(x=>x.moduleId===m.id);
   html+='<div class="card mb16"><div class="card-hd" style="flex-wrap:wrap;gap:8px"><div style="display:flex;align-items:center;gap:8px"><div class="fnd-num'+(gates.complete?' fnd-num-done':'')+'">'+m.num+'</div><div class="card-ttl" style="font-size:14px;margin:0">'+m.title+'</div></div><div style="display:flex;gap:4px;align-items:center">'+fndGateBadge(gates.g1.status)+fndGateBadge(gates.g2.status)+fndGateBadge(gates.g3.status)+((ST.user&&ST.user.role==='master_admin')?'<button class="btn btn-ghost btn-xs" style="margin-left:8px;border-color:rgba(239,68,68,.4);color:#f87171" onclick="hUnassignInst(\''+s.id+'\',\''+m.id+'\')">Unassign</button>':'')+'</div></div><div class="card-body" style="padding-top:0">';
   html+='<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:#94a3b8"><span>G1: '+(gates.g1.status==='pass'?'<span class="tc-ok">'+gates.g1.score+'%</span>':'<span class="tc-muted">'+gates.g1.status+'</span>')+'</span><span>G2: '+(gates.g2.status==='pass'?'<span class="tc-ok">'+gates.g2.score+'%</span>':'<span class="tc-muted">'+gates.g2.status+'</span>')+'</span><span>G3: '+(gates.g3.status==='pass'?'<span class="tc-ok">Confirmed</span>':'<span class="tc-warn">Pending</span>')+'</span></div>';
   // Audit trail (Addendum 7.1): who assigned this, when, why, and what triggered it.
   if(a){ const _typeLbl=a.type==='onboarding'?'Onboarding':'Remediation'; html+='<div style="font-size:11px;color:#64748b;margin-bottom:12px">Assigned by '+Security.sanitize(a.assignedBy||'—')+(a.assignedDate?' · '+Security.sanitize(a.assignedDate):'')+' · '+_typeLbl+(a.trigger?' · Trigger: '+Security.sanitize(a.trigger):'')+'</div>'; }
   // Rendered even after G3 passes so a mis-click can be un-confirmed (Addendum 8.2 revoke cascade).
   html+='<div style="font-size:12px;font-weight:600;color:#c49a20;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Gate 3: Confirm Observations</div>';
   m.observations.forEach(obs=>{const conf=gates.g3.items.find(i=>i.id===obs.id&&i.confirmed);html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)"><input type="checkbox" style="accent-color:#4ade80;flex-shrink:0" '+(conf?'checked':'')+' onchange="markInstG3Wrap(\''+s.id+'\',\''+m.id+'\',\''+obs.id+'\',this.checked)"><span style="font-size:12.5px;color:'+(conf?'#4ade80':'#94a3b8')+'">'+obs.text+'</span></div>';});
   html+='</div></div>';
 });el.innerHTML=html;
}
function markInstG3Wrap(sid,mid,itemId,checked){const by=ST.user?ST.user.name:'Manager';markInstG3Item(sid,mid,itemId,checked,by);hInstStaffDetail(sid);}
// Unassign (Master Admin only, RLS Addendum matrix). Progress kept as history (8.4).
function hUnassignInst(sid,mid){
 if(!(ST.user&&ST.user.role==='master_admin')){toast('Only the Master Admin can unassign modules','err');return;}
 if(!confirm('Unassign this module? The staff member loses access; progress history is kept.'))return;
 DB.instrumentAssignments=(DB.instrumentAssignments||[]).filter(a=>!(a.staffId===sid&&a.moduleId===mid));
 try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.deleteInstrumentAssignment){SB.deleteInstrumentAssignment(sid,mid).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Instruments unassign');});}}catch(e){}
 toast('Module unassigned','info');
 if(getInstrumentAssignments(sid).length>0) hInstStaffDetail(sid); else renderHInstruments();
}
function hAssignInstModal(sid){
 if(ST.user&&(ST.user.role==='staff_admin'||ST.user.role==='assessor')){toast('Assessors cannot assign modules','err');return;}
 const s=getStaff(sid);if(!s)return;const existing=getInstrumentAssignments(s.id);const unassigned=INSTRUMENT_MODULES.filter(m=>!existing.some(a=>a.moduleId===m.id));
 if(!unassigned.length){toast('All modules assigned','info');return;}
 let html='<div style="margin-bottom:12px;font-size:13px;color:#94a3b8">Assign to <strong style="color:#e2e8f0">'+fullName(s)+'</strong>:</div>';
 // Audit trail (Addendum 7.1): capture the reason + trigger. Mirrors Foundations.
 html+='<div style="margin-bottom:12px"><label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px">Reason</label>';
 html+='<select id="inst-assign-type" class="form-select" onchange="var w=document.getElementById(\'inst-trigger-wrap\');if(w)w.style.display=this.value===\'remediation\'?\'block\':\'none\'">';
 html+='<option value="remediation">Remediation (targeted retraining)</option>';
 html+='<option value="onboarding">Onboarding</option>';
 html+='</select></div>';
 html+='<div id="inst-trigger-wrap" style="margin-bottom:12px"><label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px">Trigger event <span style="color:#64748b">(gate failure or incident reference, optional)</span></label>';
 html+='<input id="inst-assign-trigger" type="text" class="form-input" placeholder="e.g. G2 fail 2026-07-01 or incident #123"></div>';
 html+='<div style="max-height:300px;overflow-y:auto">';
 unassigned.forEach(m=>{html+='<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;font-size:13px;color:#cbd5e1"><input type="checkbox" class="inst-assign-cb" value="'+m.id+'" style="accent-color:#c49a20"><span><strong>'+m.num+'.</strong> '+m.title+'</span></label>';});
 html+='</div><div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button><button class="btn btn-gold btn-sm" onclick="hDoAssignInst(\''+s.id+'\')">Assign</button></div>';
 openModal('Assign Instrument Modules',html,'modal-sm');
}
function hDoAssignInst(sid){
 if(ST.user&&(ST.user.role==='staff_admin'||ST.user.role==='assessor')){toast('Assessors cannot assign modules','err');return;}
 const cbs=document.querySelectorAll('.inst-assign-cb:checked');
 if(!cbs.length){toast('Select at least one','err');return;}
 const nm=ST.user?ST.user.name:'Manager';
 const typeEl=document.getElementById('inst-assign-type');
 const type=(typeEl&&typeEl.value==='onboarding')?'onboarding':'remediation';
 const trigEl=document.getElementById('inst-assign-trigger');
 const trigger=(type==='remediation'&&trigEl&&trigEl.value.trim())?trigEl.value.trim():null;
 let assigned=0,skipped=0;
 cbs.forEach(cb=>{ if(assignInstModule(sid,cb.value,nm,type,trigger)) assigned++; else skipped++; });
 closeModal();
 if(assigned) toast(assigned+' module'+(assigned>1?'s':'')+' assigned','ok');
 if(skipped) toast(skipped+' already assigned — skipped','info');
 renderHInstruments();
}
function hAssignAllInst(sid){
 if(ST.user&&(ST.user.role==='staff_admin'||ST.user.role==='assessor')){toast('Assessors cannot assign modules','err');return;}
 const assigned=assignAllInstModules(sid,ST.user?ST.user.name:'Manager');
 const skipped=INSTRUMENT_MODULES.length-assigned;
 if(!assigned) toast('All 4 instrument modules already assigned','info');
 else{ toast(assigned+' module'+(assigned>1?'s':'')+' assigned','ok'); if(skipped) toast(skipped+' already assigned — skipped','info'); }
 renderHInstruments();
}


