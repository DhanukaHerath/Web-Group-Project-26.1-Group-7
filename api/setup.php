<?php
// setup.php – One-click automated database migrator and seeder
// Run via CLI: php api/setup.php or open http://localhost/scriptorium/api/setup.php in browser

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();
$sqlFile = dirname(__DIR__) . '/database.sql';

if (!file_exists($sqlFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => "SQL file not found at: {$sqlFile}"]);
    exit;
}

$sql = file_get_contents($sqlFile);

try {
    // Execute multiple statements
    $pdo->exec($sql);

    // Verify tables count
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'message' => 'Scriptorium database schema and seed data successfully initialized!',
        'database' => $dbName,
        'tables_created' => $tables,
        'admin_credentials' => [
            'email' => 'admin@scriptorium.lk',
            'password' => 'Admin@2026'
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Migration failed: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
