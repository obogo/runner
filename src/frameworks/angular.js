/*global angular*/
(function () {
    'use strict';

    try {
        angular.module('ux');
    } catch (e) {
        angular.module('ux', []);
    }

    angular.module("ux").run(function () {
        ex.getInjector = function () {
            if (ex.options.window) {
                return ex.options.window.angular.element(ex.options.rootElement).injector();
            }
            return angular.element(ex.options.window.document).injector();
        };
    }).factory('runner', function () {
        if (ux.runner.options.autoStart && typeof ux.runner.options.autoStart === "boolean") {
            ux.runner.run();
        }
        return ux.runner;
    });

}());