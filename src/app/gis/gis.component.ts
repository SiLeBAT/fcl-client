import {Component, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import * as ol from 'openlayers';
import cytoscape from 'cytoscape';
import {ResizeSensor} from 'css-element-queries';
import {Utils} from '../util/utils';
import {MdSlider} from '@angular/material';

@Component({
  selector: 'app-gis',
  templateUrl: './gis.component.html',
  styleUrls: ['./gis.component.css']
})
export class GisComponent implements OnInit {

  private static readonly ZOOM_FACTOR = 1.5;

  @ViewChild('slider') slider: MdSlider;

  zoomSliderValue: number;

  private cy: any;
  private map: ol.Map;
  private resizeTimer: any;
  private sliding = false;

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
      view: Utils.panZoomToView({x: 166.24836375741359, y: 232.80878034039395}, 2.2099363183270926,
        document.getElementById('gisContainer').offsetWidth, document.getElementById('gisContainer').offsetHeight),
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
  }

  init() {
    const nodes = [
      {data: {id: 'n0', lat: -8, lon: 0}, position: null},
      {data: {id: 'n1', lat: -8, lon: 10}, position: null},
      {data: {id: 'n2', lat: -8, lon: 20}, position: null},
      {data: {id: 'n3', lat: -8, lon: 30}, position: null},
      {data: {id: 'n4', lat: -8, lon: 40}, position: null},
      {data: {id: 'n5', lat: -8, lon: 50}, position: null},
      {data: {id: 'n6', lat: 8, lon: 0}, position: null},
      {data: {id: 'n7', lat: 8, lon: 10}, position: null},
      {data: {id: 'n8', lat: 8, lon: 20}, position: null},
      {data: {id: 'n9', lat: 8, lon: 30}, position: null},
      {data: {id: 'n10', lat: 8, lon: 40}, position: null},
      {data: {id: 'n11', lat: 8, lon: 50}, position: null},
      {data: {id: 'n12', lat: 16, lon: 0}, position: null},
      {data: {id: 'n13', lat: 16, lon: 10}, position: null},
      {data: {id: 'n14', lat: 16, lon: 20}, position: null},
      {data: {id: 'n15', lat: 16, lon: 30}, position: null},
      {data: {id: 'n16', lat: 16, lon: 40}, position: null}
    ];

    for (const n of nodes) {
      n.position = Utils.latLonToPosition(n.data.lat, n.data.lon);
    }

    this.cy = cytoscape({
      container: document.getElementById('cyGis'),

      minZoom: 0.1,
      maxZoom: 100,
      zoom: 2.2099363183270926,
      pan: {x: 166.24836375741359, y: 232.80878034039395},

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
        nodes: nodes,
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

    this.cy.on('zoom', () => {
      this.map.setView(Utils.panZoomToView(this.cy.pan(), this.cy.zoom(), this.cy.width(), this.cy.height()));

      if (!this.sliding) {
        this.updateSlider();
      }
    });

    this.updateSlider();
  }

  zoomInPressed() {
    this.zoomTo(this.cy.zoom() * GisComponent.ZOOM_FACTOR);
  }

  zoomOutPressed() {
    this.zoomTo(this.cy.zoom() / GisComponent.ZOOM_FACTOR);
  }

  zoomResetPressed() {
    if (this.cy.elements().size() === 0) {
      this.cy.reset();
    } else {
      this.cy.fit();
    }
  }

  sliderChanged() {
    this.sliding = true;
    this.zoomTo(Math.exp(this.slider.value / 100 * Math.log(this.cy.maxZoom() / this.cy.minZoom())) * this.cy.minZoom());
    this.sliding = false;
  }

  private zoomTo(newZoom: number) {
    newZoom = Math.min(Math.max(newZoom, this.cy.minZoom()), this.cy.maxZoom());

    if (newZoom !== this.cy.zoom()) {
      this.cy.zoom({
        level: newZoom,
        renderedPosition: {x: this.cy.width() / 2, y: this.cy.height() / 2}
      });
    }
  }

  private updateSlider() {
    this.zoomSliderValue =
      Math.round(Math.log(this.cy.zoom() / this.cy.minZoom()) / Math.log(this.cy.maxZoom() / this.cy.minZoom()) * 100);
    console.log(this.cy.zoom());
    console.log(this.zoomSliderValue);
  }
}
