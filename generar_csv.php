<?php
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $input = json_decode(file_get_contents('php://input'), true);
    $data = $input['data']['data'];

    // Crear archivo CSV
    $filename = 'intereses.csv';
    $file = fopen($filename, 'w');
    fputcsv($file, ['Dia', 'SaldoInicial', 'InteresDiarioBruto', 'InteresAcumuladoBruto', 'SaldoFinalNeto'], ';');

    foreach ($data as $row) {
        $formattedRow = [
            $row['dia'],
            number_format($row['saldo_inicial'], 2, ',', '.'),
            number_format($row['interes_diario'], 2, ',', '.'),
            number_format($row['interes_acumulado'], 2, ',', '.'),
            number_format($row['saldo_final'], 2, ',', '.')
        ];
        fputcsv($file, $formattedRow, ';');  // Usar ';' como delimitador
    }

    fclose($file);

    // Devolver el enlace de descarga
    echo json_encode([
        "status" => "success",
        "message" => "El archivo CSV está listo para su descarga.",
        "url" => $filename
    ]);
}
?>
