<?php
abstract class ExcelFormulaProcessor {

    static public function process($tok)
    {
        switch ($tok->getTokenType())
        {
            case PHPExcel_Calculation_FormulaToken::TOKEN_TYPE_SUBEXPRESSION:
                return $tok->getTokenSubType() == PHPExcel_Calculation_FormulaToken::TOKEN_SUBTYPE_START
                        ? '(' : ')';
                break;
            case PHPExcel_Calculation_FormulaToken::TOKEN_TYPE_FUNCTION:
                return $tok->getTokenSubType() == PHPExcel_Calculation_FormulaToken::TOKEN_SUBTYPE_START
                    ? "{$tok->getValue()}("
                    : ')';
                break;
            case PHPExcel_Calculation_FormulaToken::TOKEN_TYPE_OPERAND:
                switch($tok->getTokenSubType())
                {
                    case PHPExcel_Calculation_FormulaToken::TOKEN_SUBTYPE_RANGE:
                        return "range('{$tok->getValue()}')";
                    case PHPExcel_Calculation_FormulaToken::TOKEN_SUBTYPE_NUMBER:
                        return $tok->getValue();
                }
                break;
            case PHPExcel_Calculation_FormulaToken::TOKEN_TYPE_OPERATORINFIX:
                return ($tok->getValue());
                break;
        }
        ExcelFormulaProcessor::unexpectedToken($tok);
    }

    static public function unexpectedToken($tok)
    {
        return var_dump($tok);
    }
}