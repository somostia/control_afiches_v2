import React, { useState } from 'react';
import VistaDiseñador from './diseñador_vista.jsx';
import VistaDibujante from './dibujante_vista.jsx';
import VistaImplementador from './implementador_vista.jsx';
import VistaSupervisor from './supervisor_vista.jsx';

const PanelAdministrador = () => {
    const [vistaActiva, setVistaActiva] = useState('supervisor');
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    React.useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuStyle = {
        display: 'flex',
        flexWrap: windowWidth < 750 ? 'wrap' : 'nowrap',
        gap: '10px',
        padding: '20px',
        backgroundColor: '#2c3e50',
        overflowX: windowWidth < 750 ? 'visible' : 'auto'
    };

    const buttonStyle = (view) => ({
        padding: '10px 20px',
        cursor: 'pointer',
        backgroundColor: vistaActiva === view ? '#3498db' : '#ecf0f1',
        color: vistaActiva === view ? 'white' : 'black',
        border: 'none',
        borderRadius: '5px',
        width: windowWidth < 750 ? 'calc(50% - 5px)' : '100%',
        whiteSpace: 'nowrap',
    });

    return (
        <div>
            <nav style={menuStyle}>
                <button style={buttonStyle('supervisor')} onClick={() => setVistaActiva('supervisor')}>📊 Supervisor</button>
                <button style={buttonStyle('disenador')} onClick={() => setVistaActiva('disenador')}>✍️ Diseñador</button>
                <button style={buttonStyle('dibujante')} onClick={() => setVistaActiva('dibujante')}>🎨 Dibujante</button>
                <button style={buttonStyle('implementador')} onClick={() => setVistaActiva('implementador')}>📱 Implementador</button>
            </nav>

            <div style={{ padding: '20px' }}>
                {vistaActiva === 'supervisor' && <VistaSupervisor />}
                {vistaActiva === 'disenador' && <VistaDiseñador />}
                {vistaActiva === 'dibujante' && <VistaDibujante />}
                {vistaActiva === 'implementador' && <VistaImplementador />}
            </div>
        </div>
    );
};

export default PanelAdministrador;