// SBD_Preceptor_Code.js
// ============================================================
// SBD PRECEPTOR CERTIFICATION - Phase 1 (content + scored Knowledge gate)
// Fourth curriculum on the Foundations rails. Mirrors instruments.js.
// Spec: docs/decisions/2026-07-21-preceptor-certification-ph1.md
// Data below is generated from PRECEPTOR_CONTENT.json; logic mirrors
// foundations.js/instruments.js and reuses their shared gate helpers.
// ============================================================

const PRECEPTOR_MODULES = [
 {
  "id": "P01",
  "seq": 1,
  "level": 1,
  "levelLabel": "Level 1 Facilitator",
  "levelPos": "1 of 6",
  "title": "The SBD Philosophy and System Architecture",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 1"
 },
 {
  "t": "p",
  "text": "Module 1"
 },
 {
  "t": "p",
  "text": "The SBD Philosophy and System Architecture"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "Read this on your own. It will develop you step by step, the same way you will one day develop your staff."
 },
 {
  "t": "p",
  "text": "Estimated time: 4 hours · Ends with a knowledge check you must pass at 80%"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "How to use this workbook"
 },
 {
  "t": "p",
  "text": "This is not a slide deck someone will read to you. It is a self-paced workbook, and it is written to develop you directly. You read it alone, at your own pace, and it walks you through every idea in order, explains why each one matters, shows you an example, and then asks you to do something with it before you move on."
 },
 {
  "t": "p",
  "text": "That is the same experience your future staff will have with the SBD learning system. You are about to learn the way they learn, on purpose. Pay attention to how it feels to be developed this way, because one day you will be the person on the other side of it."
 },
 {
  "t": "callout",
  "label": "Do This",
  "text": "Work it, don't skim it. Three things appear throughout this workbook. When you see them, stop and do them. They are where the learning actually happens. Pause and think. A short question with space to write. Write a real answer, not a word. Example. A worked scenario. Read it slowly and notice the reasoning, not just the outcome. Check yourself. A quick self-test. If you cannot answer it, re-read the section before moving on."
 },
 {
  "t": "p",
  "text": "At the end there is a knowledge check. You need 80% to complete this module. The answer key is included, but do the check before you look at it. Guessing your way past this module only hurts the staff who will depend on you later."
 },
 {
  "t": "h1",
  "text": "What you will be able to do"
 },
 {
  "t": "p",
  "text": "By the end of this module, you will be able to do four things. Read them now. You will see them again at the end, and you will be able to check each one off honestly."
 },
 {
  "t": "list",
  "items": [
   "Explain the shift from teacher-centered training to system-facilitated learning, and why it matters for sterile processing.",
   "Describe the SBD competency framework, the belt system, from White through Black, in your own words.",
   "Explain how SBD OS and David OG work together as one system, and what each part does.",
   "Identify your new role as a facilitator: coach, observer, and interpreter, and name what you no longer do."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 4"
 },
 {
  "t": "h1",
  "text": "The problem we solve"
 },
 {
  "t": "p",
  "text": "Before you can facilitate the SBD way, you have to understand why the old way stopped working. If you do not believe there is a real problem, you will not commit to the solution, and your staff will feel that."
 },
 {
  "t": "h2",
  "text": "Start with what you already know"
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Think about how you were trained when you first entered sterile processing. Who trained you? How did they decide you were “ready” to work on your own? Write it down before you read on"
 },
 {
  "t": "p",
  "text": "Hold onto that memory. Most people, when they answer honestly, describe something like this: they followed an experienced tech around for a few days or weeks, picked things up by watching, and at some point someone simply decided they were ready, often because the department was short-staffed and needed them on the floor. There was rarely a test of whether they could actually do the work correctly and safely on their own."
 },
 {
  "t": "p",
  "text": "That is not a knock on the people who trained you. They did their best with the only model the field had. But that model has three problems, and once you see them, you cannot unsee them."
 },
 {
  "t": "h2",
  "text": "Problem one: it is inconsistent"
 },
 {
  "t": "p",
  "text": "When training happens by following someone around, every technician learns whatever their trainer happened to know, happened to remember to show them, and happened to do correctly that day. Two techs trained in the same department by two different preceptors can end up with very different skills, and neither of them knows what they missed."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Two techs, one department Tech A was precepted by someone meticulous about instrument inspection, so Tech A checks every hinge and box lock by feel. Tech B was precepted by someone who was rushing that week, so Tech B never learned to check insulation on laparoscopic instruments at all. Both were told they were “trained.” Both are now working on live trays. One gap is invisible until an instrument fails in a case. That is inconsistency, and it is dangerous precisely because no one can see it."
 },
 {
  "t": "h2",
  "text": "Problem two: it does not scale"
 },
 {
  "t": "p",
  "text": "Follow-along training ties up your most experienced people. Every new hire consumes the time of a senior tech who could otherwise be doing skilled work. When you have one or two new people, that is manageable. When you have turnover, or you are opening a new department, or you lose several staff at once, there are not enough experienced hands to train everyone properly, so corners get cut and the inconsistency gets worse."
 },
 {
  "t": "h2",
  "text": "Problem three: it is subjective"
 },
 {
  "t": "p",
  "text": "“Ready” is a feeling in the old model. Someone looks at a new tech and decides they seem ready. There is no defined standard, no objective measure, and no record. If a surveyor or a manager asks “how do you know this person is competent,” the honest answer is usually “I just know,” and that answer does not hold up."
 },
 {
  "t": "h2",
  "text": "Why this matters more in sterile processing than almost anywhere"
 },
 {
  "t": "p",
  "text": "In many jobs, an inconsistent, unscalable, subjective training model produces mediocre work. In sterile processing, it produces risk that reaches a patient. An instrument that was not cleaned correctly, a tray that was assembled wrong, a load that was not verified, none of these announce themselves in the moment. They surface later, in the OR, as a delayed case, a damaged instrument, or an infection risk."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "The cost of incompetence is not abstract. Every competency gap in your department is a future incident waiting for the wrong day. Instrument damage runs thousands of dollars per event. OR delays cost dollars by the minute. And turnover climbs, because people who are set up to fail without real development do not stay. This is the problem SBD exists to solve. Not to make training a little better, but to remove the inconsistency, the ceiling on scale, and the subjectivity entirely."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Without looking back, name the three problems with traditional follow-along training. Then say, in one sentence, why they are more serious in sterile processing than in most fields."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 4"
 },
 {
  "t": "h1",
  "text": "The SBD solution"
 },
 {
  "t": "p",
  "text": "If the problem is inconsistency, unscalability, and subjectivity, then the solution has to fix all three at the root. SBD does it with four moving parts that work together."
 },
 {
  "t": "p",
  "text": "Read each of the four parts below. For each one, notice which of the three problems it solves. By the end you will see that nothing is decorative, every part is there to remove a specific flaw in the old model."
 },
 {
  "t": "h2",
  "text": "Part one: a standardized competency framework, the belt system"
 },
 {
  "t": "p",
  "text": "Instead of “trained” or “not trained,” SBD defines competency as a series of belt levels, White through Black. Each belt is a specific, defined set of things an operator is verified to do. Everyone in every department is measured against the same belts, so “competent at Yellow” means the exact same thing everywhere."
 },
 {
  "t": "p",
  "text": "This solves inconsistency. The standard no longer depends on who trained you or what they remembered to show you. The standard is fixed and public."
 },
 {
  "t": "h2",
  "text": "Part two: automated, self-paced learning"
 },
 {
  "t": "p",
  "text": "The teaching itself, the knowledge and the practice, is delivered by the system, not by a person standing in front of a room. Learners move through content at their own pace, with immediate feedback, exactly the way you are moving through this workbook right now."
 },
 {
  "t": "p",
  "text": "This solves scale. The system can develop twenty learners as easily as two, because it is not consuming a senior technician's hours to deliver the content."
 },
 {
  "t": "h2",
  "text": "Part three: intelligent intervention through David OG"
 },
 {
  "t": "p",
  "text": "A system that only delivers content would leave learners stuck with no one noticing. David OG is the intelligence layer that watches every learner's progress and flags exactly who is stuck, who is ready, and who needs a human. You will learn David OG in depth in Module 2. For now, understand its job: it points the human to where the human is actually needed."
 },
 {
  "t": "p",
  "text": "This protects scale without losing the human. You can carry twenty learners because David tells you which three need you today."
 },
 {
  "t": "h2",
  "text": "Part four: objective, three-gate assessment"
 },
 {
  "t": "p",
  "text": "No one advances a belt because someone feels they are ready. Advancement is earned by passing three independent gates: a knowledge test, a simulation under pressure, and a live observation of the actual work. Each gate checks something the others cannot."
 },
 {
  "t": "p",
  "text": "This solves subjectivity. “Ready” stops being a feeling and becomes a documented, defensible result."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "See the four parts work together A new tech is placed by assessment (objective), works through packaging content at her own pace (scalable, self-paced), gets stuck on one concept, and David OG flags her to you (intelligent intervention). You coach her through the one sticking point. She then passes all three gates for that competency (objective), and the record shows exactly what she can do (consistent, defensible). No senior tech was consumed for days. Nothing was left to chance. And her competency means the same thing yours does."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Match each part of the SBD solution to the problem it solves: belt system, self-paced learning, David OG, three-gate assessment. Which fixes inconsistency? Scale? Subjectivity? Write it out."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 4"
 },
 {
  "t": "h1",
  "text": "How the system fits together"
 },
 {
  "t": "p",
  "text": "You do not need to be a software person to facilitate. But you do need a clear mental model of how the pieces connect, because your staff will ask you, and your confidence depends on understanding it."
 },
 {
  "t": "p",
  "text": "Here is the whole architecture in one sentence, then we will walk each piece: placement decides where a learner starts, the standardized belt curriculum and self-paced practice develop them, David OG watches and flags, the three gates verify, and the belt advances, while David OG turns all of it into intelligence for you and for leadership."
 },
 {
  "t": "h2",
  "text": "Placement drives everything"
 },
 {
  "t": "p",
  "text": "Before a learner does anything else, they are placed. The placement assessment establishes the belt level their current, real competency supports, not the belt their years of experience or their certificate would predict. Placement also surfaces their weakest domains and produces their Operator Identity Profile, which tells you how they tend to operate. Everything downstream starts from placement."
 },
 {
  "t": "h2",
  "text": "The belt curriculum is standardized. It does not bend."
 },
 {
  "t": "p",
  "text": "The content that defines each belt, and the gates that verify it, are fixed. You do not modify what Yellow Belt requires, and neither does any other facilitator anywhere. This is deliberate. The moment the standard bends to local preference, you have reintroduced the inconsistency SBD exists to remove."
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Do not confuse “standardized” with “rigid delivery.” The competency bar is fixed. How you coach a specific person toward it, which supporting module you assign first, in what order, at what pace, is flexible, and that is where your judgment lives. The standard is locked. The path to it bends to the person."
 },
 {
  "t": "h2",
  "text": "Practice exams and the 90% threshold"
 },
 {
  "t": "p",
  "text": "Learners prepare for the gates using practice exams, both knowledge and simulation. The practice system uses a 90% threshold as a readiness signal: a learner who is consistently scoring at or above 90% in practice is genuinely ready to request a real assessment. A learner who is not is telling you, and David OG, exactly where they still need work, by domain."
 },
 {
  "t": "h2",
  "text": "Foundation and Instrument modules: the customizable layer"
 },
 {
  "t": "p",
  "text": "Around the fixed belt curriculum sit the Foundation modules and Instrument modules. These are the building blocks you assign based on a learner's specific gaps. This is the layer you work with most as a facilitator: placement and David OG tell you the gaps, and you assign the right modules to close them."
 },
 {
  "t": "h2",
  "text": "The gates verify, and David OG connects it all"
 },
 {
  "t": "p",
  "text": "When a learner is ready, they pass through the three gates. Their result is recorded. And underneath everything, David OG is watching the whole loop, turning placement results, practice scores, module progress, and gate outcomes into the alerts, briefs, and reports that make you effective. You will spend all of Module 2 learning to use it."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "The one-paragraph mental model Placement sets the start. The standardized belt curriculum and self-paced practice do the teaching. You assign Foundation and Instrument modules to close specific gaps. Practice exams at 90% signal readiness. The three gates verify. The belt advances. And David OG watches all of it and tells you where you, the human, are needed. Learn to hold that whole picture, because you will be explaining it to your staff for years."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. In your own words, explain to an imaginary new hire what happens from their first day to their first belt advancement. Keep it to five or six sentences. If you get stuck, re-read the mental model above."
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 4"
 },
 {
  "t": "h1",
  "text": "Your new role"
 },
 {
  "t": "p",
  "text": "This is the section that changes how you see your own job. Read it slowly. Some of it may feel uncomfortable, and that is normal."
 },
 {
  "t": "p",
  "text": "If the system now delivers the content, tracks progress, and flags who needs help, you might reasonably ask: what is left for me to do? The honest answer is that your role is not shrinking. It is moving up to the work only a human can do, and away from the work a human should never have been stuck doing."
 },
 {
  "t": "h2",
  "text": "What you are no longer"
 },
 {
  "t": "p",
  "text": "You are no longer the lecturer. You do not stand in front of a room delivering content the system delivers better, at scale, with immediate feedback. If you find yourself re-teaching what the module already teaches, stop, the learner's issue is rarely the content itself."
 },
 {
  "t": "p",
  "text": "You are no longer the administrator. You do not spend your day hunting through binders, tracking who is due for what, or building reports by hand. David OG does that instantly. If you are doing it manually, you are doing David's job instead of your own."
 },
 {
  "t": "h2",
  "text": "What you now are"
 },
 {
  "t": "p",
  "text": "You are the coach. When a learner is stuck, confused, discouraged, or avoiding an assessment they are ready for, that is a human problem, and you are the human. This is the work Module 4 develops in depth."
 },
 {
  "t": "p",
  "text": "You are the observer. The third gate, live observation of real technique, cannot be done by software. Only you can watch a pair of hands and confirm the work is correct. This is the work Module 5 develops."
 },
 {
  "t": "p",
  "text": "You are the interpreter. David OG gives you data. Data is not a decision. You read the placement result, the practice pattern, the Operator Identity Profile, and you decide what this particular person needs next. The system informs. You judge."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "The same moment, old role versus new role A learner has failed a simulation twice. In the old model, you might sit them down and re-teach the whole topic from the front of a room, hoping something sticks. In your new role, you open David OG, see that both failures cluster in one specific domain, inspection, and realize the learner does not need the whole topic retaught. They need coaching on one skill and one confidence problem. You spend fifteen focused minutes where the old model would have spent two hours missing the point. That is the difference. The system freed you from re-teaching everything so you could solve the actual problem."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Be honest with yourself. Which part of the old role will be hardest for you to let go of, the lecturing or the administrative control? Why? There is no wrong answer, but naming it now will help you later."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "How to hold this in your head The system teaches. You transform. The system delivers content and tracks progress so that you can spend your hours coaching the stuck, observing the technique, and interpreting the data into the right next step. You were never hired to be a binder. You were hired to develop people, and this is the first time the job actually lets you."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Before the knowledge check, do these three short activities. They are the self-paced version of what, in a classroom, an instructor would have you do out loud. Write real answers. You will get more from the check, and from the rest of the certification, if you do."
 },
 {
  "t": "h2",
  "text": "Activity 1 · The contrast"
 },
 {
  "t": "p",
  "text": "Think of one specific thing that was done poorly or inconsistently when you were trained. In two or three sentences, describe how the SBD system would handle that same thing differently, and which of the four parts is responsible."
 },
 {
  "t": "h2",
  "text": "Activity 2 · Explain it simply"
 },
 {
  "t": "p",
  "text": "Write, in five or six sentences, how you would explain the SBD system to a brand-new hire on their first day, someone who has never heard of a belt system. Use plain language. No jargon. This is a rehearsal for something you will do for real, many times."
 },
 {
  "t": "h2",
  "text": "Activity 3 · Your first David OG question"
 },
 {
  "t": "p",
  "text": "You will meet David OG properly in Module 2. For now, write down the very first question you would want to ask it about your own department. Notice what you are curious about, it usually points at the problem you most want to solve."
 }
],
  "knowledge": [
   {
    "n": 1,
    "q": "The three core problems with traditional SPD training are:",
    "options": [
     "A) Cost, space, and scheduling",
     "B) Inconsistency, lack of scale, and subjectivity",
     "C) Turnover, morale, and budget",
     "D) Staffing, equipment, and time"
    ],
    "answer": "B"
   },
   {
    "n": 2,
    "q": "Why are competency gaps more dangerous in SPD than in most fields?",
    "options": [
     "A) The work is repetitive",
     "B) Errors are invisible in the moment and reach a patient later",
     "C) There are more staff involved",
     "D) Instruments are costly to replace"
    ],
    "answer": "B"
   },
   {
    "n": 3,
    "q": "Which part of the SBD solution primarily removes subjectivity?",
    "options": [
     "A) Self-paced learning",
     "B) The three-gate assessment",
     "C) David OG alerts",
     "D) The digital badge"
    ],
    "answer": "B"
   },
   {
    "n": 4,
    "q": "In the SBD model, the facilitator is no longer primarily a:",
    "options": [
     "A) Coach",
     "B) Observer",
     "C) Lecturer and administrator",
     "D) Data interpreter"
    ],
    "answer": "C"
   },
   {
    "n": 5,
    "q": "“The system teaches; you transform” means:",
    "options": [
     "A) The facilitator delivers all content",
     "B) The system delivers content so the facilitator can coach, observe, and judge",
     "C) The learner works alone with no support",
     "D) David makes the final decisions"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P02",
  "seq": 2,
  "level": 1,
  "levelLabel": "Level 1 Facilitator",
  "levelPos": "2 of 6",
  "title": "Mastering David OG, Your Operational Partner",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 1"
 },
 {
  "t": "p",
  "text": "Module 2"
 },
 {
  "t": "p",
  "text": "Mastering David OG, Your Operational Partner"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "You met David OG in Module 1. Now you learn to work with it, hands on, one conversation at a time."
 },
 {
  "t": "p",
  "text": "Estimated time: 6 hours · Ends with a practical exam you must pass at 80%"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin"
 },
 {
  "t": "p",
  "text": "In Module 1 you learned what David OG is: the intelligence layer that watches every learner and points you to where a human is needed. This module is about turning that idea into a skill. By the end, you will be able to sit down at the start of a shift, ask David the right questions, read what it gives back, and act on it."
 },
 {
  "t": "p",
  "text": "The way to learn this is not to memorize commands. David understands plain language. The skill is knowing what to ask, and knowing how to read the answer. So this workbook is built around real conversations. You will see the exact question, the exact kind of answer David returns, and then you will practice reading it yourself."
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "One honest limit, up front. David is powerful, but it is not magic and it is not a substitute for you. It cannot watch a pair of hands, it cannot coach a discouraged person, and it cannot make the human judgment call about what a learner needs next. Keep that line clear in your mind the whole way through this module. David informs. You decide."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end. You will see them again at the close, and you will check each one honestly."
 },
 {
  "t": "list",
  "items": [
   "Run a daily briefing with David and act on what it surfaces.",
   "Read a coaching brief and turn it into an intervention.",
   "Look up curriculum and standards in real time, mid-conversation with a learner.",
   "Generate a leadership report from David's analytics."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 5"
 },
 {
  "t": "h1",
  "text": "What David sees, gives, and cannot do"
 },
 {
  "t": "p",
  "text": "You cannot use a partner well until you know exactly what it is responsible for. Start here."
 },
 {
  "t": "h2",
  "text": "What David monitors"
 },
 {
  "t": "p",
  "text": "David is watching five streams of information about every learner in your department, continuously. You do not have to ask it to track these; it always is."
 },
 {
  "t": "list",
  "items": [
   "Placement. Where each learner started and the weak domains their placement surfaced.",
   "Practice. Every practice-exam attempt and score, broken down by domain.",
   "Modules. Which modules each learner is in, and where they are stuck.",
   "Assessments. Gate results, what passed, what failed, and by how much.",
   "History. The full timeline for each person, so patterns become visible over time."
  ]
 },
 {
  "t": "h2",
  "text": "What David gives you"
 },
 {
  "t": "p",
  "text": "From those five streams, David produces four things you will use every day."
 },
 {
  "t": "list",
  "items": [
   "Alerts. Who needs attention, surfaced before you have to go looking.",
   "Briefs. A complete picture of one learner, on demand, before you coach them.",
   "Recommendations. Suggested next steps, which module to assign, when someone is ready.",
   "Reports. Roll-ups for you and for leadership, generated in seconds."
  ]
 },
 {
  "t": "h2",
  "text": "What David cannot do"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Memorize this list. It defines the boundary of your job. David cannot conduct a hands-on observation. Only you can watch technique. David cannot coach a human being. It can tell you someone is discouraged; it cannot rebuild their confidence. David cannot make the final judgment. It recommends; you decide what this specific person needs."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Cover the page above. Name the five things David monitors and the four things it produces. Then state the three things it cannot do. If you miss any, re-read before moving on, this is the foundation for everything else in the module."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 5"
 },
 {
  "t": "h1",
  "text": "The daily briefing"
 },
 {
  "t": "p",
  "text": "This is the single most valuable habit you will build. Five minutes at the start of every shift that decides where your whole day goes."
 },
 {
  "t": "p",
  "text": "The traditional facilitator walks in and reacts to whoever shows up first. The SBD facilitator walks in and asks David one question, and lets the data set the priorities. Here is that question, and here is what David gives back."
 },
 {
  "t": "p",
  "text": "You ask David: David, who needs my attention today? David returns: Five people surfaced this morning. In priority order: 1 Operator stuck 4 days in Packaging (fm-05) Failing the knowledge gate twice. Needs a human. 2 Operator ready for Yellow observation Practice: knowledge 93%, simulation 91%. Schedule it. 3 Operator inactive 6 days No logins, no attempts. Re-engagement check-in. 4 Operator just passed all practice at 90%+ Will not request assessment. Confidence nudge. 5 Operator progressing normally No action needed. Monitor only."
 },
 {
  "t": "h2",
  "text": "How to read it"
 },
 {
  "t": "p",
  "text": "Notice what David did. It did not just list names; it sorted them by who needs a human most, told you why, and told you what kind of help each one needs. Your job is not to do all five things at once. Your job is to look at this and decide your day."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Turning the brief into a plan Reading the brief above, a strong facilitator decides: the stuck learner (1) gets a real coaching sit-down this morning, because two knowledge failures means something is genuinely blocking them. The ready learner (2) gets their observation scheduled today, do not let a ready person wait. The inactive learner (3) gets a low-pressure message before lunch. The confident-but-stalling learner (4) gets a two-minute “you are ready, let us book it”. And learner (5) gets nothing today, and that is correct. Five learners, one five-minute brief, and a whole day now has a shape. That is the habit."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Look at the brief again. If you only had time for TWO of these five people today, which two would you choose, and why? Write your reasoning. There is a defensible answer, but the reasoning matters more than the pick."
 },
 {
  "t": "h2",
  "text": "The end-of-day counterpart"
 },
 {
  "t": "p",
  "text": "There is a second, shorter briefing at the end of the day. You ask David what is on deck for tomorrow, so you walk out already knowing what tomorrow looks like."
 },
 {
  "t": "p",
  "text": "You ask David: David, what is on deck for tomorrow? David returns: Three items for tomorrow: - 2 assessment requests awaiting your observation - 1 module deadline (Green Belt candidate, Assembly) - 1 new placement to review from yesterday"
 },
 {
  "t": "p",
  "text": "Thirty seconds, and tomorrow is no longer a surprise. Between the morning brief and the end-of-day check, you are never reacting blind."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 5"
 },
 {
  "t": "h1",
  "text": "Real-time lookup, mid-conversation"
 },
 {
  "t": "p",
  "text": "A learner asks you a question you do not have memorized. In the old world you said “let me get back to you.” Now you ask David and answer in the moment."
 },
 {
  "t": "p",
  "text": "You will never hold every belt requirement, every rubric criterion, and every fail indicator in your head, and you do not need to. David holds all of it and returns it instantly, with the source. Here are the three lookups you will use most."
 },
 {
  "t": "h2",
  "text": "Looking up a competency requirement"
 },
 {
  "t": "p",
  "text": "You ask David: David, what does Yellow Belt Decontamination competency require? David returns: Yellow Belt Decontamination requires the operator to independently: - Don and doff PPE correctly, every time - Sort and pre-clean by IFU, including lumens/hinges - Operate the washer-disinfector with correct cycle - Maintain one-way flow, no clean-side contamination Pass threshold: 80% on the gate rubric. Source: SBD Learner Guide, Yellow Belt, Decontamination."
 },
 {
  "t": "h2",
  "text": "Looking up fail indicators before an observation"
 },
 {
  "t": "p",
  "text": "You ask David: David, what are the White Belt observation fail indicators? David returns: Automatic fail indicators at White Belt observation: - Any clean-side contamination event - Handling sharps unsafely - Skipping a required documentation step - Routing an external request without escalating"
 },
 {
  "t": "h2",
  "text": "Looking up a pass threshold"
 },
 {
  "t": "p",
  "text": "You ask David: David, what is the pass threshold for Green Belt Assembly simulation? David returns: Green Belt Assembly simulation: 80% to pass. All safety-critical items must be correct regardless of overall score. Source: SBD Learner Guide, Green Belt, Assembly."
 },
 {
  "t": "callout",
  "label": "Do This",
  "text": "The move to build. When a learner asks you something specific and you are not 100% certain, do not guess and do not stall. Ask David, read the answer, and give it to the learner with the source. You will look more credible citing David in ten seconds than pretending to remember and getting it slightly wrong."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. A Yellow Belt candidate asks you what will automatically fail them in their upcoming observation. Write out, in one line, exactly what you would ask David, and then what you would do with the answer."
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 5"
 },
 {
  "t": "h1",
  "text": "Reading the data David gives you"
 },
 {
  "t": "p",
  "text": "David hands you data. Data is not a decision. This section is about the interpretation skill that turns a screen full of numbers into the right next move."
 },
 {
  "t": "h2",
  "text": "Reading a coaching brief"
 },
 {
  "t": "p",
  "text": "Before you coach anyone, you ask David for a brief. It returns a complete picture. The skill is reading it in the right order: profile first (how to approach), then weak areas (what to work on), then history (what has already been tried)."
 },
 {
  "t": "p",
  "text": "You ask David: David, brief me on this operator before I coach them. David returns: COACHING BRIEF Current: White Belt Placement: Confirmed by SBD Assessor Profile: Steward (secondary Sentinel) Practice: Sterilization 69% | Quality 65% History: 2 knowledge attempts on fm-06, both <70% Suggested: Assign fm-06, then fm-09"
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Reading it in the right order Profile first: this learner is a Steward, so they respond to encouragement and team context, not blunt data. Lead warm. Weak areas next: sterilization and quality, and the history shows two failed attempts on the sterilization module specifically, so this is not a knowledge-delivery problem, it is a sticking point plus likely some discouragement. History last: what has been tried tells you not to just re-assign the same thing without a conversation. So your plan writes itself: a warm, encouraging sit-down (Steward), focused on the one sterilization concept that is blocking them, acknowledging the two prior failures without dwelling on them, then re-assign fm-06 with a small, winnable next step. You read the brief; the intervention followed."
 },
 {
  "t": "h2",
  "text": "Reading a failure pattern"
 },
 {
  "t": "p",
  "text": "When someone fails, do not react to the single score. Ask David why, and it shows you the pattern across attempts, which is where the real problem lives."
 },
 {
  "t": "p",
  "text": "You ask David: David, why did this operator fail their Yellow simulation? David returns: FAILURE ANALYSIS Failed: Yellow simulation (85%, needed 90%) Weak: fm-03 Inspection 62% fm-09 Quality 63% Pattern: Consistently weak on visual inspection Fix: fm-03 + fm-09, re-test in 2 weeks"
 },
 {
  "t": "p",
  "text": "The single number was 85%. The pattern was “visual inspection, every time.” You coach the pattern, not the number. That is the whole interpretation skill in one line."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Look at the failure analysis above. If you only told this learner “you got 85%, study harder,” what would you be missing? Write what the pattern tells you that the score alone does not."
 },
 {
  "t": "section",
  "text": "SECTION 5 OF 5"
 },
 {
  "t": "h1",
  "text": "Reporting to leadership"
 },
 {
  "t": "p",
  "text": "The same data that helps you coach also makes you the most prepared person in any leadership meeting. David builds the report; you supply the story."
 },
 {
  "t": "p",
  "text": "A Director or VP does not want raw numbers. They want to know: is the department getting more competent, is it getting there efficiently, and where are the risks. David assembles the numbers in seconds. Your value is turning them into a narrative leadership can act on."
 },
 {
  "t": "p",
  "text": "You ask David: David, give me a department performance brief for this month. David returns: This month, department-wide: - Belt distribution shifted: White 62% -> 54% - 6 advancements (2 Green, 3 Yellow, 1 Blue) - Assessment queue: 4 pending observation - At risk: 2 learners inactive 7+ days - Facilitator efficiency: 18 learners, ~8 hrs/wk"
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "From numbers to narrative David gave you the numbers. Here is the story you tell leadership: “The department is measurably more competent than last month, six people advanced and the foundation tier is shrinking as people move up. We are carrying eighteen learners on about eight hours of facilitation a week, which is the scalability working. Two risks: a small assessment backlog I am clearing this week, and two disengaged learners I am re-engaging now.” Same data, but now it means something. That is your job in the room: David counts, you interpret."
 },
 {
  "t": "callout",
  "label": "Do This",
  "text": "The habit to build. Before any leadership meeting, ask David for the report first. Never walk in assembling numbers by hand or working from memory. Walk in with David's data already turned into three sentences: what improved, what it cost, and what the risks are."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Three activities before the practical exam. Write real answers, these rehearse the exact skills the exam tests."
 },
 {
  "t": "h2",
  "text": "Activity 1 · Run your own morning brief"
 },
 {
  "t": "p",
  "text": "Imagine you asked David “who needs my attention today” and it returned four learners: one stuck three days on a module, one ready for observation, one who failed a gate yesterday, and one progressing normally. Write the order you would handle them in, and one sentence on what you would do for each."
 },
 {
  "t": "h2",
  "text": "Activity 2 · Turn a brief into a plan"
 },
 {
  "t": "p",
  "text": "Re-read the coaching brief for the Steward learner in Section 4. In three or four sentences, write the actual opening you would use with that person, in your own words, matched to their profile."
 },
 {
  "t": "h2",
  "text": "Activity 3 · Write the lookup"
 },
 {
  "t": "p",
  "text": "A learner is about to take a Green Belt Assembly simulation and asks what score they need and what will fail them automatically. Write exactly what you would ask David, in plain language, to get both answers."
 },
 {
  "t": "h1",
  "text": "Practical exam"
 },
 {
  "t": "p",
  "text": "This module ends with a practical, not just a quiz, because using David is a doing skill. Work all five scenarios. For each, write what you would ask David and what you would do with the answer. You pass by correctly actioning at least four of the five. A self-scoring guide follows on the next page."
 },
 {
  "t": "p",
  "text": "Scenario 1 · Diagnose a barrier"
 },
 {
  "t": "p",
  "text": "A learner has been stuck in the Packaging module for five days with no progress. Describe how you use David to find out what is actually blocking them, and what you do next."
 },
 {
  "t": "p",
  "text": "Scenario 2 · Judge readiness"
 },
 {
  "t": "p",
  "text": "A learner keeps asking you if they are “ready” for their Yellow assessment. Describe how you use David to answer that objectively rather than by feel."
 },
 {
  "t": "p",
  "text": "Scenario 3 · Recommend an intervention"
 },
 {
  "t": "p",
  "text": "David flags a learner who failed a simulation twice, both failures in the same domain. Describe how you read that and what intervention you choose."
 },
 {
  "t": "p",
  "text": "Scenario 4 · Produce a coaching brief"
 },
 {
  "t": "p",
  "text": "You are about to coach a learner you have never met. Describe what you ask David for and the order in which you read what it returns."
 },
 {
  "t": "p",
  "text": "Scenario 5 · Report to leadership"
 },
 {
  "t": "p",
  "text": "Your Director asks, with no warning, “how is the department doing?” Describe how you use David to answer well in under two minutes."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each scenario pass or fail against the standard below. Four of five passing completes Module 2. If you fall short, re-read the section named for each scenario and try it again, the same instruction you will one day give your staff."
 },
 {
  "t": "p",
  "text": "Scenario"
 },
 {
  "t": "p",
  "text": "A passing answer includes"
 },
 {
  "t": "p",
  "text": "Re-read"
 },
 {
  "t": "p",
  "text": "1 Barrier"
 },
 {
  "t": "p",
  "text": "Ask David WHY they are stuck (not just that they are); read the domain-level pattern; then coach the specific sticking point, not the whole module."
 },
 {
  "t": "p",
  "text": "Sections 2 & 4"
 },
 {
  "t": "p",
  "text": "2 Readiness"
 },
 {
  "t": "p",
  "text": "Use the practice scores and the 90% readiness signal, not your gut; schedule the gate if they are consistently at or above it."
 },
 {
  "t": "p",
  "text": "Sections 1 & 3"
 },
 {
  "t": "p",
  "text": "3 Intervention"
 },
 {
  "t": "p",
  "text": "Read the PATTERN across both failures, not the single score; assign the targeted modules for that domain; set a realistic re-test."
 },
 {
  "t": "p",
  "text": "Section 4"
 },
 {
  "t": "p",
  "text": "4 Brief"
 },
 {
  "t": "p",
  "text": "Ask for the brief; read profile first (how to approach), then weak areas, then history."
 },
 {
  "t": "p",
  "text": "Section 4"
 },
 {
  "t": "p",
  "text": "5 Report"
 },
 {
  "t": "p",
  "text": "Ask David for the report first; turn the numbers into three sentences: what improved, what it cost, what the risks are."
 },
 {
  "t": "p",
  "text": "Section 5"
 },
 {
  "t": "h2",
  "text": "You have completed Module 2"
 },
 {
  "t": "p",
  "text": "Return to the four things you were promised at the start. You should now be able to run a daily briefing and act on it, read a coaching brief and turn it into an intervention, look up curriculum and standards in real time, and generate a leadership report. If any of those still feels shaky, re-read that section before Module 3."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "Carry this into Module 3 You now have a partner that tells you who needs you, why, and what the data says. But David only ever points, it never coaches, observes, or decides. Module 3 begins building the human half: the belt system and curriculum you will use that judgment on. You handle the part David cannot."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 1 · Module 2 · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 6,
    "q": "What can David OG NOT do?",
    "options": [
     "A) Flag who is stuck",
     "B) Generate a leadership report",
     "C) Conduct a hands-on observation",
     "D) Recommend a module"
    ],
    "answer": "C"
   },
   {
    "n": 7,
    "q": "The daily morning brief is valuable because it makes the facilitator:",
    "options": [
     "A) Faster at paperwork",
     "B) Proactive instead of reactive",
     "C) Able to skip observations",
     "D) Independent of the rubric"
    ],
    "answer": "B"
   },
   {
    "n": 8,
    "q": "When a learner asks a curriculum question you are unsure of, you should:",
    "options": [
     "A) Guess to seem confident",
     "B) Ask David and answer with the source",
     "C) Tell them to look it up",
     "D) Skip the question"
    ],
    "answer": "B"
   },
   {
    "n": 9,
    "q": "In a coaching brief, you read it in the order:",
    "options": [
     "A) History, then score, then name",
     "B) Profile first, then weak areas, then history",
     "C) Alphabetically",
     "D) Whatever David lists first"
    ],
    "answer": "B"
   },
   {
    "n": 10,
    "q": "David flags a learner failing the same domain twice. This is best read as:",
    "options": [
     "A) Bad luck",
     "B) A pattern to coach, not a single score to react to",
     "C) A reason to pass them anyway",
     "D) A system error"
    ],
    "answer": "B"
   },
   {
    "n": 11,
    "q": "A leadership report from David should be turned into:",
    "options": [
     "A) Raw numbers",
     "B) A narrative: what improved, what it cost, the risks",
     "C) A list of your activities",
     "D) A schedule"
    ],
    "answer": "B"
   },
   {
    "n": 12,
    "q": "David's core relationship to your judgment is:",
    "options": [
     "A) It replaces your judgment",
     "B) It informs; you decide",
     "C) It overrides the rubric",
     "D) It coaches for you"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P03",
  "seq": 3,
  "level": 1,
  "levelLabel": "Level 1 Facilitator",
  "levelPos": "3 of 6",
  "title": "The Belt System and Curriculum Mastery",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 1"
 },
 {
  "t": "p",
  "text": "Module 3"
 },
 {
  "t": "p",
  "text": "The Belt System and Curriculum Mastery"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "This is the map of everything your staff will climb. Learn it cold, because you cannot guide a path you do not know by heart."
 },
 {
  "t": "p",
  "text": "Estimated time: 8 hours · Ends with a 50-question knowledge check (85%) plus three training plans"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin"
 },
 {
  "t": "p",
  "text": "This is the longest module in Level 1, and for good reason. The belt system and curriculum are the terrain you will work in every single day. A learner will ask you what Green Belt requires, whether they are ready, which module comes next, and you need the answer at your fingertips, not after a search."
 },
 {
  "t": "p",
  "text": "You will not memorize every line of every module today, David OG holds that for you, and Module 2 taught you to look it up. What you will build here is the mental map: the shape of the belt progression, how placement starts it, how practice predicts readiness, and how the Foundation and Instrument modules fit around the fixed belt curriculum. Know the map, and the details always have a place to land."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end:"
 },
 {
  "t": "list",
  "items": [
   "Explain every belt, White through Black, and what an operator at each is verified to do.",
   "Navigate the curriculum: placement, practice exams, Foundation modules, and Instrument modules.",
   "Distinguish the standardized layer from the customizable layer, and know which is which.",
   "Teach staff to use practice exams as a readiness tool, not just a hurdle."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 5"
 },
 {
  "t": "h1",
  "text": "The belt progression"
 },
 {
  "t": "p",
  "text": "Six belts. Each one is a specific, defined level of what an operator is verified to do. This is the spine of the whole system, so we start here and you will return to it constantly."
 },
 {
  "t": "p",
  "text": "Read the belt table below slowly. Do not try to memorize it in one pass, read it for the shape: notice that each belt widens what the operator can do and lowers how much supervision they need. Competency climbs, oversight drops."
 },
 {
  "t": "p",
  "text": "Belt"
 },
 {
  "t": "p",
  "text": "Tier"
 },
 {
  "t": "p",
  "text": "Verified to do"
 },
 {
  "t": "p",
  "text": "WHITE"
 },
 {
  "t": "p",
  "text": "Foundation"
 },
 {
  "t": "p",
  "text": "Works decontamination under direct supervision. Safe handling, instrument ID, defect reporting, real-time documentation."
 },
 {
  "t": "p",
  "text": "YELLOW"
 },
 {
  "t": "p",
  "text": "Single-zone mastery"
 },
 {
  "t": "p",
  "text": "Independently runs one full workflow zone end to end, with stop-work authority inside it."
 },
 {
  "t": "p",
  "text": "GREEN"
 },
 {
  "t": "p",
  "text": "Multi-area proficiency"
 },
 {
  "t": "p",
  "text": "Works any zone plus sterile storage. Complex specialty builds and real-time coaching of lower belts."
 },
 {
  "t": "p",
  "text": "BLUE"
 },
 {
  "t": "p",
  "text": "Leadership entry"
 },
 {
  "t": "p",
  "text": "Runs the floor under Lead Tech oversight. IUSS gatekeeping, implant verification, OR de-escalation."
 },
 {
  "t": "p",
  "text": "BROWN"
 },
 {
  "t": "p",
  "text": "Operational engineering"
 },
 {
  "t": "p",
  "text": "Root-cause and pattern analysis, load recall, contamination response, executive escalation."
 },
 {
  "t": "p",
  "text": "BLACK"
 },
 {
  "t": "p",
  "text": "Full mastery"
 },
 {
  "t": "p",
  "text": "Owns the system. Teaches every level, audits all shifts, sole certification authority for lead-side scripts."
 },
 {
  "t": "p",
  "text": "Now notice the story the table tells. White works under direct supervision. By Yellow, the operator owns one zone alone. By Green, they move anywhere and start coaching others. Blue steps into leadership. Brown engineers problems out of the department. Black owns and teaches the whole system. The belts are not just harder tests; they are a career, and you are the guide for it."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "The one thing that never bends. Each belt means the same thing in every department, at every facility, for every operator. That is the entire point. When you are tempted to “adjust” what a belt requires to fit a situation, remember: the moment the standard bends, you have reintroduced the inconsistency SBD exists to remove. The path to the belt flexes. The belt itself does not."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Without looking back, name all six belts in order, and give one phrase for what each is verified to do. Then answer: at which belt does an operator first work fully independently, and at which do they first coach others?"
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 5"
 },
 {
  "t": "h1",
  "text": "Placement and the Operator Identity Profile"
 },
 {
  "t": "p",
  "text": "Nothing downstream makes sense until you understand where a learner starts and how they are wired. Placement answers both."
 },
 {
  "t": "h2",
  "text": "What placement does"
 },
 {
  "t": "p",
  "text": "Before a learner touches a module, they are placed. The placement assessment establishes the belt their real, current competency supports, not the belt their years or their certificate would predict. You saw in the pilot data that experience and credentials routinely overpredict competency; placement is what replaces the guess with a measurement."
 },
 {
  "t": "p",
  "text": "Placement gives you three things: a starting belt, a list of the learner's weakest domains, and their Operator Identity Profile. You use all three, but the profile is the one facilitators most often overlook, so we will spend time on it."
 },
 {
  "t": "h2",
  "text": "Delivering the result with care"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Placement is a starting point, not a verdict. A twenty-year veteran may place at White. If you deliver that as a judgment, you lose them. If you deliver it as a starting line, “this is where we begin, and here is the fastest path up,” you keep them. How you hand over the placement result matters as much as the result itself. Never let a learner hear their placement as “you are not good enough.”"
 },
 {
  "t": "h2",
  "text": "The Operator Identity Profile"
 },
 {
  "t": "p",
  "text": "The Operator Identity Profile, the OIP, is the part of placement that tells you how a person tends to operate. It is a coaching aid, not a clinical instrument and not a label to box someone in. It sorts operators into four types, and knowing a learner's type tells you how to approach them. You will use this constantly in Module 4; here you learn what the four types are."
 },
 {
  "t": "p",
  "text": "OIP type"
 },
 {
  "t": "p",
  "text": "How they operate"
 },
 {
  "t": "p",
  "text": "How you approach them"
 },
 {
  "t": "p",
  "text": "Sentinel"
 },
 {
  "t": "p",
  "text": "Precision operator. Follows the standard, catches the errors others miss."
 },
 {
  "t": "p",
  "text": "Give clear steps and cite the standard. Help them with ambiguity and change."
 },
 {
  "t": "p",
  "text": "Steward"
 },
 {
  "t": "p",
  "text": "Culture builder. Leads through relationships, holds the team together."
 },
 {
  "t": "p",
  "text": "Encourage, build the relationship, celebrate small wins, break goals into steps."
 },
 {
  "t": "p",
  "text": "Surgeon"
 },
 {
  "t": "p",
  "text": "High-output performer. Fast, decisive, thrives under pressure."
 },
 {
  "t": "p",
  "text": "Be direct, set firm deadlines, and require proof of mastery so speed never skips a step."
 },
 {
  "t": "p",
  "text": "Architect"
 },
 {
  "t": "p",
  "text": "Systems thinker. Sees the structure, designs the fix."
 },
 {
  "t": "p",
  "text": "Give data and the rationale. Explain the why, and guard against over-analysis."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Why the profile changes your whole approach Two learners both place at White with the same weak domain. One is a Steward, one is a Surgeon. If you coach them the same way, you will succeed with one and lose the other. The Steward needs you to open warm, acknowledge the effort, and build confidence in small steps. The Surgeon needs you to be direct, name the gap, set a hard deadline, and get out of the way. Same placement, same gap, opposite approach, and the profile is what tells you which is which."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name the four OIP types and one word for how each operates. Then pick the type you think you are, and write one sentence on how you would want to be coached. Noticing your own type will make you a better coach of the others."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 5"
 },
 {
  "t": "h1",
  "text": "The practice-exam system"
 },
 {
  "t": "p",
  "text": "Practice exams are the single most useful signal you have for readiness. Learn to read them and you will almost never send someone into a gate before they are ready, or hold a ready person back."
 },
 {
  "t": "h2",
  "text": "What practice exams are"
 },
 {
  "t": "p",
  "text": "For every belt, there are two banks of practice exams: knowledge (can they recognize the right answer) and simulation (can they produce the right action). Learners take them as many times as they want, at their own pace, and each attempt returns a score broken down by domain."
 },
 {
  "t": "h2",
  "text": "The 90% threshold"
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "90% in practice is the readiness signal. A learner who is consistently scoring at or above 90% in practice, on both knowledge and simulation, is genuinely ready to request a real assessment. A learner who is not is telling you, and David OG, exactly where they still need work. The threshold is deliberately higher than the 80% gate pass, because practice should be harder than game day. If they can clear 90% in practice, the 80% gate is well within reach."
 },
 {
  "t": "p",
  "text": "This is why you never have to guess whether someone is ready. The practice pattern answers it. Your job is to teach learners to see practice the same way: not as a hurdle to clear once and forget, but as the tool that tells them, and you, when they are truly ready."
 },
 {
  "t": "h2",
  "text": "Reading the domain breakdown"
 },
 {
  "t": "p",
  "text": "The most valuable part of a practice result is not the overall score, it is the domain breakdown. A learner sitting at 84% overall might be at 95% in four domains and 60% in one. That one domain is the whole story, and it is exactly where you coach."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "The overall score hides the real work A learner reports “I keep getting 84%, I just can't get over the hump.” You look at the domain breakdown: everything is above 90% except inspection, which is at 61%. They do not have a broad problem; they have one specific gap dragging the average down. You assign the inspection module, they close that one gap, and the overall score jumps. Without the breakdown, you would have told them to “study more” and wasted their time on the four domains they had already mastered."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. A learner is stuck at 86% overall and frustrated. Before you coach them, what is the first thing you would look at, and why? Write it out."
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 5"
 },
 {
  "t": "h1",
  "text": "Foundation and Instrument modules"
 },
 {
  "t": "p",
  "text": "The belt curriculum is fixed. Around it sit the modules you actually assign. This is the layer you work with most, so know exactly what it contains and how it is built."
 },
 {
  "t": "h2",
  "text": "Two layers, one clear line"
 },
 {
  "t": "p",
  "text": "Hold this distinction firmly, because you will explain it often. The belt curriculum and its gates are standardized, they do not change. The Foundation and Instrument modules are the customizable layer, the building blocks you assign to a specific learner to close a specific gap. Standardized bar, flexible path."
 },
 {
  "t": "h2",
  "text": "The Foundation modules (fm-01 to fm-10)"
 },
 {
  "t": "p",
  "text": "The Foundation modules cover the core sterile processing workflow, one competency area each. They run in a rough sequence but you assign them based on the learner's gaps, not a fixed calendar."
 },
 {
  "t": "p",
  "text": "Module"
 },
 {
  "t": "p",
  "text": "Covers"
 },
 {
  "t": "p",
  "text": "fm-01 Foundations"
 },
 {
  "t": "p",
  "text": "Orientation, vocabulary, infection-control basics, department conduct."
 },
 {
  "t": "p",
  "text": "fm-02 Decontamination"
 },
 {
  "t": "p",
  "text": "PPE, sorting, manual cleaning, ultrasonic, washer-disinfector, one-way flow."
 },
 {
  "t": "p",
  "text": "fm-03 Inspection & Identification"
 },
 {
  "t": "p",
  "text": "Instrument ID, eight-criterion inspection, defect recognition."
 },
 {
  "t": "p",
  "text": "fm-04 Assembly"
 },
 {
  "t": "p",
  "text": "Count verification, tray build, first-verifier sign-off."
 },
 {
  "t": "p",
  "text": "fm-05 Packaging"
 },
 {
  "t": "p",
  "text": "Wrapping, containers, CI placement, seal integrity."
 },
 {
  "t": "p",
  "text": "fm-06 Sterilization"
 },
 {
  "t": "p",
  "text": "Cycle selection, load documentation, BI and CI use, failure response."
 },
 {
  "t": "p",
  "text": "fm-07 Storage"
 },
 {
  "t": "p",
  "text": "Sterile storage, event-related sterility, stock rotation."
 },
 {
  "t": "p",
  "text": "fm-08 High-Level Disinfection"
 },
 {
  "t": "p",
  "text": "HLD process, scope handling, documentation."
 },
 {
  "t": "p",
  "text": "fm-09 Quality Assurance"
 },
 {
  "t": "p",
  "text": "Verification, double-signature checks, quality monitoring."
 },
 {
  "t": "p",
  "text": "fm-10 Professional Practice"
 },
 {
  "t": "p",
  "text": "Communication, scripts, escalation, professional conduct."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Every module runs its own three gates. A Foundation module is not “read and done.” Each one has its own knowledge gate, its own simulation, and its own facilitator observation, the same three-gate model, at the module level. When you assign fm-06, the learner will eventually stand in front of you for a live observation of sterilization technique. That observation is your job, and Module 5 develops it."
 },
 {
  "t": "h2",
  "text": "The Instrument modules (im-wb to im-bb)"
 },
 {
  "t": "p",
  "text": "Running alongside the Foundation modules, the Instrument modules build progressive instrument mastery, from foundational recognition at White through complex specialty and lead-level sets at the higher belts. They climb with the belt: a White Belt masters a foundational instrument set; a Green Belt builds complex specialty trays; the top belts handle lead-level instrumentation."
 },
 {
  "t": "h2",
  "text": "When to assign what"
 },
 {
  "t": "p",
  "text": "You assign modules for four reasons. Learn these four triggers and you will always know why a module is going out, which makes you far more credible to the learner."
 },
 {
  "t": "list",
  "items": [
   "Placement-driven. The learner's weak domains from placement point straight at the modules to start with.",
   "Failure-driven. A failed gate, read by domain, tells you exactly which module to assign for remediation.",
   "Proactive. Practice scores show a domain slipping before it becomes a failure; you assign ahead of the problem.",
   "Advancement-driven. The learner is ready to climb, and the next belt requires modules they have not yet done."
  ]
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. State the line between the standardized layer and the customizable layer in one sentence. Then name the four reasons you would assign a module. If you can do both from memory, you understand the layer you will work in most."
 },
 {
  "t": "section",
  "text": "SECTION 5 OF 5"
 },
 {
  "t": "h1",
  "text": "Building a path for a real learner"
 },
 {
  "t": "p",
  "text": "Now you connect all four pieces, belt, placement, practice, and modules, into the single skill this module is really about: building a learner's path."
 },
 {
  "t": "p",
  "text": "Everything so far was preparation for this. When a learner is placed, you take their starting belt, their weak domains, and their profile, and you build a path: which modules, in what order, aimed at which gate. Here is the reasoning done out loud, so you can copy the pattern."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "From placement to plan, step by step A learner places at White. Weak domains: packaging (34%) and sterilization (48%). Profile: Sentinel. Here is how you reason: Profile first: a Sentinel wants clear steps and the standard. Your coaching will be checklist-driven and precise, and you will cite requirements directly. Worst gap first: packaging at 34% is the deepest hole, so fm-05 leads. Sterilization at 48% is next, so fm-06 follows. Sequence to a gate: you are aiming them at the Yellow Belt assessment, so after fm-05 and fm-06 you add fm-09 Quality, which Yellow requires, then the Yellow instrument module. The plan: fm-05, then fm-06, then fm-09, then im for Yellow, with practice exams throughout and a Yellow assessment when practice consistently clears 90%. You built that from four pieces you now know."
 },
 {
  "t": "h2",
  "text": "Now you do it"
 },
 {
  "t": "p",
  "text": "Below are three learners. For each, build a path: name the profile-appropriate approach, the order of modules, and the gate you are aiming at. Write real plans, these are exactly what the module assessment asks for, and exactly what you will do every week on the floor."
 },
 {
  "t": "p",
  "text": "Learner A Places at White. Weak domains: inspection (40%), assembly (55%). Profile: Steward. Aiming at Yellow."
 },
 {
  "t": "p",
  "text": "Learner B Places at Yellow. Weak domain: sterilization (62%). Profile: Surgeon, fast but skips verification steps. Aiming at Green."
 },
 {
  "t": "p",
  "text": "Learner C Twenty-year veteran, places at White and is visibly discouraged. Weak domains: packaging (45%), quality (50%). Profile: Architect. Aiming at Yellow."
 }
],
  "knowledge": [
   {
    "n": 13,
    "q": "The correct belt order from entry to mastery is:",
    "options": [
     "A) White, Green, Yellow, Blue, Brown, Black",
     "B) White, Yellow, Green, Blue, Brown, Black",
     "C) Yellow, White, Green, Blue, Brown, Black",
     "D) White, Yellow, Green, Brown, Blue, Black"
    ],
    "answer": "B"
   },
   {
    "n": 14,
    "q": "An operator first works fully independently in one zone at:",
    "options": [
     "A) White",
     "B) Yellow",
     "C) Green",
     "D) Blue"
    ],
    "answer": "B"
   },
   {
    "n": 15,
    "q": "An operator first coaches lower belts on the floor at:",
    "options": [
     "A) Yellow",
     "B) Green",
     "C) Blue",
     "D) Brown"
    ],
    "answer": "B"
   },
   {
    "n": 16,
    "q": "Placement establishes:",
    "options": [
     "A) The belt experience predicts",
     "B) The belt current measured competency supports",
     "C) Job title",
     "D) Seniority"
    ],
    "answer": "B"
   },
   {
    "n": 17,
    "q": "The Operator Identity Profile is:",
    "options": [
     "A) A clinical diagnosis",
     "B) A permanent label",
     "C) A coaching aid describing how a person operates",
     "D) A gate"
    ],
    "answer": "C"
   },
   {
    "n": 18,
    "q": "A Steward learner is best approached with:",
    "options": [
     "A) Blunt data and deadlines",
     "B) Encouragement, relationship, and small wins",
     "C) No contact",
     "D) A warning"
    ],
    "answer": "B"
   },
   {
    "n": 19,
    "q": "A Surgeon learner most needs you to:",
    "options": [
     "A) Require proof of mastery so speed never skips a step",
     "B) Give constant reassurance",
     "C) Avoid deadlines",
     "D) Assign extra reading"
    ],
    "answer": "A"
   },
   {
    "n": 20,
    "q": "The practice-exam readiness threshold is:",
    "options": [
     "A) 70%",
     "B) 80%",
     "C) 90%",
     "D) 100%"
    ],
    "answer": "C"
   },
   {
    "n": 21,
    "q": "The belt curriculum and gates are:",
    "options": [
     "A) Customizable per facility",
     "B) Standardized and fixed",
     "C) Optional",
     "D) Set by the learner"
    ],
    "answer": "B"
   },
   {
    "n": 22,
    "q": "The four reasons to assign a module are placement-driven, failure-driven, proactive, and:",
    "options": [
     "A) Seniority-driven",
     "B) Advancement-driven",
     "C) Random",
     "D) Budget-driven"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P04",
  "seq": 4,
  "level": 1,
  "levelLabel": "Level 1 Facilitator",
  "levelPos": "4 of 6",
  "title": "Coaching and Intervention Strategies",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 1"
 },
 {
  "t": "p",
  "text": "Module 4"
 },
 {
  "t": "p",
  "text": "Coaching and Intervention Strategies"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "This is the work David can never do. The system delivers content and flags who needs you. What happens in the conversation is entirely you."
 },
 {
  "t": "p",
  "text": "Estimated time: 8 hours · Ends with a simulation exam: 3 live coaching conversations, pass 2 of 3 at 80%"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin"
 },
 {
  "t": "p",
  "text": "Everything to this point has prepared you to do the one thing that is irreplaceably human: coach a person forward. David OG can tell you someone is stuck, discouraged, or avoiding an assessment. It cannot sit with them, read the moment, and say the thing that unlocks them. That is you, and it is the highest-value work you do."
 },
 {
  "t": "p",
  "text": "This module is different from the ones before it. You cannot learn coaching by reading definitions. You learn it by seeing conversations modeled, understanding why they work, and then rehearsing them yourself. So this workbook is full of real dialogue, the learner's words and your words, back and forth, and it will ask you to write your own responses often. Do not skip those. The exam at the end is live coaching, and the only way to be ready is to practice."
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "A coach is not a cheerleader and not a critic. Coaching is not empty encouragement, and it is not pointing out what is wrong. It is helping a person see their own path forward and believe they can walk it. If your “coaching” is just “you can do it,” you are cheerleading. If it is just “here is what you did wrong,” you are critiquing. Real coaching sits in between: honest about the gap, and genuinely on their side."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end:"
 },
 {
  "t": "list",
  "items": [
   "Coach by profile, adapting your approach to each OIP type.",
   "Run the four intervention protocols for stuck, failing, stalled-but-ready, and inactive learners.",
   "Re-engage a learner who has lost motivation, without pressure or shame.",
   "Handle a difficult conversation with structure, and know when to escalate beyond coaching."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 5"
 },
 {
  "t": "h1",
  "text": "Why adults get stuck"
 },
 {
  "t": "p",
  "text": "Before you can move someone forward, you have to understand what is actually holding them in place. It is rarely the thing they say it is."
 },
 {
  "t": "h2",
  "text": "The real barriers"
 },
 {
  "t": "p",
  "text": "When a learner stalls, the surface reason is usually “I don't have time” or “I don't get it.” Underneath, the real barrier is almost always one of four things. Learn to listen for which one you are actually dealing with, because each needs a different response."
 },
 {
  "t": "list",
  "items": [
   "Time. Sometimes real, often a cover for one of the others. Genuine when the floor is short-staffed and the learner truly cannot get to the content.",
   "Confidence. They are afraid they are not capable. This hides behind avoidance and “I'm just not a test person.”",
   "A prior bad experience. They were burned by a previous trainer, a public failure, or a program that set them up to fail. They are protecting themselves.",
   "Fear of failure. The one that masquerades as everything else. If they never request the assessment, they can never fail it. Avoidance feels safer than risk."
  ]
 },
 {
  "t": "h2",
  "text": "What actually drives adults forward"
 },
 {
  "t": "p",
  "text": "The flip side matters just as much. Adults engage when the work connects to something real for them. As you coach, you are always looking for which of these to activate."
 },
 {
  "t": "list",
  "items": [
   "Advancement (a real path up), recognition (being seen), mastery (getting genuinely good), autonomy (control over how they work), and psychological safety (knowing a stumble will not be punished)."
  ]
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "The safest room wins. Of all of these, psychological safety is the foundation. A learner who believes failure will be met with help, not humiliation, will attempt hard things. A learner who believes failure will be held against them will hide, stall, and avoid. Every conversation you have is either building that safety or eroding it. Build it."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Think of a time you avoided something at work. Which of the four barriers was really underneath it, and did anyone correctly read what was going on? Write it down. Feeling this from the inside will make you better at spotting it in others."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 5"
 },
 {
  "t": "h1",
  "text": "Coaching by profile"
 },
 {
  "t": "p",
  "text": "You learned the four OIP types in Module 3. Now you use them. The same message, delivered four different ways, lands or fails depending on the person in front of you."
 },
 {
  "t": "p",
  "text": "Below is the same coaching moment, a learner who is close to ready but hesitating, handled for each type. Read all four. Notice that the facts never change; only the framing does."
 },
 {
  "t": "h2",
  "text": "The Sentinel · precision operator"
 },
 {
  "t": "p",
  "text": "Give clear steps and cite the standard. Learner: I don't know, I don't feel like I'm ready to be assessed. You: Let's look at exactly what the assessment measures. Here are the four criteria. You're already at 94% on three of them in practice. The fourth is the checklist step on inspection. Master that one step, and you meet the standard. It's not a feeling, it's four boxes, and you've got three."
 },
 {
  "t": "h2",
  "text": "The Steward · culture builder"
 },
 {
  "t": "p",
  "text": "Encourage, and connect it to the team. Learner: I don't know, I don't feel like I'm ready to be assessed. You: I hear you, and I want you to know how far you've come, you were struggling with this a month ago and now you're nearly there. The team needs people they can count on, and you're becoming one of them. Let's take it one step. What's the piece that still feels shaky?"
 },
 {
  "t": "h2",
  "text": "The Surgeon · high-output performer"
 },
 {
  "t": "p",
  "text": "Be direct, set the deadline, require proof. Learner: I don't know, I don't feel like I'm ready to be assessed. You: Your practice scores say you're ready, you're clearing 90% consistently. The hesitation isn't about capability. Let's book the assessment for Thursday. Between now and then, show me the inspection sequence clean, one time, and we're done talking about it."
 },
 {
  "t": "h2",
  "text": "The Architect · systems thinker"
 },
 {
  "t": "p",
  "text": "Give the data and the rationale. Learner: I don't know, I don't feel like I'm ready to be assessed. You: Here's the data. The 90% practice threshold predicts gate success because practice is built harder than the real assessment. You've been above it for two weeks. Statistically, you're past the point where waiting improves your odds, it just delays a result you've already earned. The rational move is to schedule it."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "One message, four keys. The learner's readiness was identical in all four. What changed was the key that unlocks that person: the Sentinel needed the standard broken into steps, the Steward needed encouragement and belonging, the Surgeon needed directness and a deadline, the Architect needed the logic. Misread the type and even a true, kind message bounces off. This is why Module 3's profile work mattered."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. A learner failed a simulation and is discouraged. Their profile is Steward. Write your opening line to them, in your own words, matched to that type. Then write how it would change if they were a Surgeon instead."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 5"
 },
 {
  "t": "h1",
  "text": "The four intervention protocols"
 },
 {
  "t": "p",
  "text": "Most of the coaching you do falls into four situations. Learn the protocol for each and you will always have a place to start, no matter how the conversation opens."
 },
 {
  "t": "h2",
  "text": "Protocol 1 · The stuck learner"
 },
 {
  "t": "p",
  "text": "The learner has stalled in a module, no progress for days. David flagged them. Your job is to find the real block and break it into something small enough to move."
 },
 {
  "t": "list",
  "items": [
   "Open with empathy, not pressure. “I noticed you've been on this a few days, how's it going?”",
   "Diagnose together. Pull up the domain breakdown. Ask what feels hard. Listen for which of the four barriers it really is.",
   "Break it down. Shrink the problem to one specific, winnable next step.",
   "Offer support and set a small goal, then schedule a follow-up so they know you are coming back."
  ]
 },
 {
  "t": "h2",
  "text": "Protocol 2 · Failure recovery"
 },
 {
  "t": "p",
  "text": "The learner failed a gate. How you handle the next five minutes determines whether they recover or retreat."
 },
 {
  "t": "list",
  "items": [
   "Normalize it. “Failing a gate is information, not a verdict. It tells us exactly where to work.”",
   "Analyze with David. Show the pattern across attempts, the specific domain, not a vague “study more.”",
   "Assign targeted remediation for that domain only. Do not re-teach what they already know.",
   "Rebuild confidence and set a realistic re-test far enough out to prepare, close enough to keep momentum."
  ]
 },
 {
  "t": "h2",
  "text": "Protocol 3 · The confidence boost"
 },
 {
  "t": "p",
  "text": "This one surprises new facilitators. The learner is clearly ready, consistently above 90%, but will not request the assessment. The block is not skill; it is fear of failure. Your job is to make scheduling feel safe."
 },
 {
  "t": "list",
  "items": [
   "Present the evidence. Show them their own practice scores. Let the data say “ready” so you do not have to argue it.",
   "Make it easy. Offer to schedule it for them, right now, at a specific time. Remove the friction of the ask.",
   "Reframe the risk. “If the unlikely happens and you don't pass, we learn one thing and go again. You lose nothing.”"
  ]
 },
 {
  "t": "h2",
  "text": "Protocol 4 · Re-engagement"
 },
 {
  "t": "p",
  "text": "The learner has gone quiet, no logins, no attempts. Pressure will push them further away. This is the lightest touch of the four."
 },
 {
  "t": "list",
  "items": [
   "Low-pressure check-in. “Haven't seen you in the system, everything okay?” Lead with the person, not the metric.",
   "Remove the obstacle. Often it is something real, a schedule conflict, a login issue, a life event. Find it and clear it.",
   "Create one small commitment. Not “finish the module.” Just “one practice attempt by Friday.” Momentum restarts small."
  ]
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Same learner, wrong protocol A learner is clearing 92% in practice but has not booked the assessment for two weeks. A new facilitator assigns them more modules, reading it as a knowledge gap. That is the stuck protocol, and it is wrong. This learner does not need more content; they need the confidence-boost protocol. Piling on modules confirms their fear that they are “not ready yet” and pushes the assessment further away. Reading the situation correctly is half the job."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name the four protocols and the one-line situation each is for. Then answer: which protocol is for the learner who is ready but will not schedule, and what is the real barrier underneath?"
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 5"
 },
 {
  "t": "h1",
  "text": "Difficult conversations"
 },
 {
  "t": "p",
  "text": "Not every conversation is a stuck learner who wants to improve. Some involve repeated failure, resistance, or attitude. These need structure and a clear line for when coaching ends and escalation begins."
 },
 {
  "t": "h2",
  "text": "Repeated failure"
 },
 {
  "t": "p",
  "text": "A learner has failed the same gate three times. The instinct is to soften and reassure again, but at this point kindness is honesty. The conversation has to name the pattern plainly while staying on their side."
 },
 {
  "t": "p",
  "text": "Honest about the pattern, still on their side. You: We've hit this gate three times now, and I don't want to pretend that's not real. So let's stop and figure out what's actually going on, because doing the same thing a fourth time isn't fair to you. Is this the right pace? Is something outside work getting in the way? Talk to me straight."
 },
 {
  "t": "h2",
  "text": "Resistance and attitude"
 },
 {
  "t": "p",
  "text": "Some learners resist the whole system, especially experienced staff who feel a belt program is beneath them. Do not argue the program. Acknowledge the experience, and connect the standard to something they care about."
 },
 {
  "t": "p",
  "text": "Learner: I've been doing this twenty years. I don't need a workbook to tell me my job. You: Twenty years is exactly why I want you through this, not because you have anything to prove, but because the people coming up behind you learn from how you work. The belt isn't a test of whether you're good. It's how we make what you already know the standard for everyone else. I need you setting that bar."
 },
 {
  "t": "h2",
  "text": "Knowing when to escalate"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Coaching has a boundary. Respect it. You are a facilitator, not a manager, a therapist, or HR. Coaching handles motivation, skill gaps, and confidence. It does not handle genuine performance problems that persist after real support, safety violations, or personal crises beyond your role. When a situation crosses those lines, your job is to escalate to the right person, not to carry it alone. Knowing the edge of your role is a competency, not a failure."
 },
 {
  "t": "list",
  "items": [
   "Escalate when: repeated failures continue after genuine, well-run remediation; a learner shows a safety-critical behavior; or a personal crisis is clearly driving the situation and needs more than a coach."
  ]
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Write one sentence naming the line between “keep coaching” and “escalate.” Then name one situation you would be tempted to keep carrying yourself that you actually should hand off."
 },
 {
  "t": "section",
  "text": "SECTION 5 OF 5"
 },
 {
  "t": "h1",
  "text": "Bringing it together"
 },
 {
  "t": "p",
  "text": "Read the full intervention below. Watch how profile, barrier, and protocol combine into one natural conversation, then you will run your own."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "One complete intervention David flags a learner: failed the Yellow simulation twice, both failures in inspection, no login for three days. You pull the brief: profile is Steward, and the history shows real effort before the failures. You read it: a Steward who tried hard and failed twice is almost certainly discouraged, that three-day silence is not laziness, it is retreat. The barrier is confidence, not knowledge. The protocol is failure recovery, delivered in Steward language."
 },
 {
  "t": "p",
  "text": "The conversation that follows: You: Hey, I've missed seeing you this week. I want to start by saying, I know the last two didn't go the way you wanted, and I know you put real work in. That matters to me. Learner: I just feel like maybe I'm not cut out for this. You: I hear that, and I want to show you something. Look, everything's above 90 except inspection. This isn't 'not cut out for it.' This is one skill, and it's the most fixable one there is. Would you let me work just that with you this week? One thing, together. Learner: ...yeah. Okay. I can do one thing. You: That's all I'm asking. Let's do one practice run on inspection tomorrow morning, just you and me, no assessment, no pressure. Deal?"
 },
 {
  "t": "p",
  "text": "Notice everything that happened: you led with the person (Steward), normalized the failure without dwelling (recovery protocol), used the domain data to shrink the problem, and closed on one small, safe commitment (re-engagement). Four things you learned separately, woven into ninety seconds. That is the skill."
 },
 {
  "t": "h2",
  "text": "Now you run three"
 },
 {
  "t": "p",
  "text": "Below are three learners. For each, write the intervention: name the profile, the real barrier, the protocol, and then write your actual opening two or three lines to that person. These are the rehearsal for your exam, do them fully."
 },
 {
  "t": "p",
  "text": "Learner A Cleared 91% in practice for two weeks, has not booked the assessment. Profile: Sentinel. Never mentions being nervous, just keeps saying “not yet.”"
 },
 {
  "t": "p",
  "text": "Learner B Failed the same gate three times. Profile: Surgeon, fast but keeps skipping the verification step. Starting to get frustrated and blame the test."
 },
 {
  "t": "p",
  "text": "Learner C Gone silent, no logins for a week. Profile: Steward. Was progressing well, then suddenly stopped. You do not yet know why."
 },
 {
  "t": "h1",
  "text": "Simulation exam"
 },
 {
  "t": "p",
  "text": "Module 4 ends with a simulation, because coaching is a live skill. In the system, you will run three coaching conversations with trained actors. Here, use the three learners from Section 5 as your simulation: for each, write the full intervention as you would deliver it, opening through close. You pass by handling at least two of the three well against the standard on the next page."
 },
 {
  "t": "p",
  "text": "Score honestly. This is the exact skill your staff's growth will depend on, and the one skill no software can do for you."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each conversation against the five marks below. A conversation passes if it clearly hits at least four of the five. Two of three passing completes Module 4."
 },
 {
  "t": "checklist",
  "title": "A strong coaching conversation...",
  "items": [
   "Opens by reading the profile and approaching that type correctly",
   "Identifies the REAL barrier (time, confidence, prior experience, fear), not the surface one",
   "Uses the correct protocol for the situation (stuck, recovery, confidence, re-engagement)",
   "Shrinks the problem to one small, winnable, specific next step",
   "Closes on a concrete commitment and a scheduled follow-up"
  ]
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Watch your own defaults. Most new facilitators fail this exam the same two ways: they cheerlead (all encouragement, no honest naming of the gap) or they problem-solve too fast (jumping to the fix before reading the person). If you notice yourself doing either, stop and re-read Section 1. The person comes before the problem, every time."
 },
 {
  "t": "h2",
  "text": "You have completed Module 4"
 },
 {
  "t": "p",
  "text": "Return to the four objectives. You should now be able to coach by profile, run the four intervention protocols, re-engage a lost learner, and handle a difficult conversation while knowing when to escalate. If your simulation conversations felt thin, that is your signal to re-read and rehearse before Module 5, coaching is a rehearsable skill, and it rewards practice."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "Carry this into Module 5 You can now move a person forward in conversation. Module 5 turns to the other irreplaceably human skill: observation. When a learner finally stands in front of you to be assessed, you have to watch their hands and judge the work, fairly, objectively, and with the same care you brought to coaching. The conversation and the observation are the two things only you can do."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 1 · Module 4 · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 23,
    "q": "The four hidden barriers behind a stalled learner are time, confidence, prior bad experience, and:",
    "options": [
     "A) Laziness",
     "B) Fear of failure",
     "C) Low pay",
     "D) Poor scheduling"
    ],
    "answer": "B"
   },
   {
    "n": 24,
    "q": "The foundation beneath all coaching is:",
    "options": [
     "A) Pressure",
     "B) Psychological safety",
     "C) Speed",
     "D) Discipline"
    ],
    "answer": "B"
   },
   {
    "n": 25,
    "q": "A learner ready but refusing to schedule needs the:",
    "options": [
     "A) Stuck protocol",
     "B) Failure-recovery protocol",
     "C) Confidence-boost protocol",
     "D) Re-engagement protocol"
    ],
    "answer": "C"
   },
   {
    "n": 26,
    "q": "An inactive, gone-quiet learner needs the:",
    "options": [
     "A) Confidence-boost protocol",
     "B) Re-engagement protocol",
     "C) Stuck protocol",
     "D) Escalation"
    ],
    "answer": "B"
   },
   {
    "n": 27,
    "q": "During failure recovery, you should first:",
    "options": [
     "A) Assign more modules",
     "B) Normalize the failure as information",
     "C) Warn them",
     "D) Escalate"
    ],
    "answer": "B"
   },
   {
    "n": 28,
    "q": "Coaching a Sentinel who is hesitating works best by:",
    "options": [
     "A) Encouraging their feelings",
     "B) Breaking the standard into clear steps",
     "C) Setting a hard deadline only",
     "D) Giving statistics only"
    ],
    "answer": "B"
   },
   {
    "n": 29,
    "q": "A learner who failed the same gate three times calls for:",
    "options": [
     "A) More reassurance",
     "B) Honestly naming the pattern while staying on their side",
     "C) Immediate termination",
     "D) Ignoring it"
    ],
    "answer": "B"
   },
   {
    "n": 30,
    "q": "You should escalate beyond coaching when:",
    "options": [
     "A) A learner is slightly behind",
     "B) Repeated failure persists after genuine remediation, or safety is at risk",
     "C) A learner asks a hard question",
     "D) A learner prefers self-study"
    ],
    "answer": "B"
   },
   {
    "n": 31,
    "q": "The two most common coaching failures are:",
    "options": [
     "A) Talking too little and too much",
     "B) Cheerleading and problem-solving too fast",
     "C) Being early and being late",
     "D) Over-documenting and under-documenting"
    ],
    "answer": "B"
   },
   {
    "n": 32,
    "q": "SBI feedback stands for:",
    "options": [
     "A) Score, Belt, Improve",
     "B) Situation, Behavior, Impact",
     "C) Stop, Begin, Improve",
     "D) Standard, Barrier, Intervention"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P05",
  "seq": 5,
  "level": 1,
  "levelLabel": "Level 1 Facilitator",
  "levelPos": "5 of 6",
  "title": "Observation and Assessment Mastery",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 1"
 },
 {
  "t": "p",
  "text": "Module 5"
 },
 {
  "t": "p",
  "text": "Observation and Assessment Mastery"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "This is Gate 3, the gate no software can run. When a learner's competency becomes real or does not, it happens in front of your eyes. Learn to watch, and to judge, fairly."
 },
 {
  "t": "p",
  "text": "Estimated time: 10 hours · Ends with an observation exam: two live observations, pass both at 85%"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin"
 },
 {
  "t": "p",
  "text": "This is the longest and, in many ways, the most serious module in Level 1. Gate 3 is the observation gate, the moment a facilitator watches a learner do the actual work and decides whether it meets the standard. A knowledge test can be gamed and a simulation can be talked through, but you cannot fake a pair of hands doing the work correctly in front of a trained observer. That is why observation is the gold standard, and why the responsibility is heavy."
 },
 {
  "t": "p",
  "text": "Everything you learned about coaching now meets its opposite discipline. Coaching is warm and on the learner's side. Observation is fair and neutral. You must be able to switch cleanly between them, to coach someone all week and then, on assessment day, judge their work objectively, without letting the relationship bend the result. That switch is the skill this module builds."
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "When you sign off, you are vouching for a patient's safety. Never lose sight of what an observation result means. When you pass a learner, you are telling the department, and every future patient whose instruments that learner touches, that the work is correct. A soft pass is not a kindness. It is a risk you have signed your name to. Fair means fair, both directions: you do not fail the ready, and you do not pass the unready."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end:"
 },
 {
  "t": "list",
  "items": [
   "Run a valid, reliable observation for a Foundation module Gate 3.",
   "Administer a belt-level assessment observation at White, Yellow, or Green.",
   "Apply a rubric objectively, scoring what you see, not what you feel.",
   "Give feedback and document correctly in SBD OS, immediately."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 5"
 },
 {
  "t": "h1",
  "text": "What observation is, and is not"
 },
 {
  "t": "p",
  "text": "Get the philosophy right first. Most observation mistakes come from misunderstanding what an observation is for."
 },
 {
  "t": "h2",
  "text": "Formative versus summative"
 },
 {
  "t": "p",
  "text": "There are two kinds of watching, and confusing them is the single most common error new observers make."
 },
 {
  "t": "list",
  "items": [
   "Formative observation is coaching. You watch to help, you can stop, correct, and guide in the moment. This is practice.",
   "Summative observation is assessment. You watch to judge against the standard. You do not coach, you do not rescue, you score what happens. This is the gate."
  ]
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Do not coach during a summative gate. The instinct that makes you a good coach, jumping in to help the moment someone struggles, is exactly the instinct you must suppress during a Gate 3 assessment. If you coach during the gate, you have not assessed anything; you have just helped them pass. Watch silently. Let the performance be theirs. Coaching time was all the days before this one."
 },
 {
  "t": "h2",
  "text": "Objectivity comes from the rubric"
 },
 {
  "t": "p",
  "text": "The only thing that makes an observation fair is that it is scored against a defined rubric, the same rubric for everyone, every time. Without the rubric, observation is just one person's opinion, which is exactly the subjectivity SBD exists to remove. The rubric is not bureaucracy; it is what makes your judgment trustworthy."
 },
 {
  "t": "h2",
  "text": "Psychological safety, even in a gate"
 },
 {
  "t": "p",
  "text": "Summative does not mean cold or hostile. You can hold a strict standard and still make the room safe. A learner who feels the observation is a trap will freeze and underperform, and you will have measured their fear, not their skill. Set expectations clearly, keep a neutral and calm demeanor, and let them show you their real work."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. In one sentence each, define formative and summative observation. Then answer: during a Gate 3 assessment, a learner freezes on a step they clearly know, what do you do, and why?"
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 5"
 },
 {
  "t": "h1",
  "text": "The observation process"
 },
 {
  "t": "p",
  "text": "Every observation has three phases: before, during, and after. Skip any one and the result is compromised. Learn the phases as a fixed routine you run every time."
 },
 {
  "t": "p",
  "text": "BEFORE THE OBSERVATION Review the brief. Know the learner, their belt, their history. Prepare the scenario and gather every material and instrument they will need. Have the rubric open and in front of you before they walk in. Set expectations out loud: what you will do, what they will do, that you will be silent."
 },
 {
  "t": "p",
  "text": "DURING THE OBSERVATION Explain the task clearly, once, then stop talking. Observe silently. Do not narrate, hint, or react. Score on the rubric in real time, not from memory afterward. Ask only neutral clarifying questions, never leading ones. Hold a calm, neutral demeanor throughout, your face is not a scoreboard."
 },
 {
  "t": "p",
  "text": "AFTER THE OBSERVATION Open feedback with a genuine strength, always. Give the rubric-based result: a clear pass or fail, tied to specific criteria. If fail, give the remediation plan. If pass, give the next step. Document in SBD OS immediately, while it is fresh and exact."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Why 'immediately' matters A facilitator runs three observations back to back, planning to document them all at lunch. By lunch, the details have blurred, which learner hesitated on which step, the exact criterion that failed. The documentation becomes vague, and vague documentation is worthless to a surveyor and unfair to the learner. Score on the rubric in the moment, and log it the moment the learner leaves the room. Memory is not evidence."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Write the three phases from memory, with one thing that must happen in each. Then name the one step people most often skip, and what goes wrong when they do."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 5"
 },
 {
  "t": "h1",
  "text": "Applying the rubric objectively"
 },
 {
  "t": "p",
  "text": "The rubric is your instrument. Using it well is a skill, and using it poorly is how good intentions produce unfair results."
 },
 {
  "t": "p",
  "text": "Here is a representative Gate 3 rubric, a module observation for decontamination. Study its shape: each criterion has a defined, observable pass condition, and safety-critical items carry a rule that overrides the point total."
 },
 {
  "t": "p",
  "text": "Criterion"
 },
 {
  "t": "p",
  "text": "What a pass looks like"
 },
 {
  "t": "p",
  "text": "Pts"
 },
 {
  "t": "p",
  "text": "PPE and setup"
 },
 {
  "t": "p",
  "text": "Dons and doffs PPE correctly; no contamination of clean areas."
 },
 {
  "t": "p",
  "text": "20"
 },
 {
  "t": "p",
  "text": "Sorting and pre-clean"
 },
 {
  "t": "p",
  "text": "Sorts by IFU; cleans lumens and hinges; nothing skipped."
 },
 {
  "t": "p",
  "text": "20"
 },
 {
  "t": "p",
  "text": "Equipment operation"
 },
 {
  "t": "p",
  "text": "Runs ultrasonic and washer-disinfector on the correct cycle."
 },
 {
  "t": "p",
  "text": "20"
 },
 {
  "t": "p",
  "text": "Workflow and traffic"
 },
 {
  "t": "p",
  "text": "Maintains strict one-way flow; no clean-side crossover."
 },
 {
  "t": "p",
  "text": "20"
 },
 {
  "t": "p",
  "text": "Documentation"
 },
 {
  "t": "p",
  "text": "Logs the process accurately and at the time of the work."
 },
 {
  "t": "p",
  "text": "20"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Safety-critical items override the score. Notice what a rubric cannot show in a point column: some failures are automatic, regardless of the total. A clean-side contamination event, an unsafe sharps handling, a skipped verification on a safety-critical step, any of these fails the observation even if every other box is perfect. A 95 with a contamination event is not a 95. It is a fail. Know which items on every rubric are the ones that cannot be bought back with points."
 },
 {
  "t": "h2",
  "text": "Score what you see, not what you know"
 },
 {
  "t": "p",
  "text": "The hardest discipline in observation is scoring the performance in front of you, not your general impression of the person. You have coached this learner. You like them. You know they usually do this correctly. None of that is on the rubric. If they skip a step today, it is skipped today, whatever they usually do. Score the observation, not the reputation."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "The halo that fails a patient A facilitator observes a learner they have coached for weeks and genuinely likes. Mid-observation, the learner skips lumen cleaning. The facilitator thinks, “they always do that correctly, they're just nervous,” and marks it a pass. Three weeks later a lumened instrument comes back soiled. The halo effect, scoring the person you know instead of the work you saw, is not kindness. It is how an unfair pass becomes a patient-safety event. What you see is what you score."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Explain, in your own words, the difference between a criterion you score by points and a safety-critical item that overrides the score. Then name the bias that makes observers pass people they should fail, and how you guard against it."
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 5"
 },
 {
  "t": "h1",
  "text": "Belt-level observations and common mistakes"
 },
 {
  "t": "p",
  "text": "Module observations verify one competency. Belt observations verify a whole level, and they scale up in scope and time as the belt climbs."
 },
 {
  "t": "h2",
  "text": "Scope climbs with the belt"
 },
 {
  "t": "p",
  "text": "A White Belt observation is short and focused; a Brown or Black observation is long and broad, because there is far more to verify. Know roughly what each belt observation covers so you can prepare the right scenario and the right amount of time."
 },
 {
  "t": "p",
  "text": "Belt"
 },
 {
  "t": "p",
  "text": "Rough duration"
 },
 {
  "t": "p",
  "text": "What you are verifying"
 },
 {
  "t": "p",
  "text": "White"
 },
 {
  "t": "p",
  "text": "30–45 min"
 },
 {
  "t": "p",
  "text": "Foundational safe practice under supervision: handling, ID, defect reporting, documentation."
 },
 {
  "t": "p",
  "text": "Yellow"
 },
 {
  "t": "p",
  "text": "45–60 min"
 },
 {
  "t": "p",
  "text": "Independent mastery of one full workflow zone, end to end, with stop-work behavior."
 },
 {
  "t": "p",
  "text": "Green"
 },
 {
  "t": "p",
  "text": "60–75 min"
 },
 {
  "t": "p",
  "text": "Multi-area work plus complex set construction and real-time coaching of a lower belt."
 },
 {
  "t": "p",
  "text": "Blue – Black"
 },
 {
  "t": "p",
  "text": "90–120 min"
 },
 {
  "t": "p",
  "text": "Leadership, incident command, root-cause work, and system-level judgment (higher-level certifications)."
 },
 {
  "t": "h2",
  "text": "The common observation mistakes"
 },
 {
  "t": "p",
  "text": "Almost every observation error is one of these five. Read them as a checklist against your own future behavior; you will be tempted by every one of them."
 },
 {
  "t": "list",
  "items": [
   "Too lenient. Passing work that does not meet the standard, usually out of relationship or sympathy. This is the dangerous one.",
   "Too harsh. Failing acceptable work by holding a standard higher than the rubric. This destroys trust and drives good people out.",
   "Coaching during the gate. Helping instead of assessing, so nothing is actually measured.",
   "Subjective scoring. Going on gut feel instead of the rubric, which reintroduces the bias the rubric exists to remove.",
   "Inconsistent standards. Scoring the same performance differently on different days or for different people. Fairness means the rubric wins every time."
  ]
 },
 {
  "t": "h2",
  "text": "Constructive feedback: the SBI model"
 },
 {
  "t": "p",
  "text": "When you deliver a result, especially a fail, structure the feedback so it lands as information, not judgment. Use Situation, Behavior, Impact: name the situation, describe the specific behavior you observed, and explain its impact, without character judgment."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "SBI in one line Weak feedback: “You were careless.” That is a character judgment, and it teaches nothing. SBI feedback: “During the decontamination run (situation), the lumen on the suction instrument wasn't cleaned (behavior), which means it could reach a patient still soiled (impact).” Same failure, but now it is specific, observable, and about the work, not the person. The learner knows exactly what to fix."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Write a piece of fail feedback for a learner who skipped a documentation step, using Situation, Behavior, Impact. Keep it about the work, not the person."
 },
 {
  "t": "section",
  "text": "SECTION 5 OF 5"
 },
 {
  "t": "h1",
  "text": "A full observation, start to finish"
 },
 {
  "t": "p",
  "text": "Watch all three phases combine into one clean observation, then you will plan two of your own for the exam."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "One observation, run correctly Before: you review the brief (Yellow candidate, strong in decontamination, being assessed on it), set up the zone with every instrument, open the rubric, and tell the learner: “I'll explain the task, then I'll be silent and just watch. Work exactly as you normally would. I'm scoring against a checklist, not looking for anything tricky.” During: you explain the task once, then go quiet. The learner does the work. They hesitate on cycle selection, you say nothing and score it. They complete everything else cleanly. You mark the rubric in real time, keeping your face neutral even when they hesitate. After: “First, your instrument handling and lumen cleaning were excellent, genuinely clean technique. Here's the result: you passed, 88%. The one soft spot was the pause on cycle selection, during the sterilization run (situation) you hesitated on gravity versus prevac (behavior), which on a real load could cost time or a wrong cycle (impact). Let's do one practice run on cycle selection this week to lock it in.” Then you log it in SBD OS before the next learner walks in."
 },
 {
  "t": "p",
  "text": "Notice the discipline: warm setup, silent assessment, honest rubric-based result, SBI feedback, immediate documentation. Coaching and judgment stayed cleanly separate, and the learner left knowing exactly where they stood and what came next."
 },
 {
  "t": "h2",
  "text": "Now you plan two"
 },
 {
  "t": "p",
  "text": "For each observation below, write your plan across all three phases: how you prepare, what you watch for and how you stay neutral, and how you deliver the result and document it. These are your exam rehearsal."
 },
 {
  "t": "p",
  "text": "Observation A A Foundation module Gate 3 for fm-05 Packaging. The learner is someone you have coached closely and like. Plan how you keep the halo effect out of your scoring."
 },
 {
  "t": "p",
  "text": "Observation B A Yellow Belt assessment observation. Midway, the learner does something that is a safety-critical automatic fail, but the rest of their work is strong. Plan how you handle it, in the moment and in the feedback."
 },
 {
  "t": "h1",
  "text": "Observation exam"
 },
 {
  "t": "p",
  "text": "In the system, this module ends with two live observations watched by a Master Facilitator, one module Gate 3 and one belt-level assessment, and you must pass both at 85%. Here, use the two observations from Section 5 as your written exam: for each, write the complete plan and the exact feedback you would deliver, including the rubric-based result. You must handle both correctly, especially the safety-critical fail in Observation B, honestly and by the standard."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each observation plan against the six marks below. A plan passes if it clearly hits at least five of six. Both must pass to complete Module 5, because in observation, one soft pass is one too many."
 },
 {
  "t": "checklist",
  "title": "A sound observation...",
  "items": [
   "Prepares fully: brief reviewed, scenario set, rubric open before the learner enters",
   "Assesses summatively: silent, no coaching, no rescue during the gate",
   "Scores against the rubric in real time, not on impression or memory",
   "Applies safety-critical overrides correctly, regardless of the point total",
   "Delivers feedback with a genuine strength and SBI-structured correction",
   "Documents in SBD OS immediately, specific and exact"
  ]
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "The two failures to guard against. New observers fail this exam two ways. The first is the halo pass, letting a relationship or a general impression override what they actually saw. The second is coaching through the gate, unable to stay silent while a learner they care about struggles. Both come from the same good instinct, care, applied at the wrong moment. Care shows up in coaching. In the gate, care means an honest result."
 },
 {
  "t": "h2",
  "text": "You have completed Module 5"
 },
 {
  "t": "p",
  "text": "Return to the four objectives. You should now be able to run a valid module observation, administer a belt-level assessment, apply a rubric objectively, and give SBI feedback documented immediately. If the safety-critical override or the halo effect still feels shaky, re-read before Module 6, these are the two things most likely to cost a patient if you get them wrong."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "Carry this into Module 6 You can now coach a learner forward and judge their work fairly, the two irreplaceably human skills. Module 6, the last in Level 1, ties everything together into operational excellence: how you run a whole caseload of twenty learners, prioritize with David's alerts, and report to leadership. You have the skills. Next you learn to run them at scale."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 1 · Module 5 · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 33,
    "q": "Formative observation is to summative observation as:",
    "options": [
     "A) Judging is to helping",
     "B) Helping (coaching) is to judging (the gate)",
     "C) Fast is to slow",
     "D) Written is to verbal"
    ],
    "answer": "B"
   },
   {
    "n": 34,
    "q": "During a summative Gate 3, if a learner struggles you should:",
    "options": [
     "A) Coach them through it",
     "B) Stay silent and score what happens",
     "C) Stop the assessment",
     "D) Give a hint"
    ],
    "answer": "B"
   },
   {
    "n": 35,
    "q": "What makes an observation objective is:",
    "options": [
     "A) The observer's experience",
     "B) Scoring against a defined rubric",
     "C) The learner's reputation",
     "D) The time of day"
    ],
    "answer": "B"
   },
   {
    "n": 36,
    "q": "A safety-critical failure with an otherwise high score is:",
    "options": [
     "A) Still a pass",
     "B) An automatic fail regardless of points",
     "C) Negotiable",
     "D) A retake of one item"
    ],
    "answer": "B"
   },
   {
    "n": 37,
    "q": "The halo effect in observation means:",
    "options": [
     "A) Scoring the work you saw",
     "B) Scoring the person you know instead of the work you saw",
     "C) Being too harsh",
     "D) Using the rubric strictly"
    ],
    "answer": "B"
   },
   {
    "n": 38,
    "q": "You should document an observation:",
    "options": [
     "A) At the end of the week",
     "B) Immediately, while exact",
     "C) From memory later",
     "D) Only if the learner fails"
    ],
    "answer": "B"
   },
   {
    "n": 39,
    "q": "Feedback should always open with:",
    "options": [
     "A) The failure",
     "B) A genuine strength",
     "C) The score",
     "D) A warning"
    ],
    "answer": "B"
   },
   {
    "n": 40,
    "q": "Belt observation scope and time as the belt climbs:",
    "options": [
     "A) Stay the same",
     "B) Increase",
     "C) Decrease",
     "D) Become optional"
    ],
    "answer": "B"
   },
   {
    "n": 41,
    "q": "The dangerous observation mistake is being:",
    "options": [
     "A) Too harsh",
     "B) Too lenient, passing work below standard",
     "C) Too prepared",
     "D) Too neutral"
    ],
    "answer": "B"
   },
   {
    "n": 42,
    "q": "When you sign off on an observation you are vouching for:",
    "options": [
     "A) Your own reputation",
     "B) A patient's safety",
     "C) The learner's feelings",
     "D) The schedule"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P06",
  "seq": 6,
  "level": 1,
  "levelLabel": "Level 1 Facilitator",
  "levelPos": "6 of 6",
  "title": "Operational Excellence and Scalability",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 1"
 },
 {
  "t": "p",
  "text": "Module 6"
 },
 {
  "t": "p",
  "text": "Operational Excellence and Scalability"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "Everything you have learned now has to run at once, for twenty people, week after week. This module is how one facilitator carries a whole department without dropping anyone."
 },
 {
  "t": "p",
  "text": "Estimated time: 4 hours · Ends with a scalability exam plus a 10-minute leadership presentation, pass both at 80%"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin"
 },
 {
  "t": "p",
  "text": "This is the last module of Level 1, and it is the one that turns a set of skills into a working facilitator. You can coach beautifully, observe fairly, and read David's data expertly, and still fail on the floor if you cannot run it all at once, for twenty people, without dropping the ones who need you most."
 },
 {
  "t": "p",
  "text": "Scalability is not about working faster or longer. It is about a system of rhythms and priorities that lets the important things happen reliably and lets the system carry the rest. By the end of this module you will have a daily rhythm, a weekly rhythm, and a prioritization framework that together let one person develop twenty learners on roughly eight focused hours a week. Then you go to the certification gates."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "The whole promise rests here. Module 1 told your future staff that one facilitator can carry twenty learners. This module is where you make that true. If you cannot run at scale, the department falls back to the old model, a senior person consumed by a handful of trainees, and everything SBD promised collapses. Operational excellence is not the soft module. It is the one that makes all the others pay off."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end:"
 },
 {
  "t": "list",
  "items": [
   "Run a daily and weekly rhythm that keeps a full caseload moving.",
   "Prioritize with David's alerts so the urgent and the important both get handled.",
   "Use cohort strategies to develop groups efficiently, not just individuals.",
   "Report outcomes to leadership in a way that shows the department improving."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 4"
 },
 {
  "t": "h1",
  "text": "The daily and weekly rhythm"
 },
 {
  "t": "p",
  "text": "Scale runs on rhythm. When the important things have a fixed time, they happen. When they float, they get crowded out by whoever walks up first."
 },
 {
  "t": "h2",
  "text": "The daily rhythm"
 },
 {
  "t": "p",
  "text": "Your day is anchored by two short bookends, five minutes each, with the real work in between. The bookends are non-negotiable; they are what keep you proactive instead of reactive."
 },
 {
  "t": "p",
  "text": "Time"
 },
 {
  "t": "p",
  "text": "What happens"
 },
 {
  "t": "p",
  "text": "Start (5 min)"
 },
 {
  "t": "p",
  "text": "Morning brief with David: who is stuck, who is ready, who has gone quiet. Set the day's priorities."
 },
 {
  "t": "p",
  "text": "Mid-day block"
 },
 {
  "t": "p",
  "text": "The real work: observations, coaching conversations, and assessments, in priority order."
 },
 {
  "t": "p",
  "text": "Afternoon block"
 },
 {
  "t": "p",
  "text": "Module assignments, follow-ups from earlier, and any quick check-ins."
 },
 {
  "t": "p",
  "text": "End (5 min)"
 },
 {
  "t": "p",
  "text": "End-of-day check with David: what is on deck tomorrow. Leave knowing what is coming."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Protect the bookends. On a busy day, the five-minute briefs are the first thing you will be tempted to skip, and skipping them is exactly what tips you back into reactive mode. Ten minutes of briefing is what makes the other seven hours efficient. Guard them like the appointments they are."
 },
 {
  "t": "h2",
  "text": "The weekly rhythm"
 },
 {
  "t": "p",
  "text": "The week has its own shape: plan at the start, execute through the middle, report at the end. This keeps you from ending every week wondering where the time went and what leadership will ask on Monday."
 },
 {
  "t": "p",
  "text": "Day"
 },
 {
  "t": "p",
  "text": "Focus"
 },
 {
  "t": "p",
  "text": "Monday"
 },
 {
  "t": "p",
  "text": "Plan the week. Review David's cohort view, schedule the week's observations and assessments."
 },
 {
  "t": "p",
  "text": "Tuesday – Thursday"
 },
 {
  "t": "p",
  "text": "Execute. Observations, coaching, assessments, module assignments, in priority order."
 },
 {
  "t": "p",
  "text": "Friday"
 },
 {
  "t": "p",
  "text": "Wrap and report. Update leadership, review the week's advancements, set up Monday."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name the two daily bookends and what each accomplishes. Then describe the shape of the week in three words. If the rhythm is not automatic, you will lose it the first busy week, so make it automatic now."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 4"
 },
 {
  "t": "h1",
  "text": "The prioritization framework"
 },
 {
  "t": "p",
  "text": "With twenty learners, David will surface more than you can do in a day. The skill is not doing everything. It is doing the right things in the right order, and being at peace with what waits."
 },
 {
  "t": "p",
  "text": "Every morning David hands you a list. You sort it into four tiers. The tiers decide your day, and just as importantly, they give you permission to let the bottom tier wait without guilt."
 },
 {
  "t": "p",
  "text": "IMMEDIATE · TODAY, FIRST Any safety concern or safety-critical issue. Scheduled assessments, someone is waiting to be gated. A learner inactive long enough to be at real risk of disengaging."
 },
 {
  "t": "p",
  "text": "SAME DAY · TODAY IF POSSIBLE Learners ready for observation, do not make a ready person wait. Hot assessment requests from learners who just hit readiness."
 },
 {
  "t": "p",
  "text": "THIS WEEK · SCHEDULE IT Check-ins with learners progressing slowly but not stalled. First-time gate failures who need a recovery conversation."
 },
 {
  "t": "p",
  "text": "MONITOR · NO ACTION NEEDED Learners progressing normally. Watch them. Do nothing. That is correct."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "The discipline of the bottom tier A new facilitator with twenty learners tries to touch all twenty every day, and burns out inside a month while still dropping the ones who mattered. A strong facilitator handles the immediate and same-day tiers well, schedules the this-week tier, and leaves the monitor tier alone, on purpose. Doing nothing for a learner who is progressing normally is not neglect. It is what frees you to be excellent for the three who need you today. Learn to let the healthy ones run."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. David's morning brief shows: one learner with a safety concern, three ready for observation, two progressing normally, one who failed a gate yesterday. Sort all seven into the four tiers, and write which you would personally handle today versus schedule versus leave."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 4"
 },
 {
  "t": "h1",
  "text": "Carrying twenty learners"
 },
 {
  "t": "p",
  "text": "Individual coaching does not scale to twenty by itself. Cohort strategies are how you get leverage, developing several people at once without lowering the standard."
 },
 {
  "t": "h2",
  "text": "Where the leverage comes from"
 },
 {
  "t": "p",
  "text": "Remember the division of labor from Module 1. The system delivers all the content, tracks all the progress, and raises all the alerts. That is the bulk of the work, and it costs you nothing per learner. What is left for you, observation, coaching, assessment, assignment, is roughly eight focused hours a week for a full caseload, because you are only spending human time where a human is required."
 },
 {
  "t": "p",
  "text": "The system does"
 },
 {
  "t": "p",
  "text": "You do"
 },
 {
  "t": "p",
  "text": "Delivers content to all 20, at their pace"
 },
 {
  "t": "p",
  "text": "Coach the handful who are stuck"
 },
 {
  "t": "p",
  "text": "Tracks every learner's progress"
 },
 {
  "t": "p",
  "text": "Observe the ones ready to be gated"
 },
 {
  "t": "p",
  "text": "Flags who needs attention"
 },
 {
  "t": "p",
  "text": "Assess and document the gates"
 },
 {
  "t": "p",
  "text": "Runs practice exams and feedback"
 },
 {
  "t": "p",
  "text": "Assign modules to close specific gaps"
 },
 {
  "t": "h2",
  "text": "Three cohort strategies"
 },
 {
  "t": "p",
  "text": "On top of individual work, these three moves let you develop several learners at once."
 },
 {
  "t": "list",
  "items": [
   "Group review after a shared gate. When several learners hit the same gate, debrief the common failure points once, to the group, instead of repeating yourself five times.",
   "Peer pairing. Pair a learner who just cleared a competency with one approaching it. The near-peer teaches, which cements their own mastery, and the learner gets support you did not have to give.",
   "Batch scheduling. Group observations of the same competency into one block. You stay in one setup, one rubric, one headspace, and move efficiently through several learners."
  ]
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Leverage never means lowering the bar. Cohort strategies make you efficient; they do not change the standard. Every learner still passes their own three gates, individually, observed by you. Group review teaches efficiently, but no one is gated in a group. Peer pairing supports, but the peer does not assess. The bar stays exactly where it is. Scale comes from efficiency, never from shortcuts."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name the three cohort strategies and what each gives you. Then answer: which parts of the twenty-learner load does the system carry, and which stay yours, and roughly how many hours a week should yours take?"
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 4"
 },
 {
  "t": "h1",
  "text": "Reporting to leadership"
 },
 {
  "t": "p",
  "text": "The final skill of Level 1. The same data that runs your day proves your value, and the department's progress, to the people who decide whether SBD continues."
 },
 {
  "t": "p",
  "text": "You practiced pulling a report from David in Module 2. Here you learn to frame it. Leadership does not want your activity; they want outcomes. Every report answers three questions: is the department getting more competent, is it getting there efficiently, and where are the risks."
 },
 {
  "t": "h2",
  "text": "What a leadership report contains"
 },
 {
  "t": "list",
  "items": [
   "Engagement. Are learners active and progressing? Any at-risk disengagement?",
   "Advancement. How many belts moved this period, and in which direction is the distribution shifting?",
   "Quality. Pass rates, remediation, and any quality signals from the gates.",
   "Efficiency. Learners carried per facilitator hour, the scalability, made visible."
  ]
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Activity report versus outcome report Weak report: “I ran twelve observations and forty coaching sessions this month.” That is your activity, and leadership cannot do anything with it. Strong report: “The department is measurably more competent, six advancements this month and the foundation tier shrank from 62% to 54%. We did it carrying eighteen learners on about eight facilitator hours a week. Two risks: a small assessment backlog I'm clearing this week, and two disengaged learners I'm re-engaging now.” Same month, but now it is competency, efficiency, and risk, the three things leadership acts on."
 },
 {
  "t": "h2",
  "text": "Monthly and weekly cadence"
 },
 {
  "t": "p",
  "text": "Keep it light and regular. A short weekly update keeps leadership current; a fuller monthly report shows the trend. Regular beats exhaustive, a leader who hears from you every week never wonders how the program is doing."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Write three sentences you would say to your Director at the end of a month, using the outcome frame: what improved, what it cost, and what the risks are. Invent reasonable numbers. This is exactly the leadership presentation your certification requires."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Two activities before the exam, both drawn straight from what the certification tests."
 },
 {
  "t": "h2",
  "text": "Activity 1 · Run a simulated week"
 },
 {
  "t": "p",
  "text": "You start Monday with a David brief showing fifteen items across your twenty learners: two safety flags, four ready for observation, three stalled, two gate failures, four progressing normally, and someone new to place. Write your week: what you handle when, what you batch, what you schedule, and what you leave alone."
 },
 {
  "t": "h2",
  "text": "Activity 2 · Build the leadership presentation"
 },
 {
  "t": "p",
  "text": "Draft the ten-minute leadership presentation your certification requires. Use the outcome frame, engagement, advancement, quality, efficiency, then the risks and your plan. Invent reasonable demo numbers. Write it as you would say it out loud."
 },
 {
  "t": "h1",
  "text": "Scalability exam"
 },
 {
  "t": "p",
  "text": "The module ends with two parts, and you pass both at 80%. First, the simulated week from Activity 1: you will be judged on prioritization (did the right things happen first), time management (did you stay within a realistic weekly load), and documentation (is it clear what you did and why). Second, the ten-minute leadership presentation from Activity 2: judged on whether it frames outcomes, not activity, and gives leadership something to act on. Complete both fully before scoring yourself against the guide on the next page."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each part against its marks. Both parts must reach at least four of five to complete Module 6, and Level 1's coursework."
 },
 {
  "t": "checklist",
  "title": "Part 1 · The simulated week",
  "items": [
   "Safety and scheduled assessments handled first, without exception",
   "Ready learners observed promptly, not left waiting",
   "Slow-but-steady learners scheduled; normal learners left alone on purpose",
   "Cohort strategies used where several learners share a need",
   "A realistic weekly load, roughly eight focused hours, not an impossible everything-at-once"
  ]
 },
 {
  "t": "checklist",
  "title": "Part 2 · The leadership presentation",
  "items": [
   "Frames outcomes (competency, advancement), not activity (sessions run)",
   "Shows efficiency: learners carried per facilitator hour",
   "Names the risks honestly, with a plan for each",
   "Is something a Director or VP could act on",
   "Fits in about ten minutes, tight and clear"
  ]
 },
 {
  "t": "h2",
  "text": "You have completed Module 6, and the Level 1 coursework"
 },
 {
  "t": "p",
  "text": "Return to the four objectives: a working daily and weekly rhythm, prioritization with David's alerts, cohort strategies, and outcome-framed leadership reporting. With this module done, you have completed all six modules of the Level 1 curriculum. What remains is to earn the credential itself."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "What comes next: the three gates You have learned the way your staff will learn, module by module, developed straight from the page. Now you earn your belt the same way they will earn theirs, through the three gates: Gate 1, Knowledge: a 100-question comprehensive exam across all six modules, at 90%. Gate 2, Simulation: five scenario-based simulations under pressure, at an 80% average. Gate 3, Observation: a full day observed by a Master Facilitator, running a real brief, a coaching conversation, a module observation, an assessment, and a leadership briefing, at 85%. You have done the work. The gates are where you prove it, the same standard, no shortcut, that you will one day hold for every technician you develop."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 1 · Module 6 · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 43,
    "q": "The two daily bookends are:",
    "options": [
     "A) Lunch and breaks",
     "B) A morning brief and an end-of-day check with David",
     "C) Two observations",
     "D) Two reports"
    ],
    "answer": "B"
   },
   {
    "n": 44,
    "q": "The four priority tiers are immediate, same-day, this-week, and:",
    "options": [
     "A) Next month",
     "B) Monitor (no action)",
     "C) Escalate",
     "D) Cancel"
    ],
    "answer": "B"
   },
   {
    "n": 45,
    "q": "Doing nothing for a normally-progressing learner is:",
    "options": [
     "A) Neglect",
     "B) Correct, it frees you for those who need you",
     "C) A last resort",
     "D) Against policy"
    ],
    "answer": "B"
   },
   {
    "n": 46,
    "q": "Cohort strategies give leverage without:",
    "options": [
     "A) Documentation",
     "B) Lowering the standard",
     "C) Using David",
     "D) Coaching"
    ],
    "answer": "B"
   },
   {
    "n": 47,
    "q": "A full caseload of ~20 learners should take roughly:",
    "options": [
     "A) 40 hours a week of facilitation",
     "B) 8 focused hours a week",
     "C) No time",
     "D) 2 hours a day"
    ],
    "answer": "B"
   },
   {
    "n": 48,
    "q": "A strong leadership report frames:",
    "options": [
     "A) Activity (sessions run)",
     "B) Outcomes (competency, efficiency, risk)",
     "C) Only problems",
     "D) Only successes"
    ],
    "answer": "B"
   },
   {
    "n": 49,
    "q": "In cohort work, gates are still:",
    "options": [
     "A) Done as a group",
     "B) Passed individually, observed by you",
     "C) Optional",
     "D) Waived for peers"
    ],
    "answer": "B"
   },
   {
    "n": 50,
    "q": "Peer pairing helps the near-peer teacher by:",
    "options": [
     "A) Giving them a break",
     "B) Cementing their own mastery",
     "C) Replacing their assessment",
     "D) Skipping their gate"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P07",
  "seq": 7,
  "level": 2,
  "levelLabel": "Level 2 Advanced",
  "levelPos": "1 of 4",
  "title": "Multi-Facility Operations",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 2 · ADVANCED FACILITATOR"
 },
 {
  "t": "p",
  "text": "Module 7"
 },
 {
  "t": "p",
  "text": "Level 2 · Module 1 of 4"
 },
 {
  "t": "p",
  "text": "Multi-Facility Operations"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "You have run one department well. Now you learn to carry several at once, without letting the standard drift or losing the human touch that made you effective in the first place."
 },
 {
  "t": "p",
  "text": "Estimated time: 6 hours · Part of the 24-hour Level 2 program · Prerequisite: Level 1 certification"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Welcome to Level 2"
 },
 {
  "t": "p",
  "text": "You earned your Level 1 certification by proving you can develop a department: coach, observe, assess, and run a full caseload on the SBD system. Level 2 is a different altitude. You are no longer responsible for one floor; you are responsible for the standard across several, and for the facilitators running each of them."
 },
 {
  "t": "p",
  "text": "That shift changes the nature of the work. In Level 1, your leverage came from the system doing the teaching so you could coach. In Level 2, your leverage comes from other facilitators doing the coaching so you can hold the standard, spot the patterns, and move best practice from the department that cracked it to the one still struggling. You are becoming the person who makes many departments as good as your best one."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "The Level 2 danger, named up front. Every multi-facility leader faces the same trap: as you scale, the standard drifts. Facility A quietly softens an observation, Facility B invents its own shortcut, and within a year “Yellow Belt” means three different things across your network. Your central job in this module, under every technique, is to make scale and consistency coexist. If they ever conflict, consistency wins. A standard that bends to be convenient is no standard at all."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end of Module 7:"
 },
 {
  "t": "list",
  "items": [
   "Manage competency development across two or more facilities using network-wide intelligence.",
   "Benchmark facilities against each other and turn the comparison into action.",
   "Facilitate remotely, knowing exactly what works at a distance and what does not.",
   "Train and rely on local champions without letting the standard slip."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 4"
 },
 {
  "t": "h1",
  "text": "Managing across facilities"
 },
 {
  "t": "p",
  "text": "The first skill is simply seeing the whole network at once, and knowing which level any given problem lives at."
 },
 {
  "t": "h2",
  "text": "Network-wide intelligence"
 },
 {
  "t": "p",
  "text": "In Level 1 you asked David about your learners. In Level 2 you ask David about your facilities. The same intelligence layer rolls individual data up to the network level, so you can see competency distribution, advancement rates, and risk across every department you cover, side by side."
 },
 {
  "t": "p",
  "text": "The core new skill is telling apart two kinds of signal: a system-wide trend versus a facility-specific problem. They look similar on the surface and demand completely different responses."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Same symptom, two very different causes David shows that packaging failures are up across your network. Before you act, you ask: is this everywhere, or somewhere? If packaging failures are elevated at all five facilities equally, that is a system-wide signal, maybe the packaging module needs revision, and you escalate it to the curriculum level. If packaging failures are elevated only at Facility C while the other four are fine, that is a facility-specific problem, something about Facility C's local practice, equipment, or facilitator, and you go there. Reading a network number as local, or a local number as network, sends you to fix the wrong thing entirely."
 },
 {
  "t": "h2",
  "text": "Where your attention goes"
 },
 {
  "t": "p",
  "text": "With several facilities, you cannot be everywhere, and you should not try, that is the same lesson as the Level 1 monitor tier, one altitude up. You allocate your presence to where the data says it is needed: the struggling facility, the new rollout, the facilitator who needs support, and you leave the facilities that are running well to run well."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. In one sentence each, define a system-wide trend and a facility-specific problem, and give the different response each requires. Then answer: if one facility's advancement rate is far below the others, which kind of signal is that, and where do you go?"
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 4"
 },
 {
  "t": "h1",
  "text": "Benchmarking and best-practice transfer"
 },
 {
  "t": "p",
  "text": "Comparison is only useful if it ends in action. Benchmarking finds the gap; best-practice transfer closes it."
 },
 {
  "t": "h2",
  "text": "What you actually compare"
 },
 {
  "t": "p",
  "text": "Benchmarking is comparing your facilities against each other on the measures that matter, then asking why the differences exist. The comparison is never the point; the question “why is this facility ahead, and what can the others learn from it” is the point."
 },
 {
  "t": "list",
  "items": [
   "Advancement rate. How quickly learners move up. A slow facility is telling you something.",
   "Pass rates and remediation. Quality of development, not just speed.",
   "Time-to-belt. How long onboarding actually takes at each site.",
   "Facilitator efficiency. Learners carried per hour, the scalability, by site."
  ]
 },
 {
  "t": "h2",
  "text": "The benchmarking move, in four steps"
 },
 {
  "t": "list",
  "items": [
   "Compare the facilities on the measures above, using David's network view.",
   "Identify the outliers in both directions: the strongest facility and the struggling one.",
   "Find the why. Root-cause the difference. What is the strong facility actually doing that the others are not?",
   "Transfer it. Move that specific practice to the facilities that need it, and measure whether it closes the gap."
  ]
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Benchmarking that ends in action You benchmark five facilities. Facility A advances learners to Yellow in seven weeks; Facility D takes fourteen. That gap is the finding, but not the answer. You root-cause it and discover Facility A's facilitator runs a group review after every shared gate, catching common failures once instead of five times, while Facility D coaches every learner individually and drowns. The best practice is the group review. You bring it to Facility D, and over the next two months their time-to-Yellow drops. That is the whole discipline: compare, find the outlier, find the why, transfer, and verify it worked. A benchmark that just names the gap and stops is wasted."
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Do not benchmark facilities into a race. Benchmarking is for learning, not for shaming. The moment facilities feel ranked and punished, they start hiding problems and gaming numbers, and your data goes bad. Frame every comparison as “what can we learn from each other,” never as “who is losing.” The strong facility is a teacher, not a winner; the struggling one has a fixable gap, not a failing grade."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Pick a measure from this section. Describe how you would move a best practice from your strongest facility to your weakest on that measure, and how you would know it worked. Write the full loop, compare through verify."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 4"
 },
 {
  "t": "h1",
  "text": "Remote facilitation and its limits"
 },
 {
  "t": "p",
  "text": "Distance changes what you can and cannot do. The skill is being honest about the line, because crossing it quietly is how remote facilitation fails."
 },
 {
  "t": "p",
  "text": "Covering several facilities means you cannot be physically present at all of them all the time. Some of your facilitation goes remote. The central truth of this section is that remote works well for some of the job and not at all for the rest, and pretending otherwise puts the standard at risk."
 },
 {
  "t": "p",
  "text": "WORKS REMOTELY Coaching conversations by video, when trust already exists. Reading David's data and diagnosing patterns. Reviewing documentation and readiness. Benchmarking and best-practice planning. Supporting and developing a local facilitator."
 },
 {
  "t": "p",
  "text": "DOES NOT WORK REMOTELY Gate 3 observation of live technique. You cannot verify hands through a screen. Building first trust with a learner who has never met you. Reading the room during a hard, in-person moment. Anything where physical presence is the assessment."
 },
 {
  "t": "h2",
  "text": "The observation line"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Never certify a hands-on gate you did not watch in person. This is the hard rule of remote facilitation. Gate 3 is the observation of real technique, and technique cannot be verified over video, camera angles hide the exact thing you need to see, and a soft remote pass is exactly the drift that destroys a multi-facility standard. If you cannot be there, the observation is run by a certified local observer who can, and you support them. You never sign off on hands you did not actually watch."
 },
 {
  "t": "h2",
  "text": "Building trust without daily presence"
 },
 {
  "t": "p",
  "text": "The other remote challenge is relationship. In Level 1, trust came from being on the floor every day. Remote, you have to build it deliberately: regular scheduled contact so you are not a stranger who only appears when something is wrong, genuine responsiveness when a facility reaches out, and visible follow-through so your word means something at a distance. A remote leader who only shows up to correct becomes someone to hide from."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name two parts of facilitation that work well remotely and two that do not. Then state the hard rule about Gate 3 observation at a distance, and what you do instead when you cannot be present."
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 4"
 },
 {
  "t": "h1",
  "text": "Training and relying on local champions"
 },
 {
  "t": "p",
  "text": "You cannot scale on your own presence. Local champions are how a multi-facility standard actually holds, if you develop and govern them well."
 },
 {
  "t": "p",
  "text": "A local champion is a facilitator inside each facility who carries the day-to-day work you cannot be there for, especially the in-person observation you just learned you cannot do remotely. Building and governing this network of champions is the real engine of multi-facility scale. Three moves make it work."
 },
 {
  "t": "h2",
  "text": "Identify the right facilitators"
 },
 {
  "t": "p",
  "text": "Not every strong technician makes a good champion, and not every eager volunteer is ready. You are looking for someone who holds the standard even when no one is watching, who other staff already trust, and who can be developed into a certified observer. Character before enthusiasm: a champion who bends the standard to be liked does more damage than no champion at all."
 },
 {
  "t": "h2",
  "text": "Delegate observation to certified observers only"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Delegation is not abdication. You can delegate the running of an observation to a local champion, but only once they are a certified observer held to the same rubric you are, and you remain accountable for the standard they apply. Delegating to an uncertified “good tech” is how the standard quietly dies at the facilities you visit least. Certify first, then delegate, then audit."
 },
 {
  "t": "h2",
  "text": "Run quality assurance on distributed facilitation"
 },
 {
  "t": "p",
  "text": "Once observation is happening at facilities you are not standing in, you need a way to know it is being done to standard. That is quality assurance: periodically reviewing a sample of each champion's observations and documentation, checking that their pass/fail decisions match what you would have decided, and coaching them when they drift. This is the safeguard that lets you sleep at night while five facilities run without you in the room."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "The champion system, working You cover five facilities. You cannot observe every gate at every site, so at each facility you have identified and certified a local champion who runs the in-person observations. Each month you pull a sample of their scored observations from David and review them against the rubric. Four champions are calibrated; one is passing work you would have failed on a safety-critical step. You coach that champion, re-audit, and confirm they have recalibrated. Five facilities, one standard, held, because you built the champions, certified them, delegated to them, and audited them. That is multi-facility operations."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Describe the three moves of the champion system in order, identify, delegate, assure, and write the one sentence you would use to explain to a champion why you audit their observations even though you trust them."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Two activities before the module assessment, both drawn from what Level 2 tests."
 },
 {
  "t": "h2",
  "text": "Activity 1 · Read the network"
 },
 {
  "t": "p",
  "text": "David's network view shows five facilities. Four advance learners to Yellow in about eight weeks; one takes sixteen. Across all five, sterilization pass rates dipped this month. Write which signal is facility-specific and which is system-wide, what you would do about each, and where you would physically go."
 },
 {
  "t": "h2",
  "text": "Activity 2 · Build a champion plan"
 },
 {
  "t": "p",
  "text": "You are taking on a new facility you can visit only twice a month. Write your plan to hold the standard there: how you identify a champion, what has to be true before you delegate observation to them, and how you will run quality assurance on their work."
 },
 {
  "t": "h1",
  "text": "Module 7 assessment"
 },
 {
  "t": "p",
  "text": "Level 2 assessments are applied, not multiple-choice, they mirror the real work of an advanced facilitator. Complete both tasks below fully. They combine, with the other Level 2 modules, toward the Level 2 certification gates. Score yourself against the guide that follows."
 },
 {
  "t": "h2",
  "text": "Task 1 · Multi-facility analysis"
 },
 {
  "t": "p",
  "text": "Using the five-facility scenario from Activity 1, write a complete analysis: separate the system-wide signal from the facility-specific one, root-cause each, prescribe an action for each, and name how you would verify improvement. Then identify one best practice you would transfer between facilities and how you would measure whether it worked."
 },
 {
  "t": "h2",
  "text": "Task 2 · Remote and champion plan"
 },
 {
  "t": "p",
  "text": "For the new twice-a-month facility, write the plan that keeps the standard intact at a distance: what you will do remotely, what you will never do remotely, how you identify and certify a local champion, and how your quality-assurance audit of their observations works."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each task against its marks. Both tasks must reach at least four of five to complete Module 7."
 },
 {
  "t": "checklist",
  "title": "Task 1 · Multi-facility analysis",
  "items": [
   "Correctly separates the system-wide signal from the facility-specific one",
   "Root-causes each rather than treating the symptom",
   "Prescribes the right level of response: curriculum-level vs on-site",
   "Transfers a specific best practice, not a vague “share learnings”",
   "Names how improvement will be measured and verified"
  ]
 },
 {
  "t": "checklist",
  "title": "Task 2 · Remote and champion plan",
  "items": [
   "Correctly divides what works remotely from what does not",
   "Holds the hard line: no remote certification of a hands-on gate",
   "Identifies a champion on standard-holding character, not just skill or eagerness",
   "Certifies before delegating observation",
   "Includes a real quality-assurance audit of the champion's work"
  ]
 },
 {
  "t": "h2",
  "text": "You have completed Module 7"
 },
 {
  "t": "p",
  "text": "Return to the four objectives: manage across facilities with network intelligence, benchmark and transfer best practice, facilitate remotely within its real limits, and build and govern local champions. If separating network signals from local ones, or the champion quality-assurance loop, still feels shaky, re-read before Module 8."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "Carry this into Module 8 You can now run a network of facilities and hold one standard across it. Module 8, Advanced Coaching and Leadership, turns inward again, to the hardest people to coach: the high belts who may know more than you, the future leaders you are developing, and the resistant veterans. You have learned to scale. Next you learn to lead at the top of the belt system."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 2 · Module 7 (Module 1 of 4) · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 1,
    "q": "A packaging failure elevated equally across all five facilities is best read as:",
    "options": [
     "A) A facility-specific problem",
     "B) A system-wide signal to escalate to the curriculum level",
     "C) One facility's bad month",
     "D) A reason to lower the standard"
    ],
    "answer": "B"
   },
   {
    "n": 2,
    "q": "The purpose of benchmarking facilities against each other is to:",
    "options": [
     "A) Rank and reward the winners",
     "B) Learn why the strongest is ahead and transfer that practice",
     "C) Justify closing weak facilities",
     "D) Set individual quotas"
    ],
    "answer": "B"
   },
   {
    "n": 3,
    "q": "Which task does NOT work remotely?",
    "options": [
     "A) Reading David's data",
     "B) Coaching by video where trust exists",
     "C) Gate 3 observation of live technique",
     "D) Benchmarking and planning"
    ],
    "answer": "C"
   },
   {
    "n": 4,
    "q": "Before delegating observation to a local champion, you must:",
    "options": [
     "A) Trust them",
     "B) Certify them as an observer held to the same rubric",
     "C) Give them a title",
     "D) Wait a year"
    ],
    "answer": "B"
   },
   {
    "n": 5,
    "q": "Quality assurance on distributed facilitation means:",
    "options": [
     "A) Trusting champions fully once chosen",
     "B) Periodically reviewing a sample of their scored observations against the rubric",
     "C) Observing every gate yourself",
     "D) Removing champions who disagree with you"
    ],
    "answer": "B"
   },
   {
    "n": 6,
    "q": "A benchmark that names a gap but ends there is:",
    "options": [
     "A) Complete",
     "B) Wasted, without best-practice transfer and verification",
     "C) Ideal",
     "D) All that is required"
    ],
    "answer": "B"
   },
   {
    "n": 7,
    "q": "When scale and consistency conflict, the rule is:",
    "options": [
     "A) Scale wins",
     "B) Consistency wins",
     "C) Whichever is cheaper",
     "D) Ask the facility"
    ],
    "answer": "B"
   },
   {
    "n": 8,
    "q": "Delegating observation to an uncertified “good tech” is:",
    "options": [
     "A) Efficient",
     "B) How the standard quietly dies at facilities you visit least",
     "C) Recommended",
     "D) Required for scale"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P08",
  "seq": 8,
  "level": 2,
  "levelLabel": "Level 2 Advanced",
  "levelPos": "2 of 4",
  "title": "Advanced Coaching and Leadership",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 2 · ADVANCED FACILITATOR"
 },
 {
  "t": "p",
  "text": "Module 8"
 },
 {
  "t": "p",
  "text": "Level 2 · Module 2 of 4"
 },
 {
  "t": "p",
  "text": "Advanced Coaching and Leadership"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "In Level 1 you learned to coach people toward the standard. Now you learn to coach the people who are near the top of it, and to grow the leaders who will one day replace you."
 },
 {
  "t": "p",
  "text": "Estimated time: 6 hours · Part of the 24-hour Level 2 program · Prerequisite: Level 1 certification"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin"
 },
 {
  "t": "p",
  "text": "Level 1 coaching was about moving people toward competency, the stuck learner, the discouraged one, the one avoiding an assessment they were ready for. This module is about a harder set of people: the ones near the top of the belt system who may know more than you do, the ones you are quietly developing into leaders, and the ones whose resistance is not about skill at all."
 },
 {
  "t": "p",
  "text": "The Level 1 protocols still work, but they are not enough here. Coaching a Blue Belt candidate is not like coaching a White Belt; the whole dynamic inverts. Developing a future supervisor requires you to grow judgment, not just skill. And navigating a resistant twenty-year veteran, or the politics between training and operations, calls for a kind of leadership that has nothing to do with the rubric. That is what this module builds."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "The shift this module asks of you. Up to now, your authority came from knowing the standard better than the learner. With high belts and emerging leaders, that source runs out, they may match or exceed your technical knowledge. Your authority now comes from something else: your judgment, your fairness, and your ability to develop people rather than out-know them. If you try to lead high performers by proving you know more, you will lose them. Lead them by making them better than you."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end of Module 8:"
 },
 {
  "t": "list",
  "items": [
   "Coach high-level belts (Blue, Brown, Black), including people who may know more than you.",
   "Develop leadership competency in staff, not just technical skill.",
   "Navigate complex dynamics: generational, cultural, and resistance from senior staff.",
   "Coach other facilitators, developing the people who develop others."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 4"
 },
 {
  "t": "h1",
  "text": "Coaching the high belts"
 },
 {
  "t": "p",
  "text": "When the person in front of you may be more skilled than you, coaching does not stop, it changes shape entirely."
 },
 {
  "t": "h2",
  "text": "The authority problem"
 },
 {
  "t": "p",
  "text": "A White Belt accepts your guidance because you clearly know more. A Brown Belt candidate might be the most skilled person in the building. If you walk into that conversation trying to prove your expertise, you will fail, they will see through it, and you will lose their respect. The move is the opposite: acknowledge their skill openly, and shift your role from expert to developer."
 },
 {
  "t": "p",
  "text": "Coaching a Brown Belt candidate on root-cause analysis. Learner: With respect, I've been doing failure investigations longer than you've been here. You: You have, and I'm not here to teach you investigation, you'd run circles around me on the floor. What Brown Belt asks is different: can you take what's in your head and make it a repeatable method someone else can follow? That's not about being better at it. It's about making it teachable. That's where I can actually be useful to you."
 },
 {
  "t": "p",
  "text": "Notice what happened. You did not pretend to out-know them. You reframed the belt as something their experience alone does not automatically give, the ability to systematize and transfer what they know, and positioned yourself as a partner in that, not a superior. That reframe is the key to every high-belt conversation."
 },
 {
  "t": "h2",
  "text": "What high belts actually need"
 },
 {
  "t": "p",
  "text": "The higher the belt, the less the learner needs technical instruction and the more they need three other things: a genuine intellectual challenge worthy of their skill, honest feedback that most people are too intimidated to give them, and a reason that connects the belt to something they care about, usually legacy and influence rather than advancement."
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "High performers are starved for honest feedback. The most skilled person in a department often gets the least real feedback, because everyone assumes they do not need it and is a little afraid to give it. That is a gap you can fill. A Brown Belt who has not heard an honest critique in years will respect the facilitator brave enough to offer one well. Do not let their skill make you timid, it is exactly why they need you."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. A Blue Belt candidate says, “I already know all this, why do I need you?” Write your response, in your own words, that reframes your role from expert to developer without pretending to out-know them."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 4"
 },
 {
  "t": "h1",
  "text": "Developing leaders, not just technicians"
 },
 {
  "t": "p",
  "text": "At the higher belts, you are no longer only building skill. You are building the judgment, and the people, who will run the department after you."
 },
 {
  "t": "h2",
  "text": "Spotting leadership potential"
 },
 {
  "t": "p",
  "text": "Leadership potential is not the same as technical excellence, and confusing the two is a classic mistake. The best technician is not automatically the best leader, and promoting them as if they were often loses you a great tech and gains you a struggling supervisor. You are watching for different signals: does this person lift the people around them, do others already turn to them, do they think about the department and not just their own trays, do they stay steady under pressure."
 },
 {
  "t": "list",
  "items": [
   "The tell is influence, not output. A future leader makes the people near them better. A high performer just performs. Watch who the team already follows when no title says they should."
  ]
 },
 {
  "t": "h2",
  "text": "Coaching leadership behaviors"
 },
 {
  "t": "p",
  "text": "Once you spot potential, you develop it deliberately, the same way you developed technical skill, but aimed at judgment and people. You give them small leadership reps: let them run a group review, pair them with a struggling peer, ask them how they would handle a floor situation before you weigh in. Then you coach the judgment, not just the outcome."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Developing judgment, not just answers You are growing a Green Belt toward a lead role. Instead of telling them how to handle a backlog, you ask: “Two STAT trays and a full backlog just landed at once. Walk me through how you'd prioritize, and why.” They give an answer. You do not just grade it, you probe the reasoning: “What made you put that one first? What would change your mind?” You are not testing whether they know the right answer. You are developing how they think under pressure, because that judgment is what a leader actually needs, and it cannot be handed to them as a fact."
 },
 {
  "t": "h2",
  "text": "Succession planning"
 },
 {
  "t": "p",
  "text": "The highest expression of this work is building the people who will replace you and your leads. A department that depends entirely on you is fragile; a department that is always growing its next layer of leaders is durable. Part of your job at Level 2 is to always have someone in development for the next role up, so no departure leaves a hole no one can fill."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Think of someone you would identify as having leadership potential, real or hypothetical. Write the specific signals that mark them, and one small leadership rep you would give them next to develop their judgment."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 4"
 },
 {
  "t": "h1",
  "text": "Navigating complex dynamics"
 },
 {
  "t": "p",
  "text": "Some of the hardest situations you face have nothing to do with skill. They are about people, history, and politics, and the rubric will not help you here."
 },
 {
  "t": "h2",
  "text": "Resistance from senior staff"
 },
 {
  "t": "p",
  "text": "You met this briefly in Level 1. At Level 2 you handle it as a leader, not just a coach. The experienced tech who resents a belt program is rarely arguing about the program; they are protecting their status and their sense of being respected. Argue the program and you lose. Honor the status and redirect it, and you often win them into becoming your strongest ally."
 },
 {
  "t": "p",
  "text": "Veteran: This whole belt thing is a waste of time. I trained half the people here. You: You did, and that's exactly the problem I need your help with. Right now everything you taught them lives in your head, and the day you retire, it walks out the door with you. The belt system is how we capture what you know so it outlasts you. I'm not asking you to prove yourself. I'm asking you to make sure the standard you set becomes permanent."
 },
 {
  "t": "p",
  "text": "You turned the resistance into a legacy. The veteran's status is now on the side of the program, not against it. That is leadership, not coaching, and it is the move that converts your loudest skeptic into your anchor."
 },
 {
  "t": "h2",
  "text": "Generational and cultural difference"
 },
 {
  "t": "p",
  "text": "A multi-generational, multicultural department is normal in sterile processing, and the people in it respond to different things. A newer worker may want rapid feedback and a clear path; a veteran may want respect for experience; people from different backgrounds may read directness, hierarchy, and praise very differently. You do not need to become an expert in every difference. You need the humility to notice that one approach does not fit everyone, and the flexibility to adjust, exactly the lesson the OIP profiles taught you, widened to culture and generation."
 },
 {
  "t": "h2",
  "text": "The politics of training versus operations"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "You will get caught between development and the day's staffing. Operations wants bodies on the floor now. Development wants time to grow people properly. These pull against each other constantly, and as a Level 2 facilitator you sit right in the middle. Do not pretend the tension is not real, and do not always cave to the urgent. Your job is to make the case, in the language of operations, that developed staff are what solve the staffing problem permanently. Frame development as the cure for the very pressure operations is feeling, not a competitor for it."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. A resistant senior tech says the belt program is beneath them. Write the reframe that turns their experience into an asset for the program rather than an obstacle. Then name the one thing you should never do in that conversation."
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 4"
 },
 {
  "t": "h1",
  "text": "Coaching other facilitators"
 },
 {
  "t": "p",
  "text": "The final multiplier. When you develop other facilitators, your standard reaches every learner they will ever touch, long after you have moved on."
 },
 {
  "t": "p",
  "text": "At Level 2 you are often the most experienced facilitator in a group, and part of your role is developing the newer ones. Coaching a facilitator is different from coaching a technician: you are not building a hands-on skill, you are building judgment about people, and you do it largely by watching them work and giving honest feedback on how they handle the human moments."
 },
 {
  "t": "h2",
  "text": "How you develop a facilitator"
 },
 {
  "t": "list",
  "items": [
   "Watch them coach and observe. Sit in on their coaching conversations and their Gate 3 observations, the same way a Master Facilitator will one day watch you.",
   "Give feedback on the human read, not just the mechanics. Did they catch the real barrier? Did they match the OIP profile? Did they stay silent during the gate? That is where facilitators grow.",
   "Mentor the judgment calls. Talk through the gray-area decisions, when to escalate, when to hold the line, how to handle a halo-effect temptation, because those are the calls that separate a good facilitator from a mechanical one."
  ]
 },
 {
  "t": "h2",
  "text": "The peer-feedback discipline"
 },
 {
  "t": "p",
  "text": "Giving honest feedback to a peer, someone at or near your own level, is one of the hardest things you will do, and one of the most valuable. Use the same SBI structure you use with learners, and lead with genuine respect, but do not soften the substance into uselessness. A facilitator who never hears honest peer feedback drifts, and their drift becomes their learners' drift."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Coaching a facilitator through a halo-effect miss You watched a newer facilitator pass a learner on a Gate 3 despite a skipped verification step, because they knew the learner “usually does it right.” Afterward: “Can I give you something honest? During the observation (situation), the lumen check got skipped and you passed it anyway (behavior). I think you scored the person you know instead of the work you saw, that's the halo effect, and it's the most natural mistake there is (impact). Here's why it matters: that pass is now in a patient's chain of safety. Next time, score only what's in front of you, even when you're sure of the person.” You developed a facilitator, protected a standard, and did it with respect. That is the multiplier at work."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Write a piece of honest peer feedback to a fellow facilitator who coached through a summative gate (helped instead of assessing). Use Situation, Behavior, Impact, lead with respect, and do not soften the substance."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Two activities before the module assessment, both drawn from what Level 2 tests."
 },
 {
  "t": "h2",
  "text": "Activity 1 · The high-belt conversation"
 },
 {
  "t": "p",
  "text": "A Brown Belt candidate with more floor experience than you challenges why they need your coaching at all. Write the full conversation, your opening reframe, how you handle their pushback, and how you land on a genuine reason the belt asks something their experience alone does not give them."
 },
 {
  "t": "h2",
  "text": "Activity 2 · The leadership development plan"
 },
 {
  "t": "p",
  "text": "You have identified a Green Belt with leadership potential. Write a development plan that grows their judgment and people skills, not just their technical belt: the signals you saw, the leadership reps you would assign, and how you would coach the judgment behind their decisions."
 },
 {
  "t": "h1",
  "text": "Module 8 assessment"
 },
 {
  "t": "p",
  "text": "Two applied tasks, mirroring the real work of an advanced facilitator. Complete both fully; they combine with the other Level 2 modules toward the certification gates. Score yourself against the guide that follows."
 },
 {
  "t": "h2",
  "text": "Task 1 · Conduct and evaluate a high-belt coaching conversation"
 },
 {
  "t": "p",
  "text": "Using the Brown Belt scenario from Activity 1, write the complete coaching conversation as you would deliver it, and then evaluate your own conversation: did you reframe your role well, did you offer honest feedback, and did you connect the belt to something the high performer actually cares about?"
 },
 {
  "t": "h2",
  "text": "Task 2 · Build a leadership development plan"
 },
 {
  "t": "p",
  "text": "For the Green Belt with leadership potential, write the full development plan: the leadership signals, the specific reps, how you coach judgment rather than answers, and how this person fits your succession planning for the department."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each task against its marks. Both tasks must reach at least four of five to complete Module 8."
 },
 {
  "t": "checklist",
  "title": "Task 1 · High-belt coaching",
  "items": [
   "Reframes your role from expert to developer, without pretending to out-know them",
   "Offers honest feedback the learner likely is not getting elsewhere",
   "Connects the belt to legacy/influence, what a high performer cares about",
   "Holds respect and authority at the same time, neither timid nor arrogant",
   "Lands on a genuine reason the belt asks more than experience alone gives"
  ]
 },
 {
  "t": "checklist",
  "title": "Task 2 · Leadership development",
  "items": [
   "Distinguishes leadership potential (influence) from technical excellence (output)",
   "Assigns real leadership reps, not just more technical work",
   "Coaches judgment and reasoning, not just correct answers",
   "Connects the individual to department succession planning",
   "Develops the person deliberately, not by accident or osmosis"
  ]
 },
 {
  "t": "h2",
  "text": "You have completed Module 8"
 },
 {
  "t": "p",
  "text": "Return to the four objectives: coach high-level belts, develop leadership rather than just skill, navigate complex human and political dynamics, and coach other facilitators. If the authority reframe with high belts, or the difference between developing a technician and developing a leader, still feels shaky, re-read before Module 9."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "Carry this into Module 9 You can now develop people at the top of the belt system and grow the leaders and facilitators who extend your reach. Module 9, Program Design and Continuous Improvement, turns from developing people to designing the programs that develop them, building a facility-specific program on the SBD framework, and improving it with data. You have learned to lead people. Next you learn to build the system around them."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 2 · Module 8 (Module 2 of 4) · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 9,
    "q": "With a high belt who may know more than you, your authority comes from:",
    "options": [
     "A) Proving you know more",
     "B) Your judgment, fairness, and ability to develop them",
     "C) Your title",
     "D) Withholding feedback"
    ],
    "answer": "B"
   },
   {
    "n": 10,
    "q": "High performers are often starved for:",
    "options": [
     "A) Recognition of tenure",
     "B) Honest feedback no one dares to give them",
     "C) More technical content",
     "D) Time off"
    ],
    "answer": "B"
   },
   {
    "n": 11,
    "q": "Leadership potential is best signaled by:",
    "options": [
     "A) Highest technical output",
     "B) Influence, lifting the people around them",
     "C) Seniority",
     "D) Volunteering"
    ],
    "answer": "B"
   },
   {
    "n": 12,
    "q": "Developing a future leader means coaching:",
    "options": [
     "A) Only technical skill",
     "B) Judgment and people, through leadership reps",
     "C) Faster hands",
     "D) Test-taking"
    ],
    "answer": "B"
   },
   {
    "n": 13,
    "q": "A resistant veteran is best won by:",
    "options": [
     "A) Arguing the program's merits",
     "B) Honoring their status and redirecting it into legacy",
     "C) Ignoring them",
     "D) Reporting them"
    ],
    "answer": "B"
   },
   {
    "n": 14,
    "q": "When you coach another facilitator, you focus feedback on:",
    "options": [
     "A) Only mechanics",
     "B) The human read: barrier, profile match, staying silent in a gate",
     "C) Their paperwork speed",
     "D) Their tenure"
    ],
    "answer": "B"
   },
   {
    "n": 15,
    "q": "The training-versus-operations tension is best handled by:",
    "options": [
     "A) Always giving operations the bodies",
     "B) Making the case that developed staff solve the staffing problem permanently",
     "C) Ignoring operations",
     "D) Refusing to release anyone"
    ],
    "answer": "B"
   },
   {
    "n": 16,
    "q": "Coaching a facilitator through a halo-effect miss uses:",
    "options": [
     "A) A warning",
     "B) SBI feedback, with respect and without softening the substance",
     "C) Silence",
     "D) Reassignment"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P09",
  "seq": 9,
  "level": 2,
  "levelLabel": "Level 2 Advanced",
  "levelPos": "3 of 4",
  "title": "Program Design and Continuous Improvement",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 2 · ADVANCED FACILITATOR"
 },
 {
  "t": "p",
  "text": "Module 9"
 },
 {
  "t": "p",
  "text": "Level 2 · Module 3 of 4"
 },
 {
  "t": "p",
  "text": "Program Design and Continuous Improvement"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "You have led people and held a standard across facilities. Now you learn to design the program that develops them, and to improve it with evidence instead of instinct."
 },
 {
  "t": "p",
  "text": "Estimated time: 6 hours · Part of the 24-hour Level 2 program · Prerequisite: Level 1 certification"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin"
 },
 {
  "t": "p",
  "text": "Everything until now has been about running the SBD system as it is given to you. This module asks something new: design. A facility is not a generic thing. A high-volume trauma center, a lean orthopedic ASC, and an academic teaching hospital have different needs, different constraints, and different goals, and an advanced facilitator builds a program that fits the facility in front of them, on top of the fixed SBD framework."
 },
 {
  "t": "p",
  "text": "But design without evidence is just opinion with a nicer name. So the second half of this module is about proving whether your program actually works, reading the data, running disciplined improvement cycles, and contributing what you learn back to the wider SBD system. You are becoming someone who does not just deliver a program, but builds one, measures it, and makes it better on purpose."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "One line never moves, no matter what you design. You design the path, never the standard. The belt curriculum, the gates, and the pass thresholds are fixed, that is the whole reason “Yellow Belt” means the same thing everywhere. What you design is everything around them: the sequence, the pace, the roadmap, the emphasis, the local scenarios. If a “program design” ever quietly lowers a gate or bends a threshold, it is not design, it is drift. Build freely on top of the standard. Never build into it."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end of Module 9:"
 },
 {
  "t": "list",
  "items": [
   "Design a facility-specific program on the SBD framework, fitting its needs and goals.",
   "Analyze program effectiveness with data, not impressions.",
   "Run continuous-improvement cycles that measurably move a number.",
   "Contribute to SBD curriculum by surfacing gaps and proposing content."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 4"
 },
 {
  "t": "h1",
  "text": "Designing a facility-specific program"
 },
 {
  "t": "p",
  "text": "Design starts with the facility, not the curriculum. Understand what this place actually needs before you sequence a single module."
 },
 {
  "t": "h2",
  "text": "Assess the facility first"
 },
 {
  "t": "p",
  "text": "Before you design anything, you diagnose the facility: its case mix and volume, its current competency distribution, its staffing pressure, its turnover, and its goals. A trauma center bleeding travelers needs a program that gets people to independent competency fast. An academic center may want depth and teaching capability. The same SBD framework serves both, but the program you build on it is shaped by the need you found."
 },
 {
  "t": "list",
  "items": [
   "Case mix and volume. What kind of work, how much, how predictable. This drives which competencies matter most first.",
   "Current state. Where does the staff place today? A department full of White Belts needs a different plan than one with a strong core.",
   "Pressure and goals. Traveler dependency, turnover, a survey coming, a new service line. The pain points tell you what the program must solve."
  ]
 },
 {
  "t": "h2",
  "text": "Build the roadmap"
 },
 {
  "t": "p",
  "text": "From the assessment you build a roadmap, usually a six- and twelve-month view, that sequences development toward the facility's goals. The roadmap answers: who advances, in what order, by when, and toward what outcome the facility cares about. It aligns training to the facility's actual goals, not to a generic calendar."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Two facilities, one framework, two programs Facility A is a trauma center at 100% traveler dependency, hemorrhaging money. Your program prioritizes getting its permanent staff to independent single-zone competency (Yellow) as fast as the standard allows, so it can cut travelers. The roadmap front-loads decontamination and core workflow, batches observations, and targets a measurable traveler reduction in six months. Facility B is an academic center with a stable, competent staff and a teaching mission. Your program emphasizes Green and Blue development and preceptor capability, so it can grow its own educators. Same belts, same gates, same standard, completely different roadmap, because the facilities needed different things. That is program design."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name three things you assess about a facility before designing its program, and explain how a trauma center's roadmap would differ from an academic center's, without either one changing the belt standard."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 4"
 },
 {
  "t": "h1",
  "text": "Analyzing program effectiveness"
 },
 {
  "t": "p",
  "text": "A program you cannot measure is a program you cannot defend or improve. Learn what to measure and how to read it honestly."
 },
 {
  "t": "h2",
  "text": "The program KPIs"
 },
 {
  "t": "p",
  "text": "At the program level, you are watching a handful of measures that together tell you whether the program is working. David assembles them; your skill is interpreting them together rather than fixating on one."
 },
 {
  "t": "list",
  "items": [
   "Advancement rate and time-to-belt. Is the program actually moving people, and how fast?",
   "Pass rates and remediation load. Is development real, or are people scraping through and failing later?",
   "Retention. Are developed people staying? A program that develops people who then leave has a different problem than one that cannot develop them at all.",
   "Outcome measures the facility cares about. Traveler dependency, overtime, error rates, survey readiness, the numbers leadership actually feels."
  ]
 },
 {
  "t": "h2",
  "text": "Reading the numbers honestly"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "A single number lies. Read them together. Fast advancement looks great until you see the pass rate collapsing behind it, that is not a strong program, it is a program rushing people through. High pass rates look great until you see time-to-belt ballooning, maybe you are only assessing the sure things. The discipline is to read the KPIs as a set and ask what story they tell together. The same honesty you brought to a learner's domain breakdown, now applied to a whole program."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "When a good number hides a bad one Your program's advancement rate jumped 30% this quarter, and you are ready to celebrate. Then you read the rest: remediation load doubled, and three learners who advanced fast failed a later gate. The advancement number was not success, it was people being pushed to assessment before they were ready. The honest read saves you from scaling a mistake. One number is a headline; the set is the truth."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Your time-to-belt dropped sharply this month, which looks like good news. Name two other numbers you would check before believing it, and what each would tell you."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 4"
 },
 {
  "t": "h1",
  "text": "Continuous improvement"
 },
 {
  "t": "p",
  "text": "Finding a problem is not fixing it. Continuous improvement is the disciplined loop that turns a finding into a measured, permanent change."
 },
 {
  "t": "p",
  "text": "The engine of improvement is a simple, rigorous cycle: Plan, Do, Study, Act. It looks obvious, and almost everyone skips the last two steps, they try something and move on without ever checking whether it worked or locking it in. Run the whole loop, every time."
 },
 {
  "t": "p",
  "text": "P"
 },
 {
  "t": "p",
  "text": "Plan Identify one specific problem from your data, form a clear idea of the change, and predict the result. One change, one measurable prediction."
 },
 {
  "t": "p",
  "text": "D"
 },
 {
  "t": "p",
  "text": "Do Make the change on a small, safe scale first. One facility, one cohort, one competency, not the whole network at once."
 },
 {
  "t": "p",
  "text": "S"
 },
 {
  "t": "p",
  "text": "Study Measure what actually happened against your prediction. Did the number move? Did anything break that you did not expect?"
 },
 {
  "t": "p",
  "text": "A"
 },
 {
  "t": "p",
  "text": "Act If it worked, standardize and scale it. If it did not, keep what you learned and run the loop again with a better idea."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "One full improvement cycle Plan: your data shows packaging failures cluster at one facility. You believe adding a hands-on packaging practice session before the gate will fix it, and you predict the packaging pass rate will rise from 60% to 80% in eight weeks. Do: you run it at that one facility only. Study: eight weeks later, the pass rate is 82%, prediction met, and nothing else degraded. Act: you standardize the practice session into that facility's program and consider transferring it to the others. That is the whole loop, and the discipline is that you did not scale it until Study proved it worked."
 },
 {
  "t": "h2",
  "text": "Stakeholder feedback"
 },
 {
  "t": "p",
  "text": "Your data tells you what happened; the people tell you why. Good improvement pairs the numbers with feedback from learners, facilitators, and leadership. A failing metric plus a learner saying “that module never made sense to me” is a far richer signal than either alone. Gather both before you decide what to change."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name the four steps of the improvement cycle and the one thing that happens in each. Then answer: which two steps do people most often skip, and what goes wrong when they do?"
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 4"
 },
 {
  "t": "h1",
  "text": "Contributing to the curriculum"
 },
 {
  "t": "p",
  "text": "The highest form of improvement reaches beyond your facility. When you find a real gap in the framework, you help fix it for everyone."
 },
 {
  "t": "p",
  "text": "As an advanced facilitator, you are close enough to the work to see things the curriculum does not yet address, a competency that keeps causing failures, a new instrument type with no module, a scenario the simulations miss. When you spot a genuine, repeatable gap, your job is not to quietly work around it at your facility. That would be exactly the local drift the whole system fights. Instead, you surface it, with evidence, to the SBD curriculum team."
 },
 {
  "t": "h2",
  "text": "How to surface a gap well"
 },
 {
  "t": "list",
  "items": [
   "Confirm it is real and repeatable, not a one-off. Does the data show this across cohorts, or was it one learner?",
   "Bring evidence, not just opinion. “Inspection failures cluster on this instrument type across three cohorts” beats “I feel like inspection is weak.”",
   "Propose, do not just complain. Suggest the module, the content, or the scenario that would close the gap. A proposal is far more useful than a problem.",
   "Route it to the curriculum team, not into a local fix. The value is that the improvement reaches every facility, not just yours."
  ]
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Never fix a curriculum gap by quietly lowering your bar. When learners keep failing something, the tempting local “fix” is to soften how you assess it. That is not improvement, it is the drift the entire system exists to prevent. If the gap is real, the answer is better content for everyone, surfaced up, never a quieter standard for you. Hold the bar and fix the cause."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Imagine your data shows repeated failures on a competency you think the curriculum handles poorly. Write how you would surface it: the evidence you would gather, the proposal you would make, and why you would route it up rather than fix it locally."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Two activities before the module assessment, both drawn from what Level 2 tests."
 },
 {
  "t": "h2",
  "text": "Activity 1 · Design a program"
 },
 {
  "t": "p",
  "text": "Pick a facility type, trauma center, orthopedic ASC, or academic hospital, and design a twelve-month program for it on the SBD framework. Write your facility assessment, the roadmap and its sequence, and the facility-level outcome you are aiming at. Keep every gate and threshold fixed; design only the path."
 },
 {
  "t": "h2",
  "text": "Activity 2 · Run an improvement cycle"
 },
 {
  "t": "p",
  "text": "Invent a realistic program problem from data (for example, a low pass rate in one competency). Write a full Plan-Do-Study-Act cycle for it: the specific change, the measurable prediction, how you would pilot small, and how you would decide to scale or try again."
 },
 {
  "t": "h1",
  "text": "Module 9 assessment"
 },
 {
  "t": "p",
  "text": "Two applied tasks that mirror the real work of an advanced facilitator. Complete both fully; they combine with the other Level 2 modules toward the certification gates. Score yourself against the guide that follows."
 },
 {
  "t": "h2",
  "text": "Task 1 · Present a twelve-month program design"
 },
 {
  "t": "p",
  "text": "Using your facility from Activity 1, write the full program design as you would present and defend it: the assessment that justifies it, the sequenced roadmap, the facility outcomes it targets, and an explicit statement of what you designed versus what you held fixed from the standard."
 },
 {
  "t": "h2",
  "text": "Task 2 · Implement and report one improvement"
 },
 {
  "t": "p",
  "text": "Using your cycle from Activity 2, write it up as a completed improvement: the problem and its data, the change, the prediction, the measured result, and your decision to scale or iterate. Show the full loop closing, not just the idea."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each task against its marks. Both tasks must reach at least four of five to complete Module 9."
 },
 {
  "t": "checklist",
  "title": "Task 1 · Program design",
  "items": [
   "Starts from a real facility assessment, not a generic template",
   "Builds a sequenced roadmap aligned to the facility's actual goals",
   "Targets facility-level outcomes leadership cares about",
   "Designs the path while holding every gate and threshold fixed",
   "Could be defended to leadership as fit-for-purpose"
  ]
 },
 {
  "t": "checklist",
  "title": "Task 2 · Improvement cycle",
  "items": [
   "Identifies one specific, data-grounded problem",
   "Makes a measurable prediction before acting",
   "Pilots small before scaling",
   "Measures the result honestly against the prediction",
   "Decides to standardize or iterate based on evidence, and never by lowering the bar"
  ]
 },
 {
  "t": "h2",
  "text": "You have completed Module 9"
 },
 {
  "t": "p",
  "text": "Return to the four objectives: design a facility-specific program, analyze effectiveness with data, run improvement cycles, and contribute to the curriculum. If the honest reading of KPIs together, or the discipline of the full PDSA loop, still feels shaky, re-read before Module 10."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "Carry this into Module 10 You can now design a program, measure it, and improve it. Module 10, Organizational Change Management, is the last of Level 2, and it addresses the reality that even a perfect program fails if the organization will not adopt it. You have learned to build the system. Next you learn to get an organization to embrace it, and to make the change stick."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 2 · Module 9 (Module 3 of 4) · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 17,
    "q": "In program design, the one thing you never change is:",
    "options": [
     "A) The sequence",
     "B) The pace",
     "C) The belt gates and thresholds",
     "D) The local scenarios"
    ],
    "answer": "C"
   },
   {
    "n": 18,
    "q": "Program design starts from:",
    "options": [
     "A) The curriculum",
     "B) A facility assessment of needs, state, and goals",
     "C) A generic template",
     "D) Leadership preference"
    ],
    "answer": "B"
   },
   {
    "n": 19,
    "q": "A single KPI, read alone, is:",
    "options": [
     "A) Reliable",
     "B) Misleading; KPIs must be read together",
     "C) All you need",
     "D) Best practice"
    ],
    "answer": "B"
   },
   {
    "n": 20,
    "q": "Fast advancement with a collapsing pass rate means:",
    "options": [
     "A) A strong program",
     "B) People being rushed to assessment before ready",
     "C) Success",
     "D) A data error"
    ],
    "answer": "B"
   },
   {
    "n": 21,
    "q": "The two most-skipped steps of Plan-Do-Study-Act are:",
    "options": [
     "A) Plan and Do",
     "B) Study and Act",
     "C) Do and Study",
     "D) Plan and Act"
    ],
    "answer": "B"
   },
   {
    "n": 22,
    "q": "In an improvement cycle, you scale a change only after:",
    "options": [
     "A) Planning it",
     "B) Study proves it worked on a small pilot",
     "C) Announcing it",
     "D) Leadership approves"
    ],
    "answer": "B"
   },
   {
    "n": 23,
    "q": "A real curriculum gap should be:",
    "options": [
     "A) Fixed locally by lowering your bar",
     "B) Surfaced up with evidence and a proposal",
     "C) Ignored",
     "D) Kept quiet"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P10",
  "seq": 10,
  "level": 2,
  "levelLabel": "Level 2 Advanced",
  "levelPos": "4 of 4",
  "title": "Organizational Change Management",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 2 · ADVANCED FACILITATOR"
 },
 {
  "t": "p",
  "text": "Module 10"
 },
 {
  "t": "p",
  "text": "Level 2 · Module 4 of 4"
 },
 {
  "t": "p",
  "text": "Organizational Change Management"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "The best program in the world fails if the organization will not embrace it. This final Level 2 module is about leading the change, not just designing it."
 },
 {
  "t": "p",
  "text": "Estimated time: 6 hours · Completes the 24-hour Level 2 program · Prerequisite: Level 1 certification"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin"
 },
 {
  "t": "p",
  "text": "This is the last module of Level 2, and it addresses the thing that quietly defeats good programs more than any other: the organization simply does not adopt them. You can design a flawless program, prove it with data, and still watch it die because the people who had to embrace it never did. Change is not announced. It is led."
 },
 {
  "t": "p",
  "text": "As an advanced facilitator, you are often the person introducing SBD into a facility that has done things the same way for decades. That makes you a change leader whether you signed up for it or not. This module gives you the discipline of change: how to roll it out in phases, how to meet resistance without fighting it, how to earn buy-in from three very different audiences, and how to make the change permanent instead of a program everyone quietly abandons once the attention moves on."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Why good programs die. The graveyard of healthcare is full of good programs that failed on adoption, not merit. They were announced in a meeting, launched with enthusiasm, and abandoned within a year because no one led the human side of the change. Your program's quality is necessary but not sufficient. What makes it last is how you bring people through the change, and that is a skill as real as coaching or observation."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end of Module 10:"
 },
 {
  "t": "list",
  "items": [
   "Lead an SBD implementation in a new facility, in phases, not all at once.",
   "Manage resistance by addressing the fear underneath it, not fighting the objection.",
   "Build buy-in with executives, physicians, and staff, each in their own language.",
   "Sustain the change so it becomes how the department works, not a passing initiative."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 4"
 },
 {
  "t": "h1",
  "text": "Leading an implementation"
 },
 {
  "t": "p",
  "text": "You do not flip a switch. You lead a phased rollout that builds proof and belief before it asks for full commitment."
 },
 {
  "t": "h2",
  "text": "Why phased, not all at once"
 },
 {
  "t": "p",
  "text": "The instinct to launch everything on day one is the instinct that kills rollouts. A whole-facility overnight change overwhelms people, magnifies every early problem, and gives skeptics a big target. A phased rollout does the opposite: it starts small, produces a visible win, and lets that win do the persuading. You are not just installing a program; you are building belief, one phase at a time."
 },
 {
  "t": "numlist",
  "items": [
   {
    "n": 1,
    "text": "Assess and prepare Map the stakeholders, read the facility's readiness, and identify where an early win is most achievable. Do not launch into unknown ground."
   }
  ]
 },
 {
  "t": "numlist",
  "items": [
   {
    "n": 2,
    "text": "Pilot small Start with one area, one cohort, or one shift. Contain the risk, work out the friction, and gather real local proof."
   }
  ]
 },
 {
  "t": "numlist",
  "items": [
   {
    "n": 3,
    "text": "Show the win Make the pilot's results visible to everyone. A concrete local result persuades the undecided far better than any pitch."
   }
  ]
 },
 {
  "t": "numlist",
  "items": [
   {
    "n": 4,
    "text": "Expand deliberately Scale from the proven pilot outward, carrying the credibility and the lessons with you. Growth rides on the win, not on mandate."
   }
  ]
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Quick wins buy you the room to do the deep work. Every phased rollout balances two things: the quick win that builds momentum and belief, and the long-term transformation that actually changes the department. You need both, and in that order. The quick win is not the goal; it is what earns you the credibility and patience to pursue the real, slower change underneath. Skip the quick win and you run out of goodwill before the transformation lands."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name the four phases of a rollout in order, and one thing that happens in each. Then explain, in one sentence, why a quick win matters even though it is not the real goal."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 4"
 },
 {
  "t": "h1",
  "text": "Managing resistance"
 },
 {
  "t": "p",
  "text": "Resistance is not the enemy. It is information about a fear you have not yet addressed. Fight the objection and you lose; address the fear and you often win the person."
 },
 {
  "t": "h2",
  "text": "What resistance really is"
 },
 {
  "t": "p",
  "text": "When people resist a change, they are almost never arguing about the thing they name. Underneath “this is a waste of time” is usually a fear: of being exposed as not good enough, of losing status, of extra work with no benefit, of a past change that burned them. If you argue the surface objection, you are fighting the wrong battle. Name and address the fear, and the objection often dissolves on its own."
 },
 {
  "t": "h2",
  "text": "The common objections, and what is under them"
 },
 {
  "t": "p",
  "text": "A veteran tech: “I've done this for twenty years. I don't need a belt to prove I'm good.” You: You don't have anything to prove to me. The belt isn't a test of you, it's how we make what you already know the standard everyone else is held to. I need your experience setting that bar, not sitting outside it."
 },
 {
  "t": "p",
  "text": "A skeptical manager: “We've tried training programs before. They never stick.” You: You're right to be skeptical, most don't, because no one leads the adoption. That's exactly what I'm here to do differently. Let me prove it small first, one area, and you judge it on the result, not the promise."
 },
 {
  "t": "p",
  "text": "An anxious staff member: “What if I go through all this and still fail?” You: Then we learn exactly what to work on, and we go again, no penalty. This system is built to show you where you are and get you where you're going. Failing a gate is information, not a verdict, and I'll be with you the whole way."
 },
 {
  "t": "h2",
  "text": "Build champions, do not just fight saboteurs"
 },
 {
  "t": "p",
  "text": "You will not convert everyone, and you should not spend all your energy on the loudest resister. The better strategy is to build champions, the credible people whose visible support pulls the undecided middle along, while you address the true saboteurs directly and, when necessary, escalate. Most of a department is not for or against; it is watching to see which way the credible people lean. Win them, and the middle follows."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Pick one of the three objections above. Write your own response to it, in your words, that addresses the fear underneath rather than arguing the surface objection."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 4"
 },
 {
  "t": "h1",
  "text": "Building buy-in, in three languages"
 },
 {
  "t": "p",
  "text": "Executives, physicians, and staff care about different things. The same program has to be pitched three different ways, each in the language of the person hearing it."
 },
 {
  "t": "p",
  "text": "A common mistake is to make one case for SBD and repeat it to everyone. It falls flat, because a VP, a surgeon, and a technician do not want the same thing. Master facilitators translate the identical program into three value propositions."
 },
 {
  "t": "h2",
  "text": "To executives: outcomes and cost"
 },
 {
  "t": "p",
  "text": "Leadership thinks in risk, throughput, and dollars. They do not want to hear about belts and modules; they want to hear that competency gaps cause OR delays and turnover, and that this reduces both. Speak efficiency, patient-safety risk, traveler and overtime cost, and survey readiness. Secure executive sponsorship by making the program the answer to a problem they already lose sleep over."
 },
 {
  "t": "h2",
  "text": "To physicians: outcomes and safety"
 },
 {
  "t": "p",
  "text": "Surgeons and proceduralists care about safe, correct, on-time instrumentation and fewer surprises in the OR. Engage them by tying SBD to the thing they feel directly: reliable trays, fewer flashed instruments, fewer delays caused by a competency gap upstream. A physician who connects the program to a smoother OR becomes a powerful ally leadership listens to."
 },
 {
  "t": "h2",
  "text": "To staff: growth and respect"
 },
 {
  "t": "p",
  "text": "Technicians care about their own development, recognition, and a fair path forward. Frame SBD as growth, not surveillance: a clear route to advancement, real skill, and being recognized for competence rather than tenure. Staff who see the program as something done for them, not to them, become its engine instead of its obstacle."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "One program, three pitches To the VP: “This cuts traveler dependency and OR delays by making competency measurable, and gives you an audit-ready record for survey.” To the surgeon: “This means the tray is right and on time, because the people building it are verified competent, not just credentialed.” To the tech: “This is a clear path to advance, real skills, and recognition for what you can actually do, not just how long you've been here.” Same program, three audiences, three languages. That is how buy-in is actually built."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Write the one-sentence pitch for SBD to each of the three audiences, executive, physician, staff, each in the language of what that audience actually cares about."
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 4"
 },
 {
  "t": "h1",
  "text": "Making the change stick"
 },
 {
  "t": "p",
  "text": "Adoption is not the finish line. A change that is not sustained quietly reverts, and often no one notices until it is gone."
 },
 {
  "t": "p",
  "text": "The most dangerous moment for a change is not the launch; it is six months later, when the attention has moved on and the old habits pull people back. Sustaining the change is its own discipline, and it is what separates a lasting transformation from a program people remember fondly as “that thing we did for a while.”"
 },
 {
  "t": "h2",
  "text": "Embed it in daily operations"
 },
 {
  "t": "p",
  "text": "A change survives when it becomes how the work is done, not an extra thing layered on top. That means SBD is woven into the daily rhythm, the hiring process, the advancement decisions, and the way the department talks about competency, until there is no separate “SBD program,” there is just how this department operates. Anything that stays bolted on the side eventually falls off."
 },
 {
  "t": "h2",
  "text": "Celebrate milestones"
 },
 {
  "t": "p",
  "text": "People sustain what feels rewarding. Make advancement visible and celebrated, a belt earned, a facility milestone hit, a team that cut its traveler dependency. Recognition is not fluff; it is what keeps momentum alive after the novelty fades and signals to everyone that this is valued and here to stay."
 },
 {
  "t": "h2",
  "text": "Prevent the silent backslide"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "The standard erodes quietly, one exception at a time. Backsliding rarely announces itself. It is one skipped observation during a busy week, one softened gate to move someone onto the floor, one “we'll do it properly next time.” Each exception feels reasonable, and together they are how a standard dies. Sustaining the change means watching for these small erosions and holding the line on them precisely because they seem minor. The quiet exceptions are the real threat, not the loud resister."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Name one way you would embed SBD into daily operations so it is not a bolt-on, and one small “reasonable” exception you would refuse in order to prevent a silent backslide. Explain why that small exception matters."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Two activities before the module assessment, both drawn from what Level 2 tests."
 },
 {
  "t": "h2",
  "text": "Activity 1 · Build a rollout plan"
 },
 {
  "t": "p",
  "text": "You are introducing SBD to a facility that has trained the same way for twenty years. Write a phased 90-day rollout plan: how you assess and prepare, where you pilot, how you make the win visible, and how you expand, plus the quick win you would target first."
 },
 {
  "t": "h2",
  "text": "Activity 2 · Make the three pitches"
 },
 {
  "t": "p",
  "text": "For that same facility, write your buy-in pitch for each of the three audiences, executive, physician, and staff, each in the language of what that audience actually cares about. Then name the one champion you would most want to recruit and why."
 },
 {
  "t": "h1",
  "text": "Module 10 assessment"
 },
 {
  "t": "p",
  "text": "Two applied tasks that mirror the real work of leading an SBD adoption. Complete both fully; they combine with the other Level 2 modules toward the certification gates. Score yourself against the guide that follows."
 },
 {
  "t": "h2",
  "text": "Task 1 · A complete change and sustainment plan"
 },
 {
  "t": "p",
  "text": "Using your facility from Activity 1, write the full plan: the phased rollout, how you will manage the resistance you expect, and, crucially, how you will sustain the change past six months, embedding it in operations, celebrating milestones, and guarding against the silent backslide."
 },
 {
  "t": "h2",
  "text": "Task 2 · The executive briefing"
 },
 {
  "t": "p",
  "text": "Write a fifteen-minute executive briefing that makes the case for SBD adoption to a VP of Perioperative Services. Frame it entirely in leadership's language, outcomes, risk, cost, survey readiness, and ask clearly for the sponsorship you need."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each task against its marks. Both tasks must reach at least four of five to complete Module 10, and the Level 2 coursework."
 },
 {
  "t": "checklist",
  "title": "Task 1 · Change and sustainment plan",
  "items": [
   "Rolls out in phases with a deliberate early win, not all at once",
   "Manages resistance by addressing the fear, not fighting the objection",
   "Builds champions rather than only battling saboteurs",
   "Embeds the change in daily operations, not as a bolt-on",
   "Guards explicitly against the silent backslide"
  ]
 },
 {
  "t": "checklist",
  "title": "Task 2 · Executive briefing",
  "items": [
   "Speaks leadership's language: outcomes, risk, cost, survey readiness",
   "Ties competency gaps to problems the executive already feels",
   "Avoids belt/module jargon the audience does not care about",
   "Makes a clear, specific ask for sponsorship",
   "Is persuasive and fits the time"
  ]
 },
 {
  "t": "h2",
  "text": "You have completed Module 10, and the Level 2 coursework"
 },
 {
  "t": "p",
  "text": "Return to the four objectives: lead a phased implementation, manage resistance at the level of fear, build buy-in in three languages, and sustain the change past the danger point. With this module done, you have completed all four modules of Level 2. What remains is to earn the Advanced Facilitator credential itself."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "What comes next: the Level 2 gates You earned Level 1 through three gates, and Level 2 is earned the same way, at a higher bar: Gate 1, Knowledge: a comprehensive exam plus a case-study analysis, at 90%. Gate 2, Simulation: a full-day multi-facility simulation, managing several facilities for a simulated week, at 85%. Gate 3, Observation and capstone: conduct a Blue Belt observation, coach a Level 1 facilitator through an observation, and present and defend a twelve-month program design, at 90%. You have done the Level 2 work: multi-facility operations, advanced leadership, program design, and change management. The gates are where you prove you can lead at that altitude."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 2 · Module 10 (Module 4 of 4) · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 24,
    "q": "Good programs most often fail because of:",
    "options": [
     "A) Poor design",
     "B) Poor adoption, no one leads the human change",
     "C) Cost",
     "D) Bad software"
    ],
    "answer": "B"
   },
   {
    "n": 25,
    "q": "A phased rollout is preferred because it:",
    "options": [
     "A) Is slower",
     "B) Starts small, builds a visible win, and lets the win persuade",
     "C) Avoids piloting",
     "D) Needs no planning"
    ],
    "answer": "B"
   },
   {
    "n": 26,
    "q": "Resistance is best understood as:",
    "options": [
     "A) Defiance to be overcome",
     "B) Information about a fear not yet addressed",
     "C) A reason to stop",
     "D) Insubordination"
    ],
    "answer": "B"
   },
   {
    "n": 27,
    "q": "The same program is pitched to executives in the language of:",
    "options": [
     "A) Belts and modules",
     "B) Outcomes, risk, and cost",
     "C) Personal growth",
     "D) Instrument names"
    ],
    "answer": "B"
   },
   {
    "n": 28,
    "q": "To technicians, SBD is best framed as:",
    "options": [
     "A) Surveillance",
     "B) Growth, advancement, and recognition",
     "C) A mandate",
     "D) A test to survive"
    ],
    "answer": "B"
   },
   {
    "n": 29,
    "q": "The most dangerous moment for a change is:",
    "options": [
     "A) The launch",
     "B) Six months later, when attention moves and old habits pull back",
     "C) The pilot",
     "D) The first win"
    ],
    "answer": "B"
   },
   {
    "n": 30,
    "q": "A silent backslide happens through:",
    "options": [
     "A) A loud rebellion",
     "B) Small reasonable exceptions accumulating",
     "C) A budget cut",
     "D) New hires"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P11",
  "seq": 11,
  "level": 3,
  "levelLabel": "Level 3 Master",
  "levelPos": "1 of 5",
  "title": "Facilitator Training Pedagogy",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 3 · MASTER FACILITATOR"
 },
 {
  "t": "p",
  "text": "Module 11"
 },
 {
  "t": "p",
  "text": "Level 3 · Module 1 of 5"
 },
 {
  "t": "p",
  "text": "Facilitator Training Pedagogy"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "You have developed technicians and led other facilitators. Now you learn to build facilitators from the ground up, and to certify them. This is where the standard becomes self-replicating."
 },
 {
  "t": "p",
  "text": "Estimated time: 8 hours · Part of the 40-hour Level 3 program plus practicum · Prerequisite: Level 2 certification"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Welcome to Level 3"
 },
 {
  "t": "p",
  "text": "Level 3 is the Master Facilitator level, and it is a genuine change in kind, not just degree. Through Levels 1 and 2 you developed people who do the work: technicians, then the facilitators leading them. At Level 3 you develop the people who develop people, and you hold the authority to certify them. You are becoming a source of the standard, not just a keeper of it."
 },
 {
  "t": "p",
  "text": "This first Level 3 module is about pedagogy, the craft of teaching facilitators well. It is not enough to be an excellent facilitator yourself; the skill that makes you a great one is often invisible to you, so intuitive you cannot explain it. Master Facilitators make the invisible teachable. That is the whole job of this module: to help you turn what you do by instinct into something you can deliberately develop in someone else, and then certify."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "The multiplier that ends the chain. Every level so far has been a multiplier: the system multiplies the facilitator, the Level 2 lead multiplies across facilities. Level 3 is the multiplier of multipliers. A Master Facilitator who trains ten facilitators, each carrying twenty learners, touches two hundred technicians they will never personally meet, and every one of those technicians is developed to the standard you taught the facilitator to hold. Get this right and the standard replicates itself. Get it wrong and you replicate your blind spots at scale."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end of Module 11:"
 },
 {
  "t": "list",
  "items": [
   "Apply adult-learning principles to the development of other facilitators.",
   "Design and deliver facilitator training, making your own expertise teachable.",
   "Assess facilitator competency against the standard, not against your personal style.",
   "Conduct a Level 1 Gate 3 certification, holding the authority to pass or fail a candidate."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 4"
 },
 {
  "t": "h1",
  "text": "How facilitators learn"
 },
 {
  "t": "p",
  "text": "You already know adult-learning principles from developing technicians. Developing facilitators uses the same foundation, aimed at a harder target: judgment, not procedure."
 },
 {
  "t": "h2",
  "text": "Why teaching a facilitator is different"
 },
 {
  "t": "p",
  "text": "A technician competency is largely procedural, there is a correct way to clean a lumen, and you can observe whether they did it. A facilitator competency is largely judgment: reading a barrier, choosing a protocol, staying silent in a gate, resisting the halo effect. Judgment cannot be handed over as a procedure. It has to be developed through reasoning, practice, and reflection, which changes how you teach it."
 },
 {
  "t": "list",
  "items": [
   "You teach the why, not just the what. A facilitator who only knows the steps will fail the first situation the steps do not cover. One who understands the reasoning can adapt.",
   "You develop through cases, not rules. Judgment grows by working real situations and examining the reasoning, the way these very workbooks have taught you.",
   "You make reflection part of the work. A facilitator improves by examining their own calls, so you teach them to reflect, not just to act."
  ]
 },
 {
  "t": "h2",
  "text": "The expert's curse"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Your own mastery can make you a worse teacher. The better you are at facilitation, the more of it you do unconsciously, and the harder it is to explain to someone who cannot yet do it. You skip steps in your explanation because they are obvious to you, and the learner falls into the gap. This is the expert's curse, and Master Facilitators fight it deliberately: slow down, surface the invisible steps, and remember what it was like not to know. The goal is not to show how good you are. It is to make someone else good."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name one facilitation skill you do almost without thinking, then try to break it into the steps a brand-new facilitator would need. Notice how many steps you nearly left out. That gap is the expert's curse, and naming it is how you beat it."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 4"
 },
 {
  "t": "h1",
  "text": "Designing and delivering facilitator training"
 },
 {
  "t": "p",
  "text": "Making your expertise teachable is a design problem. You build the path from not-knowing to competent, deliberately, the same way SBD built the path you walked."
 },
 {
  "t": "h2",
  "text": "Design backward from competence"
 },
 {
  "t": "p",
  "text": "Good training design starts at the end: what must this facilitator be able to do, to what standard, and then works backward to the sequence that gets them there. You are not deciding what to talk about; you are deciding what the facilitator must be able to do, and building the shortest sound path to it. This is exactly the logic of the belt curriculum, now applied to developing facilitators."
 },
 {
  "t": "h2",
  "text": "Teach, model, practice, reflect"
 },
 {
  "t": "p",
  "text": "The core delivery pattern for a judgment skill has four moves, and skipping any one leaves the facilitator underdeveloped."
 },
 {
  "t": "list",
  "items": [
   "Teach the concept and the why.",
   "Model it, show them what it looks like done well, because judgment is learned partly by watching it.",
   "Practice it, let them do it in a safe setting where a mistake costs nothing.",
   "Reflect on it, examine the reasoning together, right after, while it is fresh."
  ]
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Teaching a facilitator to catch the real barrier You want a new facilitator to stop treating “I don't have time” at face value. Teach: explain the four hidden barriers and why the stated reason usually is not the real one. Model: let them watch you run a coaching conversation where you gently uncover that “no time” was really fear of failure. Practice: give them a role-played stuck learner and let them try. Reflect: afterward, ask “what did you think the real barrier was, and what tipped you off?” You did not lecture them into the skill. You built it in four moves, and the reflection is where it locked in."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Pick one facilitator skill (coaching by profile, staying silent in a gate, reading a coaching brief). Sketch how you would teach it in the four moves, teach, model, practice, reflect. Write one line for each move."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 4"
 },
 {
  "t": "h1",
  "text": "Assessing facilitator competency"
 },
 {
  "t": "p",
  "text": "To certify a facilitator, you must judge them against the standard, not against yourself. That distinction is the heart of fair certification."
 },
 {
  "t": "h2",
  "text": "The standard, not your style"
 },
 {
  "t": "p",
  "text": "Every strong facilitator develops a personal style, and yours works for you. The danger, when you assess another facilitator, is measuring them against your style instead of against the standard. A facilitator can be excellent and nothing like you. You are not certifying “facilitates the way I do”; you are certifying “meets the defined competencies.” Hold the rubric, not the mirror."
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Do not clone yourself. Certify to the standard. The subtle failure of a Master Facilitator is producing copies of themselves, passing the candidates who remind them of themselves and failing the ones who are different but competent. That narrows the field and bakes your blind spots into everyone you certify. A different, effective style is not a deficiency. Assess what the facilitator achieves against the competencies, not how closely they resemble you."
 },
 {
  "t": "h2",
  "text": "What you are actually assessing"
 },
 {
  "t": "p",
  "text": "Facilitator competency lives in the human read and the judgment calls, so that is what you assess, using the same evidence you would want from any observation."
 },
 {
  "t": "list",
  "items": [
   "Do they find the real barrier, or coach the surface complaint?",
   "Do they match approach to the person, or run one script for everyone?",
   "Do they hold the line in a gate, staying summative, resisting the halo effect?",
   "Do they make sound judgment calls, and can they explain their reasoning when you ask?"
  ]
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Assessing to the standard, not the style You observe a facilitator whose manner is far more reserved than your warm, talkative style. Your instinct says “they are not connecting.” But you watch the results: the learner opened up, the real barrier surfaced, the approach fit the person, the plan was sound. Assessed against the standard, this is a pass, their quiet style achieved every competency. Had you assessed against your style, you would have failed a good facilitator for the crime of not being you. The rubric saved you from your own bias."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name the difference between assessing a facilitator against the standard and against your own style, and name the specific failure mode that happens when a Master Facilitator assesses against style."
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 4"
 },
 {
  "t": "h1",
  "text": "Conducting a Level 1 certification"
 },
 {
  "t": "p",
  "text": "This is the authority Level 3 grants and the responsibility it carries: you can certify a Level 1 facilitator. When you pass someone, you vouch for every learner they will ever develop."
 },
 {
  "t": "p",
  "text": "As a Master Facilitator you conduct the Level 1 Gate 3, the full-day observation that certifies a new facilitator. You already know that gate from the inside, you passed it. Now you run it, and the weight is different. When you certify a facilitator, you are not signing off on one person's competency; you are signing off on everyone they will go on to develop and assess. The chain of trust runs through you."
 },
 {
  "t": "h2",
  "text": "Running the Level 1 Gate 3"
 },
 {
  "t": "p",
  "text": "You apply everything Module 5 taught you about observation, prepared, summative, rubric-scored, immediate feedback, one level up: now the person being observed is themselves an observer, and you are judging whether they can hold the standard for others. The same disciplines carry: no coaching during the summative gate, safety-critical and standard-critical behaviors are automatic considerations, and you score what you see against the rubric."
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "The automatic fails you must never wave through. Certifying a facilitator who coaches through a gate, commits a halo pass, or misses a safety-critical override is worse than certifying a bad technician, because that facilitator will now do it to every learner they certify, and teach them to do it too. These automatic fails are not negotiable at any level, and at the certification level they are the most important line you hold. A soft certification does not risk one patient. It risks all the patients downstream of everyone that facilitator will ever pass."
 },
 {
  "t": "h2",
  "text": "Feedback that develops, even in a fail"
 },
 {
  "t": "p",
  "text": "Whether you pass or fail a candidate, your feedback should develop them, you are a teacher even in the moment of judgment. A well-delivered fail, honest, specific, and paired with a path forward, can make a better facilitator than an easy pass ever would. Use SBI, open with genuine strengths, and make the standard, not your disappointment, the message."
 },
 {
  "t": "p",
  "text": "Delivering a fail that develops. You: Before the result, I want you to know your coaching read was genuinely strong, you found that learner's real barrier fast, and that's the hardest part to teach. Candidate: ...but. You: But during the Gate 3, when they skipped the verification step, you prompted them. That's coaching in a summative gate, and it means the observation didn't measure what it needed to. That's an automatic fail today, not because you're not capable, you clearly are, but because holding that line is the whole job. Here's exactly what we work on before you retest, and I'm confident you'll clear it."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. You must fail a likable, hardworking candidate who coached through a gate. Write your opening, in your own words, that holds the standard firmly while keeping them motivated to come back and pass."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Two activities before the module assessment, both drawn from what Level 3 tests."
 },
 {
  "t": "h2",
  "text": "Activity 1 · Make the invisible teachable"
 },
 {
  "t": "p",
  "text": "Choose a facilitation skill you do well and largely by instinct. Write a short training segment that teaches it to a brand-new facilitator using teach, model, practice, reflect, deliberately surfacing the invisible steps you would normally skip."
 },
 {
  "t": "h2",
  "text": "Activity 2 · Assess to the standard"
 },
 {
  "t": "p",
  "text": "Describe a facilitator whose style is very different from yours but who is competent. Write how you would assess them fairly against the standard, and name the specific bias you would have to guard against in yourself."
 },
 {
  "t": "h1",
  "text": "Module 11 assessment"
 },
 {
  "t": "p",
  "text": "Two applied tasks, mirroring the real work of a Master Facilitator. Complete both fully; they combine with the other Level 3 modules and the practicum toward the certification gates. Score yourself against the guide that follows."
 },
 {
  "t": "h2",
  "text": "Task 1 · Deliver a training segment"
 },
 {
  "t": "p",
  "text": "Using your skill from Activity 1, write out the full training segment as you would deliver it to a new facilitator: the concept and why, how you model it, the practice you set up, and the reflection questions you would ask afterward. Make the invisible steps explicit."
 },
 {
  "t": "h2",
  "text": "Task 2 · Certify a candidate observation"
 },
 {
  "t": "p",
  "text": "Write how you would conduct a Level 1 Gate 3 certification: your preparation, how you hold the summative line, the automatic-fail behaviors you watch for, and how you would deliver a developing fail if the candidate coached through the gate. Include the opening lines of that fail conversation."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each task against its marks. Both tasks must reach at least four of five to complete Module 11."
 },
 {
  "t": "checklist",
  "title": "Task 1 · Training delivery",
  "items": [
   "Uses teach, model, practice, reflect, not just explanation",
   "Surfaces the invisible steps, beating the expert's curse",
   "Teaches the why and the judgment, not only the procedure",
   "Builds in real practice with a safe cost of failure",
   "Includes reflection that locks the learning in"
  ]
 },
 {
  "t": "checklist",
  "title": "Task 2 · Certification",
  "items": [
   "Prepares and runs the Gate 3 as a true summative observation",
   "Assesses against the standard, not against personal style",
   "Correctly treats coaching-through-a-gate and safety misses as automatic fails",
   "Delivers a fail that develops: honest, specific, with a path forward",
   "Holds the standard firmly while keeping the candidate motivated"
  ]
 },
 {
  "t": "h2",
  "text": "You have completed Module 11"
 },
 {
  "t": "p",
  "text": "Return to the four objectives: apply adult-learning principles to facilitators, design and deliver facilitator training, assess to the standard, and conduct a Level 1 certification. If the expert's curse or the standard-versus-style distinction still feels shaky, re-read before Module 12, because at this level your blind spots replicate."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "Carry this into Module 12 You can now develop and certify facilitators. Module 12, Curriculum Development, goes a step further, into building the content itself: the modules, rubrics, and assessments that all facilitators use. You have learned to teach the teachers. Next you learn to build what they teach from."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 3 · Module 11 (Module 1 of 5) · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 1,
    "q": "Teaching a facilitator differs from teaching a technician mainly because you are developing:",
    "options": [
     "A) Faster hands",
     "B) Judgment, not procedure",
     "C) Memorization",
     "D) Compliance"
    ],
    "answer": "B"
   },
   {
    "n": 2,
    "q": "The “expert's curse” is:",
    "options": [
     "A) Knowing too little",
     "B) Your own mastery making you skip the steps a learner needs",
     "C) Teaching too slowly",
     "D) Overpreparing"
    ],
    "answer": "B"
   },
   {
    "n": 3,
    "q": "The core delivery pattern for a judgment skill is:",
    "options": [
     "A) Lecture and test",
     "B) Teach, model, practice, reflect",
     "C) Watch and copy",
     "D) Read and quiz"
    ],
    "answer": "B"
   },
   {
    "n": 4,
    "q": "When assessing another facilitator, you measure them against:",
    "options": [
     "A) Your personal style",
     "B) The defined standard",
     "C) How much they remind you of yourself",
     "D) Their tenure"
    ],
    "answer": "B"
   },
   {
    "n": 5,
    "q": "Certifying a facilitator who coaches through a gate is especially dangerous because:",
    "options": [
     "A) It wastes time",
     "B) They will replicate that error with everyone they certify",
     "C) It looks bad",
     "D) It is against policy only"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P12",
  "seq": 12,
  "level": 3,
  "levelLabel": "Level 3 Master",
  "levelPos": "2 of 5",
  "title": "Curriculum Development",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 3 · MASTER FACILITATOR"
 },
 {
  "t": "p",
  "text": "Module 12"
 },
 {
  "t": "p",
  "text": "Level 3 · Module 2 of 5"
 },
 {
  "t": "p",
  "text": "Curriculum Development"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "You have taught the curriculum and certified the people who teach it. Now you learn to build the curriculum itself: the modules, rubrics, and assessments the whole system depends on."
 },
 {
  "t": "p",
  "text": "Estimated time: 8 hours · Part of the 40-hour Level 3 program · Prerequisite: Level 2 certification"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin"
 },
 {
  "t": "p",
  "text": "In Module 9 you learned to surface a curriculum gap and route it up. This module is what happens when the answer to that gap is “build it.” As a Master Facilitator, you are one of the people trusted to create the actual content the system runs on: new modules where the curriculum has a hole, the rubrics that make observation objective, the practice items that predict readiness, and the learner content that teaches. This is authorship, and it carries the same weight as certification, because what you build will teach and assess people you will never meet."
 },
 {
  "t": "p",
  "text": "Good curriculum is not writing. It is engineering. A module has to reliably produce a competent operator, a rubric has to make two different observers reach the same fair decision, a practice item has to measure the right thing. When any of these is built poorly, the failure is silent and system-wide: every learner who touches it inherits the flaw. So this module is about the discipline of building content that works, not content that merely reads well."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "You are building the standard now, not just holding it. Until this module, your job was to hold a standard someone else defined. Now you help define it. That is a different kind of responsibility: a flaw you build into a rubric or an exam does not affect one learner in one room, it affects every learner assessed with it, at every facility, for as long as it is in use. Build with the seriousness that leverage demands. The content is only as trustworthy as the person who authored it."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end of Module 12:"
 },
 {
  "t": "list",
  "items": [
   "Apply instructional-design principles to sterile processing content.",
   "Create a Foundation module where the curriculum has a genuine gap.",
   "Develop objective rubrics that different observers can apply consistently.",
   "Write valid practice-exam items that measure the right competency."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 4"
 },
 {
  "t": "h1",
  "text": "Instructional design for sterile processing"
 },
 {
  "t": "p",
  "text": "Before you build a single module, you need the discipline that separates content that teaches from content that merely informs."
 },
 {
  "t": "h2",
  "text": "Design backward from the competency"
 },
 {
  "t": "p",
  "text": "You met this idea in Module 11, and it is the foundation of all curriculum work: you start at the end. Define exactly what the learner must be able to do, then build backward to the content and practice that get them there. Never start by writing content and hope a competency emerges. The competency is the specification; the content is what you engineer to meet it."
 },
 {
  "t": "numlist",
  "items": [
   {
    "n": 1,
    "text": "Define the competency State precisely what the learner must be able to DO, in observable terms. “Understands packaging” is not a competency. “Selects the correct packaging method and verifies seal integrity per IFU” is."
   }
  ]
 },
 {
  "t": "numlist",
  "items": [
   {
    "n": 2,
    "text": "Define how it is measured Decide how you will know they have it, the gate, the rubric, the pass condition, before you write any teaching content."
   }
  ]
 },
 {
  "t": "numlist",
  "items": [
   {
    "n": 3,
    "text": "Build the teaching to the measure Now create the content and practice that develop exactly that competency. Anything that does not serve it is cut."
   }
  ]
 },
 {
  "t": "numlist",
  "items": [
   {
    "n": 4,
    "text": "Align it to the whole system Make sure it fits the belt structure, the three-gate model, and the standardized-path discipline. Nothing is built in isolation."
   }
  ]
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Content that does not serve a competency is decoration. The most common curriculum mistake is writing interesting content that does not map to a defined competency, history, tangents, nice-to-know detail. It feels educational and it wastes the learner's time. Every element you build must trace to a competency the learner is being developed toward. If it does not, cut it, however interesting it is. Curriculum is engineered, not decorated."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Rewrite this weak competency into a strong, observable one: “the learner will understand sterilization.” Then name the four design steps in order, and explain why measurement is defined before teaching content is written."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 4"
 },
 {
  "t": "h1",
  "text": "Creating a Foundation module"
 },
 {
  "t": "p",
  "text": "When a real gap calls for new content, you build a module that matches the structure of every other module in the system, so it teaches and assesses to the same standard."
 },
 {
  "t": "h2",
  "text": "A module is a complete unit, not a document"
 },
 {
  "t": "p",
  "text": "A Foundation module is not just written content. It is a complete developmental unit with the same anatomy as every other module: clear competency objectives, teaching content that develops them, practice that builds readiness, and its own three gates, knowledge, simulation, and a facilitator observation. When you build a new module, you build all of it, to the same shape, so it slots into the system seamlessly."
 },
 {
  "t": "list",
  "items": [
   "Objectives. The observable competencies the module produces, defined first.",
   "Teaching content. Written to develop those competencies, in the same self-paced, teach-then-do voice as the rest of the system.",
   "Practice. Knowledge and simulation practice that lets the learner build to the 90% readiness signal.",
   "Three gates. Its own knowledge, simulation, and observation gates, with a rubric for the observation."
  ]
 },
 {
  "t": "h2",
  "text": "Match the system, do not reinvent it"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "A new module must fit, not stand out. The temptation, when you build something new, is to make it your own, a different structure, a different voice, a different assessment style. Resist it. The power of the system is its consistency: a learner moving from module to module should feel one coherent program, not a patchwork of authors. Build your module to match the existing anatomy exactly. Your creativity goes into the content, never into breaking the structure."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Filling a real gap Suppose a new robotic-instrument type has entered the department and there is no module for its specific reprocessing. That is a genuine gap. You build a module: you define the observable competencies (correct disassembly, lumen handling, IFU-specific steps), write the teaching content in the standard voice, build knowledge and simulation practice, and create the three gates with an observation rubric. It looks and behaves exactly like fm-05 or fm-06, because it is built to the same anatomy. The learner never feels the seam. That is a module done right."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Name the four parts every Foundation module must contain. Then explain why a new module should match the existing structure exactly rather than improve on it, even if you think you have a better format."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 4"
 },
 {
  "t": "h1",
  "text": "Developing objective rubrics"
 },
 {
  "t": "p",
  "text": "A rubric is the instrument that makes observation fair. A poorly built rubric quietly reintroduces the subjectivity the whole system exists to remove."
 },
 {
  "t": "h2",
  "text": "The test of a good rubric"
 },
 {
  "t": "p",
  "text": "There is one test for a rubric, and it is demanding: two different trained observers, watching the same performance, must reach the same pass-or-fail decision. If your rubric lets two fair observers disagree, it is not objective, it is opinion in a table. Every criterion has to be specific and observable enough that judgment is constrained to what actually happened, not what the observer felt about it."
 },
 {
  "t": "list",
  "items": [
   "Observable, not interpretive. “Cleans the lumen per IFU” can be seen. “Shows good technique” cannot. Write only what an observer can watch happen.",
   "Binary where safety demands it. Safety-critical items are pass/fail, not graded. Either the contamination event happened or it did not.",
   "Weighted to what matters. Points reflect real importance, and safety-critical items carry the override you built into every rubric: they fail regardless of the total."
  ]
 },
 {
  "t": "h2",
  "text": "Build the fail conditions in deliberately"
 },
 {
  "t": "p",
  "text": "A rubric is not only a scoring sheet; it encodes what can never be acceptable. When you build one, you deliberately define the automatic-fail conditions, the safety-critical behaviors that fail the observation no matter how strong the rest, because you learned in Module 5 that a 95 with a contamination event is a fail, not a 95. Building that override in is one of the most important things you do as an author."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "Turning a vague criterion objective Weak criterion: “Handles instruments safely.” Two observers will score that ten different ways. Rebuilt objective: “Transports sharps in a closed, puncture-resistant container; no unsheathed sharp handled outside a tray; hands never enter a tray blind.” Now it is observable, specific, and two observers watching the same tech will agree. And you flag the sharps items as safety-critical automatic-fails. That rebuild is the core skill of rubric authorship: convert every feeling into something you can see."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. State the one test a good rubric must pass. Then take this weak criterion and rewrite it to be observable and objective: “the learner demonstrates professionalism.”"
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 4"
 },
 {
  "t": "h1",
  "text": "Writing valid practice items"
 },
 {
  "t": "p",
  "text": "Practice exams drive readiness. An item that measures the wrong thing, or measures nothing, corrupts the readiness signal the whole system relies on."
 },
 {
  "t": "p",
  "text": "You learned in Level 1 that the 90% practice threshold is the readiness signal facilitators trust. That trust is only as good as the items behind it. As an author, you write items that actually measure the target competency, cleanly, so that a learner scoring 90% genuinely is ready and a learner scoring 70% genuinely has a gap. A bad item breaks that link, and no facilitator downstream can tell."
 },
 {
  "t": "h2",
  "text": "What makes an item valid"
 },
 {
  "t": "list",
  "items": [
   "It measures the competency, not test-taking. The item tests whether they know the work, not whether they can decode a tricky question. Trickery measures cleverness, not competence.",
   "One clearly correct answer, plausible distractors. The wrong options should be things a genuinely confused learner would pick, so a wrong answer tells you where the gap is.",
   "It maps to a real competency and domain. Every item traces to something the learner is meant to be able to do, so domain-level scoring stays meaningful.",
   "It is unambiguous. A competent learner should never fail an item because it was unclear, that is the item failing, not the learner."
  ]
 },
 {
  "t": "h2",
  "text": "Validate before you trust"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "An untested item is a liability, not an asset. A newly written item is a hypothesis, not a proven measure. Before it counts toward readiness, it should be reviewed and, ideally, checked against real results: do competent learners pass it and struggling ones miss it? An item that everyone gets right measures nothing; an item that even strong learners fail is probably broken. Validation is what separates a real assessment from a quiz you made up. Never let an unvalidated item silently gate someone's readiness."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "A broken item and its fix Broken: a question with two defensibly correct answers, or a “gotcha” that hinges on misreading the wording. Competent learners miss it, and the facilitator wrongly reads that as a knowledge gap. Fixed: one unambiguous correct answer, distractors that represent real misconceptions, wording a competent learner reads correctly the first time. Now a miss means a genuine gap, and the readiness signal stays trustworthy. You protected every facilitator who will ever rely on that score."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Name two things that make a practice item valid and one thing that makes it broken. Then explain why an unvalidated item is dangerous to the whole system, not just to one learner."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Two activities before the module assessment, both drawn from the authoring work of a Master Facilitator."
 },
 {
  "t": "h2",
  "text": "Activity 1 · Draft a module outline"
 },
 {
  "t": "p",
  "text": "Pick a genuine curriculum gap, real or invented. Draft the outline of a Foundation module to fill it: the observable competency objectives, a sketch of the teaching content, the practice, and the three gates with the focus of the observation rubric. Match the existing module anatomy."
 },
 {
  "t": "h2",
  "text": "Activity 2 · Build a rubric and two items"
 },
 {
  "t": "p",
  "text": "For that module, write three observable rubric criteria (at least one safety-critical automatic-fail), and two valid practice-exam items with one clearly correct answer and plausible distractors each. Then note how you would validate the items before trusting them."
 },
 {
  "t": "h1",
  "text": "Module 12 assessment"
 },
 {
  "t": "p",
  "text": "The Level 3 assessment for this module is a produced artifact: you create a real curriculum component that meets SBD standards on review. Complete both tasks fully; they combine with the other Level 3 modules toward the certification gates. Score yourself against the guide that follows."
 },
 {
  "t": "h2",
  "text": "Task 1 · Produce a module component"
 },
 {
  "t": "p",
  "text": "Develop one complete, usable piece of curriculum: either a full module outline with objectives, content sketch, practice, and gates, or a complete observation rubric for an existing competency. Build it to the exact anatomy and voice of the existing system, so it could slot in without a seam."
 },
 {
  "t": "h2",
  "text": "Task 2 · Write and validate practice items"
 },
 {
  "t": "p",
  "text": "Write four practice-exam items for a competency of your choice, each mapped to a domain, each with one clearly correct answer and plausible distractors. Then write your validation plan: how you would confirm these items measure the competency before letting them gate readiness."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each task against its marks. Both tasks must reach at least four of five to complete Module 12."
 },
 {
  "t": "checklist",
  "title": "Task 1 · Curriculum component",
  "items": [
   "Designed backward from observable competencies",
   "Matches the existing module or rubric anatomy exactly",
   "Rubric criteria are observable, not interpretive",
   "Safety-critical automatic-fail conditions are built in",
   "Could slot into the system without a seam"
  ]
 },
 {
  "t": "checklist",
  "title": "Task 2 · Practice items",
  "items": [
   "Each item measures the competency, not test-taking cleverness",
   "One clearly correct answer, plausible distractors",
   "Each maps to a real competency and domain",
   "Wording is unambiguous to a competent learner",
   "Includes a real plan to validate before trusting the items"
  ]
 },
 {
  "t": "h2",
  "text": "You have completed Module 12"
 },
 {
  "t": "p",
  "text": "Return to the four objectives: apply instructional design, create a module to fill a real gap, build objective rubrics, and write valid practice items. If the rubric objectivity test, or the discipline of validating items before trusting them, still feels shaky, re-read before Module 13."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "Carry this into Module 13 You can now build the content the system runs on. Module 13, SBD System Administration, turns from authoring curriculum to administering the platform that delivers it, roles, facilities, data integrity, and reporting at the system level. You have learned to build what the system teaches. Next you learn to run the system itself."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 3 · Module 12 (Module 2 of 5) · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 6,
    "q": "Sound curriculum design begins from:",
    "options": [
     "A) What is easy to write",
     "B) The competency the learner must reach, designed backward",
     "C) The trainer's preference",
     "D) Existing slides"
    ],
    "answer": "B"
   },
   {
    "n": 7,
    "q": "When you develop new curriculum content, the belt gates and thresholds are:",
    "options": [
     "A) Adjusted to fit the content",
     "B) Held fixed; you build around them",
     "C) Optional",
     "D) Set by each author"
    ],
    "answer": "B"
   },
   {
    "n": 8,
    "q": "A good assessment item measures:",
    "options": [
     "A) Recall of trivia",
     "B) The actual competency, at the right level",
     "C) Reading speed",
     "D) Confidence"
    ],
    "answer": "B"
   },
   {
    "n": 9,
    "q": "New curriculum should be validated by:",
    "options": [
     "A) One author's judgment",
     "B) Evidence that it produces the intended competency",
     "C) Popularity",
     "D) Length"
    ],
    "answer": "B"
   },
   {
    "n": 10,
    "q": "Contributing content to the SBD curriculum is how you:",
    "options": [
     "A) Bypass the standard",
     "B) Improve the system for every facility, not just yours",
     "C) Lower the bar locally",
     "D) Avoid review"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P13",
  "seq": 13,
  "level": 3,
  "levelLabel": "Level 3 Master",
  "levelPos": "3 of 5",
  "title": "SBD System Administration",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 3 · MASTER FACILITATOR"
 },
 {
  "t": "p",
  "text": "Module 13"
 },
 {
  "t": "p",
  "text": "Level 3 · Module 3 of 5"
 },
 {
  "t": "p",
  "text": "SBD System Administration"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "A Master Facilitator does not just use the system, they steward it. This module is about the quiet, unglamorous discipline that keeps the data trustworthy for everyone who depends on it."
 },
 {
  "t": "p",
  "text": "Estimated time: 8 hours · Part of the 40-hour Level 3 program plus practicum · Prerequisite: Level 2 certification"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin"
 },
 {
  "t": "p",
  "text": "Every decision in SBD rests on data. Placement decides where a learner starts, practice scores predict readiness, David OG flags who needs help, and gates certify competency, and all of it is only as trustworthy as the system underneath. This module is about being the person responsible for that trust. As a Master Facilitator you administer SBD OS itself: who has access, how facilities are configured, whether the data stays clean, and how information flows to the people who make decisions with it."
 },
 {
  "t": "p",
  "text": "This is the least glamorous module in Level 3 and, in a quiet way, one of the most important. A single misconfigured permission, a duplicated record, or a sloppy data entry does not announce itself, but it can corrupt the very evidence the whole system depends on. Administration is not busywork. It is the maintenance of trust."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "The data is a chain of custody. Think of SBD data the way you think of an instrument's journey: a chain of custody, where every link has to hold. When you certify a learner, that record must be accurate, attributable, and intact, because a surveyor may rely on it, leadership may staff to it, and a patient's safety may ultimately trace back to it. Good administration is what keeps that chain unbroken. Sloppy administration breaks links no one notices until they need them."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end of Module 13:"
 },
 {
  "t": "list",
  "items": [
   "Administer SBD OS at an advanced level, confidently and correctly.",
   "Manage roles, permissions, and facilities, giving each person exactly the access they should have.",
   "Protect data integrity through disciplined quality assurance.",
   "Configure reporting and exports that get the right information to the right people."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 4"
 },
 {
  "t": "h1",
  "text": "Roles, permissions, and access"
 },
 {
  "t": "p",
  "text": "Who can see and do what is the foundation of a trustworthy system. Get access right and everything downstream is safer."
 },
 {
  "t": "h2",
  "text": "The principle of least privilege"
 },
 {
  "t": "p",
  "text": "The governing rule of access is simple: each person gets exactly the access their role requires, and no more. A learner sees their own progress. A facilitator manages their caseload. A Master Facilitator administers the system. Giving someone more access than they need is not a convenience; it is a risk, more hands that can accidentally alter a record, more ways for the data to drift. Least privilege is not distrust. It is protection, for the data and for the person, who cannot break what they cannot reach."
 },
 {
  "t": "list",
  "items": [
   "Learner. Sees their own placement, practice, and progress. Nothing about anyone else.",
   "Facilitator. Manages their own learners: assigns modules, records observations, reads their caseload's data.",
   "Advanced facilitator. Sees across facilities they lead; manages local champions and network reporting.",
   "Master facilitator / administrator. Configures the system, manages roles and facilities, and safeguards data integrity."
  ]
 },
 {
  "t": "h2",
  "text": "Granting and removing access"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Offboarding is where systems quietly rot. Granting access gets attention because someone is waiting on it. Removing access when a person changes roles or leaves is the step everyone forgets, and it is how a system accumulates orphaned accounts with live permissions, a real integrity and security risk. When someone's role changes, their access changes the same day. Treat removing access as seriously as granting it, because the access no one remembers is the one that causes the problem."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. State the principle of least privilege in one sentence, and explain why it protects the person who holds the lower access, not just the data. Then name the access step most often forgotten, and what goes wrong when it is."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 4"
 },
 {
  "t": "h1",
  "text": "Facility configuration"
 },
 {
  "t": "p",
  "text": "Configuration is where the standardized system meets a specific place. Set it up correctly and the facility runs on the standard; set it up carelessly and you have built drift into the foundation."
 },
 {
  "t": "h2",
  "text": "What you configure, and what you never touch"
 },
 {
  "t": "p",
  "text": "When you set up a facility in SBD OS, you configure the things that are legitimately local: its name and structure, its users and their roles, its champions, its reporting relationships, and the facility-specific program path you learned to design in Module 9. What you never configure, because it is not configurable, is the standard itself: the belts, the gates, the thresholds. The system is built so the local settings cannot reach the standard, and that is by design."
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Never let a configuration choice become a lowered standard. Every technique in this program eventually returns to the same line, and administration is no exception. A facility configuration expresses local structure and local path. It must never be used to quietly soften a gate or lower a threshold for one site. If a configuration option ever appears to let you do that, that is the moment to stop, the standard is fixed for a reason, and administration exists to protect it, not to provide a back door around it."
 },
 {
  "t": "h2",
  "text": "Configure for clarity"
 },
 {
  "t": "p",
  "text": "A well-configured facility is one where the structure in the system matches the structure on the ground: the right people in the right roles, the reporting lines drawn correctly, the champions designated. When the configuration mirrors reality, the data flows correctly and the reports mean what they say. When it drifts from reality, someone left in a role they no longer hold, a reporting line that no longer exists, the data slowly stops matching the world, and every decision built on it inherits the error."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Name three things you legitimately configure for a facility and one thing you must never touch. Then explain what goes wrong when a facility's configuration drifts from the reality on the ground."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 4"
 },
 {
  "t": "h1",
  "text": "Protecting data integrity"
 },
 {
  "t": "p",
  "text": "This is the core of the module. Everything the system produces is only as good as the data feeding it, and protecting that data is a discipline you run on purpose."
 },
 {
  "t": "h2",
  "text": "What clean data requires"
 },
 {
  "t": "p",
  "text": "Data integrity means the records are accurate, complete, attributable, and timely. Each of those is a habit, not an accident."
 },
 {
  "t": "list",
  "items": [
   "Accurate. Records reflect what actually happened. An observation scored 82 says 82, not “about an 80.”",
   "Complete. Nothing critical is missing. A gate result without its documentation is half a record.",
   "Attributable. Every record ties to who did it and when. Anonymous data cannot be trusted or defended.",
   "Timely. Entered at the time of the work, not reconstructed later from memory, which you learned in Module 5 is not evidence."
  ]
 },
 {
  "t": "h2",
  "text": "The quiet threats"
 },
 {
  "t": "p",
  "text": "Integrity is rarely broken by one dramatic event. It erodes through small, ordinary problems: a duplicated learner record so progress splits across two files, a delayed entry reconstructed inaccurately, a copy-paste that carries the wrong learner's data, an observation logged to the wrong person. None of these look alarming in the moment. All of them corrupt the evidence. The administrator's job is to catch them, through periodic review, before they compound."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "How a small error becomes a big problem A learner exists twice in the system, once under a slightly misspelled name, from a rushed setup. Their practice attempts and one gate go to file A; a later observation goes to file B. Now neither record is complete. David reads file A and thinks the learner is behind; a report to leadership undercounts the facility's advancement; and if a surveyor pulls the record, the documentation looks incomplete. One duplicated record, created in ten careless seconds, quietly poisoned the data, the intelligence, the reporting, and the compliance evidence. Catching it early is a periodic-review habit; catching it late is a crisis."
 },
 {
  "t": "h2",
  "text": "Quality assurance as a routine"
 },
 {
  "t": "p",
  "text": "Because these errors are quiet, you cannot wait for them to surface, you go looking. A Master Facilitator runs periodic data-integrity checks: scanning for duplicates, spotting incomplete records, confirming entries are timely and attributable, and reconciling the system against reality. This is the same quality-assurance discipline you applied to champions in Level 2, now aimed at the data itself. Routine review is what keeps a small error small."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name the four qualities of clean data. Then describe one quiet threat to integrity and how a routine quality-assurance check would catch it before it compounds."
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 4"
 },
 {
  "t": "h1",
  "text": "Reporting, exports, and troubleshooting"
 },
 {
  "t": "p",
  "text": "The final administrative skill is getting the right information to the right people, cleanly, and knowing what to do when something breaks."
 },
 {
  "t": "h2",
  "text": "Configure reporting for the audience"
 },
 {
  "t": "p",
  "text": "You learned in earlier modules that different audiences need different framing. Administration is where you make that repeatable: configuring the reports and dashboards each role sees so the right information reaches the right person without manual effort. A facilitator's dashboard surfaces their caseload; an advanced facilitator's shows the network; leadership's shows outcomes. Good reporting configuration means people get what they need to decide well, and are not buried in what they do not."
 },
 {
  "t": "h2",
  "text": "Exports and their responsibility"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Exported data leaves the system's protection. When you export data, to a spreadsheet, a report, a survey binder, it leaves the controlled environment and its safeguards. That is sometimes necessary, but it carries responsibility: exported data can become stale, can be altered, and can contain information that must be handled carefully. Export only what is needed, know where it goes, and remember that the clean chain of custody you protect inside the system does not automatically follow the data out of it."
 },
 {
  "t": "h2",
  "text": "Troubleshooting the common problems"
 },
 {
  "t": "p",
  "text": "Most administrative problems are ordinary and fixable once you recognize them. The skill is diagnosing calmly rather than reacting."
 },
 {
  "t": "list",
  "items": [
   "“A learner can't see their content.” Usually a role or assignment issue. Check their access and what is assigned before assuming a system fault.",
   "“The report numbers look wrong.” Often a data-integrity issue underneath, a duplicate or a misattributed record. Trace the data before blaming the report.",
   "“Someone has access they shouldn't.” An offboarding miss. Correct it immediately, then check for others like it."
  ]
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. A leadership report shows a facility advancing far fewer learners than the facilitator insists is true. Walk through how you would troubleshoot it as an administrator, and name the data-integrity problem you would suspect first."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Two activities before the module assessment, both drawn from what Level 3 tests."
 },
 {
  "t": "h2",
  "text": "Activity 1 · Set up a facility correctly"
 },
 {
  "t": "p",
  "text": "You are configuring a new facility in SBD OS. Write your setup plan: the roles and access you assign and to whom, applying least privilege; the local things you configure; and the one line you will not cross. Note how you will keep the configuration matching reality over time."
 },
 {
  "t": "h2",
  "text": "Activity 2 · Run a data-integrity check"
 },
 {
  "t": "p",
  "text": "Design a routine data-integrity check you would run monthly across your facilities. Write what you scan for, how you would catch a duplicate or an incomplete or misattributed record, and what you do when you find one."
 },
 {
  "t": "h1",
  "text": "Module 13 assessment"
 },
 {
  "t": "p",
  "text": "Two applied tasks that mirror the administrative work of a Master Facilitator. Complete both fully; they combine with the other Level 3 modules and the practicum toward the certification gates. Score yourself against the guide that follows."
 },
 {
  "t": "h2",
  "text": "Task 1 · A facility administration plan"
 },
 {
  "t": "p",
  "text": "Write a complete administration plan for a facility: the role-and-access design under least privilege, the legitimate configuration, the offboarding discipline, and an explicit statement of what you will never configure. Show that your setup protects the standard and the data at once."
 },
 {
  "t": "h2",
  "text": "Task 2 · A data-integrity and troubleshooting protocol"
 },
 {
  "t": "p",
  "text": "Write the data-integrity routine you would run and a troubleshooting protocol for the three common problems (access, wrong-looking reports, improper access). For each, show how you diagnose calmly and trace the data before reacting."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each task against its marks. Both tasks must reach at least four of five to complete Module 13."
 },
 {
  "t": "checklist",
  "title": "Task 1 · Administration plan",
  "items": [
   "Applies least privilege: each role gets exactly the access it needs",
   "Configures only legitimately local things",
   "Includes same-day offboarding discipline",
   "States clearly what must never be configured (the standard)",
   "Keeps configuration matched to reality over time"
  ]
 },
 {
  "t": "checklist",
  "title": "Task 2 · Integrity and troubleshooting",
  "items": [
   "Protects all four qualities: accurate, complete, attributable, timely",
   "Runs routine checks rather than waiting for errors to surface",
   "Catches the quiet threats: duplicates, gaps, misattribution",
   "Troubleshoots by tracing the data, not reacting",
   "Treats exported data as leaving the system's protection"
  ]
 },
 {
  "t": "h2",
  "text": "You have completed Module 13"
 },
 {
  "t": "p",
  "text": "Return to the four objectives: administer SBD OS, manage roles and facilities, protect data integrity, and configure reporting and exports. If least privilege or the routine of data-integrity checks still feels shaky, re-read before Module 14, because the trustworthiness of everything the system produces depends on this quiet work."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "Carry this into Module 14 You can now steward the system the standard runs on. Module 14, Strategic Leadership and Program Scaling, lifts to the widest view yet: building programs across a whole health system, advising leadership, and modeling outcomes at scale. You have secured the foundation. Next you learn to build on it at the enterprise level."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 3 · Module 13 (Module 3 of 5) · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 11,
    "q": "The principle of least privilege means:",
    "options": [
     "A) Everyone gets full access",
     "B) Each person gets exactly the access their role requires",
     "C) Access is never removed",
     "D) Only you have access"
    ],
    "answer": "B"
   },
   {
    "n": 12,
    "q": "The most-forgotten access step is:",
    "options": [
     "A) Granting access",
     "B) Removing access when a role changes or a person leaves",
     "C) Logging in",
     "D) Setting a password"
    ],
    "answer": "B"
   },
   {
    "n": 13,
    "q": "Facility configuration may set local structure but must never:",
    "options": [
     "A) Name the facility",
     "B) Assign roles",
     "C) Lower a gate or threshold",
     "D) Designate champions"
    ],
    "answer": "C"
   },
   {
    "n": 14,
    "q": "Clean data must be accurate, complete, timely, and:",
    "options": [
     "A) Colorful",
     "B) Attributable",
     "C) Compressed",
     "D) Hidden"
    ],
    "answer": "B"
   },
   {
    "n": 15,
    "q": "A duplicate learner record is dangerous because it:",
    "options": [
     "A) Uses storage",
     "B) Splits a learner's data so no record is complete",
     "C) Looks untidy",
     "D) Slows logins"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P14",
  "seq": 14,
  "level": 3,
  "levelLabel": "Level 3 Master",
  "levelPos": "4 of 5",
  "title": "Strategic Leadership and Program Scaling",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 3 · MASTER FACILITATOR"
 },
 {
  "t": "p",
  "text": "Module 14"
 },
 {
  "t": "p",
  "text": "Level 3 · Module 4 of 5"
 },
 {
  "t": "p",
  "text": "Strategic Leadership and Program Scaling"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "You have mastered the department, the network, and the system. This module lifts to the widest view: building competency across a whole health system, and advising the leaders who fund and shape it."
 },
 {
  "t": "p",
  "text": "Estimated time: 8 hours · Part of the 40-hour Level 3 program plus practicum · Prerequisite: Level 2 certification"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin"
 },
 {
  "t": "p",
  "text": "This is the widest-angle module in the entire program. Everything before it has been about developing people and holding a standard, one learner, one department, one network at a time. Here you learn to think at the scale of a health system: multiple hospitals, surgery centers, and clinics under one strategy, and to sit across the table from the executives who decide whether SBD lives or dies at that scale."
 },
 {
  "t": "p",
  "text": "The skills that made you excellent at the floor level do not automatically translate up here. An executive does not care how you coach a Steward or run a Gate 3. They care about system-wide risk, cost, throughput, and outcomes. To lead and scale at this altitude, you have to translate everything you know into the language of strategy, and build programs that hold the standard across dozens of facilities you will never personally set foot in."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "The standard has to survive scale, or scale is worthless. The temptation at enterprise scale is to trade rigor for reach, to loosen the standard so the program spreads faster and looks impressive on a slide. That is the failure mode this whole program has warned against, now at its most dangerous, because at system scale a lowered standard harms the most patients. Real strategic leadership is scaling the standard intact, not scaling a diluted version of it. Reach without rigor is not an achievement. It is a liability with a bigger footprint."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end of Module 14:"
 },
 {
  "t": "list",
  "items": [
   "Build programs at system scale, across many facilities under one coherent strategy.",
   "Advise health-system leadership on competency strategy, in their language.",
   "Model outcomes that connect competency to the results leadership cares about.",
   "Mentor Master Facilitator candidates, extending your reach through other leaders."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 4"
 },
 {
  "t": "h1",
  "text": "Building programs at system scale"
 },
 {
  "t": "p",
  "text": "A health system is not one big department. It is many different facilities under one strategy, and program design at this level is about coherence without uniformity."
 },
 {
  "t": "h2",
  "text": "One strategy, many facilities"
 },
 {
  "t": "p",
  "text": "At Level 2 you designed a program for a facility. At Level 3 you design a strategy for a system: a trauma center, three community hospitals, a handful of surgery centers, each with different needs, all developing competency to the same standard under one coherent plan. The art is coherence without forced uniformity, every facility runs the same standard and reports into the same picture, but each gets a program path fit to its own reality."
 },
 {
  "t": "list",
  "items": [
   "Common standard, local paths. The belts, gates, and thresholds are identical everywhere. The roadmaps are tailored per facility, exactly the Module 9 principle, scaled up.",
   "A shared intelligence picture. David rolls every facility into one system-wide view so leadership sees the whole, not a stack of disconnected reports.",
   "A network of Master and Advanced Facilitators. You cannot run a system alone; you build and rely on a layered structure of certified leaders, each holding the standard in their domain."
  ]
 },
 {
  "t": "h2",
  "text": "Sequencing a system rollout"
 },
 {
  "t": "p",
  "text": "You do not launch a whole system at once, for the same reason you do not launch a whole facility at once, magnified. You sequence it: prove the model at a flagship facility, build a visible system-level win, then expand along the lines of readiness and need. The phased-rollout discipline from Module 10 is now applied across an enterprise, where the early win has to be large enough for executives to see and believe."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Explain “coherence without uniformity” for a health system: what is identical across every facility, and what is tailored to each? Then describe how you would sequence a system-wide rollout rather than launching everywhere at once."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 4"
 },
 {
  "t": "h1",
  "text": "Advising health-system leadership"
 },
 {
  "t": "p",
  "text": "At this level you are not asking permission, you are advising. That is a different posture, and it requires speaking entirely in the executive's terms."
 },
 {
  "t": "h2",
  "text": "From asking to advising"
 },
 {
  "t": "p",
  "text": "Early in your development you made the case for SBD to leadership, hoping for a yes. As a Master Facilitator you become an advisor: the person leadership turns to for a strategy on competency, workforce risk, and survey readiness across the system. That shift changes how you speak. An advisor does not pitch; they diagnose the organization's problem and prescribe, in the language of the person who owns the problem."
 },
 {
  "t": "h2",
  "text": "Speak strategy, not operations"
 },
 {
  "t": "p",
  "text": "The single most common failure of a technically brilliant facilitator in front of executives is talking operations to people who think in strategy. Belts, modules, and rubrics are your world, not theirs. Translate every one of them into the executive's world: workforce risk, cost of turnover and travelers, OR throughput, patient-safety exposure, survey and accreditation readiness, and the competitive position of the system."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "The same fact, translated up Operational fact: “74% of assessed staff placed at White Belt.” That means nothing to a C-suite. Translated for the executive: “Three-quarters of your certified staff are performing at entry level when measured objectively, which is your real source of OR delays, traveler dependency, and survey exposure, and it is fixable with a measurable program.” Same fact, but now it names a problem the executive already feels and owns, and points at a solution. That translation is the core skill of advising leadership."
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Do not let them buy reach and skip rigor. Executives under pressure may want the fastest, cheapest version, the logo on every facility without the hard work that makes it real. Part of advising well is protecting them from a decision that looks good this quarter and fails at survey next year. You are the person in the room who knows that a diluted standard is a false economy. Advise them toward the version that actually works, even when a weaker version is easier to sell."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Take one operational fact from SBD (a belt result, a gate, a scalability number) and translate it into a single sentence an executive would care about, naming a problem they already feel. Then write the one-sentence strategic recommendation you would attach to it."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 4"
 },
 {
  "t": "h1",
  "text": "Modeling outcomes"
 },
 {
  "t": "p",
  "text": "Strategy is believed when it is quantified. Outcome modeling connects the competency work to the numbers leadership tracks, credibly and honestly."
 },
 {
  "t": "h2",
  "text": "Connect competency to the numbers that matter"
 },
 {
  "t": "p",
  "text": "Leadership funds what moves their metrics. Your job is to build the honest causal chain from competency to those metrics: verified competency reduces errors and rework, which reduces OR delays and instrument damage, which reduces cost and risk; a developed internal workforce reduces traveler and overtime dependency; documented competency improves survey readiness. When you can show that chain with real numbers from your own program, competency stops being a training expense and becomes a strategic investment."
 },
 {
  "t": "h2",
  "text": "Model honestly"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "A model that overpromises destroys your credibility permanently. It is tempting to build an outcome model with heroic assumptions that produce a stunning number. Do not. The first time a promised result fails to materialize, every future recommendation you make is discounted. Model conservatively, state your assumptions plainly, and let a credible, defensible projection do the work. An advisor's greatest asset is being believed, and that is built by being right, not by being impressive. Under-promise in the model, and let the program over-deliver."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "A credible outcome model Rather than “this will save millions,” you build it up honestly: “At our pilot facility, developing staff to verified competency cut traveler dependency from 100% to 2%, a documented $1.5M annualized reduction. Applying that conservatively across the three highest-dependency facilities in the system, with a discount for their differences, projects a defensible multi-year saving, and I can show you every assumption behind it.” That is believed, because it starts from a real result and scales it carefully, rather than starting from the number you wish were true."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Describe the causal chain from verified competency to a cost or risk metric leadership tracks. Then explain why modeling conservatively protects you more than an impressive projection does."
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 4"
 },
 {
  "t": "h1",
  "text": "Mentoring Master Facilitator candidates"
 },
 {
  "t": "p",
  "text": "The final extension of your reach. You cannot lead a whole system alone, so you develop other Master Facilitators, the rarest and highest development work in the program."
 },
 {
  "t": "p",
  "text": "A single Master Facilitator can only be in so many rooms. To hold the standard across a system, you develop other Master Facilitators, people who will themselves train, certify, and advise. This is the top of the development pyramid, and it is different from everything below it: you are not developing a skill or even a judgment, you are developing another source of the standard. The person you mentor will one day certify facilitators without you in the room, and everything they carry, they carry from you."
 },
 {
  "t": "h2",
  "text": "What a Master candidate needs from you"
 },
 {
  "t": "list",
  "items": [
   "The strategic translation. Help them make the leap from operations to strategy, the leap most facilitators never make, because it is the hardest and least natural.",
   "Honest feedback at a level they rarely get it. A near-Master is often the most capable person in their building; like the high belts in Module 8, they are starved for real critique. Give it.",
   "Room to develop their own voice. Do not clone yourself, the same trap as certification, one tier up. A different but excellent Master extends the standard's reach; a copy of you narrows it."
  ]
 },
 {
  "t": "h2",
  "text": "The weight you are handing over"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "You are certifying a source of the standard. When you help make another Master Facilitator, you are vouching that this person can hold and transmit the standard without supervision, across facilities, into other facilitators, for years. That is the heaviest sign-off in the program. Mentor toward it seriously: a Master who bends the standard does not risk one department, they replicate the bend through everyone they will ever certify. Develop their judgment and their spine, not just their skill."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Name the one leap a Master Facilitator candidate most needs help making, and why it is the hardest. Then explain why “don't clone yourself” matters even more at the Master level than at Level 1 certification."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Two activities before the module assessment, both drawn from what Level 3 tests."
 },
 {
  "t": "h2",
  "text": "Activity 1 · Advise the executive"
 },
 {
  "t": "p",
  "text": "You have fifteen minutes with a health-system CNO or COO. Write your advisory brief: the competency problem in their language, the strategic recommendation, and a conservative outcome model with its assumptions stated. Translate every operational fact into strategic terms."
 },
 {
  "t": "h2",
  "text": "Activity 2 · Design a system-scale strategy"
 },
 {
  "t": "p",
  "text": "Sketch a competency strategy for a five-facility health system: what is common across all five, what is tailored per facility, how you sequence the rollout, and the leadership structure of Master and Advanced Facilitators you would build to hold the standard."
 },
 {
  "t": "h1",
  "text": "Module 14 assessment"
 },
 {
  "t": "p",
  "text": "Two applied tasks that mirror the strategic work of a Master Facilitator. Complete both fully; they combine with the other Level 3 modules and the practicum toward the certification gates. Score yourself against the guide that follows."
 },
 {
  "t": "h2",
  "text": "Task 1 · The executive advisory"
 },
 {
  "t": "p",
  "text": "Write a complete executive advisory for a health-system leader: the diagnosis in strategic language, the recommendation, a conservative and clearly-assumed outcome model, and the specific decision you are advising them to make. It should read as an advisor's counsel, not a pitch for permission."
 },
 {
  "t": "h2",
  "text": "Task 2 · The system-scale strategy"
 },
 {
  "t": "p",
  "text": "Write a system-scale competency strategy: the common standard and local paths, the phased rollout across facilities, the leadership structure that holds the standard at scale, and an explicit statement of how you protect rigor while achieving reach."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each task against its marks. Both tasks must reach at least four of five to complete Module 14."
 },
 {
  "t": "checklist",
  "title": "Task 1 · Executive advisory",
  "items": [
   "Speaks strategy, not operations: risk, cost, throughput, survey",
   "Names a problem the executive already feels and owns",
   "Models outcomes conservatively, with assumptions stated",
   "Advises a specific decision rather than asking permission",
   "Protects the executive from buying reach without rigor"
  ]
 },
 {
  "t": "checklist",
  "title": "Task 2 · System-scale strategy",
  "items": [
   "Holds one common standard across every facility",
   "Tailors the path per facility (coherence without uniformity)",
   "Sequences the rollout rather than launching everywhere at once",
   "Builds a leadership structure that holds the standard at scale",
   "States explicitly how rigor is protected while scaling"
  ]
 },
 {
  "t": "h2",
  "text": "You have completed Module 14"
 },
 {
  "t": "p",
  "text": "Return to the four objectives: build at system scale, advise leadership, model outcomes honestly, and mentor Master candidates. If the shift from asking to advising, or protecting rigor while scaling, still feels shaky, re-read before Module 15, the last module of the program."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "Carry this into Module 15 You can now lead and scale at the enterprise level. Module 15, Research and Evidence-Based Practice, is the final module of the entire pathway. It turns your work into evidence, studying what works, publishing it, and contributing to the field itself, so the standard you hold is not just replicated, but proven and advanced. You have learned to lead the system. Last, you learn to add to the knowledge behind it."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 3 · Module 14 (Module 4 of 5) · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 16,
    "q": "“Coherence without uniformity” means:",
    "options": [
     "A) Every facility runs an identical path",
     "B) One common standard, with locally tailored paths",
     "C) No standard at all",
     "D) Each facility sets its own standard"
    ],
    "answer": "B"
   },
   {
    "n": 17,
    "q": "In front of executives, the common failure is:",
    "options": [
     "A) Speaking strategy",
     "B) Talking operations to people who think in strategy",
     "C) Being too brief",
     "D) Using their language"
    ],
    "answer": "B"
   },
   {
    "n": 18,
    "q": "An advisor, unlike a seller, is willing to:",
    "options": [
     "A) Promise anything",
     "B) Tell leadership the hard truth",
     "C) Avoid conflict",
     "D) Inflate the model"
    ],
    "answer": "B"
   },
   {
    "n": 19,
    "q": "Outcome models should be:",
    "options": [
     "A) Maximally optimistic",
     "B) Conservative, with assumptions stated openly",
     "C) Vague",
     "D) Hidden from leadership"
    ],
    "answer": "B"
   },
   {
    "n": 20,
    "q": "At enterprise scale, the greatest danger is:",
    "options": [
     "A) Moving too slowly",
     "B) Trading rigor for reach",
     "C) Too much data",
     "D) Too many facilitators"
    ],
    "answer": "B"
   }
  ]
 },
 {
  "id": "P15",
  "seq": 15,
  "level": 3,
  "levelLabel": "Level 3 Master",
  "levelPos": "5 of 5",
  "title": "Research and Evidence-Based Practice",
  "contentPending": false,
  "reader": [
 {
  "t": "p",
  "text": "SBD WIP FACILITATOR CERTIFICATION · LEVEL 3 · MASTER FACILITATOR"
 },
 {
  "t": "p",
  "text": "Module 15"
 },
 {
  "t": "p",
  "text": "Level 3 · Module 5 of 5 · The Final Module"
 },
 {
  "t": "p",
  "text": "Research and Evidence-Based Practice"
 },
 {
  "t": "p",
  "text": "Self-Paced Learner Workbook"
 },
 {
  "t": "p",
  "text": "The last step of mastery is to give something back. You have learned everything the program can teach you. Now you learn to add to what the field knows."
 },
 {
  "t": "p",
  "text": "Estimated time: 8 hours · Completes the 40-hour Level 3 program · Prerequisite: Level 2 certification"
 },
 {
  "t": "p",
  "text": "Jake Tayler Jacobs DBA, MBA, B.Ed. · SIPS Healthcare Solutions"
 },
 {
  "t": "h1",
  "text": "Before you begin, the last module"
 },
 {
  "t": "p",
  "text": "This is the final module of the entire SBD facilitator pathway. You began by learning why the old way of training failed, and you have climbed all the way to leading competency across a health system. This last step is different in spirit from all the others. Every module until now has been about applying knowledge that already existed. This one is about creating knowledge that does not yet exist, and giving it to the field."
 },
 {
  "t": "p",
  "text": "A profession advances only when its practitioners study what they do, prove what works, and share it. Sterile processing has been starved of exactly this: too much of its practice rests on tradition and vendor claims rather than evidence. As a Master Facilitator sitting on a system's worth of real competency data, you are in a rare position to change that. You can ask real questions, answer them with real data, and contribute findings that help technicians and patients far beyond your own walls. That is the final expression of mastery: not just doing the work well, but advancing the field that the work belongs to."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Evidence is the antidote to the problem SBD was built to solve. The whole program began with a problem: training built on tradition, opinion, and “we've always done it this way,” with no objective evidence of competence. Research is the same fight at the level of the profession. When you replace “I think this works” with “here is the evidence that it works,” you do for the field what SBD did for the department. This module asks you to become a source of evidence, not just a consumer of it."
 },
 {
  "t": "p",
  "text": "Four things you will be able to do by the end of Module 15, and the program:"
 },
 {
  "t": "list",
  "items": [
   "Ground your practice in evidence, distinguishing what is proven from what is merely traditional.",
   "Design a sound improvement study using the data your program already generates.",
   "Interpret and apply research honestly, including its limits.",
   "Contribute to the field through writing, presenting, and sharing what you learn."
  ]
 },
 {
  "t": "section",
  "text": "SECTION 1 OF 4"
 },
 {
  "t": "h1",
  "text": "What evidence-based practice means"
 },
 {
  "t": "p",
  "text": "Before you can produce evidence, you have to think in evidence, to notice the difference between what is proven and what is simply repeated."
 },
 {
  "t": "h2",
  "text": "Tradition is not evidence"
 },
 {
  "t": "p",
  "text": "Much of sterile processing practice is inherited: a step done because it has always been done, a method a vendor recommended, a habit passed from preceptor to trainee. Some of it is sound and some of it is not, and without evidence you cannot tell which. Evidence-based practice is the discipline of asking, for any practice, “how do we actually know this works,” and being honest when the answer is “we don't, we just always have.”"
 },
 {
  "t": "list",
  "items": [
   "Evidence is a claim supported by data gathered systematically, that others could check.",
   "Tradition is a claim supported by repetition and authority. It may be right, but it has not been shown to be."
  ]
 },
 {
  "t": "h2",
  "text": "The hierarchy of evidence"
 },
 {
  "t": "p",
  "text": "Not all evidence is equal, and a Master Facilitator should know roughly how strong different kinds are. A single anecdote is weak; a well-run study is strong; the consensus of many studies is stronger still. You do not need to be a statistician, but you need enough literacy to weigh a claim: is this one person's experience, one facility's data, or a rigorous body of work?"
 },
 {
  "t": "list",
  "items": [
   "Weakest: anecdote and expert opinion alone, “in my experience.” Useful for hypotheses, not for proof.",
   "Stronger: systematic data from real practice, like your own program's outcomes, measured properly.",
   "Strongest: controlled studies and the consensus of many of them, though these are rare in this field."
  ]
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name one practice in sterile processing that is often done by tradition rather than proven evidence. Then state, in one sentence, the difference between a claim backed by evidence and one backed by tradition."
 },
 {
  "t": "section",
  "text": "SECTION 2 OF 4"
 },
 {
  "t": "h1",
  "text": "Designing an improvement study"
 },
 {
  "t": "p",
  "text": "You are already sitting on data most researchers would envy. A sound study turns that data into a real answer to a real question."
 },
 {
  "t": "h2",
  "text": "Start with a real, answerable question"
 },
 {
  "t": "p",
  "text": "Good research begins with a question that is both worth answering and actually answerable with the data you can get. “Is SBD good?” is neither. “Does adding a hands-on packaging practice session before the gate improve first-attempt pass rates?” is both. The discipline is narrowing a broad curiosity into a specific question with a measurable answer."
 },
 {
  "t": "list",
  "items": [
   "Specific. One clear thing you are testing, not a vague hope.",
   "Measurable. An outcome you can actually count: pass rate, time-to-belt, traveler spend.",
   "Answerable. With data you already have or can realistically collect."
  ]
 },
 {
  "t": "h2",
  "text": "The shape of a sound study"
 },
 {
  "t": "p",
  "text": "You already know the shape, it is the Plan-Do-Study-Act cycle from Module 9, done rigorously enough to trust and share. Define the question and what you will measure, establish a baseline, make the change, measure the result against the baseline, and be honest about what the numbers do and do not show. The rigor that separates research from a hunch is the baseline and the honesty."
 },
 {
  "t": "callout",
  "label": "Example",
  "text": "A real study you could run Question: does peer pairing reduce time-to-Yellow for new hires? Baseline: your current average time-to-Yellow, from David, is eleven weeks. Change: pair each new hire with a recently-advanced peer for their first month. Measure: time-to-Yellow for the paired cohort versus the baseline, over enough learners to mean something. Result: paired cohort averages eight weeks. Honest reading: this suggests peer pairing helps, though you note the cohort was small and you cannot fully rule out other factors. That honest, measured finding is publishable and useful, precisely because you did not overclaim it."
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Guard against fooling yourself. The biggest danger in your own improvement research is wanting it to work. You will be tempted to read ambiguous data as success, to ignore the confounding factor, to stop measuring once the number looks good. Real research means trying to disprove your own idea as hard as you tried to prove it. If your change truly works, honest scrutiny will show it. If it does not, you need to know that more than you need to be right."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Write one specific, measurable, answerable research question you could investigate with your own program's data. Then name the baseline you would need and the one confounding factor you would most have to watch for."
 },
 {
  "t": "section",
  "text": "SECTION 3 OF 4"
 },
 {
  "t": "h1",
  "text": "Interpreting and applying research"
 },
 {
  "t": "p",
  "text": "A Master Facilitator both produces and consumes evidence. Reading research well, including seeing through weak research, is its own skill."
 },
 {
  "t": "h2",
  "text": "Read a claim critically"
 },
 {
  "t": "p",
  "text": "When you encounter a claim, a vendor study, a published paper, a conference talk, you weigh it rather than simply believing or dismissing it. Who produced it, and do they have an interest in the result? How big and how representative was the sample? Do the conclusions actually follow from the data, or reach beyond it? A vendor study of twelve trays showing their product is best is not the same as an independent study of thousands."
 },
 {
  "t": "list",
  "items": [
   "Source and interest. Who paid for it, and what did they want it to show?",
   "Sample and method. How much data, how gathered, how representative?",
   "Fit of conclusion to data. Does the claim stay within what the data can support, or leap past it?"
  ]
 },
 {
  "t": "h2",
  "text": "Apply it in context, do not copy it blindly"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Evidence informs judgment; it does not replace it. A finding from one context does not automatically transfer to yours. A practice proven at a large academic center may not fit a small community hospital, and applying it blindly because “there's a study” is as thoughtless as ignoring evidence entirely. Read the evidence, then apply your judgment about whether and how it fits your setting. This mirrors David's whole design principle, one last time: evidence informs, you decide."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Check yourself. Name three questions you would ask to judge whether a research claim is trustworthy. Then explain why a strong finding from one setting still requires judgment before you apply it in another."
 },
 {
  "t": "section",
  "text": "SECTION 4 OF 4"
 },
 {
  "t": "h1",
  "text": "Contributing to the field"
 },
 {
  "t": "p",
  "text": "The final act of mastery is to give your knowledge away, so the profession is better for your having practiced it."
 },
 {
  "t": "p",
  "text": "Knowledge kept to yourself dies with your career. Knowledge shared outlives you and lifts everyone who comes after. As a Master Facilitator you are positioned to contribute in ways most of the field cannot, because you hold real data, real outcomes, and a rigorous method. Contribution is not vanity; it is the responsibility that comes with the vantage point you have earned."
 },
 {
  "t": "h2",
  "text": "Ways to contribute"
 },
 {
  "t": "list",
  "items": [
   "Write it up. A case study, an article, a white paper. A clear, honest account of what you did and what happened is valuable even without a formal journal.",
   "Present it. At a facility, a system, a professional conference. Sharing a finding out loud spreads it and invites the scrutiny that makes it stronger.",
   "Mentor and teach it. Everything in this pathway is knowledge someone chose to write down and pass on. You now join that chain by teaching what you have learned to the facilitators you develop.",
   "Feed it back into SBD. Your findings can improve the curriculum itself, closing the loop you learned in Module 9, so the whole system gets better because you studied it."
  ]
 },
 {
  "t": "h2",
  "text": "Contribute honestly"
 },
 {
  "t": "callout",
  "label": "Watch Out",
  "text": "Your credibility is the only currency that matters here. When you contribute to the field, you are staking your name on what you share. Report what you actually found, including the limitations and the things that did not work. Overclaiming to look impressive does lasting damage, to your credibility and to the technicians who might act on a finding that was never as solid as you made it sound. The field advances on honest reporting, and one inflated claim poisons trust in everything else you offer. Share the truth, at the size it actually is."
 },
 {
  "t": "callout",
  "label": "Key Idea",
  "text": "Pause and think. Choose one finding or lesson from your own experience worth sharing with the field. Name how you would contribute it, write, present, teach, or feed back into SBD, and one limitation you would be honest about when you shared it."
 },
 {
  "t": "h1",
  "text": "Put it to work"
 },
 {
  "t": "p",
  "text": "Two activities before the final module assessment, both drawn from what Level 3 tests."
 },
 {
  "t": "h2",
  "text": "Activity 1 · Design a study"
 },
 {
  "t": "p",
  "text": "Design an improvement study you could genuinely run on your own program: the specific and measurable question, the baseline, the change, what you would measure, and the confounding factor you would guard against. Make it real, something your data could actually answer."
 },
 {
  "t": "h2",
  "text": "Activity 2 · Plan a contribution"
 },
 {
  "t": "p",
  "text": "Take a finding or lesson worth sharing and plan how you would contribute it to the field: the form (write, present, teach, or feed into SBD), the audience, the honest limitations you would include, and what you would want the reader or listener to do differently as a result."
 },
 {
  "t": "h1",
  "text": "Module 15 assessment"
 },
 {
  "t": "p",
  "text": "Two applied tasks that mirror the scholarly work of a Master Facilitator, and they connect directly to the Level 3 capstone, where you will produce and defend real evidence. Complete both fully; they combine with the other Level 3 modules and the practicum toward the certification gates. Score yourself against the guide that follows."
 },
 {
  "t": "h2",
  "text": "Task 1 · A complete study design"
 },
 {
  "t": "p",
  "text": "Write a full study design ready to run: the research question (specific, measurable, answerable), the baseline and how you establish it, the intervention, the outcome measures, the analysis, and an honest account of the study's limitations and the confounders you will watch. This is the seed of a Level 3 capstone white paper."
 },
 {
  "t": "h2",
  "text": "Task 2 · A contribution written for the field"
 },
 {
  "t": "p",
  "text": "Write a short contribution, a case study or article abstract, reporting a real or realistic finding from your work. State what you did, what you found, and, crucially, the limitations, at a size the evidence honestly supports. It should be something a peer could read and learn from without being misled."
 },
 {
  "t": "h1",
  "text": "Self-scoring guide"
 },
 {
  "t": "p",
  "text": "Score each task against its marks. Both tasks must reach at least four of five to complete Module 15, and the Level 3 coursework."
 },
 {
  "t": "checklist",
  "title": "Task 1 · Study design",
  "items": [
   "Asks a specific, measurable, answerable question",
   "Establishes a real baseline before the change",
   "Defines clear outcome measures and how they are analyzed",
   "Names limitations and confounders honestly",
   "Is genuinely runnable on real program data"
  ]
 },
 {
  "t": "checklist",
  "title": "Task 2 · Contribution to the field",
  "items": [
   "Reports clearly what was done and what was found",
   "States limitations rather than hiding them",
   "Claims only what the evidence actually supports",
   "Is useful to a peer in the field",
   "Puts credibility ahead of impressiveness"
  ]
 },
 {
  "t": "h2",
  "text": "You have completed Module 15, and the Level 3 coursework"
 },
 {
  "t": "p",
  "text": "Return to the four objectives: ground practice in evidence, design a sound study, interpret research critically, and contribute to the field. With this module done, you have completed all five modules of Level 3, and every module of the entire SBD facilitator pathway. What remains is to earn the Master Facilitator credential itself."
 },
 {
  "t": "callout",
  "label": "In Your Words",
  "text": "What comes next: the Master Facilitator gates You earned Level 1 and Level 2 through three gates each. The Master Facilitator credential is earned at the highest bar in the program: Gate 1, Knowledge: a comprehensive exam plus an original 3,000-word evidence-based white paper, at 95%. Gate 2, Simulation: deliver a full facilitator-training session that develops and assesses another facilitator, at 90%. Gate 3, Practicum and capstone: a six-month practicum, developing facilitators, leading at scale, running a real improvement study, followed by a capstone defense, at 95%. You have done the work of the entire pathway. The Master gates are where you prove you can teach it, scale it, and add to it, and then you become one of the people who carries the standard for everyone who follows."
 },
 {
  "t": "p",
  "text": "The end of the pathway, and the beginning of your work as a Master Facilitator."
 },
 {
  "t": "p",
  "text": "SBD WIP Facilitator Certification · Level 3 · Module 15 (Module 5 of 5) · Prepared by Jake Tayler Jacobs DBA, MBA, B.Ed. for SIPS Healthcare Solutions"
 }
],
  "knowledge": [
   {
    "n": 21,
    "q": "Evidence differs from tradition in that evidence is:",
    "options": [
     "A) Older",
     "B) Supported by systematic data others could check",
     "C) More popular",
     "D) Recommended by a vendor"
    ],
    "answer": "B"
   },
   {
    "n": 22,
    "q": "A sound research question is specific, measurable, and:",
    "options": [
     "A) Impressive",
     "B) Answerable with real data",
     "C) Broad",
     "D) Rhetorical"
    ],
    "answer": "B"
   },
   {
    "n": 23,
    "q": "The biggest danger in your own improvement research is:",
    "options": [
     "A) Too much data",
     "B) Wanting it to work and reading data to fit",
     "C) Slow analysis",
     "D) Small samples only"
    ],
    "answer": "B"
   },
   {
    "n": 24,
    "q": "When judging a research claim, you first ask:",
    "options": [
     "A) Is it long?",
     "B) Who produced it and what interest do they have?",
     "C) Is it recent?",
     "D) Is it famous?"
    ],
    "answer": "B"
   },
   {
    "n": 25,
    "q": "When contributing to the field, your essential currency is:",
    "options": [
     "A) Impressiveness",
     "B) Credibility, reporting honestly including limits",
     "C) Volume",
     "D) Speed"
    ],
    "answer": "B"
   }
  ]
 }
];

// Per-level thresholds + assessor-administered Gate 2 simulation reference
// and Gate 3 rubric/auto-fail conditions (read-only in Phase 1).
const PRC_LEVEL_GATES = [
 {
  "level": 1,
  "gate1": {
   "passPct": 90
  },
  "gate2": {
   "passPct": 80,
   "simulations": [
    {
     "n": 1,
     "title": "Placement review and module assignment",
     "scenario": "A new learner has just been placed at White Belt. Their weak domains are packaging (34%) and sterilization (48%). Their profile is Sentinel. They are aiming for Yellow. Build their initial module plan and explain your reasoning.",
     "scoringGuide": [
      "Reads the profile (Sentinel) and plans a clear, standard-cited, step-based approach — 20",
      "Sequences the worst gap first: fm-05 Packaging, then fm-06 Sterilization — 25",
      "Adds the Yellow-required modules (e.g. fm-09 Quality) and the Yellow instrument module — 20",
      "Aims the sequence at the Yellow gate, with practice to 90% before assessment — 20",
      "Frames placement as a starting point, not a judgment — 15"
     ]
    },
    {
     "n": 2,
     "title": "Stuck-learner intervention",
     "scenario": "David flags a learner stuck five days in a module, two failed knowledge attempts, and now inactive for two days. Profile: Steward. Conduct the intervention (role-played by the assessor).",
     "scoringGuide": [
      "Opens with empathy and the person (Steward), not pressure — 20",
      "Diagnoses the real barrier together, using the domain data — 20",
      "Correctly identifies this as confidence/discouragement, not a knowledge gap — 20",
      "Shrinks the problem to one small, winnable next step — 20",
      "Closes on a concrete commitment and a scheduled follow-up — 20"
     ]
    },
    {
     "n": 3,
     "title": "Assessment-readiness determination",
     "scenario": "A learner insists they are “not ready” for their Yellow assessment. Their practice scores have been at 92% knowledge and 91% simulation for two weeks. Determine and communicate readiness.",
     "scoringGuide": [
      "Uses the 90% practice threshold as the objective readiness signal, not gut feel — 30",
      "Correctly concludes the learner IS ready — 20",
      "Recognizes the block is confidence, and applies the confidence-boost approach — 25",
      "Makes scheduling easy and reframes the risk of the gate — 25"
     ]
    },
    {
     "n": 4,
     "title": "Gate 3 observation planning",
     "scenario": "You are about to run a Gate 3 module observation for a learner you have coached closely and like. Walk through your plan for all three phases, before, during, after.",
     "scoringGuide": [
      "Before: reviews brief, sets scenario, opens rubric, sets expectations — 20",
      "During: assesses summatively, silent, no coaching or rescue — 25",
      "Names and guards against the halo effect explicitly — 20",
      "Applies safety-critical overrides correctly — 15",
      "After: SBI feedback opening with a strength, immediate documentation — 20"
     ]
    },
    {
     "n": 5,
     "title": "Leadership reporting",
     "scenario": "Your Director asks, with no warning, “How is the department doing?” You have this month's David data. Deliver a two-minute answer.",
     "scoringGuide": [
      "Frames outcomes (competency, advancement), not activity — 30",
      "Shows efficiency: learners carried per facilitator hour — 20",
      "Names the risks honestly, with a plan for each — 30",
      "Concise and something leadership can act on — 20"
     ]
    }
   ]
  },
  "gate3": {
   "passPct": 85,
   "rubric": [
    {
     "category": "David OG proficiency",
     "weight": 20
    },
    {
     "category": "Coaching effectiveness",
     "weight": 20
    },
    {
     "category": "Observation technique",
     "weight": 25
    },
    {
     "category": "Assessment accuracy",
     "weight": 20
    },
    {
     "category": "Operational excellence",
     "weight": 15
    }
   ],
   "autoFail": [
    "coach during a summative gate, commit a halo-effect pass of work below standard, miss a safety-critical override, or falsify or omit required documentation"
   ]
  }
 },
 {
  "level": 2,
  "gate1": {
   "passPct": 90
  },
  "gate2": {
   "passPct": 85,
   "simulations": [
    {
     "n": 1,
     "title": "The network read",
     "scenario": "Monday's network view: Facility A is thriving, Facility B's advancement has stalled, Facility C's new champion just passed a learner on a Gate 3 you suspect was soft. Prioritize your week across the three.",
     "scoringGuide": [
      "Prioritizes the suspected soft pass at C first, it is a standard-integrity risk — 30",
      "Reads B's stall as facility-specific and plans a root-cause visit or review — 20",
      "Leaves thriving Facility A to run, allocating attention by need — 20",
      "Frames the week around holding the standard while developing the network — 30"
     ]
    },
    {
     "n": 2,
     "title": "The champion audit",
     "scenario": "You pull Facility C's champion's recent observations. One clearly passed a learner who skipped a safety-critical step. Handle it.",
     "scoringGuide": [
      "Recognizes this as a safety-critical miss that should have been an automatic fail — 30",
      "Coaches the champion with SBI, honestly, without destroying the relationship — 25",
      "Re-audits to confirm recalibration rather than assuming it — 25",
      "Does not simply revoke or ignore; develops the champion while protecting the standard — 20"
     ]
    },
    {
     "n": 3,
     "title": "The leadership ask",
     "scenario": "Midweek, the VP of Perioperative Services asks for a state-of-the-network briefing by end of day.",
     "scoringGuide": [
      "Uses David to assemble outcomes across all three facilities quickly — 20",
      "Frames outcomes and efficiency, not activity — 30",
      "Names the C standard-integrity risk honestly, with the plan to fix it — 30",
      "Gives leadership something to act on, concisely — 20"
     ]
    },
    {
     "n": 4,
     "title": "The resistance flare",
     "scenario": "A senior tech at Facility B publicly declares the program pointless in front of the team. Respond in the moment and afterward.",
     "scoringGuide": [
      "Does not argue the program publicly or escalate the confrontation — 25",
      "Reads the fear under the resistance and addresses status and legacy — 30",
      "Follows up privately to attempt to convert the veteran into a champion — 25",
      "Protects team morale and the standard simultaneously — 20"
     ]
    }
   ]
  },
  "gate3": {
   "passPct": 90,
   "rubric": [
    {
     "category": "Blue Belt observation",
     "weight": 35
    },
    {
     "category": "Coaching a facilitator",
     "weight": 30
    },
    {
     "category": "Program design defense",
     "weight": 35
    }
   ],
   "autoFail": [
    "pass a Blue Belt observation with a safety-critical miss (halo effect at the leadership level)",
    "coach a facilitator toward lowering the standard",
    "or defend a program design that bends a gate or threshold"
   ]
  }
 },
 {
  "level": 3,
  "gate1": {
   "passPct": 95
  },
  "gate2": {
   "passPct": 90,
   "simulations": [
    {
     "n": 1,
     "title": "Event 1",
     "scenario": "Design and deliver a training session that develops a specific facilitator competency in a real or role-played new facilitator, then assess whether they reached it. You will be observed on both the teaching and the assessment, and asked to justify your judgments afterward.",
     "scoringGuide": [
      "Designs backward from a clear target competency — 15",
      "Uses teach, model, practice, reflect, not lecture — 20",
      "Beats the expert's curse: surfaces the invisible steps for the learner — 15",
      "Assesses the facilitator against the standard, not personal style — 20",
      "Correctly identifies whether the competency was reached, with evidence — 20",
      "Gives developmental feedback (SBI), honest and motivating — 10"
     ]
    }
   ]
  },
  "gate3": {
   "passPct": 95,
   "rubric": [
    {
     "category": "Developing facilitators",
     "weight": 25
    },
    {
     "category": "Leading at scale",
     "weight": 25
    },
    {
     "category": "Standard & data stewardship",
     "weight": 20
    },
    {
     "category": "Improvement study",
     "weight": 15
    },
    {
     "category": "Capstone defense",
     "weight": 15
    }
   ],
   "autoFail": [
    "certify a facilitator who should have failed, bend or configure away any part of the standard, falsify or inflate study or program data, or defend a decision that traded rigor for reach"
   ]
  }
 }
];

// ============================================================ SBD PRECEPTOR CERTIFICATION (Phase 1)
// Fourth curriculum on the Foundations rails. 15 modules across 3 levels
// (L1 Facilitator 1-6, L2 Advanced 7-10, L3 Master 11-15). Continuous numbering
// 1..15 with dual labels (levelLabel + levelPos). Reuses the shared 3-gate engine
// helpers from foundations.js (fndGateBadge, FND_PASSES_REQUIRED) — NOT duplicated
// (Banned Pattern B6). Separate DB keys: preceptorAssignments, preceptorProgress.
//
// PHASE 1 GATE MODEL (confirmed):
//   Gate 1 Knowledge  — candidate-scored, the module's own knowledge bank, SAME
//     3-pass rule as Foundations but scored against THIS level's K threshold
//     (L1/L2 90%, L3 95%) instead of the flat 80% (why prcGatePasses is threshold-
//     aware and fndGatePasses is not reused for counting). Attempts logged in g1.
//   Gate 2 Simulation — NOT candidate-auto-scored in Phase 1. The level's
//     simulations + rubric render read-only as assessor-administered reference.
//   Gate 3 Observation — leader-confirmed capstone (confirm-by-name-and-date flow,
//     mirrors Foundations G3), stored in g3.
//   Module complete = 3 Knowledge passes AND the Gate-3 capstone confirmed.
//
// IMPORTANT: foundations.js MUST load before this file (fndGateBadge / FND_PASSES_REQUIRED).

// Per-level climbing gate thresholds (also seeded on preceptor_modules).
const PRC_LEVEL_THRESH={1:{k:90,s:80,o:85},2:{k:90,s:85,o:90},3:{k:95,s:90,o:95}};
function prcLevelGate(level){return (typeof PRC_LEVEL_GATES!=='undefined'?PRC_LEVEL_GATES:[]).find(x=>x.level===level)||null;}
function prcKThresh(m){const g=prcLevelGate(m.level);return (g&&g.gate1&&g.gate1.passPct)||(PRC_LEVEL_THRESH[m.level]||{k:90}).k;}
function prcSThresh(m){const g=prcLevelGate(m.level);return (g&&g.gate2&&g.gate2.passPct)||(PRC_LEVEL_THRESH[m.level]||{s:80}).s;}
function prcOThresh(m){const g=prcLevelGate(m.level);return (g&&g.gate3&&g.gate3.passPct)||(PRC_LEVEL_THRESH[m.level]||{o:85}).o;}
// Threshold-aware pass counter (mirrors fndGatePasses' attempt-log approach, but
// counts attempts at this module's own K threshold rather than the flat 80%).
function prcGatePasses(g,thr){return (((g||{}).attempts)||[]).filter(a=>(a.score||0)>=(thr||0)).length;}
// Phase 1 has a single capstone observation per module (the source curriculum has
// no per-module observation checklist; the level rubric/sims are shown as read-only
// reference on the capstone panel). One assessor-confirmed item gates completion.
function prcObsItems(m){return [{id:m.id+'-cap',text:m.levelLabel+' capstone — assessor-administered practicum for "'+m.title+'" observed and passed at the '+prcOThresh(m)+'% standard.'}];}
function prcObsReady(m,gates){return prcGatePasses(gates.g1,prcKThresh(m))>=FND_PASSES_REQUIRED;}
function prcPassChip(m,gates){
 const k=Math.min(prcGatePasses(gates.g1,prcKThresh(m)),FND_PASSES_REQUIRED);
 const c=k>=FND_PASSES_REQUIRED?'#4ade80':'#94a3b8';
 return '<span style="font-size:10.5px;font-weight:700;white-space:nowrap"><span style="color:'+c+'">K '+k+'/'+FND_PASSES_REQUIRED+'</span></span>';
}

// ── Data helpers ──
function getPreceptorAssignments(sid){return (DB.preceptorAssignments||[]).filter(a=>a.staffId===sid);}
function isPrcModuleAssigned(sid,mid){return (DB.preceptorAssignments||[]).some(a=>a.staffId===sid&&a.moduleId===mid);}
function getPrcModuleGates(sid,mid){
 const p=(DB.preceptorProgress||[]).find(x=>x.staffId===sid&&x.moduleId===mid);
 return p||{g1:{status:'locked',score:0,attempts:[]},g2:{status:'locked',score:0,attempts:[]},g3:{status:'locked',items:[]},complete:false};
}
function isPrcModuleComplete(sid,mid){const p=getPrcModuleGates(sid,mid);return p.complete===true;}

// ── Ph3: master-admin access control ──────────────────────────────────────────
// An explicit preceptor_access row (granted|revoked|default) overrides belt in both
// directions. Absence of a row = 'default' = belt-based (Educator/Preceptor 02B is a
// Green-Belt-tier track, so default eligibility = Green Belt or above, beltIdx>=2).
function prcAccessRow(staffId){ return (DB.preceptorAccess||[]).find(r=>r.staffId===staffId)||null; }
// Display state: 'granted' | 'revoked' | 'default' (no row -> 'default').
function prcAccessState(staffId){ const r=prcAccessRow(staffId); return (r&&r.state)||'default'; }
// Reads the access record FIRST, belt SECOND. revoked -> false; granted -> true (any
// belt); default/no-row -> belt eligibility (Green+, the existing 02B gate).
function prcHasAccess(staffId){
 // Apply→approve model (Ignacio 2026-07-23): access requires an explicit master-admin
 // GRANT. Belt level no longer auto-grants — it only makes a candidate eligible to
 // APPLY (see prcCanApply). 'requested' = application pending (no access yet).
 return prcAccessState(staffId)==='granted';
}
// Eligible to APPLY: at the old default tier (Green Belt+, beltIdx>=2) and no decision
// yet (state 'default'). Already-requested/granted/revoked are not re-appliable.
function prcCanApply(staffId){
 if(prcAccessState(staffId)!=='default') return false;
 const s=(typeof getStaff==='function')?getStaff(staffId):(DB.staff||[]).find(x=>x.id===staffId);
 return !!(s && typeof beltIdx==='function' && beltIdx(s.belt)>=2);
}
// Candidate self-applies for the preceptor school (default -> requested). NOT master-
// gated (this is the candidate's own action); the master-admin approve step grants it.
function prcApply(staffId){
 staffId = staffId || (typeof ST!=='undefined' && ST.staffId);
 if(!prcCanApply(staffId)){ if(typeof toast==='function') toast('You are not eligible to apply for the preceptor school yet.','err'); return; }
 if(!DB.preceptorAccess) DB.preceptorAccess=[];
 const now=new Date().toISOString();
 let row=DB.preceptorAccess.find(x=>x.staffId===staffId);
 if(!row){ row={staffId:staffId}; DB.preceptorAccess.push(row); }
 row.state='requested'; row.requestedAt=now; row.updatedAt=now;
 _prcSaveAccess({staff_id:staffId,state:'requested',requested_at:now,updated_at:now});
 if(typeof toast==='function') toast('Application submitted. A master admin will review it.','ok');
 if(typeof renderSPreceptor==='function') renderSPreceptor();
}
// Master-admin approve/deny of a pending application. Approve -> granted; deny -> default
// (candidate may re-apply). Reuses the master-admin gate + persistence in prcSetAccess.
function prcApproveApplication(staffId,approve){
 if(!(typeof ST!=='undefined'&&ST.user&&ST.user.role==='master_admin')){ if(typeof toast==='function') toast('Only the Master Admin can approve applications','err'); return; }
 prcSetAccess(staffId, approve?'granted':'default', 'apprqueue');
}
// Pending applications (state 'requested'), newest first — feeds the approve queue.
function prcPendingApplications(){
 return (DB.preceptorAccess||[]).filter(r=>r.state==='requested')
   .slice().sort((a,b)=>String(b.requestedAt||'').localeCompare(String(a.requestedAt||'')));
}
// Ph3 L2/L3 prerequisite: a level unlocks only when the PRIOR level is fully complete
// (every ASSIGNED module of that level complete, and at least one assigned). Uses the
// existing prcSummaryForStaff byLevel rollup ({level:{a,c}}). Level 1 is always open.
function prcLevelUnlocked(staffId,level){
 if(!level||level<=1) return true;
 const bl=prcSummaryForStaff(staffId).byLevel[level-1];
 return !!(bl && bl.a>0 && bl.c===bl.a);
}
// Reason a module cannot be assigned (access + level prereq), or '' if assignable.
function prcAssignBlockReason(staffId,mid){
 if(!prcHasAccess(staffId)) return (prcAccessState(staffId)==='revoked'?'Preceptor access is revoked for this staff member':'Not eligible: reach Green Belt or have a Master Admin grant preceptor access');
 const m=PRECEPTOR_MODULES.find(x=>x.id===mid);
 if(m && !prcLevelUnlocked(staffId,m.level)) return 'Level '+m.level+' is locked until all Level '+(m.level-1)+' modules are complete';
 return '';
}
// Gate-3 confirmer qualification (Ph3): master_admin/staff_admin/assessor always
// qualify; any other confirmer must themself hold a completed preceptor pathway
// (any complete preceptor module — a pragmatic proxy for certification).
function prcConfirmerQualified(user){
 if(!user) return false;
 if(['master_admin','staff_admin','assessor'].indexOf(user.role)>=0) return true;
 const sid=user.sid||user.staffId||user.id;
 if(!sid) return false;
 return (DB.preceptorProgress||[]).some(p=>p.staffId===sid&&p.complete===true);
}

// ── Preceptor Certification Reporting Helpers (Ph.2) ─────────────────────────
// Pure, READ-ONLY aggregation over the in-memory preceptor arrays, mirroring the
// Foundations reporting helpers (fndSummaryForStaff / fiFacilityRollup in
// foundations.js). No writes, no DB calls, no DOM — safe to call from any
// report/dashboard path. ui-views.js only CALLS these (B7). See
// docs/decisions/2026-07-22-preceptor-certification-ph2.md.
// ⚠️ SCOPE: reads DB.preceptor* (RLS-filtered at hydration). Correct for
//   self / own-facility surfaces; a cross-facility caller must supply
//   scope-correct data. ⚠️ completedDateApprox is DERIVED from the G3 confirm
//   date (no completed_at column) — treat it as approximate.

// Summarize ONE preceptor module for a candidate into a report-ready row.
// A preceptor module has a single scored Knowledge gate (threshold varies by
// level), an assessor-administered Simulation, and a leader-confirmed Observation.
function prcModuleSummary(m, assignment, gates){
 const g1=(gates&&gates.g1)||{status:'locked',score:0,attempts:[]};
 const g2=(gates&&gates.g2)||{status:'locked',score:0,attempts:[]};
 const g3=(gates&&gates.g3)||{status:'locked',items:[]};
 const thr=prcKThresh(m);
 const kPasses=prcGatePasses(g1,thr);
 const complete=!!(gates&&gates.complete);
 // 'In Progress' is DERIVED (assigned & !complete); never stored.
 let status; if(complete) status='complete'; else if(assignment) status='in_progress'; else status='not_assigned';
 // "Stalled" (needs attention): assigned + not complete, with a Knowledge attempt
 // below threshold, OR assigned with zero Knowledge passes recorded.
 const failedAttempts=(g1.attempts||[]).filter(a=>(a.score||0)<thr).length;
 const stalled=!!assignment&&!complete&&(failedAttempts>0||kPasses===0);
 const dates=[];
 (g1.attempts||[]).forEach(a=>{if(a&&a.date)dates.push(a.date);});
 (g3.items||[]).forEach(i=>{if(i&&i.date)dates.push(i.date);});
 dates.sort();
 const lastActivityDate=dates.length?dates[dates.length-1]:null;
 const confirmDates=complete?(g3.items||[]).filter(i=>i&&i.confirmed&&i.date).map(i=>i.date).sort():[];
 const completedDateApprox=complete?(confirmDates.length?confirmDates[confirmDates.length-1]:lastActivityDate):null;
 return {
  moduleId:m.id, seq:m.seq, level:m.level, levelLabel:m.levelLabel, title:m.title,
  assigned:!!assignment, complete, status, stalled,
  kThresh:thr, kScore:g1.score||0,
  kPasses:Math.min(kPasses,FND_PASSES_REQUIRED), passesRequired:FND_PASSES_REQUIRED,
  gates:{
   knowledge:  {status:g1.status, score:g1.score||0, passes:kPasses},
   simulation: {status:g2.status, score:g2.score||0},
   observation:{status:g3.status, score:g3.score||0}
  },
  assignedDate: assignment?(assignment.assignedDate||null):null,
  lastActivityDate, completedDateApprox
 };
}

// Preceptor summary for ONE candidate. Percentages are over ASSIGNED modules
// (matches the "N/M completed" convention). Mirrors fndSummaryForStaff.
function prcSummaryForStaff(staffId){
 const asg={}; getPreceptorAssignments(staffId).forEach(a=>{asg[a.moduleId]=a;});
 const rows=PRECEPTOR_MODULES.map(m=>prcModuleSummary(m, asg[m.id]||null, getPrcModuleGates(staffId,m.id)));
 const assignedRows=rows.filter(r=>r.assigned);
 const complete=assignedRows.filter(r=>r.complete).length;
 const byLevel={1:{a:0,c:0},2:{a:0,c:0},3:{a:0,c:0}};
 assignedRows.forEach(r=>{const L=byLevel[r.level]||(byLevel[r.level]={a:0,c:0});L.a++;if(r.complete)L.c++;});
 return {
  modules: rows,
  assigned: assignedRows.length,
  complete,
  inProgress: assignedRows.length-complete,
  pct: assignedRows.length?Math.round(complete/assignedRows.length*100):0,
  needsAttention: assignedRows.some(r=>r.stalled),   // any stalled/failed module
  byLevel
 };
}

// Roll up preceptor completion across every candidate in a facility (or the whole
// visible roster when facilityId is falsy). READ-ONLY; same SCOPE caveat as above.
// Mirrors fiFacilityRollup. needsAttention = count of candidates with >= 1 stalled
// module (a Knowledge attempt below threshold, or assigned-but-no-passes).
function prcFacilityRollup(facilityId){
 const roster=(typeof staffOf==='function')?staffOf(facilityId)
             :(DB.staff||[]).filter(s=>!facilityId||s.fid===facilityId);
 let assignedCount=0, completeCount=0, inProgressCount=0, staffWith=0, needsAttention=0;
 const perStaff=roster.map(s=>{
  const summary=prcSummaryForStaff(s.id);
  assignedCount+=summary.assigned;
  completeCount+=summary.complete;
  inProgressCount+=summary.inProgress;
  if(summary.assigned>0) staffWith++;
  if(summary.assigned>0&&summary.needsAttention) needsAttention++;
  return {staffId:s.id, name:(typeof fullName==='function'?fullName(s):s.name)||s.name, summary};
 });
 return {
  facilityId: facilityId||null,
  staffCount: roster.length,
  staffWith,
  assignedCount, completeCount, inProgressCount,
  needsAttention,
  completionPct: assignedCount?Math.round(completeCount/assignedCount*100):0,
  perStaff
 };
}

// Compact gate-progress cell text, e.g. "K 2/3 (90%) · Sim ✓ · Obs ✓".
function _prcGateText(m){
 const ks=m.kScore?' ('+m.kScore+'%)':'';
 return 'K '+m.kPasses+'/'+m.passesRequired+ks+' · Sim '+(m.gates.simulation.status==='pass'?'✓':'assessor')+' · Obs '+(m.gates.observation.status==='pass'?'✓':'–');
}

// Personal report — on-screen (renderSReport). Mirrors fiStaffSectionHTML.
function prcStaffSectionHTML(staffId){
 const sum=prcSummaryForStaff(staffId);
 const rows=sum.modules.filter(m=>m.assigned);
 if(!rows.length) return '';
 return rptSection('Preceptor Certification', sum.complete+'/'+sum.assigned+' complete ('+sum.pct+'%)')+
   '<div class="card mb16">'+
     '<div style="overflow-x:auto"><table class="tbl" style="min-width:520px">'+
       '<thead><tr><th>Module</th><th>Level</th><th>Status</th><th>Gate Progress (K/Sim/Obs)</th><th>Started</th><th>Completed*</th></tr></thead>'+
       '<tbody>'+rows.map(m=>'<tr>'+
         '<td style="font-size:12px;font-weight:600">'+Security.sanitize(m.title)+'</td>'+
         '<td><span style="font-size:9.5px;font-weight:700;color:var(--gold)">L'+m.level+'</span></td>'+
         '<td>'+(m.complete?'<span class="pill p-ok">Complete</span>':(m.stalled?'<span class="pill p-err">Needs Attention</span>':'<span class="pill p-warn">In Progress</span>'))+'</td>'+
         '<td style="font-size:11.5px;color:var(--txt2)">'+_prcGateText(m)+'</td>'+
         '<td style="font-size:11px;color:var(--txt3)">'+(m.assignedDate||'--')+'</td>'+
         '<td style="font-size:11px;color:'+(m.complete?'var(--ok)':'var(--txt3)')+';font-weight:'+(m.complete?'600':'400')+'">'+(m.completedDateApprox||'--')+'</td>'+
       '</tr>').join('')+'</tbody>'+
     '</table></div>'+
     '<div style="font-size:10px;color:var(--txt3);margin-top:6px;padding:0 2px">* Completion date is derived from the observation sign-off and is approximate.</div>'+
   '</div>';
}

// Personal report — PDF (downloadStaffReport). Mirrors fiStaffSectionPDF.
function prcStaffSectionPDF(staffId){
 const sum=prcSummaryForStaff(staffId);
 const rows=sum.modules.filter(m=>m.assigned);
 if(!rows.length) return '';
 return pSection('Preceptor Certification', sum.complete+'/'+sum.assigned+' complete ('+sum.pct+'%)')+
   '<table class="no-break"><thead><tr><th>Module</th><th>Level</th><th>Status</th><th>Gate Progress (K/Sim/Obs)</th><th>Started</th><th>Completed*</th></tr></thead>'+
   '<tbody>'+rows.map(m=>'<tr>'+
     '<td style="font-weight:600">'+Security.sanitize(m.title)+'</td>'+
     '<td style="font-size:7.5pt;font-weight:700;color:#d97706">L'+m.level+'</td>'+
     '<td><span class="badge '+(m.complete?'badge-green':(m.stalled?'badge-err':'badge-warn'))+'">'+(m.complete?'Complete':(m.stalled?'Needs Attention':'In Progress'))+'</span></td>'+
     '<td style="font-size:8pt">'+_prcGateText(m)+'</td>'+
     '<td style="color:#64748b">'+(m.assignedDate||'–')+'</td>'+
     '<td style="color:'+(m.complete?'#16a34a':'#64748b')+';font-weight:'+(m.complete?'700':'400')+'">'+(m.completedDateApprox||'–')+'</td>'+
   '</tr>').join('')+'</tbody></table>'+
   '<div style="font-size:7.5pt;color:#64748b;margin-top:4px">* Completion date is derived from the observation sign-off and is approximate.</div>';
}

// Facility report — on-screen (renderHReports / renderAFacility). rollup = prcFacilityRollup(fid).
// Mirrors fiFacilitySectionHTML (optional profileFn: manager uses openHProfile, admin openAdminProfile).
function prcFacilitySectionHTML(rollup, profileFn){
 if(!rollup || rollup.assignedCount===0) return '';
 const opener=profileFn||'openHProfile';
 const rows=rollup.perStaff.filter(p=>p.summary.assigned>0).sort((a,b)=>b.summary.pct-a.summary.pct);
 return rptSection('Preceptor Certification', rollup.completeCount+'/'+rollup.assignedCount+' modules complete ('+rollup.completionPct+'%)')+
   '<div class="card mb16">'+
     '<div style="overflow-x:auto"><table class="tbl" style="min-width:460px">'+
       '<thead><tr><th>Staff</th><th>Assigned</th><th>Complete</th><th>In Progress</th><th>Completion</th></tr></thead>'+
       '<tbody>'+rows.map(p=>'<tr onclick="'+opener+'(\''+p.staffId+'\')" style="cursor:pointer">'+
         '<td class="fw7">'+Security.sanitize(p.name||'--')+(p.summary.needsAttention?' <span class="pill p-err" style="font-size:9px">needs attention</span>':'')+'</td>'+
         '<td>'+p.summary.assigned+'</td>'+
         '<td style="color:var(--ok);font-weight:600">'+p.summary.complete+'</td>'+
         '<td style="color:var(--warn)">'+p.summary.inProgress+'</td>'+
         '<td><span style="font-weight:700;color:'+(p.summary.pct>=80?'var(--ok)':p.summary.pct>=50?'var(--warn)':'var(--err)')+'">'+p.summary.pct+'%</span></td>'+
       '</tr>').join('')+'</tbody>'+
     '</table></div>'+
   '</div>';
}

// Facility report — PDF (downloadFacilityReportV2). rollup = prcFacilityRollup(facId).
// Mirrors fiFacilitySectionPDF.
function prcFacilitySectionPDF(rollup){
 if(!rollup || rollup.assignedCount===0) return '';
 const rows=rollup.perStaff.filter(p=>p.summary.assigned>0).sort((a,b)=>b.summary.pct-a.summary.pct);
 return pSection('Preceptor Certification', rollup.completeCount+'/'+rollup.assignedCount+' modules complete ('+rollup.completionPct+'%)')+
   '<table class="no-break"><thead><tr><th>Staff</th><th>Assigned</th><th>Complete</th><th>In Progress</th><th>Completion</th></tr></thead>'+
   '<tbody>'+rows.map(p=>'<tr>'+
     '<td style="font-weight:700">'+Security.sanitize(p.name||'–')+'</td>'+
     '<td>'+p.summary.assigned+'</td>'+
     '<td style="color:#16a34a;font-weight:700">'+p.summary.complete+'</td>'+
     '<td style="color:#d97706">'+p.summary.inProgress+'</td>'+
     '<td><span class="badge '+(p.summary.pct>=80?'badge-green':p.summary.pct>=60?'badge-warn':'badge-err')+'">'+p.summary.pct+'%</span></td>'+
   '</tr>').join('')+'</tbody></table>';
}

// ── Live persistence (mirror each in-memory write to Supabase, guarded by IS_LIVE + SB) ──
function _prcProgToBackend(p){return {staff_id:p.staffId,module_id:p.moduleId,g1:p.g1,g2:p.g2,g3:p.g3,complete:p.complete,updated_at:new Date().toISOString()};}
function _prcSaveProgress(p){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.upsertPreceptorProgress){SB.upsertPreceptorProgress(_prcProgToBackend(p)).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Preceptor progress');else console.warn('[prc] progress sync',e&&e.message);});}}catch(e){console.warn('[prc] progress sync',e);}}
function _prcSaveAssignment(a){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.createPreceptorAssignment){SB.createPreceptorAssignment({staff_id:a.staffId,module_id:a.moduleId,assigned_by:a.assignedBy||null,type:a.type,trigger:a.trigger,facility_id:a.facilityId||null,assigned_date:a.assignedDate,status:a.status}).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Preceptor assignment');else console.warn('[prc] assignment sync',e&&e.message);});}}catch(e){console.warn('[prc] assignment sync',e);}}
function _prcSaveAssignmentStatus(sid,mid,status){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.updatePreceptorAssignmentStatus){SB.updatePreceptorAssignmentStatus(sid,mid,status).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Preceptor status');else console.warn('[prc] status sync',e&&e.message);});}}catch(e){}}

// Ph3: persist a preceptor_access row (guarded by IS_LIVE + SB, master-admin-gated at
// the RLS layer). Mirrors _prcSaveAssignment; on_conflict=staff_id merge-duplicates.
function _prcSaveAccess(row){try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.upsertPreceptorAccess){SB.upsertPreceptorAccess(row).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Preceptor access');else console.warn('[prc] access sync',e&&e.message);});}}catch(e){console.warn('[prc] access sync',e);}}
// Master-admin toggle handler. state = 'granted' | 'revoked' | 'default'. Prompts for a
// reason on grant/revoke, updates DB.preceptorAccess in memory, and persists. NOTHING is
// deleted — revoke only sets state, so a later re-grant restores progress untouched.
function prcSetAccess(staffId,state,context){
 if(!(typeof ST!=='undefined'&&ST.user&&ST.user.role==='master_admin')){if(typeof toast==='function')toast('Only the Master Admin can change preceptor access','err');return;}
 if(['granted','revoked','default'].indexOf(state)<0) return;
 let reason='';
 if(state==='granted'||state==='revoked'){
   const r=prompt(state==='granted'?'Reason for granting preceptor access (belt override):':'Reason for revoking preceptor access:','');
   if(r===null) return; // cancelled
   reason=String(r).trim();
 }
 if(!DB.preceptorAccess) DB.preceptorAccess=[];
 const now=new Date().toISOString();
 const by=(ST.user&&ST.user.name)||null;
 let row=DB.preceptorAccess.find(x=>x.staffId===staffId);
 if(!row){row={staffId:staffId};DB.preceptorAccess.push(row);}
 row.state=state; row.grantedBy=by; row.reason=reason||null; row.grantedAt=now; row.updatedAt=now;
 _prcSaveAccess({staff_id:staffId,state:state,granted_by:by,reason:reason||null,granted_at:now,updated_at:now});
 if(typeof toast==='function') toast('Preceptor access '+(state==='granted'?'granted':state==='revoked'?'revoked — progress preserved':'reset to default (belt-based)'), state==='revoked'?'err':'ok');
 if(context==='apprqueue' && typeof renderHPreceptor==='function'){ renderHPreceptor(); }
 else if(context==='rolemgmt' && typeof renderARoleMgmt==='function'){ renderARoleMgmt(); }
 else if(typeof renderHProfile==='function'){ renderHProfile(staffId,'admin'); }
}
// Master-admin approve-queue card (pending preceptor applications). Returns '' for
// non-masters or when the queue is empty. Embedded at the top of renderHPreceptor.
function _prcApplyQueueHTML(){
 if(!(typeof ST!=='undefined'&&ST.user&&ST.user.role==='master_admin')) return '';
 const pend=prcPendingApplications();
 if(!pend.length) return '';
 const rows=pend.map(r=>{
   const s=(typeof getStaff==='function')?getStaff(r.staffId):null;
   const nm=s?fullName(s):r.staffId;
   const fac=(s&&typeof getFac==='function')?getFac(s.fid):null;
   return '<tr><td style="font-weight:600">'+Security.sanitize(nm)+'</td>'
     +'<td style="font-size:12px;color:#94a3b8">'+(fac?Security.sanitize(fac.name):'—')+'</td>'
     +'<td>'+(s?'<span class="bb bb-'+s.belt+'">'+s.belt+'</span>':'—')+'</td>'
     +'<td style="white-space:nowrap"><button class="btn btn-gold btn-xs" onclick="prcApproveApplication(\''+r.staffId+'\',true)">Approve</button> '
     +'<button class="btn btn-ghost btn-xs" onclick="prcApproveApplication(\''+r.staffId+'\',false)">Deny</button></td></tr>';
 }).join('');
 return '<div class="card mb16"><div class="card-hd"><div class="card-ttl">Preceptor Applications <span class="pill p-gold">'+pend.length+' pending</span></div></div>'
   +'<div class="card-body" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Facility</th><th>Belt</th><th>Decision</th></tr></thead><tbody>'
   +rows+'</tbody></table></div></div></div>';
}
// Renders the master-admin access control (state + Grant/Revoke/Reset). Called from
// ui-views.js openAdminProfile surface (master-admin gated there); domain logic lives here (B7).
function prcAccessControlHTML(staffId,context){
 const st=prcAccessState(staffId);
 const lbl=st==='granted'?'Granted':st==='revoked'?'Revoked':'Default (belt-based)';
 const col=st==='granted'?'#4ade80':st==='revoked'?'#f87171':'var(--txt2)';
 const btn=(s,txt,extra)=>'<button class="btn btn-ghost btn-xs"'+(st===s?' disabled style="opacity:.45"':(extra?' style="'+extra+'"':''))+' onclick="prcSetAccess(\''+staffId+'\',\''+s+'\',\''+(context||'admin')+'\')">'+txt+'</button>';
 return '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;border:1px solid var(--bdr);border-radius:8px;padding:5px 9px" title="Master-admin preceptor curriculum access (overrides belt)">'
   +'<svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--gold)"><path d="M10 2l6 3v5c0 4-3 6-6 8-3-2-6-4-6-8V5l6-3z"/></svg>'
   +'<span style="font-size:11px;color:var(--txt3)">Preceptor: <b style="color:'+col+'">'+lbl+'</b></span>'
   +btn('granted','Grant','border-color:var(--gold-bd);color:var(--gold)')
   +btn('revoked','Revoke','border-color:rgba(239,68,68,.4);color:#f87171')
   +btn('default','Reset')
   +'</div>';
}

// Returns true if a new assignment was created, false if skipped as a duplicate
// (UNIQUE(staff_id,module_id)) or blocked by access/level prereq (Ph3). Mirrors foundations.js assignModule.
function assignPrcModule(sid,mid,by,type,trigger){
 if(!DB.preceptorAssignments) DB.preceptorAssignments=[];
 if(DB.preceptorAssignments.find(a=>a.staffId===sid&&a.moduleId===mid)) return false;
 if(prcAssignBlockReason(sid,mid)) return false; // Ph3: access + L2/L3 prerequisite guard
 const _s=(typeof getStaff==='function')?getStaff(sid):(DB.staff||[]).find(x=>x.id===sid);
 const _a={id:'pa-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),staffId:sid,moduleId:mid,assignedBy:by,type:type||'certification',trigger:trigger||null,facilityId:_s?_s.fid:null,assignedDate:new Date().toISOString().slice(0,10),status:'assigned'};
 DB.preceptorAssignments.push(_a);
 if(!DB.preceptorProgress) DB.preceptorProgress=[];
 let _p=DB.preceptorProgress.find(x=>x.staffId===sid&&x.moduleId===mid);
 if(!_p){ _p={staffId:sid,moduleId:mid,g1:{status:'open',score:0,attempts:[]},g2:{status:'open',score:0,attempts:[]},g3:{status:'open',items:[]},complete:false}; DB.preceptorProgress.push(_p); }
 _prcSaveAssignment(_a); _prcSaveProgress(_p);
 return true;
}
// Bulk-assign the whole pathway. Returns the count actually assigned (skips duplicates).
function assignAllPrcModules(sid,by){let n=0;PRECEPTOR_MODULES.forEach(m=>{if(assignPrcModule(sid,m.id,by,'certification',null))n++;});return n;}

function savePrcGateScore(sid,mid,gate,score){
 if(!DB.preceptorProgress) DB.preceptorProgress=[];
 let p=DB.preceptorProgress.find(x=>x.staffId===sid&&x.moduleId===mid);
 if(!p){p={staffId:sid,moduleId:mid,g1:{status:'open',score:0,attempts:[]},g2:{status:'open',score:0,attempts:[]},g3:{status:'open',items:[]},complete:false};DB.preceptorProgress.push(p);}
 const m=PRECEPTOR_MODULES.find(x=>x.id===mid);const thr=m?prcKThresh(m):90;
 const g=p[gate];g.attempts.push({date:new Date().toISOString().slice(0,10),score});
 g.score=Math.max(g.score||0,score);
 if(score>=thr) g.status='pass'; else if(g.status!=='pass') g.status='attempted';
 // Complete = 3 Knowledge passes (at this level's threshold) AND G3 capstone confirmed.
 if(prcGatePasses(p.g1,thr)>=FND_PASSES_REQUIRED&&p.g3.status==='pass'){p.complete=true;const a=(DB.preceptorAssignments||[]).find(x=>x.staffId===sid&&x.moduleId===mid);if(a)a.status='completed';}
 _prcSaveProgress(p);
 if(p.complete) _prcSaveAssignmentStatus(sid,mid,'completed');
 return p;
}
function markPrcG3Item(sid,mid,itemId,confirmed,by){
 let p=(DB.preceptorProgress||[]).find(x=>x.staffId===sid&&x.moduleId===mid);if(!p) return;
 const m=PRECEPTOR_MODULES.find(x=>x.id===mid);if(!m) return;
 // Ph3: a preceptor candidate's Gate-3 must be confirmed by someone qualified (a certified
 // preceptor or above). Revoking (confirmed=false) stays open to any leader. Belt-confirmation
 // authority elsewhere is unaffected — this guard is preceptor-curriculum-specific.
 if(confirmed && !prcConfirmerQualified(typeof ST!=='undefined'?ST.user:null)){
   if(typeof toast==='function') toast('Only a certified preceptor (or Master Admin / Assessor) can confirm this observation capstone.','err');
   return;
 }
 const thr=prcKThresh(m);
 // Capstone cannot be CONFIRMED until 3 Knowledge passes are in (revoking stays
 // allowed; complete modules exempt). Mirrors Foundations' observation lock.
 if(confirmed&&!p.complete&&!prcObsReady(m,p)){
   if(typeof toast==='function') toast('Observation is locked: needs 3 Knowledge passes first (K '+prcGatePasses(p.g1,thr)+'/'+FND_PASSES_REQUIRED+').','err');
   return;
 }
 const ex=p.g3.items.find(i=>i.id===itemId);
 if(ex){ex.confirmed=confirmed;ex.confirmedBy=by;ex.date=new Date().toISOString().slice(0,10);}
 else{p.g3.items.push({id:itemId,confirmed,confirmedBy:by,date:new Date().toISOString().slice(0,10)});}
 // Revoke cascade (mirrors Foundations 8.2): unchecking reverts G3 pass -> open
 // and a previously complete module reverts to in-progress.
 const allDone=prcObsItems(m).every(o=>p.g3.items.some(i=>i.id===o.id&&i.confirmed));
 if(allDone){p.g3.status='pass';p.g3.score=100;}
 else if(p.g3.status==='pass'){p.g3.status='open';p.g3.score=0;}
 const a=(DB.preceptorAssignments||[]).find(x=>x.staffId===sid&&x.moduleId===mid);
 if(prcGatePasses(p.g1,thr)>=FND_PASSES_REQUIRED&&p.g3.status==='pass'){
   p.complete=true; if(a)a.status='completed';
 } else if(p.complete){
   p.complete=false; if(a)a.status='assigned';
   _prcSaveAssignmentStatus(sid,mid,'assigned');
 }
 _prcSaveProgress(p);
 if(p.complete) _prcSaveAssignmentStatus(sid,mid,'completed');
}

// ── Staff Portal: Render Preceptor (reuses Foundations UI patterns) ──
function renderSPreceptor(){
 const el=document.getElementById('s-preceptor');if(!el)return;
 const s=getStaff(ST.staffId);if(!s){el.innerHTML='<div class="empty-state"><div class="empty-ttl">No Staff Record</div></div>';return;}
 const assignments=getPreceptorAssignments(s.id);
 const totalA=assignments.length,totalC=assignments.filter(a=>a.status==='completed').length;
 const prcRevoked=prcAccessState(s.id)==='revoked'; // Ph3: revoke preserves progress but locks the reader
 let html='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Preceptor Certification</div>';
 if(totalA>0) html+='<span class="pill p-gold">'+totalC+'/'+totalA+' completed</span>';
 html+='</div><div class="card-body"><p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 12px">The facilitator certification pathway: 15 modules across three levels (Facilitator, Advanced, Master). Each module has a scored Knowledge gate; Simulation is assessor-administered and Observation is leader-confirmed. Modules are activated by your educator or manager.</p>';
 if(prcRevoked) html+='<div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:var(--r);padding:12px 16px;display:flex;align-items:center;gap:10px"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" style="flex-shrink:0"><rect x="4" y="8" width="12" height="8" rx="2" stroke="#f87171" stroke-width="1.4"/><path d="M7 8V6a3 3 0 016 0v2" stroke="#f87171" stroke-width="1.4" stroke-linecap="round"/></svg><span style="font-size:13px;color:#f87171;font-weight:600">Preceptor access revoked — your progress is preserved. Modules are locked until a Master Admin restores access.</span></div>';
 if(totalA>0&&totalC===totalA){html+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:12px 16px;display:flex;align-items:center;gap:10px"><svg viewBox="0 0 20 20" width="20" height="20" fill="none"><circle cx="10" cy="10" r="9" stroke="#4ade80" stroke-width="1.5"/><path d="M6 10.5l2.5 2.5L14 7.5" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font-size:13px;color:#4ade80;font-weight:600">All assigned modules completed</span></div>';}
 html+='</div></div>';
 // Apply→approve access gate (Ignacio 2026-07-23): only a master-admin GRANT opens the
 // module list. Belt-eligible candidates see an Apply card; pending shows a status card.
 const _prcAccSt=prcAccessState(s.id);
 if(_prcAccSt!=='granted'){
   if(_prcAccSt==='requested'){
     html+='<div class="card mb16"><div class="card-body" style="display:flex;align-items:center;gap:10px"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" style="flex-shrink:0"><circle cx="10" cy="10" r="8" stroke="#c49a20" stroke-width="1.4"/><path d="M10 6v4l2.5 1.5" stroke="#c49a20" stroke-width="1.4" stroke-linecap="round"/></svg><div><div style="font-size:13px;color:#e2e8f0;font-weight:600">Application submitted</div><div style="font-size:12px;color:#94a3b8">A master admin will review your preceptor school application.</div></div></div></div>';
   } else if(!prcRevoked && prcCanApply(s.id)){
     html+='<div class="card mb16"><div class="card-body"><p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 12px">You are eligible to join the preceptor school. Submit an application and a master admin will approve your access to the full pathway.</p><button class="btn btn-gold" onclick="prcApply()">Apply for Preceptor School</button></div></div>';
   } else if(!prcRevoked){
     html+='<div class="card mb16"><div class="card-body" style="font-size:13px;color:#94a3b8">Reach Green Belt to become eligible to apply for the preceptor school.</div></div>';
   }
   el.innerHTML=html; el.scrollTop=0; return;
 }
 let curLevel=null;
 PRECEPTOR_MODULES.forEach(m=>{
   if(m.level!==curLevel){curLevel=m.level;html+='<div style="font-size:11px;color:#c49a20;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin:18px 0 10px">'+m.levelLabel+'</div>';}
   const assigned=isPrcModuleAssigned(s.id,m.id),gates=getPrcModuleGates(s.id,m.id),complete=gates.complete;
   html+='<div class="card mb16 fnd-card'+(assigned?' fnd-unlocked':' fnd-locked')+'"><div class="card-hd" style="flex-wrap:wrap;gap:8px"><div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1"><div class="fnd-num'+(complete?' fnd-num-done':'')+'">'+m.seq+'</div><div style="min-width:0"><div class="card-ttl" style="font-size:14px;margin:0">'+m.title+'</div><div style="font-size:11px;color:#64748b;margin-top:2px">'+m.levelLabel+' · Module '+m.levelPos+'</div></div></div>';
   if(assigned){html+='<div style="display:flex;gap:4px;align-items:center" title="G1: Knowledge | G2: Simulation (assessor) | G3: Observation">'+fndGateBadge(gates.g1.status)+fndGateBadge(gates.g2.status)+fndGateBadge(gates.g3.status)+'<span style="margin-left:6px">'+prcPassChip(m,gates)+'</span></div>';}
   else{html+='<span class="pill p-muted" style="opacity:.5"><svg viewBox="0 0 14 14" width="11" height="11" fill="none" style="margin-right:3px;vertical-align:-1px"><rect x="1" y="5" width="12" height="8" rx="2" stroke="#64748b" stroke-width="1.3"/><path d="M4 5V4a3 3 0 016 0v1" stroke="#64748b" stroke-width="1.3" stroke-linecap="round"/></svg>Locked</span>';}
   html+='</div><div class="card-body" style="padding-top:0"><p style="font-size:12.5px;color:#94a3b8;line-height:1.5;margin:0 0 8px">'+(m.contentPending?'Reader content is pending; the Gate 1 knowledge check is available.':'Self-paced facilitator reader with a scored Knowledge gate (pass at '+prcKThresh(m)+'%).')+'</p>';
   if(assigned){html+='<div style="display:flex;gap:12px;flex-wrap:wrap;margin:10px 0"><div class="fnd-gate-lbl">'+fndGateBadge(gates.g1.status)+'<span>Knowledge '+Math.min(prcGatePasses(gates.g1,prcKThresh(m)),FND_PASSES_REQUIRED)+'/'+FND_PASSES_REQUIRED+(gates.g1.score>0?' ('+gates.g1.score+'%)':'')+'</span></div><div class="fnd-gate-lbl">'+fndGateBadge(gates.g2.status)+'<span>Simulation (assessor)</span></div><div class="fnd-gate-lbl">'+fndGateBadge(gates.g3.status)+'<span>Observation'+(gates.g3.status==='pass'?' (Confirmed)':'')+'</span></div></div>'+(prcRevoked?'<div style="font-size:12px;color:#f87171;margin-top:8px;display:flex;align-items:center;gap:6px"><svg viewBox="0 0 14 14" width="11" height="11" fill="none"><rect x="1" y="5" width="12" height="8" rx="2" stroke="#f87171" stroke-width="1.3"/><path d="M4 5V4a3 3 0 016 0v1" stroke="#f87171" stroke-width="1.3" stroke-linecap="round"/></svg>Locked — preceptor access revoked</div>':'<button class="btn btn-gold btn-sm" style="margin-top:8px" onclick="openPrcModule(\''+m.id+'\')">'+(complete?'Review':'Open Module')+'</button>');}
   html+='</div></div>';
 });
 el.innerHTML=html;
}

// ── Module Viewer (reuses Foundations gate UI) ──
function openPrcModule(mid){
 const m=PRECEPTOR_MODULES.find(x=>x.id===mid);if(!m)return;
 const s=getStaff(ST.staffId);if(!s)return;
 if(prcAccessState(s.id)==='revoked'){ if(typeof toast==='function')toast('Preceptor access revoked — modules are locked. Your progress is preserved.','err'); return renderSPreceptor(); } // Ph3
 const gates=getPrcModuleGates(s.id,m.id);
 ST._prcTab=ST._prcTab||'content';
 renderPrcModuleTab(m,s,gates,ST._prcTab);
}
// Structured reader renderer — typed blocks re-extracted from the source workbooks
// so the on-screen reader mirrors the document's structure (headings, callouts,
// numbered phases, self-scoring checklists) instead of a flattened text blob.
// Also tolerates the legacy {heading,text} shape so a stale reader never breaks.
const PRC_CALLOUT_CLASS={ 'KEY IDEA':'prc-co-key','EXAMPLE':'prc-co-example','DO THIS':'prc-co-do','WATCH OUT':'prc-co-watch','IN YOUR WORDS':'prc-co-words' };
function prcCalloutClass(label){ return PRC_CALLOUT_CLASS[String(label||'').trim().toUpperCase()]||'prc-co-key'; }
function prcRenderReader(reader){
 const sz=Security.sanitize;
 let html='<div class="prc-doc">';
 reader.forEach(b=>{
  // Legacy fallback: {heading,text} → section title + body
  if(b && b.t===undefined && (b.heading!==undefined||b.text!==undefined)){
   html+='<div class="fnd-section">'+(b.heading?'<div class="fnd-section-title">'+sz(b.heading)+'</div>':'')+'<div class="fnd-section-body" style="white-space:pre-wrap">'+sz(b.text||'')+'</div></div>';
   return;
  }
  switch(b.t){
   case 'section': html+='<div class="prc-section">'+sz(b.text)+'</div>'; break;
   case 'h1': html+='<div class="prc-h1">'+sz(b.text)+'</div>'; break;
   case 'h2': html+='<div class="prc-h2">'+sz(b.text)+'</div>'; break;
   case 'p': html+='<p class="prc-p">'+sz(b.text)+'</p>'; break;
   case 'list':
    html+='<ul class="prc-list">'+(b.items||[]).map(it=>'<li>'+sz(it)+'</li>').join('')+'</ul>'; break;
   case 'numlist':
    html+='<ol class="prc-numlist">'+(b.items||[]).map(it=>'<li>'+sz(it&&it.text!==undefined?it.text:it)+'</li>').join('')+'</ol>'; break;
   case 'callout':
    html+='<div class="prc-callout '+prcCalloutClass(b.label)+'"><div class="prc-callout-label">'+sz(b.label||'')+'</div><div class="prc-callout-body">'+sz(b.text||'')+'</div></div>'; break;
   case 'checklist':
    html+='<div class="prc-check">'+(b.title?'<div class="prc-check-title">'+sz(b.title)+'</div>':'')+(b.items||[]).map(it=>'<div class="prc-check-row"><span class="prc-check-box"></span><span>'+sz(it&&it.text!==undefined?it.text:it)+'</span></div>').join('')+'</div>'; break;
   default:
    if(b.text) html+='<p class="prc-p">'+sz(b.text)+'</p>';
  }
 });
 return html+'</div>';
}
function renderPrcModuleTab(m,s,gates,tab){
 ST._prcTab=tab;
 const el=document.getElementById('s-preceptor');
 const tabBtn=(id,label,active)=>'<div class="tab'+(active?' on':'')+'" onclick="ST._prcTab=\''+id+'\';openPrcModule(\''+m.id+'\')">'+label+'</div>';
 let html='<div class="fnd-reader"><button class="btn btn-ghost btn-sm" onclick="renderSPreceptor()" style="margin-bottom:12px">&larr; Back</button>';
 html+='<div style="font-size:11px;color:#c49a20;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">'+m.levelLabel+' · Module '+m.levelPos+'</div>';
 html+='<div style="font-size:20px;font-weight:700;color:#e2e8f0">'+m.title+'</div><div style="font-size:13px;color:#94a3b8;margin-top:2px">Module '+m.seq+' of '+PRECEPTOR_MODULES.length+'</div>';
 html+='<div style="display:flex;gap:14px;margin:12px 0;flex-wrap:wrap"><div class="fnd-gate-lbl">'+fndGateBadge(gates.g1.status)+'<span>Knowledge '+Math.min(prcGatePasses(gates.g1,prcKThresh(m)),FND_PASSES_REQUIRED)+'/'+FND_PASSES_REQUIRED+'</span></div><div class="fnd-gate-lbl">'+fndGateBadge(gates.g2.status)+'<span>Simulation (assessor)</span></div><div class="fnd-gate-lbl">'+fndGateBadge(gates.g3.status)+'<span>Observation</span></div></div>';
 html+='<div class="tab-bar" style="margin-bottom:16px">'+tabBtn('content','Content',tab==='content')+tabBtn('gate1','Gate 1: Knowledge',tab==='gate1')+tabBtn('gate2','Gate 2: Simulation',tab==='gate2')+tabBtn('gate3','Gate 3: Observation',tab==='gate3')+'</div>';
 if(tab==='content'){
   if(m.contentPending||!m.reader||!m.reader.length){html+='<div style="background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.25);border-radius:var(--r);padding:14px 16px;font-size:13px;color:#94a3b8">Reader content for this module is being finalized. The Gate 1 knowledge check is available now; the workbook reader drops in as a content-only update.</div>';}
   else{html+=prcRenderReader(m.reader);}
 } else if(tab==='gate1'){
   html+=renderPrcGateAssessment(m,s,'g1',m.knowledge,'Knowledge Check','Select the best answer for each question. '+prcKThresh(m)+'% required to pass; three passes complete the gate.');
 } else if(tab==='gate2'){
   html+=renderPrcGate2Reference(m);
 } else if(tab==='gate3'){
   html+=renderPrcG3View(m,s,gates);
 }
 html+='</div>';
 el.innerHTML=html;el.scrollTop=0;
}

// Per-attempt shuffled question order + practice-retake flags (mirrors foundations.js).
const PRC_GATE_DRAW=10;
let PRC_GATE_ORDER={};
let PRC_GATE_RETAKE={};
function retakePrcGate(mid,gk){
 PRC_GATE_RETAKE[mid+gk]=true;
 ST._prcTab='gate1';
 openPrcModule(mid);
}
// Gate 1 Knowledge — candidate-scored. Items carry {n,q,options,answer:'B'};
// the correct index derives from the answer letter (A=0, B=1, ...).
function renderPrcGateAssessment(m,s,gk,items,title,desc){
 const gates=getPrcModuleGates(s.id,m.id),g=gates[gk],thr=prcKThresh(m);
 const retake=!!PRC_GATE_RETAKE[m.id+gk];
 const passes=prcGatePasses(g,thr);
 const gateDone=passes>=FND_PASSES_REQUIRED;
 const locked=gateDone&&!retake;
 const order=shuffleArray(items.map((_,i)=>i)).slice(0,PRC_GATE_DRAW);
 PRC_GATE_ORDER[m.id+gk]=order;
 let h='<div class="fnd-kc"><div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">'+title+'</div><div style="font-size:12px;color:#94a3b8;margin-bottom:16px">'+desc+'</div>';
 if(locked){h+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px;text-align:center;margin-bottom:16px"><div style="font-size:20px;font-weight:700;color:#4ade80">'+passes+' of '+FND_PASSES_REQUIRED+' passes</div><div style="font-size:13px;color:#4ade80;font-weight:600">Gate Complete &mdash; best score '+g.score+'%</div><button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="retakePrcGate(\''+m.id+'\',\''+gk+'\')">Retake (practice)</button></div>';}
 else if(retake&&gateDone){h+='<div style="background:rgba(196,154,32,.08);border:1px solid rgba(196,154,32,.25);border-radius:var(--r);padding:10px 14px;margin-bottom:16px;font-size:12px;color:#94a3b8">Practice retake &mdash; your completed gate and best score ('+g.score+'%) are kept even if you score lower.</div>';}
 else if(passes>0){h+='<div style="background:rgba(196,154,32,.08);border:1px solid rgba(196,154,32,.25);border-radius:var(--r);padding:10px 14px;margin-bottom:16px;font-size:12px;color:#94a3b8"><b style="color:#fbbf24">Pass '+passes+' of '+FND_PASSES_REQUIRED+'.</b> Take the test again with a fresh set of questions &mdash; every score of '+thr+'% or higher counts as a pass. Your best score ('+g.score+'%) is kept.</div>';}
 order.forEach((origIdx,qi)=>{const item=items[origIdx];h+='<div class="fnd-q" data-qi="'+qi+'"><div class="fnd-q-text">'+(qi+1)+'. '+Security.sanitize(item.q)+'</div>';item.options.forEach((opt,oi)=>{h+='<label class="fnd-q-opt"><input type="radio" name="prc-'+gk+'-'+m.id+'-'+qi+'" value="'+oi+'"'+(locked?' disabled':'')+'><span class="fnd-q-lbl">'+Security.sanitize(opt)+'</span></label>';});h+='</div>';});
 if(!locked) h+='<button class="btn btn-gold" style="margin-top:16px;width:100%" onclick="submitPrcGate(\''+m.id+'\',\''+gk+'\')">Submit</button>';
 h+='<div id="prc-gate-result"></div></div>';return h;
}
function submitPrcGate(mid,gk){
 const m=PRECEPTOR_MODULES.find(x=>x.id===mid);if(!m)return;const s=getStaff(ST.staffId);if(!s)return;
 const items=m.knowledge,thr=prcKThresh(m);
 const order=PRC_GATE_ORDER[m.id+gk]||items.map((_,i)=>i).slice(0,PRC_GATE_DRAW);
 delete PRC_GATE_RETAKE[m.id+gk];
 const ansIdx=item=>(String(item.answer||'A').trim().toUpperCase().charCodeAt(0)-65);
 let correct=0;
 order.forEach((origIdx,qi)=>{const sel=document.querySelector('input[name="prc-'+gk+'-'+m.id+'-'+qi+'"]:checked');if(sel&&parseInt(sel.value)===ansIdx(items[origIdx])) correct++;});
 const score=Math.round((correct/order.length)*100);savePrcGateScore(s.id,m.id,gk,score);
 order.forEach((origIdx,qi)=>{const item=items[origIdx];const ci=ansIdx(item);const opts=document.querySelectorAll('input[name="prc-'+gk+'-'+m.id+'-'+qi+'"]');opts.forEach((opt,oi)=>{const lbl=opt.closest('.fnd-q-opt');if(!lbl)return;opt.disabled=true;if(oi===ci)lbl.classList.add('fnd-q-correct');else if(opt.checked&&oi!==ci)lbl.classList.add('fnd-q-wrong');});});
 const rEl=document.getElementById('prc-gate-result');
 if(rEl){if(score>=thr){const _g2=getPrcModuleGates(s.id,m.id);const _n=Math.min(prcGatePasses(_g2[gk],thr),FND_PASSES_REQUIRED);const _done=_n>=FND_PASSES_REQUIRED;const _obsNow=_done&&_g2.g3.status!=='pass';rEl.innerHTML='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#4ade80">'+score+'%</div><div style="font-size:13px;color:#4ade80;font-weight:600;margin:4px 0">'+(_done?'Knowledge Gate Complete &mdash; '+_n+' of '+FND_PASSES_REQUIRED+' passes':'Knowledge pass '+_n+' of '+FND_PASSES_REQUIRED)+'</div><div style="font-size:12px;color:#94a3b8">'+correct+' of '+order.length+' correct.'+(_done?(_obsNow?' The observation capstone is now ready for your assessor.':''):' Take it again with a fresh set of questions; '+thr+'%+ counts as a pass.')+'</div>'+(_done?'':'<button class="btn btn-gold btn-sm" style="margin-top:8px" onclick="openPrcModule(\''+mid+'\')">Take Again (fresh questions)</button>')+'</div>';toast(_done?'Knowledge gate complete ('+_n+'/'+FND_PASSES_REQUIRED+')':'Knowledge pass '+_n+' of '+FND_PASSES_REQUIRED,'ok');}
 else{rEl.innerHTML='<div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:var(--r);padding:14px 16px;text-align:center;margin-top:12px"><div style="font-size:24px;font-weight:700;color:#f87171">'+score+'%</div><div style="font-size:13px;color:#f87171;font-weight:600;margin:4px 0">Not Yet Passing</div><div style="font-size:12px;color:#94a3b8">'+correct+' of '+order.length+' correct. '+thr+'% required. This module needs another attempt &mdash; retake with fresh questions.</div><button class="btn btn-gold btn-sm" style="margin-top:8px" onclick="openPrcModule(\''+mid+'\')">Retake with fresh questions</button></div>';toast('Score: '+score+'%. '+thr+'% required.','err');}}
}

// Gate 2 Simulation — read-only assessor-administered reference (level capstone panel).
// ── Phase 2: proctoring PIN handshake for the assessor-administered gates ──
// Ignacio 2026-07-23: Simulation + Observation run through the belt-style PIN
// handshake. The assessor generates a one-time PIN (assessment_type 'preceptor');
// the candidate enters it on their device to confirm co-presence before the
// assessor conducts and records the gate. No enum constraint on assessment_type,
// so this reuses the existing sbd-assessor-pin flow as-is.
function prcPinHandshakeCard(gateLabel){
 return '<div style="background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.28);border-radius:var(--r);padding:12px 14px;margin:0 0 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
   +'<svg viewBox="0 0 20 20" width="16" height="16" fill="none" style="flex-shrink:0"><rect x="4" y="9" width="12" height="8" rx="2" stroke="#8b5cf6" stroke-width="1.4"/><path d="M7 9V7a3 3 0 016 0v2" stroke="#8b5cf6" stroke-width="1.4" stroke-linecap="round"/></svg>'
   +'<div style="flex:1;min-width:180px"><div style="font-size:12.5px;color:#e2e8f0;font-weight:600">Assessor-proctored '+gateLabel+'</div><div style="font-size:11.5px;color:#94a3b8">When your assessor is ready, enter the PIN they generate to begin.</div></div>'
   +'<button class="btn btn-gold btn-sm" onclick="prcEnterAssessorPin()">Enter Assessor PIN</button>'
   +'</div>';
}
function prcEnterAssessorPin(){
 const s=(typeof getStaff==='function')?getStaff(ST.staffId):null; if(!s){if(typeof toast==='function')toast('No staff record.','err');return;}
 if(typeof showAssessorPinGate!=='function'){if(typeof toast==='function')toast('PIN gate unavailable.','err');return;}
 showAssessorPinGate(s.id,'preceptor',function(){ if(typeof toast==='function')toast('Authorized. Your assessor will now conduct and record the assessment.','ok'); });
}
// Assessor-side: generate the proctoring PIN for a candidate's preceptor assessment.
function prcAssessorPinBtn(sid){
 return '<button class="btn btn-ghost btn-xs" style="border-color:rgba(139,92,246,.4);color:#a78bfa" onclick="showGeneratePinModal(\''+sid+'\',\'preceptor\')" title="Generate a one-time PIN for the candidate to begin the proctored assessment"><svg viewBox="0 0 20 20" width="12" height="12" fill="none" style="vertical-align:-2px;margin-right:4px"><rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M7 9V7a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Generate Assessment PIN</button>';
}
function renderPrcGate2Reference(m){
 const lg=prcLevelGate(m.level);
 const sims=(lg&&lg.gate2&&lg.gate2.simulations)||[];
 let h='<div class="fnd-kc"><div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">Simulation (Assessor-Administered)</div><div style="font-size:12px;color:#94a3b8;margin-bottom:16px">These '+m.levelLabel+' simulations are scored by an assessor, not auto-graded here. Pass standard: '+prcSThresh(m)+'%. Use them to prepare.</div>';
 if(!sims.length){h+='<div style="background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.25);border-radius:var(--r);padding:14px 16px;font-size:13px;color:#94a3b8">The '+m.levelLabel+' simulation set is administered directly by your assessor at the level capstone.</div>';}
 sims.forEach(sim=>{
   h+='<div class="fnd-section"><div class="fnd-section-title">Simulation '+sim.n+': '+Security.sanitize(sim.title||'')+'</div><div class="fnd-section-body" style="white-space:pre-wrap">'+Security.sanitize(sim.scenario||'')+'</div>';
   if(sim.scoringGuide&&sim.scoringGuide.length){h+='<div style="margin-top:8px;font-size:11px;color:#c49a20;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Assessor scoring guide</div><div style="font-size:12px;color:#94a3b8;line-height:1.6">';sim.scoringGuide.forEach(row=>{const t=String(row).replace(/^\|\s*/,'');h+='<div style="padding:2px 0">'+Security.sanitize(t)+'</div>';});h+='</div>';}
   h+='</div>';
 });
 h+='</div>';return h;
}

// Gate 3 Observation — candidate-facing status (leader confirms in the Hospital portal).
function renderPrcG3View(m,s,gates){
 const lg=prcLevelGate(m.level);
 let h='<div class="fnd-kc"><div style="font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:4px">Observation / Practicum Capstone</div><div style="font-size:12px;color:#94a3b8;margin-bottom:16px">Your assessor confirms the '+m.levelLabel+' practicum after observing you at the '+prcOThresh(m)+'% standard. You cannot self-confirm this item.</div>'+(gates.g3.status==='pass'?'':prcPinHandshakeCard('Observation'));
 if(!gates.complete&&!prcObsReady(m,gates)){h+='<div style="background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.25);border-radius:var(--r);padding:12px 14px;margin-bottom:16px;font-size:12px;color:#94a3b8">The capstone unlocks after <b style="color:#e2e8f0">3 Knowledge</b> passes (fresh questions each attempt). Current: '+prcPassChip(m,gates)+'</div>';}
 if(gates.g3.status==='pass') h+='<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);border-radius:var(--r);padding:14px;text-align:center;margin-bottom:16px"><div style="font-size:16px;font-weight:700;color:#4ade80">Capstone Confirmed</div></div>';
 prcObsItems(m).forEach(obs=>{const conf=gates.g3.items.find(i=>i.id===obs.id&&i.confirmed);h+='<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">';if(conf){h+='<svg viewBox="0 0 18 18" width="16" height="16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="9" cy="9" r="8" fill="rgba(74,222,128,.15)" stroke="#4ade80" stroke-width="1.3"/><path d="M5.5 9.5l2.5 2.5L13 7" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><div><div style="font-size:13px;color:#4ade80">'+obs.text+'</div><div style="font-size:11px;color:#64748b;margin-top:2px">Confirmed by '+Security.sanitize(conf.confirmedBy||'—')+' on '+Security.sanitize(conf.date||'')+'</div></div>';}else{h+='<svg viewBox="0 0 18 18" width="16" height="16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="9" cy="9" r="8" stroke="#475569" stroke-width="1.3"/></svg><div style="font-size:13px;color:#94a3b8">'+obs.text+'</div>';}h+='</div>';});
 if(lg&&lg.gate3&&lg.gate3.rubric&&lg.gate3.rubric.length){h+='<div style="margin-top:14px;font-size:11px;color:#c49a20;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Observation rubric (assessor reference)</div><ul style="margin:6px 0 0;padding-left:18px;font-size:12px;color:#94a3b8;line-height:1.6">';lg.gate3.rubric.forEach(r=>{h+='<li>'+Security.sanitize(String(r.category||''))+(r.weight!=null?' <span style="color:#64748b">('+Security.sanitize(String(r.weight))+'%)</span>':'')+'</li>';});h+='</ul>';}
 if(lg&&lg.gate3&&lg.gate3.autoFail&&lg.gate3.autoFail.length){h+='<div style="margin-top:14px;font-size:11px;color:#f87171;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Automatic-fail conditions (assessor reference)</div><ul style="margin:6px 0 0;padding-left:18px;font-size:12px;color:#94a3b8;line-height:1.6">';lg.gate3.autoFail.forEach(a=>{h+='<li>'+Security.sanitize(String(a))+'</li>';});h+='</ul>';}
 h+='</div>';return h;
}

// ── Hospital Portal: Render Preceptor ──
function renderHPreceptor(){
 // Renders in the Hospital Portal (h-preceptor) or, for master/staff admins, the
 // Network Admin portal (a-preceptor) — same view, container picked by portal.
 const el=document.getElementById(ST.portal==='admin'?'a-preceptor':'h-preceptor');if(!el)return;
 // Role scope mirrors Foundations/Instruments: master_admin/admin/staff_admin/assessor
 // see ALL facilities; educator/manager/facility_admin/hospital see their own.
 const _u=ST.user;
 const isSystemWide=!!(_u&&['master_admin','admin','staff_admin','assessor'].includes(_u.role));
 const isAssessor=!!(_u&&(_u.role==='staff_admin'||_u.role==='assessor'));
 let scopeFacs=DB.facilities.filter(f=>f.active!==false);
 if(isSystemWide&&_u.role==='staff_admin'&&(_u.assignedFids||[]).length) scopeFacs=scopeFacs.filter(f=>_u.assignedFids.includes(f.id));
 let staff;
 if(isSystemWide){
   staff=DB.staff.filter(s=>scopeFacs.some(f=>f.id===s.fid));
   const ff=ST._prcFacFilter||'all';
   if(ff!=='all') staff=staff.filter(s=>s.fid===ff);
 } else {
   staff=DB.staff.filter(s=>s.fid===ST.hFid);
 }
 let totalA=0,totalC=0,staffWith=0;const rows=[];
 staff.forEach(s=>{const asgns=getPreceptorAssignments(s.id);const done=asgns.filter(a=>a.status==='completed').length;if(asgns.length>0){staffWith++;totalA+=asgns.length;totalC+=done;}rows.push({s,assigned:asgns.length,done,pct:asgns.length>0?Math.round(done/asgns.length*100):0});});
 let html='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Preceptor Certification'+(isSystemWide?' <span style="font-size:11px;color:#64748b;font-weight:500">(all facilities)</span>':'')+'</div></div><div class="card-body"><p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 16px">Assign the facilitator certification pathway. Each module has a scored Knowledge gate; Simulation is assessor-administered and the Observation capstone is leader-confirmed.</p>';
 if(isSystemWide){html+='<div style="margin-bottom:14px"><select class="form-select" style="max-width:280px" onchange="ST._prcFacFilter=this.value;renderHPreceptor()"><option value="all"'+((ST._prcFacFilter||"all")==="all"?" selected":"")+'>All Facilities</option>'+scopeFacs.slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(f=>'<option value="'+f.id+'"'+(ST._prcFacFilter===f.id?" selected":"")+'>'+f.name+'</option>').join("")+'</select></div>';}
 html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:8px"><div class="stat-card-mini"><div class="stat-lbl">Enrolled</div><div class="stat-val">'+staffWith+'</div></div><div class="stat-card-mini"><div class="stat-lbl">Assigned</div><div class="stat-val">'+totalA+'</div></div><div class="stat-card-mini"><div class="stat-lbl">Completed</div><div class="stat-val" style="color:#4ade80">'+totalC+'</div></div><div class="stat-card-mini"><div class="stat-lbl">Rate</div><div class="stat-val">'+(totalA>0?Math.round(totalC/totalA*100):0)+'%</div></div></div></div></div>';
 html+=_prcApplyQueueHTML();
 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">Staff Preceptor Progress</div></div><div class="card-body" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th>'+(isSystemWide?'<th>Facility</th>':'')+'<th>Belt</th><th>Modules</th><th>Actions</th></tr></thead><tbody>';
 rows.sort((a,b)=>fullName(a.s).localeCompare(fullName(b.s)));
 rows.forEach(r=>{html+='<tr><td style="font-weight:600">'+fullName(r.s)+'</td>'+(isSystemWide?'<td style="font-size:12px;color:#94a3b8">'+((DB.facilities.find(f=>f.id===r.s.fid)||{}).name||'—')+'</td>':'')+'<td><span class="bb bb-'+r.s.belt+'">'+r.s.belt+'</span></td><td>'+(r.assigned>0?'<span class="'+(r.pct===100?'tc-ok':r.pct>0?'tc-warn':'tc-muted')+'">'+r.done+'/'+r.assigned+'</span>':'<span class="tc-muted">None</span>')+'</td><td style="white-space:nowrap">';
 if(r.assigned>0) html+='<button class="btn btn-ghost btn-xs" onclick="hPrcStaffDetail(\''+r.s.id+'\')">View</button> ';
 if(!isAssessor){
 if(r.assigned<PRECEPTOR_MODULES.length) html+='<button class="btn btn-gold btn-xs" onclick="hAssignPrcModal(\''+r.s.id+'\')">Assign</button> ';
 if(r.assigned===0) html+='<button class="btn btn-blue btn-xs" onclick="hAssignAllPrc(\''+r.s.id+'\')">All '+PRECEPTOR_MODULES.length+'</button>';
 }
 html+='</td></tr>';});
 html+='</tbody></table></div></div></div>';el.innerHTML=html;
}
function hPrcStaffDetail(sid){
 const s=getStaff(sid);if(!s)return;const el=document.getElementById(ST.portal==='admin'?'a-preceptor':'h-preceptor');if(!el)return;
 const prcRevoked=prcAccessState(s.id)==='revoked'; // Ph3: locked read-only, progress preserved
 let html='<button class="btn btn-ghost btn-sm" onclick="renderHPreceptor()" style="margin-bottom:12px">&larr; Back</button>';
 html+='<div class="card mb16"><div class="card-hd"><div class="card-ttl">'+fullName(s)+'</div><span class="bb bb-'+s.belt+'">'+s.belt+'</span></div><div class="card-body"><div style="font-size:13px;color:#94a3b8">'+s.role+'</div></div></div>';
 if(prcRevoked) html+='<div class="card mb16" style="border-color:rgba(248,113,113,.3)"><div class="card-body" style="display:flex;align-items:center;gap:10px"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" style="flex-shrink:0"><rect x="4" y="8" width="12" height="8" rx="2" stroke="#f87171" stroke-width="1.4"/><path d="M7 8V6a3 3 0 016 0v2" stroke="#f87171" stroke-width="1.4" stroke-linecap="round"/></svg><span style="font-size:13px;color:#f87171;font-weight:600">Preceptor access revoked — progress preserved and locked. A Master Admin can restore access to unlock; nothing has been deleted.</span></div></div>';
 PRECEPTOR_MODULES.forEach(m=>{
   if(!isPrcModuleAssigned(s.id,m.id)) return;const gates=getPrcModuleGates(s.id,m.id);
   const a=getPreceptorAssignments(s.id).find(x=>x.moduleId===m.id);
   html+='<div class="card mb16"><div class="card-hd" style="flex-wrap:wrap;gap:8px"><div style="display:flex;align-items:center;gap:8px"><div class="fnd-num'+(gates.complete?' fnd-num-done':'')+'">'+m.seq+'</div><div class="card-ttl" style="font-size:14px;margin:0">'+m.title+'</div></div><div style="display:flex;gap:4px;align-items:center">'+fndGateBadge(gates.g1.status)+fndGateBadge(gates.g2.status)+fndGateBadge(gates.g3.status)+((ST.user&&ST.user.role==='master_admin')?'<button class="btn btn-ghost btn-xs" style="margin-left:8px;border-color:rgba(239,68,68,.4);color:#f87171" onclick="hUnassignPrc(\''+s.id+'\',\''+m.id+'\')">Unassign</button>':'')+'</div></div><div class="card-body" style="padding-top:0">';
   html+='<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:#94a3b8"><span>G1: '+(gates.g1.status==='pass'?'<span class="tc-ok">'+gates.g1.score+'%</span>':'<span class="tc-muted">'+gates.g1.status+'</span>')+'</span><span>G2: <span class="tc-muted">assessor</span></span><span>G3: '+(gates.g3.status==='pass'?'<span class="tc-ok">Confirmed</span>':'<span class="tc-warn">Pending</span>')+'</span></div>';
   if(a){ const _typeLbl=a.type==='onboarding'?'Onboarding':(a.type==='remediation'?'Remediation':'Certification'); html+='<div style="font-size:11px;color:#64748b;margin-bottom:12px">Assigned by '+Security.sanitize(a.assignedBy||'—')+(a.assignedDate?' · '+Security.sanitize(a.assignedDate):'')+' · '+_typeLbl+(a.trigger?' · Trigger: '+Security.sanitize(a.trigger):'')+'</div>'; }
   html+='<div style="font-size:12px;font-weight:600;color:#c49a20;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Gate 3: Confirm Observation Capstone</div>';
   if(!prcRevoked) html+='<div style="margin-bottom:10px">'+prcAssessorPinBtn(s.id)+'<span style="font-size:11px;color:#64748b;margin-left:8px">Generate a PIN for the candidate to confirm presence before you record.</span></div>';
   prcObsItems(m).forEach(obs=>{const conf=gates.g3.items.find(i=>i.id===obs.id&&i.confirmed);html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)"><input type="checkbox" style="accent-color:#4ade80;flex-shrink:0" '+(conf?'checked':'')+(prcRevoked?' disabled title="Preceptor access revoked — locked"':'')+' onchange="markPrcG3(\''+s.id+'\',\''+m.id+'\',\''+obs.id+'\',this.checked)"><span style="font-size:12.5px;color:'+(conf?'#4ade80':'#94a3b8')+'">'+obs.text+'</span></div>';});
   html+='</div></div>';
 });el.innerHTML=html;
}
function markPrcG3(sid,mid,itemId,checked){const by=ST.user?ST.user.name:'Manager';markPrcG3Item(sid,mid,itemId,checked,by);hPrcStaffDetail(sid);}
function hUnassignPrc(sid,mid){
 if(!(ST.user&&ST.user.role==='master_admin')){toast('Only the Master Admin can unassign modules','err');return;}
 if(!confirm('Unassign this module? The staff member loses access; progress history is kept.'))return;
 DB.preceptorAssignments=(DB.preceptorAssignments||[]).filter(a=>!(a.staffId===sid&&a.moduleId===mid));
 try{if(typeof IS_LIVE!=='undefined'&&IS_LIVE&&typeof SB!=='undefined'&&SB.deletePreceptorAssignment){SB.deletePreceptorAssignment(sid,mid).catch(e=>{if(typeof handleSyncError==='function')handleSyncError(e,'Preceptor unassign');});}}catch(e){}
 toast('Module unassigned','info');
 if(getPreceptorAssignments(sid).length>0) hPrcStaffDetail(sid); else renderHPreceptor();
}
function hAssignPrcModal(sid){
 if(ST.user&&(ST.user.role==='staff_admin'||ST.user.role==='assessor')){toast('Assessors cannot assign modules','err');return;}
 const s=getStaff(sid);if(!s)return;
 // Ph3: no preceptor access -> nothing can be assigned. Explain and stop.
 if(!prcHasAccess(s.id)){toast(prcAccessState(s.id)==='revoked'?'Preceptor access is revoked for this staff member — a Master Admin can re-grant it':'Not eligible for preceptor modules: reach Green Belt or have a Master Admin grant access','err');return;}
 const existing=getPreceptorAssignments(s.id);const unassigned=PRECEPTOR_MODULES.filter(m=>!existing.some(a=>a.moduleId===m.id));
 if(!unassigned.length){toast('All modules assigned','info');return;}
 let html='<div style="margin-bottom:12px;font-size:13px;color:#94a3b8">Assign to <strong style="color:#e2e8f0">'+fullName(s)+'</strong>:</div>';
 html+='<div style="margin-bottom:12px"><label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px">Reason</label>';
 html+='<select id="prc-assign-type" class="form-select" onchange="var w=document.getElementById(\'prc-trigger-wrap\');if(w)w.style.display=this.value===\'remediation\'?\'block\':\'none\'">';
 html+='<option value="certification">Certification pathway</option>';
 html+='<option value="remediation">Remediation (targeted retraining)</option>';
 html+='</select></div>';
 html+='<div id="prc-trigger-wrap" style="display:none;margin-bottom:12px"><label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px">Trigger event <span style="color:#64748b">(gate failure or incident reference, optional)</span></label>';
 html+='<input id="prc-assign-trigger" type="text" class="form-input" placeholder="e.g. G1 fail 2026-07-01 or incident #123"></div>';
 html+='<div style="max-height:300px;overflow-y:auto">';
 unassigned.forEach(m=>{
   const locked=!prcLevelUnlocked(s.id,m.level); // Ph3: L2/L3 gated behind prior-level completion
   const lockNote=locked?' <span style="color:#f87171;font-size:11px">— Level '+(m.level-1)+' must be complete first</span>':'';
   html+='<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.06);'+(locked?'opacity:.5;cursor:not-allowed':'cursor:pointer')+';font-size:13px;color:#cbd5e1"><input type="checkbox" class="prc-assign-cb" value="'+m.id+'"'+(locked?' disabled':'')+' style="accent-color:#c49a20"><span><strong>'+m.seq+'.</strong> '+m.title+' <span style="color:#64748b">('+m.levelLabel+')</span>'+lockNote+'</span></label>';
 });
 html+='</div><div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button><button class="btn btn-gold btn-sm" onclick="hDoAssignPrc(\''+s.id+'\')">Assign</button></div>';
 openModal('Assign Preceptor Modules',html,'modal-sm');
}
function hDoAssignPrc(sid){
 if(ST.user&&(ST.user.role==='staff_admin'||ST.user.role==='assessor')){toast('Assessors cannot assign modules','err');return;}
 const cbs=document.querySelectorAll('.prc-assign-cb:checked');
 if(!cbs.length){toast('Select at least one','err');return;}
 // Ph3: block entirely if the candidate has no preceptor access (revoked or belt-ineligible).
 if(!prcHasAccess(sid)){ toast(prcAccessState(sid)==='revoked'?'Preceptor access is revoked for this staff member — cannot assign':'Not eligible: reach Green Belt or have a Master Admin grant preceptor access','err'); return; }
 const nm=ST.user?ST.user.name:'Manager';
 const typeEl=document.getElementById('prc-assign-type');
 const type=(typeEl&&typeEl.value==='remediation')?'remediation':'certification';
 const trigEl=document.getElementById('prc-assign-trigger');
 const trigger=(type==='remediation'&&trigEl&&trigEl.value.trim())?trigEl.value.trim():null;
 let assigned=0,skipped=0,locked=0,lockMsg='';
 cbs.forEach(cb=>{
   const reason=prcAssignBlockReason(sid,cb.value); // Ph3: per-module access + L2/L3 prereq
   if(reason){ locked++; lockMsg=reason; return; }
   if(assignPrcModule(sid,cb.value,nm,type,trigger)) assigned++; else skipped++;
 });
 closeModal();
 if(assigned) toast(assigned+' module'+(assigned>1?'s':'')+' assigned','ok');
 if(skipped) toast(skipped+' already assigned — skipped','info');
 if(locked) toast(locked+' module'+(locked>1?'s':'')+' locked — '+lockMsg,'err');
 renderHPreceptor();
}
function hAssignAllPrc(sid){
 if(ST.user&&(ST.user.role==='staff_admin'||ST.user.role==='assessor')){toast('Assessors cannot assign modules','err');return;}
 // Ph3: no access -> nothing assignable. (assignAllPrcModules also silently guards each module.)
 if(!prcHasAccess(sid)){toast(prcAccessState(sid)==='revoked'?'Preceptor access is revoked for this staff member — cannot assign':'Not eligible: reach Green Belt or have a Master Admin grant preceptor access','err');return;}
 const assigned=assignAllPrcModules(sid,ST.user?ST.user.name:'Manager');
 const skipped=PRECEPTOR_MODULES.length-assigned;
 if(!assigned) toast('All '+PRECEPTOR_MODULES.length+' preceptor modules already assigned','info');
 else{ toast(assigned+' module'+(assigned>1?'s':'')+' assigned','ok'); if(skipped) toast(skipped+' already assigned or level-locked — skipped','info'); }
 renderHPreceptor();
}
