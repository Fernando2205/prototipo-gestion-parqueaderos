// Patrón Observer - Observador Concreto (Sistema de Facturación)
class BillingSystem {
    constructor() {
        this.name = 'Sistema de Facturación';
        this.records = new Map();
    }

    update(sensorId, state) {
        console.log(`\n💰 ${this.name}:`);
        
        if (state.occupied) {
            // Registrar entrada
            this.records.set(state.vehiclePlate, {
                sensorId: sensorId,
                entryTime: new Date(),
                plate: state.vehiclePlate
            });
            console.log(`   ✓ Entrada registrada para ${state.vehiclePlate}`);
            console.log(`   Sensor: ${sensorId}`);
            console.log(`   Hora entrada: ${state.timestamp}`);
        } else {
            // Calcular costo (si hay registro previo)
            const record = Array.from(this.records.values())
                .find(r => r.sensorId === sensorId);
            
            if (record) {
                const exitTime = new Date();
                const hours = Math.ceil((exitTime - record.entryTime) / (1000 * 60 * 60));
                const cost = hours * 3000; // $3000 por hora
                
                console.log(`   ✓ Salida registrada para ${record.plate}`);
                console.log(`   Tiempo: ${hours} hora(s)`);
                console.log(`   Costo: $${cost}`);
                
                this.records.delete(record.plate);
            }
        }
    }
}

module.exports = BillingSystem;
