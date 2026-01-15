require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Buzta2026',
    database: process.env.DB_NAME || 'sistema_afiches',
    port: process.env.DB_PORT || 5432
});

async function consultar() {
    try {
        console.log('🔍 Consultando base de datos...\n');

        // 1. Listar todas las tablas
        console.log('📊 TABLAS EXISTENTES:');
        const tablas = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        tablas.rows.forEach(t => console.log(`   ✓ ${t.table_name}`));

        // 2. Estructura de cada tabla
        for (const tabla of tablas.rows) {
            console.log(`\n📋 ESTRUCTURA: ${tabla.table_name}`);
            const columnas = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position;
            `, [tabla.table_name]);

            columnas.rows.forEach(c => {
                console.log(`   • ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });

            // Contar registros
            const count = await pool.query(`SELECT COUNT(*) FROM ${tabla.table_name}`);
            console.log(`   📦 Total registros: ${count.rows[0].count}`);
        }

        // 3. Datos de usuarios
        console.log('\n\n👥 USUARIOS EN LA BASE DE DATOS:');
        const usuarios = await pool.query(`
            SELECT id, nombre, usuario, rol, email, sucursal_asignada
            FROM usuarios
            ORDER BY rol, id;
        `);

        if (usuarios.rows.length === 0) {
            console.log('   ⚠️  No hay usuarios');
        } else {
            usuarios.rows.forEach(u => {
                console.log(`   ${u.id}. ${u.usuario.padEnd(15)} | ${u.rol.padEnd(15)} | ${u.sucursal_asignada || 'N/A'}`);
            });
        }

        // 4. Datos de sucursales (si existe)
        try {
            console.log('\n\n🏢 SUCURSALES EN LA BASE DE DATOS:');
            const sucursales = await pool.query('SELECT * FROM sucursales ORDER BY nombre');

            if (sucursales.rows.length === 0) {
                console.log('   ⚠️  No hay sucursales');
            } else {
                sucursales.rows.forEach(s => {
                    console.log(`   ${s.id}. ${s.nombre.padEnd(25)} | ${s.direccion || 'Sin dirección'}`);
                });
            }
        } catch (err) {
            console.log('   ❌ Tabla sucursales no existe');
        }

        // 5. Datos de campañas
        console.log('\n\n📢 CAMPAÑAS EN LA BASE DE DATOS:');
        const campanas = await pool.query('SELECT * FROM campanas ORDER BY id');

        if (campanas.rows.length === 0) {
            console.log('   ⚠️  No hay campañas');
        } else {
            campanas.rows.forEach(c => {
                console.log(`   ${c.id}. ${c.nombre}`);
            });
        }

        // 6. Datos de tareas
        console.log('\n\n📋 TAREAS EN LA BASE DE DATOS:');
        const tareas = await pool.query(`
            SELECT t.id, t.sucursal_nombre, t.tipo_afiche, c.nombre as campana
            FROM tareas_implementacion t
            LEFT JOIN campanas c ON t.campana_id = c.id
            ORDER BY t.id;
        `);

        if (tareas.rows.length === 0) {
            console.log('   ⚠️  No hay tareas');
        } else {
            tareas.rows.forEach(t => {
                console.log(`   ${t.id}. ${t.sucursal_nombre.padEnd(20)} | ${t.tipo_afiche || 'N/A'} | ${t.campana || 'Sin campaña'}`);
            });
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

consultar();
