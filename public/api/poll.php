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

function refreshDb()
{
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
}

$dbFile = './database.db';

// // Create the PDO instance
$db = new PDO('sqlite:' . $dbFile);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the raw POST data
    $data = file_get_contents('php://input');

    // Decode the JSON data
    $json = json_decode($data, true);

    // Handle signal
    $from = $json['from'];
    $to = $json['to'];
    $type = $json['type'];
    $data = $json['data'];

    // Insert signal into database
    try {
        $stmt = $db->prepare("INSERT INTO signals (from_user, to_room, type, data, ts) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$from, $to, $type, $data, time()]);
    } catch (Exception $e) {
        $code = $e->getCode();
        if ($code === "HY000") {
            // echo 'table not found, refreshing';
            refreshDb();
        } else {
            // echo "" . $e->getCode() . "";
        }
    }

    // delete any signals older than 10 seconds
    $time = time() - 10;
    $stmt = $db->prepare("DELETE FROM signals WHERE ts < ?");
    $stmt->execute([$time]);

    echo '{ok:"ok"}';
} else {
    // Handle polling
    $to = $_GET['to'];
    $from = $_GET['from'];

    // Check for signals
    $start = time();

    $counter = 0;
    while (true) {
        try {
            $stmt = $db->prepare("SELECT * FROM signals WHERE to_room = ? AND not from_user = ? LIMIT 1");
            $stmt->execute([$to, $from]);
            $signal = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $code = $e->getCode();
            if ($code === "HY000") {
                // echo 'table not found, refreshing';
                refreshDb();
            } else {
                // echo "" . $e->getCode() . "";
            }
        }

        if ($signal) {
            // Delete signal from database
            $stmt = $db->prepare("DELETE FROM signals WHERE id = ?");
            $stmt->execute([$signal['id']]);

            // Return signal
            echo json_encode($signal);
            break;
        }

        // If 3 seconds have passed, break the loop
        if (time() - $start >= 2) {
            echo '{}';
            break;
        }

        // If there's no data, sleep for a short period and then continue the loop
        usleep(100000);  // Sleep for 100 milliseconds
        // sleep(1);

        // echo ++$counter.' - ';
    }
}