CREATE TABLE IF NOT EXISTS patients (
    id BIGSERIAL PRIMARY KEY,

    ehr_number VARCHAR(30) UNIQUE NOT NULL,

    category VARCHAR(30) NOT NULL, 
    title VARCHAR(20),

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    nationality VARCHAR(50),
    dob DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,

    marital_status VARCHAR(30),
    religion VARCHAR(50),
    race VARCHAR(50),

    citizenship VARCHAR(100),
    language VARCHAR(50),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);


CREATE TABLE IF NOT EXISTS patient_contacts (
    id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT NOT NULL,

    mobile_number VARCHAR(30) NOT NULL,
    alt_number VARCHAR(30),
    email VARCHAR(150),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_patient_contacts_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patient_addresses (
    id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT NOT NULL,

    address_line TEXT NOT NULL,
    suburb VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    area_code VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_patient_addresses_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS patient_guarantors (
    id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT NOT NULL,

    relationship VARCHAR(50) NOT NULL,

    title VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    contact_number VARCHAR(30) NOT NULL,
    email VARCHAR(150),

    nationality VARCHAR(50),
    national_id VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_patient_guarantor_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS medical_aid_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL
);


CREATE TABLE IF NOT EXISTS medical_aid_plans (
    id SERIAL PRIMARY KEY,

    provider_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,

    CONSTRAINT fk_medical_plan_provider
        FOREIGN KEY (provider_id)
        REFERENCES medical_aid_providers(id)
);


CREATE TABLE IF NOT EXISTS patient_medical_aid (
    id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT NOT NULL,

    provider_id INT NOT NULL,
    plan_id INT NOT NULL,

    membership_number VARCHAR(100) NOT NULL,
    dependant_code VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_patient_medicalaid_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_patient_medicalaid_provider
        FOREIGN KEY (provider_id)
        REFERENCES medical_aid_providers(id),

    CONSTRAINT fk_patient_medicalaid_plan
        FOREIGN KEY (plan_id)
        REFERENCES medical_aid_plans(id)
);


CREATE INDEX IF NOT EXISTS idx_patients_first_name ON patients(first_name);
CREATE INDEX IF NOT EXISTS idx_patients_last_name ON patients(last_name);
CREATE INDEX IF NOT EXISTS idx_patients_ehr ON patients(ehr_number);
CREATE INDEX IF NOT EXISTS idx_contacts_mobile ON patient_contacts(mobile_number);