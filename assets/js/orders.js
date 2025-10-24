const API_URL = "https://localhost:7268/api/v1/Order"; // endpoint de órdenes

document.addEventListener("DOMContentLoaded", loadOrders);

async function loadOrders() {
  try {
    const res = await fetch(API_URL, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error("Error al cargar las órdenes");

    const orders = await res.json();
    const tbody = document.getElementById("ordersTableBody");
    tbody.innerHTML = "";

    orders.forEach(order => {
      // Crear fila
      const tr = document.createElement("tr");

      // Generar lista de items
      const itemsHtml = order.items.length
        ? order.items.map(item => 
            `<div>
              <strong>${item.dish.name}</strong> x${item.quantity} 
              ${item.notes ? `(${item.notes})` : ""}
            </div>`
          ).join("")
        : "<em>Sin items</em>";

      tr.innerHTML = `
        <td>${order.orderNumber}</td>
        <td>$${order.totalAmount.toFixed(2)}</td>
        <td>${order.deliveryTo}</td>
        <td>${order.status.name}</td>
        <td>${order.deliveryType.name}</td>
        <td>${itemsHtml}</td>
        <td>
          <a href="order.html?orderNumber=${order.orderNumber}" class="btn btn-primary btn-sm">
            Ver orden
          </a>
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error(error);
    const tbody = document.getElementById("ordersTableBody");
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">No se pudieron cargar las órdenes 😢</td></tr>`;
  }
}
