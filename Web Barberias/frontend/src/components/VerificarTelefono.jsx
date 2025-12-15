/**
 * Componente de Verificación de Teléfono
 * Permite enviar y verificar código por WhatsApp
 */

import { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import * as verificacionService from '../services/verificacionService';
import './VerificarTelefono.css';

const VerificarTelefono = ({ telefono, onVerificado, modoAutenticado = false }) => {
  const toast = useToast();
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [yaVerificado, setYaVerificado] = useState(false);
  const onVerificadoLlamado = useRef(false);

  // Verificar si el teléfono ya está verificado al montar (solo una vez)
  useEffect(() => {
    const verificarEstado = async () => {
      try {
        let verificado = false;

        // Si está autenticado, usar endpoint de usuario
        if (modoAutenticado) {
          const response = await verificacionService.obtenerEstadoUsuario();
          verificado = response.verificado;
        } else if (telefono && telefono.trim() !== '') {
          // Si no está autenticado, verificar por teléfono
          const response = await verificacionService.obtenerEstadoVerificacion(telefono);
          verificado = response.verificado;
        }

        setYaVerificado(verificado);

        // Solo llamar onVerificado UNA vez cuando se monta y está verificado
        if (verificado && onVerificado && !onVerificadoLlamado.current) {
          onVerificadoLlamado.current = true;
          onVerificado();
        }
      } catch (error) {
        console.error('Error al verificar estado:', error);
        setYaVerificado(false);
      }
    };

    verificarEstado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  // Temporizador de espera para reenviar código
  useEffect(() => {
    if (tiempoRestante > 0) {
      const timer = setTimeout(() => {
        setTiempoRestante(tiempoRestante - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tiempoRestante]);

  const handleEnviarCodigo = async () => {
    if (!telefono || telefono.trim() === '') {
      toast.error('Ingresá un número de teléfono primero');
      return;
    }

    // Validación básica de formato (solo números, entre 8 y 15 dígitos)
    const telefonoLimpio = telefono.replace(/\D/g, '');
    if (telefonoLimpio.length < 8 || telefonoLimpio.length > 15) {
      toast.error('El número de teléfono debe tener entre 8 y 15 dígitos');
      return;
    }

    setEnviando(true);
    try {
      const servicio = modoAutenticado
        ? verificacionService.enviarCodigoAutenticado
        : verificacionService.enviarCodigoVerificacion;

      await servicio(telefono);
      setCodigoEnviado(true);
      setTiempoRestante(60); // 60 segundos de espera
      toast.success('Código enviado a tu WhatsApp');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar código');
    } finally {
      setEnviando(false);
    }
  };

  const handleVerificarCodigo = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (codigo.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    setVerificando(true);
    try {
      const servicio = modoAutenticado
        ? verificacionService.verificarCodigoAutenticado
        : verificacionService.verificarCodigo;

      const resultado = await servicio(telefono, codigo);

      console.log('Resultado verificación:', resultado);

      if (resultado && resultado.success) {
        toast.success('¡Teléfono verificado exitosamente!', 5000);
        setYaVerificado(true);

        // Llamar a onVerificado inmediatamente
        if (onVerificado && !onVerificadoLlamado.current) {
          onVerificadoLlamado.current = true;
          onVerificado();
        }
      } else {
        toast.error(resultado?.message || 'Error al verificar código');
      }
    } catch (error) {
      console.error('Error al verificar:', error);
      toast.error(error.response?.data?.message || 'Código incorrecto', 4000);
    } finally {
      setVerificando(false);
    }
  };

  // Si el teléfono ya está verificado, no mostrar nada
  if (yaVerificado) {
    return null;
  }

  return (
    <div className="verificar-telefono">
      {!codigoEnviado ? (
        <div className="verificacion-paso">
          {!telefono || telefono.trim() === '' ? (
            <p className="verificacion-descripcion advertencia">
              ⚠️ Ingresá tu número de teléfono arriba para poder verificarlo.
            </p>
          ) : (
            <p className="verificacion-descripcion">
              Te enviaremos un código de verificación por WhatsApp para confirmar tu número.
            </p>
          )}
          <button
            type="button"
            className="btn-enviar-codigo"
            onClick={handleEnviarCodigo}
            disabled={enviando || !telefono || telefono.trim() === ''}
          >
            {enviando ? 'Enviando...' : 'Enviar código de verificación'}
          </button>
        </div>
      ) : (
        <div className="verificacion-paso">
          <p className="verificacion-descripcion">
            Ingresá el código de 6 dígitos que enviamos a tu WhatsApp
          </p>
          <div className="form-codigo">
            <input
              type="text"
              className="input-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoComplete="off"
              disabled={verificando}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && codigo.length === 6) {
                  handleVerificarCodigo(e);
                }
              }}
            />
            <button
              type="button"
              className="btn-verificar-codigo"
              disabled={verificando || codigo.length !== 6}
              onClick={handleVerificarCodigo}
            >
              {verificando ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
          {tiempoRestante > 0 ? (
            <p className="reenviar-texto">
              Podés reenviar el código en {tiempoRestante}s
            </p>
          ) : (
            <button
              type="button"
              className="btn-reenviar-codigo"
              onClick={handleEnviarCodigo}
              disabled={enviando}
            >
              Reenviar código
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VerificarTelefono;
