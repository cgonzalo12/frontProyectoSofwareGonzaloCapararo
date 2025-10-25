const API_URL = 'https://localhost:7268/api/v1/dish';
const ORDER_API_URL = 'https://localhost:7268/api/v1/Order';

// 🆕 Detectar si hay un número de orden en la URL
const params = new URLSearchParams(window.location.search);
const orderNumber = params.get("orderNumber");
if (orderNumber) {
  sessionStorage.setItem("currentOrder", orderNumber);
}

document.addEventListener('DOMContentLoaded', loadDishes);

async function loadDishes() {
  try {
    const res = await fetch(API_URL, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error('Error al cargar los platos');
    const dishes = await res.json();

    const container = document.getElementById('dishContainer');
    container.innerHTML = '';

    dishes.forEach(dish => {
      if (!dish.isActive) return; // mostrar solo los activos

      const imgUrl = dish.image === "string" ? "../assets/img/no-image.png" : dish.image;

      const card = document.createElement('div');
      card.classList.add('col-md-4', 'col-lg-3');

      card.innerHTML = `
      <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
        <img src="${imgUrl}" class="card-img-top" alt="${dish.name}" style="object-fit: cover; height: 180px;">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title fw-bold text-dark">${dish.name}</h5>
          <p class="card-text text-muted mb-3 description-text">
            ${dish.description || 'Sin descripción disponible.'}
          </p>

          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-primary">${dish.category.name}</span>
              <h6 class="text-success fw-semibold mb-0">$${dish.price.toFixed(2)}</h6>
            </div>

            ${
              orderNumber
                ? `
                  <div class="bg-light p-2 rounded-3 border mb-3">
                    <label for="qty-${dish.id}" class="form-label mb-1 small text-secondary">Cantidad</label>
                    <input type="number" id="qty-${dish.id}" class="form-control form-control-sm mb-2" min="1" value="1">

                    <label for="note-${dish.id}" class="form-label mb-1 small text-secondary">Notas (opcional)</label>
                    <textarea id="note-${dish.id}" class="form-control form-control-sm mb-2" rows="2" placeholder="Ej: sin sal, extra salsa..."></textarea>

                    <button class="btn btn-success btn-sm w-100 fw-semibold"
                            onclick='addToOrder(${JSON.stringify(dish)})'>
                      ➕ Agregar a orden #${orderNumber}
                    </button>
                  </div>
                `
                : ""
            }

            <a href="dish.html?id=${dish.id}" class="btn btn-outline-primary w-100 fw-semibold">
              🔍 Ver detalle
            </a>
          </div>
        </div>
      </div>
    `;


      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error:', error);
    const container = document.getElementById('dishContainer');
    container.innerHTML = `<div class="alert alert-danger">No se pudieron cargar los platos 😢</div>`;
  }
}

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
    const resOrder = await fetch(ORDER_API_GET, { headers: { accept: "application/json" } });
    if (!resOrder.ok) throw new Error("No se pudo obtener la orden actual");
    const order = await resOrder.json();

    //notas
    const noteInput = document.getElementById(`note-${dish.id}`);
    const note = noteInput ? noteInput.value.trim() : "";

    //cantidad
    const qtyInput = document.getElementById(`qty-${dish.id}`);
    let quantity = qtyInput ? parseInt(qtyInput.value, 10) : NaN;
    if (isNaN(quantity) || quantity < 1) quantity = 1;

    // 2️⃣ Crear lista actualizada de items
    const updatedItems = [...order.items];

    // 3️⃣ Verificar si ya existe el plato
    const existingItem = updatedItems.find(i => i.dish.id === dish.id);
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 0) + quantity;
    } else {
      updatedItems.push({
        dish: { id: dish.id }, // importante: enviar objeto con id
        quantity: quantity,
        notes: note
      });
    }

    // 4️⃣ Transformar al formato que espera el backend
    const body = {
      items: updatedItems.map(i => ({
        dish: i.dish.id,       // solo el id
        quantity: i.quantity,
        notes: i.notes || ""
      }))
    };

    // 5️⃣ Enviar la lista completa al backend
    const updateRes = await fetch(ORDER_API_PATCH, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!updateRes.ok) throw new Error("Error al actualizar la orden");

    // 6️⃣ Mostrar notificación
    //showToast(`Se agregó "${dish.name}" a la orden #${orderNumber}`);

    // 7️⃣ Opcional: redirigir a la página de la orden
    window.location.href = `/pages/order.html?orderNumber=${orderNumber}`;
  } catch (err) {
    console.error(err);
    alert("Hubo un problema al agregar el plato a la orden.");
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
