import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const Login = ({ onLoginSuccess }) => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/login`, {
                usuario,
                password
            });

            // Guardar usuario en localStorage
            localStorage.setItem('usuario', JSON.stringify(response.data.usuario));

            // Llamar callback de éxito
            onLoginSuccess(response.data.usuario);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#ecf0f1',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                maxWidth: '400px',
                width: '100%'
            }}>
                <h1 style={{
                    textAlign: 'center',
                    color: '#2c3e50',
                    marginBottom: '10px',
                    fontSize: '28px'
                }}>
                    Sistema de Afiches
                </h1>
                <p style={{
                    textAlign: 'center',
                    color: '#7f8c8d',
                    marginBottom: '30px',
                    fontSize: '14px'
                }}>
                    Ingresa tus credenciales
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '5px',
                            color: '#2c3e50',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            Usuario
                        </label>
                        <input
                            type="text"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            required
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #ddd',
                                borderRadius: '5px',
                                fontSize: '16px',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3498db'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '5px',
                            color: '#2c3e50',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #ddd',
                                borderRadius: '5px',
                                fontSize: '16px',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3498db'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            borderRadius: '5px',
                            marginBottom: '20px',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: loading ? '#95a5a6' : '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#2980b9';
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#3498db';
                        }}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div style={{
                    marginTop: '30px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    fontSize: '12px',
                    color: '#7f8c8d',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    <strong>Usuarios de prueba:</strong>
                    <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
                        <li>admin / admin</li>
                        <li>disenador / disenador</li>
                        <li>dibujante / dibujante</li>
                        <li>supervisor / supervisor</li>
                    </ul>
                    <strong style={{ marginTop: '10px', display: 'block' }}>Implementadores (18 sucursales):</strong>
                    <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '11px' }}>
                        <li>impl_sf / impl_sf (San Fernando)</li>
                        <li>impl_rengo / impl_rengo (Rengo)</li>
                        <li>impl_cabras / impl_cabras (Las Cabras)</li>
                        <li>impl_coltauco / impl_coltauco (Coltauco)</li>
                        <li>impl_requinoa / impl_requinoa (Requinoa)</li>
                        <li>impl_chepica / impl_chepica (Chépica)</li>
                        <li>impl_peralillo / impl_peralillo (Peralillo)</li>
                        <li>impl_pich / impl_pich (Pichilemu)</li>
                        <li>impl_hualane / impl_hualane (Hualañé)</li>
                        <li>impl_tilcoco / impl_tilcoco (Quinta de Tilcoco)</li>
                        <li>impl_nancagua / impl_nancagua (Nancagua)</li>
                        <li>impl_chanco / impl_chanco (Chanco)</li>
                        <li>impl_valegre / impl_valegre (Villa Alegre)</li>
                        <li>impl_colbun / impl_colbun (Colbún)</li>
                        <li>impl_teno / impl_teno (Teno)</li>
                        <li>impl_ybuenas / impl_ybuenas (Yerbas Buenas)</li>
                        <li>impl_longavi / impl_longavi (Longaví)</li>
                        <li>impl_maule / impl_maule (Maule)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Login;
