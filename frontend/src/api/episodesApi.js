const API_BASE_URL = "http://localhost:5000/api";

export async function createEpisode(episodeData) {
  const response = await fetch(`${API_BASE_URL}/episodes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(episodeData),
  });

  if (!response.ok) {
    throw new Error("Failed to create episode");
  }

  return response.json();
}
