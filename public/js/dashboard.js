   let currentSensorId = null;
        
        // Cargar datos iniciales
        async function loadData() {
            await loadStats();
            await loadSensors();
            await loadPaymentHistory();
        }
        
        // Cargar estadísticas
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('totalSpaces').textContent = data.stats.totalSpaces;
                    document.getElementById('occupiedSpaces').textContent = data.stats.occupied;
                    document.getElementById('availableSpaces').textContent = data.stats.available;
                    document.getElementById('occupancyRate').textContent = data.stats.occupancyRate;
                }
            } catch (error) {
                console.error('Error cargando estadísticas:', error);
            }
        }
        
        // Crear tarjeta de sensor
        function createSensorCard(sensor) {
            const card = document.createElement('div');
            card.className = 'sensor-card';
            
            const isOccupied = sensor.state.occupied;
            const statusClass = isOccupied ? 'occupied' : 'available';
            const statusText = isOccupied ? 'Ocupado' : 'Disponible';
            const formattedTimestamp = formatSensorTimestamp(sensor.state.timestamp);
            
            card.innerHTML = `
                <div class="sensor-header">
                    <div class="sensor-id">${sensor.id}</div>
                    <span class="badge ${statusClass}">${statusText}</span>
                </div>
                <div class="sensor-info">
                    <div><strong>Ubicación:</strong> ${sensor.location}</div>
                    ${isOccupied ? `<div><strong>Placa:</strong> ${sensor.state.vehiclePlate}</div>` : ''}
                    ${formattedTimestamp ? `<div><strong>${isOccupied ? 'Ingreso' : 'Actualización'}:</strong> ${formattedTimestamp}</div>` : ''}
                </div>
                <div class="sensor-actions">
                    <button class="btn-success" onclick="openEntryModal('${sensor.id}')" ${isOccupied ? 'disabled' : ''}>
                        Entrada
                    </button>
                    <button class="btn-danger" onclick="processExit('${sensor.id}')" ${!isOccupied ? 'disabled' : ''}>
                        Salida
                    </button>
                </div>
            `;
            
            return card;
        }
        // Cargar sensores
        async function loadSensors() {
            try {
                const response = await fetch('/api/sensors');
                const data = await response.json();
                
                if (data.success) {
                    const grid = document.getElementById('sensors-grid');
                    grid.innerHTML = '';
                    
                    data.sensors.forEach(sensor => {
                        const card = createSensorCard(sensor);
                        grid.appendChild(card);
                    });
                }
            } catch (error) {
                console.error('Error cargando sensores:', error);
            }
        }
        
        
        
        // Abrir modal de entrada
        function openEntryModal(sensorId) {
            currentSensorId = sensorId;
            document.getElementById('modalSensorId').textContent = sensorId;
            document.getElementById('vehiclePlate').value = '';
            document.getElementById('entryModal').classList.add('active');
        }
        
        // Cerrar modal
        function closeModal() {
            document.getElementById('entryModal').classList.remove('active');
            currentSensorId = null;
        }
        
        // Confirmar entrada
        async function confirmEntry() {
            const plate = document.getElementById('vehiclePlate').value.trim();
            
            if (!plate) {
                showToast('Por favor ingresa una placa', 'error');
                return;
            }
            
            try {
                const response = await fetch(`/api/sensors/${currentSensorId}/detect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vehiclePlate: plate })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast(data.message, 'success');
                    closeModal();
                    loadData();
                } else {
                    showToast(data.message, 'error');
                }
            } catch (error) {
                showToast('Error al procesar entrada', 'error');
                console.error(error);
            }
        }
        
        // Procesar salida
        async function processExit(sensorId) {
            if (!confirm('¿Confirmar salida del vehículo?')) return;
            
            try {
                const response = await fetch(`/api/sensors/${sensorId}/exit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast(data.message, 'success');
                    loadData();
                } else {
                    showToast(data.message, 'error');
                }
            } catch (error) {
                showToast('Error al procesar salida', 'error');
                console.error(error);
            }
        }
        
        // Cambiar método de pago
        document.addEventListener('DOMContentLoaded', () => {
            const paymentMethod = document.getElementById('paymentMethod');
            const cardFields = document.getElementById('cardFields');
            const walletFields = document.getElementById('walletFields');
            
            paymentMethod.addEventListener('change', (e) => {
                cardFields.style.display = e.target.value === 'card' ? 'block' : 'none';
                walletFields.style.display = e.target.value === 'wallet' ? 'block' : 'none';
            });
        });
        
        // Procesar pago
        async function processPayment() {
            const method = document.getElementById('paymentMethod').value;
            const amount = document.getElementById('paymentAmount').value;
            
            let body = { 
                method: method,
                amount: parseInt(amount) 
            };
            
            if (method === 'card') {
                body.cardNumber = document.getElementById('cardNumber').value;
                body.cardHolder = document.getElementById('cardHolder').value;
            } else if (method === 'wallet') {
                body.provider = document.getElementById('walletProvider').value;
            }
            
            try {
                const response = await fetch('/api/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast(`Pago procesado: $${data.payment.amount} - ${data.payment.method}`, 'success');
                    await loadPaymentHistory(); // Recargar historial
                } else {
                    showToast(data.message || 'Error al procesar pago', 'error');
                }
            } catch (error) {
                showToast('Error al procesar pago', 'error');
                console.error(error);
            }
        }
        
        // Cargar historial de pagos
        async function loadPaymentHistory() {
            try {
                const response = await fetch('/api/payments/history?limit=20');
                const data = await response.json();
                
                const historyContainer = document.getElementById('paymentHistory');
                
                if (data.success && data.payments.length > 0) {
                    historyContainer.innerHTML = data.payments.map(payment => {
                        const methodIcon = getMethodIcon(payment.method);
                        const details = getPaymentDetails(payment);
                        const formattedDate = formatPaymentDate(payment);
                        
                        return `
                            <div class="payment-item">
                                <div class="payment-icon">${methodIcon}</div>
                                <div class="payment-info">
                                    <div class="payment-method">${payment.method}</div>
                                    <div class="payment-details">${details}</div>
                                    <div class="payment-date">${formattedDate}</div>
                                </div>
                                <div class="payment-amount">$${payment.amount.toLocaleString('es-CO')}</div>
                            </div>
                        `;
                    }).join('');
                } else {
                    historyContainer.innerHTML = '<p class="no-data">No hay pagos registrados</p>';
                }
            } catch (error) {
                console.error('Error cargando historial:', error);
            }
        }
        
        // Obtener icono según método de pago
        function getMethodIcon(method) {
            const icons = {
                'Tarjeta': '💳',
                'Efectivo': '💵',
                'Billetera Digital': '📱'
            };
            return icons[method] || '💰';
        }
        
        // Obtener detalles del pago
        function getPaymentDetails(payment) {
            // Verificar si hay detalles de tarjeta
            if (payment.details && payment.details.cardHolder && payment.details.lastFourDigits) {
                return `${payment.details.cardHolder} •••• ${payment.details.lastFourDigits}`;
            }
            
            // Verificar si hay detalles de billetera
            if (payment.details && payment.details.provider) {
                return `Proveedor: ${payment.details.provider}`;
            }
            
            // Para efectivo o cualquier otro caso
            if (payment.method === 'Efectivo') {
                return 'Pago en efectivo';
            }
            
            // Fallback genérico
            return `Pago realizado vía ${payment.method}`;
        }

        // Formatear fecha de sensores
        function formatSensorTimestamp(timestamp) {
            if (!timestamp) return '';
            
            try {
                const date = new Date(timestamp);
                return new Intl.DateTimeFormat('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(date);
            } catch (error) {
                return timestamp;
            }
        }

        // Formatear fecha de pagos
        function formatPaymentDate(payment) {
            const timestamp = payment.timestamp;
            if (!timestamp) return 'Fecha no disponible';
            
            try {
                const date = new Date(timestamp);
                return new Intl.DateTimeFormat('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(date);
            } catch (error) {
                return 'Fecha no disponible';
            }
        }
        
        // Mostrar toast
        function showToast(message, type = 'info') {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = type;
            toast.style.display = 'block';
            
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }
        
        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
        
        // Cargar datos al iniciar
        loadData();
        
        // Recargar cada 5 segundos
        // setInterval(loadData, 5000);