const Company = require("../models/Company");
const Student = require("../models/Student");
const Room = require("../models/Room");
const Panel = require("../models/Panel");

const companyTemplates = [
  "Google",
  "Microsoft",
  "Amazon",
  "Adobe",
  "Flipkart",
  "Walmart",
  "Infosys",
  "TCS",
  "Accenture",
  "Deloitte",
  "Wipro",
  "Cognizant",
  "Capgemini",
  "Oracle",
  "SAP",
  "IBM",
  "Cisco",
  "Intel",
  "Paytm",
  "PhonePe",
  "Razorpay",
  "Swiggy",
  "Zomato",
  "Juspay",
  "Zoho",
  "Freshworks",
  "Myntra",
  "EY",
  "KPMG",
  "PwC",
  "Goldman Sachs",
  "Morgan Stanley",
  "NVIDIA",
  "Qualcomm",
  "Siemens",
];

const branches = [
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "ME",
  "CE",
];

// company generation

const generateCompanies = async () => {
  const companies = [];

  for (let i = 0; i < 35; i++) {
    let priorityTier;

    if (i < 10) {
      priorityTier = 1;
    } else if (i < 23) {
      priorityTier = 2;
    } else {
      priorityTier = 3;
    }

    let shortlistCount;

    if (priorityTier === 1) {
      shortlistCount = Math.floor(Math.random() * 151) + 150;
    } else if (priorityTier === 2) {
      shortlistCount = Math.floor(Math.random() * 101) + 80;
    } else {
      shortlistCount = Math.floor(Math.random() * 71) + 30;
    }

    const company = {
      name: companyTemplates[i],
      priorityTier,
      cgpaCutoff:
        priorityTier === 1
          ? Number((7.5 + Math.random() * 1.5).toFixed(1))
          : priorityTier === 2
          ? Number((6.5 + Math.random() * 1.5).toFixed(1))
          : Number((6.0 + Math.random() * 1.0).toFixed(1)),

      interviewDuration:
        priorityTier === 1
          ? 45
          : priorityTier === 2
          ? 30
          : 30,

      availableDays:
        priorityTier === 1
          ? [1, 2]
          : [2, 3, 4],

      arrivalTime: "09:00",

      status: "active",

      shortlistCount,
    };

    companies.push(company);
  }

  return companies;
};

// Generate students

const generateStudents = async () => {
  const students = [];

  for (let i = 1; i <= 800; i++) {
    const cgpa = Number(
      (6 + Math.random() * 4).toFixed(2)
    );

    const branch =
      branches[Math.floor(Math.random() * branches.length)];

    students.push({
      studentId: `S${String(i).padStart(4, "0")}`,

      name: `Student ${i}`,

      branch,

      cgpa,

      shortlistedCompanies: [],

      status: "active",
    });
  }

  return students;
};

// generate rooms

const generateRooms = async () => {
  const rooms = [];

  for (let i = 1; i <= 20; i++) {
    rooms.push({
      roomNumber: `R${String(i).padStart(2, "0")}`,

      capacity: 1,

      available: true,

      unavailableReason: null,
    });
  }

  return rooms;
};

// generate panels
const generatePanels = (companies) => {
  const panels = [];

  companies.forEach((company) => {
    let panelCount;

    if (company.priorityTier === 1) {
      panelCount = 3;
    } else if (company.priorityTier === 2) {
      panelCount = 2;
    } else {
      panelCount = 1;
    }

    for (let i = 1; i <= panelCount; i++) {
      panels.push({
        panelId: `${company.name
          .replace(/\s/g, "")
          .toUpperCase()}-P${i}`,

        company: company._id,

        members: [
          `Interviewer ${i}-A`,
          `Interviewer ${i}-B`,
        ],

        status: "available",

        unavailableReason: null,
      });
    }
  });

  return panels;
};

// realistic shortlisting logic based on CGPA and company priority tier
const generateShortlists = (students, companies) => {
  const companyShortlists = new Map();

  companies.forEach((company) => {
    companyShortlists.set(
      company._id.toString(),
      []
    );
  });

  companies.forEach((company) => {
    const eligibleStudents = students.filter(
      (student) =>
        student.cgpa >= company.cgpaCutoff
    );

    const shuffled = [...eligibleStudents].sort(
      () => Math.random() - 0.5
    );

    const selected = shuffled.slice(
      0,
      Math.min(
        company.shortlistCount,
        shuffled.length
      )
    );

    companyShortlists.set(
      company._id.toString(),
      selected
    );

    selected.forEach((student) => {
      student.shortlistedCompanies.push(
        company._id
      );
    });
  });

  return students;
};

// seed 
const generateData = async () => {
  console.log("Generating placement data...");

  await Company.deleteMany({});
  await Student.deleteMany({});
  await Room.deleteMany({});
  await Panel.deleteMany({});

  // 1. Generate companies
  const companyData = await generateCompanies();

  const companies = await Company.insertMany(
    companyData
  );

  console.log(
    `${companies.length} companies created`
  );

  // 2. Generate students
  let students = await generateStudents();

  // 3. Generate shortlists
  students = generateShortlists(
    students,
    companies
  );

  students = await Student.insertMany(students);

  console.log(
    `${students.length} students created`
  );

  // 4. Generate rooms
  const roomData = await generateRooms();

  const rooms = await Room.insertMany(roomData);

  console.log(
    `${rooms.length} rooms created`
  );

  // 5. Generate panels
  const panelData = generatePanels(companies);

  const panels = await Panel.insertMany(panelData);

  console.log(
    `${panels.length} panels created`
  );

  console.log("Data generation completed.");

  return {
    companies,
    students,
    rooms,
    panels,
  };
};

module.exports = generateData;
