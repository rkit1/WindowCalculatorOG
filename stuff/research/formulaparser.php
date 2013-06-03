<pre>
<?php
require_once '../../vendor/autoload.php';
require_once '../../classes/ExcelFormulaProcessor.php';
$formula = '=SUM(C32:H32)';
$parser = new PHPExcel_Calculation_FormulaParser($formula);
$tokens = $parser->getTokens();
foreach($tokens as $t)
{
    echo ExcelFormulaProcessor::process($t);
}
echo "\n\n";
var_dump($tokens);