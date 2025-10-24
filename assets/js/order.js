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


function renderOrderItems(order) {
  const orderItems = document.getElementById("orderItems");
  orderItems.innerHTML = order.items.map(item => `
    <div class="card mb-2" data-dish-id="${item.dish.id}">
      <div class="row g-0 align-items-center">
        <div class="col-md-2 text-center">
          <img src="${item.dish.image}" class="img-fluid rounded-start" alt="${item.dish.name}">
        </div>
        <div class="col-md-10">
          <div class="card-body d-flex align-items-center justify-content-between">
            <div>
              <h5 class="card-title">${item.dish.name}</h5>
              ${item.notes ? `<p class="card-text"><em>Notas: ${item.notes}</em></p>` : ""}
            </div>
            <div class="d-flex align-items-center">
              <button class="btn btn-sm btn-danger me-2" onclick="changeQuantity('${item.dish.id}', -1)">-</button>
              <span id="qty-${item.dish.id}">${item.quantity}</span>
              <button class="btn btn-sm btn-success ms-2" onclick="changeQuantity('${item.dish.id}', 1)">+</button>
              <button class="btn btn-sm btn-outline-danger ms-3" onclick="removeItem('${item.dish.id}')">Eliminar</button>
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

