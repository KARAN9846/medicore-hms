CREATE TABLE IF NOT EXISTS episodes (
 id BIGSERIAL PRIMARY KEY,

 visit_number VARCHAR(30) UNIQUE NOT NULL,

 patient_id BIGINT NOT NULL,
 arrival_type VARCHAR(50),
 funding_type VARCHAR(50),
 authorization_code VARCHAR(100),

 visit_date DATE NOT NULL,
 visit_time TIME NOT NULL,

 clinician VARCHAR(100),
 visit_type VARCHAR(50),
 service_point VARCHAR(100),

 ward_id BIGINT,
 bed_id BIGINT,

 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

 CONSTRAINT fk_episode_patient
   FOREIGN KEY (patient_id)
   REFERENCES patients(id)
   ON DELETE CASCADE
);

CREATE SEQUENCE IF NOT EXISTS visit_number_seq
START 1
INCREMENT 1;