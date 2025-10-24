// Obtener el parámetro ?id=... de la URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

// Referencia al contenedor donde se mostrará el plato
const dishInfo = document.getElementById("dishInfo");

// Si no hay ID en la URL, mostrar mensaje
if (!id) {
  dishInfo.innerHTML = `
    <div class="alert alert-warning text-center">
      No se especificó ningún plato 😢
    </div>
  `;
} else {
  // Llamar a la API con ese ID
  fetch(`https://localhost:7268/api/v1/dish/${id}`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Error al obtener los datos del plato");
      }
      return response.json();
    })
    .then(data => {
      // Mostrar la card del plato
      const imgUrl = data.image && data.image !== "string"
        ? data.image
        : "https://via.placeholder.com/400x300?text=Sin+Imagen";

      dishInfo.innerHTML = `
        <div class="card mx-auto shadow-sm" style="max-width: 450px;">
          <img src="${imgUrl}" alt="${data.name}" class="card-img-top">
          <div class="card-body">
            <h3 class="card-title mb-3">${data.name}</h3>
            <p class="card-text text-muted">${data.description || "Sin descripción disponible"}</p>
            <h5 class="text-success mt-3">$${data.price?.toFixed(2) || "N/D"}</h5>
            <span class="badge bg-primary mt-2">${data.category?.name || "Sin categoría"}</span>
          </div>
        </div>
      `;
    })
    .catch(error => {
      console.error(error);
      dishInfo.innerHTML = `
        <div class="alert alert-danger text-center">
          Ocurrió un error al cargar el plato 😞
        </div>
      `;
    });
}
