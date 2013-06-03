<?php
require_once '../vendor/autoload.php';
abstract class Controller {
    static function main()
    {
        throw new Exception('Not implemented');
    }

    static function upload()
    {
        if (isset($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name']))
        {
            $objPHPExcel = PHPExcel_IOFactory::load($_FILES['file']['tmp_name']);
            $objPHPExcel->setActiveSheetIndex(0);

            $worksheet = $objPHPExcel->getActiveSheet();
            $highestRow         = $worksheet->getHighestRow();
            $highestColumn      = PHPExcel_Cell::columnIndexFromString($worksheet->getHighestColumn());

            echo '<pre>';
            for ($row = 1; $row <= $highestRow; ++ $row) {
                for ($col = 0; $col < $highestColumn; ++ $col) {
                    $cell = $worksheet->getCellByColumnAndRow($col, $row);
                    $val = $cell->getValue();
                    if ($val != null) var_dump($val);
                }
            }
        }
        else throw new Exception('Not implemented upload error');
    }
}