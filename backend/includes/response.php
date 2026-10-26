<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function json_response(int $statusCode, $data = null, string $message = '', array $extra = []): void {
    http_response_code($statusCode);

    $success = ($statusCode >= 200 && $statusCode < 300);
    $response = array_merge([
        'success' => $success,
        'status'  => $statusCode,
        'message' => $message,
        'data'    => $data,
        'timestamp' => date('c')
    ], $extra);

    echo json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function get_request_data(): array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw, true);
        return is_array($json) ? $json : [];
    }

    return array_merge($_GET, $_POST);
}

function sanitize_text($val): string {
    if (!is_string($val)) return '';
    return trim(htmlspecialchars($val, ENT_QUOTES, 'UTF-8'));
}

