<?php
// TO RUN SERVER 
// c:\php\php.exe -S localhost:8001 

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    // It's a preflight request, respond appropriately
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}

session_start();

$dbFile = './database.db';

// Create the database file if it doesn't exist
if (!file_exists($dbFile)) {
    touch($dbFile);
}

// Create the PDO instance
$db = new PDO('sqlite:' . $dbFile);

try {
    // Create the signals table if it doesn't exist
    $db->exec("
        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY,
            from_user TEXT NOT NULL,
            to_room TEXT NOT NULL,
            type TEXT NOT NULL,
            data TEXT NOT NULL,
            ts NUMBER NOT NULL
        )
    ");
    // print("verified DB");
} catch (PDOException $e) {
    echo 'Connection failed: ' . $e->getMessage();
}