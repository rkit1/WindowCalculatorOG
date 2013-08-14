<?php
$password = "21312312";
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Max-Age: 1000");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-type: application/json");
function e($c){
    header(':', true, $c);
    die();
}
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') die();
else if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    include ("../includes/db.php");
    $body = file_get_contents('php://input');
    $r = json_decode($body);
    if ($r && isset($r->password)) {
        /** @noinspection PhpUndefinedFieldInspection */
        if ($r->password == $password) {
            $randomStr = uniqid('', true);
            $st = $db->prepare("INSERT INTO sessions VALUES (?);");
            if ($st->execute(array($randomStr)) && $st->rowCount() > 0) {
                setcookie("calcAuth", $randomStr);
                echo json_encode(array('result' => 'ok'));
                die();
            } else e(500);
        } else {
            echo json_encode(array('result' => 'wrongPass'));
            die();
        }
    } else e(400);
} else e(404);

/*
else if ($_SERVER['REQUEST_METHOD'] == 'GET' && isset($_COOKIE['calcAuth'])) {
    include ("../includes/db.php");
    $st = $db->prepare("SELECT * FROM sessions WHERE session = ?;");
    if (!$st->execute($_COOKIE['calcAuth']) || $st->rowCount() < 1) e(404);
}