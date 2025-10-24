// Estrategia de pago en efectivo
const PaymentStrategy = require('./paymentStrategy');

class CashPayment extends PaymentStrategy {
    pay(amount) {
        console.log(`\n💵 Pago en efectivo procesado`);
        console.log(`   Monto: $${amount}`);
        return { 
            success: true, 
            method: 'Efectivo', 
            amount 
        };
    }
}

module.exports = CashPayment;
