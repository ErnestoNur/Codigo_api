const express = require('express');
const app = express();
const db = require('./public/src/conectar');
const PORT = process.env.PORT || 3000;

// Middlewares 
app.use(express.json());


// Middleware para permitir archivos estáticos
app.use(express.static('public'));


//===========RUTAS===================
// localhost:3000/api/productos
app.get('/api/productos', async (req, res) => {
    try {
        const resultado = await db.query(`
            SELECT p.id,p.nombre,p.descripcion,p.precio,p.stock,p.categoria_id,p.creado_en,ip.url_imagen
            FROM producto p
            LEFT JOIN imagenproducto ip ON p.id = ip.producto_id
        `);
        res.json(resultado.rows);
    } catch (err) {
        console.error('Error al consultar la base de datos:', err);
        res.status(500).json({ error: 'Error al consultar la base de datos' });
    }
});

// localhost:3000/api/usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const resultado = await db.query('SELECT * FROM usuario');
        res.json(resultado.rows);

    } catch (err) {
        console.error('Error al consultar la base de datos:', err);
        res.status(500).jsons({ error: 'Error al consultar la base de datos' });
    }
});


app.get('/api/categorias', async (req, res) => {
    try {
        const resultado = await db.query(
            'SELECT id, name, descripcion, categoria_padre_id FROM categoria'
        );
        // Crear un diccionario para las categorías principales
        const categorias = {};

        // Primero, inicializamos todas las categorías principales con un array de subcategorías vacío
        resultado.rows.forEach(categoria => {
            if (!categoria.categoria_padre_id) {
                categorias[categoria.id] = {
                    id: categoria.id,
                    name: categoria.name,
                    descripcion: categoria.descripcion,
                    subcategorias: []
                };
            }
        });
        resultado.rows.forEach(categoria => {
            if (categoria.categoria_padre_id) {
                const categoriaPadre = categorias[categoria.categoria_padre_id];
                if (categoriaPadre) {
                    categoriaPadre.subcategorias.push({
                        id: categoria.id,
                        name: categoria.name,
                        descripcion: categoria.descripcion
                    });
                }
            }
        });
        const categoriasArray = Object.values(categorias);
        res.json(categoriasArray);
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});


// localhost:3000/api/carrito/:id
app.get('/api/item_carrito/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const resultado = await db.query('SELECT p.id,p.nombre,p.descripcion,p.precio,p.stock,p.categoria_id,p.creado_en,ip.url_imagen FROM producto p LEFT JOIN imagenproducto ip ON p.id = ip.producto_id WHERE carrito_id = $1', [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Item no encontrado' });
        }

        res.json(resultado.rows);

    } catch (err) {
        console.error('Error al obtener item del carrito:', err);
        res.status(500).json({ error: 'Error al obtener item del carrito' });
    }


});

// localhost:3000/api/item_orden/:id
app.get('/api/item_carrito/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const resultado = await db.query('SELECT * FROM itemorden WHERE carrito_id = $1', [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Item no encontrado' });
        }

        res.json(resultado.rows);

    } catch (err) {
        console.error('Error al obtener item de la orden:', err);
        res.status(500).json({ error: 'Error al obtener item del carrito' });
    }
});


app.get('/api/productos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const resultado = await db.query(
            'SELECT p.*, ip.url_imagen FROM producto p LEFT JOIN imagenproducto ip ON p.id = ip.producto_id WHERE p.id = $1',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (err) {
        console.error('Error al obtener el producto:', err);
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
});


//==========POST================
// POST localhost:3000/api/usuarios
app.post('/api/usuarios', async (req, res) => {
    try {
        const { nombre_usuario, correo, contrasena } = req.body;
        const resultado = await db.query(
            'INSERT INTO usuario (nombre_usuario,correo,contrasena,rol,creado_en) VALUES ($1,$2,$3,$4,NOW()) RETURNING *',
            [nombre_usuario, correo, contrasena, 'cliente']
        );
        res.status(201).json({ mensaje: 'Usuario creado', usuario: resultado.rows[0] });
    } catch (err) {
        console.error('Error al insertar en la base de datos:', err);
        res.status(500).json({ error: 'Error al insertar en la base de datos' });
    }
});



app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, categoria_id } = req.body;
        const resultado = await db.query(
            'INSERT INTO producto (nombre,descripcion,precio,stock,categoria_id,creado_en) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *',
            [nombre, descripcion, precio, stock, categoria_id]
        );
        res.status(201).json({ mensaje: 'Producto creado', producto: resultado.rows[0] });
    } catch (err) {
        console.error('Error al insertar en la base de datos:', err);
        res.status(500).json({ error: 'Error al insertar en la base de datos' });
    }
});


app.post('/api/login', async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        const resultado = await db.query('SELECT * FROM usuario WHERE correo = $1 AND contrasena = $2', [correo, contrasena]);
        
        if (resultado.rows.length === 0) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }
        res.json({
            mensaje: 'Bienvenido',
            usuario: {
                id: resultado.rows[0].id,
                nombre_usuario: resultado.rows[0].nombre_usuario,
                correo: resultado.rows[0].correo
            }
        });
    } catch (err) {
        console.error('Error al hacer el login:', err);
        res.status(500).json({ error: 'Error al hacer el login' });
    }
});





app.post('/api/carrito', async (req, res) => {
    try {
        const { usuario_id, producto_id, cantidad = 1 } = req.body;

        let carrito = await db.query('SELECT id FROM carrito WHERE usuario_id = $1', [usuario_id]);

        if (carrito.rows.length === 0) {
            const nuevoCarrito = await db.query(
                'INSERT INTO carrito (usuario_id, creado_en) VALUES ($1, NOW()) RETURNING *',
                [usuario_id]
            );
            carrito = nuevoCarrito;
        }

        const carrito_id = carrito.rows[0].id;

        const itemExistente = await db.query(
            'SELECT * FROM itemcarrito WHERE carrito_id = $1 AND producto_id = $2',
            [carrito_id, producto_id]
        );

        if (itemExistente.rows.length > 0) {
            const nuevaCantidad = itemExistente.rows[0].cantidad + cantidad;
            await db.query(
                'UPDATE itemcarrito SET cantidad = $1, agregado_en = NOW() WHERE id = $2',
                [nuevaCantidad, itemExistente.rows[0].id]
            );
            res.status(200).json({
                mensaje: 'Cantidad actualizada en el carrito',
                item: { producto_id, cantidad: nuevaCantidad }
            });
        } else {
            const resultado = await db.query(
                'INSERT INTO itemcarrito (carrito_id, producto_id, cantidad, agregado_en) VALUES ($1, $2, $3, NOW()) RETURNING *',
                [carrito_id, producto_id, cantidad]
            );
            res.status(201).json({
                mensaje: 'Producto agregado al carrito',
                item: resultado.rows[0]
            });
        }
    } catch (err) {
        console.error('Error al agregar producto al carrito:', err);
        res.status(500).json({ error: 'Error al agregar producto al carrito' });
    }
});


app.post('/api/carrito-anonimo', async (req, res) => {
    try {
        const { session_id, producto_id, cantidad } = req.body;

        if (!session_id) {
            return res.status(400).json({ error: 'session_id es requerido para carritos anónimos.' });
        }

        let carrito = await db.query('SELECT id FROM carrito WHERE usuario_id IS NULL AND session_id = $1', [session_id]);

        if (carrito.rows.length === 0) {
            const nuevoCarrito = await db.query(
                'INSERT INTO carrito (usuario_id, session_id, creado_en) VALUES (NULL, $1, NOW()) RETURNING *',
                [session_id]
            );
            carrito = nuevoCarrito;
        }


        const carrito_id = carrito.rows[0].id;

        const itemExistente = await db.query(
            'SELECT * FROM itemcarrito WHERE carrito_id = $1 AND producto_id = $2',
            [carrito_id, producto_id]
        );

        if (itemExistente.rows.length > 0) {
            const nuevaCantidad = itemExistente.rows[0].cantidad + cantidad;
            await db.query(
                'UPDATE itemcarrito SET cantidad = $1, agregado_en = NOW() WHERE id = $2',
                [nuevaCantidad, itemExistente.rows[0].id]
            );
            res.status(200).json({
                mensaje: 'Cantidad actualizada en el carrito anónimo',
                item: { producto_id, cantidad: nuevaCantidad }
            });
        } else {
            const resultado = await db.query(
                'INSERT INTO itemcarrito (carrito_id, producto_id, cantidad, agregado_en) VALUES ($1, $2, $3, NOW()) RETURNING *',
                [carrito_id, producto_id, cantidad]

            );

            res.status(201).json({
                mensaje: 'Producto agregado al carrito anónimo',
                item: resultado.rows[0]
            });
        }
    } catch (err) {
        console.error('Error al agregar producto al carrito anónimo:', err);
        res.status(500).json({ error: 'Error al agregar producto al carrito anónimo' });
    }
});


// POST localhost:3000/api/orden
app.post('/api/orden', async (req, res) => {
    try {
        const { usuario_id } = req.body;
        // Verificar si el usuario tiene un carrito
        const carrito = await db.query('SELECT * FROM carrito WHERE usuario_id = $1', [usuario_id]);

        if (!usuario_id) {
            return res.status(400).json({ error: 'usuario_id es requerido.' });
        }

        if (carrito.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró un carrito para este usuario.' });
        }
        const carrito_id = carrito.rows[0].id;

        // Obtener los items del carrito con sus precios
        const itemsCarrito = await db.query(`
            SELECT ic.producto_id,p.nombre,ic.cantidad, p.precio
            FROM itemcarrito ic
            JOIN producto p ON ic.producto_id = p.id
            WHERE ic.carrito_id = $1
        `, [carrito_id]);

        if (itemsCarrito.rows.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío.' });
        }
        // Calcular el total de la orden
        const total = itemsCarrito.rows.reduce((acc, item) => acc + item.cantidad * item.precio, 0);

        // Crear la orden
        const nuevaOrden = await db.query(
            'INSERT INTO orden (usuario_id, total, estado, creado_en) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [usuario_id, total, 'pendiente']
        );

        const orden_id = nuevaOrden.rows[0].id;

        // Transferir los items del carrito a la tabla `itemorden`
        for (const item of itemsCarrito.rows) {
            await db.query(
                'INSERT INTO itemorden (orden_id, producto_id, cantidad, precio) VALUES ($1, $2, $3, $4)',
                [orden_id, item.producto_id, item.cantidad, item.precio]
            );
        }

        // Limpiar el carrito
        await db.query('DELETE FROM itemcarrito WHERE carrito_id = $1', [carrito_id]);

        res.status(201).json({
            mensaje: 'Orden registrada exitosamente',
            orden: nuevaOrden.rows[0]
        });

    } catch (err) {
        console.error('Error al registrar la orden:', err);
        res.status(500).json({ error: 'Error al registrar la orden' });
    }
});


//===================DELETE======================================

// DELETE localhost:3000/api/productos/:id
app.delete('/api/productos/:id', (req, res) => {
    try {
        const id = req.params.id;
        resultado = db.query('DELETE FROM producto WHERE id = $1',
            [id]);
        resultado
        res.status(200).send({ succes: true })
    } catch (err) {
        console.error('Error al eliminar el producto ', err); C
        res.status(500).json({ error: 'Error al eliminar el producto ' });
    }

});


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
