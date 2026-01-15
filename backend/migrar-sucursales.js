require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Buzta2026',
    database: process.env.DB_NAME || 'sistema_afiches',
    port: process.env.DB_PORT || 5432
});

async function migrar() {
    try {
        console.log('🔄 Iniciando migración: Tabla de Sucursales...\n');

        // 1. Crear tabla sucursales
        console.log('1️⃣  Creando tabla sucursales...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sucursales (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) UNIQUE NOT NULL,
                direccion VARCHAR(200),
                activo BOOLEAN DEFAULT TRUE,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla sucursales creada\n');

        // 2. Insertar sucursales
        console.log('2️⃣  Insertando sucursales...');

        const sucursales = [
            { nombre: 'Mall Plaza', direccion: 'Av. Libertador Bernardo O\'Higgins 1234' },
            { nombre: 'Costanera Center', direccion: 'Av. Andrés Bello 2425' },
            { nombre: 'Portal La Dehesa', direccion: 'Av. La Dehesa 1445' },
            { nombre: 'Parque Arauco', direccion: 'Av. Kennedy 5413' },
            { nombre: 'Alto Las Condes', direccion: 'Av. Kennedy 9001' }
        ];

        for (const suc of sucursales) {
            const existe = await pool.query(
                'SELECT id FROM sucursales WHERE nombre = $1',
                [suc.nombre]
            );

            if (existe.rows.length > 0) {
                console.log(`   ⚠️  Ya existe: ${suc.nombre}`);
            } else {
                await pool.query(
                    'INSERT INTO sucursales (nombre, direccion) VALUES ($1, $2)',
                    [suc.nombre, suc.direccion]
                );
                console.log(`   ✅ Creada: ${suc.nombre}`);
            }
        }

        // 3. Crear índice
        console.log('\n3️⃣  Creando índice...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_usuarios_sucursal 
            ON usuarios(sucursal_asignada);
        `);
        console.log('✅ Índice creado\n');

        // 4. Resumen
        console.log('4️⃣  Resumen de sucursales:');
        const resultado = await pool.query(`
            SELECT 
                s.nombre as sucursal,
                COUNT(u.id) as implementadores
            FROM sucursales s
            LEFT JOIN usuarios u ON u.sucursal_asignada = s.nombre AND u.rol = 'implementador'
            GROUP BY s.nombre
            ORDER BY s.nombre
        `);

        console.log('\n┌────────────────────────────────────────────────┐');
        console.log('│ Sucursal              │ Implementadores       │');
        console.log('├────────────────────────────────────────────────┤');
        resultado.rows.forEach(r => {
            console.log(`│ ${r.sucursal.padEnd(21)} │ ${String(r.implementadores).padStart(21)} │`);
        });
        console.log('└────────────────────────────────────────────────┘\n');

        console.log('✅ ¡Migración completada exitosamente!\n');
        console.log('📋 Ahora los diseñadores verán un dropdown con estas sucursales.');

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

migrar();
