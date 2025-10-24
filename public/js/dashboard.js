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
            if (payment.details.cardHolder) {
                return `${payment.details.cardHolder} •••• ${payment.details.lastFourDigits}`;
            } else if (payment.details.provider) {
                return payment.details.provider;
            }
            return 'Pago en efectivo';
        }

        function formatSensorTimestamp(rawValue) {
            if (!rawValue && rawValue !== 0) {
                return '';
            }

            const parsedDate = parseDateValue(rawValue);
            if (!parsedDate) {
                return typeof rawValue === 'string' ? rawValue : '';
            }

            try {
                return new Intl.DateTimeFormat('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(parsedDate);
            } catch (error) {
                return parsedDate.toLocaleString('es-CO');
            }
        }

        // Intenta normalizar fechas provenientes de múltiples formatos para evitar "Invalid Date".
        function formatPaymentDate(payment) {
            const dateValue = payment.timestamp ?? payment.date ?? payment.createdAt ?? payment.datetime ?? null;
            const parsedDate = parseDateValue(dateValue);

            if (!parsedDate) {
                return typeof dateValue === 'string' && dateValue.trim() ? dateValue : 'Fecha no disponible';
            }

            try {
                return new Intl.DateTimeFormat('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(parsedDate);
            } catch (error) {
                return parsedDate.toLocaleString('es-CO');
            }
        }

        function parseDateValue(value) {
            if (!value && value !== 0) return null;

            if (value instanceof Date) {
                return Number.isNaN(value.getTime()) ? null : value;
            }

            if (typeof value === 'number') {
                const fromNumber = new Date(value);
                return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
            }

            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (!trimmed) return null;

                const direct = new Date(trimmed);
                if (!Number.isNaN(direct.getTime())) return direct;

                const match = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
                if (match) {
                    let [, day, month, year, hour = '00', minute = '00', second = '00'] = match;
                    const numericYear = parseInt(year, 10);
                    const resolvedYear = year.length === 2
                        ? (numericYear >= 70 ? 1900 + numericYear : 2000 + numericYear)
                        : numericYear;

                    const isoCandidate = `${resolvedYear.toString().padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
                    const fallback = new Date(isoCandidate);
                    if (!Number.isNaN(fallback.getTime())) return fallback;
                }
            }

            return null;
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