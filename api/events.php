<?php
// events.php – Notices, events, exhibitions, and registration management

require_once __DIR__ . '/helpers.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    if ($action === 'registrations') {
        requireAdmin($pdo);
        $eventId = $_GET['event_id'] ?? null;
        if (!$eventId) errorResponse('Event ID is required.');

        $stmt = $pdo->prepare("SELECT r.*, u.full_name, u.username, u.email, u.faculty, u.batch
            FROM `event_registrations` r
            JOIN `users` u ON r.user_id = u.id
            WHERE r.event_id = ?
            ORDER BY r.created_at ASC");
        $stmt->execute([$eventId]);
        jsonResponse($stmt->fetchAll());
    }

    // List events
    $stmt = $pdo->query("SELECT e.*,
        (SELECT COUNT(*) FROM `event_registrations` r WHERE r.event_id = e.id) as registration_count
        FROM `events` e
        ORDER BY e.date ASC");
    $events = $stmt->fetchAll();

    $currentUser = getCurrentUser($pdo);
    $userRegs = [];
    if ($currentUser) {
        $regStmt = $pdo->prepare("SELECT `event_id` FROM `event_registrations` WHERE `user_id` = ?");
        $regStmt->execute([$currentUser['id']]);
        $userRegs = $regStmt->fetchAll(PDO::FETCH_COLUMN);
    }

    foreach ($events as &$e) {
        $e['date'] = (int)$e['date'];
        $e['register_by'] = isset($e['register_by']) ? (int)$e['register_by'] : null;
        $e['registration_count'] = (int)$e['registration_count'];
        $e['is_registered'] = in_array($e['id'], $userRegs);
        $e['can_register'] = ($e['kind'] !== 'Notice') && (!$e['register_by'] || $e['register_by'] > nowMs());
    }

    jsonResponse($events);
}

if ($method === 'POST') {
    $body = getJsonBody();
    if (empty($action) && isset($body['action'])) {
        $action = $body['action'];
    }

    if ($action === 'register') {
        $user = requireAuth($pdo);
        $eventId = $body['event_id'] ?? ($_GET['event_id'] ?? '');

        if (!$eventId) errorResponse('Event ID is required.');

        $evStmt = $pdo->prepare("SELECT * FROM `events` WHERE `id` = ? LIMIT 1");
        $evStmt->execute([$eventId]);
        $event = $evStmt->fetch();

        if (!$event) errorResponse('Event not found.', 404);
        if ($event['kind'] === 'Notice') errorResponse('Notices do not require registration.');
        if ($event['register_by'] && (int)$event['register_by'] < nowMs()) {
            errorResponse('Registration deadline for this event has passed.');
        }

        // Check if already registered
        $chk = $pdo->prepare("SELECT 1 FROM `event_registrations` WHERE `event_id` = ? AND `user_id` = ? LIMIT 1");
        $chk->execute([$eventId, $user['id']]);
        if ($chk->fetch()) {
            errorResponse('You are already registered for this event.');
        }

        $now = nowMs();
        $ins = $pdo->prepare("INSERT INTO `event_registrations` (`event_id`, `user_id`, `created_at`) VALUES (?, ?, ?)");
        $ins->execute([$eventId, $user['id'], $now]);

        logActivityRecord($pdo, 'register');

        jsonResponse(['message' => 'Successfully registered for event!']);
    }

    if ($action === 'create') {
        requireAdmin($pdo);
        $kind = in_array($body['kind'] ?? '', ['Exhibition', 'Notice', 'Event']) ? $body['kind'] : 'Event';
        $title = trim($body['title'] ?? '');
        $venue = trim($body['venue'] ?? '');
        $date = (int)($body['date'] ?? 0);
        $description = trim($body['description'] ?? '');
        $registerBy = !empty($body['register_by']) ? (int)$body['register_by'] : null;

        if (strlen($title) < 3) errorResponse('Please enter an event title (at least 3 characters).');
        if (!$date) errorResponse('Please select an event date and time.');
        if (!$venue) errorResponse('Please enter a venue.');
        if ($registerBy && $registerBy > $date) {
            errorResponse('Registration deadline must be before the event date.');
        }
        if ($kind === 'Notice') {
            $registerBy = null;
        }

        $id = generateId('e_');
        $now = nowMs();

        $stmt = $pdo->prepare("INSERT INTO `events` (`id`, `kind`, `title`, `venue`, `date`, `description`, `register_by`, `created_at`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $kind, $title, $venue, $date, $description, $registerBy, $now]);

        jsonResponse(['message' => 'Event created successfully', 'id' => $id], 201);
    }

    errorResponse('Invalid action for POST.');
}

if ($method === 'PUT') {
    requireAdmin($pdo);
    $id = $_GET['id'] ?? '';
    if (!$id) errorResponse('Event ID is required.');

    $body = getJsonBody();
    $kind = in_array($body['kind'] ?? '', ['Exhibition', 'Notice', 'Event']) ? $body['kind'] : 'Event';
    $title = trim($body['title'] ?? '');
    $venue = trim($body['venue'] ?? '');
    $date = (int)($body['date'] ?? 0);
    $description = trim($body['description'] ?? '');
    $registerBy = !empty($body['register_by']) ? (int)$body['register_by'] : null;

    if (strlen($title) < 3) errorResponse('Please enter an event title.');
    if (!$date) errorResponse('Please select an event date.');
    if (!$venue) errorResponse('Please enter a venue.');
    if ($registerBy && $registerBy > $date) {
        errorResponse('Registration deadline must be before the event date.');
    }
    if ($kind === 'Notice') $registerBy = null;

    $stmt = $pdo->prepare("UPDATE `events` SET `kind` = ?, `title` = ?, `venue` = ?, `date` = ?, `description` = ?, `register_by` = ? WHERE `id` = ?");
    $stmt->execute([$kind, $title, $venue, $date, $description, $registerBy, $id]);

    jsonResponse(['message' => 'Event updated successfully']);
}

if ($method === 'DELETE') {
    requireAdmin($pdo);
    $id = $_GET['id'] ?? '';
    if (!$id) errorResponse('Event ID is required.');

    $stmt = $pdo->prepare("DELETE FROM `events` WHERE `id` = ?");
    $stmt->execute([$id]);

    jsonResponse(['message' => 'Event and its registrations deleted successfully']);
}

errorResponse('Method not allowed.', 405);
