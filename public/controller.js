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
    this.heightOfTPart = 0 // C13 в калькуляторе не используется
    this.shtulpLenght = 0; // C11 в калькуляторе не используется
    return this;
};
Window.prototype.getLaminateK = function() {
    // 45 из B21, (1+C21/100)/1000 из C23. Вынесено в отдельную функцию из-за частоты употребления
    return (1 + (this.laminate * 45 / 100))/1000;
};
Window.prototype.getFramePrice = function() {
    // ((C8+C9)*2*9*(1+C21/100)/1000 из C23
    return (this.width + this.height) * 18 * this.getLaminateK()
};
Window.prototype.getImpostsLength = function() {
    return this.height * (this.getPanesCount() - 1)
};
Window.prototype.getImpostsPrice = function() {
    // C10*14*(1+C21/100)/1000 из C23
    return this.getImpostsLength() * 14 * this.getLaminateK();
};
Window.prototype.getShtulpPrice = function() {
    // C11*18*(1+C21/100)/1000 из C23
    return this.shtulpLenght * 18 * this.geLaminateK();
};
Window.prototype.getStvorkiAndFramugiWidth = function() {
    // C12
    var w = 0;
    var panes = this.getActivePanes();
    for (var i in panes)
        if (panes[i].type = 'r' || panes[i].type == 'ro') w += pane.width;
};
Window.prototype.getPanesOfType = function(type) {
    var panes = this.getActivePanes();
    var out = [];
    for (var i in panes) if (panes[i].type = type) out[out.length] = panes[i];
    return out;
};
Window.prototype.getStvorkiAndFramugiPrice = function(){
    // (C12*2+((C14+C15)*(C9-C13)*2+C16*C13*2)*9*(1+C21/100)/1000+C14*70+C15*85+C16*45) из C23
    return ( this.getStvorkiAndFramugiWidth() * 2 + (this.getPanesOfType('rot')
           + this.getPanesOfType('rotdrop'))/(this.height - this.heightOfTPart) * 2
           + this.numOfFramuges * this.heightOfTPart * 2 )
           * 9
           * ( this.getLaminateK()
             + this.getPanesOfType('rot') * 70
             + this.getPanesOfType('rotdrop') * 85
             +
             )


};
Window.prototype.getGlassPrice = function() {
    // 47*(C8*C9)/1000000 из C23
    return 47 * this.width * this.height / 10^6
};
Window.prototype.getSizeError = function() {
    var aPanes = this.getActivePanes();
    var w = this.width;
    for (var p in aPanes)
        w -= aPanes[p].width;
    return w;
};
Window.prototype.getPanesCount = function(){
    switch (this.type)
    {
        case '1p': return 1;
        case '2p': return 2;
        case '3p': return 3;
    }
    return 1;
};
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
    }
    if ($cookies.windows != null){
        $scope.windows = $cookies.windows;
        $scope.currentWindow = $scope.windows[0];
    }
    else $scope.reset();


}
