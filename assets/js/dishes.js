const API_URL = "https://localhost:7268/api/v1/dish";
const ORDER_API_URL = "https://localhost:7268/api/v1/Order";

// 🆕 Detectar si hay un número de orden en la URL
const params = new URLSearchParams(window.location.search);
const orderNumber = params.get("orderNumber");
if (orderNumber) {
  sessionStorage.setItem("currentOrder", orderNumber);
}

document.addEventListener("DOMContentLoaded", loadDishes);

async function loadDishes() {
  try {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const name = params.get("name");

    // Armar la URL con filtro si existe categoría
    let url = API_URL;
    if (category) url += `?category=${category}`;

    // Armar la URL con filtro si existe nombre
    if (name) {
      if (url.includes("?")) url += `&name=${name}`;
      else url += `?name=${name}`;
    }

    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error("Error al cargar los platos");
    const dishes = await res.json();

    const container = document.getElementById("dishContainer");
    container.innerHTML = "";

    dishes.forEach((dish) => {
      if (!dish.isActive) return; // mostrar solo los activos

      const imgUrl =
        dish.image === "string" ? "../assets/img/no-image.png" : dish.image;

      const card = document.createElement("div");
      card.classList.add("col-md-4", "col-lg-3");

      card.innerHTML = `
        <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
          <img src="${imgUrl}" class="card-img-top" alt="${
        dish.name
      }" style="object-fit: cover; height: 180px;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title fw-bold text-dark">${dish.name}</h5>
            <p class="card-text text-muted mb-3 description-text">
              ${dish.description || "Sin descripción disponible."}
            </p>

            <div class="mt-auto">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-primary">${dish.category.name}</span>
                <h6 class="text-success fw-semibold mb-0">$${dish.price.toFixed(
                  2
                )}</h6>
              </div>

              ${
                orderNumber
                  ? `
                    <div class="bg-light p-2 rounded-3 border mb-3">
                      <label for="qty-${
                        dish.id
                      }" class="form-label mb-1 small text-secondary">Cantidad</label>
                      <input type="number" id="qty-${
                        dish.id
                      }" class="form-control form-control-sm mb-2" min="1" value="1">

                      <label for="note-${
                        dish.id
                      }" class="form-label mb-1 small text-secondary">Notas (opcional)</label>
                      <textarea id="note-${
                        dish.id
                      }" class="form-control form-control-sm mb-2" rows="2" placeholder="Ej: sin sal, extra salsa..."></textarea>

                      <button class="btn btn-success btn-sm w-100 fw-semibold"
                              onclick='addToOrder(${JSON.stringify(dish)})'>
                        ➕ Agregar a orden #${orderNumber}
                      </button>
                    </div>
                  `
                  : ""
              }

              <a href="dish.html?id=${
                dish.id
              }" class="btn btn-outline-primary w-100 fw-semibold">
                🔍 Ver detalle
              </a>
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // Mostrar texto si no hay resultados
    if (container.innerHTML === "") {
      container.innerHTML = `<div class="alert alert-warning text-center">No hay platos disponibles en esta categoría.</div>`;
    }
  } catch (error) {
    console.error("Error:", error);
    const container = document.getElementById("dishContainer");
    container.innerHTML = `<div class="alert alert-danger">No se pudieron cargar los platos 😢</div>`;
  }
}

//buscar
document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const query = searchInput.value.trim();
    if (!query) return alert("Ingresa un texto para buscar");

    // Redirigir a dishes.html con el parámetro ?name=...
    const url = `/pages/dishes.html?name=${encodeURIComponent(query)}`;
    window.location.href = url;
  });
});





// === Manejo de filtros por categoría ===
document.addEventListener("DOMContentLoaded", () => {
  const categoryButtons = document.querySelectorAll(".category-btn");

  const params = new URLSearchParams(window.location.search);
  const currentCategory = params.get("category");

  categoryButtons.forEach((btn) => {
    const btnId = btn.getAttribute("data-id");
    if (btnId === currentCategory || (!btnId && !currentCategory)) {
      btn.classList.add("fw-bold", "text-primary"); // Agregar estilos
    } else {
      btn.classList.remove("fw-bold", "text-primary");
    }

    btn.addEventListener("click", () => {
      const categoryId = btn.getAttribute("data-id");
      const url = categoryId
        ? `/pages/dishes.html?category=${categoryId}`
        : `/pages/dishes.html`;
      window.location.href = url;
    });
  });
});

// 🧩 Agregar plato a la orden existente
async function addToOrder(dish) {
  const orderNumber = sessionStorage.getItem("currentOrder");
  if (!orderNumber) {
    alert("No hay una orden activa.");
    return;
  }

  const ORDER_API_GET = `https://localhost:7268/api/v1/order/${orderNumber}`;
  const ORDER_API_PATCH = `https://localhost:7268/api/v1/order?id=${orderNumber}`;

  try {
    // 1️⃣ Obtener la orden actual
    const resOrder = await fetch(ORDER_API_GET, {
      headers: { accept: "application/json" },
    });
    if (!resOrder.ok) throw new Error("No se pudo obtener la orden actual");
    const order = await resOrder.json();

    // 2️⃣ Obtener notas y cantidad desde el formulario
    const noteInput = document.getElementById(`note-${dish.id}`);
    const note = noteInput ? noteInput.value.trim() : "";

    const qtyInput = document.getElementById(`qty-${dish.id}`);
    let quantity = qtyInput ? parseInt(qtyInput.value, 10) : NaN;
    if (isNaN(quantity) || quantity < 1) quantity = 1;

    // 3️⃣ Crear lista actualizada de items
    const updatedItems = [...order.items];
    const existingItem = updatedItems.find((i) => i.dish.id === dish.id);
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 0) + quantity;
    } else {
      updatedItems.push({
        dish: { id: dish.id },
        quantity: quantity,
        notes: note,
      });
    }

    // 4️⃣ Formatear body según espera el backend
    const body = {
      items: updatedItems.map((i) => ({
        dish: i.dish.id,
        quantity: i.quantity,
        notes: i.notes || "",
      })),
    };

    // 5️⃣ Enviar PATCH al backend
    const updateRes = await fetch(ORDER_API_PATCH, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // 6️⃣ Si falla, mostrar mensaje de error devuelto
    if (!updateRes.ok) {
      let errorMsg = "Error al actualizar la orden.";
      try {
        const errorData = await updateRes.json();
        // Captura mensajes del backend: { message }, { error }, o texto plano
        errorMsg =
          errorData.message || errorData.error || JSON.stringify(errorData);
      } catch {
        const text = await updateRes.text();
        if (text) errorMsg = text;
      }
      alert(`⚠️ ${errorMsg}`);
      return;
    }

    // 7️⃣ Si todo ok, redirigir y opcionalmente notificar
    // showToast(`Se agregó "${dish.name}" a la orden #${orderNumber}`);
    window.location.href = `/pages/order.html?orderNumber=${orderNumber}`;
  } catch (err) {
    console.error("❌ Error inesperado:", err);
    alert(`❌ Error: ${err.message}`);
  }
}

// 🧱 Mostrar Toast (notificación visual)
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return alert(message); // fallback si falta el contenedor

  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-white border-0 mb-2 ${
    type === "success" ? "bg-success" : "bg-danger"
  }`;
  toast.role = "alert";
  toast.ariaLive = "assertive";
  toast.ariaAtomic = "true";

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  toastContainer.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

// const API_URL = 'https://localhost:7268/api/v1/dish';

// document.addEventListener('DOMContentLoaded', loadDishes);

// async function loadDishes() {
//   try {
//     const res = await fetch(API_URL, { headers: { accept: 'application/json' } });
//     if (!res.ok) throw new Error('Error al cargar los platos');
//     const dishes = await res.json();

//     const container = document.getElementById('dishContainer');
//     container.innerHTML = '';

//     dishes.forEach(dish => {
//       if (!dish.isActive) return; // mostrar solo los activos

//       const imgUrl = dish.image === "string" ? "../assets/img/no-image.png" : dish.image;

//       const card = document.createElement('div');
//       card.classList.add('col-md-4', 'col-lg-3');

//       card.innerHTML =  `
//         <div class="card h-100 shadow-sm">
//           <img src="${imgUrl}" class="card-img-top" alt="${dish.name}">
//           <div class="card-body d-flex flex-column">
//             <h5 class="card-title">${dish.name}</h5>
//             <p class="card-text text-muted mb-2 description-text">${dish.description || 'Sin descripción'}</p>

//             <div class="mt-auto">
//               <p><span class="badge bg-primary">${dish.category.name}</span></p>
//               <h6 class="text-success mb-2">$${dish.price.toFixed(2)}</h6>
//               <!-- Link al detalle del plato -->
//               <a href="dish.html?id=${dish.id}" class="btn btn-primary">Ver detalle</a>
//             </div>
//           </div>
//         </div>
//       `;

//       container.appendChild(card);
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     const container = document.getElementById('dishContainer');
//     container.innerHTML = `<div class="alert alert-danger">No se pudieron cargar los platos 😢</div>`;
//   }
// }
