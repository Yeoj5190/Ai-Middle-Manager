/* AI MIDDLE MANAGER — mock operational data (window.AMM) */
(function () {
  const locations = [
    { id:'balan',  name:'Balan Village Motel', area:'Bowral',     staff:6, open:8,  quality:96, compliance:92, issues:1, trend:+4, lat:34 },
    { id:'gran',   name:'Granville',           area:'Sydney',     staff:4, open:11, quality:84, compliance:79, issues:3, trend:-6, lat:60 },
    { id:'grey',   name:'Greystanes',          area:'Sydney',     staff:5, open:5,  quality:93, compliance:95, issues:0, trend:+2, lat:55 },
    { id:'lalor',  name:'Lalor Park',          area:'Sydney',     staff:3, open:6,  quality:90, compliance:88, issues:1, trend:+1, lat:50 },
    { id:'alba',   name:'Albatross',           area:'Nowra',      staff:4, open:3,  quality:97, compliance:96, issues:0, trend:+3, lat:30 },
    { id:'camb',   name:'171 Cambewarra',      area:'Nowra',      staff:2, open:4,  quality:88, compliance:91, issues:1, trend:0,  lat:28 },
    { id:'monk',   name:'29 Monk St',          area:'Nowra',      staff:2, open:5,  quality:91, compliance:90, issues:0, trend:+2, lat:26 },
  ];

  const employees = [
    { id:'bianca', name:'Bianca Reyes',   role:'Housekeeping Lead', loc:'Balan Village Motel', locId:'balan', status:'on-shift',
      score:94, tasks:128, tasksWk:31, quality:97, sop:96, reliability:98, training:100, escalations:0, tenure:'2y 4m', shift:'06:00–14:00', channel:'Voice',
      delta:+6, initials:'BR' },
    { id:'marcus', name:'Marcus Hale',    role:'Maintenance Tech',  loc:'Granville', locId:'gran', status:'on-shift',
      score:71, tasks:64, tasksWk:14, quality:78, sop:69, reliability:82, training:60, escalations:3, tenure:'7m', shift:'08:00–16:00', channel:'WhatsApp',
      delta:-9, initials:'MH' },
    { id:'aisha',  name:'Aisha Khan',     role:'Room Attendant',    loc:'Greystanes', locId:'grey', status:'on-shift',
      score:89, tasks:103, tasksWk:26, quality:92, sop:94, reliability:90, training:100, escalations:0, tenure:'1y 2m', shift:'06:00–14:00', channel:'Telegram',
      delta:+3, initials:'AK' },
    { id:'diego',  name:'Diego Santos',   role:'Room Attendant',    loc:'Lalor Park', locId:'lalor', status:'off-shift',
      score:82, tasks:77, tasksWk:18, quality:85, sop:83, reliability:86, training:80, escalations:1, tenure:'10m', shift:'14:00–22:00', channel:'SMS',
      delta:+1, initials:'DS' },
    { id:'lena',   name:'Lena Petrov',    role:'Housekeeping',      loc:'Albatross', locId:'alba', status:'on-shift',
      score:91, tasks:96, tasksWk:24, quality:95, sop:92, reliability:93, training:100, escalations:0, tenure:'1y 8m', shift:'07:00–15:00', channel:'Voice',
      delta:+4, initials:'LP' },
    { id:'tomas',  name:'Tomas Nguyen',   role:'Maintenance Tech',  loc:'29 Monk St', locId:'monk', status:'on-shift',
      score:86, tasks:71, tasksWk:19, quality:88, sop:87, reliability:84, training:90, escalations:1, tenure:'1y', shift:'08:00–16:00', channel:'Telegram',
      delta:+2, initials:'TN' },
    { id:'priya',  name:'Priya Sharma',   role:'Room Attendant',    loc:'171 Cambewarra', locId:'camb', status:'off-shift',
      score:88, tasks:84, tasksWk:21, quality:90, sop:89, reliability:88, training:100, escalations:0, tenure:'1y 5m', shift:'06:00–14:00', channel:'WhatsApp',
      delta:+5, initials:'PS' },
    { id:'jamal',  name:'Jamal Osei',     role:'Housekeeping',      loc:'Granville', locId:'gran', status:'on-shift',
      score:76, tasks:58, tasksWk:15, quality:80, sop:74, reliability:79, training:70, escalations:2, tenure:'5m', shift:'06:00–14:00', channel:'SMS',
      delta:-3, initials:'JO' },
  ];

  const tasks = [
    { id:'T-4821', title:'Deep clean rooms 12–18', loc:'Balan Village Motel', assignee:'Bianca Reyes', priority:'med',  status:'in-progress', due:'Today 14:00', source:'Recurring SOP' },
    { id:'T-4822', title:'Repair HVAC unit — Room 4', loc:'Granville', assignee:'Marcus Hale', priority:'high', status:'overdue', due:'Today 10:00', source:'Escalation' },
    { id:'T-4823', title:'Restock amenities — all floors', loc:'Greystanes', assignee:'Aisha Khan', priority:'low', status:'in-progress', due:'Today 16:00', source:'Recurring SOP' },
    { id:'T-4824', title:'Inspect & photo-verify rooms 1–6', loc:'Albatross', assignee:'Lena Petrov', priority:'med', status:'review', due:'Today 12:30', source:'AI generated' },
    { id:'T-4825', title:'Replace smoke detector batteries', loc:'29 Monk St', assignee:'Tomas Nguyen', priority:'high', status:'todo', due:'Today 15:00', source:'Compliance' },
    { id:'T-4826', title:'Linen handover & count', loc:'Lalor Park', assignee:'Diego Santos', priority:'low', status:'done', due:'Today 09:00', source:'Recurring SOP' },
    { id:'T-4827', title:'Pool chemical check & log', loc:'Balan Village Motel', assignee:'Bianca Reyes', priority:'med', status:'todo', due:'Today 17:00', source:'Compliance' },
    { id:'T-4828', title:'Guest complaint follow-up — Rm 9', loc:'Granville', assignee:'Jamal Osei', priority:'high', status:'in-progress', due:'Today 13:00', source:'Escalation' },
  ];

  const escalations = [
    { id:'E-318', sev:'critical', title:'HVAC failure — Granville Room 4', loc:'Granville', when:'24m ago',
      summary:'Marcus reported the HVAC unit in Room 4 is non-operational. Guest checking in at 15:00. AI verified via photo: condenser fan not spinning, error code E2.',
      action:'Dispatch backup unit from Greystanes + reassign guest to Room 7.', evidence:'2 photos · 1 voice note', owner:'Marcus Hale' },
    { id:'E-317', sev:'high', title:'Failed room inspection — Granville Rm 12', loc:'Granville', when:'1h ago',
      summary:'AI quality check failed 2 of 8 criteria: blanket not centred, bathroom mirror streaked. Re-clean required before guest arrival.',
      action:'Reassign re-clean to Jamal Osei; re-verify by 13:30.', evidence:'4 photos', owner:'Jamal Osei' },
    { id:'E-316', sev:'high', title:'SOP not followed — chemical logging', loc:'Granville', when:'2h ago',
      summary:'Pool chemical log missed for 2 consecutive days at Granville. Compliance risk flagged by AI monitor.',
      action:'AI sent SOP refresher to on-shift staff; manager sign-off needed.', evidence:'Compliance log', owner:'Marcus Hale' },
    { id:'E-315', sev:'med', title:'Late shift start', loc:'Granville', when:'3h ago',
      summary:'Jamal started 22 minutes late. Third occurrence this fortnight. AI logged and scheduled a coaching check-in.',
      action:'Review reliability trend; AI coaching scheduled for tomorrow.', evidence:'Shift log', owner:'Jamal Osei' },
  ];

  const conversations = [
    { id:'C-901', emp:'Bianca Reyes', initials:'BR', channel:'Voice', when:'08:42', dur:'2m 14s', topic:'SOP question — stain removal',
      summary:'Bianca asked the correct procedure for a red wine stain on carpet. AI walked through the 4-step SOP and confirmed the approved solvent. No escalation needed.',
      actions:['Linked SOP-014 Carpet Care','Logged as resolved'], sentiment:'positive',
      transcript:[
        {who:'emp', t:'Hey, room 14 has a red wine stain on the carpet, what do I use?'},
        {who:'ai', t:'Use the enzyme solvent from your cart — SOP-014. Blot, don\u2019t rub. Want me to walk you through it?'},
        {who:'emp', t:'Yes please.'},
        {who:'ai', t:'Step 1: blot excess with a dry cloth. Step 2: apply solvent, wait 90 seconds. Step 3: blot outward from the edge. Step 4: photo it when done and I\u2019ll verify.'},
        {who:'emp', t:'Done, sending photo now.'},
        {who:'ai', t:'Looks clean — approved. Nice work. Logged and closed.'},
      ]},
    { id:'C-902', emp:'Marcus Hale', initials:'MH', channel:'WhatsApp', when:'09:18', dur:'—', topic:'HVAC escalation', escalated:true,
      summary:'Marcus reported Room 4 HVAC failure. AI requested a photo, identified error code E2, classified as critical and escalated to manager with a recommended action.',
      actions:['Created escalation E-318','Requested photo evidence','Notified manager'], sentiment:'urgent',
      transcript:[
        {who:'emp', t:'Room 4 aircon is dead, not turning on at all'},
        {who:'ai', t:'Can you send a photo of the unit and the display panel?'},
        {who:'emp', t:'[photo]'},
        {who:'ai', t:'I see error code E2 and the condenser fan isn\u2019t spinning. This is a unit fault, not a reset. Escalating now — guest arrives 15:00.'},
        {who:'ai', t:'Manager notified. Recommended: pull the backup unit from Greystanes. I\u2019ll reassign the guest to Room 7 as a fallback.'},
      ]},
    { id:'C-903', emp:'Aisha Khan', initials:'AK', channel:'Telegram', when:'07:55', dur:'—', topic:'Training completion',
      summary:'Aisha completed the updated bathroom cleaning module. AI confirmed the quiz score and unlocked her next checklist.',
      actions:['Marked SOP-021 training complete','Quiz 9/10'], sentiment:'positive',
      transcript:[
        {who:'ai', t:'Morning Aisha — you\u2019ve got the updated bathroom SOP video queued. 4 min. Want it now?'},
        {who:'emp', t:'yep watching'},
        {who:'emp', t:'done, took the quiz'},
        {who:'ai', t:'9 out of 10 — passed. Your rooms today will use the new checklist. Good luck!'},
      ]},
    { id:'C-904', emp:'Diego Santos', initials:'DS', channel:'SMS', when:'Yesterday', dur:'—', topic:'Schedule swap request',
      summary:'Diego requested to swap Friday\u2019s shift. AI checked coverage, found Priya available, and proposed the swap pending manager approval.',
      actions:['Proposed swap with Priya','Pending approval'], sentiment:'neutral',
      transcript:[
        {who:'emp', t:'can i swap my friday shift?'},
        {who:'ai', t:'Checking coverage… Priya is available Friday and you\u2019re free Sunday. Want me to propose that swap to the manager?'},
        {who:'emp', t:'yes thanks'},
        {who:'ai', t:'Sent for approval. I\u2019ll text you the moment it\u2019s confirmed.'},
      ]},
  ];

  const sops = [
    { id:'SOP-001', title:'Standard Room Turnover', cat:'Housekeeping', type:'Checklist', steps:14, usage:412, success:94, questions:8, incidents:1, updated:'3d ago' },
    { id:'SOP-014', title:'Carpet & Upholstery Care', cat:'Housekeeping', type:'Document', steps:9, usage:96, success:91, questions:12, incidents:0, updated:'1w ago' },
    { id:'SOP-021', title:'Bathroom Deep Clean', cat:'Housekeeping', type:'Video', steps:11, usage:288, success:97, questions:4, incidents:0, updated:'2d ago', highlight:true },
    { id:'SOP-033', title:'Pool Chemical Logging', cat:'Compliance', type:'Checklist', steps:6, usage:140, success:82, questions:6, incidents:2, updated:'5d ago', risk:true },
    { id:'SOP-040', title:'HVAC Fault Triage', cat:'Maintenance', type:'Document', steps:8, usage:54, success:88, questions:9, incidents:3, updated:'4d ago' },
    { id:'SOP-052', title:'Fire & Safety Inspection', cat:'Compliance', type:'Checklist', steps:18, usage:72, success:96, questions:2, incidents:0, updated:'1w ago' },
  ];

  const inspection = {
    id:'QI-2207', room:'Room 14', loc:'Balan Village Motel', employee:'Bianca Reyes', initials:'BR',
    type:'Bed Making', when:'11:24', confidence:91, result:'needs-revision',
    checks:[
      { label:'Bed aligned to frame', pass:true },
      { label:'Sheets tucked (hospital corners)', pass:true },
      { label:'Pillows positioned & plumped', pass:true },
      { label:'Top sheet fold even', pass:true },
      { label:'Blanket centred', pass:false, note:'Offset ~6cm to the left of centre.' },
      { label:'No visible creases', pass:true },
    ],
    aiNote:'Strong turnover overall. One correction needed: the blanket is offset left of centre. Re-centre and re-submit — estimated 30 seconds.'
  };

  // analytics series (12 weeks)
  const weeks = Array.from({length:12}, (_,i)=>`W${i+1}`);
  const analytics = {
    weeks,
    compliance:   [81,83,82,85,84,86,88,87,89,90,91,92],
    completion:   [72,75,74,78,80,79,83,85,84,88,90,91],
    failures:     [14,13,15,11,12,10,9,8,7,6,6,5],
    trainingLift: [{label:'Watched updated SOP', val:37, sub:'fewer inspection failures'},
                   {label:'Avg task quality', val:92, sub:'across 7 locations'},
                   {label:'On-time completion', val:91, sub:'+12 pts vs Q1'}],
    byLocation: locations.map(l=>({ name:l.name, quality:l.quality, compliance:l.compliance })),
  };

  const insights = [
    { sev:'crit', text:'Room inspections at Granville dropped 18% this week and 3 SOP violations were logged.', action:'Open Granville' },
    { sev:'good', text:'Bianca has completed 40% more tasks than the team average with a 97% quality score.', action:'View Bianca' },
    { sev:'warn', text:'Maintenance issues at Granville increased — 3 open escalations vs 0 last week.', action:'View escalations' },
    { sev:'good', text:'Employees who watched the updated cleaning SOP reduced inspection failures by 37%.', action:'View analytics' },
  ];

  const briefing = {
    greeting:'Good morning, John.',
    body:'Operations across all 7 locations are running smoothly. 42 tasks completed today and 5 require your review. 2 employees need follow-up and 1 maintenance issue at Granville requires escalation.',
    stamp:'Generated 08:46 · covers 7 locations · 26 staff on shift',
  };

  const stats = [
    { id:'active',    label:'Active Employees',    value:'18', sub:'of 26 on shift', delta:'+2', dir:'up',   spark:[10,12,11,14,13,16,18] },
    { id:'open',      label:'Open Tasks',          value:'42', sub:'8 due within 2h', delta:'-5', dir:'down', spark:[55,52,49,47,45,44,42], invert:true },
    { id:'done',      label:'Completed Today',     value:'42', sub:'vs 38 avg',       delta:'+11%', dir:'up', spark:[20,26,30,33,37,40,42] },
    { id:'esc',       label:'Escalations',         value:'4',  sub:'1 critical',      delta:'+1', dir:'up',   spark:[2,3,2,3,3,4,4], invert:true },
    { id:'comp',      label:'Compliance Score',    value:'92%',sub:'+3 pts this wk',  delta:'+3', dir:'up',   spark:[86,87,88,89,90,91,92] },
    { id:'qual',      label:'Avg Task Quality',    value:'92%',sub:'7-day average',   delta:'+1', dir:'up',   spark:[88,89,89,90,91,91,92] },
  ];

  // ───── AI Training Quiz ─────
  const quiz = {
    sop:'Bathroom Deep Clean v2', sopId:'SOP-021', module:'SOP-021 · 4:12 video',
    intro:"Before you continue, I'll ask a few quick questions to make sure you understand the process. It takes about a minute.",
    questions:[
      { id:1, type:'choice', topic:'Chemical dwell time',
        q:'How long must the disinfectant sit on bathroom surfaces before you wipe it off?',
        options:['30 seconds','2 minutes','10 minutes','No wait needed'], answer:1,
        explain:'Correct — surfaces need a full 2 minutes of contact time for the disinfectant to kill pathogens.',
        explainWrong:'Not quite. The disinfectant needs a full 2 minutes of contact time — wiping early leaves surfaces unsanitised.' },
      { id:2, type:'choice', topic:'Colour-coded cloths',
        q:'Which colour cloth is used for the toilet zone to prevent cross-contamination?',
        options:['Blue','Green','Red','Yellow'], answer:2,
        explain:'Right — red is the toilet-zone cloth. Colour coding stops germs moving between zones.',
        explainWrong:'Red is the toilet-zone cloth. Using another colour risks cross-contamination between zones.' },
      { id:3, type:'text', topic:'Cleaning order',
        q:'In what order do you clean the bathroom — cleanest first, or dirtiest first?',
        accept:['cleanest','clean to dirty','clean first','top down','high to low'], sample:'Cleanest to dirtiest',
        explain:'Exactly — always work cleanest → dirtiest (mirror, sink, bath, then toilet & floor) so you never spread grime onto clean surfaces.',
        explainWrong:'Remember: work cleanest → dirtiest (mirror, sink, bath, then toilet & floor) so you don\u2019t spread grime.' },
      { id:4, type:'choice', topic:'Bowl chemical',
        q:'After applying chemical to the toilet bowl, what should you do next?',
        options:['Flush it immediately','Let it dwell while you clean other areas','Scrub straight away'], answer:1,
        explain:'Correct — let it dwell while you clean elsewhere, then return to scrub. That gives the chemical time to break down stains.',
        explainWrong:'Let it dwell while you clean other areas first — that gives the chemical time to work before you scrub.' },
      { id:5, type:'choice', topic:'PPE',
        q:'What PPE is required when handling the bathroom disinfectant concentrate?',
        options:['No PPE needed','Nitrile gloves','Gloves and safety goggles'], answer:1,
        explain:'Correct — nitrile gloves protect your skin from the concentrate.',
        explainWrong:'Nitrile gloves are required to protect your skin from the disinfectant concentrate.' },
    ],
  };

  const quizRecords = [
    { id:'bianca', emp:'Bianca Reyes', initials:'BR', sop:'Bathroom Deep Clean v2', sopId:'SOP-021', score:4, total:5, knowledge:88, status:'pass', when:'2d ago', missed:['Chemical dwell time'], trend:[74,80,85,88], attempts:1, rec:'Send refresher video and re-quiz tomorrow' },
    { id:'aisha',  emp:'Aisha Khan',   initials:'AK', sop:'Bathroom Deep Clean v2', sopId:'SOP-021', score:5, total:5, knowledge:96, status:'pass', when:'1d ago', missed:[], trend:[88,90,93,96], attempts:1, rec:'Cleared — no action needed' },
    { id:'marcus', emp:'Marcus Hale',  initials:'MH', sop:'HVAC Fault Triage', sopId:'SOP-040', score:2, total:5, knowledge:48, status:'needs-review', when:'5h ago', missed:['Error-code lookup','Isolation procedure','Refrigerant safety'], trend:[62,58,52,48], attempts:2, rec:'Mandatory retraining before next maintenance task' },
    { id:'jamal',  emp:'Jamal Osei',   initials:'JO', sop:'Pool Chemical Logging', sopId:'SOP-033', score:3, total:5, knowledge:64, status:'needs-review', when:'1d ago', missed:['Dosage ratio','Log frequency'], trend:[70,68,66,64], attempts:1, rec:'Re-quiz tomorrow after refresher' },
    { id:'diego',  emp:'Diego Santos', initials:'DS', sop:'Standard Room Turnover', sopId:'SOP-001', score:4, total:5, knowledge:83, status:'pass', when:'3d ago', missed:['Linen count'], trend:[78,80,81,83], attempts:1, rec:'On track' },
    { id:'lena',   emp:'Lena Petrov',  initials:'LP', sop:'Bathroom Deep Clean v2', sopId:'SOP-021', score:5, total:5, knowledge:94, status:'pass', when:'2d ago', missed:[], trend:[89,91,92,94], attempts:1, rec:'Cleared' },
    { id:'tomas',  emp:'Tomas Nguyen', initials:'TN', sop:'Fire & Safety Inspection', sopId:'SOP-052', score:4, total:5, knowledge:85, status:'pass', when:'4d ago', missed:['Extinguisher classes'], trend:[80,82,84,85], attempts:1, rec:'On track' },
    { id:'priya',  emp:'Priya Sharma', initials:'PS', sop:'Carpet & Upholstery Care', sopId:'SOP-014', score:5, total:5, knowledge:91, status:'pass', when:'2d ago', missed:[], trend:[86,88,90,91], attempts:1, rec:'Cleared' },
  ];

  const retention = {
    avgKnowledge:81, quizzesToday:14, passRate:84, needRetraining:2,
    trend:[72,74,73,76,78,79,80,81],
    bySop:[
      { sop:'Bathroom Deep Clean v2', id:'SOP-021', retention:93, quizzed:18 },
      { sop:'Standard Room Turnover', id:'SOP-001', retention:88, quizzed:24 },
      { sop:'Fire & Safety Inspection', id:'SOP-052', retention:86, quizzed:9 },
      { sop:'Carpet & Upholstery Care', id:'SOP-014', retention:84, quizzed:7 },
      { sop:'Pool Chemical Logging', id:'SOP-033', retention:66, quizzed:11 },
      { sop:'HVAC Fault Triage', id:'SOP-040', retention:58, quizzed:6 },
    ],
  };

  // ───── AI Knowledge Verification Calls ─────
  // adaptive verbal competency check — runs AFTER the quiz
  const verificationScript = {
    sop:'Bathroom Deep Clean v2', sopId:'SOP-021', emp:'Bianca Reyes', initials:'BR',
    turns:[
      { who:'ai', t:"Hi Bianca — before you clean bathrooms independently, I want to quickly check your understanding. Just answer naturally, like we're talking." },
      { who:'ai', t:"First one — why do we wait before wiping disinfectant off a surface?", tag:'Question 1 · Dwell time' },
      { who:'emp', t:"Um… so it can clean properly?", confidence:0.5, quality:'partial', hesitation:true },
      { who:'ai', t:"Close, but be specific for me. It's about contact time — how long does it need to sit, and what's it actually doing in that time?", kind:'challenge' },
      { who:'emp', t:"I think… thirty seconds? To get the dirt off?", confidence:0.35, quality:'weak', hesitation:true },
      { who:'ai', t:"Not quite — and this one matters for guest safety. It needs a full two minutes of contact time to kill pathogens, not just lift dirt. Wiping early leaves the surface unsanitised. Say it back to me — how long, and why?", kind:'coach' },
      { who:'emp', t:"Two minutes — so it actually kills the germs, not just cleans the dirt.", confidence:0.82, quality:'strong', hesitation:false },
      { who:'ai', t:"Exactly. Good. You've got it now. Since you recovered well, let's step it up — what's the correct order for cleaning the bathroom, and why that order?", kind:'advance', tag:'Question 2 · Cleaning order' },
      { who:'emp', t:"Cleanest to dirtiest — mirror, sink, bath, then toilet and floor, so I don't drag germs onto clean surfaces.", confidence:0.9, quality:'strong', hesitation:false },
      { who:'ai', t:"Spot on. Last one — if your gloves are missing or torn before you start, what do you do?", kind:'advance', tag:'Question 3 · PPE' },
      { who:'emp', t:"Stop, don't touch the chemical, and get a fresh pair before I do anything.", confidence:0.88, quality:'strong', hesitation:false },
      { who:'ai', t:"That's right. You stumbled on dwell time at first but corrected it well once we talked it through. I'm clearing you to work independently — and I'll re-check that dwell-time step with you tomorrow to lock it in.", kind:'verdict' },
    ],
    verdict:{ knowledge:86, confidence:78, readiness:'ready', note:'Cleared to work independently. Re-check chemical dwell time tomorrow.' },
  };

  const verificationCalls = [
    { id:'bianca', emp:'Bianca Reyes', initials:'BR', sop:'Bathroom Deep Clean v2', sopId:'SOP-021', when:'Today 09:10', dur:'3m 12s',
      knowledge:86, confidence:78, readiness:'ready', trend:[70,75,80,86], follow:1,
      flags:['Recovered after coaching on dwell time'], summary:'Strong overall. Hesitated on chemical dwell time, recovered fully after coaching. Cleared with a 1-day follow-up.' },
    { id:'aisha', emp:'Aisha Khan', initials:'AK', sop:'Bathroom Deep Clean v2', sopId:'SOP-021', when:'1d ago', dur:'2m 02s',
      knowledge:96, confidence:94, readiness:'ready', trend:[88,90,94,96], follow:0,
      flags:['Confident throughout — passed advanced questions'], summary:'Confident and precise on every question. AI escalated to advanced operational scenarios, all passed. Ready.' },
    { id:'marcus', emp:'Marcus Hale', initials:'MH', sop:'HVAC Fault Triage', sopId:'SOP-040', when:'5h ago', dur:'4m 40s',
      knowledge:52, confidence:38, readiness:'not-ready', trend:[60,55,52,52], follow:0,
      flags:['Failed isolation procedure twice','Long hesitation on refrigerant safety','Manager alerted'], summary:'Could not describe the isolation procedure after two prompts and was unsure on refrigerant safety. Not ready — retraining required, manager alerted.' },
    { id:'jamal', emp:'Jamal Osei', initials:'JO', sop:'Pool Chemical Logging', sopId:'SOP-033', when:'1d ago', dur:'3m 30s',
      knowledge:64, confidence:58, readiness:'borderline', trend:[60,62,61,64], follow:1,
      flags:['Unsure on dosage ratio'], summary:'Knew logging frequency but hesitated on the dosage ratio. Borderline — AI scheduled a refresher and re-check.' },
    { id:'diego', emp:'Diego Santos', initials:'DS', sop:'Standard Room Turnover', sopId:'SOP-001', when:'3d ago', dur:'2m 30s',
      knowledge:84, confidence:80, readiness:'ready', trend:[76,78,82,84], follow:0,
      flags:['Solid, steady answers'], summary:'Steady and accurate across all questions. Ready to work independently.' },
    { id:'lena', emp:'Lena Petrov', initials:'LP', sop:'Bathroom Deep Clean v2', sopId:'SOP-021', when:'2d ago', dur:'2m 18s',
      knowledge:92, confidence:90, readiness:'ready', trend:[86,88,90,92], follow:0,
      flags:['Clear, confident answers'], summary:'Clear and confident throughout. Ready.' },
  ];

  const verification = {
    callsToday:6, readyRate:67, notReady:1, avgConfidence:73,
    trend:[62,64,66,68,72,74,77,80],
    script:verificationScript,
  };

  window.AMM = { locations, employees, tasks, escalations, conversations, sops, inspection, analytics, insights, briefing, stats, quiz, quizRecords, retention, verificationScript, verificationCalls, verification };
})();
