var calc = angular.module('Calc', ['ngCookies', 'ui.bootstrap', 'ngResource']);
calc.factory('data', function($resource){
    return $resource('data.php').get(function(){
        $injector.get('$rootScope').$emit('dataIsReady');
    });
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
        calculateDiscount: function(sum) {
            var disc = 0;
            if ($injector.get('data').discountTable){
                var discountTable = $injector.get('data').discountTable;
                var curr = $injector.get('currency');
                for (var i = 0; i < discountTable.length; i++ )
                    if (curr.toRoubles(sum) >= discountTable[i].minSum)
                        disc = discountTable[i].discount;
                    else break;
            }
            return { resultingSum: sum * (1-disc/100)
                   , discount: sum * (disc/100) }
        }
    };
});
calc.factory('currency', function(){
    //noinspection JSUnusedGlobalSymbols,JSUnusedGlobalSymbols
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
calc.controller('CalcController', function ($scope, $cookies) {
    //noinspection JSUnusedGlobalSymbols
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
        select: function(t, dir){
            this.pane.type = t;
            this.pane.direction = dir;
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
        angular.forEach(data, function(d){
            var w = new Window();
            for (var k in d)
                if (d.hasOwnProperty(k)) w[k] = d[k];
            w.checkSizeErrors();
            $scope.windows[$scope.windows.length] = w;
        });
    };
    $scope.stateHelper = function(){
        return angular.toJson($scope.windows, true) + angular.toJson(eval($cookies.windows), true);
    };
    $scope.hasErrors = function(){
        for (var i = 0; i < $scope.windows.length; i++ )
            if ($scope.windows[i].$$errors.hasSome) return true;
        return false;
    };
    $scope.paneClassHelper = function(pane){
        var out = "";
        switch (pane.type){
            case 'solid':
                return 'paneTypeSolid';
            case 'rot':
                out += 'paneTypeRot';
                break;
            case 'rotdrop':
                out += 'paneTypeRotdrop';
                break;
        }
        switch (pane.direction){
            case 'left':
                out += 'L';
                break;
            case 'right':
                out += 'R';
                break;
        }
        return out
    };
    $scope.dataLoaded = false;
    if ($cookies.windows != null){
        $scope.restore();
        $scope.currentWindow = $scope.windows[0];
        $scope.fullTable = new FullTable($scope);
    }
    else $scope.reset();
    $scope.prices = new Prices($scope);
    $injector.get('$rootScope').$on('dataIsReady', function(){
        $scope.dataLoaded = true;
        $scope.$apply();
    });
});

Prices = function($scope){
    //noinspection JSUnusedGlobalSymbols
    this.totalWindows = function(){
        $scope.save();
        return $scope.fullTable.i31();
    };
    //noinspection JSUnusedGlobalSymbols
    this.total = function(){
        return $scope.fullTable.c76();
    };
    this.discount = function(){
        return $scope.fullTable.discount();
    };
    //noinspection JSUnusedGlobalSymbols
    this.podokonnik = function(w){
        return $scope.fullTable.podokonnikPrice(w);
    };
    //noinspection JSUnusedGlobalSymbols
    this.otliv = function(w){
        return $scope.fullTable.otlivPrice(w);
    };
    this.montage = function(w){
        return $scope.fullTable.montagePrice(w);
    };
    this.laminate = function(w){
        return w.getTable().r21();
    };
    this.otkosy = function(w){
        return $scope.fullTable.otkosyPrice(w)
    };
};

Window = function(w){
    //this.name = 'Новое окно';
    // 1p, 2p, 3p, door
    this.panes = [{type:'solid', width:50},{type:'solid', width:50},{type:'solid', width:50}];
    //types: 'solid', 'rot', 'rotdrop'
    //noinspection JSUnusedGlobalSymbols
    this.steklopaket = 1;
    this.montage = 0;
    this.laminate = 0;
    this.profile = 0;
    this.quantity = 1;
    this.podokonniki = {madeIn: 0, type: -1};
    this.otlivy = {type:-1};
    //noinspection JSUnusedGlobalSymbols
    this.otkosy = {type:-1};
    this.setType('1p');
    this.checkSizeErrors();
    return this;
};

// FIXME РАЗОБРАТЬСЯ, БЛЯДЬ, УЖЕ
/**
 * @returns {PerWindowTable}
 */
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
//noinspection JSUnusedGlobalSymbols
Window.prototype.getSinglePrice = function(){
    return this.getTable().r22();
};
//noinspection JSUnusedGlobalSymbols
Window.prototype.getTotalPrice = function(){
    return this.getTable().r30();
};
//noinspection JSUnusedGlobalSymbols
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
    for (var i = 0; i < ps.length; i++) {
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
    //noinspection FallthroughInSwitchStatementJS
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

    /**
     * Ширина рамы
     * @returns Number
     */
    this.r8 = function() {
        return w.width;
    };

    /**
     * Высота рамы
     * @returns Number
     */
    this.r9 = function() {
        return w.height;
    };

    /**
     * Общая длина импостов
     * @returns {number}
     */
    this.r10 = function() {
        return (w.getPanesCount() - 1) * this.r9();
    };

    /**
     * Общая длина штульпов. Не используется.
     * @returns {number}
     */
    this.r11 = function() {
        return 0;
    };

    /**
     * Общая ширина створок и фрамуг. Фрамуги не учитываются.
     * @returns {number}
     */
    this.r12 = function() {
        var panes = w.getActivePanes();
        var r = 0;
        angular.forEach(panes, function(pane){
            if (pane.type == 'rot' || pane.type == 'rotdrop') r += pane.width;
        });
        return r;
    };

    /**
     * Высота фрамуги или глухой части Т-обр. окна. Не ипользуется.
     * @returns {number}
     */
    this.r13 = function() {
        return 0;
    };

    /**
     * Количество поворотных створок
     * @returns {number}
     */
    this.r14 = function() {
        var panes =  w.getActivePanes();
        var c = 0;
        angular.forEach(panes, function(p){
            if (p.type == 'rot') c++;
        });
        return c;
    };

    /**
     * Количество поворотно-откидных створок
     * @returns {number}
     */
    this.r15 = function() {
        var panes =  w.getActivePanes();
        var c = 0;
        angular.forEach(panes, function(p){
            if (p.type == 'rotdrop') c++;
        });
        return c;
    };

    /**
     * Количество фрамуг
     * @returns {number}
     */
    this.r16 = function() {
        return 0;
    };

    /**
     * Надбавка за стеклопакет
     * 1)По цене на стеклопакеты, если однокамерный стеклапакет то ставим надбавку 20,
     * если двухкамерный то 30
     * @returns {number}
     */
    this.r17 = function() {
        return w.steklopaket * 10 + 10;
    };

    /**
     * Сэндвич (высота до импоста). Не используется.
     * @returns {number}
     */
    this.r18 = function() {
        return 0;
    };

    /**
     * Цвет сэндвича  (б/б - 50,  б/ц - 70,  ц/ц - 130). Не используется.
     * @returns {number}
     */
    this.r19 = function() {
        return 0;
    };

    /**
     * Арка (глухая - 40, распашная - 80). Не используется.
     * @returns {number}
     */
    this.r20 = function() {
        return 0;
    };

    /**
     * Ламинация (одна сторона - 45, две -  90)
     * @returns {number}
     */
    this.r21 = function() {
        return w.laminate * 45;
    };


    /**
     * Стоимость
     * @returns {number}
     */
    this.r22 = function() {
        return this.r23() * 1.3 * (profiles[w.profile].priceCoefficient / 100);
    };

    /**
     * Стоимость (скрытая колонка).
     * @returns {number}
     */
    this.r23 = function() {
        if (w.type=='door') return ((this.r8()+this.r9())*2*9*(1+this.r21()/100)/1000+47*(this.r8()*this.r9())/1000000+this.r10()*14*(1+this.r21()/100)/1000+this.r11()*18*(1+this.r21()/100)/1000+(this.r12()*2+(this.r14()+this.r15())*(this.r9()-this.r13())*2+this.r16()*this.r13()*2)*9*(1+this.r21()/100)/1000+this.r14()*70+this.r15()*85+this.r16()*45)+(this.r8()*this.r9())*this.r17()/1000000+this.r8()*this.r18()*this.r19()/1000000-this.r8()*this.r18()*(47+this.r17())/1000000+this.r8()/1000*this.r20();
        else return ((this.r8()+this.r9())*2*9*(1+this.r21()/100)/1000+47*(this.r8()*this.r9())/1000000+this.r10()*14*(1+this.r21()/100)/1000+this.r11()*18*(1+this.r21()/100)/1000+(this.r12()*2+(this.r14()+this.r15())*(this.r9()-this.r13())*2+this.r16()*this.r13()*2)*9*(1+this.r21()/100)/1000+this.r14()*50+this.r15()*62+this.r16()*45)+(this.r8()*this.r9())*this.r17()/1000000+this.r8()*this.r18()*this.r19()/1000000-this.r8()*this.r18()*(47+this.r17())/1000000+this.r8()/1000*this.r20();
    };

    /**
     * ПЛОЩАДЬ
     * @returns {number}
     */
    this.r24 = function() {
        return this.r8() * this.r9() / 1000000
    };


    /**
     * Количество изделий
     * @returns {*}
     */
    this.r27 = function() {
        return w.quantity;
    };

    /**
     * Площадь изделий
     * @returns {number}
     */
    this.r28 = function() {
        return this.r24() * this.r27()
    };


    /**
     * Общая стоимость изделий
     * @returns {number}
     */
    this.r30 = function(){
        return this.r22() * this.r27();
    };

    /**
     * Подоконный  профиль пог.мм.
     * @returns Number
     */
    this.r32 = function(){
        return w.width;
    };

    return this;
};
FullTable = function($scope){
    var ws = $scope.windows;
    var discount = $injector.get('discount');

    //noinspection JSUnusedGlobalSymbols
    /**
     * ОБЩАЯ ПЛОЩАДЬ
     */
    this.i29 = function(){
        var r = 0;
        angular.forEach(ws, function(w){
                r += w.getTable().r28();
        });
    };


    /**
     * Общая стоимость изделий
     * @returns {number}
     */
    this.i31 = function(){
        var s = 0;
        angular.forEach(ws,function(w){
            s += w.getTable().r30();
        });
        return s;
    };


    /**
     * @param w окно
     * @returns {number}
     */
    this.montagePrice = function(w){
        if (w.montage == 1){
            return w.getTable().r28() * 40;
        }
        return 0;
    };
    /**
     * Монтаж
     * @returns {number}
     */
    this.c65 = function(){
        var sum = 0;
        var ft = this; //FIXME
        angular.forEach(ws,function(w){
            sum += ft.montagePrice(w);
        });
        return sum;
    };


    /**
     * Доставка
     * @returns {number}
     */
    this.c66 = function(){
        return 60;
    };

    /**
     *  Подоконный профиль пог. мм
     * @returns {number}
     */
    this.c35 = function(){
        var r = 0;
        angular.forEach(ws,function(w){
            if (w.isActuallyWindow())
                r += w.getTable().r32();
        });
        return r;
    };

    /**
     * Подоконный профиль
     * @returns {number}
     */
    this.c36 = function (){
        return this.c35()/250;
    };


    /**
     * @param w окно
     * @returns {number}
     */
    this.podokonnikPrice = function(w) {
        if (w.isActuallyWindow() && w.podokonniki.type >= 0)
            return this.podokonnikiTable[w.podokonniki.type].price[w.podokonniki.madeIn] * w.width / 1000 * 1.3;
        else return 0;
    };
    /**
     * Подоконники пвх стоимость
     * @returns {number}
     */
    this.i49 = function() {
        var sum = 0;
        var ft = this; // FIXME
        angular.forEach(ws,function(w){
            ft.podokonnikPrice(w);
        });
        return sum
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


    /**
     * @param w окно
     * @returns {number}
     */
    this.otlivPrice = function(w){
        if (w.isActuallyWindow() && w.otlivy.type >= 0)
            return this.otlivyTable[w.otlivy.type].price * w.width / 1000 * 1.3;
        else return 0;
    };
    /**
     * Отливы белые стоимость
     * @returns {number}
     */
    this.i60 = function() {
        var sum = 0;
        var ft = this;
        angular.forEach(ws,function(w){
            sum += ft.otlivPrice(w);
        });
        return sum
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

    /**
     * Москитная сетка площадь m^2
     * @returns {number}
     */
    this.c54 = function(){
        var r = 0;
        angular.forEach(ws,function(w){
            if (w.isActuallyWindow())
                angular.forEach(w.getActivePanes(), function(p){
                    if (p.net) r += (p.width * w.height / 1000000)
                });
        });
        return r;
    };

    /**
     * Москитная сетка стоимость
     * @returns {number}
     */
    this.c55 = function(){
        return this.c54() * 35;
    };

    /**
     * Общая стоимость аксессуаров
     * @returns {number}
     */
    this.c62 = function(){
        return (this.c55() + this.c36()) * 1.3;
    };

    /**
     * ВСЕГО Подоконники и отливы:
     * @returns {number}
     */
    this.i62 = function(){
        return this.i49() + this.i60();
    };

    /**
     * Общая стоимость работ
     * @returns {number}
     */
    this.c69 = function() {
        return this.c65() + this.c66();
    };

    /**
     * Итого к оплате помощник
     * @returns {number}
     */
    this.c76_pre = function(){
        return this.i31() + this.c62() +  this.i62();
    };


    /**
     * Откосы пвх
     * @returns {number}
     */
    this.c70 = function(){
        var out = 0;
        var ft = this;
        angular.forEach(ws, function(w){
            out += ft.otkosyPrice(w);
        });
        return out;
    };
    this.otkosyPrice = function (w) {
        if (!w.isActuallyWindow() || w.otkosy.type == -1) return 0;
        var length = (w.width + w.height * 2) / 10000;
        return length * this.otkosyTable[w.otkosy.type];
    };
    this.otkosyTable = [
        23, 28, 35, 38
    ];

    /**
     * Итого к оплате
     * @returns {number}
     */
    this.c76 = function(){
        return discount.calculateDiscount(this.c76_pre()).resultingSum + this.c69() + this.c70();
    };

    /**
     * Сумма скидки
     * @returns {Number}
     */
    this.discount = function(){
        return discount.calculateDiscount(this.c76_pre()).discount;
    };
    return this;
};