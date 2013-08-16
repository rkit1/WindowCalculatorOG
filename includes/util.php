<?php
/**
 * @param $e Int
 */
function e($e){
    header(':', true, $e);
    die();
}

function setupJSON(){
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
    header("Access-Control-Max-Age: 1000");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Content-type: application/json");
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') die();
}

/**
 * @param $db PDO
 */
function checkAuth($db){
    if (!isset($_COOKIE['calcAuth'])) e(403);
    $st = $db->prepare("SELECT * FROM sessions WHERE session = ?;");
    if (!$st->rowCount() < 1) e(403);
}