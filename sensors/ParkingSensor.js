// Patrón Observer - Subject (Sensor Observable)
class ParkingSensor {
    constructor(sensorId, location) {
        this.sensorId = sensorId;
        this.location = location;
        this.observers = [];
        this.state = {
            occupied: false,
            vehiclePlate: null,
            timestamp: null
        };
    }

    // Agregar observador
    subscribe(observer) {
        this.observers.push(observer);
        console.log(`✓ Observador suscrito al sensor ${this.sensorId}`);
    }

    // Remover observador
    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
        console.log(`✓ Observador removido del sensor ${this.sensorId}`);
    }

    // Notificar a todos los observadores
    notify() {
        console.log(`\n Sensor ${this.sensorId} notificando cambios...`);
        this.observers.forEach(observer => {
            observer.update(this.sensorId, this.state);
        });
    }

    // Detectar vehículo
    detectVehicle(vehiclePlate) {
        this.state = {
            occupied: true,
            vehiclePlate: vehiclePlate,
            timestamp: new Date().toISOString()
        };
        console.log(`\n Sensor ${this.sensorId}: Vehículo ${vehiclePlate} detectado`);
        this.notify();
    }

    // Vehículo sale
    vehicleLeft() {
        const previousPlate = this.state.vehiclePlate;
        this.state = {
            occupied: false,
            vehiclePlate: null,
            timestamp: new Date().toISOString()
        };
        console.log(`\n🚗 Sensor ${this.sensorId}: Vehículo ${previousPlate} salió`);
        this.notify();
    }

    getState() {
        return this.state;
    }
}

module.exports = ParkingSensor;
