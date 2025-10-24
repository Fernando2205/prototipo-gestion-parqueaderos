// Patrón Observer - Observador Concreto (App Móvil)
class MobileApp {
    constructor(userId) {
        this.name = 'App Móvil';
        this.userId = userId;
    }

    update(sensorId, state) {
        console.log(`\n📱 ${this.name} (Usuario: ${this.userId}):`);
        
        if (state.occupied) {
            console.log(`   🔴 Espacio ${sensorId} ahora OCUPADO`);
            console.log(`   Vehículo: ${state.vehiclePlate}`);
        } else {
            console.log(`   🟢 Espacio ${sensorId} ahora DISPONIBLE`);
        }
        
        this.sendPushNotification(sensorId, state);
    }

    sendPushNotification(sensorId, state) {
        const message = state.occupied 
            ? `Espacio ${sensorId} ocupado por ${state.vehiclePlate}`
            : `Espacio ${sensorId} disponible`;
        console.log(`   📩 Notificación push enviada: "${message}"`);
    }
}

module.exports = MobileApp;
