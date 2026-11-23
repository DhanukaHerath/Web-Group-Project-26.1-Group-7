<?php
// auth.php – Authentication, registration, login, logout, and session check

require_once __DIR__ . '/helpers.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET /api/auth.php?action=me
if ($method === 'GET') {
    $user = getCurrentUser($pdo);
    jsonResponse(['user' => $user]);
}

// POST /api/auth.php?action=login | register | logout
if ($method === 'POST') {
    $body = getJsonBody();
    if (empty($action) && isset($body['action'])) {
        $action = $body['action'];
    }

    if ($action === 'login') {
        $email = strtolower(trim($body['email'] ?? ''));
        $password = $body['password'] ?? '';

        if (!$email || !$password) {
            errorResponse('Email and password are required.');
        }

        $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `email` = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            errorResponse('Incorrect email or password.');
        }

        // Verify password using modern password_verify with SHA-256 fallback for compatibility
        $valid = password_verify($password, $user['password_hash']);
        if (!$valid) {
            $legacyHash = hash('sha256', 'scriptorium:' . $password);
            if ($user['password_hash'] === $legacyHash) {
                $valid = true;
                // Transparently upgrade to bcrypt
                $newHash = password_hash($password, PASSWORD_DEFAULT);
                $upStmt = $pdo->prepare("UPDATE `users` SET `password_hash` = ? WHERE `id` = ?");
                $upStmt->execute([$newHash, $user['id']]);
            }
        }

        if (!$valid) {
            errorResponse('Incorrect email or password.');
        }

        $status = effectiveStatus($user);
        if ($status === 'banned') {
            errorResponse('This account has been banned. Please contact an administrator.', 403);
        }
        if ($status === 'suspended') {
            $dateStr = date('F j, Y', (int)($user['suspended_until'] / 1000));
            errorResponse("This account is suspended until {$dateStr}.", 403);
        }

        initSession();
        $_SESSION['user_id'] = $user['id'];

        $now = nowMs();
        $upStmt = $pdo->prepare("UPDATE `users` SET `last_active_at` = ? WHERE `id` = ?");
        $upStmt->execute([$now, $user['id']]);

        logActivityRecord($pdo, 'login');

        jsonResponse([
            'message' => 'Logged in successfully',
            'user'    => publicUser($user)
        ]);
    }

    if ($action === 'register') {
        $fullName = trim($body['fullName'] ?? '');
        $username = trim($body['username'] ?? '');
        $email = strtolower(trim($body['email'] ?? ''));
        $faculty = trim($body['faculty'] ?? '');
        $batch = trim($body['batch'] ?? '');
        $password = $body['password'] ?? '';
        $confirmPassword = $body['confirmPassword'] ?? null;

        if (strlen($fullName) < 2) errorResponse('Please enter your full name.');
        if (strlen($username) < 2) errorResponse('Username must be at least 2 characters.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) errorResponse('Please enter a valid email address.');
        if (!$faculty) errorResponse('Please select a faculty.');
        if (!$batch) errorResponse('Please select a batch.');
        if (strlen($password) < 6) errorResponse('Password must be at least 6 characters.');
        if ($confirmPassword !== null && $password !== $confirmPassword) errorResponse('Passwords do not match.');

        // Uniqueness check
        $stmt = $pdo->prepare("SELECT `id`, `email`, `username` FROM `users` WHERE `email` = ? OR LOWER(`username`) = LOWER(?) LIMIT 1");
        $stmt->execute([$email, $username]);
        $existing = $stmt->fetch();
        if ($existing) {
            if (strtolower($existing['email']) === $email) {
                errorResponse('An account with this email already exists.');
            }
            errorResponse('That username is already taken.');
        }

        $id = generateId('u_');
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $now = nowMs();

        $insStmt = $pdo->prepare("INSERT INTO `users`
            (`id`, `full_name`, `username`, `email`, `faculty`, `batch`, `password_hash`, `role`, `status`, `bio`, `avatar`, `created_at`, `last_active_at`)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'member', 'active', '', NULL, ?, ?)");
        $insStmt->execute([$id, $fullName, $username, $email, $faculty, $batch, $hash, $now, $now]);

        initSession();
        $_SESSION['user_id'] = $id;

        logActivityRecord($pdo, 'signup');
        logActivityRecord($pdo, 'login');

        $newUser = [
            'id' => $id,
            'full_name' => $fullName,
            'username' => $username,
            'email' => $email,
            'faculty' => $faculty,
            'batch' => $batch,
            'role' => 'member',
            'status' => 'active',
            'bio' => '',
            'avatar' => null,
            'created_at' => $now,
            'last_active_at' => $now
        ];

        jsonResponse([
            'message' => 'Registration successful',
            'user'    => publicUser($newUser)
        ], 201);
    }

    if ($action === 'logout') {
        initSession();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params['path'], $params['domain'],
                $params['secure'], $params['httponly']
            );
        }
        session_destroy();
        jsonResponse(['message' => 'Logged out successfully']);
    }

    errorResponse('Invalid action specified.');
}

errorResponse('Method not allowed.', 405);
