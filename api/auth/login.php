<?php
// api/auth/login.php
require_once __DIR__ . '/../../backend/includes/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, null, 'Method not allowed. Use POST.');
}

$data = get_request_data();
$email = sanitize_text($data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    json_response(400, null, 'Email and password are required.');
}

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->prepare('SELECT id, email, password_hash, full_name, role FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_response(401, null, 'Invalid email or password.');
    }

    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_name'] = $user['full_name'];

    json_response(200, [
        'id'        => (int)$user['id'],
        'email'     => $user['email'],
        'full_name' => $user['full_name'],
        'role'      => $user['role']
    ], 'Login successful.');

} catch (\Throwable $e) {
    json_response(500, null, 'Server error: ' . $e->getMessage());
}