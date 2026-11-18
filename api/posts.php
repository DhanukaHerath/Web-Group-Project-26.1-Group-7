<?php

require_once __DIR__ . '/helpers.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $postId = $_GET['id'] ?? null;

    if ($postId) {
        $stmt = $pdo->prepare("SELECT p.*, u.full_name, u.faculty, u.batch, u.avatar as author_avatar,
            (SELECT COUNT(*) FROM `likes` l WHERE l.post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM `comments` c WHERE c.post_id = p.id) as comment_count
            FROM `posts` p
            JOIN `users` u ON p.author_id = u.id
            WHERE p.id = ? LIMIT 1");
        $stmt->execute([$postId]);
        $post = $stmt->fetch();

        if (!$post) {
            errorResponse('Post not found.', 404);
        }

        $post['featured'] = (bool)$post['featured'];
        $post['like_count'] = (int)$post['like_count'];
        $post['comment_count'] = (int)$post['comment_count'];

        $currentUser = getCurrentUser($pdo);
        $post['has_liked'] = false;
        if ($currentUser) {
            $likeStmt = $pdo->prepare("SELECT 1 FROM `likes` WHERE `post_id` = ? AND `user_id` = ? LIMIT 1");
            $likeStmt->execute([$postId, $currentUser['id']]);
            $post['has_liked'] = (bool)$likeStmt->fetch();
        }

        $cStmt = $pdo->prepare("SELECT c.*, u.full_name, u.username, u.avatar as user_avatar
            FROM `comments` c
            JOIN `users` u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC");
        $cStmt->execute([$postId]);
        $comments = $cStmt->fetchAll();

        foreach ($comments as &$c) {
            if (!empty($c['user_avatar']) && is_string($c['user_avatar'])) {
                $c['user_avatar'] = json_decode($c['user_avatar'], true);
            }
        }
        $post['comments'] = $comments;

        jsonResponse($post);
    }

    $status = $_GET['status'] ?? 'approved';
    $category = $_GET['category'] ?? null;
    $authorId = $_GET['author_id'] ?? null;
    $featured = isset($_GET['featured']) ? (int)$_GET['featured'] : null;
    $sort = $_GET['sort'] ?? 'new';
    $q = trim($_GET['q'] ?? '');

    $where = [];
    $params = [];

    if ($status !== 'all') {
        $where[] = "p.status = ?";
        $params[] = $status;
    }

    if ($category && $category !== 'all') {
        $where[] = "p.category = ?";
        $params[] = $category;
    }

    if ($authorId) {
        $where[] = "p.author_id = ?";
        $params[] = $authorId;
    }

    if ($featured !== null) {
        $where[] = "p.featured = ?";
        $params[] = $featured;
    }

    if ($q !== '') {
        $where[] = "(p.title LIKE ? OR p.author_name LIKE ? OR u.full_name LIKE ?)";
        $wild = '%' . $q . '%';
        $params[] = $wild;
        $params[] = $wild;
        $params[] = $wild;
    }

    $whereSql = count($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    $orderSql = ($sort === 'liked')
        ? 'ORDER BY like_count DESC, p.created_at DESC'
        : 'ORDER BY p.created_at DESC';

    $sql = "SELECT p.*, u.full_name, u.faculty, u.batch, u.avatar as author_avatar,
        (SELECT COUNT(*) FROM `likes` l WHERE l.post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM `comments` c WHERE c.post_id = p.id) as comment_count
        FROM `posts` p
        JOIN `users` u ON p.author_id = u.id
        {$whereSql}
        {$orderSql}";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $posts = $stmt->fetchAll();

    foreach ($posts as &$p) {
        $p['featured'] = (bool)$p['featured'];
        $p['like_count'] = (int)$p['like_count'];
        $p['comment_count'] = (int)$p['comment_count'];
        $p['createdAt'] = (int)$p['created_at'];
        $p['authorId'] = $p['author_id'];
        $p['authorName'] = $p['author_name'];
        if (!empty($p['author_avatar']) && is_string($p['author_avatar'])) {
            $p['author_avatar'] = json_decode($p['author_avatar'], true);
        }
    }

    jsonResponse($posts);
}

errorResponse('Method not allowed.', 405);
