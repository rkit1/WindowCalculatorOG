<?php
require_once '../classes/Controller.php';
if (isset($_GET['action'])){
    $action = $_GET['action'];
    Controller::$_GET['action']();
}

