const pool = require("../config/db");

const pickFields = (source, fields) =>
  fields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
      accumulator[field] = source[field];
    }

    return accumulator;
  }, {});

const buildInsertQuery = (tableName, data, returning = "") => {
  const columns = Object.keys(data);

  if (columns.length === 0) {
    throw new Error(`No data provided for ${tableName}`);
  }

  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const values = columns.map((column) => data[column]);

  return {
    text: `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})${returning}`,
    values,
  };
};

const searchPatients = async (query) => {
  const searchTerm = `%${query}%`;

  const sql = `
    SELECT
      p.id,
      p.ehr_number,
      p.first_name,
      p.last_name,
      p.gender,
      p.dob,
      pc.mobile_number
    FROM patients p
    LEFT JOIN patient_contacts pc ON pc.patient_id = p.id
    WHERE p.first_name ILIKE $1
      OR p.last_name ILIKE $1
      OR p.ehr_number ILIKE $1
      OR pc.mobile_number ILIKE $1
    LIMIT 10
  `;

  const { rows } = await pool.query(sql, [searchTerm]);
  return rows;
};

const findPatientById = async (patientId) => {
  const sql = `
    SELECT
      p.id,
      p.ehr_number,
      p.first_name,
      p.last_name,
      p.gender,
      p.dob,
      pc.mobile_number
    FROM patients p
    LEFT JOIN patient_contacts pc ON pc.patient_id = p.id
    WHERE p.id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(sql, [patientId]);
  return rows[0] || null;
};

const registerPatient = async (patientData) => {
  const ehrResult = await pool.query(
    "SELECT 'EHR-' || LPAD(NEXTVAL('ehr_number_seq')::text, 5, '0') AS ehr_number"
  );
  const generatedEhrNumber = ehrResult.rows[0].ehr_number;
  const client = await pool.connect();

  const patient =
    patientData.patient ||
    pickFields(patientData, [
      "category",
      "first_name",
      "last_name",
      "gender",
      "dob",
    ]);

  const contact = pickFields(
    patientData.contact || patientData,
    ["mobile_number", "email"]
  );

  const address =
    patientData.address ||
    pickFields(patientData, [
      "address_line",
      "address_line_1",
      "address_line_2",
      "suburb",
      "city",
      "state",
      "area_code",
      "postal_code",
      "country",
    ]);

  try {
    await client.query("BEGIN");

    const patientInsert = buildInsertQuery(
      "patients",
      {
        ...patient,
        ehr_number: generatedEhrNumber,
      },
      " RETURNING id"
    );
    const patientResult = await client.query(
      patientInsert.text,
      patientInsert.values,
    );
    const patientId = patientResult.rows[0].id;

    const contactInsert = buildInsertQuery("patient_contacts", {
      patient_id: patientId,
      ...contact,
    });
    await client.query(contactInsert.text, contactInsert.values);

    const addressInsert = buildInsertQuery("patient_addresses", {
      patient_id: patientId,
      ...address,
    });
    await client.query(addressInsert.text, addressInsert.values);

    await client.query("COMMIT");
    return patientId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  findPatientById,
  registerPatient,
  searchPatients,
};
