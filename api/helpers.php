<?php
// helpers.php – Shared API utility functions, authentication & response helpers

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';

function initSession() {
    if (session_status() === PHP_SESSION_NONE) {
        // Configure secure session cookies
        session_set_cookie_params([
            'lifetime' => 86400 * 7, // 7 days
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        session_start();
    }
}

function getJsonBody() {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function errorResponse($message, $status = 400, $extra = []) {
    http_response_code($status);
    $payload = array_merge(['success' => false, 'error' => $message], $extra);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function nowMs() {
    return (int)round(microtime(true) * 1000);
}

function generateId($prefix = 'p_') {
    return $prefix . base_convert((string)time(), 10, 36) . substr(bin2hex(random_bytes(3)), 0, 4);
}

function effectiveStatus($user) {
    if (!$user) return 'none';
    if ($user['status'] === 'banned') return 'banned';
    if ($user['status'] === 'suspended') {
        $now = nowMs();
        if (!empty($user['suspended_until']) && $user['suspended_until'] > $now) {
            return 'suspended';
        }
    }
    return 'active';
}

function publicUser($user) {
    if (!$user) return null;
    unset($user['password_hash']);
    
    // Parse avatar JSON if serialized
    if (!empty($user['avatar']) && is_string($user['avatar'])) {
        $parsed = json_decode($user['avatar'], true);
        if ($parsed) $user['avatar'] = $parsed;
    }
    
    $user['effectiveStatus'] = effectiveStatus($user);
    // Align with frontend naming conventions
    $user['fullName'] = $user['full_name'] ?? $user['fullName'] ?? '';
    $user['createdAt'] = (int)($user['created_at'] ?? 0);
    $user['lastActiveAt'] = (int)($user['last_active_at'] ?? 0);
    $user['suspendedUntil'] = isset($user['suspended_until']) ? (int)$user['suspended_until'] : null;
    
    return $user;
}

function getCurrentUser($pdo) {
    initSession();
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `id` = ? LIMIT 1");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        unset($_SESSION['user_id']);
        return null;
    }

    $status = effectiveStatus($user);
    if ($status !== 'active') {
        unset($_SESSION['user_id']);
        return null;
    }

    // Touch heartbeat once a minute
    $now = nowMs();
    if ($now - (int)$user['last_active_at'] > 60000) {
        $upStmt = $pdo->prepare("UPDATE `users` SET `last_active_at` = ? WHERE `id` = ?");
        $upStmt->execute([$now, $user['id']]);
        $user['last_active_at'] = $now;
    }

    return publicUser($user);
}

function requireAuth($pdo) {
    $user = getCurrentUser($pdo);
    if (!$user) {
        errorResponse('Authentication required. Please log in.', 401);
    }
    return $user;
}

function requireAdmin($pdo) {
    $user = requireAuth($pdo);
    if ($user['role'] !== 'admin') {
        errorResponse('Admin privileges required.', 403);
    }
    return $user;
}

function logActivityRecord($pdo, $type) {
    $allowed = ['view', 'login', 'post', 'register', 'signup'];
    if (!in_array($type, $allowed)) return;

    $column = $type . '_count';
    $today = date('Y-m-d');

    $sql = "INSERT INTO `activity_logs` (`log_date`, `{$column}`)
            VALUES (?, 1)
            ON DUPLICATE KEY UPDATE `{$column}` = `{$column}` + 1";
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$today]);
    } catch (Exception $e) {
        // Silently log or ignore in background
    }
}
