import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as d3 from 'd3-selection';

import { DeliveryData, StationData, DeliveryId, StationId } from '../../data.model';
import { Constants } from '../../util/constants';
import { Utils } from '../../util/non-ui-utils';
import { State } from '@app/tracing/state/tracing.reducers';
import { Store } from '@ngrx/store';
import { SetHoverDeliveriesSOA } from '@app/tracing/state/tracing.actions';

export interface StationPropertiesData {
    station: StationData;
    deliveries: Map<DeliveryId, DeliveryData>;
    connectedStations: Map<StationId, StationData>;
}

type LotKey = string;

interface Property {
    label: string;
    value: string;
}

interface Properties {
    [key: string]: Property;
}

interface NodeDatum {
    id: DeliveryId | LotKey;
    name: string;
    station: string;
    deliveryIds: DeliveryId[];
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

    vipProperties: string[] = ['id', 'address', 'country', 'typeOfBusiness', 'score', 'outbreak', 'forward'];
    notListedProps: string[] = ['name', 'incoming', 'outgoing'];
    otherProperties: string[] = [];

    private nodeInData: NodeDatum[];
    private nodeOutData: NodeDatum[];
    private edgeData: EdgeDatum[];
    private lotBased: boolean;
    private deliveriesByLotKey: Map<LotKey, DeliveryId[]>;
    private height: number;
    private selected: NodeDatum;

    private svg: d3.Selection<SVGGElement, any, any, any>;
    private nodesInG: d3.Selection<SVGElement, NodeDatum, any, any>;
    private nodesOutG: d3.Selection<SVGElement, NodeDatum, any, any>;
    private edgesG: d3.Selection<SVGElement, EdgeDatum, any, any>;
    private connectLine: d3.Selection<SVGElement, any, any, any>;

    private static line(x1: number, y1: number, x2: number, y2: number) {
        return 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2;
    }

    constructor(
        public dialogRef: MatDialogRef<StationPropertiesComponent>,
        @Inject(MAT_DIALOG_DATA) public data: StationPropertiesData,
        private store: Store<State>
    ) {
        this.initProperties(this.data.station);

        if (data.station.incoming.length > 0 || data.station.outgoing.length > 0) {
            const ingredientsByLotKey = this.getIngredientsByLotKey();

            this.lotBased = ingredientsByLotKey != null;

            if (this.lotBased) {
                this.initLotBasedData(ingredientsByLotKey);
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
        const hiddenProps = Utils.createSimpleStringSet(this.notListedProps);
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
                value: prop.value + ''
            };
        });

        const vipProps = Utils.createSimpleStringSet(this.vipProperties);
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
        this.hoverDeliveries([]);
    }

    toggleOtherProperties() {
        this.otherPropertiesHidden = !this.otherPropertiesHidden;
    }

    private createDeliveryNode(deliveryId: DeliveryId): NodeDatum {
        const delivery = this.data.deliveries.get(deliveryId);
        const otherStation = this.data.connectedStations.get(delivery.source !== this.data.station.id ? delivery.source : delivery.target);

        return {
            id: deliveryId,
            name: delivery.name,
            station: otherStation.name,
            lot: delivery.lot,
            deliveryIds: [deliveryId],
            date: delivery.dateOut,
            x: null,
            y: null
        };
    }

    private getInternalLotKey(delivery: DeliveryData): LotKey {
        return JSON.stringify([ delivery.originalSource, delivery.name || delivery.id, delivery.lot || delivery.id ]);
    }

    private getIngredientsByLotKey(): Map<LotKey, Set<DeliveryId>> {
        const ingredientsByDelivery: Map<DeliveryId, Set<DeliveryId>> = new Map();

        for (const deliveryId of this.data.station.outgoing) {
            ingredientsByDelivery.set(deliveryId, new Set());
        }

        for (const connection of this.data.station.connections) {
            ingredientsByDelivery.get(connection.target).add(connection.source);
        }

        const ingredientsByLotKey: Map<LotKey, Set<DeliveryId>> = new Map();
        let valid = true;

        ingredientsByDelivery.forEach((ingredientsIds, deliveryId) => {
            const delivery = this.data.deliveries.get(deliveryId);

            if (delivery.lot == null || delivery.name == null) {
                valid = false;
            } else {
                const lotKey = this.getInternalLotKey(delivery);
                if (!ingredientsByLotKey.has(lotKey)) {
                    ingredientsByLotKey.set(lotKey, ingredientsIds);
                } else {
                    const expectedIngredientsIds = ingredientsByLotKey.get(lotKey);
                    const areEqual =
                        ingredientsIds.size === expectedIngredientsIds.size &&
                        Array.from(ingredientsIds).find(id => !expectedIngredientsIds.has(id)) == null;

                    if (!areEqual) {
                        valid = false;
                    }
                }
            }
        });

        return valid ? ingredientsByLotKey : null;
    }

    private initDeliveryBasedData() {
        const nodeInMap: Map<DeliveryId, NodeDatum> = new Map();
        const nodeOutMap: Map<DeliveryId, NodeDatum> = new Map();

        for (const deliveryId of this.data.station.incoming) {
            nodeInMap.set(deliveryId, this.createDeliveryNode(deliveryId));
        }

        for (const deliveryId of this.data.station.outgoing) {
            nodeOutMap.set(deliveryId, this.createDeliveryNode(deliveryId));
        }

        this.nodeInData = Array.from(nodeInMap.values());
        this.nodeOutData = Array.from(nodeOutMap.values());
        this.edgeData = [];

        for (const connection of this.data.station.connections) {
            this.edgeData.push({
                source: nodeInMap.get(connection.source),
                target: nodeOutMap.get(connection.target)
            });
        }
    }

    private initLotBasedData(ingredientsByLotKey: Map<LotKey, Set<DeliveryId>>) {
        this.deliveriesByLotKey = new Map();

        this.data.deliveries.forEach(delivery => {
            const lotKey = this.getInternalLotKey(delivery);
            if (this.deliveriesByLotKey.has(lotKey)) {
                this.deliveriesByLotKey.get(lotKey).push(delivery.id);
            } else {
                this.deliveriesByLotKey.set(lotKey, [delivery.id]);
            }
        });

        const nodeInMap: Map<DeliveryId, NodeDatum> = new Map();
        const nodeOutMap: Map<LotKey, NodeDatum> = new Map();

        for (const deliveryId of this.data.station.incoming) {
            nodeInMap.set(deliveryId, this.createDeliveryNode(deliveryId));
        }

        this.nodeInData = Array.from(nodeInMap.values());
        this.edgeData = [];

        ingredientsByLotKey.forEach((ingredientsIds, lotKey) => {
            const names: Set<string> = new Set();

            const lotDeliveryIds = this.deliveriesByLotKey.get(lotKey);
            for (const deliveryId of lotDeliveryIds) {
                names.add(this.data.deliveries.get(deliveryId).name);
            }

            nodeOutMap.set(lotKey, {
                id: lotKey,
                name: Array.from(names).join('/'),
                station: null,
                lot: this.data.deliveries.get(Array.from(lotDeliveryIds)[0]).lot,
                deliveryIds: lotDeliveryIds,
                date: null,
                x: null,
                y: null
            });
            ingredientsIds.forEach(ingredientId => {
                this.edgeData.push({
                    source: nodeInMap.get(ingredientId),
                    target: nodeOutMap.get(lotKey)
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

        newNodesIn.on('mouseover', (event, inNode: NodeDatum) => {
            updateColor(d3.select(event.currentTarget), true);
            this.hoverDeliveries(inNode.deliveryIds);
        }).on('mouseout', (event) => {
            updateColor(d3.select(event.currentTarget), false);
            this.hoverDeliveries([]);
        });

        newNodesOut.on('mouseover', (event, outNode: NodeDatum) => {
            updateColor(d3.select(event.currentTarget), true);
            this.hoverDeliveries(outNode.deliveryIds);
        }).on('mouseout', (event) => {
            updateColor(d3.select(event.currentTarget), false);
            this.hoverDeliveries([]);
        });
    }

    private updateEdges() {
        // eslint-disable-next-line no-shadow, @typescript-eslint/no-shadow
        const updateColor = (edges: d3.Selection<SVGElement, any, any, any>, hovered: boolean) => {
            edges.attr('stroke', hovered ? 'rgb(0, 0, 255)' : 'rgb(0, 0, 0)');
        };

        const edges = this.edgesG.selectAll<SVGElement, EdgeDatum>('path')
            .data(this.edgeData, d => d.source.id + Constants.ARROW_STRING + d.target.id);
        const newEdges = edges.enter().append<SVGElement>('path').attr('d', d => StationPropertiesComponent.line(
            d.source.x + StationPropertiesComponent.NODE_WIDTH,
            d.source.y + StationPropertiesComponent.NODE_HEIGHT / 2,
            d.target.x,
            d.target.y + StationPropertiesComponent.NODE_HEIGHT / 2
        )).attr('fill', 'none').attr('stroke-width', '6px').attr('cursor', 'default');

        updateColor(newEdges, false);
        edges.exit().remove();

        newEdges.on('mouseover', (event, edge: EdgeDatum) => {
            if (this.selected == null) {
                updateColor(d3.select(event.currentTarget), true);
                this.hoverDeliveries(
                    [].concat(
                        edge.source.deliveryIds,
                        edge.target.deliveryIds
                    ));
            }
        }).on('mouseout', (event) => {
            updateColor(d3.select(event.currentTarget), false);
            this.hoverDeliveries([]);
        });
    }

    private hoverDeliveries(deliveryIds: DeliveryId[]): void {
        this.store.dispatch(new SetHoverDeliveriesSOA({ deliveryIds: deliveryIds }));
    }

    private updateConnectLine() {
        if (this.selected != null) {
            const mousePos = d3.pointer(this.svg.node());

            this.connectLine.attr('d', StationPropertiesComponent.line(
                this.selected.x + StationPropertiesComponent.NODE_WIDTH,
                this.selected.y + StationPropertiesComponent.NODE_HEIGHT / 2,
                mousePos[0],
                mousePos[1]
            ));
        }
    }
}
