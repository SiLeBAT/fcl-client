'use strict';

/*global angular*/

angular.module('app').service('tracingService', function() {

    var _this = this;

    var _stations;
    var _deliveries;
    var _elementsById;

    _this.init = function(data) {
        _stations = data.stations;
        _deliveries = data.deliveries;
        _elementsById = {};

        for (let s of _stations) {
            _elementsById[s.data.id] = s;
        }

        for (let d of _deliveries) {
            _elementsById[d.data.id] = d;
        }
    };

    _this.getElementsById = function(ids) {
        return ids.map(function(id) {
            return _elementsById[id];
        });
    };

    _this.mergeStations = function(ids, name) {
        var metaId;

        for (let i = 1;; i++) {
            if (!_elementsById.hasOwnProperty(i.toString())) {
                metaId = i.toString();
                break;
            }
        }

        var metaStation = {
            data: {
                id: metaId,
                name: name,
                isEdge: false,
                type: 'Meta Station',
                contains: ids,
                selected: true
            }
        };

        for (let id of ids) {
            _elementsById[id].data.contained = true;
        }

        metaStation.data.in = [];
        metaStation.data.out = [];

        for (let d of _deliveries) {
            if (ids.includes(d.data.source)) {
                d.data.originalSource = d.data.source;
                d.data.source = metaId;
                metaStation.data.out.push(d.data.id);
            }

            if (ids.includes(d.data.target)) {
                d.data.originalTarget = d.data.target;
                d.data.target = metaId;
                metaStation.data.in.push(d.data.id);
            }
        }

        _stations.push(metaStation);
        _elementsById[metaId] = metaStation;
        updateTrace(ids);
        updateScores();
    };

    _this.expandStation = function(id) {
        var station = _elementsById[id];

        delete _elementsById[id];
        _stations.splice(_stations.indexOf(station), 1);

        for (let containedId of station.data.contains) {
            _elementsById[containedId].data.contained = false;
        }

        for (let d of _deliveries) {
            if (d.data.source === id) {
                d.data.source = d.data.originalSource;
                delete d.data.originalSource;
            }

            if (d.data.target === id) {
                d.data.target = d.data.originalTarget;
                delete d.data.originalTarget;
            }
        }

        updateTrace([id]);
        updateScores();
    };

    _this.clearSelection = function() {
        for (let s of _stations) {
            s.data.selected = false;
        }
        for (let d of _deliveries) {
            d.data.selected = false;
        }
    };

    _this.setSelected = function(id, selected) {
        _elementsById[id].data.selected = selected;
    };

    _this.clearOutbreakStations = function() {
        for (let s of _stations) {
            s.data.outbreak = false;
        }

        updateScores();
    };

    _this.toggleOutbreakStation = function(id) {
        var station = _elementsById[id];

        station.data.outbreak = !station.data.outbreak;
        updateScores();
    };

    _this.markStationsAsOutbreak = function(ids) {
        for (let id of ids) {
            _elementsById[id].data.outbreak = true;
        }

        updateScores();
    };

    _this.clearTrace = function() {
        for (let s of _stations) {
            s.data.observed = false;
            s.data.forward = false;
            s.data.backward = false;
        }
        for (let d of _deliveries) {
            d.data.observed = false;
            d.data.forward = false;
            d.data.backward = false;
        }
    };

    _this.showStationTrace = function(id) {
        var station = _elementsById[id];

        _this.clearTrace();
        station.data.observed = 'full';
        station.data.out.forEach(showDeliveryForwardTraceInternal);
        station.data.in.forEach(showDeliveryBackwardTraceInternal);
    };

    _this.showStationForwardTrace = function(id) {
        var station = _elementsById[id];

        _this.clearTrace();
        station.data.observed = 'forward';
        station.data.out.forEach(showDeliveryForwardTraceInternal);
    };

    _this.showStationBackwardTrace = function(id) {
        var station = _elementsById[id];

        _this.clearTrace();
        station.data.observed = 'backward';
        station.data.in.forEach(showDeliveryBackwardTraceInternal);
    };

    _this.showDeliveryTrace = function(id) {
        var delivery = _elementsById[id];

        _this.clearTrace();
        delivery.data.observed = 'full';
        _elementsById[delivery.data.target].data.forward = true;
        _elementsById[delivery.data.source].data.backward = true;
        delivery.data.out.forEach(showDeliveryForwardTraceInternal);
        delivery.data.in.forEach(showDeliveryBackwardTraceInternal);
    };

    _this.showDeliveryForwardTrace = function(id) {
        var delivery = _elementsById[id];

        _this.clearTrace();
        delivery.data.observed = 'forward';
        _elementsById[delivery.data.target].data.forward = true;
        delivery.data.out.forEach(showDeliveryForwardTraceInternal);
    };

    _this.showDeliveryBackwardTrace = function(id) {
        var delivery = _elementsById[id];

        _this.clearTrace();
        delivery.data.observed = 'backward';
        _elementsById[delivery.data.source].data.backward = true;
        delivery.data.in.forEach(showDeliveryBackwardTraceInternal);
    };

    function updateScores() {
        var nOutbreaks = 0;

        for (let s of _stations) {
            s.data.score = 0;
        }

        for (let d of _deliveries) {
            d.data.score = 0;
        }

        for (let s of _stations) {
            if (s.data.outbreak && !s.data.contained) {
                nOutbreaks++;
                updateStationScore(s.data.id, s.data.id);
            }
        }

        if (nOutbreaks !== 0) {
            for (let s of _stations) {
                s.data.score /= nOutbreaks;
                delete s.data._visited;
            }

            for (let d of _deliveries) {
                d.data.score /= nOutbreaks;
                delete d.data._visited;
            }
        }
    }

    function updateStationScore(id, outbreakId) {
        var station = _elementsById[id];

        if (station.data._visited !== outbreakId) {
            station.data._visited = outbreakId;
            station.data.score++;

            for (let d of station.data.in) {
                updateDeliveryScore(d, outbreakId);
            }
        }
    }

    function updateDeliveryScore(id, outbreakId) {
        var delivery = _elementsById[id];

        if (delivery.data._visited !== outbreakId) {
            delivery.data._visited = outbreakId;
            delivery.data.score++;

            var source = _elementsById[delivery.data.source];

            if (source.data._visited !== outbreakId) {
                source.data._visited = outbreakId;
                source.data.score++;
            }

            for (let d of delivery.data.in) {
                updateDeliveryScore(d, outbreakId);
            }
        }
    }

    function showDeliveryForwardTraceInternal(id) {
        var delivery = _elementsById[id];

        if (!delivery.data.forward) {
            delivery.data.forward = true;
            _elementsById[delivery.data.target].data.forward = true;
            delivery.data.out.forEach(showDeliveryForwardTraceInternal);
        }
    }

    function showDeliveryBackwardTraceInternal(id) {
        var delivery = _elementsById[id];

        if (!delivery.data.backward) {
            delivery.data.backward = true;
            _elementsById[delivery.data.source].data.backward = true;
            delivery.data.in.forEach(showDeliveryBackwardTraceInternal);
        }
    }

    function updateTrace(changedIds) {
        var observedElement = _stations.concat(_deliveries).find(function(e) {
            return e.data.observed;
        });

        if (typeof observedElement === 'undefined') {
            _this.clearTrace();
        }
        else {
            var id = observedElement.data.id;
            var observed = observedElement.data.observed;

            if (!changedIds.includes(id)) {
                if (observedElement.data.isEdge) {
                    switch (observed) {
                        case 'full':
                            _this.showDeliveryTrace(id);
                            break;
                        case 'forward':
                            _this.showDeliveryForwardTrace(id);
                            break;
                        case 'backward':
                            _this.showDeliveryBackwardTrace(id);
                            break;
                    }
                }
                else {
                    switch (observed) {
                        case 'full':
                            _this.showStationTrace(id);
                            break;
                        case 'forward':
                            _this.showStationForwardTrace(id);
                            break;
                        case 'backward':
                            _this.showStationBackwardTrace(id);
                            break;
                    }
                }
            }
        }
    }
});
