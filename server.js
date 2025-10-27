// server.js
const express = require('express');
const { Client } = require('pg'); 
require('dotenv').config(); // Para cargar el archivo .env localmente

const app = express();
app.use(express.json());

// 1. Proceso de conexión entre aplicación y base de datos
const client = new Client({
    connectionString: process.env.DATABASE_URL, // Usa la URI del .env / Render
});

client.connect()
    .then(() => console.log('✅ Conexión exitosa a Supabase (PostgreSQL)'))
    .catch(err => console.error('❌ Error de conexión a la BD', err.stack));

// ------------------------------------------------------------------
// RUTA 1: Interfaz de Usuario (HTML simple para el Entregable 1: Interfaz de usuario)
// ------------------------------------------------------------------
app.get('/', (req, res) => {
    // Esto es una interfaz de usuario simple para el entregable
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <title>Academia de Danza API</title>
            <style>
                body { font-family: sans-serif; padding: 40px; text-align: center; }
                a { color: #3458dbff; text-decoration: none; }
                a:hover { text-decoration: underline; }
                .status { padding: 10px; border-radius: 5px; background-color: #ffbcf6ff; color: #010001ff; border: 1px solid #000000ff; display: inline-block; }
            </style>
        </head>
        <body>
            <h1>Bienvenido a la API de la Academia de Danza</h1>
            <p class="status">Aplicación Desplegada y Conectada a la Base de Datos</p>
            <p><strong>Funcionalidad Principal:</strong> Consulta de Videos de Coreografías</p>
            <p>Accede a la ruta de datos para ver los videos:</p>
            <p><a href="/videos">videos</a></p>
        </body>
        </html>
    `);
});


// ------------------------------------------------------------------
// RUTA 2: Funcionalidad Principal (Consulta de Videos)
// ------------------------------------------------------------------
app.get('/videos', async (req, res) => {
    try {
        const { data: videos, error } = await supabase
            .from('video') 
            .select('*');

        if (error) {
            console.error('Error de Supabase:', error);
            // Si hay un error, al menos envía el error para diagnosticarlo
            return res.status(500).json({ message: "Error al consultar la BD", details: error.message }); 
        }

        // Si no hay error, debe enviar los datos
        res.json(videos);
        
    } catch (e) {
        // Si el servidor falla antes de la consulta
        console.error('Error en la ruta /videos:', e.message);
        res.status(500).send("Error interno del servidor.");
    }
});


// ------------------------------------------------------------------
// INICIO DEL SERVIDOR
// ------------------------------------------------------------------
// Render (o Node.js) asignará automáticamente una variable de entorno llamada PORT 
// que usará el puerto 80 o 443. Si no la encuentra (localmente), usa 3000.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en http://localhost:${PORT}`);
});