<?php
class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $config = require __DIR__ . '/config.php';
            $db = $config['db'];

            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                $db['host'],
                $db['port'],
                $db['database'],
                $db['charset']
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            if (!empty($db['ssl_ca']) && file_exists($db['ssl_ca'])) {
                $options[PDO::MYSQL_ATTR_SSL_CA] = $db['ssl_ca'];
                if (!$db['ssl_verify']) {
                    $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
                }
            }

            try {
                self::$instance = new PDO($dsn, $db['username'], $db['password'], $options);
            } catch (PDOException $e) {

                throw new PDOException(
                    "Database connection failed to [{$db['host']}:{$db['port']}/{$db['database']}]: " . $e->getMessage(),
                    (int)$e->getCode()
                );
            }
        }

        return self::$instance;
    }

    public static function testConnection(): array {
        try {
            $pdo = self::getConnection();
            $stmt = $pdo->query('SELECT DATABASE() AS current_db, VERSION() AS mysql_version');
            $info = $stmt->fetch();
            return [
                'success' => true,
                'message' => 'Successfully connected to database',
                'details' => $info
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}

