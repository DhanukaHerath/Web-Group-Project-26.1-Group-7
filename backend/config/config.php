<?php
$envPath = __DIR__ . '/../../.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        if (str_contains($line, '=')) {
            [$key, $val] = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val, " \t\n\r\0\x0B\"'");
            if (getenv($key) === false) {
                putenv("$key=$val");
                $_ENV[$key] = $val;
            }
        }
    }
}

return [
    'db' => [

        'host' => getenv('DB_HOST') ?: '127.0.0.1',

        'port' => getenv('DB_PORT') ?: 3306,

        'database' => getenv('DB_NAME') ?: 'nsbm_artcraft',

        'username' => getenv('DB_USER') ?: 'root',

        'password' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',

        'charset' => 'utf8mb4',

        'ssl_ca' => getenv('DB_SSL_CA') ?: null,
        'ssl_verify' => getenv('DB_SSL_VERIFY') === 'true',
    ],

    'app' => [
        'name' => 'NSBM ArtCraft',
        'base_url' => getenv('APP_URL') ?: 'http://localhost:8000',
        'upload_dir' => __DIR__ . '/../../uploads/',
        'allowed_image_types' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        'max_file_size' => 10 * 1024 * 1024,
        'session_lifetime' => 86400 * 7,
    ]
];

