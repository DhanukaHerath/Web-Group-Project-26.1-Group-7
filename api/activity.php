<?php

require_once __DIR__ . '/helpers.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $body = getJsonBody();
    $type = $body['type'] ?? ($_GET['type'] ?? '');
    if (!$type) errorResponse('Activity type is required.');

    logActivityRecord($pdo, $type);
    jsonResponse(['message' => "Activity '{$type}' logged successfully"]);
}

if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    if ($action === 'stats') {
        requireAdmin($pdo);

        $stmt = $pdo->query("SELECT * FROM `activity_logs` ORDER BY `log_date` DESC LIMIT 30");
        $logs = $stmt->fetchAll();

        $uCount = (int)$pdo->query("SELECT COUNT(*) FROM `users` WHERE `status` = 'active'")->fetchColumn();
        $pCount = (int)$pdo->query("SELECT COUNT(*) FROM `posts` WHERE `status` = 'approved'")->fetchColumn();
        $qCount = (int)$pdo->query("SELECT COUNT(*) FROM `posts` WHERE `status` = 'pending'")->fetchColumn();
        $eCount = (int)$pdo->query("SELECT COUNT(*) FROM `events`")->fetchColumn();

        jsonResponse([
            'summary' => [
                'active_members' => $uCount,
                'approved_posts' => $pCount,
                'pending_queue'  => $qCount,
                'events_total'   => $eCount
            ],
            'daily_logs' => $logs
        ]);
    }

   $stmt = $pdo->query("SELECT * FROM `activity_logs` ORDER BY `log_date` ASC LIMIT 60");
    $rows = $stmt->fetchAll();
    $map = [];
    foreach ($rows as $r) {
        $map[$r['log_date']] = [
            'view'     => (int)$r['view_count'],
            'login'    => (int)$r['login_count'],
            'post'     => (int)$r['post_count'],
            'register' => (int)$r['register_count'],
            'signup'   => (int)$r['signup_count']
        ];
    }
    jsonResponse($map);
}

errorResponse('Method not allowed.', 405);
