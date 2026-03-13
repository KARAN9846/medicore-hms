const {
  createEpisode: createEpisodeModel,
  getPatientEpisodes: getPatientEpisodesModel,
} = require("../models/episode.model");

const createEpisode = async (req, res) => {
  try {
    const episodeId = await createEpisodeModel(req.body);
    return res.status(201).json({ episodeId });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getPatientEpisodes = async (req, res) => {
  try {
    const episodes = await getPatientEpisodesModel(req.params.patientId);
    return res.status(200).json({ episodes });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createEpisode,
  getPatientEpisodes,
};
