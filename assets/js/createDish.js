const API_URL = "https://localhost:7268/api/v1/dish";

document.getElementById("dishForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const category = parseInt(document.getElementById("category").value);
  const image = document.getElementById("image").value.trim();

  const payload = { name, description, price, category, image };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (res.status === 201) {
      alert("✅ Plato creado correctamente");
      e.target.reset();
    } else if (res.status === 400 || res.status === 409) {
      // La API devuelve ApiError { message: "..." }
      const errorMessage = data?.message || "Error desconocido";
      alert("⚠️ " + errorMessage);
    } else {
      alert(`⚠️ Error inesperado (${res.status})`);
    }
  } catch (err) {
    alert("🚫 Error de conexión o CORS: " + err.message);
  }
});
