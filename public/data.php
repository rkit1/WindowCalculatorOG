<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Max-Age: 1"); //1000
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') die();

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    header("Content-type: application/json");
    echo file_get_contents("options.json");
}
//todo