const express = require("express");
const {
  getPatientById,
  registerPatient,
  searchPatients,
} = require("../controllers/patients.controller");

const router = express.Router();

router.get("/search", searchPatients);
router.get("/:id", getPatientById);
router.post("/", registerPatient);

module.exports = router;
