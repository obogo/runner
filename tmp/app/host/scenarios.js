/*global */
(function () {
    'use strict';

    function scenarios(repeatUntil, scenario, scene, find, options, wait) {
        console.log("scenarios");
        //        injector.invoke(selectAccount);

        scenario("Tests", function () {
            scene("should test this", function () {
                wait(500);
//                find("a:eq(0)", options.timeouts.short).sendMouse().html('I got clicked');
//                find("a:eq(0)").text();
                find("h1").text();
//                find("a").sendMouse();
            });
        });
    }
    ux.runner.addScenario('scenario1', scenarios);

}());