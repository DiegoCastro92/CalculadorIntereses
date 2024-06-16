<?php
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $tae = $_POST['tae'];
    $saldos = $_POST['saldos'];

    if (empty($saldos) || !is_array($saldos)) {
        echo json_encode([
            "status" => "error",
            "message" => "Por favor, ingrese saldos válidos."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $interes_total = 0;
    $data = [];
    foreach ($saldos as $index => $saldo) {
        if (!is_numeric($saldo)) {
            echo json_encode([
                "status" => "error",
                "message" => "Por favor, ingrese saldos válidos."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $interes_diario = ($saldo * $tae) / (366 * 100);
        $interes_total += $interes_diario;
        $IRPF = 0.81;
        $saldo_final = $interes_total * $IRPF;

        $data[] = [
            'dia' => $index + 1,
            'saldo_inicial' => $saldo,
            'interes_diario' => $interes_diario,
            'interes_acumulado' => $interes_total,
            'saldo_final' => $saldo_final
        ];
    }

    echo json_encode([
        "status" => "success",
        "interes_total" => number_format($interes_total, 2),
        "saldo_final" => number_format($saldo_final, 2),
        "data" => $data
    ], JSON_UNESCAPED_UNICODE);
}
?>
