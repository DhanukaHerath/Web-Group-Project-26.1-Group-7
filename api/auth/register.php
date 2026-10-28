<?php
// api/auth/register.php
require_once __DIR__ . '/../../backend/includes/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, null, 'Method not allowed. Use POST.');
}

$data = get_request_data();
$username = sanitize_text($data['username'] ?? '');
$email    = sanitize_text($data['email'] ?? '');
$password = $data['password'] ?? '';
$fullName = sanitize_text($data['full_name'] ?? '');

if (empty($email) || empty($password) || empty($fullName)) {
    json_response(400, null, 'Full name, email, and password are required.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(400, null, 'Invalid email format.');
}

if (strlen($password) < 6) {
    json_response(400, null, 'Password must be at least 6 characters long.');
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? OR username = ?');
    $stmt->execute([$email, $username ?: $email]);
    if ($stmt->fetch()) {
        json_response(409, null, 'An account with this email or username already exists.');
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $finalUsername = !empty($username) ? $username : explode('@', $email)[0];

    $insertStmt = $pdo->prepare('
        INSERT INTO users (username, email, password_hash, full_name, role)
        VALUES (?, ?, ?, ?, "student")
    ');
    $insertStmt->execute([$finalUsername, $email, $passwordHash, $fullName]);

    $newUserId = (int)$pdo->lastInsertId();

    $_SESSION['user_id'] = $newUserId;
    $_SESSION['user_role'] = 'student';
    $_SESSION['user_name'] = $fullName;

    json_response(201, [
        'id'        => $newUserId,
        'username'  => $finalUsername,
        'email'     => $email,
        'full_name' => $fullName,
        'role'      => 'student'
    ], 'Registration successful.');

} catch (\Throwable $e) {
    json_response(500, null, 'Server error: ' . $e->getMessage());
}