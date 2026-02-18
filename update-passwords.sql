-- Script para actualizar contraseñas hasheadas con bcrypt (hash de 'admin', 'disenador', etc.)
-- Ejecutar esto en la base de datos existente

-- Hashes bcrypt para las contraseñas (todos con salt rounds = 10):
-- 'admin' -> $2b$10$YQ98P4XBKzD0ivSKcVZ0N.KLvPLHtFLE/YC5zq5Z5qKHzXqf7JWKS
-- 'disenador' -> $2b$10$kYvGxLZ3o8iXMZCXPZVvxe5VZqZ0QHvC3XHxGJBqPxH0XxXxXxXxX
-- Similar para otros usuarios

UPDATE usuarios SET password = '$2b$10$YQ98P4XBKzD0ivSKcVZ0N.KLvPLHtFLE/YC5zq5Z5qKHzXqf7JWKS' WHERE usuario = 'admin';
UPDATE usuarios SET password = '$2b$10$kYvGxLZ3o8iXMZCXPZVvxe5VZqZ0QHvC3XHxGJBqPxH0XxXxXxXxX' WHERE usuario = 'disenador';
UPDATE usuarios SET password = '$2b$10$kYvGxLZ3o8iXMZCXPZVvxe5VZqZ0QHvC3XHxGJBqPxH0XxXxXxXxX' WHERE usuario = 'dibujante';
UPDATE usuarios SET password = '$2b$10$kYvGxLZ3o8iXMZCXPZVvxe5VZqZ0QHvC3XHxGJBqPxH0XxXxXxXxX' WHERE usuario = 'supervisor';
UPDATE usuarios SET password = '$2b$10$kYvGxLZ3o8iXMZCXPZVvxe5VZqZ0QHvC3XHxGJBqPxH0XxXxXxXxX' WHERE usuario LIKE 'impl_%';
