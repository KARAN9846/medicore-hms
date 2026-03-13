export const MOCK_PATIENTS = [
  {
    ehr: "TES0000018",
    firstName: "Ranjit",
    lastName: "Patient",
    dob: "2000-05-13",
    phone: "0712345678",
    gender: "Male",
  },
  {
    ehr: "TES0000019",
    firstName: "Karan",
    lastName: "Jaria",
    dob: "2002-01-10",
    phone: "0723456789",
    gender: "Male",
  },
];

export const MOCK_VISITS = [
  {
    ehr: "TES0000018",
    visitNo: "VIS-00045",
    visitDate: "2026-02-14",
    visitType: "Routine Out Patient",
  },
  {
    ehr: "TES0000018",
    visitNo: "VIS-00046",
    visitDate: "2026-02-28",
    visitType: "Laboratory",
  },
  {
    ehr: "TES0000018",
    visitNo: "VIS-00047",
    visitDate: "2026-03-05",
    visitType: "Follow-up Visit",
  },
  {
    ehr: "TES0000019",
    visitNo: "VIS-00042",
    visitDate: "2026-01-22",
    visitType: "Emergency Treatment",
  },
  {
    ehr: "TES0000019",
    visitNo: "VIS-00043",
    visitDate: "2026-02-09",
    visitType: "Radiology",
  },
  {
    ehr: "TES0000019",
    visitNo: "VIS-00044",
    visitDate: "2026-03-01",
    visitType: "Special Out Patient",
  },
];

export const BED_POOL = {
  "General Ward": ["G-101", "G-102", "G-103"],
  ICU: ["ICU-01", "ICU-02"],
  Emergency: ["E-11", "E-12"],
};

export function calcAgeFromDob(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

export function generateEHR() {
  const random = Math.floor(10000 + Math.random() * 90000);
  return "EHR-" + random;
}
