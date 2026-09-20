/**
 * Development seed.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ EVERYTHING numeric in this file (cutoffs, fees, placements, capacities,  │
 * │ faculty, events, clubs …) is ILLUSTRATIVE SAMPLE DATA generated          │
 * │ deterministically so the UI can be developed and tested. It is flagged   │
 * │ `isDemo: true` and linked to a Source named "Demo seed data" so the UI   │
 * │ shows a demo banner. Replace it with verified KEA / college data using   │
 * │ the admin dashboard or the CSV importer before any public use.          │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
import "dotenv/config";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import type { FacilityCategory, ClubCategory, RecruiterSector } from "../src/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

// ───────── deterministic pseudo-random (mulberry32) ─────────
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Keep demo ranks inside the realistic KCET range (~2.5 lakh candidates): compress the tail. */
function compressRank(r: number) {
  if (r <= 40000) return r;
  const tail = r - 40000;
  return Math.min(245000, 40000 + 120000 * (1 - Math.exp(-tail / 120000)) + tail * 0.12);
}

const YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

const BRANCHES = [
  { code: "CS", slug: "computer-science-engineering", name: "Computer Science and Engineering", shortName: "CSE", category: "COMPUTING", mult: 1.0 },
  { code: "IS", slug: "information-science-engineering", name: "Information Science and Engineering", shortName: "ISE", category: "COMPUTING", mult: 1.35 },
  { code: "AI", slug: "artificial-intelligence-machine-learning", name: "Artificial Intelligence and Machine Learning", shortName: "AIML", category: "COMPUTING", mult: 1.2 },
  { code: "AD", slug: "artificial-intelligence-data-science", name: "Artificial Intelligence and Data Science", shortName: "AIDS", category: "COMPUTING", mult: 1.45 },
  { code: "CY", slug: "computer-science-cyber-security", name: "Computer Science and Engineering (Cyber Security)", shortName: "CSE-CY", category: "COMPUTING", mult: 1.6 },
  { code: "CB", slug: "computer-science-business-systems", name: "Computer Science and Business Systems", shortName: "CSBS", category: "COMPUTING", mult: 1.8 },
  { code: "EC", slug: "electronics-communication-engineering", name: "Electronics and Communication Engineering", shortName: "ECE", category: "ELECTRONICS", mult: 2.1 },
  { code: "EI", slug: "electronics-instrumentation-engineering", name: "Electronics and Instrumentation Engineering", shortName: "EIE", category: "ELECTRONICS", mult: 5.5 },
  { code: "EE", slug: "electrical-electronics-engineering", name: "Electrical and Electronics Engineering", shortName: "EEE", category: "ELECTRICAL", mult: 4.2 },
  { code: "ME", slug: "mechanical-engineering", name: "Mechanical Engineering", shortName: "ME", category: "MECHANICAL", mult: 7.5 },
  { code: "CV", slug: "civil-engineering", name: "Civil Engineering", shortName: "CV", category: "CIVIL", mult: 10 },
  { code: "CH", slug: "chemical-engineering", name: "Chemical Engineering", shortName: "CHE", category: "CHEMICAL", mult: 6.5 },
  { code: "AE", slug: "aerospace-engineering", name: "Aerospace Engineering", shortName: "AE", category: "AEROSPACE", mult: 3.2 },
  { code: "BT", slug: "biotechnology", name: "Biotechnology", shortName: "BT", category: "BIOTECH", mult: 5.0 },
] as const;

type BranchCode = (typeof BRANCHES)[number]["code"];

const BRANCH_INFO: Record<BranchCode, { about: string; subjects: string[]; careers: string[]; higherStudies: string[]; skills: string[] }> = {
  CS: {
    about: "Computer Science and Engineering covers the theory, design and application of computing systems — programming, algorithms, systems software, databases, networks and modern areas such as machine learning and cloud computing.",
    subjects: ["Data Structures & Algorithms", "Operating Systems", "Database Management Systems", "Computer Networks", "Software Engineering", "Theory of Computation", "Compiler Design", "Machine Learning", "Cloud Computing", "Web Technologies"],
    careers: ["Software Engineer", "Backend / Full-stack Developer", "Data Engineer", "ML Engineer", "DevOps / Cloud Engineer", "Product Engineer", "Security Analyst"],
    higherStudies: ["M.Tech (CSE / AI / Data Science)", "MS in Computer Science", "MBA", "GATE for PSUs & IITs"],
    skills: ["Programming (C/C++/Java/Python)", "Problem solving", "System design", "Databases", "Version control", "Cloud fundamentals"],
  },
  IS: {
    about: "Information Science and Engineering focuses on information systems, software development, data management and analytics with a curriculum close to CSE plus information-management electives.",
    subjects: ["Data Structures", "DBMS", "Operating Systems", "Computer Networks", "Software Engineering", "Information Retrieval", "Data Mining", "Web Technologies", "Cloud Computing", "Big Data Analytics"],
    careers: ["Software Developer", "Data Analyst", "Information Systems Engineer", "QA / Test Engineer", "Cloud Engineer"],
    higherStudies: ["M.Tech (CSE / ISE / Data Science)", "MS", "MBA (Systems)"],
    skills: ["Programming", "Databases", "Analytics", "Web development", "Communication"],
  },
  AI: {
    about: "AI & ML is a specialised computing programme covering machine learning, deep learning, natural language processing, computer vision and the mathematics behind them.",
    subjects: ["Linear Algebra & Probability", "Data Structures", "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Reinforcement Learning", "MLOps", "Big Data", "Ethics in AI"],
    careers: ["ML Engineer", "Data Scientist", "AI Research Engineer", "Computer Vision Engineer", "NLP Engineer"],
    higherStudies: ["M.Tech (AI)", "MS in AI / Data Science", "PhD"],
    skills: ["Python", "Mathematics", "ML frameworks", "Data handling", "Experimentation"],
  },
  AD: {
    about: "AI & Data Science combines statistical modelling, data engineering and AI techniques to derive insight from large datasets.",
    subjects: ["Statistics", "Data Structures", "Machine Learning", "Data Engineering", "Data Visualisation", "Big Data Frameworks", "Deep Learning", "Business Analytics"],
    careers: ["Data Scientist", "Data Engineer", "Analytics Consultant", "ML Engineer"],
    higherStudies: ["M.Tech (Data Science)", "MS in Data Science", "MBA (Analytics)"],
    skills: ["Python/R", "SQL", "Statistics", "Visualisation", "Storytelling with data"],
  },
  CY: {
    about: "CSE (Cyber Security) adds security-focused subjects — cryptography, network security, ethical hacking and digital forensics — on top of a core CSE curriculum.",
    subjects: ["Data Structures", "Operating Systems", "Computer Networks", "Cryptography", "Network Security", "Ethical Hacking", "Digital Forensics", "Secure Software Engineering"],
    careers: ["Security Engineer", "SOC Analyst", "Penetration Tester", "Security Consultant", "Software Engineer"],
    higherStudies: ["M.Tech (Cyber Security)", "MS", "Certifications (CEH, OSCP)"],
    skills: ["Networking", "Linux", "Programming", "Threat analysis", "Attention to detail"],
  },
  CB: {
    about: "CS & Business Systems blends core computer science with business fundamentals, analytics and management, designed with industry input.",
    subjects: ["Data Structures", "DBMS", "Software Engineering", "Business Analytics", "Financial Management", "Marketing", "Design Thinking", "Cloud Computing"],
    careers: ["Business Analyst", "Product Manager (entry)", "Software Engineer", "Consultant"],
    higherStudies: ["MBA", "M.Tech", "MS in Information Systems"],
    skills: ["Programming", "Business analysis", "Communication", "Data analytics"],
  },
  EC: {
    about: "Electronics and Communication Engineering deals with electronic devices, circuits, signal processing, communication systems, embedded systems and VLSI design.",
    subjects: ["Network Analysis", "Analog & Digital Electronics", "Signals & Systems", "Microcontrollers", "Communication Systems", "Digital Signal Processing", "VLSI Design", "Embedded Systems", "Antennas & Wave Propagation"],
    careers: ["VLSI / Design Engineer", "Embedded Systems Engineer", "RF / Telecom Engineer", "Software Engineer", "Hardware Test Engineer"],
    higherStudies: ["M.Tech (VLSI / Embedded / DSP)", "MS in ECE", "GATE (PSUs)"],
    skills: ["Circuit design", "Verilog/VHDL", "C programming", "Signal processing", "Lab skills"],
  },
  EI: {
    about: "Electronics and Instrumentation Engineering covers measurement systems, sensors, process control and industrial automation.",
    subjects: ["Transducers & Sensors", "Analog Electronics", "Process Control", "Industrial Instrumentation", "PLC & SCADA", "Control Systems", "Biomedical Instrumentation"],
    careers: ["Instrumentation Engineer", "Automation Engineer", "Control Systems Engineer", "Test Engineer"],
    higherStudies: ["M.Tech (Instrumentation / Control)", "MS"],
    skills: ["Control theory", "PLC programming", "Electronics", "Calibration"],
  },
  EE: {
    about: "Electrical and Electronics Engineering covers power systems, electrical machines, power electronics, control systems and renewable energy.",
    subjects: ["Electric Circuits", "Electrical Machines", "Power Systems", "Power Electronics", "Control Systems", "Microcontrollers", "Renewable Energy Systems", "High Voltage Engineering"],
    careers: ["Power Systems Engineer", "Electrical Design Engineer", "Renewable Energy Engineer", "Automation Engineer", "PSU roles via GATE"],
    higherStudies: ["M.Tech (Power Systems / Power Electronics)", "GATE for PSUs", "MS"],
    skills: ["Circuit analysis", "MATLAB/Simulink", "Machines", "Safety standards"],
  },
  ME: {
    about: "Mechanical Engineering is the broad discipline of design, manufacturing, thermal and fluid systems, materials and automation.",
    subjects: ["Engineering Mechanics", "Thermodynamics", "Fluid Mechanics", "Manufacturing Processes", "Machine Design", "Heat Transfer", "CAD/CAM", "Robotics", "Automobile Engineering"],
    careers: ["Design Engineer", "Manufacturing / Production Engineer", "Automotive Engineer", "Thermal Engineer", "Quality Engineer"],
    higherStudies: ["M.Tech (Design / Thermal / Manufacturing)", "MS", "GATE for PSUs"],
    skills: ["CAD tools", "Analytical thinking", "Materials", "Manufacturing", "Project work"],
  },
  CV: {
    about: "Civil Engineering covers structural, geotechnical, transportation, environmental and water-resources engineering along with construction management.",
    subjects: ["Strength of Materials", "Structural Analysis", "Geotechnical Engineering", "Fluid Mechanics", "Surveying", "Transportation Engineering", "Environmental Engineering", "Construction Management"],
    careers: ["Structural Engineer", "Site Engineer", "Project Manager", "Government engineering services", "Urban planner"],
    higherStudies: ["M.Tech (Structural / Geotech / Transportation)", "GATE for PSUs", "MS"],
    skills: ["AutoCAD / STAAD", "Surveying", "Estimation", "Site management"],
  },
  CH: {
    about: "Chemical Engineering applies chemistry, physics and mathematics to design processes that convert raw materials into useful products.",
    subjects: ["Chemical Process Calculations", "Fluid Flow", "Heat Transfer", "Mass Transfer", "Chemical Reaction Engineering", "Process Control", "Plant Design"],
    careers: ["Process Engineer", "Petrochemical / Refinery Engineer", "Pharma Process Engineer", "Safety Engineer"],
    higherStudies: ["M.Tech (Chemical)", "MS", "GATE for PSUs"],
    skills: ["Process simulation", "Chemistry", "Safety", "Data analysis"],
  },
  AE: {
    about: "Aerospace Engineering covers aerodynamics, propulsion, structures, flight mechanics and the design of aircraft and spacecraft.",
    subjects: ["Aerodynamics", "Aircraft Structures", "Propulsion", "Flight Mechanics", "Avionics", "Aircraft Design", "CFD"],
    careers: ["Aerospace Design Engineer", "CFD Engineer", "Avionics Engineer", "Defence / ISRO / HAL roles"],
    higherStudies: ["M.Tech (Aerospace)", "MS abroad", "GATE"],
    skills: ["CAD/CFD tools", "Mathematics", "Structures", "Simulation"],
  },
  BT: {
    about: "Biotechnology combines biology with engineering principles for applications in healthcare, agriculture, food and bioprocess industries.",
    subjects: ["Biochemistry", "Microbiology", "Molecular Biology", "Bioprocess Engineering", "Genetic Engineering", "Bioinformatics", "Immunology"],
    careers: ["Bioprocess Engineer", "Research Associate", "Quality Analyst (Pharma)", "Bioinformatics Analyst"],
    higherStudies: ["M.Tech (Biotech)", "MS / PhD", "M.Sc."],
    skills: ["Lab techniques", "Data analysis", "Research methods", "Documentation"],
  },
};

type CollegeSeed = {
  code: string;
  slug: string;
  name: string;
  shortName: string;
  establishedYear: number;
  type: "GOVERNMENT" | "AIDED" | "PRIVATE" | "UNIVERSITY" | "DEEMED";
  district: string;
  city: string;
  autonomous: boolean;
  website: string;
  tierBase: number; // demo GM CSE closing rank baseline
  branches: BranchCode[];
  hostel: boolean;
  feeBase: number; // demo KCET tuition baseline (2026)
  placementBase: number; // demo placement %
};

// College identity fields (name, city, district, established year, website) are public facts;
// tierBase / feeBase / placementBase drive DEMO numbers only.
const COLLEGES: CollegeSeed[] = [
  { code: "E005", slug: "rv-college-of-engineering", name: "RV College of Engineering", shortName: "RVCE", establishedYear: 1963, type: "PRIVATE", district: "Bengaluru Urban", city: "Bengaluru", autonomous: true, website: "https://www.rvce.edu.in/", tierBase: 450, branches: ["CS", "IS", "AI", "AD", "EC", "EE", "ME", "CV", "CH", "AE", "BT", "EI"], hostel: true, feeBase: 93000, placementBase: 92 },
  { code: "E003", slug: "bms-college-of-engineering", name: "BMS College of Engineering", shortName: "BMSCE", establishedYear: 1946, type: "AIDED", district: "Bengaluru Urban", city: "Bengaluru", autonomous: true, website: "https://bmsce.ac.in/", tierBase: 900, branches: ["CS", "IS", "AI", "AD", "EC", "EE", "ME", "CV", "CH", "BT", "EI"], hostel: true, feeBase: 88000, placementBase: 88 },
  { code: "E010", slug: "ms-ramaiah-institute-of-technology", name: "M S Ramaiah Institute of Technology", shortName: "MSRIT", establishedYear: 1962, type: "PRIVATE", district: "Bengaluru Urban", city: "Bengaluru", autonomous: true, website: "https://www.msrit.edu/", tierBase: 1400, branches: ["CS", "IS", "AI", "AD", "CY", "EC", "EE", "ME", "CV", "CH", "BT", "EI"], hostel: true, feeBase: 92000, placementBase: 86 },
  { code: "E012", slug: "dayananda-sagar-college-of-engineering", name: "Dayananda Sagar College of Engineering", shortName: "DSCE", establishedYear: 1979, type: "PRIVATE", district: "Bengaluru Urban", city: "Bengaluru", autonomous: true, website: "https://www.dsce.edu.in/", tierBase: 4200, branches: ["CS", "IS", "AI", "AD", "CY", "CB", "EC", "EE", "ME", "CV", "AE", "BT"], hostel: true, feeBase: 86000, placementBase: 78 },
  { code: "E047", slug: "jss-science-and-technology-university", name: "JSS Science and Technology University", shortName: "JSSSTU", establishedYear: 1963, type: "UNIVERSITY", district: "Mysuru", city: "Mysuru", autonomous: true, website: "https://jssstuniv.in/", tierBase: 3200, branches: ["CS", "IS", "AI", "AD", "EC", "EE", "ME", "CV", "EI", "BT"], hostel: true, feeBase: 82000, placementBase: 84 },
  { code: "E048", slug: "national-institute-of-engineering-mysuru", name: "The National Institute of Engineering", shortName: "NIE", establishedYear: 1946, type: "AIDED", district: "Mysuru", city: "Mysuru", autonomous: true, website: "https://nie.ac.in/", tierBase: 5600, branches: ["CS", "IS", "AI", "EC", "EE", "ME", "CV", "EI"], hostel: true, feeBase: 72000, placementBase: 82 },
  { code: "E070", slug: "siddaganga-institute-of-technology", name: "Siddaganga Institute of Technology", shortName: "SIT", establishedYear: 1963, type: "PRIVATE", district: "Tumakuru", city: "Tumakuru", autonomous: true, website: "https://www.sit.ac.in/", tierBase: 6800, branches: ["CS", "IS", "AI", "AD", "EC", "EE", "ME", "CV", "CH", "BT", "EI"], hostel: true, feeBase: 70000, placementBase: 80 },
  { code: "E101", slug: "jnn-college-of-engineering-shivamogga", name: "Jawaharlal Nehru National College of Engineering", shortName: "JNNCE", establishedYear: 1980, type: "PRIVATE", district: "Shivamogga", city: "Shivamogga", autonomous: false, website: "https://jnnce.ac.in/", tierBase: 19000, branches: ["CS", "IS", "AI", "EC", "EE", "ME", "CV"], hostel: true, feeBase: 62000, placementBase: 68 },
  { code: "E086", slug: "bapuji-institute-of-engineering-and-technology", name: "Bapuji Institute of Engineering and Technology", shortName: "BIET", establishedYear: 1979, type: "PRIVATE", district: "Davangere", city: "Davangere", autonomous: false, website: "https://bietdvg.edu/", tierBase: 22000, branches: ["CS", "IS", "AI", "EC", "EE", "ME", "CV", "CH", "BT"], hostel: true, feeBase: 60000, placementBase: 64 },
  { code: "E116", slug: "kls-gogte-institute-of-technology", name: "KLS Gogte Institute of Technology", shortName: "GIT", establishedYear: 1979, type: "PRIVATE", district: "Belagavi", city: "Belagavi", autonomous: true, website: "https://www.git.edu/", tierBase: 14000, branches: ["CS", "IS", "AI", "AD", "EC", "EE", "ME", "CV"], hostel: true, feeBase: 66000, placementBase: 72 },
  { code: "E082", slug: "basaveshwar-engineering-college-bagalkot", name: "Basaveshwar Engineering College", shortName: "BEC", establishedYear: 1963, type: "AIDED", district: "Bagalkot", city: "Bagalkot", autonomous: true, website: "https://becbgk.edu/", tierBase: 28000, branches: ["CS", "IS", "EC", "EE", "ME", "CV", "CH", "BT", "EI"], hostel: true, feeBase: 48000, placementBase: 58 },
  { code: "E133", slug: "st-joseph-engineering-college-mangaluru", name: "St Joseph Engineering College", shortName: "SJEC", establishedYear: 2002, type: "PRIVATE", district: "Dakshina Kannada", city: "Mangaluru", autonomous: true, website: "https://sjec.ac.in/", tierBase: 16500, branches: ["CS", "IS", "AI", "AD", "EC", "EE", "ME", "CV"], hostel: true, feeBase: 68000, placementBase: 74 },
];

const CATEGORY_MULT: Record<string, number> = { GM: 1, "2AG": 1.55, "2BG": 2.3, "3AG": 1.9, "3BG": 1.7, "1G": 2.6, SCG: 5.2, STG: 7.4 };
const YEAR_DRIFT: Record<number, number> = { 2017: 1.28, 2018: 1.24, 2019: 1.18, 2020: 1.22, 2021: 1.12, 2022: 1.05, 2023: 1.0, 2024: 0.96, 2025: 0.93, 2026: 0.9 };

const RECRUITERS: readonly (readonly [string, RecruiterSector])[] = [
  ["Infosys", "IT"], ["Tata Consultancy Services", "IT"], ["Wipro", "IT"], ["Accenture", "CONSULTING"], ["Cognizant", "IT"],
  ["Capgemini", "IT"], ["Bosch", "CORE"], ["Mercedes-Benz R&D", "AUTOMOTIVE"], ["Texas Instruments", "ELECTRONICS"], ["Qualcomm", "ELECTRONICS"],
  ["Intel", "ELECTRONICS"], ["Samsung R&D", "ELECTRONICS"], ["Deloitte", "CONSULTING"], ["Goldman Sachs", "FINANCE"], ["JPMorgan Chase", "FINANCE"],
  ["L&T", "CORE"], ["Toyota Kirloskar", "AUTOMOTIVE"], ["Siemens", "CORE"], ["ABB", "CORE"], ["Razorpay", "STARTUP"], ["Zomato", "STARTUP"], ["Cisco", "IT"],
] as const;

const CLUB_TEMPLATES: readonly (readonly [string, ClubCategory, readonly string[]])[] = [
  ["Coding Club", "TECHNICAL", ["Weekly contests", "DSA bootcamps", "Open-source sprints"]],
  ["Robotics Club", "TECHNICAL", ["Line-follower workshops", "Robo-wars", "Arduino sessions"]],
  ["IEEE Student Branch", "PROFESSIONAL", ["Technical talks", "Paper presentations", "Industry visits"]],
  ["Entrepreneurship Cell", "ENTREPRENEURSHIP", ["Startup weekends", "Pitch competitions", "Mentor connects"]],
  ["NSS Unit", "SOCIAL", ["Village adoption camps", "Blood donation drives", "Cleanliness drives"]],
  ["NCC", "SOCIAL", ["Parades", "Annual training camps", "Adventure camps"]],
  ["Cultural Club", "CULTURAL", ["Dance & music", "Drama", "Annual cultural fest"]],
  ["Photography Club", "CULTURAL", ["Photo walks", "Exhibitions"]],
  ["AI/ML Club", "TECHNICAL", ["Kaggle nights", "Model-building workshops"]],
  ["Cyber Security Club", "TECHNICAL", ["CTF practice", "Security awareness sessions"]],
  ["Sports Club", "SPORTS", ["Inter-department tournaments", "Fitness sessions"]],
] as const;

const LAB_TEMPLATES: Record<string, string[]> = {
  CS: ["Programming Lab", "Database Lab", "Computer Networks Lab", "AI/ML Lab", "Cloud Computing Lab", "Cyber Security Lab", "IoT Lab"],
  IS: ["Programming Lab", "Data Analytics Lab", "Web Technologies Lab", "Software Engineering Lab"],
  AI: ["Deep Learning Lab (GPU)", "Data Science Lab", "NLP & Vision Lab"],
  AD: ["Data Science Lab", "Big Data Lab", "Visualisation Lab"],
  CY: ["Network Security Lab", "Digital Forensics Lab", "Ethical Hacking Lab"],
  CB: ["Programming Lab", "Business Analytics Lab"],
  EC: ["Analog Electronics Lab", "Digital Electronics Lab", "VLSI Design Lab", "Embedded Systems Lab", "Communication Lab", "DSP Lab"],
  EI: ["Transducers Lab", "Process Control Lab", "PLC & SCADA Lab"],
  EE: ["Electrical Machines Lab", "Power Electronics Lab", "Power Systems Simulation Lab", "Control Systems Lab"],
  ME: ["Machine Shop", "CAD/CAM Lab", "Fluid Mechanics Lab", "Heat Transfer Lab", "Material Testing Lab"],
  CV: ["Surveying Lab", "Concrete & Highway Materials Lab", "Geotechnical Lab", "Environmental Engineering Lab"],
  CH: ["Unit Operations Lab", "Reaction Engineering Lab", "Process Control Lab"],
  AE: ["Aerodynamics Lab (Wind Tunnel)", "Propulsion Lab", "Aircraft Structures Lab"],
  BT: ["Microbiology Lab", "Molecular Biology Lab", "Bioprocess Lab", "Bioinformatics Lab"],
};

async function main() {
  console.log("Seeding VTU College Finder (demo data)…");
  // Never mix illustrative records into a database that already holds real KEA data.
  const real = await prisma.college.count({ where: { isDemo: false } });
  if (real > 0) {
    console.error(`Refusing to run: ${real} non-demo colleges exist. The demo seed is only for empty development databases (use npm run db:seed for real KEA data).`);
    process.exit(1);
  }

  // ── Users ──
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { email: adminEmail, name: "Platform Admin", role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 12) },
  });
  const student = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: { email: "student@example.com", name: "Demo Student", role: "STUDENT", passwordHash: await bcrypt.hash("Student@123", 12) },
  });
  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: { userId: student.id, kcetRank: 18542, category: "GM", preferredBranches: ["computer-science-engineering", "artificial-intelligence-machine-learning"], preferredDistricts: ["Shivamogga", "Mysuru"], hostelRequired: true, placementImportance: 4 },
  });

  // ── Sources ──
  const demoSource = await prisma.source.upsert({
    where: { id: "src_demo" },
    update: {},
    create: {
      id: "src_demo",
      name: "Demo seed data (illustrative only — not official)",
      publisher: "Demo",
      publicationYear: 2026,
      notes: "Generated deterministically for development. Replace with verified KEA / college data.",
      isDemo: true,
    },
  });
  await prisma.source.upsert({
    where: { id: "src_kea" },
    update: {},
    create: { id: "src_kea", name: "KEA — UGCET cutoff & allotment documents", url: "https://cetonline.karnataka.gov.in/kea/", publisher: "KEA", publicationYear: 2026, notes: "Official Karnataka Examinations Authority publications. No records imported yet." },
  });
  await prisma.source.upsert({
    where: { id: "src_vtu" },
    update: {},
    create: { id: "src_vtu", name: "VTU — affiliated institutions list", url: "https://vtu.ac.in/", publisher: "VTU", publicationYear: 2026 },
  });

  // ── Branches ──
  const branchByCode = new Map<string, { id: string }>();
  for (const b of BRANCHES) {
    const info = BRANCH_INFO[b.code];
    const row = await prisma.branch.upsert({
      where: { code: b.code },
      update: { name: b.name, shortName: b.shortName, slug: b.slug, category: b.category, ...info },
      create: { code: b.code, slug: b.slug, name: b.name, shortName: b.shortName, category: b.category, ...info },
    });
    branchByCode.set(b.code, row);
  }

  // ── Recruiters ──
  const recruiterIds: { id: string; sector: string }[] = [];
  for (const [name, sector] of RECRUITERS) {
    const r = await prisma.recruiter.upsert({ where: { name }, update: {}, create: { name, sector } });
    recruiterIds.push({ id: r.id, sector });
  }

  // ── Colleges ──
  let cutoffTotal = 0;
  for (const [ci, c] of COLLEGES.entries()) {
    const rand = rng(1000 + ci * 17);
    if (await prisma.college.findUnique({ where: { code: c.code } })) {
      console.log(`  – ${c.shortName} already seeded, skipping`);
      continue;
    }
    const college = await prisma.college.create({
      data: {
        code: c.code,
        slug: c.slug,
        name: c.name,
        shortName: c.shortName,
        establishedYear: c.establishedYear,
        type: c.type,
        district: c.district,
        city: c.city,
        autonomous: c.autonomous,
        website: c.website,
        accreditation: c.autonomous ? ["NAAC accredited (grade: verify)", "NBA (selected programmes — verify)"] : ["NAAC accredited (grade: verify)"],
        hostelAvailable: c.hostel,
        description: `${c.name} is an engineering college in ${c.city}, ${c.district} district, Karnataka, offering undergraduate programmes across ${c.branches.length} branches. Detailed descriptive text has not been loaded yet — refer to the official website.`,
        history: null,
        vision: null,
        mission: null,
        principal: null,
        isDemo: true,
        sourceId: demoSource.id,
      },
    });

    // Departments + college branches + labs + faculty
    const deptByBranch = new Map<string, string>();
    for (const code of c.branches) {
      const b = BRANCHES.find((x) => x.code === code)!;
      const dept = await prisma.department.upsert({
        where: { collegeId_slug: { collegeId: college.id, slug: b.slug } },
        update: {},
        create: {
          collegeId: college.id,
          name: `Department of ${b.name}`,
          slug: b.slug,
          about: `The ${b.name} department offers the B.E. programme in ${b.shortName}. Detailed department text, HoD name and research areas have not been verified — see the college website.`,
          hod: null,
          researchAreas: [],
          isDemo: true,
          sourceId: demoSource.id,
        },
      });
      deptByBranch.set(code, dept.id);
      await prisma.collegeBranch.upsert({
        where: { collegeId_branchId: { collegeId: college.id, branchId: branchByCode.get(code)!.id } },
        update: {},
        create: { collegeId: college.id, branchId: branchByCode.get(code)!.id, departmentId: dept.id, intake: [60, 120, 180][Math.floor(rand() * 3)], isDemo: true },
      });
      for (const lab of LAB_TEMPLATES[code] ?? []) {
        await prisma.laboratory.create({
          data: { collegeId: college.id, departmentId: dept.id, name: lab, purpose: `Laboratory for ${b.shortName} coursework. Equipment details not verified.`, equipment: [], isDemo: true, sourceId: demoSource.id },
        });
      }
      // Faculty: clearly-labelled sample records (real names are never fabricated)
      for (let i = 1; i <= 2; i++) {
        await prisma.faculty.create({
          data: {
            collegeId: college.id,
            departmentId: dept.id,
            name: `[Sample] ${b.shortName} Faculty ${i}`,
            designation: i === 1 ? "Professor" : "Assistant Professor",
            qualification: null,
            specialization: null,
            researchInterests: [],
            profileUrl: null,
            isDemo: true,
            sourceId: demoSource.id,
          },
        });
      }
    }

    // Cutoffs — 10 years × rounds × categories (demo)
    const cutoffRows: Prisma.CutoffCreateManyInput[] = [];
    for (const code of c.branches) {
      const b = BRANCHES.find((x) => x.code === code)!;
      const branchNoise = 0.85 + rand() * 0.3;
      for (const year of YEARS) {
        const yearNoise = 0.92 + rand() * 0.16;
        for (const [cat, cm] of Object.entries(CATEGORY_MULT)) {
          const base = compressRank(c.tierBase * b.mult * cm * YEAR_DRIFT[year] * branchNoise * yearNoise);
          const r1 = Math.max(1, Math.round(base));
          const r2 = Math.min(250000, Math.round(r1 * (1.08 + rand() * 0.14)));
          const opening1 = Math.max(1, Math.round(r1 * (0.15 + rand() * 0.3)));
          const opening2 = Math.max(1, Math.round(r1 * (0.6 + rand() * 0.3)));
          cutoffRows.push(
            { collegeId: college.id, branchId: branchByCode.get(code)!.id, year, round: 1, category: cat, gender: "ALL", seatType: "GENERAL", openingRank: opening1, closingRank: r1, isDemo: true, sourceId: demoSource.id },
            { collegeId: college.id, branchId: branchByCode.get(code)!.id, year, round: 2, category: cat, gender: "ALL", seatType: "GENERAL", openingRank: opening2, closingRank: r2, isDemo: true, sourceId: demoSource.id },
          );
        }
      }
    }
    const res = await prisma.cutoff.createMany({ data: cutoffRows, skipDuplicates: true });
    cutoffTotal += res.count;

    // Fees — college-wide KCET & management quota per year (demo)
    for (const year of YEARS) {
      const factor = 1 - (2026 - year) * 0.045;
      await prisma.fee.create({
        data: { collegeId: college.id, year, quota: "KCET", tuitionFee: Math.round((c.feeBase * factor) / 100) * 100, universityFee: 4500, examFee: 3000, otherFee: 6000, hostelFee: c.hostel ? Math.round((55000 * factor) / 100) * 100 : null, messFee: c.hostel ? Math.round((42000 * factor) / 100) * 100 : null, notes: "Illustrative demo values.", isDemo: true, sourceId: demoSource.id },
      });
      await prisma.fee.create({
        data: { collegeId: college.id, year, quota: "MANAGEMENT", tuitionFee: Math.round((c.feeBase * factor * 3.6) / 1000) * 1000, universityFee: 4500, examFee: 3000, otherFee: 12000, notes: "Illustrative demo values.", isDemo: true, sourceId: demoSource.id },
      });
    }

    // Placements (college-wide, demo)
    for (const year of YEARS) {
      const drift = 1 - (2026 - year) * 0.02;
      const pct = Math.min(99, Math.round(c.placementBase * drift * (0.95 + rand() * 0.1)));
      const avg = +(3.2 + (c.placementBase - 55) * 0.12 * drift + rand() * 0.8).toFixed(1);
      await prisma.placement.create({
        data: {
          collegeId: college.id,
          year,
          placementPercent: pct,
          studentsEligible: 600 + Math.round(rand() * 400),
          studentsPlaced: null,
          highestPackage: +(avg * (4 + rand() * 6)).toFixed(1),
          averagePackage: avg,
          medianPackage: +(avg * 0.85).toFixed(1),
          recruitersCount: 60 + Math.round(rand() * 200),
          internshipInfo: "Internship statistics not loaded.",
          isDemo: true,
          sourceId: demoSource.id,
        },
      });
    }

    // Recruiters
    const shuffled = [...recruiterIds].sort(() => rand() - 0.5).slice(0, 8 + Math.floor(rand() * 8));
    for (const r of shuffled) {
      await prisma.collegeRecruiter.create({ data: { collegeId: college.id, recruiterId: r.id, year: 2025, isDemo: true } });
    }

    // Facilities, hostels
    const facilities: [string, FacilityCategory][] = [
      ["Central Library", "LIBRARY"], ["Digital Library", "LIBRARY"], ["Auditorium", "ACADEMIC"], ["Seminar Halls", "ACADEMIC"], ["Smart Classrooms", "ACADEMIC"],
      ["Cafeteria", "DINING"], ["Sports Ground", "SPORTS"], ["Gymnasium", "SPORTS"], ["Medical Centre", "MEDICAL"], ["College Buses", "TRANSPORT"],
      ["Campus Wi-Fi", "TECHNOLOGY"], ["24×7 Security", "SECURITY"], ["Parking", "OTHER"], ["Green Spaces", "RECREATION"],
    ];
    for (const [name, category] of facilities) {
      await prisma.facility.create({ data: { collegeId: college.id, name, category, description: "Facility listed for demo; details not verified.", isDemo: true, sourceId: demoSource.id } });
    }
    if (c.hostel) {
      await prisma.hostel.create({ data: { collegeId: college.id, type: "BOYS", capacity: 400 + Math.round(rand() * 600), feePerYear: 55000, messFeePerYear: 42000, wifi: true, studyArea: true, security: "24×7 warden & security (demo)", distanceFromCampus: "On campus", isDemo: true, sourceId: demoSource.id } });
      await prisma.hostel.create({ data: { collegeId: college.id, type: "GIRLS", capacity: 300 + Math.round(rand() * 500), feePerYear: 55000, messFeePerYear: 42000, wifi: true, studyArea: true, security: "24×7 warden & security (demo)", distanceFromCampus: "On campus", isDemo: true, sourceId: demoSource.id } });
    }

    // Clubs
    const clubs = [...CLUB_TEMPLATES].sort(() => rand() - 0.5).slice(0, 6 + Math.floor(rand() * 5));
    for (const [name, category, activities] of clubs) {
      await prisma.club.create({ data: { collegeId: college.id, name, category, description: `${name} at ${c.shortName} (demo record).`, activities: [...activities], isDemo: true, sourceId: demoSource.id } });
    }

    // Events & hackathons (demo)
    for (const year of [2023, 2024, 2025, 2026]) {
      await prisma.event.create({ data: { collegeId: college.id, name: `${c.shortName} Technical Fest ${year}`, type: "TECHNICAL_FEST", year, date: new Date(`${year}-03-15`), description: "Annual technical fest (demo record).", participants: 1500 + Math.round(rand() * 2000), isDemo: true, sourceId: demoSource.id } });
      await prisma.event.create({ data: { collegeId: college.id, name: `${c.shortName} Cultural Fest ${year}`, type: "CULTURAL_FEST", year, date: new Date(`${year}-10-05`), description: "Annual cultural fest (demo record).", participants: 2000 + Math.round(rand() * 2000), isDemo: true, sourceId: demoSource.id } });
      await prisma.event.create({ data: { collegeId: college.id, departmentId: deptByBranch.get("CS"), name: `Workshop on Cloud & DevOps ${year}`, type: "WORKSHOP", year, date: new Date(`${year}-08-20`), description: "Two-day hands-on workshop (demo record).", participants: 80 + Math.round(rand() * 60), isDemo: true, sourceId: demoSource.id } });
      await prisma.hackathon.create({ data: { collegeId: college.id, name: `${c.shortName} Hack ${year}`, year, organizer: `${c.shortName} Coding Club`, participants: 150 + Math.round(rand() * 250), winners: "Winners not loaded (demo).", projects: "Project list not loaded (demo).", sponsors: [], isDemo: true, sourceId: demoSource.id } });
    }

    // Milestones — established year is public; others are demo placeholders
    await prisma.milestone.create({ data: { collegeId: college.id, year: c.establishedYear, title: "College established", description: `${c.name} was established in ${c.establishedYear}.`, isDemo: false, sourceId: "src_vtu" } });
    if (c.autonomous) await prisma.milestone.create({ data: { collegeId: college.id, year: 2007 + Math.floor(rand() * 12), title: "Granted academic autonomy (year to verify)", description: "Demo placeholder — verify the exact year on the college website.", isDemo: true, sourceId: demoSource.id } });
    await prisma.achievement.create({ data: { collegeId: college.id, year: 2025, title: "Achievement records not loaded", description: "Add verified achievements via the admin dashboard.", isDemo: true, sourceId: demoSource.id } });

    console.log(`  ✓ ${c.shortName} (${c.branches.length} branches)`);
  }

  // Demo student shortlist
  const jnnce = await prisma.college.findUnique({ where: { code: "E101" } });
  const sit = await prisma.college.findUnique({ where: { code: "E070" } });
  if (jnnce && sit) {
    await prisma.shortlist.upsert({ where: { userId_collegeId: { userId: student.id, collegeId: jnnce.id } }, update: {}, create: { userId: student.id, collegeId: jnnce.id, note: "Close to home" } });
    await prisma.shortlist.upsert({ where: { userId_collegeId: { userId: student.id, collegeId: sit.id } }, update: {}, create: { userId: student.id, collegeId: sit.id } });
  }

  console.log(`Done. Inserted ${cutoffTotal} cutoff rows across ${COLLEGES.length} colleges and ${BRANCHES.length} branches.`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("Student login: student@example.com / Student@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
