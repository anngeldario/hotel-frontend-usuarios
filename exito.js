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

    // 5. Función para generar el PDF (VERSIÓN FINAL "DIBUJADA" DE ALTA CALIDAD)
    function generarPDF(reserva, noches, total) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // --- Definición de Colores ---
        const primaryColor = [20, 184, 166]; // Tu verde/teal
        const blackColor = [40, 40, 40]; // Un negro más suave
        const grayColor = [120, 120, 120]; // Un gris para etiquetas
        const lightGrayColor = [240, 240, 240];

        // Posiciones
        const leftMargin = 15;
        const rightMargin = 195;
        const center = 105;
        let yPos = 20;

        // --- 1. Título ---
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('¡Tu reserva está confirmada!', center, yPos, { align: 'center' });
        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Hemos enviado un correo de confirmación a tu email.', center, yPos, { align: 'center' });
        yPos += 10;

        // --- 2. Caja de Contenido ---
        doc.setDrawColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(leftMargin, yPos, (rightMargin - leftMargin), 130, 3, 3, 'FD'); // Rectángulo con bordes redondeados
        yPos += 15;

        // --- 3. Sección Superior (Código y QR) ---
        const leftColX = leftMargin + 10;
        const rightColX = 140;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Código de Reserva', leftColX, yPos);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(reserva.codigo_reserva, leftColX, yPos + 7);

        // QR Code (dinámico con el código de reserva)
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${reserva.codigo_reserva}`;
        doc.addImage(qrCodeUrl, 'PNG', 160, yPos - 5, 25, 25);
        yPos += 20;

        // --- 4. Detalles de Cliente y Habitación (Columnas) ---
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Cliente', leftColX, yPos);
        doc.text('Habitación', leftColX, yPos + 12);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.text(`${reserva.nombre} ${reserva.apellido}`, rightColX, yPos, { align: 'right' });
        doc.text(`${reserva.tipo_nombre} #${reserva.numero}`, rightColX, yPos + 12, { align: 'right' });
        yPos += 24;

        // --- 5. Fechas y Huéspedes (3 Columnas) ---
        const midColX = 95;
        const rightColXFechas = 160;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Check-in', leftColX, yPos);
        doc.text('Check-out', midColX, yPos);
        doc.text('Huéspedes', rightColXFechas, yPos);

        yPos += 7;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.text(new Date(reserva.fecha_inicio).toLocaleDateString('es-MX'), leftColX, yPos);
        doc.text(new Date(reserva.fecha_fin).toLocaleDateString('es-MX'), midColX, yPos);
        doc.text(`${reserva.num_huespedes} Adultos`, rightColXFechas, yPos);
        yPos += 15;

        // --- 6. Línea Divisoria Punteada ---
        doc.setLineDashPattern([1, 1], 0);
        doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.line(leftColX, yPos, rightMargin - 10, yPos);
        doc.setLineDashPattern([], 0);
        yPos += 12;

        // --- 7. Costos ---
        const precioNoche = parseFloat(reserva.precio_por_noche);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Costo por noche', leftColX, yPos);
        doc.text(`$${precioNoche.toFixed(2)} MXN x ${noches} noches`, rightMargin - 10, yPos, { align: 'right' });
        yPos += 10;

        // --- 8. TOTAL ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.text('Total a Pagar:', leftColX, yPos);

        doc.setFontSize(14);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`$${total.toFixed(2)} MXN`, rightMargin - 10, yPos, { align: 'right' });
        yPos += 12;

        // --- 9. Mensaje Final ---
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('Presenta este código al momento de tu check-in. ¡Gracias por tu preferencia!', center, yPos + 3, { align: 'center' });

        // --- 10. Guardar ---
        doc.save(`Reserva-HotelOasis-${reserva.codigo_reserva}.pdf`);
    }
});