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

   // 5. Función para generar el PDF (VERSIÓN FINAL "FOTO" CON ARREGLO)
function generarPDF(reserva, noches, total) {

    // 1. Seleccionar el elemento que queremos imprimir
    const element = document.getElementById('ticket-content');

    // --- ¡EL TRUCO ESTÁ AQUÍ! ---
    // 2. Forzamos un ancho "desktop" al elemento ANTES de imprimir
    // Esto evita que Tailwind se colapse a la vista móvil (que es lo que salía mal)
    // 32rem = 512px, que es el `max-w-lg` que tienes en tu HTML
    element.style.width = '512px'; 

    // 3. Opciones para el PDF
    const options = {
        margin: 0.5, // 0.5 pulgadas de margen
        filename: `Reserva-HotelOasis-${reserva.codigo_reserva}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, // Más calidad
            useCORS: true // Para que cargue la imagen del QR
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // 4. ¡La magia!
    // Usamos html2pdf() y le pasamos el elemento y las opciones
    html2pdf().from(element).set(options).save().then(() => {
        // 5. DEVOLVEMOS el ancho a la normalidad DESPUÉS de que se genera el PDF
        element.style.width = 'auto';
    });
}
});