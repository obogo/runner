registerType(types.FIND = 'find', function () {
    return {
        options: {
            maxTime: 10000
        },
        preExec: function () {
            this.element = exports.selector.query(this.query, doc);
            this.element = this.element[0] || this.element;
            return this.element ? statuses.PASS : statuses.FAIL;
        }
    };
});
registerType(types.VAL = 'val', function () {
    return {
        options: {
            maxTime: 10000
        },
        preExec: ['find', function (find) {
            find.value = find.element.value;
            return statuses.PASS;
        }]
    };
});
registerType(types.TEXT = 'text', function () {
    return {
        options: {
            maxTime: 10000
        },
        preExec: ['find', function (find) {
            find.text = find.element.innerText;
            return statuses.PASS;
        }]
    };
});
registerType(types.MOUSEDOWN = 'mousedown', function () {
    return {
        options: {
            maxTime: 10000
        },
        preExec: ['find', function (find) {
            fireEvent(find.element, 'mousedown');
            return statuses.PASS;
        }]
    };
});
registerType(types.MOUSEUP = 'mouseup', function () {
    return {
        options: {
            maxTime: 10000
        },
        preExec: ['find', function (find) {
            fireEvent(find.element, 'mouseup');
            return statuses.PASS;
        }]
    };
});
registerType(types.MOUSEOVER = 'mouseover', function () {
    return {
        options: {
            maxTime: 10000
        },
        preExec: ['find', function (find) {
            fireEvent(find.element, 'mouseover');
            return statuses.PASS;
        }]
    };
});
registerType(types.FOCUSIN = 'focusin', function () {
    return {
        options: {
            maxTime: 10000
        },
        preExec: ['find', function (find) {
            fireEvent(find.element, 'focusin');
            return statuses.PASS;
        }]
    };
});
registerType(types.FOCUSOUT = 'focusout', function () {
    return {
        options: {
            maxTime: 10000
        },
        preExec: ['find', function (find) {
            fireEvent(find.element, 'focusout');
            return statuses.PASS;
        }]
    };
});
registerType(types.CLICK = 'click', function () {
    return {
        options: {
            maxTime: 10000
        },
        preExec: ['find', function (find) {
            fireEvent(find.element, 'click');
            return statuses.PASS;
        }]
    };
});
registerType(types.TOBE = 'toBe', function () {
    return {
        options: {
            property: 'value',
            value: '',
            increment: 1,
            pre: {limit: 1},
            maxTime: 10
        },
        preExec: ['find', function (find) {
            var value = find.element[this.property];
            if (value !== this.value) {
                throw new Error("Expected element." + this.property + " of \"" + value + "\" to be \"" + this.value + "\".");
            }
            return statuses.PASS;
        }],
        onError: ['error', function (error) {
            console.error("ON ERROR CALLED: %s", error.message);
        }]
    };
});


/**
 * Fire an event handler to the specified node. Event handlers can detect that the event was fired programatically
 * by testing for a 'synthetic=true' property on the event object
 * @param {HTMLNode} node The node to fire the event handler on.
 * @param {String} eventName The name of the event without the "on" (e.g., "focus")
 */
function fireEvent(node, eventName) {
    // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
    var doc, event, bubbles, eventClass;
    if (node.ownerDocument) {
        doc = node.ownerDocument;
    } else if (node.nodeType == 9){
        // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
        doc = node;
    } else {
        throw new Error("Invalid node passed to fireEvent: " + node.id);
    }

     if (node.dispatchEvent) {
        // Gecko-style approach (now the standard) takes more work
        eventClass = "";

        // Different events have different event classes.
        // If this switch statement can't map an eventName to an eventClass,
        // the event firing is going to fail.
        switch (eventName) {
            case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
            case "mousedown":
            case "mouseup":
                eventClass = "MouseEvents";
                break;

            case "focus":
            case "change":
            case "blur":
            case "select":
                eventClass = "HTMLEvents";
                break;

            default:
                throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
        }
        event = doc.createEvent(eventClass);

        bubbles = eventName == "change" ? false : true;
        event.initEvent(eventName, bubbles, true); // All events created as bubbling and cancelable.

        event.synthetic = true; // allow detection of synthetic events
        // The second parameter says go ahead with the default action
        node.dispatchEvent(event, true);
    } else  if (node.fireEvent) {
        // IE-old school style
        event = doc.createEventObject();
        event.synthetic = true; // allow detection of synthetic events
        node.fireEvent("on" + eventName, event);
    }
}

/**
 * Cross Browser helper to addEventListener.
 *
 * @param {HTMLElement} obj The Element to attach event to.
 * @param {string} evt The event that will trigger the binded function.
 * @param {function(event)} fnc The function to bind to the element.
 * @return {boolean} true if it was successfuly binded.
 */
var cb_addEventListener = function(obj, evt, fnc) {
    // W3C model
    if (obj.addEventListener) {
        obj.addEventListener(evt, fnc, false);
        return true;
    } else if (obj.attachEvent) {// Microsoft model
        return obj.attachEvent('on' + evt, fnc);
    }
    // Browser don't support W3C or MSFT model, go on with traditional
    else {
        evt = 'on'+evt;
        if(typeof obj[evt] === 'function'){
            // Object already has a function on traditional
            // Let's wrap it with our own function inside another function
            fnc = (function(f1,f2){
                return function(){
                    f1.apply(this,arguments);
                    f2.apply(this,arguments);
                };
            })(obj[evt], fnc);
        }
        obj[evt] = fnc;
        return true;
    }
    return false;
};