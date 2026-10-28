<?php
// api/auth/me.php
require_once __DIR__ . '/../../backend/includes/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(405, null, 'Method not allowed. Use GET.');
}

if (!is_logged_in()) {
    json_response(200, [
        'authenticated' => false,
        'user'          => null
    ], 'No active session.');
}

try {
    $pdo = Database::getConnection();
    $user = get_current_user_profile($pdo);

    if (!$user) {
        json_response(404, null, 'User record not found.');
    }

    json_response(200, [
        'authenticated' => true,
        'user'          => $user
    ], 'Session verified.');

} catch (\Throwable $e) {
    json_response(500, null, 'Server error: ' . $e->getMessage());
}