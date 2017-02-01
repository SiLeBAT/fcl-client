'use strict';

/*global angular, cytoscape, $*/

angular.module('app').service('graphService', function ($timeout, tracingService, dataService, dialogService, utilService) {

    let _this = this;

    let _cy;
    let _data;

    let _mergeDeliveries = false;
    let _nodeSize = 10;
    let _fontSize = 10;

    let _selectionTimer;
    let _updateFunction;

    _this.init = function (containerSelector, data) {
        _data = data;

        if (typeof _cy === 'undefined') {
            _cy = cytoscape({
                container: $(containerSelector)[0],

                elements: {
                    nodes: createNodes(),
                    edges: createEdges()
                },

                layout: {
                    name: 'random'
                },

                style: createStyle(),
                minZoom: 0.01,
                maxZoom: 10,
                wheelSensitivity: 0.5,
            });
        }
        else {
            let json = _cy.json();

            _cy = cytoscape({
                container: $(containerSelector)[0],

                elements: {
                    nodes: createNodes(),
                    edges: createEdges()
                },

                layout: {
                    name: 'preset',
                    positions: function (node) {
                        return json.elements.nodes.find(function (n) {
                            return n.data.id === node.id();
                        }).position;
                    },
                    zoom: json.zoom,
                    pan: json.pan
                },

                style: createStyle(),
                minZoom: json.minZoom,
                maxZoom: json.maxZoom,
                wheelSensitivity: json.wheelSensitivity,
            });
        }

        $(containerSelector).on("mresize", function () {
            $timeout(function () {
                _cy.resize();
            }, 50);
        });

        _cy.panzoom();
        _cy.on('zoom', function () {
            _this.setFontSize(_fontSize);
        });
        _cy.on('select', function (event) {
            setSelected(event.cyTarget, true);
        });
        _cy.on('unselect', function (event) {
            setSelected(event.cyTarget, false);
        });
        _cy.on('cxttap', function (event) {
            let element = event.cyTarget;
            let position = {
                x: event.originalEvent.pageX,
                y: event.originalEvent.pageY
            };

            if (!element.hasOwnProperty('length')) {
                showGraphContextMenu(position);
            }
            else if (element.group() === 'nodes') {
                showStationContextMenu(element, position);
            }
            else if (element.group() === 'edges') {
                showDeliveryContextMenu(element, position);
            }
        });

        tracingService.init(data);
        dialogService.init();
    };

    _this.setMergeDeliveries = function (mergeDeliveries) {
        _mergeDeliveries = mergeDeliveries;

        if (typeof _cy !== 'undefined') {
            updateEdges();
        }
    };

    _this.setNodeSize = function (nodeSize) {
        _nodeSize = nodeSize;

        if (typeof _cy !== 'undefined') {
            recalculateNodeSizes();
            updateProperties();
        }
    };

    _this.setFontSize = function (fontSize) {
        _fontSize = fontSize;

        if (typeof _cy !== 'undefined') {
            _cy.nodes().style({
                'font-size': Math.max(fontSize / _cy.zoom(), fontSize)
            });
        }
    };

    _this.onSelectionChange = function (f) {
        _cy.on('select unselect', function () {
            if (_selectionTimer) {
                $timeout.cancel(_selectionTimer);
            }

            _selectionTimer = $timeout(f, 50);
        });
    };

    _this.onUpdate = function (f) {
        _updateFunction = f;
    };

    function updateProperties() {
        if (_mergeDeliveries) {
            updateEdges();
            _cy.nodes().data('_update', true);
        }
        else {
            _cy.elements().data('_update', true);

            if (_updateFunction) {
                _updateFunction.call();
            }
        }
    }

    function updateEdges() {
        let edges = createEdges();

        for (let e of edges) {
            e.group = "edges";
        }

        _cy.batch(function () {
            _cy.edges().remove();
            _cy.add(edges);
        });

        if (_updateFunction) {
            _updateFunction.call();
        }
    }

    function updateAll() {
        for (let s of _data.stations) {
            if (s.data.invisible) {
                let pos = _cy.nodes('#' + s.data.id).position();

                if (typeof pos !== 'undefined') {
                    s.data._position = pos;
                }
            }
        }

        let nodes = createNodes();
        let edges = createEdges();

        recalculateNodeSizes();

        for (let e of edges) {
            e.group = "edges";
        }

        let idToPosition = function (id) {
            return _cy.nodes('#' + id).position();
        };

        for (let n of nodes) {
            n.group = "nodes";

            let pos = _cy.nodes('#' + n.data.id).position();

            if (typeof pos === 'undefined') {
                if (n.data.hasOwnProperty('_position')) {
                    n.position = n.data._position;
                    delete n.data._position;
                }
                else if (n.data.hasOwnProperty('contains')) {
                    n.position = utilService.getCenter(n.data.contains.map(idToPosition));

                    for (let contained of tracingService.getElementsById(n.data.contains)) {
                        let containedPos = _cy.nodes('#' + contained.data.id).position();

                        contained.data._relativeTo = n.data.id;
                        contained.data._relativePosition = utilService.difference(containedPos, n.position);
                    }
                }
                else if (n.data.hasOwnProperty('_relativeTo') && n.data.hasOwnProperty('_relativePosition')) {
                    n.position = utilService.sum(_cy.nodes('#' + n.data._relativeTo).position(), n.data._relativePosition);
                    delete n.data._relativeTo;
                    delete n.data._relativePosition;
                }
            }
            else {
                n.position = pos;
            }
        }

        _cy.batch(function () {
            _cy.elements().remove();
            _cy.add(nodes);
            _cy.add(edges);
        });

        if (_updateFunction) {
            _updateFunction.call();
        }
    }

    function createNodes() {
        let stations = [];

        for (let s of _data.stations) {
            if (!s.data.contained && !s.data.invisible) {
                stations.push({
                    data: s.data,
                    selected: s.data.selected
                });
            }
        }

        return stations;
    }


    function createEdges() {
        let deliveries = [];

        if (_mergeDeliveries) {
            let sourceTargetMap = new Map();

            for (let d of _data.deliveries) {
                if (!d.data.invisible) {
                    let key = d.data.source + '->' + d.data.target;
                    let value = sourceTargetMap.get(key);

                    sourceTargetMap.set(key, typeof value === 'undefined' ? [d] : value.concat(d));
                }
            }

            for (let value of sourceTargetMap.values()) {
                let delivery;

                if (value.length === 1) {
                    delivery = {
                        data: value[0].data,
                        selected: value[0].data.selected,
                    };

                    delivery.data.merged = false;
                }
                else {
                    let source = value[0].data.source;
                    let target = value[0].data.target;

                    delivery = {
                        data: {
                            id: source + '->' + target,
                            source: source,
                            target: target,
                            isEdge: true,
                            backward: typeof value.find(function (d) {
                                return d.data.backward;
                            }) !== 'undefined',
                            forward: typeof value.find(function (d) {
                                return d.data.forward;
                            }) !== 'undefined',
                            observed: typeof value.find(function (d) {
                                return d.data.observed;
                            }) !== 'undefined',
                            merged: value.length > 1,
                            contains: value.map(function (d) {
                                return d.data.id;
                            })
                        },
                        selected: typeof value.find(function (d) {
                            return d.data.selected === true;
                        }) !== 'undefined'
                    };
                }

                deliveries.push(delivery);
            }
        }
        else {
            for (let d of _data.deliveries) {
                if (!d.data.invisible) {
                    let delivery = {
                        data: d.data,
                        selected: d.data.selected,
                    };

                    delivery.data.merged = false;
                    deliveries.push(delivery);
                }
            }
        }

        return deliveries;
    }

    function recalculateNodeSizes() {
        let maxScore = 0;

        for (let s of _data.stations) {
            maxScore = Math.max(maxScore, s.data.score);
        }

        if (maxScore > 0) {
            for (let s of _data.stations) {
                s.data._size = (0.5 + 0.5 * s.data.score / maxScore) * _nodeSize;
            }
        }
        else {
            for (let s of _data.stations) {
                s.data._size = _nodeSize;
            }
        }
    }

    function setSelected(element, selected) {
        if (element.data('isEdge') && typeof element.data('contains') !== 'undefined') {
            for (let id of element.data('contains')) {
                tracingService.setSelected(id, selected);
            }
        }
        else {
            tracingService.setSelected(element.id(), selected);
        }
    }

    function createStyle() {
        let sizeFunction = function (node) {
            return typeof node.data('_size') === 'undefined' ? _nodeSize : node.data('_size');
        };

        let style = cytoscape.stylesheet()
            .selector('node')
            .style({
                'content': 'data(name)',
                'height': sizeFunction,
                'width': sizeFunction,
                'background-color': '#FFFFFF',
                'border-width': 3,
                'border-color': '#000000',
                'text-valign': 'bottom',
                'text-halign': 'right',
                'color': '#000000'
            })
            .selector('edge')
            .style({
                'target-arrow-shape': 'triangle',
                'width': 6,
                'line-color': '#000000',
                'target-arrow-color': '#FF0000',
                'curve-style': 'bezier'
            })
            .selector('node:selected')
            .style({
                'background-color': '#8080FF',
                'border-width': 6,
                'border-color': '#0000FF',
                'color': '#0000FF'
            })
            .selector('edge:selected')
            .style({
                'width': 12
            });

        let nodeProps = {
            'forward': dataService.COLORS.forward,
            'backward': dataService.COLORS.backward,
            'observed': dataService.COLORS.observed,
            'outbreak': dataService.COLORS.outbreak
        };

        let edgeProps = {
            'forward': dataService.COLORS.forward,
            'backward': dataService.COLORS.backward,
            'observed': dataService.COLORS.observed
        };

        for (let combination of utilService.getAllCombinations(Object.keys(nodeProps))) {
            let s = [];
            let c1 = [];
            let c2 = [];

            for (let prop of combination) {
                s.push('[?' + prop + ']');
                c1.push(nodeProps[prop]);
                c2.push(utilService.mixColors(nodeProps[prop], [0, 0, 255]));
            }

            style = style.selector('node' + s.join('')).style(createNodeBackground(c1));
            style = style.selector('node:selected' + s.join('')).style(createNodeBackground(c2));
        }

        for (let prop of Object.keys(edgeProps)) {
            style = style.selector('edge[?' + prop + ']').style(createEdgeColor(edgeProps[prop]));
        }

        return style;
    }

    function createNodeBackground(colors) {
        if (colors.length === 1) {
            return {
                'background-color': utilService.colorToCss(colors[0])
            };
        }

        let style = {};

        for (let i = 0; i < colors.length; i++) {
            style['pie-' + (i + 1) + '-background-color'] = utilService.colorToCss(colors[i]);
            style['pie-' + (i + 1) + '-background-size'] = 100 / colors.length;
        }

        return style;
    }

    function createEdgeColor(color) {
        return {
            'line-color': utilService.colorToCss(color)
        };
    }

    function isDeliveryTracePossible(delivery) {
        if (delivery.data('merged')) {
            dialogService.showErrorAlert('Showing Trace of merged delivery is not supported!');
            return false;
        }
        else {
            return true;
        }
    }

    function showGraphContextMenu(position) {
        dialogService.showContextMenu(position, {
            'Apply Layout': showLayoutMenu,
            'Clear Trace': function () {
                tracingService.clearTrace();
                updateProperties();
            },
            'Clear Outbreaks': function () {
                tracingService.clearOutbreakStations();
                _this.setNodeSize(_nodeSize);
            },
            'Clear Invisible': function () {
                tracingService.clearInvisibility();
                updateAll();
            }
        });
    }

    function showStationContextMenu(station, position) {
        let selectedStations = _cy.nodes(':selected');
        let options;

        if (station.selected() && selectedStations.size() > 1) {
            options = {
                'Merge Stations': function () {
                    dialogService.showPrompt("Please specify name of meta station:", "Meta Station Name", function (name) {
                        tracingService.mergeStations(selectedStations.map(function (station) {
                            return station.id();
                        }), name);
                        updateAll();
                    });
                },
                'Mark as Outbreak': function () {
                    tracingService.markStationsAsOutbreak(selectedStations.map(function (s) {
                        return s.id();
                    }));
                    _this.setNodeSize(_nodeSize);
                },
                'Make Invisible': function () {
                    tracingService.makeStationsInvisible(selectedStations.map(function (s) {
                        return s.id();
                    }));
                    updateAll();
                }
            };
        }
        else {
            options = {
                'Show Forward Trace': function () {
                    tracingService.showStationForwardTrace(station.id());
                    updateProperties();
                },
                'Show Backward Trace': function () {
                    tracingService.showStationBackwardTrace(station.id());
                    updateProperties();
                },
                'Show Whole Trace': function () {
                    tracingService.showStationTrace(station.id());
                    updateProperties();
                }
            };

            options[station.data('outbreak') ? 'Unmark as Outbreak' : 'Mark as Outbreak'] = function () {
                tracingService.toggleOutbreakStation(station.id());
                _this.setNodeSize(_nodeSize);
            };

            options['Make Invisible'] = function () {
                tracingService.makeStationsInvisible([station.id()]);
                updateAll();
            };

            if (station.data('contains')) {
                options.Expand = function () {
                    tracingService.expandStation(station.id());
                    updateAll();
                };
            }
        }

        dialogService.showContextMenu(position, options);
    }

    function showDeliveryContextMenu(delivery, position) {
        dialogService.showContextMenu(position, {
            'Show Forward Trace': function () {
                if (isDeliveryTracePossible(delivery)) {
                    tracingService.showDeliveryForwardTrace(delivery.id());
                    updateProperties();
                }
            },
            'Show Backward Trace': function () {
                if (isDeliveryTracePossible(delivery)) {
                    tracingService.showDeliveryBackwardTrace(delivery.id());
                    updateProperties();
                }
            },
            'Show Whole Trace': function () {
                if (isDeliveryTracePossible(delivery)) {
                    tracingService.showDeliveryTrace(delivery.id());
                    updateProperties();
                }
            }
        });
    }

    function showLayoutMenu() {
        dialogService.showDialogMenu("Apply Layout", {
            'Fruchterman-Reingold': function () {
                _cy.layout({
                    name: 'fruchterman'
                });
            },
            'Constraint-Based': function () {
                let layout;

                dialogService.showDialogMenu('Layout running', {
                    'Stop': function () {
                        layout.stop();
                    }
                }, false);

                layout = _cy.elements().makeLayout({
                    name: 'cola',
                    ungrabifyWhileSimulating: true,
                    avoidOverlap: false,
                    animate: true,
                    maxSimulationTime: 60000,
                    stop: function () {
                        dialogService.hideDialogMenu();
                    }
                });
                layout.run();
            },
            'Random': function () {
                _cy.layout({
                    name: 'random'
                });
            },
            'Grid': function () {
                _cy.layout({
                    name: 'grid'
                });
            },
            'Circle': function () {
                _cy.layout({
                    name: 'circle'
                });
            },
            'Concentric': function () {
                _cy.layout({
                    name: 'concentric'
                });
            },
            'Breadth-first': function () {
                _cy.layout({
                    name: 'breadthfirst'
                });
            },
            'Spread': function () {
                _cy.layout({
                    name: 'spread'
                });
            },
            'Directed acyclic graph': function () {
                _cy.layout({
                    name: 'dagre'
                });
            }
        });
    }
});
