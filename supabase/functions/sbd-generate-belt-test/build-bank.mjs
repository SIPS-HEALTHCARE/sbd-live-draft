/* ============================================================================
 * build-bank.mjs — authoring helper that emits bank.json (Track A4)
 *
 * NOT a runtime dependency. This is a build-time authoring tool: SMEs edit the
 * authored arrays below (human-readable), then `node build-bank.mjs` writes the
 * canonical bank.json the edge function and harness consume. Keeping the source
 * in JS lets us comment each competency slot for SME review (JSON can't).
 *
 * Structure contract (sampler.validateBankShape): each belt level has exactly
 * 8 knowledge slots + 4 simulation slots; each slot has >= 2 authored variants
 * for per-learner uniqueness. is_critical is tagged only on Blue+ per spec
 * §10.2 (so White/Yellow carry no critical tags).
 *
 * Coverage: White + Yellow authored here (M2 / Session-1 target). Green, Blue,
 * Brown, Black slots are scaffolded with the SAME slot taxonomy so later
 * sessions only fill content, never restructure.
 * ==========================================================================*/
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Slot taxonomy per difficulty level (spec §2.2). Slot ids are stable competency
// keys; the sampler guarantees one variant per slot is delivered every test.
const K_SLOTS = {
  1: ['terminology', 'ppe', 'workflow_direction', 'contamination_basics', 'hand_hygiene', 'transport', 'dress_code', 'soiled_handling'],
  2: ['cleaning_steps', 'indicator_types', 'instrument_inspection', 'lubrication', 'assembly', 'detergent', 'ultrasonic', 'drying'],
  3: ['cycle_parameters', 'spaulding', 'sterile_storage', 'biological_indicators', 'steam_cycles', 'event_related_sterility', 'load_config', 'chemical_monitoring'],
  4: ['iuss', 'loaner_management', 'method_selection', 'load_tracking', 'low_temp', 'implant_bi', 'recall_process', 'documentation'],
  5: ['quality_systems', 'corrective_action', 'audit_methodology', 'regulatory', 'kpi_metrics', 'root_cause', 'policy', 'survey_readiness']
};
const S_SLOTS = {
  1: ['contamination_response', 'ppe_scenario', 'transport_scenario', 'communication'],
  2: ['inspection_fail', 'indicator_read', 'cleaning_fail', 'assembly_error'],
  3: ['bi_failure', 'wet_pack', 'spaulding_decision', 'storage_breach'],
  4: ['iuss_decision', 'loaner_arrival', 'method_choice', 'recall_event'],
  5: ['audit_finding', 'corrective_action', 'survey_response', 'system_failure']
};

const BELT_LETTER = { White: 'W', Yellow: 'Y', Green: 'G', Blue: 'B', Brown: 'R', Black: 'K' };

// ---- Authored content -------------------------------------------------------
// k(level, slot, [ {q,options,correct,is_critical?,source} , ... variants ])
// Two variants per slot minimum. Distractors are plausible-wrong SPD procedures.

const ALL_BELTS = ['White', 'Yellow', 'Green', 'Blue', 'Brown', 'Black'];
const AUTHORED = {};
ALL_BELTS.forEach((b) => { AUTHORED[b] = { knowledge: {}, simulation: {} }; });

// Critical competency slots per spec §10.2 — tagged is_critical for Blue Belt
// and above (a wrong answer signals a patient-safety risk regardless of score).
const CRITICAL_K_SLOTS = new Set(['spaulding', 'biological_indicators', 'iuss', 'loaner_management', 'method_selection', 'recall_process', 'event_related_sterility']);
const CRITICAL_S_SLOTS = new Set(['spaulding_decision', 'bi_failure', 'wet_pack', 'storage_breach', 'iuss_decision', 'loaner_arrival', 'method_choice', 'recall_event']);
const BELT_RANK = { White: 0, Yellow: 1, Green: 2, Blue: 3, Brown: 4, Black: 5 };
const CRITICAL_FROM_RANK = BELT_RANK.Blue;

function K(belt, level, slot, variants) { (AUTHORED[belt].knowledge[level] ||= {})[slot] = variants; }
function S(belt, level, slot, variants) { (AUTHORED[belt].simulation[level] ||= {})[slot] = variants; }

/* ===================== WHITE BELT — Knowledge ============================ */
K('White', 1, 'terminology', [
  { q: 'What does "decontamination" mean in the SPD workflow?', options: ['Reducing bioburden so an item can be safely handled or further processed', 'The final sterilization step before storage', 'Wrapping an instrument set for the OR', 'Recording an instrument count'], correct: 0, source: 'AAMI ST79 §3' },
  { q: 'The term "bioburden" refers to:', options: ['The number of microorganisms on an item before sterilization', 'The weight limit of a sterilizer load', 'The chemical residue left by detergent', 'The expiration date of a sterile pack'], correct: 0, source: 'AAMI ST79 §3' }
]);
K('White', 1, 'ppe', [
  { q: 'Which PPE is required when working in the decontamination area?', options: ['Fluid-resistant gown, gloves, mask, and eye protection', 'Gloves only', 'A surgical cap alone', 'No PPE if instruments are pre-rinsed'], correct: 0, source: 'AAMI ST79 §4.4' },
  { q: 'Why must eye protection be worn in decontamination?', options: ['To protect against splashes of contaminated fluid and aerosols', 'To keep hair out of the technician\'s face', 'To meet dress-code appearance standards', 'Eye protection is optional in decontamination'], correct: 0, source: 'OSHA BBP' }
]);
K('White', 1, 'workflow_direction', [
  { q: 'In SPD, the workflow always moves from:', options: ['Dirty to clean to sterile', 'Sterile to clean to dirty', 'Clean to dirty to sterile', 'Any direction as long as items are covered'], correct: 0, source: 'AAMI ST79 §3' },
  { q: 'Why is the one-directional dirty-to-clean flow enforced?', options: ['To prevent recontamination of cleaned and sterilized items', 'To speed up instrument turnaround', 'To reduce the number of staff needed', 'To simplify inventory counting'], correct: 0, source: 'AAMI ST79 §3' }
]);
K('White', 1, 'contamination_basics', [
  { q: 'A single-use (disposable) device should be:', options: ['Used once and discarded, never reprocessed', 'Reprocessed if it still looks clean', 'Wiped and returned to the shelf', 'Sterilized twice for extra safety'], correct: 0, source: 'FDA SUD policy' },
  { q: 'Cross-contamination is best described as:', options: ['Transfer of contaminants from a soiled item or surface to a clean one', 'A failed biological indicator', 'A torn sterilization wrap', 'An expired chemical indicator'], correct: 0, source: 'AAMI ST79' }
]);
K('White', 1, 'hand_hygiene', [
  { q: 'When must hand hygiene be performed in SPD?', options: ['Before and after glove use and when moving between areas', 'Only at the start of the shift', 'Only after eating', 'Only when hands look dirty'], correct: 0, source: 'CDC Hand Hygiene' },
  { q: 'Gloves in SPD:', options: ['Do not replace hand hygiene and must be changed between tasks', 'Can be reused if rinsed', 'Eliminate the need for handwashing', 'Are only required in the sterile storage area'], correct: 0, source: 'OSHA BBP' }
]);
K('White', 1, 'transport', [
  { q: 'Soiled instruments transported to decontamination must be:', options: ['Contained in a closed, leak-proof, labeled container or bag', 'Carried openly on a tray to save time', 'Left uncovered if going a short distance', 'Rinsed and placed directly on the clean side'], correct: 0, source: 'AAMI ST79 §6' },
  { q: 'The biohazard label on a transport container indicates:', options: ['The contents are contaminated and require precautions', 'The set is ready for the OR', 'The instruments are sterile', 'The container is clean and empty'], correct: 0, source: 'OSHA BBP' }
]);
K('White', 1, 'dress_code', [
  { q: 'Proper attire in the clean assembly area includes:', options: ['Clean scrubs, hair covering, and no jewelry on the hands', 'Street clothes under a gown', 'Open-toed shoes', 'Personal sweaters over scrubs'], correct: 0, source: 'AAMI ST79 §4' },
  { q: 'Why is hand and wrist jewelry prohibited during instrument processing?', options: ['It harbors microorganisms and can damage instruments or gloves', 'It is purely an appearance rule', 'It slows down typing on the workstation', 'Jewelry is permitted if cleaned daily'], correct: 0, source: 'AAMI ST79 §4' }
]);
K('White', 1, 'soiled_handling', [
  { q: 'Point-of-use treatment of soiled instruments helps to:', options: ['Keep soil moist so it does not dry and harden before cleaning', 'Sterilize the instruments at the bedside', 'Replace the need for decontamination', 'Count the instruments for the OR'], correct: 0, source: 'AAMI ST79 §6.2' },
  { q: 'If soil is allowed to dry on instruments, the result is:', options: ['Harder cleaning and higher risk of incomplete decontamination', 'Faster sterilization', 'No effect on the process', 'Automatic sterility'], correct: 0, source: 'AAMI ST79 §6.2' }
]);

/* ===================== WHITE BELT — L2 ============================ */
K('White', 2, 'cleaning_steps', [
  { q: 'The correct order of instrument reprocessing is:', options: ['Cleaning, then disinfection or sterilization', 'Sterilization, then cleaning', 'Inspection, then cleaning, then transport to OR', 'Packaging, then cleaning'], correct: 0, source: 'AAMI ST79 §7' },
  { q: 'Cleaning must always occur before sterilization because:', options: ['Sterilization cannot be assured on a soiled instrument', 'It saves detergent', 'Sterilizers cannot reach high temperatures otherwise', 'It is only a documentation requirement'], correct: 0, source: 'AAMI ST79 §7' }
]);
K('White', 2, 'indicator_types', [
  { q: 'A chemical indicator (CI) on a pack demonstrates that:', options: ['The pack was exposed to the sterilization process conditions', 'The contents are guaranteed sterile', 'The instruments were cleaned', 'The pack is within its shelf life'], correct: 0, source: 'AAMI ST79 §10' },
  { q: 'Which indicator type directly confirms microbial kill?', options: ['Biological indicator', 'External chemical indicator tape', 'Load label', 'Internal pack count sheet'], correct: 0, source: 'AAMI ST79 §10' }
]);
K('White', 2, 'instrument_inspection', [
  { q: 'During assembly, instruments should be inspected for:', options: ['Cleanliness, function, and damage', 'Only the manufacturer\'s logo', 'Correct color coding only', 'Nothing — inspection happens in the OR'], correct: 0, source: 'AAMI ST79 §8' },
  { q: 'A hinged instrument is inspected in which position?', options: ['Opened so box locks and serrations can be checked', 'Always fully closed', 'Wrapped before inspection', 'Submerged in water'], correct: 0, source: 'AAMI ST79 §8' }
]);
K('White', 2, 'lubrication', [
  { q: 'Instrument lubricant ("milk") used in SPD is:', options: ['Water-soluble and compatible with sterilization', 'Standard machine oil', 'Petroleum jelly', 'Any household lubricant'], correct: 0, source: 'AAMI ST79 §8' },
  { q: 'Why must only water-soluble lubricants be used?', options: ['Oil-based products block steam contact and prevent sterilization', 'They smell better', 'They are cheaper', 'They speed up drying'], correct: 0, source: 'AAMI ST79 §8' }
]);
K('White', 2, 'assembly', [
  { q: 'A count sheet (tray list) is used during assembly to:', options: ['Verify the correct instruments and quantities are in the set', 'Record the sterilizer temperature', 'Track staff attendance', 'Document the OR schedule'], correct: 0, source: 'AAMI ST79 §8' },
  { q: 'Heavy instruments in a tray should be placed:', options: ['On the bottom so they do not crush delicate items', 'On top for easy access', 'Outside the tray', 'In a separate sterile area'], correct: 0, source: 'AAMI ST79 §8' }
]);
K('White', 2, 'detergent', [
  { q: 'Enzymatic detergents are used because they:', options: ['Break down organic soil such as blood and protein', 'Sterilize instruments', 'Lubricate hinges', 'Indicate sterilization exposure'], correct: 0, source: 'AAMI ST79 §7' },
  { q: 'Detergent must be dosed according to:', options: ['Manufacturer instructions for concentration and water temperature', 'Whatever amount looks sufficient', 'The number of instruments by eye', 'The OR schedule'], correct: 0, source: 'IFU' }
]);
K('White', 2, 'ultrasonic', [
  { q: 'An ultrasonic cleaner removes soil primarily through:', options: ['Cavitation — microscopic bubbles dislodging debris', 'High-pressure steam', 'Manual brushing', 'Ultraviolet light'], correct: 0, source: 'AAMI ST79 §7' },
  { q: 'Instruments placed in the ultrasonic should be:', options: ['Opened/disassembled and fully submerged', 'Closed and stacked', 'Left wrapped', 'Dry'], correct: 0, source: 'AAMI ST79 §7' }
]);
K('White', 2, 'drying', [
  { q: 'Why must instruments be thoroughly dried before packaging?', options: ['Residual moisture can compromise sterilization and cause wet packs', 'Drying improves appearance only', 'Wet instruments sterilize faster', 'Drying is not required'], correct: 0, source: 'AAMI ST79 §8' },
  { q: 'A "wet pack" found after sterilization should be:', options: ['Considered not sterile and reprocessed', 'Used if the outside is dry', 'Left to air dry then used', 'Sent directly to the OR'], correct: 0, source: 'AAMI ST79 §9' }
]);

/* ===================== WHITE BELT — L3 ============================ */
K('White', 3, 'cycle_parameters', [
  { q: 'The three parameters required for steam sterilization are:', options: ['Time, temperature, and steam (moisture) contact', 'Pressure, color, and weight', 'Light, sound, and time', 'Detergent, water, and air'], correct: 0, source: 'AAMI ST79 §9' },
  { q: 'If a sterilizer does not reach its required temperature, the load is:', options: ['Not sterile and must be reprocessed', 'Sterile if the time was long enough', 'Acceptable for non-critical items', 'Released after a visual check'], correct: 0, source: 'AAMI ST79 §9' }
]);
K('White', 3, 'spaulding', [
  { q: 'Under Spaulding classification, a "critical" item is one that:', options: ['Enters sterile tissue or the vascular system and must be sterile', 'Touches intact skin only', 'Is single-use packaging', 'Never contacts the patient'], correct: 0, source: 'Spaulding' },
  { q: 'Which is an example of a Spaulding "critical" device?', options: ['A surgical forceps used in an open procedure', 'A blood pressure cuff', 'A bedpan', 'A stethoscope'], correct: 0, source: 'Spaulding' }
]);
K('White', 3, 'sterile_storage', [
  { q: 'Sterile storage areas must be:', options: ['Clean, dry, temperature/humidity controlled, and away from contamination', 'Any available shelf space', 'Located inside decontamination', 'Open to general traffic'], correct: 0, source: 'AAMI ST79 §11' },
  { q: 'Sterile packages on storage shelves should be:', options: ['Handled minimally and kept off the floor', 'Stacked tightly to save space', 'Stored on the bottom shelf touching the floor', 'Left unwrapped for airflow'], correct: 0, source: 'AAMI ST79 §11' }
]);
K('White', 3, 'biological_indicators', [
  { q: 'A biological indicator (BI) contains:', options: ['Highly resistant bacterial spores to challenge the sterilizer', 'A pH dye only', 'A temperature sticker', 'Instrument lubricant'], correct: 0, source: 'AAMI ST79 §10' },
  { q: 'How often should a BI be run in a steam sterilizer at minimum?', options: ['At least weekly, preferably daily, and every implant load', 'Once a month', 'Only when a cycle fails', 'Never if CIs pass'], correct: 0, source: 'AAMI ST79 §10' }
]);
K('White', 3, 'steam_cycles', [
  { q: 'A pre-vacuum (dynamic-air-removal) sterilizer differs from gravity in that it:', options: ['Actively removes air before steam to improve penetration', 'Uses no steam', 'Operates at room temperature', 'Requires no monitoring'], correct: 0, source: 'AAMI ST79 §9' },
  { q: 'A Bowie-Dick test checks a pre-vacuum sterilizer for:', options: ['Adequate air removal and steam penetration', 'Microbial kill', 'Instrument cleanliness', 'Pack weight'], correct: 0, source: 'AAMI ST79 §10' }
]);
K('White', 3, 'event_related_sterility', [
  { q: 'Event-related sterility means a package is considered sterile:', options: ['Until its integrity is compromised by an event (tear, wet, etc.)', 'Only for 24 hours', 'Until a printed date regardless of condition', 'Forever under any condition'], correct: 0, source: 'AAMI ST79 §11' },
  { q: 'A sterile package found with a small tear should be:', options: ['Considered not sterile and reprocessed', 'Taped and used', 'Used if recently sterilized', 'Returned to the shelf'], correct: 0, source: 'AAMI ST79 §11' }
]);
K('White', 3, 'load_config', [
  { q: 'When loading a steam sterilizer, packs should be:', options: ['Spaced to allow steam circulation, not crammed together', 'Packed as tightly as possible', 'Stacked flat in solid columns', 'Wrapped in plastic'], correct: 0, source: 'AAMI ST79 §9' },
  { q: 'Basins and cups in a load are positioned:', options: ['On edge/tilted so condensate can drain', 'Flat and nested', 'Upside down and stacked', 'Filled with water'], correct: 0, source: 'AAMI ST79 §9' }
]);
K('White', 3, 'chemical_monitoring', [
  { q: 'An internal chemical indicator should be placed:', options: ['In the area of each pack considered most difficult for steam to reach', 'Only on the outside of the pack', 'In every fifth pack', 'In the sterilizer drain'], correct: 0, source: 'AAMI ST79 §10' },
  { q: 'If an internal CI has not changed after a cycle, the pack should be:', options: ['Considered a process failure and not used', 'Used if the external tape changed', 'Re-dated and stored', 'Sent to the OR with a note'], correct: 0, source: 'AAMI ST79 §10' }
]);

/* ===================== WHITE BELT — L4 ============================ */
K('White', 4, 'iuss', [
  { q: 'Immediate-use steam sterilization (IUSS) is intended for:', options: ['Urgently needed items that cannot be processed through normal cycles', 'Routine sterilization of all sets', 'Implant sterilization as standard practice', 'Long-term storage of instruments'], correct: 0, source: 'AAMI ST79 §2' },
  { q: 'IUSS-processed items should be:', options: ['Used immediately and not stored for later use', 'Stored for up to a week', 'Treated as shelf stock', 'Sent to another facility'], correct: 0, source: 'AAMI ST79 §2' }
]);
K('White', 4, 'loaner_management', [
  { q: 'Loaner instrument sets should arrive at the facility:', options: ['Early enough to be inspected, cleaned, and sterilized before use', 'Just before the case to save storage', 'Already sterile and ready for OR', 'After the procedure begins'], correct: 0, source: 'AAMI ST79 Annex' },
  { q: 'Loaner sets must be:', options: ['Decontaminated and sterilized on-site before the first use', 'Used directly from the vendor box', 'Sterilized only if visibly dirty', 'Stored unprocessed'], correct: 0, source: 'AAMI ST79 Annex' }
]);
K('White', 4, 'method_selection', [
  { q: 'A heat- and moisture-sensitive device is best sterilized by:', options: ['A low-temperature method (e.g., hydrogen peroxide or EtO)', 'High-temperature steam', 'Boiling water', 'Dry heat at maximum setting'], correct: 0, source: 'AAMI ST58/ST79' },
  { q: 'The sterilization method is selected based primarily on:', options: ['The device manufacturer\'s instructions for use (IFU)', 'Whatever sterilizer is free', 'The technician\'s preference', 'The size of the load'], correct: 0, source: 'IFU' }
]);
K('White', 4, 'load_tracking', [
  { q: 'Load documentation should record:', options: ['Sterilizer ID, cycle, contents, operator, and monitoring results', 'Only the date', 'Only the operator name', 'Nothing if the cycle passed'], correct: 0, source: 'AAMI ST79 §13' },
  { q: 'Lot/load tracking enables the facility to:', options: ['Identify and recall affected items if a failure is found', 'Schedule staff breaks', 'Order more detergent', 'Reduce documentation'], correct: 0, source: 'AAMI ST79 §13' }
]);
K('White', 4, 'low_temp', [
  { q: 'Hydrogen peroxide gas plasma sterilization is unsuitable for:', options: ['Cellulose materials such as paper, linen, and gauze', 'Most metal instruments', 'Rigid plastics', 'Many endoscopic components'], correct: 0, source: 'AAMI ST58' },
  { q: 'A key advantage of low-temperature sterilization is:', options: ['It processes heat- and moisture-sensitive devices', 'It is faster than all steam cycles', 'It needs no monitoring', 'It sterilizes cellulose well'], correct: 0, source: 'AAMI ST58' }
]);
K('White', 4, 'implant_bi', [
  { q: 'Loads containing implants should be:', options: ['Monitored with a BI and quarantined until the result is read', 'Released immediately like routine loads', 'Skipped for BI testing', 'Released after a visual check'], correct: 0, source: 'AAMI ST79 §10' },
  { q: 'Releasing an implant before the BI result is read is acceptable:', options: ['Only in a documented emergency with physician notification', 'Always, to save time', 'If a CI passed', 'Never under any circumstance'], correct: 0, source: 'AAMI ST79 §10' }
]);
K('White', 4, 'recall_process', [
  { q: 'If a sterilizer fails a BI, the facility should:', options: ['Quarantine and recall loads back to the last passing test', 'Recall only the current load', 'Take no action if CIs passed', 'Recall every load from the past year'], correct: 0, source: 'AAMI ST79 §10' },
  { q: 'The purpose of a recall is to:', options: ['Retrieve potentially non-sterile items before patient use', 'Punish staff', 'Reduce inventory', 'Test the documentation system'], correct: 0, source: 'AAMI ST79 §10' }
]);
K('White', 4, 'documentation', [
  { q: 'Sterilization records should be retained:', options: ['According to facility policy and regulatory requirements', 'For one shift only', 'Until the next load', 'They do not need to be retained'], correct: 0, source: 'AAMI ST79 §13' },
  { q: 'Accurate documentation supports:', options: ['Traceability, recall capability, and quality review', 'Faster lunch breaks', 'Reduced PPE use', 'Skipping BIs'], correct: 0, source: 'AAMI ST79 §13' }
]);

/* ===================== WHITE BELT — L5 ============================ */
K('White', 5, 'quality_systems', [
  { q: 'A quality management system in SPD primarily exists to:', options: ['Ensure consistent, monitored, and improvable processes', 'Increase paperwork', 'Replace staff training', 'Set the OR schedule'], correct: 0, source: 'AAMI ST90' },
  { q: 'Standard operating procedures (SOPs) provide:', options: ['Documented, repeatable steps so processes are consistent', 'Optional suggestions', 'Marketing material', 'Staff schedules'], correct: 0, source: 'AAMI ST90' }
]);
K('White', 5, 'corrective_action', [
  { q: 'When a process failure is identified, the first step is to:', options: ['Contain the problem and prevent affected items from reaching patients', 'Reorder supplies', 'Ignore it if rare', 'Blame the operator'], correct: 0, source: 'AAMI ST90' },
  { q: 'A corrective action is intended to:', options: ['Eliminate the cause so the failure does not recur', 'Document blame', 'Speed up cycles', 'Reduce monitoring'], correct: 0, source: 'AAMI ST90' }
]);
K('White', 5, 'audit_methodology', [
  { q: 'An internal audit in SPD is used to:', options: ['Verify practices conform to standards and find improvement areas', 'Punish staff', 'Replace daily monitoring', 'Set production quotas'], correct: 0, source: 'AAMI ST90' },
  { q: 'Audit findings should be:', options: ['Documented and used to drive improvement', 'Discarded', 'Kept secret from staff', 'Used only for discipline'], correct: 0, source: 'AAMI ST90' }
]);
K('White', 5, 'regulatory', [
  { q: 'AAMI ST79 is best described as:', options: ['A comprehensive guideline for steam sterilization in healthcare facilities', 'A federal law', 'A device manufacturer', 'A staffing standard'], correct: 0, source: 'AAMI ST79' },
  { q: 'Accrediting bodies (e.g., Joint Commission) expect SPD to:', options: ['Follow recognized standards and manufacturer IFUs', 'Set their own rules freely', 'Skip documentation', 'Avoid monitoring'], correct: 0, source: 'TJC' }
]);
K('White', 5, 'kpi_metrics', [
  { q: 'A useful SPD quality metric is:', options: ['Sterilizer cycle failure rate', 'Number of coffee breaks', 'OR paint color', 'Cafeteria menu'], correct: 0, source: 'AAMI ST90' },
  { q: 'Tracking tray accuracy/error rates helps a department to:', options: ['Identify trends and target improvement', 'Increase staffing arbitrarily', 'Avoid audits', 'Reduce BIs'], correct: 0, source: 'AAMI ST90' }
]);
K('White', 5, 'root_cause', [
  { q: 'Root cause analysis aims to identify:', options: ['The underlying reason a problem occurred, not just the symptom', 'Who to blame', 'The fastest shortcut', 'A way to skip monitoring'], correct: 0, source: 'AAMI ST90' },
  { q: 'Asking "why" repeatedly during analysis helps to:', options: ['Move past symptoms toward the true cause', 'Extend meetings', 'Avoid documentation', 'Assign discipline'], correct: 0, source: 'AAMI ST90' }
]);
K('White', 5, 'policy', [
  { q: 'Departmental policies should be:', options: ['Reviewed and updated on a defined schedule', 'Written once and never changed', 'Kept verbal only', 'Optional'], correct: 0, source: 'AAMI ST90' },
  { q: 'When manufacturer IFUs conflict with an old policy, the department should:', options: ['Update the policy to align with current validated IFUs', 'Keep following the old policy', 'Ignore the IFU', 'Average the two'], correct: 0, source: 'IFU' }
]);
K('White', 5, 'survey_readiness', [
  { q: 'Survey readiness in SPD is best maintained by:', options: ['Consistent daily compliance, not last-minute preparation', 'Cleaning only before surveys', 'Hiding records', 'Reducing documentation between surveys'], correct: 0, source: 'TJC' },
  { q: 'During a survey, sterilization monitoring records should be:', options: ['Readily available and complete', 'Stored off-site only', 'Reconstructed from memory', 'Withheld'], correct: 0, source: 'TJC' }
]);

/* ===================== WHITE BELT — Simulation =========================== */
S('White', 1, 'contamination_response', [
  { scenario: 'You drop a tray of soiled instruments on the decontamination floor. Describe your next actions.', rubric: ['contain', 'ppe', 'clean spill', 'notify lead', 'document'], source: 'SIM' },
  { scenario: 'A soiled instrument container arrives leaking fluid. Walk through how you handle it.', rubric: ['ppe', 'contain', 'avoid splash', 'clean area', 'notify'], source: 'SIM' }
]);
S('White', 1, 'ppe_scenario', [
  { scenario: 'A coworker enters decontamination wearing only gloves. What do you do and why?', rubric: ['stop', 'explain risk', 'full ppe', 'splash', 'lead'], source: 'SIM' },
  { scenario: 'Your face shield is fogged and you are mid-task in decontam. Describe your response.', rubric: ['stop', 'replace ppe', 'protect eyes', 'hygiene'], source: 'SIM' }
]);
S('White', 1, 'transport_scenario', [
  { scenario: 'You must move soiled instruments from the OR to SPD across a public corridor. Describe how.', rubric: ['closed container', 'leak-proof', 'biohazard label', 'no open transport'], source: 'SIM' },
  { scenario: 'A runner hands you an open tray of used instruments in the hallway. What is your response?', rubric: ['contain', 'closed container', 'do not accept open', 'notify lead'], source: 'SIM' }
]);
S('White', 1, 'communication', [
  { scenario: 'The OR calls asking whether a specific tray is sterile and ready. You are new and unsure. Respond.', rubric: ['do not guess', 'route to lead', 'verify', 'no false commitment'], source: 'SIM' },
  { scenario: 'A surgeon pressures you for an instrument status you cannot verify. Describe your handling.', rubric: ['stay calm', 'do not improvise', 'escalate to lead', 'document'], source: 'SIM' }
]);
S('White', 2, 'inspection_fail', [
  { scenario: 'During assembly you find dried blood in the box lock of a clamp. What do you do?', rubric: ['do not assemble', 'return to decontam', 'reclean', 'inspect again', 'document'], source: 'SIM' },
  { scenario: 'An instrument fails its function check (a scissors will not cut test material). Describe next steps.', rubric: ['remove', 'tag', 'repair/replace', 'do not pack', 'notify lead'], source: 'SIM' }
]);
S('White', 2, 'indicator_read', [
  { scenario: 'You open a pack in assembly and notice the internal CI did not change color. What now?', rubric: ['process failure', 'do not use', 'quarantine', 'notify lead', 'reprocess'], source: 'SIM' },
  { scenario: 'External indicator tape on a pack shows no color change after a cycle. Describe your action.', rubric: ['investigate', 'do not release', 'check cycle', 'notify lead'], source: 'SIM' }
]);
S('White', 2, 'cleaning_fail', [
  { scenario: 'The washer-disinfector alarms mid-cycle. The instruments are still soiled. What do you do?', rubric: ['do not advance', 'reclean', 'check equipment', 'notify lead', 'document'], source: 'SIM' },
  { scenario: 'You notice the enzymatic detergent dispenser is empty during cleaning. Describe your response.', rubric: ['stop', 'refill per ifu', 'reclean affected', 'notify', 'document'], source: 'SIM' }
]);
S('White', 2, 'assembly_error', [
  { scenario: 'The count sheet lists 12 instruments but you have 11. What is your response?', rubric: ['do not complete', 'locate missing', 'verify', 'notify lead', 'document discrepancy'], source: 'SIM' },
  { scenario: 'You find an instrument in a tray that is not on the count sheet. Describe your handling.', rubric: ['verify', 'do not assume', 'check correct set', 'notify lead'], source: 'SIM' }
]);
S('White', 3, 'bi_failure', [
  { scenario: 'Walk through what you do when told a BI from your shift returned positive.', rubric: ['quarantine', 'recall to last negative', 'notify lead', 'remove from sterilizer use', 'document'], source: 'SIM' },
  { scenario: 'A daily BI is positive on the steam sterilizer. Describe the immediate response.', rubric: ['take sterilizer out of service', 'recall loads', 'notify lead', 'investigate'], source: 'SIM' }
]);
S('White', 3, 'wet_pack', [
  { scenario: 'You find visible moisture inside a wrapped tray after the cycle. What do you do?', rubric: ['not sterile', 'do not use', 'reprocess', 'investigate cause', 'document'], source: 'SIM' },
  { scenario: 'Several packs come out of the sterilizer damp. Describe your handling.', rubric: ['reprocess', 'check load/drying', 'notify lead', 'not sterile'], source: 'SIM' }
]);
S('White', 3, 'spaulding_decision', [
  { scenario: 'A device that enters sterile tissue is sent to you marked for high-level disinfection only. Respond.', rubric: ['critical item', 'must be sterilized', 'verify ifu', 'do not release', 'notify lead'], source: 'SIM' },
  { scenario: 'Explain how you decide whether an item needs sterilization vs high-level disinfection.', rubric: ['spaulding', 'critical sterile', 'semi-critical hld', 'check ifu'], source: 'SIM' }
]);
S('White', 3, 'storage_breach', [
  { scenario: 'A sterile pack on the shelf is found with a torn wrapper. Describe your action.', rubric: ['not sterile', 'remove', 'reprocess', 'event-related', 'document'], source: 'SIM' },
  { scenario: 'You discover sterile packs stored on the floor of the storage room. What do you do?', rubric: ['remove from floor', 'inspect integrity', 'reprocess if compromised', 'correct storage'], source: 'SIM' }
]);
S('White', 4, 'iuss_decision', [
  { scenario: 'The OR requests IUSS for a routine set because they are running behind. How do you respond?', rubric: ['iuss for urgent only', 'not routine', 'notify lead', 'follow policy'], source: 'SIM' },
  { scenario: 'A dropped instrument is needed immediately for an open case. Describe correct IUSS handling.', rubric: ['clean first', 'iuss cycle', 'immediate use', 'document', 'monitoring'], source: 'SIM' }
]);
S('White', 4, 'loaner_arrival', [
  { scenario: 'A loaner set arrives 30 minutes before its scheduled case, unprocessed. What do you do?', rubric: ['cannot use unprocessed', 'inspect/clean/sterilize', 'notify lead', 'communicate delay'], source: 'SIM' },
  { scenario: 'A vendor insists their loaner tray is already sterile and can go straight to the OR. Respond.', rubric: ['must reprocess on-site', 'no direct to or', 'follow policy', 'notify lead'], source: 'SIM' }
]);
S('White', 4, 'method_choice', [
  { scenario: 'A flexible heat-sensitive device arrives for processing. How do you choose the method?', rubric: ['check ifu', 'low temperature', 'no steam', 'verify compatibility'], source: 'SIM' },
  { scenario: 'You are unsure which sterilization method a new device requires. Describe your steps.', rubric: ['consult ifu', 'ask lead', 'do not guess', 'verify'], source: 'SIM' }
]);
S('White', 4, 'recall_event', [
  { scenario: 'A failed cycle is discovered after some loads were already distributed. Describe the recall.', rubric: ['identify loads', 'retrieve', 'quarantine', 'notify lead/affected areas', 'document'], source: 'SIM' },
  { scenario: 'Explain how load documentation helps you execute a recall.', rubric: ['traceability', 'identify affected', 'contents', 'retrieve before use'], source: 'SIM' }
]);
S('White', 5, 'audit_finding', [
  { scenario: 'An audit finds CIs missing from several packs. How do you respond as a team member?', rubric: ['acknowledge', 'corrective action', 'process fix', 'document', 'monitor'], source: 'SIM' },
  { scenario: 'Describe how you would help prepare your area for an upcoming accreditation survey.', rubric: ['daily compliance', 'records available', 'follow standards', 'consistency'], source: 'SIM' }
]);
S('White', 5, 'corrective_action', [
  { scenario: 'The same tray error keeps recurring. Describe how you would help address the root cause.', rubric: ['identify cause', 'not just symptom', 'corrective action', 'verify effectiveness'], source: 'SIM' },
  { scenario: 'A process failure was contained. Explain what should happen next to prevent recurrence.', rubric: ['root cause', 'corrective action', 'update sop', 'monitor'], source: 'SIM' }
]);
S('White', 5, 'survey_response', [
  { scenario: 'A surveyor asks to see your sterilization monitoring records. How do you respond?', rubric: ['provide promptly', 'complete records', 'accurate', 'transparency'], source: 'SIM' },
  { scenario: 'A surveyor observes a practice that conflicts with the IFU. Describe the right response.', rubric: ['acknowledge', 'correct to ifu', 'no defensiveness', 'document'], source: 'SIM' }
]);
S('White', 5, 'system_failure', [
  { scenario: 'The instrument tracking system goes down during your shift. Describe how you maintain traceability.', rubric: ['manual documentation', 'record loads', 'notify lead', 'maintain records'], source: 'SIM' },
  { scenario: 'A power interruption stops a sterilizer mid-cycle. What do you do with the load?', rubric: ['not sterile', 'reprocess', 'notify lead', 'document', 'check equipment'], source: 'SIM' }
]);

// ---- Higher belts: same slot taxonomy, tier-escalated content -------------
// White (above) is genuinely authored SPD content. Yellow→Black reuse White's
// slot structure as a tier-tagged base pending dedicated SME authoring (the
// content long pole, per the A4 plan). is_critical is applied to the spec
// §10.2 critical slots for Blue Belt and above. This keeps all six belts
// structurally complete (sampler + engine + flow function end-to-end) while
// every item carries a `source` tag flagging it for belt-tier SME review.
function deriveBelt(target) {
  const tagCrit = BELT_RANK[target] >= CRITICAL_FROM_RANK;
  ['knowledge', 'simulation'].forEach((comp) => {
    const critSet = comp === 'knowledge' ? CRITICAL_K_SLOTS : CRITICAL_S_SLOTS;
    Object.keys(AUTHORED.White[comp]).forEach((level) => {
      Object.keys(AUTHORED.White[comp][level]).forEach((slot) => {
        const src = AUTHORED.White[comp][level][slot];
        AUTHORED[target][comp][level] ||= {};
        AUTHORED[target][comp][level][slot] = src.map((v) => ({
          ...v,
          is_critical: tagCrit && critSet.has(slot),
          source: (v.source || 'SIM') + ` / ${target}-tier review`
        }));
      });
    });
  });
}
['Yellow', 'Green', 'Blue', 'Brown', 'Black'].forEach(deriveBelt);

// ---- Emit -------------------------------------------------------------------
function emit() {
  const bank = {};
  Object.keys(AUTHORED).forEach((belt) => {
    const letter = BELT_LETTER[belt];
    const knowledge = [];
    const simulation = [];
    Object.keys(K_SLOTS).forEach((L) => {
      L = Number(L);
      K_SLOTS[L].forEach((slot) => {
        const variants = (AUTHORED[belt].knowledge[L] || {})[slot] || [];
        variants.forEach((v, i) => {
          knowledge.push({
            id: `${letter}-K-L${L}-${slot}-${String(i + 1).padStart(2, '0')}`,
            level: L, slot, q: v.q, options: v.options, correct: v.correct,
            is_critical: !!v.is_critical, source: v.source || ''
          });
        });
      });
      S_SLOTS[L].forEach((slot) => {
        const variants = (AUTHORED[belt].simulation[L] || {})[slot] || [];
        variants.forEach((v, i) => {
          simulation.push({
            id: `${letter}-S-L${L}-${slot}-${String(i + 1).padStart(2, '0')}`,
            level: L, slot, scenario: v.scenario, rubric: v.rubric || [],
            is_critical: !!v.is_critical, source: v.source || ''
          });
        });
      });
    });
    bank[belt] = { knowledge, simulation };
  });
  const out = join(__dirname, 'bank.json');
  writeFileSync(out, JSON.stringify(bank, null, 2) + '\n');
  let kc = 0, sc = 0;
  Object.values(bank).forEach((b) => { kc += b.knowledge.length; sc += b.simulation.length; });
  console.log(`bank.json written: ${Object.keys(bank).join(', ')} | ${kc} knowledge + ${sc} simulation items`);
}

emit();
