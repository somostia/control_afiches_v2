#!/usr/bin/env node
/**
 * Script para migrar contraseñas de texto plano a bcrypt
 * 
 * IMPORTANTE: Ejecutar solo UNA VEZ antes de desplegar a producción
 * Este script hashea todas las contraseñas en la tabla usuarios
 * 
 * Uso: node migrate-passwords.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configuración del pool de base de datos
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const SALT_ROUNDS = 10;

async function migratePasswords() {
    console.log('🔐 Iniciando migración de contraseñas...\n');

    try {
        // Obtener todos los usuarios
        const result = await pool.query('SELECT id, usuario, password FROM usuarios');
        const users = result.rows;

        if (users.length === 0) {
            console.log('⚠️  No se encontraron usuarios en la base de datos.');
            return;
        }

        console.log(`📊 Total de usuarios a migrar: ${users.length}\n`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            // Verificar si la contraseña ya está hasheada (bcrypt hashes empiezan con $2a$, $2b$, etc.)
            if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
                console.log(`⏭️  ${user.usuario}: Ya tiene hash bcrypt, omitiendo...`);
                skippedCount++;
                continue;
            }

            // Hashear la contraseña actual (que está en texto plano)
            const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

            // Actualizar en la base de datos
            await pool.query(
                'UPDATE usuarios SET password = $1 WHERE id = $2',
                [hashedPassword, user.id]
            );

            console.log(`✅ ${user.usuario}: Contraseña hasheada exitosamente`);
            migratedCount++;
        }

        console.log('\n═══════════════════════════════════════');
        console.log('🎉 Migración completada exitosamente');
        console.log(`✅ Contraseñas migradas: ${migratedCount}`);
        console.log(`⏭️  Contraseñas omitidas: ${skippedCount}`);
        console.log('═══════════════════════════════════════\n');

        // Verificar una contraseña de ejemplo
        if (migratedCount > 0) {
            console.log('🔍 Verificando hash de ejemplo...');
            const testUser = users.find(u => !u.password.startsWith('$2'));
            if (testUser) {
                const verifyResult = await pool.query(
                    'SELECT password FROM usuarios WHERE usuario = $1',
                    [testUser.usuario]
                );
                const isValid = await bcrypt.compare(testUser.password, verifyResult.rows[0].password);
                console.log(`Verificación de ${testUser.usuario}: ${isValid ? '✅ Correcto' : '❌ Error'}\n`);
            }
        }

    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        console.error(error);
    } finally {
        await pool.end();
        console.log('🔌 Conexión a base de datos cerrada.');
    }
}

// Confirmación de seguridad
console.log('⚠️  ADVERTENCIA: Este script modificará todas las contraseñas en la base de datos.');
console.log('⚠️  Asegúrese de tener un respaldo antes de continuar.\n');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('¿Desea continuar? (escriba "SI" para confirmar): ', (answer) => {
    readline.close();

    if (answer.toUpperCase() === 'SI') {
        migratePasswords();
    } else {
        console.log('❌ Migración cancelada.');
        pool.end();
    }
});
