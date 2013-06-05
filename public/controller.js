angular.module('Calc', ['ngCookies']);
Window = function(w){
    //this.name = 'Новое окно';
    this.type = '1p';
    this.panes = [{type:'solid', width:50},{type:'solid', width:50},{type:'solid', width:50}];
    //types: 'solid', 'rot', 'rotdrop'
    this.width = 120;
    this.height = 100;
    this.steklopaket = 1;
    this.laminate = 0;
    this.profile = 1;
    return this;
};
Window.prototype.getPanesCount = function(){
    switch (this.type)
    {
        case '1p': return 1;
        case '2p': return 2;
        case '3p': return 3;
    }
    return 1;
}
Window.prototype.getActivePanes = function(){
    if (this.type == 'door') return [];
    return this.panes.slice(0, this.getPanesCount());
};


function CalcController($scope, $cookies) {
    $scope.newWindow = function(){
        $scope.windows[$scope.windows.length] =
            $scope.currentWindow = new Window($scope.currentWindow);
    };
    $scope.selectWindow = function(w){
        $scope.currentWindow = $scope.windows[w];
    };
    //FIXME
    $scope.removeWindow = function(w) {
        delete $scope.windows[$scope.windows.indexOf(w)];
        if ($scope.windows.length < 1) {
            $scope.currentWindow = new Window();
            $scope.windows = [$scope.currentWindow];
        }
    };
    $scope.reset = function(){
        $scope.currentWindow = new Window();
        $scope.windows = [$scope.currentWindow];
    };
    if ($cookies.windows != null){
        $scope.windows = $cookies.windows;
        $scope.currentWindow = $scope.windows[0];
    }
    else $scope.reset();


}
