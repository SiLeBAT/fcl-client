import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import * as ol from 'openlayers';
import cytoscape from 'cytoscape';
import {ResizeSensor} from 'css-element-queries';
import {Position} from '../util/datatypes';

@Component({
  selector: 'app-gis',
  templateUrl: './gis.component.html',
  styleUrls: ['./gis.component.css']
})
export class GisComponent implements OnInit {

  private cy: any;
  private map: ol.Map;
  private resizeTimer: any;
  private positionsToSet = false;

  constructor() {
  }

  ngOnInit() {
    this.map = new ol.Map({
      target: 'map',
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat([37.41, 8.82]),
        zoom: 4
      }),
      controls: []
    });

    window.onresize = () => {
      Observable.timer(500).subscribe(() => {
        if (this.cy != null) {
          this.cy.resize();
        }
      });
    };

    new ResizeSensor(document.getElementById('gisContainer'), () => {
      this.map.updateSize();

      if (this.resizeTimer != null) {
        this.resizeTimer.unsubscribe();
      }

      if (this.cy != null) {
        this.resizeTimer = Observable.timer(100).subscribe(() => {
          this.cy.resize();
        });
      }
    });

    this.map.on('postrender', () => {
      if (this.positionsToSet) {
        this.positionsToSet = false;

        this.cy.batch(() => {
          this.cy.nodes().forEach(node => {
            node.position(this.latLonToPosition(node.data('lat'), node.data('lon')));
          });
        });
      }
    });
  }

  init() {
    this.cy = cytoscape({
      container: document.getElementById('cyGis'),

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
          {data: {id: 'n0', lat: -8, lon: 0}},
          {data: {id: 'n1', lat: -8, lon: 10}},
          {data: {id: 'n2', lat: -8, lon: 20}},
          {data: {id: 'n3', lat: -8, lon: 30}},
          {data: {id: 'n4', lat: -8, lon: 40}},
          {data: {id: 'n5', lat: -8, lon: 50}},
          {data: {id: 'n6', lat: 8, lon: 0}},
          {data: {id: 'n7', lat: 8, lon: 10}},
          {data: {id: 'n8', lat: 8, lon: 20}},
          {data: {id: 'n9', lat: 8, lon: 30}},
          {data: {id: 'n10', lat: 8, lon: 40}},
          {data: {id: 'n11', lat: 8, lon: 50}},
          {data: {id: 'n12', lat: 16, lon: 0}},
          {data: {id: 'n13', lat: 16, lon: 10}},
          {data: {id: 'n14', lat: 16, lon: 20}},
          {data: {id: 'n15', lat: 16, lon: 30}},
          {data: {id: 'n16', lat: 16, lon: 40}}
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

    this.positionsToSet = true;
  }

  private latLonToPosition(lat: number, lon: number): Position {
    const pixel = this.map.getPixelFromCoordinate(ol.proj.fromLonLat([lon, lat]));

    return {
      x: pixel[0],
      y: pixel[1]
    };
  }
}
