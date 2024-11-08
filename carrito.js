// Función para generar un identificador único
function generarSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
}

let session_id = localStorage.getItem('session_id');
if (!session_id) {
    session_id = generarSessionId();
    localStorage.setItem('session_id', session_id);
    console.log('Se ha creado un nuevo session_id:', session_id);
} else {
    console.log('Se ha recuperado el session_id existente:', session_id);
}

function agregaralcarritoAnonimo(producto_id, cantidad) {
    fetch('http://localhost:3000/api/carrito-anonimo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id, producto_id, cantidad })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Producto agregado al carrito anónimo:', data);
    })
    .catch(error => {
        console.error('Error al agregar al carrito:', error);
    });
}

function agregaralcarritoAutenticado(producto_id, cantidad) {
    const usuario_id = localStorage.getItem('usuario_id');

    if (!usuario_id) {
        console.error('No hay usuario autenticado. No se puede agregar al carrito.');
        return;
    }

    fetch('http://localhost:3000/api/carrito', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario_id, producto_id, cantidad })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Producto agregado al carrito:', data);
    })
    .catch(error => {
        console.error('Error al agregar al carrito:', error);
    });
}

function agregaralCarrito(producto_id, cantidad) {
    const usuario_id = localStorage.getItem('usuario_id');
    
    if (usuario_id) {

        agregaralcarritoAutenticado(producto_id, cantidad);
    } else {
        agregaralcarritoAnonimo(producto_id, cantidad);
    }
}


