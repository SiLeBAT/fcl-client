'use strict';

/*global angular, cytoscape*/

angular.module('app').service('graphService', function(tracingService, dataService, dialogService, utilService) {

    var _this = this;

    var _cy;
    var _data;
    var _mergeDeliveries = false;
    var _nodeSize = 10;
    var _fontSize = 10;

    _this.init = function(container, data) {
        _data = data;

        if (_cy === undefined) {
            _cy = cytoscape({
                container: container,

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
            var json = _cy.json();

            _cy = cytoscape({
                container: container,

                elements: {
                    nodes: createNodes(),
                    edges: createEdges()
                },

                layout: {
                    name: 'preset',
                    positions: function(node) {
                        return json.elements.nodes.find(function(n) {
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

        _cy.panzoom();

        _cy.on('zoom', function(event) {
            _this.setFontSize(_fontSize);
        });
        _cy.on('select', function(event) {
            setSelected(event.cyTarget, true);
        });
        _cy.on('unselect', function(event) {
            setSelected(event.cyTarget, false);
        });
        _cy.on('cxttap', function(event) {
            var element = event.cyTarget;
            var position = {
                x: event.originalEvent.pageX,
                y: event.originalEvent.pageY
            };

            if (element.length === undefined) {
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

    _this.setMergeDeliveries = function(mergeDeliveries) {
        _mergeDeliveries = mergeDeliveries;
        updateEdges();
    };

    _this.setNodeSize = function(nodeSize) {
        var maxScore = 0;

        for (let s of _data.stations) {
            maxScore = Math.max(maxScore, s.data.score);
        }

        if (maxScore > 0) {
            for (let s of _data.stations) {
                s.data._size = (0.5 + 0.5 * s.data.score / maxScore) * nodeSize;
            }
        }
        else {
            for (let s of _data.stations) {
                s.data._size = nodeSize;
            }
        }

        _nodeSize = nodeSize;
        repaint();
    };

    _this.setFontSize = function(fontSize) {
        _fontSize = fontSize;

        _cy.nodes().style({
            'font-size': Math.max(fontSize / _cy.zoom(), fontSize)
        });
    };

    function repaint() {
        if (_mergeDeliveries) {
            updateEdges();
            _cy.nodes().data('_update', true);
        }
        else {
            _cy.elements().data('_update', true);
        }
    }

    function updateEdges() {
        var edges = createEdges();

        for (let e of edges) {
            e.group = "edges";
        }

        _cy.edges().remove();
        _cy.add(edges);
    }

    function createNodes() {
        var stations = [];

        for (let s of _data.stations) {
            stations.push({
                data: s.data,
                selected: s.data.selected
            });
        }

        return stations;
    }


    function createEdges() {
        var deliveries = [];

        if (_mergeDeliveries) {
            var sourceTargetMap = new Map();

            for (let d of _data.deliveries) {
                let key = d.data.source + '->' + d.data.target;
                let value = sourceTargetMap.get(key);

                sourceTargetMap.set(key, value !== undefined ? value.concat(d) : [d]);
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
                            backward: value.find(function(d) {
                                return d.data.backward === true;
                            }) !== undefined,
                            forward: value.find(function(d) {
                                return d.data.forward === true;
                            }) !== undefined,
                            merged: value.length > 1,
                            contains: value.map(function(d) {
                                return d.data.id;
                            })
                        },
                        selected: value.find(function(d) {
                            return d.data.selected === true;
                        }) !== undefined
                    };
                }

                deliveries.push(delivery);
            }
        }
        else {
            for (let d of _data.deliveries) {
                let delivery = {
                    data: d.data,
                    selected: d.data.selected,
                };

                delivery.data.merged = false;
                deliveries.push(delivery);
            }
        }

        return deliveries;
    }

    function setSelected(element, selected) {
        if (element.data('contains') !== undefined) {
            for (let id of element.data('contains')) {
                tracingService.setSelected(id, selected);
            }
        }
        else {
            tracingService.setSelected(element.id(), selected);
        }
    }

    function createStyle() {
        var sizeFunction = function(node) {
            return node.data('_size') !== undefined ? node.data('_size') : _nodeSize;
        };

        var style = cytoscape.stylesheet()
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

        var nodeProps = {
            'forward': dataService.COLORS.forward,
            'backward': dataService.COLORS.backward,
            'observed': dataService.COLORS.observed,
            'outbreak': dataService.COLORS.outbreak
        };

        var edgeProps = {
            'forward': dataService.COLORS.forward,
            'backward': dataService.COLORS.backward,
            'observed': dataService.COLORS.observed
        };

        for (let combination of utilService.getAllCombinations(Object.keys(nodeProps))) {
            var s = [];
            var c1 = [];
            var c2 = [];

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
        if (colors.length == 1) {
            return {
                'background-color': utilService.colorToCss(colors[0])
            };
        }

        var style = {};

        for (var i = 0; i < colors.length; i++) {
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
            'Zoom to Graph': function() {
                _cy.fit();
            },
            'Clear Trace': function() {
                tracingService.clearTrace();
                repaint();
            }
        });
    }

    function showStationContextMenu(station, position) {
        dialogService.showContextMenu(position, {
            'Show Forward Trace': function() {
                tracingService.clearTrace();
                tracingService.showStationForwardTrace(station.id());
                repaint();
            },
            'Show Backward Trace': function() {
                tracingService.clearTrace();
                tracingService.showStationBackwardTrace(station.id());
                repaint();
            },
            'Show Whole Trace': function() {
                tracingService.clearTrace();
                tracingService.showStationForwardTrace(station.id());
                tracingService.showStationBackwardTrace(station.id());
                repaint();
            },
            'Mark/Unmark as Outbreak': function() {
                tracingService.toggleOutbreakStation(station.id());
                _this.setNodeSize(_nodeSize);
            }
        });
    }

    function showDeliveryContextMenu(delivery, position) {
        dialogService.showContextMenu(position, {
            'Show Forward Trace': function() {
                if (isDeliveryTracePossible(delivery)) {
                    tracingService.clearTrace();
                    tracingService.showDeliveryForwardTrace(delivery.id());
                    repaint();
                }
            },
            'Show Backward Trace': function() {
                if (isDeliveryTracePossible(delivery)) {
                    tracingService.clearTrace();
                    tracingService.showDeliveryBackwardTrace(delivery.id());
                    repaint();
                }
            },
            'Show Whole Trace': function() {
                if (isDeliveryTracePossible(delivery)) {
                    tracingService.clearTrace();
                    tracingService.showDeliveryForwardTrace(delivery.id());
                    tracingService.showDeliveryBackwardTrace(delivery.id());
                    repaint();
                }
            }
        });
    }

    function showLayoutMenu() {
        dialogService.showDialogMenu("Apply Layout", {
            'Fruchterman-Reingold': function() {
                _cy.layout({
                    name: 'fruchterman'
                });
            },
            'Random': function() {
                _cy.layout({
                    name: 'random'
                });
            },
            'Grid': function() {
                _cy.layout({
                    name: 'grid'
                });
            },
            'Circle': function() {
                _cy.layout({
                    name: 'circle'
                });
            },
            'Concentric': function() {
                _cy.layout({
                    name: 'concentric'
                });
            },
            'Breadthfirst': function() {
                _cy.layout({
                    name: 'breadthfirst'
                });
            },
            'Cose': function() {
                _cy.layout({
                    name: 'cose'
                });
            },
            'Cose Bilkent': function() {
                _cy.layout({
                    name: 'cose-bilkent',
                    animate: 'during'
                });
            },
            'Cola': function() {
                _cy.layout({
                    name: 'cola',
                    ungrabifyWhileSimulating: false,
                    avoidOverlap: false,
                    animate: true,
                    maxSimulationTime: 5000
                });
            },
            'Spread': function() {
                _cy.layout({
                    name: 'spread'
                });
            },
            'Dagre': function() {
                _cy.layout({
                    name: 'dagre',
                    animate: true
                });
            },
            'Springy': function() {
                _cy.layout({
                    name: 'springy'
                });
            }
        });
    }
});
