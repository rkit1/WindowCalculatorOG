<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Max-Age: 1000");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-type: application/json");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') die();
function e($e){
    header(':', true, $e);
    die();
}

include ("../includes/db.php");
if (!isset($_COOKIE['calcAuth'])) e(403);
$st = $db->prepare("SELECT * FROM sessions WHERE session = ?;");
if (!$st->execute($_COOKIE['calcAuth'])) e(500);
if (!$st->rowCount() < 1) e(403);

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    if(isset($_GET['list'])) {
        $st = $db->prepare("SELECT id, DATE_FORMAT(time, '%d.%m.%Y %H:%i') as time
                            FROM orders ORDER BY UNIX_TIMESTAMP(time) DESC LIMIT 50;");
        $st->execute();
        $result = $st->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($result);
    } else {
        $id = $_GET['id'];
        if (!is_numeric($id)) e(404);
        $st = $db->prepare("SELECT * FROM orders WHERE id = ?;");
        if(!$st->execute(array($id))) e(404);
        $result = $st->fetch(PDO::FETCH_ASSOC);
        echo ($result['value']);
    }
}
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $body = file_get_contents('php://input');
    $st = $db->prepare("INSERT INTO orders (time, value) VALUES (NOW(), ?);");
    $st->execute(array($body));
    $result = $db->query("SELECT LAST_INSERT_ID() as id;")->fetch(PDO::FETCH_ASSOC);
    echo json_encode($result);
}