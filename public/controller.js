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
            this.pane.net = false;
            this.pane.key = false;
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
        $scope.currentWindow = $scope.windows[0];
    };
    $scope.reset = function(){
        $scope.currentWindow = new Window();
        $scope.windows = [$scope.currentWindow];
        $scope.fullTable = new FullTable($scope);
    };
    $scope.save = function(){
        $cookies.windows = angular.toJson($scope.windows, false);
    };
    $scope.restore = function(){
        var data = eval($cookies.windows);
        $scope.windows = [];
        for (var i in data) {
            var w = new Window();
            for (var k in data[i])
                if (data[i].hasOwnProperty(k)) w[k] = data[i][k];
            w.checkSizeErrors();
            $scope.windows[$scope.windows.length] = w;
        }
    };
    $scope.stateHelper = function(){
        return angular.toJson($scope.windows, true) + angular.toJson(eval($cookies.windows), true);
    };
    $scope.getTotalWindowsPrice = function (){
        $scope.save();
        return this.fullTable.i31();
    };
    $scope.getTotalPrice = function(){
        return this.fullTable.c76();
    };
    $scope.getDiscount = function(){
        return this.fullTable.discount();
    };
    $scope.getWorksPrice = function(){
        return $scope.fullTable.c69();
    };
    $scope.getAccessoryPrice = function(){
        return $scope.fullTable.c62();
    };
    $scope.getPodokonnikyOtlivyPrice = function(){
        return $scope.fullTable.i62();
    };
    $scope.hasErrors = function(){
        for (var i in $scope.windows)
            if ($scope.windows[i].$$errors.hasSome) return true;
        return false;
    };
    if ($cookies.windows != null){
        $scope.restore();
        $scope.currentWindow = $scope.windows[0];
        $scope.fullTable = new FullTable($scope);
    }
    else $scope.reset();
});
calc.factory('profiles', function(){
    return [
        {
            priceCoefficient: 100,
            name: "0%"
        },
        {
            priceCoefficient: 105,
            name: "5%"
        },
        {
            priceCoefficient: 110,
            name: "10%"
        }
    ];
});
calc.factory('discount', function(){
    return {
        discountTable: [
            { minSum: 0
            , discount: 22 },
            { minSum: 15000
            , discount: 26 },
            { minSum: 24000
            , discount: 28 },
            { minSum: 36000
            , discount: 30 },
            { minSum: 45000
            , discount: 32},
            { minSum: 60000
            , discount: 33 },
            { minSum: 80000
            , discount: 34 },
            { minSum: 120000
            , discount: 35 }
        ],
        calculateDiscount: function(sum) {
            var curr = $injector.get('currency');
            var disc = 0;
            for (var i in this.discountTable)
                if (curr.toRoubles(sum) >= this.discountTable[i].minSum)
                    disc = this.discountTable[i].discount;
                else break;
            return { resultingSum: sum * (1-disc/100)
                   , discount: sum * (disc/100) }
        }
    }
});
calc.factory('currency', function(){
    return{
        toRoubles: function(usd){
            return usd * 32;
        },
        toUSD: function(rub){
            return rub * (1/32);
        }
    };
});
calc.filter('rub', function(){
    return function(input){
        var rub = $injector.get('currency').toRoubles(input);
        rub = Math.round(rub);
        return rub + "р";
    }
});
var $injector = angular.injector(['Calc']);

Window = function(w){
    //this.name = 'Новое окно';
    // 1p, 2p, 3p, door
    this.panes = [{type:'solid', width:50},{type:'solid', width:50},{type:'solid', width:50}];
    //types: 'solid', 'rot', 'rotdrop'
    this.steklopaket = 1;
    this.laminate = 0;
    this.profile = 0;
    this.quantity = 1;
    this.podokonniki = {madeIn: 0, type: 0};
    this.otlivy = {type:0};
    this.setType('1p');
    this.checkSizeErrors();
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
Window.prototype.getSinglePrice = function(){
    return this.getTable().r22();
};
Window.prototype.getTotalPrice = function(){
    return this.getTable().r30();
};
Window.prototype.recalculateWidth = function(){
    var w = this.width;
    var panes = this.getActivePanes();
    for (var i = 0; i < panes.length - 1; i++)
        w -= panes[i].width;
    panes[panes.length - 1].width = w;
    this.checkSizeErrors();
};
Window.prototype.setType = function(t){
    switch (t){
        case '1p':
            this.type = t;
            this.panes[0] = {type: 'solid', width: 800};
            this.width = 800;
            this.height = 1500;
            break;
        case '2p':
            this.type = t;
            this.panes[0] = {type: 'solid', width: 750};
            this.panes[1] = {type: 'solid', width: 750};
            this.width = 1500;
            this.height = 1500;
            break;
        case '3p':
            this.type = t;
            this.panes[0] = {type: 'solid', width: 700};
            this.panes[1] = {type: 'solid', width: 700};
            this.panes[2] = {type: 'solid', width: 700};
            this.width = 2100;
            this.height = 1500;
            break;
        case 'door':
            this.type = t;
            this.width = 700;
            this.height = 2200;
            break;
    }
};
Window.prototype.checkSizeErrors = function(){
    var ps = this.getActivePanes();
    var out = {errors: {}, paneErrors: []};
    for (var i in ps)
    {
        if (ps[i].width < 100)
        {
            out.errors.paneTooSmall = true;
            out.paneErrors[i] = true;
            out.hasSome = true;
            if (ps[i].width < 0)
            {
                out.errors.paneWindowWidthMismatch = true;
                out.widthError = true;
            }
        }
    }
    this.$$errors = out;
};
Window.prototype.isActuallyWindow = function(){
    switch (this.type){
        case '1p':
        case '2p':
        case '3p':
            return true;
        default:
            return false;
    }
};

PerWindowTable = function(w){

    var profiles = $injector.get('profiles');

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
        for (var i in panes) {
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
        for (var i in panes)
            if (panes[i].type == 'rot') c++;
        return c;
    };

    // Количество поворотно-откидных створок
    this.r15 = function() {
        var panes =  w.getActivePanes();
        var c = 0;
        for (var i in panes)
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
        return this.r23() * 1.3 * (profiles[w.profile].priceCoefficient / 100);
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


    // Общая стоимость изделий
    this.r30 = function(){
        return this.r22() * this.r27();
    };

    this.r32 = function(){
        return w.width;
    };

    return this;
};
FullTable = function($scope){
    var ws = $scope.windows;
    var discount = $injector.get('discount');

    // ОБЩАЯ ПЛОЩАДЬ
    this.i29 = function(){
        var r = 0;
        for (var i in ws)
            r += ws[i].getTable().r28();
        return r;
    };


    // Общая стоимость изделий
    this.i31 = function(){
        var s = 0;
        for (var i in ws)
            s += ws[i].getTable().r30();
        return s;
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
        for (var i in ws)
            if (ws[i].type == '1p' || ws[i].type == '2p' || ws[i].type == '3p' )
                r += ws[i].getTable().r32();
        return r;
    };

    // Подоконный профиль
    this.c36 = function (){
        return this.c35()/250;
    };

    // Подоконники пвх стоимость
    this.i49 = function() {
        var podokonnikiTotal = [];
        for (var i = 0; i < this.podokonnikiTable.length; i++)
            podokonnikiTotal[i] = [0,0];
        for (i in ws){
            var w = ws[i];
            if (w.isActuallyWindow())
                podokonnikiTotal[w.podokonniki.type][w.podokonniki.madeIn] += (w.width / 1000);
        }
        var sum = 0;
        for (i in this.otlivyTable)
            sum += podokonnikiTotal[i][0] * this.podokonnikiTable[i].price[0]
                + podokonnikiTotal[i][1] * this.podokonnikiTable[i].price[1];
        return sum * 1.3;
    };
    this.podokonnikiTable = [
        { price: [10.8, 17]
            , width:100 },
        { price: [12.5, 17]
            , width:150 },
        { price: [13.2, 17]
            , width:200 },
        { price: [17, 20]
            , width:250 },
        { price: [17.6, 23]
            , width:300 },
        { price: [19.8, 27]
            , width:350 },
        { price: [22.7, 31]
            , width:400 },
        { price: [26, 45]
            , width:450 },
        { price: [28.3, 53]
            , width:500 },
        { price: [30.7, 53]
            , width:550 },
        { price: [32.3, 53]
            , width:600 }
    ];

    // Отливы белые стоимость
    this.i60 = function() {
        var otlivyTotal = [];
        for (var i = 0; i < this.podokonnikiTable.length; i++)
            otlivyTotal[i] = 0;
        for (var i in ws){
            var w = ws[i];
            if (w.isActuallyWindow())
                otlivyTotal[w.otlivy.type] += (w.width / 1000);
        }
        var sum = 0;
        for (var i in this.otlivyTable)
            sum += otlivyTotal[i] * this.otlivyTable[i].price;
        return sum * 1.3;
    };
    this.otlivyTable = [
        { price: 5
            , width: "0-110мм"},
        { price: 7
            , width: "110-150мм"},
        { price: 8
            , width: "151-180мм"},
        { price: 10
            , width: "181-200мм"},
        { price: 11
            , width: "201-260мм"},
        { price: 12
            , width: "261-280мм"},
        { price: 14
            , width: "281-310мм"},
        { price: 15
            , width: "311-340мм"},
        { price: 18
            , width: "341-420мм"}
    ];

    // Москитная сетка площадь m^2
    this.c54 = function(){
        var r = 0;
        for (var i in ws)
            if (ws[i].type == '1p' || ws[i].type == '2p' || ws[i].type == '3p' ){
                ps = ws[i].getActivePanes();
                for (var k in ps)
                    if (ps[k].net) r += (ps[k].width * ws[i].height / 1000000)
            }
        return r;
    };

    // Москитная сетка стоимость
    this.c55 = function(){
        return this.c54() * 35;
    };

    // Общая стоимость аксессуаров
    this.c62 = function(){
        return (this.c55() + this.c36()) * 1.3;
    };


    //ВСЕГО Подоконники и отливы:
    this.i62 = function(){
        return this.i49() + this.i60();
    };

    // Общая стоимость работ
    this.c69 = function() {
        return this.c65() + this.c66();
    };

    // Итого к оплате помощник
    this.c76_pre = function(){
        return this.i31() + this.c62() +  this.i62();
    };


    // Откосы пвх
    this.c70 = function(){
        return 0; //fixme
    };

    // Итого к оплате
    this.c76 = function(){
        return discount.calculateDiscount(this.c76_pre()).resultingSum + this.c69() + this.c70();
    };

    // Сумма скидки
    this.discount = function(){
        return discount.calculateDiscount(this.c76_pre()).discount;
    };
    return this;
};