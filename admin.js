import {
    addProducto, updateProducto, deleteProducto,
    addCategoria, updateEstadoPedido, updateConfiguracion,
    getState, initDBListeners
} from './db.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- Navegación entre secciones ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(item.dataset.target).classList.add('active');
        });
    });

    // --- Estado de la Tienda ---
    const storeToggle = document.getElementById('store-toggle');
    const storeStatusText = document.getElementById('store-status-text');

    function loadStoreConfig() {
        const config = getState().configuracion;
        storeToggle.checked = config.abierto;
        updateStoreStatusText(config.abierto);

        document.getElementById('hora-apertura').value = config.horarioApertura;
        document.getElementById('hora-cierre').value = config.horarioCierre;
    }

    function updateStoreStatusText(abierto) {
        if (abierto) {
            storeStatusText.innerText = "Abierto";
            storeStatusText.classList.remove('cerrado');
        } else {
            storeStatusText.innerText = "Cerrado";
            storeStatusText.classList.add('cerrado');
        }
    }

    storeToggle.addEventListener('change', async (e) => {
        const isOpen = e.target.checked;
        updateStoreStatusText(isOpen);
        await updateConfiguracion({ abierto: isOpen });
    });

    document.getElementById('config-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const apertura = document.getElementById('hora-apertura').value;
        const cierre = document.getElementById('hora-cierre').value;
        await updateConfiguracion({ horarioApertura: apertura, horarioCierre: cierre });
        alert('Horario actualizado con éxito');
    });

    // --- Gestión de Pedidos ---
    function renderPedidos() {
        const pedidos = getState().pedidos;
        const container = document.getElementById('pedidos-container');
        const badge = document.getElementById('badge-nuevos');

        container.innerHTML = '';

        const nuevos = pedidos.filter(p => p.estado === 'Nuevo').length;
        badge.innerText = nuevos;

        if (pedidos.length === 0) {
            container.innerHTML = '<p>No hay pedidos aún.</p>';
            return;
        }

        pedidos.forEach(p => {
            const date = new Date(p.timestamp).toLocaleString();
            let itemsHtml = p.items.map(i => `<li><span>${i.quantity}x ${i.name}</span> <span>$${(i.price * i.quantity).toFixed(2)}</span></li>`).join('');

            // Datos del cliente y pago
            let pagoHtml = `<p><strong>Método:</strong> ${p.metodo}</p>`;
            if (p.metodo === 'efectivo') {
                pagoHtml += `<p><strong>Denominación:</strong> ${p.denominacion}</p>`;
            } else if (p.metodo === 'pago-movil') {
                pagoHtml += `<p><strong>Ref:</strong> ${p.referencia} | <strong>Banco:</strong> ${p.banco}</p>`;
            }

            let accionesHtml = '';
            if (p.estado === 'Nuevo') {
                accionesHtml = `<button class="btn-preparar" onclick="cambiarEstadoPedido('${p.id}', 'Preparando')">Preparar</button>`;
            } else if (p.estado === 'Preparando') {
                accionesHtml = `<button class="btn-completar" onclick="cambiarEstadoPedido('${p.id}', 'Completado')">Completar</button>`;
            }

            const card = document.createElement('div');
            card.classList.add('pedido-card');
            card.innerHTML = `
                <div class="pedido-header">
                    <span class="pedido-id">#${p.id}</span>
                    <span class="pedido-estado estado-${p.estado}">${p.estado}</span>
                </div>
                <div class="pedido-cliente">
                    <p><strong>Cliente:</strong> ${p.cliente.nombre} ${p.cliente.apellido}</p>
                    <p><strong>Cédula:</strong> ${p.cliente.nacionalidad}-${p.cliente.cedula}</p>
                    <p><strong>Teléfono:</strong> ${p.cliente.telefono}</p>
                    ${pagoHtml}
                    <p style="font-size:0.8rem; color: gray; margin-top:0.5rem">${date}</p>
                </div>
                <div class="pedido-items">
                    <ul>${itemsHtml}</ul>
                    <div class="pedido-total">Total: $${p.total.toFixed(2)}</div>
                </div>
                <div class="pedido-actions">
                    ${accionesHtml}
                </div>
            `;
            container.appendChild(card);
        });
    }

    window.cambiarEstadoPedido = async function (id, estado) {
        await updateEstadoPedido(id, estado);
    };

    // --- Gestión de Menú (Productos y Categorías) ---
    function renderCategorias() {
        const catList = document.getElementById('categorias-list');
        const selectProd = document.getElementById('prod-categoria');
        const categorias = getState().categorias;

        catList.innerHTML = '';
        selectProd.innerHTML = '';

        categorias.forEach(cat => {
            catList.innerHTML += `<span class="cat-tag">${cat.nombre}</span>`;
            selectProd.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
        });
    }

    document.getElementById('add-categoria-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('nueva-categoria');
        await addCategoria(input.value);
        input.value = '';
    });

    function renderProductos() {
        const tbody = document.getElementById('productos-tbody');
        const productos = getState().productos;
        const categorias = getState().categorias;

        tbody.innerHTML = '';

        productos.forEach(p => {
            const catNombre = categorias.find(c => c.id === p.categoriaId)?.nombre || p.categoriaId;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${p.imagen}" class="table-img"></td>
                <td><strong>${p.nombre}</strong></td>
                <td>${catNombre}</td>
                <td>$${p.precio.toFixed(2)}</td>
                <td>${p.disponible ? '✅ Sí' : '❌ No'}</td>
                <td>
                    <button class="btn-icon" onclick="editarProducto('${p.id}')">✏️</button>
                    <button class="btn-icon" onclick="eliminarProducto('${p.id}')">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Modal de Productos
    const prodModal = document.getElementById('producto-modal');
    const prodForm = document.getElementById('producto-form');

    document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
        document.getElementById('modal-titulo').innerText = 'Añadir Producto';
        prodForm.reset();
        document.getElementById('prod-id').value = '';
        prodModal.classList.add('active');
    });

    document.getElementById('close-producto-modal').addEventListener('click', () => {
        prodModal.classList.remove('active');
    });

    prodForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value;
        const producto = {
            nombre: document.getElementById('prod-nombre').value,
            descripcion: document.getElementById('prod-descripcion').value,
            precio: parseFloat(document.getElementById('prod-precio').value),
            categoriaId: document.getElementById('prod-categoria').value,
            imagen: document.getElementById('prod-imagen').value,
            disponible: document.getElementById('prod-disponible').checked
        };

        if (id) {
            await updateProducto(id, producto);
        } else {
            await addProducto(producto);
        }

        prodModal.classList.remove('active');
    });

    window.editarProducto = function (id) {
        const producto = getState().productos.find(p => p.id === id);
        if (producto) {
            document.getElementById('modal-titulo').innerText = 'Editar Producto';
            document.getElementById('prod-id').value = producto.id;
            document.getElementById('prod-nombre').value = producto.nombre;
            document.getElementById('prod-descripcion').value = producto.descripcion;
            document.getElementById('prod-precio').value = producto.precio;
            document.getElementById('prod-categoria').value = producto.categoriaId;
            document.getElementById('prod-imagen').value = producto.imagen;
            document.getElementById('prod-disponible').checked = producto.disponible;

            prodModal.classList.add('active');
        }
    };

    window.eliminarProducto = async function (id) {
        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            await deleteProducto(id);
        }
    };

    // --- Login Logic ---
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('login-user').value;
            const pass = document.getElementById('login-pass').value;

            // Credenciales por defecto
            if (user === 'admin' && pass === 'dogguies2026') {
                loginOverlay.classList.remove('active');
                
                // Inicializar listeners de Firebase (Se redibujará todo cuando llegue data) solo al loguearse
                initDBListeners(() => {
                    loadStoreConfig();
                    renderCategorias();
                    renderProductos();
                    renderPedidos();
                });
            } else {
                loginError.innerText = 'Usuario o contraseña incorrectos';
            }
        });
    }

});
