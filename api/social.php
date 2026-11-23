<?php
// social.php – Likes, threaded comments, and user follow relationships

require_once __DIR__ . '/helpers.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    if ($action === 'all') {
        $likes = $pdo->query("SELECT `post_id`, `user_id`, `created_at` FROM `likes`")->fetchAll();
        foreach ($likes as &$l) {
            $l['postId'] = $l['post_id'];
            $l['userId'] = $l['user_id'];
            $l['createdAt'] = (int)$l['created_at'];
        }

        $comments = $pdo->query("SELECT c.`id`, c.`post_id`, c.`user_id`, c.`text`, c.`created_at`, u.`full_name`, u.`username`, u.`avatar` as `user_avatar`
            FROM `comments` c
            JOIN `users` u ON c.`user_id` = u.`id`
            ORDER BY c.`created_at` ASC")->fetchAll();
        foreach ($comments as &$c) {
            $c['postId'] = $c['post_id'];
            $c['userId'] = $c['user_id'];
            $c['createdAt'] = (int)$c['created_at'];
            $c['fullName'] = $c['full_name'];
            if (!empty($c['user_avatar']) && is_string($c['user_avatar'])) {
                $c['user_avatar'] = json_decode($c['user_avatar'], true);
            }
        }

        $follows = $pdo->query("SELECT `follower_id`, `followee_id`, `created_at` FROM `follows`")->fetchAll();
        foreach ($follows as &$f) {
            $f['followerId'] = $f['follower_id'];
            $f['followeeId'] = $f['followee_id'];
            $f['createdAt'] = (int)$f['created_at'];
        }

        jsonResponse(['likes' => $likes, 'comments' => $comments, 'follows' => $follows]);
    }

    if ($action === 'comments') {
        $postId = $_GET['post_id'] ?? '';
        if (!$postId) errorResponse('Post ID is required.');

        $stmt = $pdo->prepare("SELECT c.*, u.full_name, u.username, u.avatar as user_avatar
            FROM `comments` c
            JOIN `users` u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC");
        $stmt->execute([$postId]);
        $comments = $stmt->fetchAll();

        foreach ($comments as &$c) {
            if (!empty($c['user_avatar']) && is_string($c['user_avatar'])) {
                $c['user_avatar'] = json_decode($c['user_avatar'], true);
            }
        }
        jsonResponse($comments);
    }

    errorResponse('Invalid action for GET.');
}

if ($method === 'POST') {
    $user = requireAuth($pdo);
    $body = getJsonBody();
    if (empty($action) && isset($body['action'])) {
        $action = $body['action'];
    }

    // Toggle like
    if ($action === 'like') {
        $postId = $body['post_id'] ?? ($_GET['post_id'] ?? '');
        if (!$postId) errorResponse('Post ID is required.');

        $chk = $pdo->prepare("SELECT 1 FROM `likes` WHERE `post_id` = ? AND `user_id` = ? LIMIT 1");
        $chk->execute([$postId, $user['id']]);
        $exists = $chk->fetch();

        if ($exists) {
            $del = $pdo->prepare("DELETE FROM `likes` WHERE `post_id` = ? AND `user_id` = ?");
            $del->execute([$postId, $user['id']]);
            $isLiked = false;
        } else {
            $ins = $pdo->prepare("INSERT INTO `likes` (`post_id`, `user_id`, `created_at`) VALUES (?, ?, ?)");
            $ins->execute([$postId, $user['id'], nowMs()]);
            $isLiked = true;
        }

        // Count current likes
        $cntStmt = $pdo->prepare("SELECT COUNT(*) FROM `likes` WHERE `post_id` = ?");
        $cntStmt->execute([$postId]);
        $count = (int)$cntStmt->fetchColumn();

        jsonResponse(['liked' => $isLiked, 'likeCount' => $count]);
    }

    // Add comment
    if ($action === 'comment') {
        $postId = $body['post_id'] ?? '';
        $text = trim($body['text'] ?? '');

        if (!$postId) errorResponse('Post ID is required.');
        if (!$text) errorResponse('Please write a comment first.');
        if (strlen($text) > 300) errorResponse('Comments can be up to 300 characters.');

        $postStmt = $pdo->prepare("SELECT * FROM `posts` WHERE `id` = ? LIMIT 1");
        $postStmt->execute([$postId]);
        $post = $postStmt->fetch();
        if (!$post) errorResponse('Post not found.', 404);

        $commentId = generateId('c_');
        $now = nowMs();

        $ins = $pdo->prepare("INSERT INTO `comments` (`id`, `post_id`, `user_id`, `text`, `created_at`) VALUES (?, ?, ?, ?, ?)");
        $ins->execute([$commentId, $postId, $user['id'], $text, $now]);

        // Send notification to author if comment is by someone else
        if ($post['author_id'] !== $user['id']) {
            $senderName = $user['fullName'] ?: $user['username'];
            $shortText = mb_substr($text, 0, 80);
            $msg = "{$senderName} commented on “{$post['title']}”: {$shortText}";
            $notifId = generateId('n_');
            $nStmt = $pdo->prepare("INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `post_id`, `created_at`, `is_read`) VALUES (?, ?, 'info', 'New comment', ?, ?, ?, 0)");
            $nStmt->execute([$notifId, $post['author_id'], $msg, $postId, $now]);
        }

        jsonResponse([
            'message' => 'Comment added',
            'comment' => [
                'id' => $commentId,
                'post_id' => $postId,
                'user_id' => $user['id'],
                'text' => $text,
                'created_at' => $now,
                'user' => $user
            ]
        ], 201);
    }

    // Toggle follow
    if ($action === 'follow') {
        $targetUserId = $body['user_id'] ?? ($_GET['user_id'] ?? '');
        if (!$targetUserId) errorResponse('Target user ID is required.');
        if ($targetUserId === $user['id']) errorResponse("You cannot follow yourself.");

        $targetStmt = $pdo->prepare("SELECT * FROM `users` WHERE `id` = ? LIMIT 1");
        $targetStmt->execute([$targetUserId]);
        $targetUser = $targetStmt->fetch();
        if (!$targetUser) errorResponse('User not found.', 404);

        $chk = $pdo->prepare("SELECT 1 FROM `follows` WHERE `follower_id` = ? AND `followee_id` = ? LIMIT 1");
        $chk->execute([$user['id'], $targetUserId]);
        $isFollowing = (bool)$chk->fetch();

        if ($isFollowing) {
            $del = $pdo->prepare("DELETE FROM `follows` WHERE `follower_id` = ? AND `followee_id` = ?");
            $del->execute([$user['id'], $targetUserId]);
            $nowFollowing = false;
        } else {
            $now = nowMs();
            $ins = $pdo->prepare("INSERT INTO `follows` (`follower_id`, `followee_id`, `created_at`) VALUES (?, ?, ?)");
            $ins->execute([$user['id'], $targetUserId, $now]);
            $nowFollowing = true;

            // Notify target user
            $senderName = $user['fullName'] ?: $user['username'];
            $notifId = generateId('n_');
            $nStmt = $pdo->prepare("INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `post_id`, `created_at`, `is_read`) VALUES (?, ?, 'info', 'New follower', ?, NULL, ?, 0)");
            $nStmt->execute([$notifId, $targetUserId, "{$senderName} started following you.", $now]);
        }

        // Return updated counts
        $fCountStmt = $pdo->prepare("SELECT COUNT(*) FROM `follows` WHERE `followee_id` = ?");
        $fCountStmt->execute([$targetUserId]);
        $followerCount = (int)$fCountStmt->fetchColumn();

        jsonResponse(['following' => $nowFollowing, 'followerCount' => $followerCount]);
    }

    // Delete comment (POST fallback for hosts that block DELETE)
    if ($action === 'delete_comment') {
        $commentId = $body['id'] ?? ($_GET['id'] ?? '');
        if (!$commentId) errorResponse('Comment ID is required.');
        $cStmt = $pdo->prepare("SELECT * FROM `comments` WHERE `id` = ? LIMIT 1");
        $cStmt->execute([$commentId]);
        $comment = $cStmt->fetch();
        if (!$comment) errorResponse('Comment not found.', 404);
        if ($comment['user_id'] !== $user['id'] && $user['role'] !== 'admin') {
            errorResponse('Not authorized to delete this comment.', 403);
        }
        $del = $pdo->prepare("DELETE FROM `comments` WHERE `id` = ?");
        $del->execute([$commentId]);
        jsonResponse(['message' => 'Comment deleted successfully']);
    }

    errorResponse('Invalid action for POST.');
}

if ($method === 'DELETE') {
    $user = requireAuth($pdo);
    $commentId = $_GET['id'] ?? '';
    if (!$commentId) errorResponse('Comment ID is required.');

    $cStmt = $pdo->prepare("SELECT * FROM `comments` WHERE `id` = ? LIMIT 1");
    $cStmt->execute([$commentId]);
    $comment = $cStmt->fetch();

    if (!$comment) errorResponse('Comment not found.', 404);

    // Only comment author or admin can delete
    if ($comment['user_id'] !== $user['id'] && $user['role'] !== 'admin') {
        errorResponse('Not authorized to delete this comment.', 403);
    }

    $del = $pdo->prepare("DELETE FROM `comments` WHERE `id` = ?");
    $del->execute([$commentId]);

    jsonResponse(['message' => 'Comment deleted successfully']);
}

errorResponse('Method not allowed.', 405);
