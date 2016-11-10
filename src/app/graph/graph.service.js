'use strict';

/*global angular, cytoscape*/

angular.module('app').service('graphService', function(tracingService, dataService, $mdDialog) {

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
        _cy.cxtmenu(contextMenu);
        _cy.cxtmenu(stationContextMenu);
        _cy.cxtmenu(deliveryContextMenu);

        _cy.on('zoom', function(event) {
            _this.setFontSize(_fontSize);
        });
        _cy.on('select', function(event) {
            tracingService.setSelected(event.cyTarget.id(), true);
        });
        _cy.on('unselect', function(event) {
            tracingService.setSelected(event.cyTarget.id(), false);
        });

        tracingService.init(data);
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
                var key = d.data.source + '->' + d.data.target;
                var value = sourceTargetMap.get(key);

                sourceTargetMap.set(key, value !== undefined ? value.concat(d) : [d]);
            }

            for (let value of sourceTargetMap.values()) {
                var source = value[0].data.source;
                var target = value[0].data.target;

                deliveries.push({
                    data: {
                        id: source + '->' + target,
                        source: source,
                        target: target,
                        backward: value.find(function(d) {
                            return d.data.backward === true;
                        }) !== undefined,
                        forward: value.find(function(d) {
                            return d.data.forward === true;
                        }) !== undefined
                    },
                    selected: value.find(function(d) {
                        return d.data.selected === true;
                    }) !== undefined
                });
            }
        }
        else {
            for (let d of _data.deliveries) {
                deliveries.push({
                    data: d.data,
                    selected: d.data.selected
                });
            }
        }

        return deliveries;
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

        for (let combination of getAllCombination(Object.keys(nodeProps))) {
            var s = [];
            var c1 = [];
            var c2 = [];

            for (let prop of combination) {
                s.push('[?' + prop + ']');
                c1.push(nodeProps[prop]);
                c2.push(dataService.mixColors(nodeProps[prop], [0, 0, 255]));
            }

            style = style.selector('node' + s.join('')).style(createNodeBackground(c1));
            style = style.selector('node:selected' + s.join('')).style(createNodeBackground(c2));
        }

        for (let prop of Object.keys(edgeProps)) {
            style = style.selector('edge[?' + prop + ']').style(createEdgeColor(edgeProps[prop]));
        }

        return style;
    }

    function getAllCombination(values) {
        var n = Math.pow(2, values.length);
        var combinations = [];

        for (let i = 1; i < n; i++) {
            var bits = i.toString(2).split('').reverse().join('');
            var combination = [];

            for (let j = 0; j < values.length; j++) {
                if (bits[j] === '1') {
                    combination.push(values[j]);
                }
            }

            combinations.push(combination);
        }

        combinations.sort(function(c1, c2) {
            return c1.length - c2.length;
        });

        return combinations;
    }

    function createNodeBackground(colors) {
        if (colors.length == 1) {
            return {
                'background-color': dataService.colorToCss(colors[0])
            };
        }

        var style = {};

        for (var i = 0; i < colors.length; i++) {
            style['pie-' + (i + 1) + '-background-color'] = dataService.colorToCss(colors[i]);
            style['pie-' + (i + 1) + '-background-size'] = 100 / colors.length;
        }

        return style;
    }

    function createEdgeColor(color) {
        return {
            'line-color': dataService.colorToCss(color)
        };
    }

    var contextMenu = {
        selector: 'core',
        openMenuEvents: 'cxttapstart',
        commands: [{
            content: 'Apply Layout',
            select: function() {
                $mdDialog.show({
                    controller: function($scope) {
                        $scope.select = function(layout) {
                            $mdDialog.hide(layout);
                        };
                    },
                    template: `
                        <md-dialog aria-label="Apply Layout">
                        <md-toolbar><dialog-toolbar title="Apply Layout"></dialog-toolbar></md-toolbar>
                        <md-dialog-content><layout-select on-select="select(layout)"></layout-select></md-dialog-content>
                        </md-dialog>
                    `,
                    parent: angular.element(document.body),
                    clickOutsideToClose: true
                }).then(function(layout) {
                    _cy.layout(layout);
                });
            }
        }, {
            content: 'Zoom to Graph',
            select: function() {
                _cy.fit();
            }
        }, {
            content: 'Clear Trace',
            select: function() {
                tracingService.clearTrace();
                repaint();
            }
        }]
    };

    var stationContextMenu = {
        selector: 'node',
        openMenuEvents: 'cxttapstart',
        commands: [{
            content: 'Show Forward Trace',
            select: function(station) {
                tracingService.clearTrace();
                tracingService.showStationForwardTrace(station.id());
                repaint();
            }
        }, {
            content: 'Show Backward Trace',
            select: function(station) {
                tracingService.clearTrace();
                tracingService.showStationBackwardTrace(station.id());
                repaint();
            }
        }, {
            content: 'Show Whole Trace',
            select: function(station) {
                tracingService.clearTrace();
                tracingService.showStationForwardTrace(station.id());
                tracingService.showStationBackwardTrace(station.id());
                repaint();
            }
        }, {
            content: 'Mark/Unmark as Outbreak',
            select: function(station) {
                tracingService.toggleOutbreakStation(station.id());
                _this.setNodeSize(_nodeSize);
            }
        }]
    };

    var deliveryContextMenu = {
        selector: 'edge',
        openMenuEvents: 'cxttapstart',
        commands: [{
            content: 'Show Forward Trace',
            select: function(delivery) {
                tracingService.clearTrace();
                tracingService.showDeliveryForwardTrace(delivery.id());
                repaint();
            }
        }, {
            content: 'Show Backward Trace',
            select: function(delivery) {
                tracingService.clearTrace();
                tracingService.showDeliveryBackwardTrace(delivery.id());
                repaint();
            }
        }, {
            content: 'Show Whole Trace',
            select: function(delivery) {
                tracingService.clearTrace();
                tracingService.showDeliveryForwardTrace(delivery.id());
                tracingService.showDeliveryBackwardTrace(delivery.id());
                repaint();
            }
        }]
    };
});
