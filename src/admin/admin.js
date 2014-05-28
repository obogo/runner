var rootScope,
    myApp = angular.module('admin', ['ux']).run(['$rootScope', function ($rootScope) {
        rootScope = $rootScope;
    }]),
    data = {};

// Ajax function, gets the content of an xml file and stores it in XML DOM
function getXML_file(xml_file) {
    var xhttp;
    // if browser suports XMLHttpRequest
    if (window.XMLHttpRequest) {
        // Cretes a instantce of XMLHttpRequest object
        xhttp = new XMLHttpRequest();
    } else {
        // for IE 5/6
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("GET", xml_file, false);
    xhttp.send(null);
    return xhttp.responseText;
}

//test controller
myApp.controller('myController', function ($scope) {
    $scope.sampleData = {events: [], root: {}};
    go.each(ex.events.runner, function (eventName) {
        $scope.$on(eventName, function () {
            var args = go.util.array.toArray(arguments);
            args[0] = args[0].name;
            _.extend(data, arguments[1]);
            if (!$scope.sampleData.root) {
                $scope.sampleData.root = data;
            } else {
                go.extend($scope.sampleData.root, data);
            }
            $scope.sampleData.events.push(args);
        });
    });

    $scope.parseXML = function () {
        //TODO: Cannot have reference to runner.
        var steps = go.runnerAdmin.xml.parse($scope.xmlData);
        console.log(steps);
        return extend.apply({arrayAsObject:true}, [{}, steps]);
    };

    $scope.sendTest = function() {
        $scope.$emit(ex.events.admin.LOAD_TEST, $scope.parseXML());
//        go.runner.setSteps([steps]);
        $scope.xmlData = '';
    };

    $scope.registerScenario = function () {
        $scope.$emit(ex.events.admin.REGISTER_SCENARIO, $scope.parseXML());
        $scope.xmlData = '';
    };

    $scope.setScenarioXML = function () {
        $scope.xmlData = getXML_file('xml/registerScenarioSimple.xml');
    };

    $scope.setSimpleXML = function () {
        $scope.xmlData = getXML_file('xml/simple.xml');
    };

    $scope.start = function () {
        $scope.$emit(ex.events.admin.START, $scope.startNode);
    };

    $scope.stop = function () {
        $scope.$emit(ex.events.admin.STOP);
    };

    $scope.reset = function () {
        $scope.$emit(ex.events.admin.RESET);
    };
});