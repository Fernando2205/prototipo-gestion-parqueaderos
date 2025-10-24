// Estrategia de pago con billetera digital
const PaymentStrategy = require('./paymentStrategy');

class WalletPayment extends PaymentStrategy {
    constructor(walletProvider) {
        super();
        this.walletProvider = walletProvider;
    }

    pay(amount) {
        console.log(`\n📱 Pago con billetera digital procesado`);
        console.log(`   Proveedor: ${this.walletProvider}`);
        console.log(`   Monto: $${amount}`);
        return { 
            success: true, 
            method: 'Billetera Digital', 
            amount,
            provider: this.walletProvider
        };
    }
}

module.exports = WalletPayment;
