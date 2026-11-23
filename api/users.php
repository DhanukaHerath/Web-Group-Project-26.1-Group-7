<?php


require_once __DIR__ . '/helpers.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    if ($action === 'all') {
        requireAdmin($pdo);
        $stmt = $pdo->query("SELECT u.*,
            (SELECT COUNT(*) FROM `posts` p WHERE p.author_id = u.id) as post_count,
            (SELECT COUNT(*) FROM `follows` f WHERE f.followee_id = u.id) as follower_count
            FROM `users` u
            ORDER BY u.created_at DESC");
        $users = $stmt->fetchAll();
        $res = array_map('publicUser', $users);
        jsonResponse($res);
    }

    $userId = $_GET['id'] ?? '';
    if (!$userId) errorResponse('User ID is required.');

    $stmt = $pdo->prepare("SELECT u.*,
        (SELECT COUNT(*) FROM `posts` p WHERE p.author_id = u.id AND p.status = 'approved') as post_count,
        (SELECT COUNT(*) FROM `follows` f WHERE f.followee_id = u.id) as follower_count,
        (SELECT COUNT(*) FROM `follows` f WHERE f.follower_id = u.id) as following_count
        FROM `users` u WHERE u.id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) errorResponse('User not found.', 404);

    $currentUser = getCurrentUser($pdo);
    $user['is_following'] = false;
    if ($currentUser && $currentUser['id'] !== $userId) {
        $fChk = $pdo->prepare("SELECT 1 FROM `follows` WHERE `follower_id` = ? AND `followee_id` = ? LIMIT 1");
        $fChk->execute([$currentUser['id'], $userId]);
        $user['is_following'] = (bool)$fChk->fetch();
    }

    $pub = publicUser($user);
    $pub['post_count'] = (int)$user['post_count'];
    $pub['follower_count'] = (int)$user['follower_count'];
    $pub['following_count'] = (int)$user['following_count'];
    $pub['is_following'] = $user['is_following'];

    jsonResponse($pub);
}

if ($method === 'PUT') {
    $user = requireAuth($pdo);
    $body = getJsonBody();
    if (empty($action) && isset($body['action'])) {
        $action = $body['action'];
    }

    if ($action === 'profile') {
        $username = trim($body['username'] ?? '');
        $bio = mb_substr(trim($body['bio'] ?? ''), 0, 240);
        $currentPassword = $body['currentPassword'] ?? '';
        $newPassword = $body['newPassword'] ?? '';

        if (strlen($username) < 2) errorResponse('Username must be at least 2 characters.');

        
        $uChk = $pdo->prepare("SELECT `id` FROM `users` WHERE `id` != ? AND LOWER(`username`) = LOWER(?) LIMIT 1");
        $uChk->execute([$user['id'], $username]);
        if ($uChk->fetch()) {
            errorResponse('That username is already taken.');
        }

        if (!empty($newPassword)) {
            if (strlen($newPassword) < 6) errorResponse('New password must be at least 6 characters.');
            
            
            $pStmt = $pdo->prepare("SELECT `password_hash` FROM `users` WHERE `id` = ?");
            $pStmt->execute([$user['id']]);
            $hash = $pStmt->fetchColumn();

            if (!password_verify($currentPassword, $hash) && $hash !== hash('sha256', 'scriptorium:' . $currentPassword)) {
                errorResponse('Current password is incorrect.');
            }

            $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
            $up = $pdo->prepare("UPDATE `users` SET `username` = ?, `bio` = ?, `password_hash` = ? WHERE `id` = ?");
            $up->execute([$username, $bio, $newHash, $user['id']]);
        } else {
            $up = $pdo->prepare("UPDATE `users` SET `username` = ?, `bio` = ? WHERE `id` = ?");
            $up->execute([$username, $bio, $user['id']]);
        }

        
        $refreshStmt = $pdo->prepare("SELECT * FROM `users` WHERE `id` = ?");
        $refreshStmt->execute([$user['id']]);
        jsonResponse(['message' => 'Profile updated successfully', 'user' => publicUser($refreshStmt->fetch())]);
    }

    if ($action === 'avatar') {
        $avatarState = $body['avatar'] ?? null;
        if (!is_array($avatarState)) {
            errorResponse('Invalid avatar state structure.');
        }

        $avatarJson = json_encode($avatarState, JSON_UNESCAPED_SLASHES);
        $up = $pdo->prepare("UPDATE `users` SET `avatar` = ? WHERE `id` = ?");
        $up->execute([$avatarJson, $user['id']]);

        jsonResponse(['message' => 'Avatar updated successfully', 'avatar' => $avatarState]);
    }

    errorResponse('Invalid action for PUT.');
}

if ($method === 'PATCH') {
    requireAdmin($pdo);
    $body = getJsonBody();
    $userId = $_GET['id'] ?? ($body['id'] ?? '');
    if (!$userId) errorResponse('User ID is required.');

    if ($action === 'status') {
        $status = $body['status'] ?? '';
        $days = isset($body['days']) ? (int)$body['days'] : 0;

        if (!in_array($status, ['active', 'suspended', 'banned'])) {
            errorResponse("Status must be 'active', 'suspended', or 'banned'.");
        }

        $suspendedUntil = null;
        if ($status === 'suspended') {
            $days = max(1, $days);
            $suspendedUntil = nowMs() + ($days * 86400 * 1000);
        }

        $stmt = $pdo->prepare("UPDATE `users` SET `status` = ?, `suspended_until` = ? WHERE `id` = ?");
        $stmt->execute([$status, $suspendedUntil, $userId]);

        jsonResponse(['message' => "User status set to {$status}"]);
    }

    if ($action === 'role') {
        $role = $body['role'] ?? '';
        if (!in_array($role, ['member', 'admin'])) {
            errorResponse("Role must be 'member' or 'admin'.");
        }

        $stmt = $pdo->prepare("UPDATE `users` SET `role` = ? WHERE `id` = ?");
        $stmt->execute([$role, $userId]);

        jsonResponse(['message' => "User role set to {$role}"]);
    }

    errorResponse('Invalid action for PATCH.');
}

errorResponse('Method not allowed.', 405);
