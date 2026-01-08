import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const FormularioDisenador = () => {
    const [nombreCampana, setNombreCampana] = useState('');
    const [tareas, setTareas] = useState([{ local: '', tipo: '', cantidad: 1 }]);

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
        try {
            const datos = {
                nombre: nombreCampana,
                disenador_id: 1, // ID fijo por ahora para pruebas
                tareas: tareas
            };
            const res = await axios.post(`${API_BASE_URL}/campanas`, datos);
            alert("Campaña creada con éxito. ID: " + res.data.id);
        } catch (err) {
            console.error(err);
            alert("Error al crear campaña");
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Crear Nueva Campaña</h2>
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
                        <input
                            name="local"
                            placeholder="Nombre del Local"
                            onChange={(e) => manejarCambioTarea(index, e)}
                            required
                        />
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
        </div>
    );
};

export default FormularioDisenador;