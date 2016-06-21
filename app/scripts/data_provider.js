'use strict';

/*global angular */

angular.module('app').service('dataProvider', function() {

    var nodes = [{
        data: {
            "id": 1,
            "name": "Heckmair Andreas",
            "type": "Kuchenesser"
        }
    }, {
        data: {
            "id": 3,
            "name": "Voggel Anton",
            "type": "Kuchenesser"
        }
    }, {
        data: {
            "id": 4,
            "name": "Schaich Peter",
            "type": "Kuchenesser"
        }
    }, {
        data: {
            "id": 6,
            "name": "Otte",
            "type": "Kuchenesser"
        }
    }, {
        data: {
            "id": 8,
            "name": "Riedl-Leirer Monika",
            "type": "Primärerzeuger"
        }
    }, {
        data: {
            "id": 20,
            "name": "Bäcker Mees",
            "type": "Bäcker"
        }
    }, {
        data: {
            "id": 22,
            "name": "JungMarkt",
            "type": "Supermarkt"
        }
    }, {
        data: {
            "id": 236,
            "name": "MarktSchleuse",
            "type": "Supermarkt"
        }
    }, {
        data: {
            "id": 261,
            "name": "Schmidt Fritz",
            "type": "Primärerzeuger"
        }
    }, {
        data: {
            "id": 346,
            "name": "Albert Benno",
            "type": "Primärerzeuger"
        }
    }, {
        data: {
            "id": 394,
            "name": "Adolf Roland",
            "type": "Primärerzeuger"
        }
    }, {
        data: {
            "id": 451,
            "name": "Prophete Hermann",
            "type": "Primärerzeuger"
        }
    }, {
        data: {
            "id": 598,
            "name": "Baak Helmut",
            "type": "Primärerzeuger"
        }
    }, {
        data: {
            "id": 640,
            "name": "Alex",
            "type": "Primärerzeuger"
        }
    }, {
        data: {
            "id": 642,
            "name": "Bio-Lager",
            "type": "Bioladen"
        }
    }, {
        data: {
            "id": 679,
            "name": "Bäcker Haake",
            "type": "Bäcker"
        }
    }, {
        data: {
            "id": 740,
            "name": "Mlady  Kurt",
            "type": "Primärerzeuger"
        }
    }, {
        data: {
            "id": 742,
            "name": "Wolf Bernhard",
            "type": "Primärerzeuger"
        }
    }, {
        data: {
            "id": 749,
            "name": "Gewürz Arno",
            "type": "Gewürzhändler"
        }
    }, {
        data: {
            "id": 750,
            "name": "MarktEber",
            "type": "Supermarkt"
        }
    }, {
        data: {
            "id": 754,
            "name": "Bio Geisler",
            "type": "Bioladen"
        }
    }];

    var edges = [{
        data: {
            "id": 10001,
            "source": 20,
            "target": 3
        }
    }, {
        data: {
            "id": 10010,
            "source": 20,
            "target": 4
        }
    }, {
        data: {
            "id": 10002,
            "source": 22,
            "target": 20
        }
    }, {
        data: {
            "id": 10011,
            "source": 22,
            "target": 20
        }
    }, {
        data: {
            "id": 10003,
            "source": 754,
            "target": 20
        }
    }, {
        data: {
            "id": 10014,
            "source": 236,
            "target": 679
        }
    }, {
        data: {
            "id": 10004,
            "source": 236,
            "target": 20
        }
    }, {
        data: {
            "id": 10005,
            "source": 236,
            "target": 20
        }
    }, {
        data: {
            "id": 10006,
            "source": 236,
            "target": 20
        }
    }, {
        data: {
            "id": 10007,
            "source": 236,
            "target": 20
        }
    }, {
        data: {
            "id": 10008,
            "source": 749,
            "target": 20
        }
    }, {
        data: {
            "id": 10009,
            "source": 3,
            "target": 6
        }
    }, {
        data: {
            "id": 10012,
            "source": 679,
            "target": 1
        }
    }, {
        data: {
            "id": 10013,
            "source": 642,
            "target": 679
        }
    }, {
        data: {
            "id": 10015,
            "source": 750,
            "target": 679
        }
    }, {
        data: {
            "id": 10019,
            "source": 394,
            "target": 22
        }
    }, {
        data: {
            "id": 10020,
            "source": 640,
            "target": 754
        }
    }, {
        data: {
            "id": 10021,
            "source": 598,
            "target": 236
        }
    }, {
        data: {
            "id": 10022,
            "source": 740,
            "target": 236
        }
    }, {
        data: {
            "id": 10023,
            "source": 261,
            "target": 236
        }
    }, {
        data: {
            "id": 10024,
            "source": 346,
            "target": 236
        }
    }, {
        data: {
            "id": 10028,
            "source": 346,
            "target": 750
        }
    }, {
        data: {
            "id": 10025,
            "source": 742,
            "target": 749
        }
    }, {
        data: {
            "id": 10026,
            "source": 8,
            "target": 642
        }
    }, {
        data: {
            "id": 10027,
            "source": 451,
            "target": 236
        }
    }];

    this.getNodes = function() {
        return nodes;
    };

    this.getEdges = function() {
        return edges;
    };

});