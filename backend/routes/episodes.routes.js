const express = require("express");
const {
  createEpisode,
  getPatientEpisodes,
} = require("../controllers/episodes.controller");

const router = express.Router();

router.post("/", createEpisode);
router.get("/patient/:id", (req, res, next) => {
  req.params.patientId = req.params.id;
  next();
}, getPatientEpisodes);

module.exports = router;
