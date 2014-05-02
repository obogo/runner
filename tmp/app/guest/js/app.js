angular.module('app', ['ux']).config(function () {}).
    controller('root', function ($scope) {
        var ctrlPercentWidth = .2;

        function calculateWidths() {
            $scope.ctrlPanelWidth = {width: ctrlPercentWidth * 100 + 'px'};
            $scope.viewPanelWidth = {width: (1 - ctrlPercentWidth) * 100 + 'px'};
        }
    });