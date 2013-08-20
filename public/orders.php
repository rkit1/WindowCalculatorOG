<?php
include_once "../includes/util.php";
include_once "../includes/db.php";
require_once '../vendor/autoload.php';
setupJSON();

function sendMessage($orderId){
    $mail = new PHPMailer;
    $to = 'me@rkit.pp.ru';
    $from = 'me@rkit.pp.ru';
    $calcRoot = '';

    $mail->From = $from;
    $mail->FromName = 'Mailer';
    $mail->AddAddress($to);

    $mail->WordWrap = 50;
    $mail->IsHTML(true);

    $mail->Subject = 'Новый заказ';
    $mail->Body    = "Принят заказ №<a href=\"\">{$orderId}</a>";
    $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

    return $mail->Send();
};
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    checkAuth($db);
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