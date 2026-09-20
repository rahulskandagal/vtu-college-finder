/**
 * Canonical branch registry used when importing KEA cut-off documents.
 *
 * `codes`  — KEA 2-letter course codes used in the 2019-2024 PDFs.
 * `keys`   — normalised course-name keys from the 2025+ PDFs (see normalizeKey()).
 * Anything that does not match is imported verbatim under its KEA label so no
 * data is dropped; admins can merge/rename later.
 */
import type { BranchCategory } from "../../src/generated/prisma/enums";

export type CanonBranch = {
  code: string;
  slug: string;
  name: string;
  shortName: string;
  category: BranchCategory;
  codes: string[];
  keys: string[];
};

/** Normalise a KEA course name into a comparison key. */
export function normalizeKey(name: string): string {
  let k = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  k = k.replace(/^BTEHIN/, "").replace(/^BTECHHONS/, "").replace(/^BTECHIN/, "").replace(/^BTECH/, "");
  k = k
    .replace(/ARTIFICAL/g, "ARTIFICIAL")
    .replace(/SICENCE/g, "SCIENCE")
    .replace(/VIRUTAL/g, "VIRTUAL")
    .replace(/MATHAMATICS/g, "MATHEMATICS")
    .replace(/INTEGTATED/g, "INTEGRATED")
    .replace(/ENGG/g, "ENGINEERING")
    .replace(/ENGINEERINGINEERING/g, "ENGINEERING")
    .replace(/AEROSPACE|AEROSPACE/g, "AEROSPACE")
    .replace(/BIOTECHNOLOGY/g, "BIOTECHNOLOGY")
    .replace(/BIOMEDICAL/g, "BIOMEDICAL");
  return k;
}

const C = (code: string, slug: string, name: string, shortName: string, category: BranchCategory, codes: string[], keys: string[]): CanonBranch => ({
  code, slug, name, shortName, category, codes, keys: keys.map(normalizeKey),
});

export const CANON: CanonBranch[] = [
  // ── Computing ──
  C("CS", "computer-science-engineering", "Computer Science and Engineering", "CSE", "COMPUTING", ["CS", "BW", "DL", "LG"], ["COMPUTER SCIENCE AND ENGINEERING", "SCIENCE AND ENGINEERING"]),
  C("CSC", "computer-science", "Computer Science", "CS", "COMPUTING", ["ZC"], ["COMPUTER SCIENCE"]),
  C("IE", "information-science-engineering", "Information Science and Engineering", "ISE", "COMPUTING", ["IE", "IZ", "CU", "LH"], ["INFORMATION SCIENCE AND ENGINEERING", "INFORMATION SCIENCE", "INFORMATION SCIENCE ENGINEERING"]),
  C("IS", "information-science-technology", "Information Science and Technology", "IST", "COMPUTING", ["IS"], ["INFORMATION SCIENCE TECHNOLOGY"]),
  C("IT", "information-technology", "Information Technology", "IT", "COMPUTING", ["BI", "IG", "CW"], ["INFORMATION TECHNOLOGY"]),
  C("AI", "artificial-intelligence-machine-learning", "Artificial Intelligence and Machine Learning", "AIML", "COMPUTING", ["AI", "LE", "BH"], ["ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING", "ARTIFICIAL INTELLIGENCE", "ARTIFICIAL INTELLIGENCE ENGG", "COMPUTER SCIENCE AIML"]),
  C("CA", "cse-artificial-intelligence-machine-learning", "Computer Science and Engineering (AI & ML)", "CSE-AIML", "COMPUTING", ["CA", "AM", "ZW", "RM"], ["COMPUTER SCIENCE AND ENGG(ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING)", "COMPUTER SCIENCE & ENGINEERING (ARTIFICAL INTELLIGENCE & MACHINE LEARNING)", "COMPUTER SCIENCE AND ENGINEERING (AIML)"]),
  C("AD", "artificial-intelligence-data-science", "Artificial Intelligence and Data Science", "AIDS", "COMPUTING", ["AD", "BG"], ["ARTIFICIAL INTELLIGENCE AND DATA SCIENCE"]),
  C("CAD", "cse-artificial-intelligence-data-science", "Computer Science and Engineering (AI & Data Science)", "CSE-AIDS", "COMPUTING", [], ["COMPUTER SCIENCE AND ENGINEERING(ARTIFICIAL INTELLIGENCE AND DATA SCIENCE)", "COMPUTER SCIENCE AND ENGINEERING(ARTIFICAL INTELLIGENCE & DATA SCIENCE)"]),
  C("CF", "cse-artificial-intelligence", "Computer Science and Engineering (Artificial Intelligence)", "CSE-AI", "COMPUTING", ["CF", "YD", "ZH", "ZR"], ["COMPUTER SCIENCE AND ENGG (ARTIFICIAL INTELLIGENCE)", "COMPUTER SCIENCE AND ARTIFICIAL INTELLIGENCE", "COMPUTER SCIENCE & ENGG (ARTIFICIAL INTELLIGENCE AND FUTURE TECHNOLOGIES )"]),
  C("DS", "cse-data-science", "Computer Science and Engineering (Data Science)", "CSE-DS", "COMPUTING", ["DS", "BF", "BZ", "LD"], ["COMPUTER SCIENCE AND ENGINEERING(DATA SCIENCE)", "COMPUTER SCIENCE (DATA SCIENCE)"]),
  C("YB", "cse-data-analytics", "Computer Science and Engineering (Data Analytics)", "CSE-DA", "COMPUTING", ["YB"], ["COMPUTER SICENCE AND ENGG (DATA ANALYTICS)"]),
  C("DC", "data-sciences", "Data Sciences", "DSc", "COMPUTING", ["DC"], ["DATA SCIENCES"]),
  C("CY", "cse-cyber-security", "Computer Science and Engineering (Cyber Security)", "CSE-CY", "COMPUTING", ["CY", "BX", "ZU"], ["COMPUTER SCIENCE AND ENGINEERING (CYBER SECURITY)", "COMPUTER SCIENCE (CYBER SECURITY)", "CYBER SECURITY", "COMPUTER SCIENCE (INFORMATION SECURITY)"]),
  C("IY", "cs-it-cyber-security", "Computer Science & IT (Cyber Security)", "CS-IT-CY", "COMPUTING", ["IY", "CX"], []),
  C("IO", "cse-internet-of-things", "Computer Science and Engineering (Internet of Things)", "CSE-IoT", "COMPUTING", ["IO", "LK", "CQ"], ["COMPUTER SCIENCE AND ENGINEERING(IOT)", "COMPUTER SCIENCE AND ENGG(INTERNET OF THINGS)", "COMPUTER SCIENCE (INTERNET OF THINGS)"]),
  C("IC", "cse-iot-cyber-security-blockchain", "Computer Science and Engineering (IoT, Cyber Security incl. Blockchain)", "CSE-IoT-CY", "COMPUTING", ["IC", "CN", "IB"], ["COMPUTER SCIENCE AND ENGG(INTERNET OF THINGS & CYBER SECURITY INCLUDING BLOCK CHAIN TECH)", "COMPUTER SCIENCE AND ENGINEERING(IOT INCLUDING BLOCK CHAIN)"]),
  C("LC", "cse-blockchain", "Computer Science and Engineering (Block Chain)", "CSE-BC", "COMPUTING", ["LC", "CZ"], ["COMPUTER SCIENCE AND ENGINEERING(BLOCK CHAIN)"]),
  C("CB", "computer-science-business-systems", "Computer Science and Business Systems", "CSBS", "COMPUTING", ["CB", "LJ", "ZO"], ["COMPUTER SCIENCE AND BUSINESS SYSTEMS", "COMPUTER SCIENCE & ENGG (Business Systems)"]),
  C("CD", "computer-science-design", "Computer Science and Design", "CSD", "COMPUTING", ["CD", "ZM"], ["COMPUTER SCIENCE AND DESIGN"]),
  C("CG", "computer-science-technology", "Computer Science and Technology", "CST", "COMPUTING", ["CG", "BQ", "BC"], ["COMPUTER SCIENCE AND TECHNOLOGY", "COMPUTER SCIENCE & TECHNOLOGY"]),
  C("BD", "cst-big-data", "Computer Science and Technology (Big Data)", "CST-BD", "COMPUTING", ["BD", "BN"], ["COMPUTER SCIENCE AND TECHNOLOGY(BIG DATA)"]),
  C("OP", "cse-devops", "Computer Science and Engineering (DevOps)", "CSE-DevOps", "COMPUTING", ["OP", "BY"], ["COMPUTER SCIENCE AND ENGINEERING(DEV OPS)", "COMPUTER SCIENCE AND TECHNOLOGY(DEV OPS)"]),
  C("CCL", "cse-cloud-computing", "Computer Science and Engineering (Cloud Computing)", "CSE-CC", "COMPUTING", ["LF"], ["COMPUTER SCIENCE AND ENGINEERING(CLOUD COMPUTING)", "COMPUTER SCIENCE (CLOUD COMPUTING)"]),
  C("CFS", "cse-full-stack-development", "Computer Science and Engineering (Full Stack Development)", "CSE-FSD", "COMPUTING", [], ["COMPUTER SCIENCE AND ENGINEERING(FULL STACK DEVELOPMENT)"]),
  C("CSR", "cse-robotics", "Computer Science and Engineering (Robotics)", "CSE-RO", "COMPUTING", ["YA"], ["COMPUTER SCIENCE AND ENGG (ROBOTICS)"]),
  C("CO", "computer-engineering", "Computer Engineering", "CE(Comp)", "COMPUTING", ["CO", "BV"], ["COMPUTER ENGINEERING", "COMPUTER ENGINEERING(SOFTWARE PRODUCT DEVELOPMENT)"]),
  C("CC", "computer-communication-engineering", "Computer and Communication Engineering", "CCE", "COMPUTING", ["CC"], ["COMPUTER AND COMMUNICATION ENGINEERING"]),
  C("CI", "computer-science-information-technology", "Computer Science and Information Technology", "CSIT", "COMPUTING", ["CI", "BU"], ["COMPUTER SCIENCE AND INFORMATION TECHNOLOGY"]),
  C("SS", "cs-system-engineering", "Computer Science and System Engineering", "CSSE", "COMPUTING", ["SS", "DK"], []),
  C("DM", "cs-networks", "Computer Science (Networks)", "CS-NW", "COMPUTING", ["DM"], []),
  C("MC", "mathematics-computing", "Mathematics and Computing", "M&C", "COMPUTING", ["MC", "DA"], ["MATHAMATICS AND COMPUTING"]),
  C("CME", "cs-medical-engineering", "Computer Science and Medical Engineering", "CSME", "COMPUTING", [], ["Computer Science and Medical Engineering"]),
  C("ZV", "it-ar-vr", "Information Technology (AR/VR)", "IT-ARVR", "COMPUTING", ["ZV"], ["INFORMATION TECHNOLOGY AUGMENTED REALITY AND VIRUTAL REALITY(AR/VR)"]),
  C("ZQ", "it-data-analytics", "Information Technology (Data Analytics)", "IT-DA", "COMPUTING", ["ZQ"], ["INFORMATION TECHNOLOGY DATA ANALYTICS"]),
  // ── Electronics ──
  C("EC", "electronics-communication-engineering", "Electronics and Communication Engineering", "ECE", "ELECTRONICS", ["EC", "BB"], ["ELECTRONICS AND COMMUNICATION ENGG", "ELECTRONICS & COMMUNICATION ENGINEERING"]),
  C("ET", "electronics-telecommunication-engineering", "Electronics and Telecommunication Engineering", "ETE", "ELECTRONICS", ["ET", "TC"], ["ELECTRONICS AND TELECOMMUNICATION ENGINEERING"]),
  C("EV", "electronics-vlsi-design-technology", "Electronics Engineering (VLSI Design & Technology)", "EC-VLSI", "ELECTRONICS", ["EV", "DN", "YG", "YC", "CM"], ["ELECTRONICS ENGINEERING(VLSI DESIGN & TECHNOLOGY)", "ELECTRONICS AND COMMUNICATION ENGG (VLSI DESIGN AND TECHNOLOGY)", "ELECTRONICS ENGINEERING (VLSI AND EMBEDDED SYSTEM)", "EMBEDDED SYSTEM AND VLSI", "VLSI"]),
  C("EAC", "ec-advanced-communication-technology", "Electronics and Communication (Advanced Communication Technology)", "EC-ACT", "ELECTRONICS", ["EB"], ["ELECTRONICS AND COMMUNICATION (ADVANCED COMMUNICATION TECHNOLOGY)"]),
  C("II", "ec-industrial-integrated", "Electronics and Communication Engineering (Industrial Integrated)", "EC-II", "ELECTRONICS", ["II"], ["ELECTRONICS & COMMUNICATION ENGINEERING(INDUSTRIAL INTEGTATED)"]),
  C("ES", "electronics-computer-engineering", "Electronics and Computer Engineering", "ECM", "ELECTRONICS", ["ES", "EZ", "CL"], ["ELECTRONICS & COMPUTER ENGINEERING", "ELECTRONICS & COMPUTER SCIENCE"]),
  C("EL", "electronics-engineering", "Electronics Engineering", "EE(Elec)", "ELECTRONICS", [], ["ELECTRONICS ENGINEERING"]),
  C("EI", "electronics-instrumentation-engineering", "Electronics and Instrumentation Engineering", "EIE", "ELECTRONICS", ["EI", "EL"], ["ELECTRONICS AND INSTRUMENTATION ENGINEERING", "ELECTRONICS & INSTRUMENTATION ENGINEERING"]),
  C("MD", "medical-electronics", "Medical Electronics Engineering", "MDE", "ELECTRONICS", ["MD"], ["MEDICAL ELECTRONICS ENGINEERING"]),
  C("BE", "bio-electronics", "Bio-Electronics Engineering", "BioE", "ELECTRONICS", ["BE"], []),
  // ── Electrical ──
  C("EE", "electrical-electronics-engineering", "Electrical and Electronics Engineering", "EEE", "ELECTRICAL", ["EE", "BJ"], ["ELECTRICAL & ELECTRONICS ENGINEERING"]),
  C("EEV", "eee-electric-vehicle-technology", "Electrical and Electronics Engineering (Electric Vehicle Technology)", "EEE-EV", "ELECTRICAL", [], ["Electrical and Electronics Engineering (Electrical Vehicle Technology)"]),
  C("ER", "electrical-computer-engineering", "Electrical and Computer Engineering", "ECE(Elec)", "ELECTRICAL", ["ER", "YF"], ["ELECTRICAL & COMPUTER ENGINEERING", "ELECTRICAL ENGINEERING AND COMPUTER SCIENCE"]),
  C("EG", "energy-engineering", "Energy Engineering", "EnE", "ELECTRICAL", ["EG", "BK"], ["ENERGY ENGINEERING"]),
  // ── Mechanical ──
  C("ME", "mechanical-engineering", "Mechanical Engineering", "ME", "MECHANICAL", ["ME", "DB", "YI"], ["MECHANICAL ENGINEERING"]),
  C("MK", "mechanical-engineering-kannada", "Mechanical Engineering (Kannada medium)", "ME-K", "MECHANICAL", ["MK"], ["MECHANICAL ENGINEERING (KANNADA MEDIUM)"]),
  C("MM", "mechanical-smart-manufacturing", "Mechanical and Smart Manufacturing", "MSM", "MECHANICAL", ["MM", "ZT", "DD"], ["MECHANICAL AND SMART MANUFACTURING"]),
  C("MA", "mechanical-aerospace-engineering", "Mechanical and Aerospace Engineering", "MAE", "MECHANICAL", [], ["MECHANICAL AND AEROSPACE ENGINEERING"]),
  C("MT", "mechatronics", "Mechatronics Engineering", "MTE", "MECHANICAL", ["MT"], ["MECHATRONICS", "MECHATRONICS ENGINEERING"]),
  C("RA", "robotics-automation", "Robotics and Automation", "RA", "MECHANICAL", ["RA", "DF"], ["ROBOTICS AND AUTOMATION"]),
  C("RI", "robotics-artificial-intelligence", "Robotics and Artificial Intelligence", "RAI", "MECHANICAL", ["RI", "DH"], ["ROBOTICS AND ARTIFICIAL INTELLIGENCE"]),
  C("RO", "automation-robotics", "Automation and Robotics", "A&R", "MECHANICAL", ["RO"], ["AUTOMATION AND ROBOTICS"]),
  C("RB", "robotics-engineering", "Robotics Engineering", "RE", "MECHANICAL", ["RB", "DJ", "DI"], ["ROBOTICS ENGINEERING", "ROBOTIC ENGINEERING"]),
  C("AU", "automobile-engineering", "Automobile Engineering", "AU", "MECHANICAL", ["AU"], ["AUTOMOBILE ENGINEERING"]),
  C("AT", "automotive-engineering", "Automotive Engineering", "ATE", "MECHANICAL", ["AT"], ["AUTOMOTIVE ENGINEERING"]),
  C("IM", "industrial-engineering-management", "Industrial Engineering and Management", "IEM", "MECHANICAL", ["IM"], ["INDUSTRIAL ENGINEERING & MANAGEMENT"]),
  C("IP", "industrial-production-engineering", "Industrial and Production Engineering", "IPE", "MECHANICAL", ["IP"], ["INDUSTRIAL & PRODUCTION ENGINEERING", "PRODUCTION ENGINEERING"]),
  C("OT", "industrial-iot", "Industrial IoT", "IIoT", "MECHANICAL", ["OT", "TI"], ["INDUSTRIAL IOT"]),
  C("YH", "engineering-design", "Engineering Design", "ED", "MECHANICAL", ["YH"], ["ENGINEERING DESIGN"]),
  C("MR", "marine-engineering", "Marine Engineering", "MRE", "MECHANICAL", ["MR"], ["MARINE ENGINEERING"]),
  C("MI", "mining-engineering", "Mining Engineering", "MIN", "MECHANICAL", ["MI", "MN"], ["MINING ENGINEERING", "MN MINING ENGINEERING"]),
  // ── Civil ──
  C("CE", "civil-engineering", "Civil Engineering", "CV", "CIVIL", ["CE", "BP"], ["CIVIL ENGINEERING", "CIVIL"]),
  C("CK", "civil-engineering-kannada", "Civil Engineering (Kannada medium)", "CV-K", "CIVIL", ["CK"], ["CIVIL ENGINEERING (KANNADA MEDIUM)"]),
  C("CV", "civil-environmental-engineering", "Civil Environmental Engineering", "CVE", "CIVIL", ["CV"], ["CIVIL ENVIRONMENTAL ENGINEERING"]),
  C("ZL", "civil-engineering-computer-application", "Civil Engineering with Computer Application", "CV-CA", "CIVIL", ["ZL"], ["CIVIL ENGINEERING WITH COMPUTER APPLICATION"]),
  C("YE", "civil-construction-sustainability", "Civil Construction and Sustainability Engineering", "CCSE", "CIVIL", ["YE"], ["CIVIL CONSTRUCTION AND SUSTAINABILITY ENGINEERING"]),
  C("CT", "construction-technology-management", "Construction Technology and Management", "CTM", "CIVIL", ["CT"], ["CONSTRUCTION TECHNOLOGY AND MGMT"]),
  C("EN", "environmental-engineering", "Environmental Engineering", "ENV", "CIVIL", ["EN"], ["ENVIRONMENTAL ENGINEERING"]),
  C("AR", "architecture", "Architecture (B.Arch)", "AR", "CIVIL", ["AR"], ["ARCHITECTURE"]),
  C("LA", "planning", "Planning (B.Plan)", "B.Plan", "CIVIL", ["LA", "UP", "UR"], ["B.PLAN", "PLANNING"]),
  // ── Chemical / Bio / Other ──
  C("CH", "chemical-engineering", "Chemical Engineering", "CHE", "CHEMICAL", ["CH"], ["CHEMICAL ENGINEERING"]),
  C("PL", "petroleum-engineering", "Petroleum Engineering", "PET", "CHEMICAL", ["PL", "DE"], ["PETROLEUM ENGINEERING"]),
  C("PE", "petrochemical-engineering", "Petrochemical Engineering", "PCE", "CHEMICAL", ["PE"], []),
  C("PT", "polymer-science-technology", "Polymer Science and Technology", "PST", "CHEMICAL", ["PT"], ["POLYMER SCIENCE & TECHNOLOGY"]),
  C("CR", "ceramics-cement-engineering", "Ceramics and Cement Engineering", "CCT", "CHEMICAL", ["CR"], ["CERAMICS & CEMENT ENGINEERING"]),
  C("ST", "silk-technology", "Silk Technology", "SLK", "OTHER", ["ST"], ["SILK TECHNOLOGY"]),
  C("TX", "textile-technology", "Textile Technology", "TXT", "OTHER", ["TX"], ["TEXTILES TECHNOLOGY"]),
  C("ZN", "pharmaceutical-engineering", "Pharmaceutical Engineering", "PHE", "CHEMICAL", ["ZN"], ["PHARMACEUTICAL ENGINEERING"]),
  C("BT", "biotechnology", "Biotechnology", "BT", "BIOTECH", ["BT", "BO"], ["BIO- TECHNOLOGY", "BIOTECHNOLOGY", "BIOTECHNOLOGY & BIO- ENGINEERING"]),
  C("BM", "biomedical-engineering", "Biomedical Engineering", "BME", "BIOTECH", ["BM"], ["BIO-MEDICAL ENGINEERING"]),
  C("BR", "biomedical-robotic-engineering", "Biomedical and Robotic Engineering", "BMR", "BIOTECH", ["BR"], ["BIOMEDICAL AND ROBOTIC ENGINEERING"]),
  C("EA", "agriculture-engineering", "Agriculture Engineering", "AGE", "OTHER", ["EA", "BA"], ["AGRICULTURE ENGINEERING", "AGRICULTURAL ENGINEERING"]),
  C("SA", "smart-agritech", "Smart Agritech", "SAT", "OTHER", ["SA"], []),
  C("AE", "aeronautical-engineering", "Aeronautical Engineering", "AE", "AEROSPACE", ["AE", "ZA"], ["AERONAUTICAL ENGINEERING"]),
  C("SE", "aerospace-engineering", "Aerospace Engineering", "ASE", "AEROSPACE", ["SE", "BL"], ["AERO SPACE ENGINEERING", "AEROSPACE ENGINEERING"]),
  C("DG", "design", "Design (B.Des)", "B.Des", "OTHER", ["DG"], ["DESIGN"]),
  C("BS", "bsc-honours", "B.Sc (Honours)", "B.Sc", "OTHER", ["BS"], []),
];

const byCode = new Map<string, CanonBranch>();
const byKey = new Map<string, CanonBranch>();
for (const b of CANON) {
  for (const c of b.codes) byCode.set(c, b);
  for (const k of b.keys) byKey.set(k, b);
}

export function resolveCanon(courseCode: string | null, courseName: string): CanonBranch | null {
  if (courseCode && byCode.has(courseCode)) return byCode.get(courseCode)!;
  const key = normalizeKey(courseName);
  if (byKey.has(key)) return byKey.get(key)!;
  return null;
}

/** Title-case a KEA course label for an auto-created branch. */
export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bAnd\b/g, "and")
    .replace(/\bOf\b/g, "of")
    .replace(/\bIn\b/g, "in")
    .replace(/\bB Tech\b|\bBtech\b|\bB\.tech\b/gi, "B.Tech")
    .replace(/\bIot\b/g, "IoT")
    .replace(/\bAi\b/g, "AI")
    .replace(/\bVlsi\b/g, "VLSI")
    .replace(/\bCs\b/g, "CS")
    .replace(/\bIt\b/g, "IT")
    .trim();
}
