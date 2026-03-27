/**
 * Tasks imported from ICS calendar.
 * Filtered to assignments due after 3/12/2026.
 * TSA club events and non-academic items excluded.
 * Difficulty estimated from assignment type (lab/exhibition/essay/review).
 */

function id() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const INITIAL_TASKS = [
  // ── March 13 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'TOK Exhibition Essentials',
    description: 'What is the TOK exhibition? Review exhibition requirements and essentials.',
    dueDate: '2026-03-13', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Mitosis Analysis Lab',
    description: 'Complete mitosis analysis lab via Google Slides presentation.',
    dueDate: '2026-03-13', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Opposition to the New Deal',
    description: 'The Second New Deal and Opposition — History of the Americas.',
    dueDate: '2026-03-13', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },

  // ── March 16 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Pre-Class Water Conservation Videos',
    description: 'Watch assigned videos and complete the pre-class activity before ESS class.',
    dueDate: '2026-03-16', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'HLE: Outline',
    description: 'Essay outline for the Higher Level Essay — integral part of planning.',
    dueDate: '2026-03-16', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Remote Assignment 3/16 – ESS',
    description: 'Submit a picture of completed notes for the assigned ESS reading.',
    dueDate: '2026-03-16', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },

  // ── March 17 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'TOK Exhibition Practice',
    description: 'Practice exhibition and prompt selection. Link objects to TOK concepts.',
    dueDate: '2026-03-17', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Effects of the Depression & New Deal',
    description: 'Effects of the Great Depression and the New Deal on the US — History HL.',
    dueDate: '2026-03-17', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'HHMI Control of Cell Cycles',
    description: 'Complete HHMI interactive activity on cell cycle control via Google Slides.',
    dueDate: '2026-03-17', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'TOK Practice Exhibition Commentary',
    description: 'Commentary must clearly explain the link between chosen object and TOK prompt.',
    dueDate: '2026-03-17', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },

  // ── March 18 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Planetary Boundary – Water',
    description: 'Research human activities that have contributed to crossing the water planetary boundary.',
    dueDate: '2026-03-18', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Water Footprint Assignment',
    description: 'Select two contrasting countries and research their water footprint.',
    dueDate: '2026-03-18', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Water Regulation',
    description: 'Research a local or global example of regulations restricting water use.',
    dueDate: '2026-03-18', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },

  // ── March 19 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Causes of the Depression in Canada',
    description: 'What caused the Great Depression in Canada? — History HL.',
    dueDate: '2026-03-19', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'TOK Practice Exhibition Peer Review & Revision',
    description: 'Peer review exhibition scoring activity and revise your own commentary.',
    dueDate: '2026-03-19', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Unit 4 Review Sheet – Biology',
    description: 'Complete Unit 4 Review Document for IB Biology HL.',
    dueDate: '2026-03-19', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },

  // ── March 20 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: '1.04 System of Linear Equations – Math DP1',
    description: 'IB Math: Applications & Interpretation — system of linear equations assignment.',
    dueDate: '2026-03-20', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },

  // ── March 23 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: '4.01 Measurements of Center and Percentiles – Math',
    description: 'IB Math: Applications & Interpretation — measures of center and percentiles.',
    dueDate: '2026-03-23', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },

  // ── March 24 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Effects of the Depression in Canada',
    description: 'How did the Depression affect Canadians? — History HL.',
    dueDate: '2026-03-24', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Random Object TOK Exhibition Practice',
    description: 'Practice exhibition with random object prompt selection.',
    dueDate: '2026-03-24', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },

  // ── March 25 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'The Last Fish – ESS Viewing',
    description: 'Watch "The Last Fish" documentary and complete associated questions.',
    dueDate: '2026-03-25', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },

  // ── March 26 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Canada: Government Response to the Depression',
    description: 'How effective was the response of the Federal Government to the Depression?',
    dueDate: '2026-03-26', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'TOK Exhibition Object One',
    description: 'Submit Exhibition Object One. Refer to IA Exhibition: Creating the Final Exhibition guidelines.',
    dueDate: '2026-03-26', difficulty: 'Hard', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: '4.02 Outliers and Box-Whisker Plots – Math',
    description: 'IB Math: Applications & Interpretation — outliers and box-whisker plots.',
    dueDate: '2026-03-26', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'SRY not SRY – Biology',
    description: 'Answer the final question on SRY gene and sex determination.',
    dueDate: '2026-03-26', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'US/Canada Long Term Effects – History',
    description: 'What were the long-term effects of the Depression on Canada and the US?',
    dueDate: '2026-03-26', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },

  // ── March 27 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: '5-Methodology – ESS Internal Assessment',
    description: 'Criterion assesses the extent to which the student has planned and implemented the methodology.',
    dueDate: '2026-03-27', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Water Withdrawals – ESS',
    description: 'Reference One World In Data graph on annual freshwater withdrawals.',
    dueDate: '2026-03-27', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },

  // ── March 30 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Brazil and the Depression',
    description: 'Why was Brazil affected by the Great Depression? — History HL.',
    dueDate: '2026-03-30', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Brazil: Depression and Politics',
    description: 'Impact of the Great Depression on Brazilian politics — History HL.',
    dueDate: '2026-03-30', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'TOK Exhibition Object Two',
    description: 'Submit Exhibition Object Two for TOK IA.',
    dueDate: '2026-03-30', difficulty: 'Hard', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Labeling the Reproductive System',
    description: 'Label reproductive organs using the provided PDF annotation sheet.',
    dueDate: '2026-03-30', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },

  // ── March 31 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Controversial Aquatic Harvesting – ESS',
    description: 'Research and analyze controversial aquatic harvesting practices.',
    dueDate: '2026-03-31', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },

  // ── April 1 ───────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Comparison of Spermatogenesis and Oogenesis',
    description: 'Submit picture of completed comparison chart for Biology HL.',
    dueDate: '2026-04-01', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'TOK Exhibition Object Three',
    description: 'Submit Exhibition Object Three — final object for TOK IA exhibition.',
    dueDate: '2026-04-01', difficulty: 'Hard', completed: false, createdAt: Date.now(),
  },

  // ── April 2 ───────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Water Scarcity Case Study – ESS Summative',
    description: 'Water Case Studies Summative Assessment — research and analysis of water scarcity.',
    dueDate: '2026-04-02', difficulty: 'Hard', completed: false, createdAt: Date.now(),
  },

  // ── April 13 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Brazil: Vargas and the Depression',
    description: 'Role of Vargas during the Great Depression in Brazil — History HL.',
    dueDate: '2026-04-13', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Fertilization Steps – Biology',
    description: 'List the steps of fertilization in the text box as described in notes.',
    dueDate: '2026-04-13', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Menstrual Cycle Hormones – Biology',
    description: 'Read section on hormonal control of the menstrual cycle and complete assignment.',
    dueDate: '2026-04-13', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },

  // ── April 15 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Giant Panda Lab – Biology',
    description: 'Complete Giant Panda genetics lab for IB Biology HL.',
    dueDate: '2026-04-15', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Modeling Meiosis',
    description: 'Complete meiosis modeling assignment using pop beads in class or at home.',
    dueDate: '2026-04-15', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },

  // ── April 23 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Lab: Picnic – Biology',
    description: 'Complete Picnic lab in lab notebook — IB Biology HL.',
    dueDate: '2026-04-23', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },

  // ── April 27 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'HHMI Stickleback Genetics',
    description: 'Complete HHMI Stickleback genetics activity in groups (printed sheet provided).',
    dueDate: '2026-04-27', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },

  // ── April 29 ──────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Epistasis and Dogs – Biology',
    description: 'Complete epistasis activity on dog coat color genetics.',
    dueDate: '2026-04-29', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Inheritance CER – Biology',
    description: 'Claim-Evidence-Reasoning essay on inheritance using provided IB resource.',
    dueDate: '2026-04-29', difficulty: 'Hard', completed: false, createdAt: Date.now(),
  },

  // ── May 5 ─────────────────────────────────────────────────────────────────
  {
    id: id(), title: 'BRCA Lab – Biology',
    description: 'Scan and submit completed BRCA lab sheet for IB Biology HL.',
    dueDate: '2026-05-05', difficulty: 'Hard', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Genetics Packet – Biology',
    description: 'Complete the IB Genetics Packet — comprehensive genetics review.',
    dueDate: '2026-05-05', difficulty: 'Hard', completed: false, createdAt: Date.now(),
  },

  // ── May 13 ────────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Parts of a Leaf – Biology',
    description: 'Complete leaf anatomy labeling and drawing PDF.',
    dueDate: '2026-05-13', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Stomatal Density Lab – Biology',
    description: 'Complete the Stomatal Density Lab for IB Biology HL.',
    dueDate: '2026-05-13', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'EE Café: Foundation & Framing',
    description: 'Extended Essay milestone — Foundation & Framing session.',
    dueDate: '2026-05-13', difficulty: 'Hard', completed: false, createdAt: Date.now(),
  },

  // ── May 15 ────────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Measuring Lung Volume Practice – Biology',
    description: 'Complete measuring lung volumes worksheet PDF.',
    dueDate: '2026-05-15', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Ventilation Worksheet – Biology',
    description: 'Complete ventilation worksheet PDF from Biology HL resources.',
    dueDate: '2026-05-15', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },

  // ── May 19 ────────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Hemoglobin Graphs – Biology',
    description: 'Make a copy of Haemoglobin Activity and complete graph analysis.',
    dueDate: '2026-05-19', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },

  // ── May 21 ────────────────────────────────────────────────────────────────
  {
    id: id(), title: 'Cardiac Cycling and Labeling – Biology',
    description: 'Complete cardiac cycle PDF with labeling for IB Biology HL.',
    dueDate: '2026-05-21', difficulty: 'Medium', completed: false, createdAt: Date.now(),
  },
  {
    id: id(), title: 'Comparing Arteries and Veins – Biology',
    description: 'Use textbook and notes to compare arteries and veins.',
    dueDate: '2026-05-21', difficulty: 'Easy', completed: false, createdAt: Date.now(),
  },
];
