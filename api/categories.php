<?php
// categories.php – Category taxonomy management (public listing + admin CRUD)

require_once __DIR__ . '/helpers.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT c.*, (SELECT COUNT(*) FROM `posts` p WHERE p.category = c.id) as post_count FROM `categories` c ORDER BY c.label ASC");
    $categories = $stmt->fetchAll();
    foreach ($categories as &$c) {
        $c['post_count'] = (int)$c['post_count'];
    }
    jsonResponse($categories);
}

if ($method === 'POST') {
    requireAdmin($pdo);
    $body = getJsonBody();
    $label = trim($body['label'] ?? '');
    $type = ($body['type'] ?? '') === 'text' ? 'text' : 'image';
    $description = trim($body['description'] ?? '');

    if (strlen($label) < 2) {
        errorResponse('Please enter a category name (at least 2 characters).');
    }

    $id = strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($label)));
    $id = trim($id, '-');

    if (!$id) {
        errorResponse('Invalid category identifier.');
    }

    // Check duplicate
    $chk = $pdo->prepare("SELECT `id` FROM `categories` WHERE `id` = ? OR LOWER(`label`) = LOWER(?) LIMIT 1");
    $chk->execute([$id, $label]);
    if ($chk->fetch()) {
        errorResponse('A category with that name already exists.');
    }

    // Compute plural
    $plural = $label;
    if (preg_match('/(s|phy)$/i', $label)) {
        $plural = $label;
    } elseif (preg_match('/[^aeiou]y$/i', $label)) {
        $plural = substr($label, 0, -1) . 'ies';
    } else {
        $plural = $label . 's';
    }

    $stmt = $pdo->prepare("INSERT INTO `categories` (`id`, `label`, `plural`, `type`, `description`) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$id, $label, $plural, $type, $description]);

    jsonResponse(['message' => 'Category created', 'category' => [
        'id' => $id, 'label' => $label, 'plural' => $plural, 'type' => $type, 'description' => $description
    ]], 201);
}

if ($method === 'DELETE') {
    requireAdmin($pdo);
    $id = $_GET['id'] ?? '';
    if (!$id) errorResponse('Category ID is required.');

    // Count usage
    $chk = $pdo->prepare("SELECT COUNT(*) FROM `posts` WHERE `category` = ?");
    $chk->execute([$id]);
    $count = (int)$chk->fetchColumn();

    if ($count > 0) {
        errorResponse("{$count} post(s) still use this category, so it cannot be removed.", 400);
    }

    $del = $pdo->prepare("DELETE FROM `categories` WHERE `id` = ?");
    $del->execute([$id]);

    jsonResponse(['message' => 'Category deleted successfully']);
}

errorResponse('Method not allowed.', 405);
