// exito.js (VERSIÓN FINAL Y MODERNA)

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const codigoReserva = params.get('codigo');

    // Referencias a los nuevos elementos del HTML por su ID
    const elCodigo = document.getElementById('ticket-codigo-reserva');
    const elCliente = document.getElementById('ticket-cliente-nombre');
    const elHabitacion = document.getElementById('ticket-habitacion-info');
    const elCheckin = document.getElementById('ticket-checkin');
    const elCheckout = document.getElementById('ticket-checkout');
    const elHuespedes = document.getElementById('ticket-huespedes');
    const elCalculo = document.getElementById('ticket-calculo-precio');
    const elTotal = document.getElementById('ticket-total-pagar');
    const btnDescargar = document.getElementById('descargar-pdf-btn');

    // URL de tu backend (Asegúrate de que sea la correcta)
    const backendUrl = 'https://hotel-backend-production-ed93.up.railway.app';

    if (!codigoReserva) {
        document.body.innerHTML = '<h1 class="text-center text-red-500 p-10">Error: Código de reserva no encontrado.</h1>';
        return;
    }

    // 1. Buscamos los datos de la reserva
    fetch(`${backendUrl}/api/reservas/${codigoReserva}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Reserva no encontrada.');
            }
            return response.json();
        })
        .then(reserva => {
            // 2. Calculamos los datos
            const dateInicio = new Date(reserva.fecha_inicio);
            const dateFin = new Date(reserva.fecha_fin);
            const diffDias = Math.ceil((dateFin.getTime() - dateInicio.getTime()) / (1000 * 3600 * 24));
            const precioNoche = parseFloat(reserva.precio_por_noche);
            const total = diffDias * precioNoche;

            // 3. Rellenamos los campos en el HTML
            elCodigo.textContent = reserva.codigo_reserva;
            elCliente.textContent = `${reserva.nombre} ${reserva.apellido}`;
            elHabitacion.textContent = `${reserva.tipo_nombre} #${reserva.numero}`;
            elCheckin.textContent = dateInicio.toLocaleDateString();
            elCheckout.textContent = dateFin.toLocaleDateString();
            elHuespedes.textContent = `${reserva.num_huespedes} Adultos`;
            elCalculo.textContent = `$${precioNoche.toFixed(2)} MXN x ${diffDias} noches`;
            elTotal.textContent = `$${total.toFixed(2)} MXN`;

            // 4. Activamos el botón de descarga
            btnDescargar.addEventListener('click', (e) => {
                e.preventDefault(); // Prevenimos que el enlace navegue
                generarPDF(reserva, diffDias, total);
            });
        })
        .catch(error => {
            console.error('Error al cargar los detalles de la reserva:', error);
            document.body.innerHTML = `<h1 class="text-center text-red-500 p-10">Error al cargar la reserva: ${error.message}</h1>`;
        });

    // 5. Función para generar el PDF (VERSIÓN PROFESIONAL DE ALTA CALIDAD)
    function generarPDF(reserva, noches, total) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // --- Definición de Colores ---
        const primaryColor = [20, 184, 166]; // Tu verde/teal
        const blackColor = [0, 0, 0];
        const grayColor = [100, 100, 100];
        const rightAlign = 196; // Margen derecho (A4 es 210mm)
        const leftAlign = 14;  // Margen izquierdo

        // --- 1. ENCABEZADO ---
        doc.setFontSize(30);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Hotel Oasis', leftAlign, 25);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Recibo de Confirmación de Reserva', leftAlign, 33);

        // --- 2. INFORMACIÓN DE CLIENTE Y RESERVA ---
        doc.setLineWidth(0.5);
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.line(leftAlign, 42, rightAlign, 42); // Línea verde

        // Info del Cliente (Izquierda)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.text('CLIENTE:', leftAlign, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(`${reserva.nombre} ${reserva.apellido}`, leftAlign, 56);
        doc.text(reserva.email, leftAlign, 62); // Asumiendo que la API devuelve el email

        // Info de la Reserva (Derecha)
        doc.setFont('helvetica', 'bold');
        doc.text('CÓDIGO DE RESERVA:', 135, 50);
        doc.text('FECHA DE EMISIÓN:', 135, 62);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(reserva.codigo_reserva, rightAlign, 50, { align: 'right' });
        doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.setFontSize(10);
        doc.text(new Date().toLocaleDateString('es-MX'), rightAlign, 62, { align: 'right' });


        // --- 3. TABLA DE DETALLES DE ESTANCIA ---
        doc.autoTable({
            startY: 75,
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
                textColor: [255, 255, 255], // Texto blanco
                fontStyle: 'bold'
            },
            margin: { left: leftAlign, right: leftAlign },
        });

        // --- 4. RESUMEN FINANCIERO (Alineado a la derecha) ---
        const finalY = doc.lastAutoTable.finalY + 15;
        const precioNoche = parseFloat(reserva.precio_por_noche);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);

        const summaryLeft = 140; // Dónde empieza el texto

        doc.text('Costo por noche:', summaryLeft, finalY);
        doc.text(`$${precioNoche.toFixed(2)} MXN`, rightAlign, finalY, { align: 'right' });

        doc.text('Noches:', summaryLeft, finalY + 7);
        doc.text(noches.toString(), rightAlign, finalY + 7, { align: 'right' });

        // Línea divisoria
        doc.setLineDashPattern([0.5, 0.5], 0);
        doc.line(summaryLeft - 2, finalY + 11, rightAlign, finalY + 11);
        doc.setLineDashPattern([], 0);

        // TOTAL
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.text('Total a Pagar:', summaryLeft, finalY + 18);

        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`$${total.toFixed(2)} MXN`, rightAlign, finalY + 18, { align: 'right' });


        // --- 5. PIE DE PÁGINA ---
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        const pageHeight = doc.internal.pageSize.height;
        doc.text('Presenta este código al momento de tu check-in. ¡Gracias por tu preferencia!', 105, pageHeight - 15, { align: 'center' });
        doc.text('Hotel Oasis | Recibo de Confirmación', 105, pageHeight - 10, { align: 'center' });

        // --- GUARDAR ---
        doc.save(`Reserva-HotelOasis-${reserva.codigo_reserva}.pdf`);
    }
});