const API_URL = "https://localhost:7268/api/v1/Order";
let orderData = null; // Para mantener la orden cargada y sus cantidades actuales

document.addEventListener("DOMContentLoaded", loadOrder);

async function loadOrder() {
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get("orderNumber");
  if (!orderNumber) return;

  try {
    const res = await fetch(`${API_URL}/${orderNumber}`, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error("No se pudo cargar la orden");

    orderData = await res.json(); // Guardamos la orden completa
    renderOrderInfo(orderData);
    renderOrderItems(orderData);

  } catch (error) {
    console.error(error);
    document.getElementById("orderInfo").innerHTML = `<p class="text-danger">No se pudo cargar la orden 😢</p>`;
  }
}


function renderOrderInfo(order) {
  const orderInfo = document.getElementById("orderInfo");
  orderInfo.innerHTML = `
    <h4>Orden #${order.orderNumber}</h4>
    <p><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
    <p><strong>Entrega a:</strong> ${order.deliveryTo}</p>
    ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ""}
    <p><strong>Estado:</strong> ${order.status.name}</p>
    <p><strong>Tipo de entrega:</strong> ${order.deliveryType.name}</p>
  `;

  // Generar el enlace hacia dishes.html con el número de orden
  const goToDishes = document.getElementById("goToDishes");
  if (goToDishes) {
    goToDishes.href = `/pages/dishes.html?orderNumber=${order.orderNumber}`;
  }
}
const statuses = [
  { id: 1, name: "Pending" },
  { id: 2, name: "In progress" },
  { id: 3, name: "Ready" },
  { id: 4, name: "Delivery" },
  { id: 5, name: "Closed" }
];

function renderOrderItems(order) {
  const orderItems = document.getElementById("orderItems");
  orderItems.innerHTML = order.items.map(item => `
    <div class="card mb-2" data-dish-id="${item.dish.id}">
  <div class="row g-0 align-items-center">
    <div class="col-md-2 text-center">
      <img src="${item.dish.image}" class="img-fluid rounded-start" alt="${item.dish.name}">
    </div>
    <div class="col-md-10">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <!-- Info del plato -->
          <div>
            <h5 class="card-title mb-1">${item.dish.name}</h5>
            ${item.notes ? `<p class="card-text mb-1"><em>Notas: ${item.notes}</em></p>` : ""}
            <p class="card-text"><small class="text-muted">Estado actual: ${item.status.name}</small></p>
          </div>

          <!-- Controles -->
          <div class="d-flex flex-wrap align-items-center justify-content-end">
            <div class="btn-group me-2" role="group" aria-label="Cantidad">
              <button class="btn btn-sm btn-danger" onclick="changeQuantity('${item.dish.id}', -1)">-</button>
              <span id="qty-${item.dish.id}" class="px-2 fw-bold">${item.quantity}</span>
              <button class="btn btn-sm btn-success" onclick="changeQuantity('${item.dish.id}', 1)">+</button>
            </div>

            <button class="btn btn-sm btn-outline-danger me-3" onclick="removeItem('${item.dish.id}')">
              Eliminar
            </button>

            <div class="d-flex align-items-center">
              <select id="status-${item.dish.id}" class="form-select form-select-sm" style="width: 140px;">
                ${statuses.map(s => `<option value="${s.id}" ${s.id === item.status ? "selected" : ""}>${s.name}</option>`).join("")}
              </select>
              <button class="btn btn-sm btn-primary ms-2" onclick="updateItemStatus(${order.orderNumber}, '${item.dish.id}')">
                Cambiar estado
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

  `).join("");

  // Agregamos botón de actualizar
  if (!document.getElementById("updateButton")) {
    const btn = document.createElement("button");
    btn.id = "updateButton";
    btn.className = "btn btn-primary mt-3";
    btn.textContent = "Actualizar Orden";
    btn.onclick = sendUpdate;
    document.getElementById("orderItems").appendChild(btn);
  }
}
// Función para llamar a la API y actualizar el estado
// Función para llamar a la API y actualizar el estado
async function updateItemStatus(orderId, itemId) {
  // Obtener el valor seleccionado del <select>
  const select = document.getElementById(`status-${itemId}`);
  const status = parseInt(select.value);

  if (isNaN(status) || status < 1 || status > 5) {
    alert("Estado no válido");
    return;
  }

  try {
    const response = await fetch(`https://localhost:7268/api/v1/order/${orderId}/item/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (!response.ok) throw new Error("Error al actualizar el estado");

    alert("✅ Estado actualizado correctamente");
    loadOrder(); // recargar la orden para reflejar el cambio
  } catch (error) {
    console.error(error);
    alert("❌ No se pudo actualizar el estado");
  }
}



// Funciones para cambiar cantidades o eliminar items en el DOM
function changeQuantity(dishId, delta) {
  const span = document.getElementById(`qty-${dishId}`);
  let newQty = parseInt(span.textContent) + delta;
  if (newQty < 0) newQty = 0;
  span.textContent = newQty;

  // Actualizamos en orderData
  const item = orderData.items.find(i => i.dish.id === dishId);
  if (item) item.quantity = newQty;
}

function removeItem(dishId) {
  orderData.items = orderData.items.filter(i => i.dish.id !== dishId);
  renderOrderItems(orderData); // Volvemos a renderizar
}

// Enviar la orden actualizada al endpoint
async function sendUpdate() {
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get("orderNumber");

  const body = {
    items: orderData.items.map(i => ({
      dish: i.dish.id,
      quantity: i.quantity,
      notes: i.notes || ""
    }))
  };

  try {
    const res = await fetch(`${API_URL}?id=${orderNumber}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error("Error al actualizar la orden");

    alert("Orden actualizada correctamente ✅");
    loadOrder(); // recargar la orden actualizada
  } catch (error) {
    console.error(error);
    alert("No se pudo actualizar la orden 😢");
  }
}

