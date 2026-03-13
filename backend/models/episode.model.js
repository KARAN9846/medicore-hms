const pool = require("../config/db");

const createEpisode = async (episodeData) => {
  const visitNumberResult = await pool.query(
    "SELECT 'VISIT-' || LPAD(NEXTVAL('visit_number_seq')::text, 5, '0') AS visit_number"
  );
  const visitNumber = visitNumberResult.rows[0].visit_number;

  const sql = `
    INSERT INTO episodes (
      visit_number,
      patient_id,
      arrival_type,
      funding_type,
      authorization_code,
      visit_date,
      visit_time,
      clinician,
      visit_type,
      service_point,
      ward_id,
      bed_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
  `;

  const values = [
    visitNumber,
    episodeData.patient_id,
    episodeData.arrival_type,
    episodeData.funding_type,
    episodeData.authorization_code,
    episodeData.visit_date,
    episodeData.visit_time,
    episodeData.clinician,
    episodeData.visit_type,
    episodeData.service_point,
    episodeData.ward_id,
    episodeData.bed_id,
  ];

  const { rows } = await pool.query(sql, values);
  return rows[0].id;
};

const getPatientEpisodes = async (patientId) => {
  const sql = `
    SELECT *
    FROM episodes
    WHERE patient_id = $1
    ORDER BY visit_date DESC, visit_time DESC
  `;

  const { rows } = await pool.query(sql, [patientId]);
  return rows;
};

module.exports = {
  createEpisode,
  getPatientEpisodes,
};
