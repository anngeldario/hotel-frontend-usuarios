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

    // 5. Función para generar el PDF
    function generarPDF(reserva, noches, total) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Formateamos los datos para la tabla del PDF
        const tableData = [
            ['Código de Reserva:', reserva.codigo_reserva],
            ['Cliente:', `${reserva.nombre} ${reserva.apellido}`],
            ['Email:', reserva.email], // Asumimos que la API devuelve el email
            ['Habitación:', `${reserva.tipo_nombre} #${reserva.numero}`],
            ['Check-in:', new Date(reserva.fecha_inicio).toLocaleDateString()],
            ['Check-out:', new Date(reserva.fecha_fin).toLocaleDateString()],
            ['Noches:', noches],
            ['Huéspedes:', reserva.num_huespedes],
            ['Precio por noche:', `$${parseFloat(reserva.precio_por_noche).toFixed(2)} MXN`],
        ];

        // Título
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Hotel Oasis', 105, 20, { align: 'center' });
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text('Recibo de Confirmación de Reserva', 105, 30, { align: 'center' });

        // Tabla de datos
        doc.autoTable({
            startY: 45,
            head: [['Detalle', 'Información']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [20, 184, 166] }, // El color 'primary'
            styles: { fontSize: 11, cellPadding: 2.5 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 'auto' }
            }
        });
        
        // Total al final
        const finalY = doc.lastAutoTable.finalY;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Total a Pagar:', 14, finalY + 15);
        doc.setTextColor(20, 184, 166); // Color 'primary'
        doc.text(`$${total.toFixed(2)} MXN`, 196, finalY + 15, { align: 'right' });
        
        // Mensaje de pie de página
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Presenta este código al momento de tu check-in. ¡Gracias por tu preferencia!', 105, finalY + 25, { align: 'center' });

        // Guardar el archivo
        doc.save(`Reserva-HotelOasis-${reserva.codigo_reserva}.pdf`);
    }
});