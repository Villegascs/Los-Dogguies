import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    projectId: "losdogguies",
    appId: "1:1097563736121:web:511c8101e32fd73fb1e5e8",
    storageBucket: "losdogguies.firebasestorage.app",
    apiKey: "AIzaSyBN7vmTFW0xauiNr81v3M_rcQquLW0VmV0",
    authDomain: "losdogguies.firebaseapp.com",
    messagingSenderId: "1097563736121"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Estado local reactivo
let state = {
    configuracion: { abierto: true, horarioApertura: "17:00", horarioCierre: "23:00" },
    categorias: [],
    productos: [],
    pedidos: []
};

// ----------------- MÉTODOS DE ESCRITURA (FIREBASE) -----------------
export async function addProducto(producto) {
    await addDoc(collection(db, "productos"), producto);
}

export async function updateProducto(id, datosActualizados) {
    await updateDoc(doc(db, "productos", id), datosActualizados);
}

export async function deleteProducto(id) {
    await deleteDoc(doc(db, "productos", id));
}

export async function addCategoria(nombre) {
    const id = nombre.toLowerCase().replace(/\s+/g, '-');
    await setDoc(doc(db, "categorias", id), { nombre });
}

export async function addPedido(pedido) {
    pedido.timestamp = Date.now();
    pedido.estado = 'Nuevo';
    const docRef = await addDoc(collection(db, "pedidos"), pedido);
    // Generar un ID legible corto
    await updateDoc(docRef, { orderId: 'ORD-' + docRef.id.slice(0, 5).toUpperCase() });
}

export async function updateEstadoPedido(id, estado) {
    await updateDoc(doc(db, "pedidos", id), { estado });
}

export async function updateConfiguracion(config) {
    await setDoc(doc(db, "sistema", "configuracion"), config, { merge: true });
}

// ----------------- LECTURA EN TIEMPO REAL -----------------
export function getState() {
    return state;
}

export function initDBListeners(onUpdateCallback) {
    // Escuchar Configuración
    onSnapshot(doc(db, "sistema", "configuracion"), (docSnap) => {
        if (docSnap.exists()) {
            state.configuracion = { ...state.configuracion, ...docSnap.data() };
        } else {
            // Inicializar si no existe
            setDoc(doc(db, "sistema", "configuracion"), state.configuracion);
        }
        onUpdateCallback();
    });

    // Escuchar Categorías
    onSnapshot(collection(db, "categorias"), (snapshot) => {
        state.categorias = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdateCallback();
    });

    // Escuchar Productos
    onSnapshot(collection(db, "productos"), (snapshot) => {
        state.productos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdateCallback();
    });

    // Escuchar Pedidos
    onSnapshot(collection(db, "pedidos"), (snapshot) => {
        state.pedidos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => b.timestamp - a.timestamp);
        onUpdateCallback();
    });
}
