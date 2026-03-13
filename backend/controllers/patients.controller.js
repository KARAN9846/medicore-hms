const {
  findPatientById: findPatientByIdModel,
  registerPatient: registerPatientModel,
  searchPatients: searchPatientsModel,
} = require("../models/patient.model");

const searchPatients = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Query parameter "q" is required' });
  }

  try {
    const patients = await searchPatientsModel(q);
    return res.status(200).json({ patients });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await findPatientByIdModel(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const registerPatient = async (req, res) => {
  try {
    const patientId = await registerPatientModel(req.body);
    return res.status(201).json({ patientId });
  } catch (error) {
    console.error("Patient registration failed:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getPatientById,
  registerPatient,
  searchPatients,
};
