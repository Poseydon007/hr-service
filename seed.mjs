// Seed script — imports 101 True East employees + creates initial API keys
// Run: node seed.mjs

import { drizzle } from "drizzle-orm/mysql2";
import { createHash, randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const db = drizzle(DB_URL);

const EMPLOYEES = [
  // Management
  { fullName: "Bader Al Sharif",          department: "Management",      jobTitle: "CEO" },
  { fullName: "Mohammed Qenbazo",         department: "Management",      jobTitle: "Manager" },
  { fullName: "Yahia Amer",               department: "Management",      jobTitle: "Manager" },
  { fullName: "Melo J.",                  department: "Management",      jobTitle: "COO" },
  // Accounting
  { fullName: "Abdul Aleem Salam",        department: "Accounting",      jobTitle: "Accountant" },
  { fullName: "Mohammed Temsah",          department: "Accounting",      jobTitle: "Accountant" },
  { fullName: "Karim Radwan",             department: "Accounting",      jobTitle: "Accountant" },
  // HR
  { fullName: "Raed Al Anazi",            department: "HR",              jobTitle: "HR Specialist" },
  { fullName: "Abdulla Shamari",          department: "HR",              jobTitle: "HR Specialist" },
  { fullName: "Amal Omar",                department: "HR",              jobTitle: "HR Specialist" },
  // Logistic
  { fullName: "Hassan Khalifa",           department: "Logistics",       jobTitle: "Logistics Coordinator" },
  { fullName: "Reda Kazaz",               department: "Logistics",       jobTitle: "Logistics Coordinator" },
  { fullName: "Jawad Botaka",             department: "Logistics",       jobTitle: "Logistics Coordinator" },
  { fullName: "Riyadh Ismail",            department: "Logistics",       jobTitle: "Logistics Coordinator" },
  { fullName: "Mohammed Ismail",          department: "Logistics",       jobTitle: "Logistics Coordinator" },
  // Saudization
  { fullName: "Reem Sebah",               department: "Saudization",     jobTitle: "Saudization Officer" },
  { fullName: "Sahar Sandi",              department: "Saudization",     jobTitle: "Saudization Officer" },
  { fullName: "Abdul Aziz Shamari",       department: "Saudization",     jobTitle: "Saudization Officer" },
  { fullName: "Sultan Minan",             department: "Saudization",     jobTitle: "Saudization Officer" },
  { fullName: "Abdulrahman Anzi",         department: "Saudization",     jobTitle: "Saudization Officer" },
  { fullName: "Sarah Anazi",              department: "Saudization",     jobTitle: "Saudization Officer" },
  { fullName: "Rakan Miman",              department: "Saudization",     jobTitle: "Saudization Officer" },
  { fullName: "Abdul Rahman Anazi",       department: "Saudization",     jobTitle: "Saudization Officer" },
  { fullName: "Basma Sebah",              department: "Saudization",     jobTitle: "Saudization Officer" },
  { fullName: "Shahid Al Sharif",         department: "Saudization",     jobTitle: "Saudization Officer" },
  // Drilling
  { fullName: "Mohammed Awad",            department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Mohammed Hussin",          department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Abdulsalam Qenbazo",       department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Ahmed Masoud",             department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Mohammed Yuosif",          department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Abdullah Abas",            department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Sylivestar Richsred",      department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Jewah Miah",               department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Bashir Sarker",            department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Sojan Miah",               department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Kamma Caleng",             department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Asim Taskin",              department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Md Anis",                  department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Volkan Acik",              department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Sumon Miah",               department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Abo Hanif",                department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Saeed Omar",               department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Eyad Naji",                department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Zakariyai Salmi",          department: "Drilling",        jobTitle: "Driller" },
  { fullName: "Masnah Zeb",               department: "Drilling",        jobTitle: "Driller" },
  // Helpers
  { fullName: "Md Mohsin",                department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mohammed Moustafa",        department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Wael Nahla",               department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Muhammed Imran",           department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Imran Khan",               department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mohammed Kamran",          department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Parvaiz Khan",             department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Wisam Salem",              department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Nurul Islam",              department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Md Salah",                 department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Md Kawsar",                department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mahmoud Md",               department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Saeed Ahmed",              department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Faysal Abdul Hasem",       department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Ghulam Hussin",            department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Ghulam Guos",              department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Gabriel Dioniz",           department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Yousef Sylvestar",         department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mehedi Hasan",             department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Ayman Mahmoud",            department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Sazzad Johirul",           department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mohsen Miya",              department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mohammed Sajib",           department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Al Amin",                  department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Ijaz Ul Haq",              department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Ahmed Mohammed",           department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mohammed Bashir",          department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mohammed Ashour",          department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Babuddin",                 department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Liyaqat Khan",             department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mahmoud Jabal",            department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mohammed Islam",           department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Khalid Majdi",             department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Shakib Miah",              department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Shujat Abbasi",            department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Ryan Khalfazri",           department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Khairul Ikhwan",           department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Adil Ali",                 department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Md Kaiyum",                department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mukhtar Saeef",            department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Mohammed Rubel",           department: "Operations",      jobTitle: "Field Helper" },
  { fullName: "Amro Basyoni",             department: "Operations",      jobTitle: "Field Helper" },
  // Drivers
  { fullName: "Mohammed Sajid",           department: "Drivers",         jobTitle: "Driver" },
  { fullName: "Zain Khan",                department: "Drivers",         jobTitle: "Driver" },
  { fullName: "Mohammed Wassim",          department: "Drivers",         jobTitle: "Driver" },
  { fullName: "Mohammed Khalid",          department: "Drivers",         jobTitle: "Driver" },
  { fullName: "Jahanzeb Waheed",          department: "Drivers",         jobTitle: "Driver" },
  { fullName: "Mohammed Nasir",           department: "Drivers",         jobTitle: "Driver" },
  { fullName: "Alamgir Khan",             department: "Drivers",         jobTitle: "Driver" },
  { fullName: "Mohammed Rizaqah",         department: "Drivers",         jobTitle: "Driver" },
  { fullName: "Saleh Bashir",             department: "Drivers",         jobTitle: "Driver" },
  // Maintenance
  { fullName: "Abdullah Qenbazo",         department: "Maintenance",     jobTitle: "Maintenance Technician" },
  { fullName: "Mazidul Abbes",            department: "Maintenance",     jobTitle: "Maintenance Technician" },
  { fullName: "Moinsharif Pathan",        department: "Maintenance",     jobTitle: "Maintenance Technician" },
  { fullName: "Hammad Ali",               department: "Maintenance",     jobTitle: "Maintenance Technician" },
  { fullName: "Md Uzzal",                 department: "Maintenance",     jobTitle: "Maintenance Technician" },
  { fullName: "Yasry Zaki",               department: "Maintenance",     jobTitle: "Maintenance Technician" },
];

function makeCode(department, index) {
  const prefixes = {
    Management: "MGT", Accounting: "ACC", HR: "HR", Logistics: "LOG",
    Saudization: "SAU", Drilling: "DRL", Operations: "OPS",
    Drivers: "DRV", Maintenance: "MNT",
  };
  const p = prefixes[department] ?? "EMP";
  return `TE-${p}-${String(index).padStart(3, "0")}`;
}

async function seed() {
  console.log("Seeding employees...");

  // Insert employees
  const deptCounters = {};
  for (const emp of EMPLOYEES) {
    deptCounters[emp.department] = (deptCounters[emp.department] ?? 0) + 1;
    const code = makeCode(emp.department, deptCounters[emp.department]);
    await db.execute(`
      INSERT IGNORE INTO employees (uuid, employee_code, full_name, department, job_title, status, timezone)
      VALUES (?, ?, ?, ?, ?, 'active', 'Asia/Riyadh')
    `, [uuidv4(), code, emp.fullName, emp.department, emp.jobTitle]);
  }
  console.log(`✓ ${EMPLOYEES.length} employees inserted`);

  // Create bootstrap admin API key (full scope)
  const raw = randomBytes(24).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 8);
  await db.execute(`
    INSERT INTO api_keys (key_hash, key_prefix, app_name, scope, active)
    VALUES (?, ?, 'admin-bootstrap', '["full"]', 1)
  `, [hash, prefix]);

  // Create IMS portal key (read:profile + read:internal)
  const imsRaw = randomBytes(24).toString("hex");
  const imsHash = createHash("sha256").update(imsRaw).digest("hex");
  const imsPrefix = imsRaw.slice(0, 8);
  await db.execute(`
    INSERT INTO api_keys (key_hash, key_prefix, app_name, scope, active)
    VALUES (?, ?, 'ims-portal', '["read:profile","read:internal"]', 1)
  `, [imsHash, imsPrefix]);

  // DSR / DTD key (read:profile only)
  const dsrRaw = randomBytes(24).toString("hex");
  const dsrHash = createHash("sha256").update(dsrRaw).digest("hex");
  const dsrPrefix = dsrRaw.slice(0, 8);
  await db.execute(`
    INSERT INTO api_keys (key_hash, key_prefix, app_name, scope, active)
    VALUES (?, ?, 'dsr-system', '["read:profile"]', 1)
  `, [dsrHash, dsrPrefix]);

  console.log("\n=== API KEYS — SAVE THESE NOW ===");
  console.log(`Admin (full):        ${raw}`);
  console.log(`IMS Portal:          ${imsRaw}`);
  console.log(`DSR / DTD System:    ${dsrRaw}`);
  console.log("=================================\n");

  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
