import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as d3 from 'd3';
import { Subject } from 'rxjs';

import { DeliveryData, StationData, Connection } from '../../data.model';
import { Constants } from '../../util/constants';
import { Utils } from '../../util/non-ui-utils';

export interface StationPropertiesData {
    station: StationData;
    deliveries: Map<string, DeliveryData>;
    connectedStations: Map<string, StationData>;
    hoverDeliveriesSubject: Subject<string[]>;
}

interface Property {
    label: string;
    value: string;
}

interface Properties {
    [key: string]: Property;
}

interface NodeDatum {
    id: string;
    name: string;
    station: string;
    lot: string;
    date: string;
    x: number;
    y: number;
}

interface EdgeDatum {
    source: NodeDatum;
    target: NodeDatum;
}

class DataOptimizer {

    private inIds: string[];
    private inConnections: Map<string, string[]>;
    private outIds: string[];
    private outConnections: Map<string, string[]>;

    constructor(private nodeInData: NodeDatum[], private nodeOutData: NodeDatum[], private edgeData: EdgeDatum[]) {
        this.inIds = [];
        this.inConnections = new Map();
        this.outIds = [];
        this.outConnections = new Map();

        for (const n of nodeInData) {
            this.inIds.push(n.id);
            this.inConnections.set(n.id, []);
        }

        for (const n of nodeOutData) {
            this.outIds.push(n.id);
            this.outConnections.set(n.id, []);
        }

        for (const e of edgeData) {
            this.inConnections.get(e.source.id).push(e.target.id);
            this.outConnections.get(e.target.id).push(e.source.id);
        }
    }

    optimize() {
        this.step(this.inIds, this.inConnections, this.outIds);
        this.step(this.outIds, this.outConnections, this.inIds);

        const nodesInById: Map<string, NodeDatum> = new Map();
        const nodesOutById: Map<string, NodeDatum> = new Map();

        for (const n of this.nodeInData) {
            nodesInById.set(n.id, n);
        }

        for (const n of this.nodeOutData) {
            nodesOutById.set(n.id, n);
        }

        this.inIds.forEach((id, index) => {
            this.nodeInData[index] = nodesInById.get(id);
        });

        this.outIds.forEach((id, index) => {
            this.nodeOutData[index] = nodesOutById.get(id);
        });
    }

    private step(ids1: string[], connections1: Map<string, string[]>, ids2: string[]) {
        const indices2: Map<string, number> = new Map();

        ids2.forEach((id, index) => indices2.set(id, index));

        const centers1: Map<string, number> = new Map();

        for (const id of ids1) {
            const connections = connections1.get(id);
            let sum = 0;

            for (const c of connections) {
                sum += indices2.get(c);
            }

            centers1.set(id, connections.length > 0 ? sum / connections.length : Infinity);
        }

        const sortedCenters1 = Array.from(centers1.entries());

        sortedCenters1.sort((a, b) => a[1] - b[1]);
        sortedCenters1.forEach((center, index) => {
            ids1[index] = center[0];
        });
    }
}

@Component({
    selector: 'fcl-station-properties',
    templateUrl: './station-properties.component.html',
    styleUrls: ['./station-properties.component.scss']
})
export class StationPropertiesComponent implements OnInit, OnDestroy {

    private static readonly SVG_WIDTH = 600;
    private static readonly NODE_PADDING = 15;
    private static readonly NODE_WIDTH = 200;
    private static readonly NODE_HEIGHT = 50;
    private static readonly TEXT_X_PADDING = 5;
    private static readonly INCOMING_HEADER = 'Incoming Deliveries:';
    private static readonly OUTGOING_HEADER = 'Outgoing Deliveries:';
    private static readonly DELIVERIES_HEADER_HEIGHT = 14;

    @ViewChild('inOutConnector', { static: true }) inOutConnector: ElementRef;

    otherPropertiesHidden = true;
    properties: Properties = {};

    vipProperties: string[] = ['id', 'Address', 'Country', 'typeOfBusiness', 'score', 'outbreak', 'forward'];
    notListedProps: string[] = ['name', 'incoming', 'outgoing'];
    otherProperties: string[] = [];

    private nodeInData: NodeDatum[];
    private nodeOutData: NodeDatum[];
    private edgeData: EdgeDatum[];
    private lotBased: boolean;
    private deliveriesByLot: Map<string, string[]>;
    private height: number;
    private selected: NodeDatum;

    private svg: d3.Selection<SVGGElement, any, any, any>;
    private nodesInG: d3.Selection<SVGElement, any, any, any>;
    private nodesOutG: d3.Selection<SVGElement, any, any, any>;
    private edgesG: d3.Selection<SVGElement, any, any, any>;
    private connectLine: d3.Selection<SVGElement, any, any, any>;

    private static line(x1: number, y1: number, x2: number, y2: number) {
        return 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2;
    }

    constructor(public dialogRef: MatDialogRef<StationPropertiesComponent>, @Inject(MAT_DIALOG_DATA) public data: StationPropertiesData) {
        this.initProperties(this.data.station);

        if (data.station.incoming.length > 0 || data.station.outgoing.length > 0) {
            const ingredientsByLot = this.getIngredientsByLot();

            this.lotBased = ingredientsByLot != null;

            if (this.lotBased) {
                this.initLotBasedData(ingredientsByLot);
            } else {
                this.initDeliveryBasedData();
            }

            const optimizer = new DataOptimizer(this.nodeInData, this.nodeOutData, this.edgeData);

            optimizer.optimize();

            let yIn = 1 + StationPropertiesComponent.DELIVERIES_HEADER_HEIGHT + StationPropertiesComponent.NODE_PADDING;
            let yOut = yIn;

            for (const n of this.nodeInData) {
                n.x = 1;
                n.y = yIn;
                yIn += StationPropertiesComponent.NODE_HEIGHT + StationPropertiesComponent.NODE_PADDING;
            }

            for (const n of this.nodeOutData) {
                n.x = StationPropertiesComponent.SVG_WIDTH - StationPropertiesComponent.NODE_WIDTH - 1;
                n.y = yOut;
                yOut += StationPropertiesComponent.NODE_HEIGHT + StationPropertiesComponent.NODE_PADDING;
            }

            this.height = Math.max(yIn, yOut) - StationPropertiesComponent.NODE_PADDING + 1;
        }
    }

    private initProperties(station: StationData): void {
        const properties: Properties = {};
        const hiddenProps = Utils.createStringSet(this.notListedProps);
        Object.keys(station).filter(key => Constants.PROPERTIES.has(key) && !hiddenProps[key])
        .forEach(key => {
            const value = station[key];
            properties[key] = {
                label: Constants.PROPERTIES.get(key).name,
                value: value != null ? value + '' : ''
            };
        });

        station.properties.forEach(prop => {
            properties[prop.name] = {
                label: this.convertPropNameToLabel(prop.name),
                value: prop.value != null ? prop.value : ''
            };
        });

        const vipProps = Utils.createStringSet(this.vipProperties);
        this.otherProperties = Object.keys(properties).filter(key => !vipProps[key]).slice();
        this.otherProperties.sort();
        // add default for missing props
        this.vipProperties.filter(key => !properties[key]).forEach(key => {
            const tmp = Constants.PROPERTIES.get(key);
            properties[key] = {
                label: tmp ? tmp.name : this.convertPropNameToLabel(key),
                value: ''
            };
        });
        this.properties = properties;
    }

    private capitelizeFirstLetter(str: string): string {
        return str && str.length > 0 ? str.charAt(0).toUpperCase() + str.slice(1) : str;
    }

    private decamelize(str: string): string {
        const separator = ' ';
        return str
            .replace(/([a-z\d])([A-Z])/g, '$1' + separator + '$2')
            .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1' + separator + '$2');
    }

    private convertPropNameToLabel(str: string): string {
        return this.capitelizeFirstLetter(this.decamelize(str));
    }

    ngOnInit() {
        if (this.height != null) {
            this.svg = d3
        .select(this.inOutConnector.nativeElement).append<SVGGElement>('svg')
        .attr('display', 'block')
        .attr('width', StationPropertiesComponent.SVG_WIDTH).attr('height', this.height);

            const defs = this.svg.append<SVGElement>('defs');
            const g = this.svg.append<SVGElement>('g');

            defs.append('marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 7)
        .attr('markerWidth', 3.5)
        .attr('markerHeight', 3.5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', 'rgb(0, 0, 0)');

            this.connectLine = g.append<SVGElement>('path').attr('marker-end', 'url(#end-arrow)').attr('visibility', 'hidden')
        .attr('fill', 'none').attr('stroke', 'rgb(0, 0, 0)').attr('stroke-width', '6px').attr('cursor', 'default');
            this.edgesG = g.append<SVGElement>('g');
            this.nodesInG = g.append<SVGElement>('g');
            this.nodesOutG = g.append<SVGElement>('g');

            this.addNodesHeader();
            this.addNodes();
            this.updateEdges();

            d3.select('body').on('mousemove', () => this.updateConnectLine());
        }
    }

    ngOnDestroy() {
        d3.select('body').on('mousemove', null);
        this.data.hoverDeliveriesSubject.next([]);
    }

    toggleOtherProperties() {
        this.otherPropertiesHidden = !this.otherPropertiesHidden;
    }

    private createNode(id: string): NodeDatum {
        const delivery = this.data.deliveries.get(id);
        const otherStation = this.data.connectedStations.get(delivery.source !== this.data.station.id ? delivery.source : delivery.target);

        return {
            id: id,
            name: delivery.name,
            station: otherStation.name,
            lot: delivery.lot,
            date: delivery.date,
            x: null,
            y: null
        };
    }

    private getIngredientsByLot(): Map<string, Set<string>> {
        const ingredientsByDelivery: Map<string, Set<string>> = new Map();

        for (const id of this.data.station.outgoing) {
            ingredientsByDelivery.set(id, new Set());
        }

        for (const c of this.data.station.connections) {
            ingredientsByDelivery.get(c.target).add(c.source);
        }

        const ingredientsByLot: Map<string, Set<string>> = new Map();
        let valid = true;

        ingredientsByDelivery.forEach((value, key) => {
            const lot = this.data.deliveries.get(key).lot;

            if (lot == null) {
                valid = false;
            } else {
                if (!ingredientsByLot.has(lot)) {
                    ingredientsByLot.set(lot, value);
                } else {
                    const oldValue = ingredientsByLot.get(lot);
                    const areEqual = value.size === oldValue.size && Array.from(value).find(v => !oldValue.has(v)) == null;

                    if (!areEqual) {
                        valid = false;
                    }
                }
            }
        });

        return valid ? ingredientsByLot : null;
    }

    private initDeliveryBasedData() {
        const nodeInMap: Map<string, NodeDatum> = new Map();
        const nodeOutMap: Map<string, NodeDatum> = new Map();

        for (const id of this.data.station.incoming) {
            nodeInMap.set(id, this.createNode(id));
        }

        for (const id of this.data.station.outgoing) {
            nodeOutMap.set(id, this.createNode(id));
        }

        this.nodeInData = Array.from(nodeInMap.values());
        this.nodeOutData = Array.from(nodeOutMap.values());
        this.edgeData = [];

        for (const c of this.data.station.connections) {
            this.edgeData.push({
                source: nodeInMap.get(c.source),
                target: nodeOutMap.get(c.target)
            });
        }
    }

    private initLotBasedData(ingredientsByLot: Map<string, Set<string>>) {
        this.deliveriesByLot = new Map();

        this.data.deliveries.forEach(d => {
            if (this.deliveriesByLot.has(d.lot)) {
                this.deliveriesByLot.get(d.lot).push(d.id);
            } else {
                this.deliveriesByLot.set(d.lot, [d.id]);
            }
        });

        const nodeInMap: Map<string, NodeDatum> = new Map();
        const nodeOutMap: Map<string, NodeDatum> = new Map();

        for (const id of this.data.station.incoming) {
            nodeInMap.set(id, this.createNode(id));
        }

        this.nodeInData = Array.from(nodeInMap.values());
        this.edgeData = [];

        ingredientsByLot.forEach((ingredients, lot) => {
            const names: Set<string> = new Set();

            for (const d of this.deliveriesByLot.get(lot)) {
                names.add(this.data.deliveries.get(d).name);
            }

            nodeOutMap.set(lot, {
                id: lot,
                name: Array.from(names).join('/'),
                station: null,
                lot: lot,
                date: null,
                x: null,
                y: null
            });
            ingredients.forEach(d => {
                this.edgeData.push({
                    source: nodeInMap.get(d),
                    target: nodeOutMap.get(lot)
                });
            });
        });

        this.nodeOutData = Array.from(nodeOutMap.values());
    }

    private addNodesHeader(): void {

        const headers = [
            {
                x: StationPropertiesComponent.TEXT_X_PADDING,
                label: StationPropertiesComponent.INCOMING_HEADER
            },
            {
                x: StationPropertiesComponent.SVG_WIDTH - StationPropertiesComponent.NODE_WIDTH - 1 +
                    StationPropertiesComponent.TEXT_X_PADDING,
                label: StationPropertiesComponent.OUTGOING_HEADER
            }
        ];

        const nodesHeaderG = this.svg.append<SVGElement>('g');

        headers.forEach(header => {
            const text = nodesHeaderG.append('text').attr('text-anchor', 'left');
            text.append('tspan').attr('x', header.x).attr('dy', 15).attr('font-size', '14px').attr('font-weight', 'bold')
                .text(header.label);
        });
    }

    private addNodes() {
        const updateColor = (nodes: d3.Selection<SVGElement, any, any, any>, hovered: boolean) => {
            nodes.selectAll('rect')
                .attr('fill', hovered ? 'rgb(128, 128, 255)' : 'rgb(255, 255, 255)')
                .attr('stroke', hovered ? 'rgb(0, 0, 255)' : 'rgb(0, 0, 0)');
        };
        const initRectAndText = (nodes: d3.Selection<SVGElement, NodeDatum, any, any>, isIncoming: boolean) => {
            nodes.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
            nodes.append('rect').attr('stroke-width', '2px')
                .attr('width', StationPropertiesComponent.NODE_WIDTH).attr('height', StationPropertiesComponent.NODE_HEIGHT);

            updateColor(nodes, false);

            const text = nodes.append('text').attr('text-anchor', 'left');

            text.append('tspan').attr('x', StationPropertiesComponent.TEXT_X_PADDING).attr('dy', 15).attr('font-size', '14px')
                .text(d => d.lot != null ? d.name + ' (' + d.lot + ')' : d.name);
            text.filter(d => d.station != null).append('tspan').attr('x', StationPropertiesComponent.TEXT_X_PADDING)
                .attr('dy', 15).attr('font-size', '14px')
                .text(d => isIncoming ? 'from: ' + d.station : 'to: ' + d.station);
            text.filter(d => d.date != null).append('tspan').attr('x', StationPropertiesComponent.TEXT_X_PADDING)
            .attr('dy', 15).attr('font-size', '12px').text(d => d.date);
        };

        const newNodesIn = this.nodesInG.selectAll<SVGElement, NodeDatum>('g').data(this.nodeInData, d => d.id).enter()
      .append<SVGElement>('g');
        const newNodesOut = this.nodesOutG.selectAll<SVGElement, NodeDatum>('g').data(this.nodeOutData, d => d.id).enter()
      .append<SVGElement>('g');

        initRectAndText(newNodesIn, true);
        initRectAndText(newNodesOut, false);

        const self = this;

        newNodesIn.on('mouseover', function (d) {
            updateColor(d3.select(this), true);
            self.data.hoverDeliveriesSubject.next([d.id]);
        }).on('mouseout', function () {
            updateColor(d3.select(this), false);
            self.data.hoverDeliveriesSubject.next([]);
        });

        newNodesOut.on('mouseover', function (d) {
            updateColor(d3.select(this), true);
            self.data.hoverDeliveriesSubject.next(self.lotBased ? self.deliveriesByLot.get(d.id) : [d.id]);
        }).on('mouseout', function () {
            updateColor(d3.select(this), false);
            self.data.hoverDeliveriesSubject.next([]);
        });
    }

    private updateEdges() {
    // tslint:disable-next-line:no-shadowed-variable
        const updateColor = (edges: d3.Selection<SVGElement, any, any, any>, hovered: boolean) => {
            edges.attr('stroke', hovered ? 'rgb(0, 0, 255)' : 'rgb(0, 0, 0)');
        };

        const edges = this.edgesG.selectAll<SVGElement, EdgeDatum>('path')
      .data(this.edgeData, d => d.source.id + Constants.ARROW_STRING + d.target.id);
        const newEdges = edges.enter().append<SVGElement>('path').attr('d', d => {
      return StationPropertiesComponent.line(
        d.source.x + StationPropertiesComponent.NODE_WIDTH,
        d.source.y + StationPropertiesComponent.NODE_HEIGHT / 2,
        d.target.x,
        d.target.y + StationPropertiesComponent.NODE_HEIGHT / 2
      );
    }).attr('fill', 'none').attr('stroke-width', '6px').attr('cursor', 'default');

        updateColor(newEdges, false);
        edges.exit().remove();

        const self = this;

        newEdges.on('mouseover', function (e) {
            if (self.selected == null) {
                updateColor(d3.select(this), true);
                self.data.hoverDeliveriesSubject.next([].concat(
                    [e.source.id],
                    self.lotBased ? self.deliveriesByLot.get(e.target.id) : [e.target.id]
                ));
            }
        }).on('mouseout', function () {
            updateColor(d3.select(this), false);
            self.data.hoverDeliveriesSubject.next([]);
        });
    }

    private updateConnectLine() {
        if (this.selected != null) {
            const mousePos = d3.mouse(this.svg.node());

            this.connectLine.attr('d', StationPropertiesComponent.line(
        this.selected.x + StationPropertiesComponent.NODE_WIDTH,
        this.selected.y + StationPropertiesComponent.NODE_HEIGHT / 2,
        mousePos[0],
        mousePos[1]
      ));
        }
    }
}
