import { addPedido, getState, initDBListeners } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // Smooth scrolling to menu
    const scrollBtn = document.getElementById('scroll-to-menu');
    const menuSection = document.getElementById('menu-section');

    if (scrollBtn && menuSection) {
        scrollBtn.addEventListener('click', () => {
            menuSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Cart Elements
    const cartIcon = document.getElementById('cart-icon');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');
    
    let cart = [];

    if (cartIcon && cartSidebar && cartOverlay && closeCartBtn) {
        // Toggle Cart
        window.toggleCart = function() {
            cartSidebar.classList.toggle('active');
            cartOverlay.classList.toggle('active');
        }

        cartIcon.addEventListener('click', toggleCart);
        closeCartBtn.addEventListener('click', toggleCart);
        cartOverlay.addEventListener('click', toggleCart);
    }

    // Render Menu from DB
    function renderMenu() {
        const menuGrid = document.getElementById('menu-grid-container');
        if (!menuGrid) return; // If we are in admin page, this won't run

        const state = getState();
        const config = state.configuracion;
        const productos = state.productos.filter(p => p.disponible);

        menuGrid.innerHTML = '';

        if (!config.abierto) {
            menuGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; font-size: 1.5rem; color: var(--primary); padding: 3rem;">
                Lo sentimos, estamos cerrados por ahora. (Horarios: ${config.horarioApertura} - ${config.horarioCierre})
            </div>`;
            return;
        }

        productos.forEach(p => {
            const article = document.createElement('article');
            article.classList.add('product-card');
            article.innerHTML = `
                <div class="product-image-container">
                    <img src="${p.imagen}" alt="${p.nombre}" class="product-image">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${p.nombre}</h3>
                    <p class="product-desc">${p.descripcion}</p>
                    <div class="product-bottom">
                        <span class="product-price">$${p.precio.toFixed(2)}</span>
                        <button class="btn-add-cart" onclick="addToCart('${p.id}', '${p.nombre}', ${p.precio}, '${p.imagen}', this)">Añadir</button>
                    </div>
                </div>
            `;
            menuGrid.appendChild(article);
        });
    }

    window.addToCart = function(id, name, price, image, btnElement) {
        const config = getState().configuracion;
        if (!config.abierto) {
            alert('Lo sentimos, estamos cerrados por ahora.');
            return;
        }

        const existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, image, quantity: 1 });
        }
        
        // Visual feedback
        const originalText = btnElement.innerText;
        btnElement.innerText = '¡Añadido!';
        btnElement.style.backgroundColor = 'var(--secondary)';
        btnElement.style.color = 'var(--bg-dark)';
        
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.style.backgroundColor = 'transparent';
            btnElement.style.color = 'var(--text-light)';
        }, 1000);

        updateCart();
        
        if(!cartSidebar.classList.contains('active')){
            toggleCart();
        }
    };

    // Update Cart UI
    function updateCart() {
        if (!cartItemsContainer) return;
        // Clear current items
        cartItemsContainer.innerHTML = '';
        
        let total = 0;
        let count = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío.</p>';
        } else {
            cart.forEach(item => {
                total += item.price * item.quantity;
                count += item.quantity;

                const cartItemElement = document.createElement('div');
                cartItemElement.classList.add('cart-item');
                
                cartItemElement.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)} c/u</div>
                        <div class="cart-item-quantity">
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="removeItem('${item.id}')">Quitar</button>
                `;
                
                cartItemsContainer.appendChild(cartItemElement);
            });
        }

        cartCount.innerText = count;
        cartTotalPrice.innerText = `$${total.toFixed(2)}`;
    }

    // Window global functions for inline onclick handlers
    window.updateQuantity = function(id, change) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            updateCart();
        }
    };

    window.removeItem = function(id) {
        cart = cart.filter(i => i.id !== id);
        updateCart();
    };

    // Checkout Modal Elements
    const btnCheckout = document.getElementById('btn-checkout');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutBtn = document.getElementById('close-checkout');
    const checkoutForm = document.getElementById('checkout-form');
    const metodoPagoSelect = document.getElementById('metodo-pago');
    const pagoEfectivoFields = document.getElementById('pago-efectivo-fields');
    const pagoMovilFields = document.getElementById('pago-movil-fields');

    if (btnCheckout) {
        // Open Modal
        btnCheckout.addEventListener('click', () => {
            const config = getState().configuracion;
            if (!config.abierto) {
                alert('La tienda está cerrada, no puedes completar pedidos ahora.');
                return;
            }

            if (cart.length > 0) {
                checkoutModal.classList.add('active');
                toggleCart(); // Close sidebar when opening modal
            } else {
                alert('Añade algunos Dogguies a tu carrito primero.');
            }
        });

        // Close Modal
        closeCheckoutBtn.addEventListener('click', () => {
            checkoutModal.classList.remove('active');
        });

        // Handle Payment Method Selection
        metodoPagoSelect.addEventListener('change', (e) => {
            const metodo = e.target.value;
            if (metodo === 'efectivo') {
                pagoEfectivoFields.classList.remove('hidden');
                pagoMovilFields.classList.add('hidden');
                
                document.getElementById('denominacion').required = true;
                
                document.getElementById('banco-origen').required = false;
                document.getElementById('pm-cedula').required = false;
                document.getElementById('pm-telefono').required = false;
                document.getElementById('pm-referencia').required = false;
                
            } else if (metodo === 'pago-movil') {
                pagoMovilFields.classList.remove('hidden');
                pagoEfectivoFields.classList.add('hidden');
                
                document.getElementById('denominacion').required = false;
                
                document.getElementById('banco-origen').required = true;
                document.getElementById('pm-cedula').required = true;
                document.getElementById('pm-telefono').required = true;
                document.getElementById('pm-referencia').required = true;
            } else {
                pagoEfectivoFields.classList.add('hidden');
                pagoMovilFields.classList.add('hidden');
            }
        });

        // Handle Form Submit
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const config = getState().configuracion;
            if (!config.abierto) {
                alert('Lo sentimos, estamos cerrados por ahora.');
                return;
            }

            const nombre = document.getElementById('nombre').value;
            const apellido = document.getElementById('apellido').value;
            const nacionalidad = document.getElementById('nacionalidad').value;
            const cedula = document.getElementById('cedula').value;
            const telefono = document.getElementById('telefono').value;
            const metodo = metodoPagoSelect.value;
            
            const pedido = {
                cliente: { nombre, apellido, nacionalidad, cedula, telefono },
                metodo: metodo,
                items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
                total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            };

            if (metodo === 'efectivo') {
                pedido.denominacion = document.getElementById('denominacion').value;
            } else if (metodo === 'pago-movil') {
                pedido.banco = document.getElementById('banco-origen').value;
                pedido.pmNacionalidad = document.getElementById('pm-nacionalidad').value;
                pedido.pmCedula = document.getElementById('pm-cedula').value;
                pedido.pmTelefono = document.getElementById('pm-telefono').value;
                pedido.referencia = document.getElementById('pm-referencia').value;
            }
            
            // Añadir el pedido a la base de datos de Firebase
            await addPedido(pedido);
            
            alert(`¡Gracias por tu pedido, ${nombre}! Lo hemos recibido exitosamente y comenzaremos a prepararlo.`);
            
            // Reset everything
            cart = [];
            updateCart();
            checkoutForm.reset();
            checkoutModal.classList.remove('active');
            pagoEfectivoFields.classList.add('hidden');
            pagoMovilFields.classList.add('hidden');
        });
    }

    // Initialize Menu when on main page
    if (document.getElementById('menu-grid-container')) {
        // Escuchar cambios desde Firebase y redibujar menú
        initDBListeners(() => {
            renderMenu();
        });
    }

});
