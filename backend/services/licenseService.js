// ===== SERVICIO DE LICENCIAS =====
// Gestiona machine ID, validación y almacenamiento de licencias
//
// Firma asimétrica (ECDSA P-256): keygen.html firma con la clave PRIVADA
// (nunca sale de la PC de Gino, no se sube al repo). Este archivo solo
// necesita la clave PÚBLICA para verificar — es segura de exponer/subir
// al repo, con ella no se puede forjar una licencia nueva.

const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Clave pública — coincide con la clave privada de keygen.html. Segura de exponer.
const PUBLIC_KEY_JWK = {
    kty: 'EC',
    x: 'IOb7bTmx3m1FHBMKanvEigFYyK7NybM-yTzT7dU4aLI',
    y: 'zOgcF598jzCpYamxDkZfwBNBNUgqPH1v8ahIphfPRnE',
    crv: 'P-256'
};
const publicKey = crypto.createPublicKey({ key: PUBLIC_KEY_JWK, format: 'jwk' });

const licenseFile = path.join(__dirname, '..', 'data', 'license.json');

// Genera un ID único y estable para esta máquina basado en hostname + primera MAC
function getMachineId() {
    const hostname = os.hostname().toUpperCase();
    const interfaces = os.networkInterfaces();

    let mac = '';
    for (const iface of Object.values(interfaces)) {
        for (const addr of iface) {
            if (!addr.internal && addr.mac && addr.mac !== '00:00:00:00:00:00') {
                mac = addr.mac.replace(/:/g, '').toUpperCase();
                break;
            }
        }
        if (mac) break;
    }

    const raw = `${hostname}-${mac}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
    return `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

// Valida una clave completa (firma-en-base64url|YYYY-MM-DD) contra esta máquina
function validateKey(fullKey) {
    try {
        const parts = fullKey.trim().split('|');
        if (parts.length !== 2) return { valid: false, reason: 'Formato de clave inválido' };

        const [sigPart, expiryDate] = parts;

        // Verificar que la fecha no haya vencido
        const expiry = new Date(expiryDate + 'T23:59:59');
        if (isNaN(expiry.getTime())) return { valid: false, reason: 'Fecha de vencimiento inválida' };
        if (expiry < new Date()) return { valid: false, reason: 'La clave ha vencido' };

        // Verificar la firma ECDSA contra esta máquina (no requiere secreto compartido)
        const machineId = getMachineId();
        const payload = `${machineId}|${expiryDate}`;

        let signature;
        try {
            signature = Buffer.from(sigPart.replace(/\s+/g, ''), 'base64url');
        } catch {
            return { valid: false, reason: 'Formato de clave inválido' };
        }

        const isValid = crypto.verify(
            'sha256',
            Buffer.from(payload),
            { key: publicKey, dsaEncoding: 'ieee-p1363' },
            signature
        );

        if (!isValid) return { valid: false, reason: 'Clave incorrecta para esta máquina' };

        return { valid: true, expiryDate };
    } catch {
        return { valid: false, reason: 'Error al validar la clave' };
    }
}

// Devuelve el estado actual de la licencia guardada
function getLicenseStatus() {
    try {
        if (!fs.existsSync(licenseFile)) return { status: 'inactiva' };
        const data = JSON.parse(fs.readFileSync(licenseFile, 'utf8'));
        const expiry = new Date(data.expiryDate + 'T23:59:59');
        if (expiry < new Date()) return { status: 'vencida' };
        return { status: 'activa', expiryDate: data.expiryDate };
    } catch {
        return { status: 'inactiva' };
    }
}

// Guarda la licencia validada en disco
function saveLicense(fullKey, expiryDate) {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(licenseFile, JSON.stringify({
        key: fullKey,
        expiryDate,
        activatedAt: new Date().toISOString()
    }, null, 2));
}

module.exports = { getMachineId, validateKey, getLicenseStatus, saveLicense };
