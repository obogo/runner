/**
 * ##stoageQueue
 * Maintain the relationship between service data and the localStorage.
 * This is the master list of steps because it gets them from both location to return to the recorder.
 */
function StorageQueue(storage) {
    var api = {},
        intv,
        throttle = 2000,
        data = {},
        serviceData = {},
        storageData = {},
        activeUID = null,
        key = 'queue',
        activeUIDKey = 'activeUID';
    csl = new Logger("storageQueue", "color:#990000");

    function load() {
        //TODO: need to get the steps from the server.
        storageData = storage.get(key);
        activeUID = storage.get(activeUIDKey);
        setTimeout(function () {
            dropMatches({});
        }, 100);
    }

    function clear() {
        csl.log("\tclear storage");
        storage.remove(key);
        storage.remove(activeUIDKey);
        serviceData = {};
        storageData = {};
        data = {};
    }

    /**
     * Return all steps from the server and from the local storage combined.
     */
    function getSteps() {
        // convert the data arrays back to arrays and return.
        //TODO: implement objectToArray in extend.
        csl.log("\tgetSteps");
        return exports.extend.apply({objectsAsArray: true}, [
            {},
            data
        ]);
    }

    function update(scenario, activeStepUID) {
        // we are going to see what is in the scenario vs what is in the service response.
        // we make sure everything is added to local storage that is not in the service response.
        // first we need to convert the data to an object (with no arrays)
        if (!scenario || !scenario.uid) {
            throw new Error("Invalid Scenario");
        }
        csl.log("update data %o", data);
        data = exports.extend.apply({arrayAsObject: true}, [
            {},
            scenario
        ]);
        updateStorage(activeStepUID);
        save();
    }

    function updateStorage(activeStepUID) {
        storageData = exports.data.diff(serviceData, data);
        if (storageData && storageData.uid) {
            csl.log("\tupdateStorage %o", storageData);
            storage.put(key, storageData);
            storage.put(activeUIDKey, activeStepUID);
        } else {
            csl.log("\tno change to update in storage");
        }
    }

    /**
     * Send to the server all steps that we can. On response drop if successful.
     */
    function save() {
        if (!intv) {
            intv = setTimeout(sync, throttle);
        }
    }

    function sync() {
        // force save now.
        clearTimeout(intv);
        intv = 0;
//        var copy = exports.extend({}, storageData);
//        csl.log("\tSAVE STORAGE TO SERVICE %o", copy);
//        setTimeout(function () {
//            dropMatches(copy);
//        }, 1000);
    }

    /**
     * Drop any steps from the local storage that were received in the service response.
     * @param serviceResponse
     */
    function dropMatches(serviceResponse) {
        csl.log("\tdata loaded %o", serviceResponse);
        serviceData = serviceResponse;
        data = exports.extend({}, serviceData, storageData);
        updateStorage();
        api.initialLoad = true;
        api.dispatch(StorageQueue.events.ON_SERVER_UPDATE, getSteps(), activeUID);
    }

    api.initialLoad = false;
    api.load = load;
    api.getSteps = getSteps;
    api.update = update;
    api.clear = clear;
    api.sync = sync;
    dispatcher(api);
    return api;
}
StorageQueue.events = {
    ON_SERVER_UPDATE: 'storageQueue:onServerUpdate'
};