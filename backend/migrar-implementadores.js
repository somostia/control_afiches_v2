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
        console.log('🔄 Iniciando migración: Múltiples Implementadores por Sucursal...\n');

        // 1. Agregar columna sucursal_asignada
        console.log('1️⃣  Agregando columna sucursal_asignada...');
        await pool.query(`
            ALTER TABLE usuarios 
            ADD COLUMN IF NOT EXISTS sucursal_asignada VARCHAR(100);
        `);
        console.log('✅ Columna agregada exitosamente\n');

        // 2. Eliminar el implementador genérico anterior si existe
        console.log('2️⃣  Eliminando implementadores anteriores...');
        await pool.query(`
            DELETE FROM usuarios 
            WHERE rol = 'implementador';
        `);
        console.log('✅ Implementadores anteriores eliminados\n');

        // 3. Crear 5 implementadores nuevos, uno por sucursal
        console.log('3️⃣  Creando implementadores por sucursal...');

        const implementadores = [
            {
                nombre: 'Carlos Implementador Mall Plaza',
                usuario: 'impl_plaza',
                password: 'impl_plaza',
                email: 'carlos@sistema.com',
                sucursal: 'Mall Plaza'
            },
            {
                nombre: 'Pedro Implementador Costanera',
                usuario: 'impl_costanera',
                password: 'impl_costanera',
                email: 'pedro@sistema.com',
                sucursal: 'Costanera Center'
            },
            {
                nombre: 'Laura Implementadora Portal La Dehesa',
                usuario: 'impl_dehesa',
                password: 'impl_dehesa',
                email: 'laura@sistema.com',
                sucursal: 'Portal La Dehesa'
            },
            {
                nombre: 'Diego Implementador Parque Arauco',
                usuario: 'impl_arauco',
                password: 'impl_arauco',
                email: 'diego@sistema.com',
                sucursal: 'Parque Arauco'
            },
            {
                nombre: 'Sofia Implementadora Alto Las Condes',
                usuario: 'impl_altocondes',
                password: 'impl_altocondes',
                email: 'sofia@sistema.com',
                sucursal: 'Alto Las Condes'
            }
        ];

        for (const impl of implementadores) {
            // Verificar si ya existe
            const existe = await pool.query(
                'SELECT id FROM usuarios WHERE usuario = $1',
                [impl.usuario]
            );

            if (existe.rows.length > 0) {
                // Actualizar
                await pool.query(`
                    UPDATE usuarios 
                    SET nombre = $1, email = $2, sucursal_asignada = $3, password = $4
                    WHERE usuario = $5
                `, [impl.nombre, impl.email, impl.sucursal, impl.password, impl.usuario]);
                console.log(`   ✅ Actualizado: ${impl.usuario} → ${impl.sucursal}`);
            } else {
                // Insertar
                await pool.query(`
                    INSERT INTO usuarios (nombre, usuario, password, rol, email, sucursal_asignada)
                    VALUES ($1, $2, $3, 'implementador', $4, $5)
                `, [impl.nombre, impl.usuario, impl.password, impl.email, impl.sucursal]);
                console.log(`   ✅ Creado: ${impl.usuario} → ${impl.sucursal}`);
            }
        }

        console.log('\n4️⃣  Resumen de implementadores:');
        const resultado = await pool.query(`
            SELECT nombre, usuario, sucursal_asignada 
            FROM usuarios 
            WHERE rol = 'implementador'
            ORDER BY sucursal_asignada
        `);

        console.log('\n┌─────────────────────────────────────────────────────────────┐');
        resultado.rows.forEach(r => {
            console.log(`│ ${r.usuario.padEnd(20)} → ${r.sucursal_asignada.padEnd(30)} │`);
        });
        console.log('└─────────────────────────────────────────────────────────────┘\n');

        console.log('✅ ¡Migración completada exitosamente!\n');
        console.log('📋 Credenciales de acceso:');
        implementadores.forEach(impl => {
            console.log(`   • ${impl.usuario} / ${impl.password} → ${impl.sucursal}`);
        });

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

migrar();
