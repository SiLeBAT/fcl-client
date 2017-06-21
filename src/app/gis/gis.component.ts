import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import * as ol from 'openlayers';
import cytoscape from 'cytoscape';
import {ResizeSensor} from 'css-element-queries';

@Component({
  selector: 'app-gis',
  templateUrl: './gis.component.html',
  styleUrls: ['./gis.component.css']
})
export class GisComponent implements OnInit {

  private cy: any;
  private resizeTimer: any;

  constructor() {
  }

  ngOnInit() {
    new ol.Map({
      target: 'map',
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat([37.41, 8.82]),
        zoom: 4
      })
    });

    this.cy = cytoscape({
      container: document.getElementById('cyGis'),

      boxSelectionEnabled: false,
      autounselectify: true,

      layout: {
        name: 'preset'
      },

      style: [
        {
          selector: 'node',
          style: {
            'content': 'data(id)',
            'text-opacity': 0.5,
            'text-valign': 'center',
            'text-halign': 'right',
            'background-color': '#11479e'
          }
        },

        {
          selector: 'edge',
          style: {
            'width': 4,
            'target-arrow-shape': 'triangle',
            'line-color': '#9dbaea',
            'target-arrow-color': '#9dbaea'
          }
        }
      ],

      elements: {
        nodes: [
          {data: {id: 'n0'}, position: {x: 50, y: 50}},
          {data: {id: 'n1'}, position: {x: 100, y: 50}},
          {data: {id: 'n2'}, position: {x: 150, y: 50}},
          {data: {id: 'n3'}, position: {x: 200, y: 50}},
          {data: {id: 'n4'}, position: {x: 250, y: 50}},
          {data: {id: 'n5'}, position: {x: 300, y: 50}},
          {data: {id: 'n6'}, position: {x: 50, y: 100}},
          {data: {id: 'n7'}, position: {x: 100, y: 100}},
          {data: {id: 'n8'}, position: {x: 150, y: 100}},
          {data: {id: 'n9'}, position: {x: 200, y: 100}},
          {data: {id: 'n10'}, position: {x: 250, y: 100}},
          {data: {id: 'n11'}, position: {x: 300, y: 100}},
          {data: {id: 'n12'}, position: {x: 50, y: 150}},
          {data: {id: 'n13'}, position: {x: 100, y: 150}},
          {data: {id: 'n14'}, position: {x: 150, y: 150}},
          {data: {id: 'n15'}, position: {x: 200, y: 150}},
          {data: {id: 'n16'}, position: {x: 250, y: 150}}
        ],
        edges: [
          {data: {source: 'n0', target: 'n1'}},
          {data: {source: 'n1', target: 'n2'}},
          {data: {source: 'n1', target: 'n3'}},
          {data: {source: 'n4', target: 'n5'}},
          {data: {source: 'n4', target: 'n6'}},
          {data: {source: 'n6', target: 'n7'}},
          {data: {source: 'n6', target: 'n8'}},
          {data: {source: 'n8', target: 'n9'}},
          {data: {source: 'n8', target: 'n10'}},
          {data: {source: 'n11', target: 'n12'}},
          {data: {source: 'n12', target: 'n13'}},
          {data: {source: 'n13', target: 'n14'}},
          {data: {source: 'n13', target: 'n15'}},
        ]
      },
    });

    window.onresize = () => {
      Observable.timer(500).subscribe(() => {
        if (this.cy != null) {
          this.cy.resize();
        }
      });
    };

    new ResizeSensor(document.getElementById('gisContainer'), () => {
      if (this.resizeTimer != null) {
        this.resizeTimer.unsubscribe();
      }

      if (this.cy != null) {
        this.resizeTimer = Observable.timer(100).subscribe(() => this.cy.resize());
      }
    });
  }

}
