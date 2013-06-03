angular.module('Calc', []);
DefaultWindow = function(w){
    this.name = 'Новое окно';
    this.panesCount = 1;
    this.panes = [{type:'solid'},{type:'solid'},{type:'solid'}];
    return this;
}
DefaultWindow.prototype.setPanesCount = function (c){
    this.panesCount = c;
}
function CalcController($scope, $http) {
    $scope.currentWindow = new DefaultWindow();
    $scope.windows = [$scope.currentWindow];
    $scope.newWindow = function(){
        $scope.windows[$scope.windows.length] =
            $scope.currentWindow = new DefaultWindow($scope.currentWindow);
    }
    $scope.selectWindow = function(w){
        $scope.currentWindow = $scope.windows[w];
    }
}
