import 'dotenv/config';
import { pool, healthCheck } from '../db.js';

async function main() {
  try {
    const ok = await healthCheck();
    if (!ok) {
      console.error('La consulta de verificación no devolvió el resultado esperado.');
      process.exitCode = 1;
      return;
    }

    console.log('Conexión a MySQL establecida correctamente.');
  } catch (error) {
    console.error('Error al intentar conectarse a la base de datos:');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
