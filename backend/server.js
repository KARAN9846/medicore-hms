const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const patientsRoutes = require("./routes/patients.routes");
const episodeRoutes = require("./routes/episodes.routes");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/api/patients", patientsRoutes);
app.use("/api/episodes", episodeRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const startServer = async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed", error);
    process.exit(1);
  }
};

startServer();
