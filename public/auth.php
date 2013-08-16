<?php
$password = "21312312";
include ("../includes/util.php");
include ("../includes/db.php");
setupJSON();
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    include ("../includes/db.php");
    $body = file_get_contents('php://input');
    $r = json_decode($body);
    if ($r && isset($r->password)) {
        /** @noinspection PhpUndefinedFieldInspection */
        if ($r->password == $password) {
            $randomStr = md5(uniqid('', true));
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
} else if ($_SERVER['REQUEST_METHOD'] == 'GET' && isset($_GET['logout']) && isset($_COOKIE['calcAuth'])){
    include ("../includes/db.php");
    $st = $db->prepare("DELETE FROM sessions WHERE session = ?;");
    $st->execute(array($_COOKIE['calcAuth']));
} else e(400);