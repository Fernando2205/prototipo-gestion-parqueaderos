// API REST para Sistema de Gestión de Parqueaderos
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Importar patrones
const ParkingSensor = require('./sensors/ParkingSensor');
const AdminDashboard = require('./sensors/observers/AdminDashboard');
const MobileApp = require('./sensors/observers/MobileApp');
const BillingSystem = require('./sensors/observers/BillingSystem');

const CardPayment = require('./payments/strategy/cardPayment');
const CashPayment = require('./payments/strategy/cashPayment');
const WalletPayment = require('./payments/strategy/walletPayment');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Estado global del sistema
const sensors = new Map();
const paymentHistory = []; // Historial de pagos
const adminDashboard = new AdminDashboard();
const mobileApp = new MobileApp('web-user@example.com');
const billingSystem = new BillingSystem();

// Inicializar sensores de ejemplo
function initializeSensors() {
    const sensorIds = ['A-101', 'A-102', 'A-103', 'B-201', 'B-202', 'B-203'];
    
    sensorIds.forEach(id => {
        const sensor = new ParkingSensor(id, `Zona ${id.charAt(0)} - Nivel ${id.charAt(2)}`);
        
        // Suscribir observadores
        sensor.subscribe(adminDashboard);
        sensor.subscribe(mobileApp);
        sensor.subscribe(billingSystem);
        
        sensors.set(id, sensor);
    });
    
    console.log(`✓ ${sensors.size} sensores inicializados`);
}

// ============================================================
// ENDPOINTS - SENSORES (Patrón Observer)
// ============================================================

// GET - Obtener todos los sensores
app.get('/api/sensors', (req, res) => {
    const sensorList = Array.from(sensors.values()).map(sensor => ({
        id: sensor.sensorId,
        location: sensor.location,
        state: sensor.getState()
    }));
    
    res.json({
        success: true,
        sensors: sensorList
    });
});

// POST - Detectar vehículo en un sensor (entrada)
app.post('/api/sensors/:id/detect', (req, res) => {
    const sensor = sensors.get(req.params.id);
    const { vehiclePlate } = req.body;
    
    if (!sensor) {
        return res.status(404).json({
            success: false,
            message: `Sensor ${req.params.id} no encontrado`
        });
    }
    
    if (!vehiclePlate) {
        return res.status(400).json({
            success: false,
            message: 'La placa del vehículo es requerida'
        });
    }
    
    if (sensor.getState().occupied) {
        return res.status(400).json({
            success: false,
            message: 'El espacio ya está ocupado'
        });
    }
    
    sensor.detectVehicle(vehiclePlate);
    
    res.json({
        success: true,
        message: `Vehículo ${vehiclePlate} detectado en ${req.params.id}`
    });
});

// POST - Vehículo sale del sensor
app.post('/api/sensors/:id/exit', (req, res) => {
    const sensor = sensors.get(req.params.id);
    
    if (!sensor) {
        return res.status(404).json({
            success: false,
            message: `Sensor ${req.params.id} no encontrado`
        });
    }
    
    if (!sensor.getState().occupied) {
        return res.status(400).json({
            success: false,
            message: 'El espacio ya está libre'
        });
    }
    
    const previousPlate = sensor.getState().vehiclePlate;
    sensor.vehicleLeft();
    
    res.json({
        success: true,
        message: `Vehículo ${previousPlate} salió del espacio ${req.params.id}`
    });
});

// ============================================================
// ENDPOINTS - PAGOS (Patrón Strategy)
// ============================================================

// POST - Procesar pago (unificado)
app.post('/api/payments', (req, res) => {
    const { method, amount, cardNumber, cardHolder, provider } = req.body;
    
    if (!method || !amount) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere: method y amount'
        });
    }
    
    let payment;
    
    switch(method) {
        case 'card':
            if (!cardNumber || !cardHolder) {
                return res.status(400).json({
                    success: false,
                    message: 'Para tarjeta se requiere: cardNumber y cardHolder'
                });
            }
            payment = new CardPayment(cardNumber, cardHolder);
            break;
            
        case 'cash':
            payment = new CashPayment();
            break;
            
        case 'wallet':
            if (!provider) {
                return res.status(400).json({
                    success: false,
                    message: 'Para billetera se requiere: provider'
                });
            }
            payment = new WalletPayment(provider);
            break;
            
        default:
            return res.status(400).json({
                success: false,
                message: 'Método de pago no válido. Use: card, cash o wallet'
            });
    }
    
    const result = payment.pay(amount);
    
    // Guardar en historial
    const historyEntry = {
        id: paymentHistory.length + 1,
        timestamp: new Date().toISOString(),
        method: result.method,
        amount: result.amount,
        details: {
            cardHolder: result.cardHolder || null,
            lastFourDigits: result.lastFourDigits || null,
            provider: result.provider || null
        }
    };
    
    paymentHistory.push(historyEntry);
    
    res.json({
        success: true,
        payment: result,
        historyEntry
    });
});

// ============================================================
// ENDPOINTS - ESTADÍSTICAS
// ============================================================

// GET - Obtener estadísticas generales
app.get('/api/stats', (req, res) => {
    const allSensors = Array.from(sensors.values());
    const occupiedCount = allSensors.filter(s => s.getState().occupied).length;
    const availableCount = allSensors.length - occupiedCount;
    
    res.json({
        success: true,
        stats: {
            totalSpaces: allSensors.length,
            occupied: occupiedCount,
            available: availableCount,
            occupancyRate: ((occupiedCount / allSensors.length) * 100).toFixed(2) + '%'
        }
    });
});

// GET - Obtener historial de pagos
app.get('/api/payments/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const recentPayments = paymentHistory.slice(-limit).reverse(); // Últimos N pagos, más recientes primero
    
    res.json({
        success: true,
        total: paymentHistory.length,
        payments: recentPayments
    });
});

// ============================================================
// INICIALIZACIÓN Y SERVIDOR
// ============================================================

// Inicializar sensores al arrancar
initializeSensors();

// Ruta del dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('API SISTEMA DE GESTIÓN DE PARQUEADEROS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Dashboard: http://localhost:${PORT}/`);
    console.log('\nPatrones implementados:');
    console.log('   - Observer: Sensores notifican a observadores');
    console.log('   - Strategy: Múltiples métodos de pago\n');
    console.log('═══════════════════════════════════════════════════════════\n');
});
