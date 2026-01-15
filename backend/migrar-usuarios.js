const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function aplicarMigracionUsuarios() {
    try {
        console.log('🔄 Conectando a PostgreSQL...');
        const client = await pool.connect();

        // Agregar columnas de usuario y password si no existen
        console.log('📝 Agregando columnas de autenticación...');
        await client.query(`
            ALTER TABLE usuarios 
            ADD COLUMN IF NOT EXISTS usuario VARCHAR(50) UNIQUE,
            ADD COLUMN IF NOT EXISTS password VARCHAR(255);
        `);

        // Actualizar usuarios existentes con credenciales por defecto
        console.log('🔑 Actualizando credenciales de usuarios...');

        const updates = [
            { usuario: 'admin', password: 'admin', id: 1 },
            { usuario: 'disenador', password: 'disenador', id: 2 },
            { usuario: 'dibujante', password: 'dibujante', id: 3 },
            { usuario: 'implementador', password: 'implementador', id: 4 },
            { usuario: 'supervisor', password: 'supervisor', id: 5 }
        ];

        for (const update of updates) {
            await client.query(
                'UPDATE usuarios SET usuario = $1, password = $2 WHERE id = $3',
                [update.usuario, update.password, update.id]
            );
            console.log(`✅ Usuario actualizado: ${update.usuario}`);
        }

        console.log('\n✅ Migración completada exitosamente');
        console.log('\nUsuarios disponibles:');
        console.log('- admin / admin');
        console.log('- disenador / disenador');
        console.log('- dibujante / dibujante');
        console.log('- implementador / implementador');
        console.log('- supervisor / supervisor');

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

aplicarMigracionUsuarios();
