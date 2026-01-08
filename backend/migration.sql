-- Agregar campos faltantes a la tabla tareas_implementacion
ALTER TABLE tareas_implementacion 
ADD COLUMN IF NOT EXISTS url_diseno_referencia TEXT,
ADD COLUMN IF NOT EXISTS url_foto_paquete TEXT,
ADD COLUMN IF NOT EXISTS gps_coords VARCHAR(100);
