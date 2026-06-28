// db.js - Simulación de Base de Datos con LocalStorage para prototipado rápido
// En el futuro, las llamadas de este archivo pueden reemplazarse por las de Firebase Firestore.

const DB_KEY = 'los_dogguies_db';

const defaultData = {
    configuracion: {
        abierto: true,
        horarioApertura: "17:00",
        horarioCierre: "23:00"
    },
    categorias: [
        { id: "hotdogs", nombre: "Hot Dogs" },
        { id: "bebidas", nombre: "Bebidas" },
        { id: "extras", nombre: "Extras" }
    ],
    productos: [
        {
            id: "1",
            nombre: "El Clásico",
            descripcion: "Salchicha premium, mostaza, ketchup y cebolla picada en pan brioche suave.",
            precio: 4.50,
            imagen: "assets/classic.png",
            categoriaId: "hotdogs",
            disponible: true
        },
        {
            id: "2",
            nombre: "El Mexicano",
            descripcion: "Guacamole fresco, pico de gallo, jalapeños y un toque de mayonesa picante.",
            precio: 5.50,
            imagen: "assets/mexican.png",
            categoriaId: "hotdogs",
            disponible: true
        },
        {
            id: "3",
            nombre: "El Especial",
            descripcion: "Envuelto en tocino, cebolla caramelizada, queso cheddar fundido y papas al hilo.",
            precio: 6.50,
            imagen: "assets/special.png",
            categoriaId: "hotdogs",
            disponible: true
        }
    ],
    pedidos: []
};

// Inicializar DB si no existe
function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
    }
}

// Obtener toda la base de datos
function getDB() {
    return JSON.parse(localStorage.getItem(DB_KEY));
}

// Guardar base de datos entera
function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// ----------------- MÉTODOS DE PRODUCTOS -----------------
function getProductos() {
    return getDB().productos;
}

function addProducto(producto) {
    const db = getDB();
    producto.id = Date.now().toString(); // Generar ID único
    db.productos.push(producto);
    saveDB(db);
}

function updateProducto(id, datosActualizados) {
    const db = getDB();
    const index = db.productos.findIndex(p => p.id === id);
    if (index !== -1) {
        db.productos[index] = { ...db.productos[index], ...datosActualizados };
        saveDB(db);
    }
}

function deleteProducto(id) {
    const db = getDB();
    db.productos = db.productos.filter(p => p.id !== id);
    saveDB(db);
}

// ----------------- MÉTODOS DE CATEGORÍAS -----------------
function getCategorias() {
    return getDB().categorias;
}

function addCategoria(nombre) {
    const db = getDB();
    db.categorias.push({ id: nombre.toLowerCase().replace(/\s+/g, '-'), nombre });
    saveDB(db);
}

// ----------------- MÉTODOS DE PEDIDOS -----------------
function getPedidos() {
    return getDB().pedidos.sort((a, b) => b.timestamp - a.timestamp);
}

function addPedido(pedido) {
    const db = getDB();
    pedido.id = 'ORD-' + Math.floor(Math.random() * 100000);
    pedido.timestamp = Date.now();
    pedido.estado = 'Nuevo'; // Nuevo, Preparando, Completado, Cancelado
    db.pedidos.push(pedido);
    saveDB(db);
    
    // Disparar evento para que otras pestañas (admin) se enteren
    window.dispatchEvent(new Event('storage'));
}

function updateEstadoPedido(id, estado) {
    const db = getDB();
    const index = db.pedidos.findIndex(p => p.id === id);
    if (index !== -1) {
        db.pedidos[index].estado = estado;
        saveDB(db);
    }
}

// ----------------- MÉTODOS DE CONFIGURACIÓN -----------------
function getConfiguracion() {
    return getDB().configuracion;
}

function updateConfiguracion(config) {
    const db = getDB();
    db.configuracion = { ...db.configuracion, ...config };
    saveDB(db);
}

// Ejecutar init al cargar el archivo
initDB();
