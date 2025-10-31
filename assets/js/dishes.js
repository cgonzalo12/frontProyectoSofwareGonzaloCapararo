const API_URL = "https://localhost:7268/api/v1/dish";
const ORDER_API_URL = "https://localhost:7268/api/v1/Order";

// 🆕 Detectar si hay un número de orden en la URL
const params = new URLSearchParams(window.location.search);
const orderNumber = params.get("orderNumber");
if (orderNumber) {
  sessionStorage.setItem("currentOrder", orderNumber);
}

document.addEventListener("DOMContentLoaded", () => {
  // === Referencias a los controles ===
  const activeCheckbox = document.getElementById("activeOnly");
  const sortByPriceCheckbox = document.getElementById("sortByPrice");
  const sortLabel = document.querySelector('label[for="sortByPrice"]');

  // === Estado inicial ===
  let showOnlyActive = activeCheckbox.checked;
  let sortDirection = sortByPriceCheckbox.checked ? "asc" : "desc";

  // Cargar platos iniciales
  loadDishes(showOnlyActive, sortDirection);

  // Escuchar cambios en el checkbox de "Solo activos"
  activeCheckbox.addEventListener("change", () => {
    showOnlyActive = activeCheckbox.checked;
    loadDishes(showOnlyActive, sortDirection);
  });

  // Escuchar cambios en el switch de "Ordenar por precio"
  sortByPriceCheckbox.addEventListener("change", () => {
    sortDirection = sortByPriceCheckbox.checked ? "asc" : "desc";
    sortLabel.textContent = sortByPriceCheckbox.checked
      ? "Precio ↑"
      : "Precio ↓";
    loadDishes(showOnlyActive, sortDirection);
  });
});

async function loadDishes(showOnlyActive = true, sortDirection = "asc") {
  try {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const name = params.get("name");

    // Construir la URL de la API con los filtros y orden
    let url = `${API_URL}?sortByPrice=${sortDirection}`;
    if (category) url += `&category=${category}`;
    if (name) url += `&name=${name}`;

    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error("Error al cargar los platos");
    const dishes = await res.json();

    const container = document.getElementById("dishContainer");
    container.innerHTML = "";

    dishes.forEach((dish) => {
  if (showOnlyActive && !dish.isActive) return;

  const imgUrl =
    dish.image === "string" ? "../assets/img/no-image.png" : dish.image;

  const card = document.createElement("div");
  card.classList.add("col-md-4", "col-lg-3");

  // Detectar si hay un orderNumber en la URL
  const paramsUrl = new URLSearchParams(window.location.search);
  const hasOrder = paramsUrl.has("orderNumber");

  card.innerHTML = `
    <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
      <img src="${imgUrl}" class="card-img-top" alt="${dish.name}" style="object-fit: cover; height: 180px;">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title fw-bold text-dark">${dish.name}</h5>
        <p class="card-text text-muted mb-3 description-text">
          ${dish.description || "Sin descripción disponible."}
        </p>
        <div class="mt-auto">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-primary">${dish.category.name}</span>
            <h6 class="text-success fw-semibold mb-0">$${dish.price.toFixed(2)}</h6>
          </div>

          ${
            hasOrder
              ? `
                <div class="input-group mb-2">
                  <input type="number" id="qty-${dish.id}" class="form-control" min="1" value="1" style="max-width: 80px;">
                  <input type="text" id="note-${dish.id}" class="form-control" placeholder="Nota (opcional)">
                </div>
                <button class="btn btn-success w-100 fw-semibold" onclick='addToOrder(${JSON.stringify(
                  dish
                )})'>
                  🛒 Agregar a la orden
                </button>
              `
              : `
                <a href="dish.html?id=${dish.id}" class="btn btn-outline-primary w-100 fw-semibold">
                  🔍 Ver detalle
                </a>
              `
          }
        </div>
      </div>
    </div>
  `;

  container.appendChild(card);
});


    if (container.innerHTML === "") {
      container.innerHTML = `<div class="alert alert-warning text-center">No hay platos disponibles para mostrar.</div>`;
    }
  } catch (error) {
    console.error("Error:", error);
    const container = document.getElementById("dishContainer");
    container.innerHTML = `<div class="alert alert-danger">No se pudieron cargar los platos 😢</div>`;
  }
}

// === Buscar platos ===
document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const query = searchInput.value.trim();
    if (!query) return alert("Ingresa un texto para buscar");

    const url = `/pages/dishes.html?name=${encodeURIComponent(query)}`;
    window.location.href = url;
  });
});

// === Filtros por categoría ===
document.addEventListener("DOMContentLoaded", () => {
  const categoryButtons = document.querySelectorAll(".category-btn");
  const params = new URLSearchParams(window.location.search);
  const currentCategory = params.get("category");

  categoryButtons.forEach((btn) => {
    const btnId = btn.getAttribute("data-id");
    if (btnId === currentCategory || (!btnId && !currentCategory)) {
      btn.classList.add("fw-bold", "text-primary");
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

// === Agregar plato a la orden ===
async function addToOrder(dish) {
  const orderNumber = sessionStorage.getItem("currentOrder");
  if (!orderNumber) {
    alert("No hay una orden activa.");
    return;
  }

  const ORDER_API_GET = `https://localhost:7268/api/v1/order/${orderNumber}`;
  const ORDER_API_PATCH = `https://localhost:7268/api/v1/order?id=${orderNumber}`;

  try {
    const resOrder = await fetch(ORDER_API_GET, {
      headers: { accept: "application/json" },
    });
    if (!resOrder.ok) throw new Error("No se pudo obtener la orden actual");
    const order = await resOrder.json();

    const noteInput = document.getElementById(`note-${dish.id}`);
    const note = noteInput ? noteInput.value.trim() : "";

    const qtyInput = document.getElementById(`qty-${dish.id}`);
    let quantity = qtyInput ? parseInt(qtyInput.value, 10) : NaN;
    if (isNaN(quantity) || quantity < 1) quantity = 1;

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

    const body = {
      items: updatedItems.map((i) => ({
        dish: i.dish.id,
        quantity: i.quantity,
        notes: i.notes || "",
      })),
    };

    const updateRes = await fetch(ORDER_API_PATCH, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!updateRes.ok) {
      let errorMsg = "Error al actualizar la orden.";
      try {
        const errorData = await updateRes.json();
        errorMsg =
          errorData.message || errorData.error || JSON.stringify(errorData);
      } catch {
        const text = await updateRes.text();
        if (text) errorMsg = text;
      }
      alert(`⚠️ ${errorMsg}`);
      return;
    }

    window.location.href = `/pages/order.html?orderNumber=${orderNumber}`;
  } catch (err) {
    console.error("❌ Error inesperado:", err);
    alert(`❌ Error: ${err.message}`);
  }
}

// === Toasts ===
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return alert(message);

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
