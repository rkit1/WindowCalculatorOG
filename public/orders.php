<?php
include_once "../includes/util.php";
include_once "../includes/db.php";
require_once '../vendor/autoload.php';
setupJSON();

function sendMessage($orderId){
    $mail = new PHPMailer;
    $to = 'me@rkit.pp.ru';
    $from = 'me@rkit.pp.ru';
    $dn = dirname($_SERVER['REQUEST_URI']);
    $calcRoot = "http://{$_SERVER['HTTP_HOST']}/{$dn}/";

    $mail->From = $from;
    $mail->FromName = 'Mailer';
    $mail->AddAddress($to);

    $mail->WordWrap = 50;
    $mail->IsHTML(true);

    $mail->Subject = 'Новый заказ в калькуляторе окон';
    $mail->Body    = "Принят заказ №<a href=\"{$calcRoot}/calculator.htm#/order/{$orderId}\">{$orderId}</a>";
    $mail->AltBody = "Принят заказ №{$orderId} {$calcRoot}/calculator.htm#/order/{$orderId}";

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
    //if (!sendMessage($result['orderId'])) e(500);
    echo json_encode($result);
}