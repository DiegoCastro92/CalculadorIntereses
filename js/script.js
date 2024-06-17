function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}`;
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
            <td data-label="Día" class="expandable">${dateString}</td>
            <td data-label="Saldo Inicial" class="details"><input type="number" id="saldo_inicial_${dateString}" name="saldo_inicial_${dateString}" value="${saldoActual.toFixed(2)}" readonly></td>
            <td data-label="Incremento" class="details table-success"><input class="table-success" type="number" id="incremento_${dateString}" name="incremento_${dateString}" value="0" onchange="actualizarSaldoFinal('${dateString}')"></td>
            <td data-label="Decremento" class="details table-danger"><input class="table-danger" type="number" id="decremento_${dateString}" name="decremento_${dateString}" value="0" onchange="actualizarSaldoFinal('${dateString}')"></td>
            <td data-label="Saldo Final" class="details"><input type="number" id="saldo_final_${dateString}" name="saldos[]" value="${saldoActual.toFixed(2)}" readonly class="saldo-final"></td>
        `;
        tbody.appendChild(tr);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    document.getElementById('interestForm').style.display = 'block';
    actualizarSaldosIniciales();

    // Mostrar mensaje emergente con SweetAlert2
    Swal.fire({
        title: 'Instrucciones',
        html: `<p>Por favor, revise y ajuste los saldos según sea necesario.</p>
               <p>En la columna verde, introduzca la cantidad a sumar de ese día.</p>
               <p>En la columna roja, introduzca la cantidad en positivo a restar de ese dia, ejemplo 100€ poner 100 no -100.</p>
               <p>El "Saldo Final" se calculará automáticamente.</p>
               <p>Una vez completado, ingrese el TAE y haga clic en "Calcular Intereses" para obtener el rendimiento.</p>`,
        icon: 'info',
        confirmButtonText: 'Entendido'
    });

    // Añadir evento de click para expandir/colapsar filas en vista móvil
    document.querySelectorAll('.expandable').forEach(expandable => {
        expandable.addEventListener('click', () => {
            expandable.classList.toggle('expanded');
            expandable.parentElement.querySelectorAll('.details').forEach(detail => {
                detail.style.display = expandable.classList.contains('expanded') ? 'block' : 'none';
            });
        });
    });
}

function actualizarSaldoFinal(dateString) {
    const saldoInicial = parseFloat(document.getElementById(`saldo_inicial_${dateString}`).value);
    const incremento = parseFloat(document.getElementById(`incremento_${dateString}`).value);
    const decremento = parseFloat(document.getElementById(`decremento_${dateString}`).value);
    const saldoFinal = (saldoInicial + incremento - decremento).toFixed(2);
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
        const nextDecremento = parseFloat(document.getElementById(`decremento_${nextDateString}`).value);
        const nextSaldoFinal = (currentSaldoFinal + nextIncremento - nextDecremento).toFixed(2);
        document.getElementById(`saldo_final_${nextDateString}`).value = nextSaldoFinal;
    }
}

function calcularIntereses() {
    const tae = parseFloat(document.getElementById('tae').value);
    const saldos = Array.from(document.querySelectorAll('.saldo-final')).map(input => parseFloat(input.value));

    if (isNaN(tae) || saldos.some(isNaN)) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, ingrese una TAE válida y asegúrese de que todos los saldos sean válidos.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    let interes_total = 0;
    const IRPF = 0.81;
    const data = saldos.map((saldo, index) => {
        const interes_diario = (saldo * tae) / (366 * 100);
        interes_total += interes_diario;
        const saldo_final = interes_total * IRPF;
        return {
            dia: index + 1,
            saldo_inicial: saldo.toFixed(2),
            interes_diario: interes_diario.toFixed(2),
            interes_acumulado: interes_total.toFixed(2),
            saldo_final: saldo_final.toFixed(2)
        };
    });

    const saldo_final = interes_total * IRPF;

    Swal.fire({
        title: 'Cálculo de Intereses',
        html: `El rendimiento bruto generado en el periodo es: ${interes_total.toFixed(2)} €<br> El rendimiento neto genenrado en el periodo es: ${saldo_final.toFixed(2)} €<br><br>Recuerde: Los cálculos proporcionados por esta herramienta son simulaciones y deben utilizarse con fines ilustrativos.`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Descargar CSV',
        cancelButtonText: 'Cerrar'
    }).then(result => {
        if (result.isConfirmed) {
            generarCSV(data);
        }
    });
}

function formatNumber(num) {
    return num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function generarCSV(data) {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Día;Saldo Inicial;Interés Diario;Interés Acumulado;Saldo Final\n"
        + data.map(d => `${d.dia};${formatNumber(parseFloat(d.saldo_inicial))};${formatNumber(parseFloat(d.interes_diario))};${formatNumber(parseFloat(d.interes_acumulado))};${formatNumber(parseFloat(d.saldo_final))}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "intereses.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
}
