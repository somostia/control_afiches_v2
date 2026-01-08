const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        console.log('🔄 Conectando a PostgreSQL...');
        const client = await pool.connect();

        console.log('📄 Leyendo archivo de migración...');
        const migrationSQL = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf8');

        console.log('🚀 Ejecutando migración...');
        await client.query(migrationSQL);

        console.log('✅ Migración completada exitosamente!');

        // Verificar las columnas
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tareas_implementacion'
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Columnas en tareas_implementacion:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al ejecutar migración:', err);
        process.exit(1);
    }
}

runMigration();
