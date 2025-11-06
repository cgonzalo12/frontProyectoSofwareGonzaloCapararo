const API_URL = "https://localhost:7268/api/v1/Order";

// Lista de posibles estados
const statuses = [
  { id: 1, name: "Pending" },
  { id: 2, name: "In progress" },
  { id: 3, name: "Ready" },
  { id: 4, name: "Delivery" },
  { id: 5, name: "Closed" },
];

// === Cargar todas las órdenes ===
async function loadOrders() {
  try {
    const response = await fetch(API_URL);
    const orders = await response.json();

    const tbody = document.getElementById("ordersTableBody");
    tbody.innerHTML = "";

    orders.forEach((order) => {
      // 🔹 Generar HTML de cada ítem con selector de estado y botón
      const itemsHtml = order.items
        .map(
          (item) => `
            <div class="border rounded p-2 mb-2 bg-light">
              <strong>${item.dish.name}</strong> (${item.quantity} u.)
              <br />
              Estado actual:
              <span class="badge bg-info">${item.status.name}</span><br/>
              Notas: ${item.notes || "-"}
              
              <div class="d-flex align-items-center mt-2">
                <select id="status-${order.orderNumber}-${item.dish.id}"
                        class="form-select form-select-sm"
                        style="width: 140px;">
                  ${statuses
                    .map(
                      (s) =>
                        `<option value="${s.id}" ${
                          s.name.toLowerCase() === item.status.name.toLowerCase()
                            ? "selected"
                            : ""
                        }>${s.name}</option>`
                    )
                    .join("")}
                </select>
                <button class="btn btn-sm btn-primary ms-2"
                        onclick="updateItemStatus(${order.orderNumber}, '${item.dish.id}')">
                  Cambiar estado
                </button>
              </div>
            </div>
          `
        )
        .join("");

      // 🔹 Fila completa de la tabla
      const row = `
        <tr>
          <td>${order.orderNumber}</td>
          <td>$${order.totalAmount.toFixed(2)}</td>
          <td>${order.deliveryTo}</td>
          <td>${order.notes || "-"}</td>
          <td>
            <span class="badge bg-${
              order.status.name.toLowerCase().includes("pendiente")
                ? "warning"
                : order.status.name.toLowerCase().includes("entregado")
                ? "success"
                : "secondary"
            }">${order.status.name}</span>
          </td>
          <td>${order.deliveryType.name}</td>
          <td>${new Date(order.createAt).toLocaleString("es-AR")}</td>
          <td>
            <a href="order.html?orderNumber=${order.orderNumber}"
               class="btn btn-primary btn-sm">
              Ver orden
            </a>
          </td>
          <td>${itemsHtml}</td>
        </tr>
      `;

      tbody.insertAdjacentHTML("beforeend", row);
    });
  } catch (error) {
    console.error("Error al cargar las órdenes:", error);
  }
}

// === Actualizar estado de un ítem ===
async function updateItemStatus(orderId, itemId) {
  const select = document.getElementById(`status-${orderId}-${itemId}`);
  const status = parseInt(select.value);

  if (isNaN(status) || status < 1 || status > 5) {
    alert("Estado no válido");
    return;
  }

  try {
    const response = await fetch(
      `https://localhost:7268/api/v1/order/${orderId}/item/${itemId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) throw new Error("Error al actualizar el estado");

    alert("✅ Estado actualizado correctamente");
    loadOrders(); // recargar la tabla para reflejar cambios
  } catch (error) {
    console.error(error);
    alert("❌ No se pudo actualizar el estado");
  }
}

document.addEventListener("DOMContentLoaded", loadOrders);
