<?php
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Max-Age: 1"); //1000
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') die();

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    include ("../includes/db.php");
    $st = $db->prepare("SELECT value FROM settings
                        ORDER BY time DESC LIMIT 1;");
    $st->execute();
    $result = $st->fetch(PDO::FETCH_ASSOC);
    header("Content-type: application/json");
    echo $result['value'];
}
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    include ("../includes/db.php");
    $body = file_get_contents('php://input');
    if (json_decode($body) == null) {
        header(':', true, 400);
        die();
    }
    $db->prepare("INSERT INTO settings (time, value) VALUES (NOW(), ?);")->execute(array($body));
}