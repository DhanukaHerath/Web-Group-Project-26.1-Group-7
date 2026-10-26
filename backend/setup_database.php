<?php
$isCli = (php_sapi_name() === 'cli');

if (!$isCli) {
    header('Content-Type: text/plain; charset=UTF-8');
}

echo "========================================================\n";
echo " NSBM ArtCraft - Database Migration & Seeder\n";
echo "========================================================\n\n";

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/db.php';

$config = require __DIR__ . '/config/config.php';
$db = $config['db'];

echo "Connecting to MySQL server at [{$db['host']}:{$db['port']}]...\n";

try {

    $dsnNoDb = sprintf('mysql:host=%s;port=%s;charset=%s', $db['host'], $db['port'], $db['charset']);
    $pdoRoot = new PDO($dsnNoDb, $db['username'], $db['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $pdoRoot->exec("CREATE DATABASE IF NOT EXISTS `{$db['database']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    echo "✔ Database '{$db['database']}' exists and is ready.\n";

    $pdo = Database::getConnection();

    $schemaFile = __DIR__ . '/../../schema_mysql.sql';
    if (!file_exists($schemaFile)) {
        throw new Exception("schema_mysql.sql not found at: $schemaFile");
    }

    echo "Executing schema_mysql.sql...\n";
    $sqlContent = file_get_contents($schemaFile);

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    $queries = preg_split('/;\s*[\r\n]+/', $sqlContent);
    foreach ($queries as $q) {
        $q = trim($q);
        if ($q !== '' && !str_starts_with($q, '--')) {
            $pdo->exec($q);
        }
    }
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
    echo "✔ All tables, foreign keys, and indexes created successfully.\n\n";

    echo "Seeding default accounts...\n";

    $adminHash = password_hash('Admin@123', PASSWORD_BCRYPT);
    $studentHash = password_hash('Student@123', PASSWORD_BCRYPT);

    $adminStmt = $pdo->prepare('
        INSERT INTO users (username, email, password_hash, full_name, role, bio)
        VALUES (?, ?, ?, ?, "admin", ?)
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name)
    ');
    $adminStmt->execute([
        'admin_artcraft',
        'admin@nsbm.ac.lk',
        $adminHash,
        'NSBM ArtCraft Administrator',
        'Official curator and administrator for NSBM ArtCraft showcase portal.'
    ]);
    $adminId = (int)$pdo->query("SELECT id FROM users WHERE email = 'admin@nsbm.ac.lk'")->fetchColumn();

    $studentStmt = $pdo->prepare('
        INSERT INTO users (username, email, password_hash, full_name, role, bio)
        VALUES (?, ?, ?, ?, "student", ?)
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name)
    ');
    $studentStmt->execute([
        'kavindu_art',
        'kavindu@students.nsbm.ac.lk',
        $studentHash,
        'Kavindu Perera',
        'Visual arts student passionate about canvas paintings, photography and architectural sketches.'
    ]);
    $student1Id = (int)$pdo->query("SELECT id FROM users WHERE email = 'kavindu@students.nsbm.ac.lk'")->fetchColumn();

    $studentStmt->execute([
        'amaya_crafts',
        'amaya@students.nsbm.ac.lk',
        $studentHash,
        'Amaya Jayawardena',
        'Poetry writer and traditional woodcraft artisan at NSBM Faculty of Computing.'
    ]);
    $student2Id = (int)$pdo->query("SELECT id FROM users WHERE email = 'amaya@students.nsbm.ac.lk'")->fetchColumn();

    echo "✔ Admin account: admin@nsbm.ac.lk / Admin@123\n";
    echo "✔ Student account 1: kavindu@students.nsbm.ac.lk / Student@123\n";
    echo "✔ Student account 2: amaya@students.nsbm.ac.lk / Student@123\n\n";

    $workCount = (int)$pdo->query('SELECT COUNT(*) FROM creative_works')->fetchColumn();
    if ($workCount === 0) {
        echo "Seeding showcase creative works...\n";

        $cats = $pdo->query('SELECT id, name FROM categories')->fetchAll(PDO::FETCH_KEY_PAIR);
        $getCatId = fn($name) => array_search($name, $cats) ?: 1;

        $sampleWorks = [
            [
                'user_id'     => $student1Id,
                'category_id' => $getCatId('Painting'),
                'title'       => 'Symphony of Sunset Colors',
                'description' => 'Acrylic study exploring the golden hour light reflections upon dynamic flowing waters.',
                'image_url'   => 'images/art1.jpg',
                'body_text'   => null,
                'word_count'  => 0,
                'is_approved' => 1
            ],
            [
                'user_id'     => $student1Id,
                'category_id' => $getCatId('Hand-drawn Art'),
                'title'       => 'Urban Silhouette & Heritage',
                'description' => 'Detailed ink and charcoal drawing depicting ancient architectural arches and contemporary lines.',
                'image_url'   => 'images/art2.jpg',
                'body_text'   => null,
                'word_count'  => 0,
                'is_approved' => 1
            ],
            [
                'user_id'     => $student2Id,
                'category_id' => $getCatId('Photography'),
                'title'       => 'Mist Across NSBM Green Quad',
                'description' => '35mm focal shot capturing morning dew and tranquility along the university faculty pavilions.',
                'image_url'   => 'images/art3.jpg',
                'body_text'   => null,
                'word_count'  => 0,
                'is_approved' => 1
            ],
            [
                'user_id'     => $student1Id,
                'category_id' => $getCatId('Handcraft'),
                'title'       => 'Geometric Clay & Wire Sculpture',
                'description' => 'Handcrafted ceramic base with kinetic brass wire balance elements.',
                'image_url'   => 'images/art4.jpg',
                'body_text'   => null,
                'word_count'  => 0,
                'is_approved' => 1
            ],
            [
                'user_id'     => $student2Id,
                'category_id' => $getCatId('Poetry'),
                'title'       => 'Echoes of the Green Campus',
                'description' => 'A lyrical ode to morning walks through the faculty grounds and quiet library corners.',
                'image_url'   => 'images/art5.jpg',
                'body_text'   => "When morning mists ascend the green,\nA quiet calm wraps all between\nThe concrete spire and water pool,\nWhere young minds wander, sharp and cool.\n\nIn every brushstroke, line and verse,\nA hundred thoughts and dreams immerse;\nArt knows no bound, no strict decree,\nFor here the soul is truly free.",
                'word_count'  => 56,
                'is_approved' => 1
            ],
            [
                'user_id'     => $student1Id,
                'category_id' => $getCatId('Painting'),
                'title'       => 'Liquid Aurora',
                'description' => 'Abstract pigment blend rendered with vibrant teal, crimson, and deep ultramarine swirls.',
                'image_url'   => 'images/art6.png',
                'body_text'   => null,
                'word_count'  => 0,
                'is_approved' => 1
            ]
        ];

        $insWork = $pdo->prepare('
            INSERT INTO creative_works
                (user_id, category_id, title, description, image_url, thumbnail_url, body_text, word_count, is_approved, approved_at)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        ');

        foreach ($sampleWorks as $w) {
            $insWork->execute([
                $w['user_id'],
                $w['category_id'],
                $w['title'],
                $w['description'],
                $w['image_url'],
                $w['image_url'],
                $w['body_text'],
                $w['word_count']
            ]);
            $insertedWorkId = (int)$pdo->lastInsertId();

            $pdo->exec("INSERT IGNORE INTO likes (user_id, work_id) VALUES ($adminId, $insertedWorkId)");
            $pdo->exec("INSERT IGNORE INTO ratings (user_id, work_id, rating) VALUES ($adminId, $insertedWorkId, 5)");
        }
        echo "✔ Seeded sample creative works with likes and ratings.\n";
    }

    $eventCount = (int)$pdo->query('SELECT COUNT(*) FROM events')->fetchColumn();
    if ($eventCount === 0) {
        $insEvt = $pdo->prepare('
            INSERT INTO events (title, description, start_date, end_date, location, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $insEvt->execute([
            'NSBM Annual Creative Arts Gala 2026',
            'Grand exhibition showcasing student paintings, sculptures, literary anthologies, and digital installations at the NSBM Student Center.',
            date('Y-m-d', strtotime('+7 days')),
            date('Y-m-d', strtotime('+10 days')),
            'NSBM Auditorium & Gallery Hall, Pitipana, Homagama',
            $adminId
        ]);
        echo "✔ Seeded sample university exhibition event.\n";
    }

    echo "\n========================================================\n";
    echo " Database setup complete and verified!\n";
    echo "========================================================\n";

} catch (\Throwable $e) {
    echo "\n[ERROR]: " . $e->getMessage() . "\n";
    exit(1);
}

