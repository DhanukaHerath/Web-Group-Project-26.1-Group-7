<?php
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/../config/db.php';

function start_session_safe(): void {
    if (session_status() === PHP_SESSION_NONE) {

        ini_set('session.cookie_httponly', 1);
        ini_set('session.use_only_cookies', 1);
        ini_set('session.cookie_samesite', 'Lax');
        session_start();
    }
}

start_session_safe();

function is_logged_in(): bool {
    return !empty($_SESSION['user_id']);
}

function get_current_user_id(): ?int {
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

function get_current_user_role(): ?string {
    return $_SESSION['user_role'] ?? null;
}

function get_current_user_profile(PDO $pdo): ?array {
    $userId = get_current_user_id();
    if (!$userId) return null;

    $stmt = $pdo->prepare('SELECT id, username, email, full_name, role, bio, avatar_url, created_at FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function require_login(): int {
    if (!is_logged_in()) {
        json_response(401, null, 'Authentication required. Please log in.');
    }
    return (int)$_SESSION['user_id'];
}

function require_admin(): int {
    $userId = require_login();
    if (get_current_user_role() !== 'admin') {
        json_response(403, null, 'Access denied. Administrator privileges required.');
    }
    return $userId;
}

function log_admin_action(PDO $pdo, int $adminId, string $action, string $targetType, ?int $targetId = null, ?array $details = null): void {
    try {
        $stmt = $pdo->prepare('
            INSERT INTO admin_audit (admin_id, action, target_type, target_id, details)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $adminId,
            $action,
            $targetType,
            $targetId,
            $details ? json_encode($details, JSON_UNESCAPED_SLASHES) : null
        ]);
    } catch (\Throwable $e) {

        error_log("Failed to write admin audit log: " . $e->getMessage());
    }
}

