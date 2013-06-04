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
    this.framugi = 0; // C16. Не используется
    this.heightOfTPart = 0; // C13. Не используется
    this.shtulpLenght = 0; // C11. Не используется
    this.raise = 20; // C30 FIXME
    this.sandwichHeight = 0; // C18. Не используется
    this.sandvichColorCoefficient = 0; // C19. Не используется
    this.numOfFramuges = 0; // С16. Не используется
    return this;
};
Window.prototype.getPanesOfType = function(type) {
    var panes = this.getActivePanes();
    var out = [];
    for (var i in panes) if (panes[i].type = type) out[out.length] = panes[i];
    return out;
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
}
Window.prototype.getActivePanes = function(){
    if (this.type == 'door') return [];
    return this.panes.slice(0, this.getPanesCount());
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
    return this.shtulpLenght * 18 * this.getLaminateK();
};
Window.prototype.getStvorkiAndFramugiWidth = function() {
    // C12
    var w = 0;
    var panes = this.getActivePanes();
    for (var i in panes)
        if (panes[i].type == 'r' || panes[i].type == 'ro') w += panes[i].width;
    return w;
};
Window.prototype.getStvorkiAndFramugiPrice = function(){
    // (C12*2+((C14+C15)*(C9-C13)*2+C16*C13*2)*9*(1+C21/100)/1000+C14*70+C15*85+C16*45) из C23
    return ( this.getStvorkiAndFramugiWidth() * 2
           + (this.getPanesOfType('rot').length + this.getPanesOfType('rotdrop').length)/(this.height - this.heightOfTPart) * 2
           + this.numOfFramuges * this.heightOfTPart * 2
           )
         /* * 9
         * ( this.getLaminateK()
           + this.getPanesOfType('rot') * 70
           + this.getPanesOfType('rotdrop') * 85
           + this.framugi * 45 );
           */
};
Window.prototype.getAreaRaise = function(){
    // (C8*C9)*C17/1000000 из C23
    return (this.width + this.height) / 1000000 * this.raise;
};
Window.prototype.getSandwichPrice = function(){
    // C8*C18*C19 из C23
    return this.width * this.sandwichHeight * this.sandvichColorCoefficient;
};
Window.prototype.getGlassPrice = function() {
    // 47*(C8*C9)/1000000 из C23
    return 47 * (this.width * this.height) / 1000000;
};
Window.prototype.getTotalSelfPrice = function(){
    // C23
    return this.getFramePrice() + this.getGlassPrice() + this.getImpostsPrice() + this.getShtulpPrice()
           + this.getStvorkiAndFramugiPrice() + this.getAreaRaise() + this.getSandwichPrice();
};
Window.prototype.getTotalPrice = function(){
    // C22
    return Math.ceil(this.getTotalSelfPrice() * 1.3);
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
