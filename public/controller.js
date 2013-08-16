var gScope;
Array.prototype.mapSum = function(f) {
    var out = 0;
    angular.forEach(this, function(i){
        out += f(i);
    });
    return out;
};
var calc = angular.module('Calc', ['ngCookies', 'ui.bootstrap', 'ngResource']);
calc.factory('data', function($resource){
    return $resource('settings.php').get(function(){
        $injector.get('$rootScope').$emit('dataIsReady');
    });
});
calc.factory('order', function($cookieStore, $http){
    return function(){
        var o = this;
        this.init = function(){
            this.orderForm = {
                name: "",
                phone: "",
                delivery: 0,
                address: "",
                comment: ""
            };
            this.initWindows()
        }
        this.initWindows = function(){
            this.windows = [new Window()];
        }
        this.init();
        this.load = function(data){
            if (data.windows.length >= 0) {
                this.windows.splice(0, this.windows.length);
                angular.forEach(data.windows, function(w){
                    o.windows[o.windows.length] = new Window(w);
                });
            }
            for (var k in data.orderForm)
                if (data.orderForm.hasOwnProperty(k))
                this.orderForm[k] = data.orderForm[k];
        };
        this.loadFromCookies = function(){
            if ($cookieStore.get('data')){
                this.load($cookieStore.get('data'));
                return true;
            } else return false;
        };
        this.saveToCookies = function(){
            $cookieStore.put('data', {
                windows: this.windows,
                orderForm: this.orderForm
            });
        }
        this.loadFromDB = function(id){
            return $http ({
                method: 'GET',
                url: 'orders.php',
                params: {id: id}
            }).success(function(data){
                o.load(data);
            });
        };
        this.saveToDB = function(){
            return $http({
                method: 'POST',
                url: 'orders.php',
                data: angular.toJson({windows: this.windows,
                    orderForm: this.orderForm}),
                headers: {'Content-Type': 'application/json'},
            });
        };
    };
});
calc.factory('profiles', function(){
    return [
        {
            priceCoefficient: 100,
            name: "Veka"
        },
        {
            priceCoefficient: 97,
            name: "Rehau"
        },
        {
            priceCoefficient: 93,
            name: "Montblanc"
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
calc.factory('currency', function($rootScope, data){
    //noinspection JSUnusedGlobalSymbols,JSUnusedGlobalSymbols
    var out = {
        rate: 32,
        toRoubles: function(usd){
            return usd * this.rate;
        },
        toUSD: function(rub){
            return rub / this.rate;
        }
    };
    $rootScope.$on('dataIsReady', function(){
        out.rate = data.currency.rate;
    });
    return out
});
calc.factory('auth', function($cookies, $window, $http){
    return {
        isAuthorised: $cookies.calcAuth != undefined,
        logout: function(){
            var c = function(){
                $cookies.calcAuth = undefined;
                $window.location.href = "calculator.htm";
            }
            $http('auth.php?logout').success(c).error(c);
        },
        authorise: function(){
            $window.location.href = "auth.htm#" + $window.location.pathname;
        }
    }
});
calc.factory('discountParserPrinter', function(){
    return {
        /**
         * @param str (string)
         * @returns {Array}
         */
        parse: function(str){
            var lines = str.split(/\n/m);
            var out = [];
            for (i = 0; i < lines.length; i++) {
                var d = lines[i].match(/^\s*(\d+)\s+(\d+)\s*$/);
                if (!d) {
                    if (lines[i].match(/^\s+$/) || lines[i] == "") {}
                    else throw "не могу разобрать строку \n" + lines[i];
                } else {
                    out[out.length] = {
                        minSum: d[1],
                        discount: d[2]
                    }
                }
            }
            return out;
        },
        /**
         * @param data (Array)
         * @returns {string}
         */
        print: function(data){
            var out = "";
            angular.forEach(data, function(d){
                out += d.minSum + " " + d.discount + "\n";
            });
            return out;
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
calc.directive('validate', function() {
    return {
        require: 'ngModel',
        link: function(scope, ele, attrs, ctrl) {
            scope.$watch(attrs.ngModel, function() {
                ctrl.$setValidity('validate', !scope.$eval(attrs.validate));
            });
        }
    }
});
calc.directive('smartfloat', function() {
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function(viewValue) {
                if (/^\-?\d+((\.|\,)\d+)?$/.test(viewValue)) {
                    ctrl.$setValidity('float', true);
                    return parseFloat(viewValue.replace(',', '.'));
                } else {
                    ctrl.$setValidity('float', false);
                    return undefined;
                }
            });
        }
    };
});
calc.directive('adminnav', function(auth){
    return {
        priority: 0,
        restrict: 'E',
        scope: {},
        controller: function($scope, $element, $attrs, $transclude) {
            if (!auth.isAuthorised) auth.authorise();
            $scope.logout = function(){
                auth.logout();
            };
        },
        templateUrl: 'adminNav.htm',
        replace: true
    };
});
var $injector = angular.injector(['Calc']);
calc.controller('CalcController', function ($scope, $location) {
    //noinspection JSUnusedGlobalSymbols
    gScope = $scope;
    $scope.modalOptions = {
        backdropFade: true,
        dialogFade: true,
        backdropClick: true,
        keyboard: true,
        backdrop: true
    };
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
    };
    $scope.newWindow = function(){
        $scope.s.windows[$scope.s.windows.length] =
            $scope.s.currentWindow = new Window($scope.s.currentWindow);
    };
    $scope.selectWindow = function(w){
        $scope.s.currentWindow = $scope.s.windows[w];
    };
    $scope.removeWindowConfirm = function(w){
        $scope.confirm.open('Точно удалить?', function(){$scope.removeWindow(w)}, function(){});
    };
    $scope.removeWindow = function(w) {
        $scope.s.windows.splice($scope.s.windows.indexOf(w), 1);
        if ($scope.s.windows.length < 1) $scope.s.windows[0] = new Window();
        $scope.s.currentWindow = $scope.s.windows[0];
    };
    $scope.save = function(){
        $scope.order.saveToCookies();
    };
    $scope.hasErrors = function(){
        for (var i = 0; i < $scope.s.windows.length; i++ )
            if ($scope.s.windows[i].$$errors.hasSome) return true;
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
    $scope.sendOrder = function(){
        $scope.s.busy = true;
        $scope.order.saveToDB().success(function(data){
            $scope.s.state = 'orderSuccess';
            $scope.s.orderId = data.id;
            $scope.s.busy = false;
            $scope.$apply();
        }).error(function(){
            alert('произошла ошибка');
            $scope.s.busy = false;
            $scope.$apply();
        });
    };
    $scope.dataLoaded = false;
    $scope.order = new ($injector.get('order'))();
    var match;
    if (match = $location.path().match(/^\/order\/([0-9]+)$/i)){
        $scope.order.loadFromDB(match[1]).then(function(){
            $scope.readOnly = true;
            $scope.s.currentWindow = $scope.s.windows[0];
            $scope.$apply();
        });
    }
    else {
        $scope.order.loadFromCookies();
        $scope.readOnly = false;
    }
    $injector.get('$rootScope').$on('dataIsReady', function(){
        $scope.dataLoaded = true;
        $scope.$apply();
    });
    // form, order, orderSuccess
    $scope.s = { state: "form"
               , currentWindow: $scope.order.windows[0]
               , windows: $scope.order.windows
               , orderForm: $scope.order.orderForm };
    $scope.fullTable = new FullTable($scope);
    $scope.prices = new Prices($scope);
});
calc.controller('OrdersController', function($scope, $http){
    $http.get('orders.php?list').success(function(data){
        $scope.list = data;
    });
});
calc.controller('SettingsController', function($scope, $http){
    gScope = $scope;
    $scope.previousVersions = [];
    $scope.loadPreviousVersions = function(){
        $http.get('settings.php?list').success(function(data){
            $scope.previousVersions = data;
        });
    };
    $scope.loadPreviousVersions();
    $scope.data = $injector.get('data');
    $scope.pp = $injector.get('discountParserPrinter');
    $scope.discT = {
        encoded: "",
        error: false,
        read: function() {
            try {
                $scope.data.discountTable = $scope.pp.parse($scope.discT.encoded);
                this.error = false;
            } catch(err) {
                this.error = err;
            }
        }
    }
    $scope.s = { busy: true };
    $scope.save = function(){
        $scope.s.result = "";
        $scope.s.busy = true;
        $scope.data.$save({},
            function(){
                $scope.s.busy = false;
                $scope.s.result = "success";
                $scope.loadPreviousVersions();
                $scope.$apply();
            },
            function(){
                $scope.s.busy = false;
                $scope.s.result = "failure";
                $scope.loadPreviousVersions();
                $scope.$apply();
            });
    };
    $scope.load = function(id){
        if (!id) return;
        $scope.busy = true;
        $scope.data.$get({id: id}, function(){
            $injector.get('$rootScope').$emit('dataIsReady');
        })
    };
    $injector.get('$rootScope').$on('dataIsReady', function(){
        $scope.discT.encoded = $scope.pp.print($scope.data.discountTable);
        $scope.currency = $scope.data.currency;
        $scope.s.busy = false;
        $scope.$apply();
    });
});
calc.controller('AuthController', function($scope, auth, $http, $window, $location){
    $scope.redirect = function(){
        if ($location.path() != "") $window.location.href = $location.path();
        else $window.location.href = "orders.htm";
    };
    if (auth.isAuthorised) $scope.redirect();
    $scope.s = {
        password: "",
        busy: false,
        error: false,
        wrongPass: false
    };
    $scope.submit = function(){
        $scope.s.busy = true;
        $scope.s.error = false;
        $http.post('auth.php', {password: $scope.s.password}).success(function(data){
            if (data.result == 'ok'){
                $scope.redirect();
            } else if (data.result == 'wrongPass') {
                $scope.s.wrongPass = true;
            } else {
                $scope.s.error = true;
            }
            $scope.s.busy = false;
            $scope.$apply;
        }).error(function(){
            $scope.s.error = true;
            $scope.s.busy = false;
            $scope.$apply;
        });
    }
}); //Вставить валидацию везде
Prices = function($scope){
    var pt = this;
    var profiles = $injector.get('profiles');
    var ws = $scope.s.windows;

    this.totalWindows = function(){
        return ws.mapSum(function(w){
            return pt.product(w) * w.quantity;
        });
    };
    this.total = function(){
        //$scope.save();
        return pt.totalWindows() + pt.otkosyTotal() + pt.netTotal()
             + pt.podokonnikTotal() + pt.otlivTotal()
             + pt.montageTotal() - pt.discount();
    };
    this.discount = function(){
        return $scope.fullTable.discount();
    };
    this.podokonnik = function(w){
        return $scope.fullTable.podokonnikPrice(w);
    };
    this.podokonnikTotal = function(){
        return ws.mapSum(function(w){
            return pt.podokonnik(w);
        });
    };
    this.otliv = function(w){
        return $scope.fullTable.otlivPrice(w);
    };
    this.otlivTotal = function(){
        return ws.mapSum(function(w){
            return pt.otliv(w);
        });
    };
    this.montage = function(w){
        return $scope.fullTable.montagePrice(w);
    };
    this.montageTotal = function(){
        return ws.mapSum(function(w){
            return pt.montage(w)
        });
    };
    this.podoProfili = function(w){
        return w.width * 4 / 1000;
    };
    this.product = function(w){
        return (w.getTable().r23() * (profiles[w.profile].priceCoefficient / 100) + this.podoProfili(w)) * 1.3;
    };
    this.otkosy = function(w){
        return $scope.fullTable.otkosyPrice(w);
    };
    this.otkosyTotal = function(){
        var out = 0;
        var pt = this;
        angular.forEach(ws, function(w){
            out += pt.otkosy(w);
        });
        return out;
    };
    this.countProducts = function(){
        var out = 0;
        angular.forEach(ws, function(w){
            out += w.quantity;
        });
        return out;
    };
    this.net = function(w){
        return $scope.fullTable.netPrice(w)
    };
    this.netTotal = function(){
        return ws.mapSum(function(w){
            return pt.net(w) * w.quantity;
        });
    };
    this.delivery = function(){
        return $scope.fullTable.c66();
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
    if (w) for (i in w) if (w.hasOwnProperty(i)) this[i] = w[i];
    this.checkSizeErrors();
    return this;
};
(function(p){
    // FIXME РАЗОБРАТЬСЯ, БЛЯДЬ, УЖЕ
    /**
     * @returns {PerWindowTable}
     */
    p.getTable = function(){
        return new PerWindowTable(this);
    };
    p.getPanesCount = function(){
        switch (this.type)
        {
            case '1p': return 1;
            case '2p': return 2;
            case '3p': return 3;
        }
        return 1;
    };
    p.getActivePanes = function(){
        if (this.type == 'door') return [];
        return this.panes.slice(0, this.getPanesCount());
    };
//noinspection JSUnusedGlobalSymbols
    p.getSinglePrice = function(){
        return this.getTable().r22();
    };
//noinspection JSUnusedGlobalSymbols
    p.getTotalPrice = function(){
        return this.getTable().r30();
    };
//noinspection JSUnusedGlobalSymbols
    p.recalculateWidth = function(){
        var w = this.width;
        var panes = this.getActivePanes();
        for (var i = 0; i < panes.length - 1; i++)
            w -= panes[i].width;
        panes[panes.length - 1].width = w;
        this.checkSizeErrors();
    };
    p.setType = function(t){
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
    p.checkSizeErrors = function(){
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
    p.isActuallyWindow = function(){
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
})(Window.prototype);

/**
 * @param w
 * @returns {*}
 * @constructor
 */
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
        return this.r23() * 1.3;
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
    var ws = $scope.s.windows;
    var discount = $injector.get('discount');
    var ft = this;
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
     * Подоконный профиль пог. мм
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
        return ws.mapSum(function(w){
            return ft.netArea(w)
        });
    };
    this.netArea = function(w){
        var r = 0;
        if (w.isActuallyWindow())
            angular.forEach(w.getActivePanes(), function(p){
                if (p.net) r += (p.width * w.height / 1000000)
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
    this.netPrice = function(w){
        return this.netArea(w) * 35 * 1.3;
    };

    /**
     * Общая стоимость аксессуаров
     * @returns {number}
     */
    this.c62 = function(){
        return this.c55() + this.c36();
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
     * Откосы пвх
     * @returns {number}
     */
    this.c70 = function(){
        return ws.mapSum(function(w){
            return ft.otkosyPrice(w);
        });
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
     * Итого к оплате помощник
     * @returns {number}
     */
    this.c76_pre = function(){
        return this.i31() + this.c62() +  this.i62();
    };


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