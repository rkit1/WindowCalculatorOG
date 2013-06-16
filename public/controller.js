
Window = function(w){
    //this.name = 'Новое окно';
    this.type = '1p';
    // 1p, 2p, 3p, door
    this.panes = [{type:'solid', width:50},{type:'solid', width:50},{type:'solid', width:50}];
    //types: 'solid', 'rot', 'rotdrop'
    this.width = 120;
    this.height = 100;
    this.steklopaket = 1;
    this.laminate = 0;
    this.profile = 1;
    this.quantity = 1;
    return this;
};
PerWindowTable = function(w){

    // Ширина рамы
    this.r8 = function() {
        return w.width;
    };

    // Высота рамы
    this.r9 = function() {
        return w.height;
    };

    // Общая длина импостов
    this.r10 = function() {
        return (w.getPanesCount() - 1) * this.r9();
    };

    // Общая длина штульпов. Не используется.
    this.r11 = function() {
        return 0;
    };

    // Общая ширина створок и фрамуг. Фрамуги не учитываются.
    this.r12 = function() {
        var panes = w.getActivePanes();
        var r = 0;
        for (i in panes) {
            pane = panes[i];
            if (pane.type == 'rot' || pane.type == 'rotdrop') r += pane.width;
        }
        return r;
    };

    // Высота фрамуги или глухой части Т-обр. окна. Не ипользуется.
    this.r13 = function() {
        return 0;
    };

    // Количество поворотных створок
    this.r14 = function() {
        var panes =  w.getActivePanes();
        var c = 0;
        for (i in panes)
            if (panes[i].type == 'rot') c++;
        return c;
    };

    // Количество поворотно-откидных створок
    this.r15 = function() {
        var panes =  w.getActivePanes();
        var c = 0;
        for (i in panes)
            if (panes[i].type == 'rotdrop') c++;
        return c;
    };

    // Количество фрамуг
    this.r16 = function() {
        return 0;
    };

    // Надбавка за с/п (по прайс-листу). FIXME разобраться с реальным числом.
    this.r17 = function() {
        return 20;
    };

    // Сэндвич (высота до импоста). Не используется.
    this.r18 = function() {
        return 0;
    };

    // Цвет сэндвича  (б/б - 50,  б/ц - 70,  ц/ц - 130). Не используется.
    this.r19 = function() {
        return 0;
    };

    // Арка (глухая - 40, распашная - 80). Не используется.
    this.r20 = function() {
        return 0;
    };

    // Ламинация (одна сторона - 45, две -  90)
    this.r21 = function() {
        return w.laminate * 45;
    };

    // Стоимость
    this.r22 = function() {
        return this.r23() * 1.3;
    };

    // Стоимость (скрытая колонка).
    this.r23 = function() {
        if (w.type=='door') return ((this.r8()+this.r9())*2*9*(1+this.r21()/100)/1000+47*(this.r8()*this.r9())/1000000+this.r10()*14*(1+this.r21()/100)/1000+this.r11()*18*(1+this.r21()/100)/1000+(this.r12()*2+(this.r14()+this.r15())*(this.r9()-this.r13())*2+this.r16()*this.r13()*2)*9*(1+this.r21()/100)/1000+this.r14()*70+this.r15()*85+this.r16()*45)+(this.r8()*this.r9())*this.r17()/1000000+this.r8()*this.r18()*this.r19()/1000000-this.r8()*this.r18()*(47+this.r17())/1000000+this.r8()/1000*this.r20();
        else return ((this.r8()+this.r9())*2*9*(1+this.r21()/100)/1000+47*(this.r8()*this.r9())/1000000+this.r10()*14*(1+this.r21()/100)/1000+this.r11()*18*(1+this.r21()/100)/1000+(this.r12()*2+(this.r14()+this.r15())*(this.r9()-this.r13())*2+this.r16()*this.r13()*2)*9*(1+this.r21()/100)/1000+this.r14()*50+this.r15()*62+this.r16()*45)+(this.r8()*this.r9())*this.r17()/1000000+this.r8()*this.r18()*this.r19()/1000000-this.r8()*this.r18()*(47+this.r17())/1000000+this.r8()/1000*this.r20();
    };

    // ПЛОЩАДЬ
    this.r24 = function() {
        return this.r8() * this.r9() / 1000000
    };


    // Количество изделий
    this.r27 = function() {
        return w.quantity;
    };

    // Площадь изделий
    this.r28 = function() {
        return this.r24() * this.r27()
    };

    this.r32 = function(){
        return w.width;
    };

    return this;
    };
FullTable = function(ws){

    // ОБЩАЯ ПЛОЩАДЬ
    this.i29 = function(){
        var r = 0;
        for (i in ws)
            r += ws[i].getTable().r28();
        return r;
    };

    // Монтаж
    this.c65 = function(){
        return 40 * this.i29();
    };

    // Доставка
    this.c66 = function(){
        return 60;
    };

    // Подоконный профиль пог. мм
    this.c35 = function(){
        var r = 0;
        for (i in ws)
            if (ws[i].type == '1p' || ws[i].type == '2p' || ws[i].type == '3p' )
                r += ws[i].getTable().r32();
        return r;
    };

    // Подоконный профиль
    this.c36 = function (){
        return this.c35()/250;
    };

    return this;

};
Window.prototype.getTable = function(){
    return new PerWindowTable(this);
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
Window.prototype.getTotalPrice = function(){
    return this.getTable().r22();
};
Window.prototype.recalculateWidth = function(){
    var w = this.width;
    var panes = this.getActivePanes();
    for (i = 0; i < panes.length - 1; i++)
        w -= panes[i].width;
    panes[panes.length - 1].width = w;
};

var calc = angular.module('Calc', ['ngCookies', 'ui.bootstrap']);
calc.controller('CalcController', function ($scope, $cookies) {
    $scope.paneTypeSelector = {
        isOpen: false,
        pane: null,
        hoverType: 'solid',
        open: function (p){
            this.pane = p;
            this.isOpen = true;
            this.hoverType = p.type;
        },
        close: function(){
            this.isOpen = false;
        },
        select: function(t){
            this.pane.type = t;
            this.close();
        },
        hover: function(t){
            this.hoverType = t;
        },
        options: {
            backdropFade: true,
            dialogFade: true,
            backdropClick: true,
            keyboard: true,
            backdrop: true
        }
    };
    $scope.confirm = {
        isOpen: false,
        message: 'Ошибка',
        onYes: function(){},
        onNo: function(){},
        open: function (msg, onYes, onNo){
            this.isOpen = true;
            this.message = msg;
            this.onYes = onYes;
            this.onNo = onNo;
        },
        close: function(){
            this.isOpen = false;
            this.onNo();
            this.onYes = function(){};
            this.onNo = function(){};
        },
        confirm: function(){
            this.isOpen = false;
            this.onYes();
            this.onYes = function(){};
            this.onNo = function(){};
        },
        options: {
            backdropFade: true,
            dialogFade: true,
            backdropClick: true,
            keyboard: true,
            backdrop: true
        }
    };
    $scope.newWindow = function(){
        $scope.windows[$scope.windows.length] =
            $scope.currentWindow = new Window($scope.currentWindow);
    };
    $scope.selectWindow = function(w){
        $scope.currentWindow = $scope.windows[w];
    };
    $scope.removeWindowConfirm = function(w){
        $scope.confirm.open('Точно удалить?', function(){$scope.removeWindow(w)}, function(){});
    };
    $scope.removeWindow = function(w) {
        $scope.windows.splice($scope.windows.indexOf(w), 1);
        if ($scope.windows.length < 1) $scope.reset();
    };
    $scope.reset = function(){
        $scope.currentWindow = new Window();
        $scope.windows = [$scope.currentWindow];
    };
    $scope.save = function(){
        $cookies.windows = angular.toJson($scope.windows, false);
    };
    $scope.restore = function(){
        var data = eval($cookies.windows);
        $scope.windows = [];
        for (i in data) {
            var w = new Window();
            for (k in data[i])
                if (data[i].hasOwnProperty(k)) w[k] = data[i][k];
            $scope.windows[$scope.windows.length] = w;
        }
    };
    $scope.getTotalWindowsPrice = function (){
        var tp = 0;
        for (i in $scope.windows)
            tp += $scope.windows[i].getTotalPrice();
        $scope.save();
        return tp;
    };
    $scope.getTotalPrice = function(){
        // FIXME c62 i62
        return $scope.getTotalWindowsPrice();
    };
    $scope.getMontagePrice = function(){
        return $scope.getFullTable().c65();
    };
    $scope.getDeliveryPrice = function(){
        return $scope.getFullTable().c66();
    };
    $scope.getFullTable = function (){
        return new FullTable($scope.windows);
    };


    if ($cookies.windows != null){
        $scope.restore()
        $scope.currentWindow = $scope.windows[0];
    }
    else $scope.reset();
});

