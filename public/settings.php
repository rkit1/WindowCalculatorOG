<?php
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Max-Age: 1"); //1000
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') die();
function e($e){
    header(':', true, $e);
    die();
}
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    if(isset($_GET['list'])) {
        include ("../includes/db.php");
        if (!isset($_COOKIE['calcAuth'])) e(403);
        $st = $db->prepare("SELECT * FROM sessions WHERE session = ?;");
        if (!$st->execute($_COOKIE['calcAuth'])) e(500);
        if (!$st->rowCount() < 1) e(403);
        $st = $db->prepare("SELECT id, DATE_FORMAT(time, '%d.%m.%Y %H:%i:%s') as time FROM settings
                            ORDER BY time DESC LIMIT 50;");
        $st->execute();
        $result = $st->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($result);
    } else {
        include ("../includes/db.php");
        if (isset($_GET['id'])) {
            $st = $db->prepare("SELECT value FROM settings
                                WHERE id=?;");
            $st->execute(array($_GET['id']));
        } else {
            $st = $db->prepare("SELECT value FROM settings
                                ORDER BY time DESC LIMIT 1;");
            $st->execute();
        }
        if ($result = $st->fetch(PDO::FETCH_ASSOC)){
            header("Content-type: application/json");
            echo $result['value'];
        } else {
            header(':', true, 404);
            die();
        }
    }
}
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    include ("../includes/db.php");
    if (!isset($_COOKIE['calcAuth'])) e(403);
    $st = $db->prepare("SELECT * FROM sessions WHERE session = ?;");
    if (!$st->execute($_COOKIE['calcAuth'])) e(500);
    if (!$st->rowCount() < 1) e(403);
    $body = file_get_contents('php://input');
    if (json_decode($body) == null) {
        header(':', true, 400);
        die();
    }
    $db->prepare("INSERT INTO settings (time, value) VALUES (NOW(), ?);")->execute(array($body));
}