function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
    const year = String(date.getFullYear()).slice(-2); // Get last 2 digits of the year
    return `${day}/${month}/${year}`;
}

function generarCamposSaldo() {
    const fechaInicioInput = document.getElementById('fecha_inicio');
    const fechaFinInput = document.getElementById('fecha_fin');
    const saldoInicialInput = document.getElementById('saldo_inicial');

    const fechaInicio = new Date(fechaInicioInput.value);
    const fechaFin = new Date(fechaFinInput.value);
    const saldoInicial = parseFloat(saldoInicialInput.value);

    // Validaciones
    if (!fechaInicioInput.value || !fechaFinInput.value || isNaN(saldoInicial)) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, complete todos los campos: Fecha de Inicio, Fecha de Fin y Saldo Inicial.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    if (fechaInicio > fechaFin) {
        Swal.fire({
            title: 'Error',
            text: 'La fecha de inicio no puede ser mayor que la fecha de fin.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    const tbody = document.getElementById('saldosBody');
    tbody.innerHTML = '';

    let currentDate = new Date(fechaInicio);
    let saldoActual = saldoInicial;

    while (currentDate <= fechaFin) {
        const dateString = formatDate(currentDate);
        const tr = document.createElement('tr');
        tr.classList.add('saldo-row');
        tr.innerHTML = `
            <td>${dateString}</td>
            <td><input type="number" id="saldo_inicial_${dateString}" name="saldo_inicial_${dateString}" value="${saldoActual.toFixed(2)}" readonly></td>
            <td><input type="number" id="incremento_${dateString}" name="incremento_${dateString}" value="0" onchange="actualizarSaldoFinal('${dateString}')"></td>
            <td><input type="number" id="saldo_final_${dateString}" name="saldos[]" value="${saldoActual.toFixed(2)}" readonly class="saldo-final"></td>
        `;
        tbody.appendChild(tr);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    document.getElementById('interestForm').style.display = 'block';
    actualizarSaldosIniciales();

    Swal.fire({
        title: 'Instrucciones',
        html: `<p>Por favor, revise y ajuste los saldos según sea necesario.</p>
               <p>Puede introducir cualquier variación de saldo que tenga diario en la columna "Diferencia" (tanto positivo como negativo).</p>
               <p>El "Saldo Final" se calculará automáticamente.</p>
               <p>Una vez completado, ingrese el TAE y haga clic en "Calcular Intereses" para obtener el rendimiento.</p>`,
        icon: 'info',
        confirmButtonText: 'Entendido'
    });
}

function actualizarSaldoFinal(dateString) {
    const saldoInicial = parseFloat(document.getElementById(`saldo_inicial_${dateString}`).value);
    const incremento = parseFloat(document.getElementById(`incremento_${dateString}`).value);
    const saldoFinal = (saldoInicial + incremento).toFixed(2);
    document.getElementById(`saldo_final_${dateString}`).value = saldoFinal;

    actualizarSaldosIniciales();
}

function actualizarSaldosIniciales() {
    const rows = document.querySelectorAll('.saldo-row');
    for (let i = 0; i < rows.length - 1; i++) {
        const currentSaldoFinal = parseFloat(rows[i].querySelector('.saldo-final').value);
        const nextSaldoInicialInput = rows[i + 1].querySelector(`[id^="saldo_inicial"]`);
        nextSaldoInicialInput.value = currentSaldoFinal.toFixed(2);

        const nextDateString = nextSaldoInicialInput.id.split('_').pop();
        const nextIncremento = parseFloat(document.getElementById(`incremento_${nextDateString}`).value);
        const nextSaldoFinal = (currentSaldoFinal + nextIncremento).toFixed(2);
        document.getElementById(`saldo_final_${nextDateString}`).value = nextSaldoFinal;
    }
}

function calcularIntereses() {
    const form = document.getElementById('interestForm');
    const formData = new FormData(form);

    fetch('calcular_intereses.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            Swal.fire({
                title: 'Cálculo de Intereses',
                html: `El rendimiento total bruto es: ${data.interes_total} €<br>El rendimiento Neto es: ${data.saldo_final} €<br>Recuerde que este cálculo es una simulación`,
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'Descargar CSV',
                cancelButtonText: 'Cerrar'
            }).then(result => {
                if (result.isConfirmed) {
                    generarCSV(data);
                }
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: data.message,
                icon: 'error'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al calcular los intereses.',
            icon: 'error'
        });
    });
}

function generarCSV(data) {
    fetch('generar_csv.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: data })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const link = document.createElement('a');
            link.href = data.url;
            link.download = 'intereses.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Swal.fire({
                title: 'CSV Generado',
                text: 'El archivo CSV ha sido generado y está listo para su descarga.',
                icon: 'success'
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: data.message,
                icon: 'error'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al generar el archivo CSV.',
            icon: 'error'
        });
    });
}
