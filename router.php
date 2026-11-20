<?php
// router.php – Unified Single-Port Development Server Router
// Usage: php -S localhost:8000 router.php

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);


if (preg_match('#^/api/(.+)$#', $uri, $m)) {
    $script = __DIR__ . '/api/' . $m[1];
    if (file_exists($script) && is_file($script)) {
        require $script;
        exit;
    }
}


if (preg_match('#^/uploads/(.+)$#', $uri, $m)) {
    $file = __DIR__ . '/uploads/' . $m[1];
    if (file_exists($file) && is_file($file)) {
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mimes = [
            'webp' => 'image/webp',
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif'  => 'image/gif'
        ];
        header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
        readfile($file);
        exit;
    }
}


$frontendRoot = __DIR__ . '/scriptorium';

if ($uri === '/' || $uri === '') {
    $uri = '/index.html';
}

$target = $frontendRoot . $uri;

if (file_exists($target) && is_file($target)) {
    $ext = pathinfo($target, PATHINFO_EXTENSION);
    $mimes = [
        'html' => 'text/html; charset=utf-8',
        'css'  => 'text/css; charset=utf-8',
        'js'   => 'application/javascript; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'svg'  => 'image/svg+xml',
        'mp4'  => 'video/mp4',
        'woff2'=> 'font/woff2'
    ];
    if (isset($mimes[$ext])) {
        header('Content-Type: ' . $mimes[$ext]);
    }
    readfile($target);
    exit;
}


http_response_code(404);
echo "404 Not Found: " . htmlspecialchars($uri);
