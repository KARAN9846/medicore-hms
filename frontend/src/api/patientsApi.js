const API_BASE_URL = "http://localhost:5000/api";

export async function searchPatients(query) {
  const response = await fetch(
    `${API_BASE_URL}/patients/search?q=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to search patients");
  }

  return response.json();
}

export async function registerPatient(patientData) {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patientData),
  });

  if (!response.ok) {
    throw new Error("Failed to register patient");
  }

  return response.json();
}
searchPatients("john").then(console.log);
