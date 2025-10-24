// Patrón Strategy - Contexto
class PaymentContext {
    constructor() {
        this.strategy = null;
    }

    // Establecer estrategia de pago
    setStrategy(strategy) {
        this.strategy = strategy;
    }

    // Ejecutar pago usando la estrategia actual
    executePayment(amount) {
        if (!this.strategy) {
            throw new Error('No se ha establecido una estrategia de pago');
        }
        return this.strategy.pay(amount);
    }
}

module.exports = PaymentContext;
