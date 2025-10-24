// Patrón Strategy - Interfaz base para estrategias de pago
class PaymentStrategy {
    pay(amount) {
        throw new Error('El método pay() debe ser implementado');
    }
}

module.exports = PaymentStrategy;
