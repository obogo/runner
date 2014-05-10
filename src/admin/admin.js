var myApp = angular.module('admin', ['ux']),
    data = {};

//test controller
myApp.controller('myController', function ($scope) {
    $scope.sampleData = {events: [], root: {}};
    go.each(go.runner.events, function (eventName) {
        $scope.$on(eventName, function () {
            var args = go.util.array.toArray(arguments);
            args[0] = args[0].name;
            _.extend(data, arguments[1]);
            $scope.sampleData.root = data;
            $scope.sampleData.events.push(args);
        });
    });
    socket.admin = $scope.$root;
});

exports.getData = function () {
    return data;
};