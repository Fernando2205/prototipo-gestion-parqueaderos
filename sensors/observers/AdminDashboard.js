// Patrón Observer - Observador Concreto (Panel Admin)
class AdminDashboard {
    constructor() {
        this.name = 'Panel Administrativo';
        this.occupiedSpaces = 0;
    }

    update(sensorId, state) {
        console.log(`\n ${this.name}:`);
        console.log(`   Sensor: ${sensorId}`);
        console.log(`   Estado: ${state.occupied ? 'OCUPADO' : 'LIBRE'}`);
        if (state.vehiclePlate) {
            console.log(`   Vehículo: ${state.vehiclePlate}`);
        }
        console.log(`   Hora: ${state.timestamp}`);
        
        // Actualizar contador
        if (state.occupied) {
            this.occupiedSpaces++;
        } else {
            this.occupiedSpaces--;
        }
        console.log(`   Total espacios ocupados: ${this.occupiedSpaces}`);
    }
}

module.exports = AdminDashboard;
