const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function actualizarPasswords() {
    try {
        console.log('🔐 Actualizando contraseñas con bcrypt...\n');

        // Obtener todos los usuarios
        const result = await pool.query('SELECT usuario FROM usuarios');

        for (const row of result.rows) {
            const usuario = row.usuario;
            // Usar el mismo nombre de usuario como contraseña
            const hash = await bcrypt.hash(usuario, 10);
            await pool.query('UPDATE usuarios SET password = $1 WHERE usuario = $2', [hash, usuario]);
            console.log(`✅ ${usuario} actualizado`);
        }

        console.log('\n🎉 ¡Contraseñas actualizadas!');
        console.log('Ahora usa: usuario = contraseña para cada usuario\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

actualizarPasswords();
