document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login-cliente.html';
        return;
    }

    // --- REFERENCIAS A TODOS LOS ELEMENTOS DEL DOM ---
    const userSessionContainer = document.getElementById('user-session');
    const profilePicEl = document.getElementById('profile-pic');
    const profileNameSidebarEl = document.getElementById('profile-name-sidebar');
    const reservationsContainer = document.getElementById('reservations-container');
    const menuTabs = document.getElementById('profile-menu-tabs');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const logoutButton = document.getElementById('logout-button');
    const editProfileForm = document.getElementById('edit-profile-form');
    const editNombreInput = document.getElementById('edit-nombre');
    const editApellidoInput = document.getElementById('edit-apellido');
    const editEmailInput = document.getElementById('edit-email');

    // --- LÓGICA DE PESTAÑAS (TABS) ---
    menuTabs.addEventListener('click', (event) => {
        const targetLink = event.target.closest('a');
        if (!targetLink || targetLink.id === 'logout-button') return;
        event.preventDefault();

        // Limpiar estilos de todos los enlaces del menú
        menuTabs.querySelectorAll('a').forEach(link => {
            link.classList.remove('bg-gray-100', 'text-primary');
            link.classList.add('hover:bg-gray-100', 'text-subtle-light');
        });

        // Ocultar todos los paneles de contenido
        tabPanes.forEach(pane => pane.classList.remove('active'));

        // Activar el enlace y panel seleccionados
        targetLink.classList.add('bg-gray-100', 'text-primary');
        targetLink.classList.remove('hover:bg-gray-100', 'text-subtle-light');
        const targetPaneId = targetLink.getAttribute('href').substring(1);
        document.getElementById(targetPaneId).classList.add('active');
    });

    // --- FUNCIÓN PARA DECODIFICAR EL TOKEN JWT ---
    function parseJwt(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    }

    // --- CARGAR DATOS DEL USUARIO ---
    const userData = parseJwt(token);
    if (userData) {
        const userName = userData.nombre.toUpperCase();
        profileNameSidebarEl.textContent = userName;

        // Rellenar menú de la cabecera
        userSessionContainer.innerHTML = `
            <button class="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
                <span class="font-semibold text-sm">${userName}</span>
                <span class="material-icons text-subtle-light text-xl">arrow_drop_down</span>
            </button>
        `;

        // Rellenar los campos del formulario de edición con los datos actuales
        editNombreInput.value = userData.nombre;
        editApellidoInput.value = userData.apellido;
        editEmailInput.value = userData.email;
    }

    // --- CARGAR HISTORIAL DE RESERVAS (CON MANEJO DE ERRORES MEJORADO) ---
    fetch('https://hotel-backend-production-ed93.up.railway.app/api/clientes/mis-reservas', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            // Si la respuesta no es OK (ej. 403 Forbidden), lanzamos un error para que lo capture el .catch()
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.mensaje || 'Error del servidor'); });
            }
            return response.json();
        })
        .then(reservas => {
            reservationsContainer.innerHTML = '';
            if (!reservas || reservas.length === 0) {
                reservationsContainer.innerHTML = '<p class="text-subtle-light">Aún no tienes ninguna reserva.</p>';
                return;
            }

            reservas.forEach(reserva => {
                let badgeClasses = 'bg-yellow-100 text-yellow-800'; // "Pendiente"
                if (reserva.estado === 'Confirmada') {
                    badgeClasses = 'bg-green-100 text-green-800';
                } else if (reserva.estado === 'Cancelada') {
                    badgeClasses = 'bg-gray-100 text-gray-800';
                }

                const reservaCardHTML = `
                <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-300">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                            <h4 class="font-bold text-lg">Habitación ${reserva.tipo_nombre} #${reserva.numero}</h4>
                            <p class="text-sm text-subtle-light mt-1">Código: <span class="font-mono">${reserva.codigo_reserva}</span></p>
                            <div class="flex items-center text-sm text-subtle-light mt-2 space-x-4">
                                <span>Check-in: ${new Date(reserva.fecha_inicio).toLocaleDateString()}</span>
                                <span>Check-out: ${new Date(reserva.fecha_fin).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div class_A="mt-4 sm:mt-0 flex flex-col items-end gap-3">
                            <span class="px-3 py-1 text-sm font-semibold rounded-full ${badgeClasses}">${reserva.estado}</span>
                            
                            <button 
                                data-codigo="${reserva.codigo_reserva}" 
                                class="ver-recibo-btn text-sm font-semibold text-primary hover:underline">
                                Ver Recibo
                            </button>
                        </div>
                    </div>
                </div>
                `;
                reservationsContainer.innerHTML += reservaCardHTML;
            });
        })
        .catch(error => {
            console.error('Error al cargar reservas:', error);
            reservationsContainer.innerHTML = `<p class="text-red-500 font-bold">No se pudieron cargar tus reservas. Causa: ${error.message}</p>`;
        });

    // --- LÓGICA PARA ENVIAR EL FORMULARIO DE EDICIÓN ---
    editProfileForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const updatedData = {
            nombre: editNombreInput.value,
            apellido: editApellidoInput.value
        };

        fetch('https://hotel-backend-production-ed93.up.railway.app/api/clientes/perfil', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        })
            .then(response => response.json())
            .then(data => {
                alert(data.mensaje);
                // Para que los cambios se reflejen en el saludo, es necesario un nuevo token.
                // Forzamos un logout para que el usuario vuelva a iniciar sesión y obtenga el token actualizado.
                alert('Para ver los cambios reflejados, por favor, inicia sesión de nuevo.');
                localStorage.removeItem('authToken');
                window.location.href = 'login-cliente.html';
            })
            .catch(error => {
                console.error('Error al actualizar:', error);
                alert('Hubo un error al guardar los cambios.');
            });
    });

    // --- LÓGICA PARA ENVIAR EL FORMULARIO DE CAMBIO DE CONTRASEÑA ---
    const editForm = document.getElementById('edit-profile-form');

    editForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevenimos que se envíen ambos a la vez

        const contrasenaActual = document.getElementById('contrasena-actual').value;
        const nuevaContrasena = document.getElementById('nueva-contrasena').value;

        // Si los campos de contraseña tienen texto, intentamos cambiar la contraseña
        if (contrasenaActual && nuevaContrasena) {
            fetch('https://hotel-backend-production-ed93.up.railway.app/api/clientes/cambiar-contrasena', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ contrasenaActual, nuevaContrasena })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw new Error(err.mensaje); });
                    }
                    return response.json();
                })
                .then(data => {
                    alert(data.mensaje); // "Contraseña actualizada exitosamente"
                    // Forzamos logout por seguridad
                    localStorage.removeItem('authToken');
                    window.location.href = 'login-cliente.html';
                })
                .catch(error => {
                    alert(`Error: ${error.message}`);
                });
        }
    });

    // --- LÓGICA DE CERRAR SESIÓN ---
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
    });


    

    // --- LÓGICA DEL MODAL DE RECIBO ---

    const modalBackdrop = document.getElementById('recibo-modal-backdrop');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const reservationsContainerEl = document.getElementById('reservations-container');
    const btnDescargarPDFModal = document.getElementById('modal-descargar-pdf-btn');

    // Variable para guardar los datos de la reserva actual
    let reservaActualParaPDF = null;

    // Event listener para CERRAR el modal
    closeModalBtn.addEventListener('click', () => {
        modalBackdrop.classList.add('hidden');
    });

    // Event listener para ABRIR el modal (usando delegación de eventos)
    reservationsContainerEl.addEventListener('click', (event) => {
        const boton = event.target.closest('.ver-recibo-btn');
        if (boton) {
            const codigo = boton.dataset.codigo;
            mostrarRecibo(codigo);
        }
    });

    // Event listener para el botón de DESCARGAR PDF dentro del modal
    btnDescargarPDFModal.addEventListener('click', (e) => {
        e.preventDefault();
        if (reservaActualParaPDF) {
            // Calculamos noches y total
            const dateInicio = new Date(reservaActualParaPDF.fecha_inicio);
            const dateFin = new Date(reservaActualParaPDF.fecha_fin);
            const noches = Math.ceil((dateFin.getTime() - dateInicio.getTime()) / (1000 * 3600 * 24));
            const total = noches * parseFloat(reservaActualParaPDF.precio_por_noche);

            // Llamamos a la función de generar PDF
            generarPDF(reservaActualParaPDF, noches, total);
        } else {
            alert("Error: No se han cargado los datos de la reserva para generar el PDF.");
        }
    });


    // --- Función para buscar datos y rellenar el modal ---
    function mostrarRecibo(codigoReserva) {
        // 1. Mostrar el modal con "Cargando..."
        modalBackdrop.classList.remove('hidden');

        // Referencias a los campos del modal (los copiamos de exito.js)
        const elCodigo = document.getElementById('modal-ticket-codigo-reserva');
        const elCliente = document.getElementById('modal-ticket-cliente-nombre');
        const elHabitacion = document.getElementById('modal-ticket-habitacion-info');
        const elCheckin = document.getElementById('modal-ticket-checkin');
        const elCheckout = document.getElementById('modal-ticket-checkout');
        const elHuespedes = document.getElementById('modal-ticket-huespedes');
        const elCalculo = document.getElementById('modal-ticket-calculo-precio');
        const elTotal = document.getElementById('modal-ticket-total-pagar');
        const elQrCode = document.getElementById('modal-ticket-qr-code');

        // 2. Buscar los datos de ESA reserva específica
        // (Obtenemos el token del inicio del script)
        const token = localStorage.getItem('authToken');

        // ¡Usamos la URL de tu backend! (Asegúrate que sea la correcta)
        const backendUrl = 'https://hotel-backend-production-ed93.up.railway.app';

        fetch(`${backendUrl}/api/reservas/${codigoReserva}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Reserva no encontrada o no autorizada.');
                }
                return response.json();
            })
            .then(reserva => {
                // 3. Guardamos la reserva para el PDF
                reservaActualParaPDF = reserva;

                // 4. Calculamos los datos
                const dateInicio = new Date(reserva.fecha_inicio);
                const dateFin = new Date(reserva.fecha_fin);
                const diffDias = Math.ceil((dateFin.getTime() - dateInicio.getTime()) / (1000 * 3600 * 24));
                const precioNoche = parseFloat(reserva.precio_por_noche);
                const total = diffDias * precioNoche;

                // 5. Rellenamos los campos del MODAL
                elCodigo.textContent = reserva.codigo_reserva;
                elCliente.textContent = `${reserva.nombre} ${reserva.apellido}`;
                elHabitacion.textContent = `${reserva.tipo_nombre} #${reserva.numero}`;
                elCheckin.textContent = dateInicio.toLocaleDateString();
                elCheckout.textContent = dateFin.toLocaleDateString();
                elHuespedes.textContent = `${reserva.num_huespedes} Adultos`;
                elCalculo.textContent = `$${precioNoche.toFixed(2)} MXN x ${diffDias} noches`;
                elTotal.textContent = `$${total.toFixed(2)} MXN`;
                elQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${reserva.codigo_reserva}`;
            })
            .catch(error => {
                console.error('Error al cargar los detalles de la reserva:', error);
                alert(error.message);
                modalBackdrop.classList.add('hidden'); // Ocultar modal si hay error
            });
    }


    // --- Función para generar el PDF (Copiada de exito.js) ---
    function generarPDF(reserva, noches, total) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // --- Definición de Colores ---
        const primaryColor = [20, 184, 166]; // Tu verde/teal
        const blackColor = [40, 40, 40];
        const grayColor = [120, 120, 120];
        const rightAlign = 196;
        const leftAlign = 14;
        let yPos = 25;

        // --- 1. ENCABEZADO ---
        doc.setFontSize(30);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Hotel Oasis', leftAlign, yPos);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Recibo de Confirmación de Reserva', leftAlign, yPos + 8);
        yPos += 20;

        // --- 2. INFORMACIÓN DE CLIENTE Y RESERVA ---
        doc.setLineWidth(0.5);
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.line(leftAlign, yPos, rightAlign, yPos);
        yPos += 8;

        // Info del Cliente (Izquierda)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.text('CLIENTE:', leftAlign, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${reserva.nombre} ${reserva.apellido}`, leftAlign, yPos + 6);
        doc.text(reserva.email, leftAlign, yPos + 12);

        // Info de la Reserva (Derecha)
        doc.setFont('helvetica', 'bold');
        doc.text('CÓDIGO DE RESERVA:', 135, yPos);
        doc.text('FECHA DE EMISIÓN:', 135, yPos + 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(reserva.codigo_reserva, rightAlign, yPos, { align: 'right' });
        doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.setFontSize(10);
        doc.text(new Date().toLocaleDateString('es-MX'), rightAlign, yPos + 12, { align: 'right' });
        yPos += 25;

        // --- 3. TABLA DE DETALLES DE ESTANCIA ---
        doc.autoTable({
            startY: yPos,
            head: [['Habitación', 'Check-in', 'Check-out', 'Huéspedes', 'Noches']],
            body: [
                [
                    `${reserva.tipo_nombre} #${reserva.numero}`,
                    new Date(reserva.fecha_inicio).toLocaleDateString('es-MX'),
                    new Date(reserva.fecha_fin).toLocaleDateString('es-MX'),
                    `${reserva.num_huespedes} Adultos`,
                    noches
                ]
            ],
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            margin: { left: leftAlign, right: leftAlign },
        });
        yPos = doc.lastAutoTable.finalY + 15;

        // --- 4. RESUMEN FINANCIERO (Alineado a la derecha) ---
        const precioNoche = parseFloat(reserva.precio_por_noche);
        const summaryLeft = 140;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);

        doc.text('Costo por noche:', summaryLeft, yPos);
        doc.text(`$${precioNoche.toFixed(2)} MXN`, rightAlign, yPos, { align: 'right' });

        doc.text('Noches:', summaryLeft, yPos + 7);
        doc.text(noches.toString(), rightAlign, yPos + 7, { align: 'right' });

        doc.setLineDashPattern([0.5, 0.5], 0);
        doc.line(summaryLeft - 2, yPos + 11, rightAlign, yPos + 11);
        doc.setLineDashPattern([], 0);

        // TOTAL
        yPos += 18;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.text('Total a Pagar:', summaryLeft, yPos);

        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`$${total.toFixed(2)} MXN`, rightAlign, yPos, { align: 'right' });
        yPos += 15;

        // --- 5. PIE DE PÁGINA ---
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Presenta este código al momento de tu check-in. ¡Gracias por tu preferencia!', 105, pageHeight - 15, { align: 'center' });
        doc.text('Hotel Oasis | Recibo de Confirmación', 105, pageHeight - 10, { align: 'center' });

        // --- GUARDAR ---
        doc.save(`Reserva-HotelOasis-${reserva.codigo_reserva}.pdf`);
    }


});