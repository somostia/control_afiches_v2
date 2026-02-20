import React, { useState, useEffect } from 'react';
import api from '../api';

const FormularioDisenador = () => {
    const [nombreCampana, setNombreCampana] = useState('');
    const [tareas, setTareas] = useState([{ local: '', tipo: '', cantidad: 1 }]);
    const [sucursales, setSucursales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errores, setErrores] = useState([]);

    // Cargar sucursales disponibles al montar el componente
    useEffect(() => {
        const cargarSucursales = async () => {
            try {
                const res = await api.get('/sucursales');
                setSucursales(res.data);
            } catch (err) {
                console.error('Error al cargar sucursales:', err);
                alert('No se pudieron cargar las sucursales');
            } finally {
                setCargando(false);
            }
        };
        cargarSucursales();
    }, []);

    // Agregar una nueva fila de tarea
    const agregarFila = () => {
        setTareas([...tareas, { local: '', tipo: '', cantidad: 1 }]);
    };

    // Manejar cambios en los inputs de las tareas
    const manejarCambioTarea = (index, e) => {
        const nuevasTareas = [...tareas];
        nuevasTareas[index][e.target.name] = e.target.value;
        setTareas(nuevasTareas);
    };

    const enviarCampana = async (e) => {
        e.preventDefault();
        const mensajesError = [];

        if (!nombreCampana.trim() || nombreCampana.trim().length < 3) {
            mensajesError.push('Nombre de campaña: mínimo 3 caracteres (ej: Campaña Otoño)');
        }

        tareas.forEach((tarea, index) => {
            const numero = index + 1;
            if (!tarea.local) mensajesError.push(`Tarea ${numero}: selecciona un local`);
            if (!tarea.tipo) mensajesError.push(`Tarea ${numero}: define el tipo de afiche (ej: M)`);
            if (!tarea.cantidad || Number(tarea.cantidad) < 1) mensajesError.push(`Tarea ${numero}: cantidad debe ser mayor a 0`);
        });

        if (mensajesError.length > 0) {
            setErrores(mensajesError);
            return;
        }

        setErrores([]);

        try {
            const datos = {
                nombre: nombreCampana.trim(),
                disenador_id: 1, // ID fijo por ahora para pruebas
                tareas: tareas.map((t) => ({
                    ...t,
                    local: t.local,
                    tipo: t.tipo,
                    cantidad: Number(t.cantidad)
                }))
            };
            const res = await api.post('/campanas', datos);
            alert("Campaña creada con éxito. ID: " + res.data.id);
        } catch (err) {
            console.error(err);
            const backendError = err.response?.data?.error || 'Error al crear campaña';
            setErrores([backendError]);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Crear Nueva Campaña</h2>
            {errores.length > 0 && (
                <div style={{
                    backgroundColor: '#fdecea',
                    color: '#c0392b',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    border: '1px solid #f5b7b1'
                }}>
                    <strong>Revisa los campos:</strong>
                    <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                        {errores.map((err, idx) => (
                            <li key={idx}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}
            {cargando ? (
                <p>Cargando sucursales...</p>
            ) : (
                <form onSubmit={enviarCampana}>
                    <input
                        type="text"
                        placeholder="Nombre de la Campaña"
                        value={nombreCampana}
                        onChange={(e) => setNombreCampana(e.target.value)}
                        required
                        style={{ display: 'block', marginBottom: '20px', width: '300px' }}
                    />

                    <h3>Locales y Diseños</h3>
                    {tareas.map((tarea, index) => (
                        <div key={index} style={{ marginBottom: '10px' }}>
                            <select
                                name="local"
                                value={tarea.local}
                                onChange={(e) => manejarCambioTarea(index, e)}
                                required
                                style={{
                                    padding: '5px',
                                    marginRight: '5px',
                                    width: '200px'
                                }}
                            >
                                <option value="">Seleccionar Local</option>
                                {sucursales.map(suc => (
                                    <option key={suc.id} value={suc.nombre}>
                                        {suc.nombre}
                                    </option>
                                ))}
                            </select>
                            <input
                                name="tipo"
                                placeholder="Tipo de Afiche"
                                onChange={(e) => manejarCambioTarea(index, e)}
                                required
                            />
                            <input
                                name="cantidad"
                                type="number"
                                min="1"
                                onChange={(e) => manejarCambioTarea(index, e)}
                                style={{ width: '50px' }}
                            />
                        </div>
                    ))}

                    <button type="button" onClick={agregarFila}>+ Agregar Local</button>
                    <hr />
                    <button type="submit" style={{ backgroundColor: 'green', color: 'white' }}>
                        Publicar Campaña y Notificar Dibujante
                    </button>
                </form>
            )}
        </div>
    );
};

export default FormularioDisenador;