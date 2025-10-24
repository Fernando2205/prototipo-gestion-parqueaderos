// Estrategia de pago con tarjeta
const PaymentStrategy = require('./paymentStrategy');

class CardPayment extends PaymentStrategy {
    constructor(cardNumber, cardHolder) {
        super();
        this.cardNumber = cardNumber;
        this.cardHolder = cardHolder;
    }

    pay(amount) {
        console.log(`\n💳 Pago con tarjeta procesado`);
        console.log(`   Titular: ${this.cardHolder}`);
        console.log(`   Tarjeta: **** ${this.cardNumber.slice(-4)}`);
        console.log(`   Monto: $${amount}`);
        return { 
            success: true, 
            method: 'Tarjeta', 
            amount,
            cardHolder: this.cardHolder,
            lastFourDigits: this.cardNumber.slice(-4)
        };
    }
}

module.exports = CardPayment;
