/*
 ### jQuery XML to JSON Plugin v1.1 - 2008-07-01 ###
 * http://www.fyneworks.com/ - diego@fyneworks.com
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 ###
 Website: http://www.fyneworks.com/jquery/xml-to-json/
 *//*
 # INSPIRED BY: http://www.terracoder.com/
 AND: http://www.thomasfrank.se/xml_to_json.html
 AND: http://www.kawa.net/works/js/xml/objtree-e.html
 *//*
 This simple script converts XML (document of code) into a JSON object. It is the combination of 2
 'xml to json' great parsers (see below) which allows for both 'simple' and 'extended' parsing modes.
 */
// Avoid collisions
/* global ActiveXObject */
(function () {
    "use strict";
    var api = {
        extend: exports.extend,
        each: exports.each,
        isArray: _.isArray
    };
    function typeCast(val) {
        if (val === 'true' || val === 'false') {
            return val === 'true';
        } else if (val !== '' && val && !isNaN(val)) {
            return parseFloat(val);
        }
        return val;
    }

    function parseCondition(item, index, list) {
        if (item.type === 'condition') {
            item.conditions = [];
            var i = 0, iLen = item.steps.length;
            while (i < iLen) {
                api.each(item.steps, parseCondition);
                item.conditions.push(item.steps[i]);
                i += 1;
            }
            item.steps = [];// clear old steps.
        }
    }

    // Add function to jQuery namespace
    api.extend(api, {
        parse: function(str) {
            var result;
            str = this.closeOpenNodes(str);
            str = str.replace(/<(\w+)/g, "<steps type=\"$1\"");
            str = str.replace(/<\/\w+/g, "<\/steps");
            result = this.xml2json(str);

            // we now need to walk the structure looking for conditions and parse them out accordingly.
            this.each(result.steps, parseCondition);

            return result;
        },

        // this will convert closed tags to open tags
        // <reset/> => <reset></reset>
        closeOpenNodes: function (str) {
            str = str.replace(/<(\w+)\/>/gim, "<$1><\/$1>");
            // <reset ... /> => <reset ...></reset>
            str = str.replace(/(<(\w+)[^>]+?)\/>/gim, "$1><\/$2>");
            return str;
        },
        // converts xml documents and xml text to json object
        xml2json: function (xml, extended) {
            if (!xml) {
                return {};
            } // quick fail

            //### PARSER LIBRARY
            // Core function
            function parseXML(node, simple) {
                if (!node) {
                    return null;
                }
                var txt = '', obj = null, att = null, cnn;
                var nt = node.nodeType, nn = jsVar(node.localName || node.nodeName);
                var nv = node.text || node.nodeValue || '';
                /*DBG*/ //if(window.console) console.log(['x2j',nn,nt,nv.length+' bytes']);
                if (node.childNodes) {
                    if (node.childNodes.length > 0) {
                        /*DBG*/ //if(window.console) console.log(['x2j',nn,'CHILDREN',node.childNodes]);
                        api.each(node.childNodes, function (cn, n) {
                            var cnt = cn.nodeType, cnn = jsVar(cn.localName || cn.nodeName);
                            var cnv = cn.text || cn.nodeValue || '';
                            /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>a',cnn,cnt,cnv]);
                            if (cnt === 8) {
                                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>b',cnn,'COMMENT (ignore)']);
                                return; // ignore comment node
                            }
                            else if (cnt === 3 || cnt === 4 || !cnn) {
                                // ignore white-space in between tags
                                if (cnv.match(/^\s+$/)) {
                                    /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>c',cnn,'WHITE-SPACE (ignore)']);
                                    return;
                                }
                                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>d',cnn,'TEXT']);
                                txt += cnv.replace(/^\s+/, '').replace(/\s+$/, '');
                                // make sure we ditch trailing spaces from markup
                            }
                            else {
                                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>e',cnn,'OBJECT']);
                                obj = obj || {};
                                if (obj[cnn]) {
                                    /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>f',cnn,'ARRAY']);

                                    // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
                                    if (!obj[cnn].length) {
                                        obj[cnn] = myArr(obj[cnn]);
                                    }
                                    obj[cnn] = myArr(obj[cnn]);

                                    obj[cnn][ obj[cnn].length ] = parseXML(cn, true/* simple */);
                                    obj[cnn].length = obj[cnn].length;
                                }
                                else {
                                    /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>g',cnn,'dig deeper...']);
                                    obj[cnn] = parseXML(cn);
                                }
                            }
                        });
                    }
                    //node.childNodes.length>0
                }
                //node.childNodes
                if(txt) {
                    txt = typeCast(txt);
                }
                if (node.attributes) {
                    if (node.attributes.length > 0) {
                        /*DBG*/ //if(window.console) console.log(['x2j',nn,'ATTRIBUTES',node.attributes])
                        att = {};
                        obj = obj || {};
                        api.each(node.attributes, function (at, a) {
                            var atn = jsVar(at.name), atv = at.value;
                            if (atn !== 'xmlns') {
                                att[atn] = atv;
                                if (obj[atn]) {
                                    /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'ARRAY']);

                                    // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
                                    //if(!obj[atn].length) obj[atn] = myArr(obj[atn]);//[ obj[ atn ] ];
                                    obj[cnn] = myArr(obj[cnn]);

                                    obj[atn][ obj[atn].length ] = atv;
                                    obj[atn].length = obj[atn].length;
                                }
                                else {
                                    /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'TEXT']);
                                    obj[atn] = typeCast(atv);
                                }
                            }
                        });
                        //obj['attributes'] = att;
                    }
                    //node.attributes.length>0
                }
                //node.attributes
                if (obj) {
                    if (txt === '') {
                        obj = api.extend({}, /* {text:txt},*/ obj || {}/*, att || {}*/);
                    }
//                    obj = api.extend((txt != '' ? new String(txt) : {}), /* {text:txt},*/ obj || {}/*, att || {}*/);
                    if (obj.text) {
                        if (typeof obj.text === 'object') {
                            txt = obj.text;
                        } else {
//                            txt = [obj.text || ''].concat([txt]);
                            txt = (obj.txt || txt) || '';
                        }
                    } else {
                        txt = txt;
                    }
//                    txt = (obj.text) ? (typeof(obj.text) == 'object' ? obj.text : [obj.text || '']).concat([txt]) : txt;
                    if (txt !== undefined && txt !== '') {
                        obj.text = txt;
                    }
                    txt = '';
                }
                var out = obj || txt;
                //console.log([extended, simple, out]);
                if (extended) {
                    if (txt) {
                        out = {};
                    }//new String(out);
                    txt = out.text || txt || '';
                    if (txt) {
                        out.text = txt;
                    }
                    if (!simple) {
                        out = myArr(out);
                    }
                }
                return out;
            }

            // parseXML
            // Core Function End
            // Utility functions
            var jsVar = function (s) {
                return String(s || '').replace(/-/g, "_");
            };

            // NEW isNum function: 01/09/2010
            // Thanks to Emile Grau, GigaTecnologies S.L., www.gigatransfer.com, www.mygigamail.com
            function isNum(s) {
                // based on utility function isNum from xml2json plugin (http://www.fyneworks.com/ - diego@fyneworks.com)
                // few bugs corrected from original function :
                // - syntax error : regexp.test(string) instead of string.test(reg)
                // - regexp modified to accept  comma as decimal mark (latin syntax : 25,24 )
                // - regexp modified to reject if no number before decimal mark  : ".7" is not accepted
                // - string is "trimmed", allowing to accept space at the beginning and end of string
                var regexp = /^((-)?([0-9]+)(([\.\,]{0,1})([0-9]+))?$)/;
                return (typeof s === "number") || regexp.test(String((s && typeof s === "string") ? s.trim() : ''));
            }

            // OLD isNum function: (for reference only)
            //var isNum = function(s){ return (typeof s == "number") || String((s && typeof s == "string") ? s : '').test(/^((-)?([0-9]*)((\.{0,1})([0-9]+))?$)/); };

            var myArr = function (o) {

                // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
                //if(!o.length) o = [ o ]; o.length=o.length;
                if (!api.isArray(o)) {
                    o = [ o ];
                }
                o.length = o.length;

                // here is where you can attach additional functionality, such as searching and sorting...
                return o;
            };
            // Utility functions End
            //### PARSER LIBRARY END

            // Convert plain text to xml
            if (typeof xml === 'string') {
                xml = api.text2xml(xml);
            }

            // Quick fail if not xml (or if this is a node)
            if (!xml.nodeType) {
                return;
            }
            if (xml.nodeType === 3 || xml.nodeType === 4) {
                return xml.nodeValue;
            }

            // Find xml root node
            var root = (xml.nodeType === 9) ? xml.documentElement : xml;

            // Convert xml to json
            var out = parseXML(root, true /* simple */);

            // Clean-up memory
            xml = null;
            root = null;

            // Send output
            return out;
        },

        // Convert text to XML DOM
        text2xml: function (str) {
            // NOTE: I'd like to use jQuery for this, but jQuery makes all tags uppercase
            //return $(xml)[0];
            var out, xml;
            try {
                xml = (DOMParser) ? new DOMParser() : new ActiveXObject("Microsoft.XMLDOM");
                xml.async = false;
            } catch (e) {
                throw new Error("XML Parser could not be instantiated");
            }
            try {
                if (!DOMParser) {
                    out = (xml.loadXML(str)) ? xml : false;
                } else {
                    out = xml.parseFromString(str, "text/xml");
                }
            } catch (e) {
                throw new Error("Error parsing XML string");
            }
            return out;
        }

    }); // extend $

    ex.xml = api;
}());