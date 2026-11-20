//Per-user alerts, moderation updates, and read states
<?php

require_once __DIR__ . '/helpers.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$user = requireAuth($pdo);

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM `notifications` WHERE `user_id` = ? ORDER BY `created_at` DESC LIMIT 50");
    $stmt->execute([$user['id']]);
    $notes = $stmt->fetchAll();

    $unread = 0;
    foreach ($notes as &$n) {
        $n['is_read'] = (bool)$n['is_read'];
        $n['created_at'] = (int)$n['created_at'];
        if (!$n['is_read']) $unread++;
    }

    jsonResponse(['notifications' => $notes, 'unreadCount' => $unread]);
}

if ($method === 'POST') {
    $body = getJsonBody();
    $id = $body['id'] ?? ($_GET['id'] ?? 'all');

    if ($id === 'all') {
        $up = $pdo->prepare("UPDATE `notifications` SET `is_read` = 1 WHERE `user_id` = ?");
        $up->execute([$user['id']]);
    } else {
        $up = $pdo->prepare("UPDATE `notifications` SET `is_read` = 1 WHERE `id` = ? AND `user_id` = ?");
        $up->execute([$id, $user['id']]);
    }

    jsonResponse(['message' => 'Notifications marked as read']);
}

errorResponse('Method not allowed.', 405);
