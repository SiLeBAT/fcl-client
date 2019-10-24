import { Injectable } from '@angular/core';
import { BasicGraphState, DeliveryData, DataServiceData, ObservedType, NodeShapeType, MergeDeliveriesType } from '../data.model';
import { DataService } from '../services/data.service';
import { CyNodeData, CyEdgeData, GraphServiceData } from './graph.model';
import { Utils } from '../util/non-ui-utils';
import * as _ from 'lodash';

interface CyDataNodes {
    statIdToNodeDataMap: {[key: string]: CyNodeData };
    nodeData: CyNodeData[];
    nodeSel: { [key: string]: boolean };
}

interface CyDataEdges {
    delIdToEdgeDataMap: {[key: string]: CyEdgeData };
    edgeData: CyEdgeData[];
    edgeSel: { [key: string]: boolean };
}

interface GraphState extends BasicGraphState {
    mergeDeliveriesType: MergeDeliveriesType;
}

interface DeliveryGroup {
    deliveries: DeliveryData[];
}

@Injectable({
    providedIn: 'root'
})
export class GraphService {

    private static readonly DEFAULT_EDGE_COLOR = [0, 0, 0];
    private static readonly DEFAULT_NODE_COLOR = [255, 255, 255];

    private cachedState: GraphState;

    private cachedData: GraphServiceData;

    constructor(
        private dataService: DataService
    ) {}

    getData(state: GraphState): GraphServiceData {
        this.applyState(state);
        return { ...this.cachedData };
    }

    private createNodeData(state: GraphState, data: DataServiceData): CyDataNodes {
        let iNode = 0;
        const nodeData: CyNodeData[] = data.stations.filter(s => !s.invisible && !s.contained).map(s => ({
            id: 'N' + iNode++,
            label: s.highlightingInfo.label.length > 0 ? s.highlightingInfo.label.join(' / ') : '',
            ...this.getColorInfo(s.highlightingInfo.color, GraphService.DEFAULT_NODE_COLOR),
            isMeta: s.contains && s.contains.length > 0,
            shape: s.highlightingInfo.shape ? s.highlightingInfo.shape : NodeShapeType.CIRCLE,
            station: s,
            score: s.score,
            forward: s.forward,
            backward: s.backward,
            outbreak: s.outbreak,
            crossContamination: s.crossContamination,
            commonLink: s.commonLink,
            killContamination: s.killContamination,
            selected: s.selected,
            observed: s.observed,
            weight: s.weight
        }));
        return {
            nodeData: nodeData,
            statIdToNodeDataMap: Utils.createObjectMap(nodeData, (n) => n.station.id),
            nodeSel: Utils.createStringSet(nodeData.filter(n => n.selected).map(n => n.id))
        };
    }

    private createEdgeData(state: GraphState, data: DataServiceData, cyDataNodes: CyDataNodes): CyDataEdges {

        const edgeData: CyEdgeData[] = [];

        const sourceTargetDelMap: { [key: string]: { [key: string]: DeliveryData[] }} = {};

        const statMap = cyDataNodes.statIdToNodeDataMap;
        const selDel = Utils.createStringSet(state.selectedElements.deliveries);

        if (state.mergeDeliveriesType !== MergeDeliveriesType.NO_MERGE) {

            for (const delivery of data.deliveries.filter(d => !d.invisible)) {
                const sourceData = statMap[delivery.source];
                const targetData = statMap[delivery.target];
                if (sourceData && targetData) {
                    let targetMap = sourceTargetDelMap[sourceData.id];
                    if (!targetMap) {
                        targetMap = { [targetData.id]: [delivery] };
                        sourceTargetDelMap[sourceData.id] = targetMap;
                    } else {
                        const deliveries = targetMap[targetData.id];
                        if (!deliveries) {
                            targetMap[targetData.id] = [delivery];
                        } else {
                            deliveries.push(delivery);
                        }
                    }
                }
            }
            let iEdge = 0;
            for (const sourceDataId of Object.keys(sourceTargetDelMap)) {
                const targetMap = sourceTargetDelMap[sourceDataId];
                for (const targetDataId of Object.keys(targetMap)) {
                    const deliveriesForNodePair = targetMap[targetDataId];

                    const deliveryGroups = this.groupDeliveries(deliveriesForNodePair, state.mergeDeliveriesType);
                    for (const deliveries of deliveryGroups) {
                        if (deliveries.length === 1) {
                            const delivery = deliveries[0];
                            const selected = !!selDel[delivery.id];
                            edgeData.push({
                                id: 'E' + iEdge++,
                                label: delivery.highlightingInfo.label.length > 0 ? delivery.highlightingInfo.label.join(' / ') : '',
                                ...this.getColorInfo(delivery.highlightingInfo.color, GraphService.DEFAULT_EDGE_COLOR),
                                source: sourceDataId,
                                target: targetDataId,
                                deliveries: [delivery],
                                selected: selected,
                                backward: delivery.backward,
                                forward: delivery.forward,
                                observed: delivery.observed,
                                crossContamination: delivery.crossContamination,
                                killContamination: delivery.killContamination,
                                score: delivery.score,
                                weight: delivery.weight
                            });
                        } else {
                            const observedTypes = _.uniq(deliveries.filter(d => d.observed !== ObservedType.NONE).map(d => d.observed));

                            const observedType =
                                observedTypes.some(t => ObservedType.FULL) ?
                                ObservedType.FULL :
                                (
                                    observedTypes.some(t => ObservedType.BACKWARD) ?
                                    (
                                        observedTypes.some(t => ObservedType.FORWARD) ?
                                        ObservedType.FULL :
                                        ObservedType.BACKWARD
                                    ) :
                                    (
                                        observedTypes.some(t => ObservedType.FORWARD) ?
                                        ObservedType.FORWARD :
                                        ObservedType.NONE
                                    )
                                )
                            ;

                            const labels: string[] = _.uniq(
                                deliveries.map(d => (d.highlightingInfo.label.length > 0) ? d.highlightingInfo.label.join(' / ') : '')
                            );
                            edgeData.push({
                                id: 'E' + iEdge++,
                                label: labels.length === 1 ? labels[0] : '',
                                ...this.getColorInfo(
                                    this.mergeColors(deliveries.map(d => d.highlightingInfo.color)),
                                    GraphService.DEFAULT_EDGE_COLOR
                                ),
                                source: sourceDataId,
                                target: targetDataId,
                                deliveries: deliveries,
                                selected: deliveries.some(d => !!selDel[d.id]),
                                backward: deliveries.some(d => d.backward),
                                forward: deliveries.some(d => d.forward),
                                observed: observedType,
                                crossContamination: deliveries.some(d => d.crossContamination),
                                killContamination: deliveries.some(d => d.killContamination),
                                score: _.max(deliveries.map(d => d.score)),
                                weight: _.sum(deliveries.map(d => d.weight))
                            });
                        }
                    }
                }

            }

        } else {
            let iEdge = 0;
            for (const delivery of data.deliveries.filter(d => !d.invisible)) {
                const sourceData = statMap[delivery.source];
                const targetData = statMap[delivery.target];

                if (sourceData && targetData) {
                    edgeData.push({
                        id: 'E' + iEdge++,
                        label: delivery.highlightingInfo.label.length > 0 ? delivery.highlightingInfo.label.join(' / ') : '',
                        ...this.getColorInfo(delivery.highlightingInfo.color, GraphService.DEFAULT_EDGE_COLOR),
                        source: sourceData.id,
                        target: targetData.id,
                        deliveries: [delivery],
                        selected: delivery.selected,
                        backward: delivery.backward,
                        forward: delivery.forward,
                        observed: delivery.observed,
                        crossContamination: delivery.crossContamination,
                        killContamination: delivery.killContamination,
                        score: delivery.score,
                        weight: delivery.weight
                    });
                }
            }
        }

        const map: {[key: string]: CyEdgeData } = {};
        for (const eData of edgeData) {
            eData.deliveries.forEach(d => {
                map[d.id] = eData;
            });
        }
        return {
            edgeData: edgeData,
            delIdToEdgeDataMap: map,
            edgeSel: Utils.createStringSet(edgeData.filter(n => n.selected).map(n => n.id))
        };
    }

    private groupDeliveries(deliveries: DeliveryData[], mergeDeliveriesType: MergeDeliveriesType): DeliveryData[][] {
        if (mergeDeliveriesType === MergeDeliveriesType.MERGE_PRODUCT_WISE) {
            return Utils.groupDeliveryByProduct(deliveries);
        } else if (mergeDeliveriesType === MergeDeliveriesType.MERGE_LOT_WISE) {
            return Utils.groupDeliveryByLot(deliveries);
        } else if (mergeDeliveriesType === MergeDeliveriesType.MERGE_LABEL_WISE) {
            return Utils.groupRows(deliveries, [(d: DeliveryData) => d.highlightingInfo.label.join('/')]);
        } else if (mergeDeliveriesType === MergeDeliveriesType.MERGE_ALL) {
            return [deliveries];
        } else if (mergeDeliveriesType === MergeDeliveriesType.NO_MERGE) {
            return deliveries.map(d => [d]);
        }
    }

    private mergeColors(colors: number[][][]): number[][] {
        return _.uniqWith([].concat(...colors),
            (c1: number[], c2: number[]) => c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2]
        );
    }

    private getColorInfo(colors: number[][], defaultColor: number[]): {
        stopColors: string,
        stopPositions: string
    } {
        if (colors.length === 0) {
            colors = [defaultColor];
        }
        const repeat = (s: string) => s + ' ' + s;
        const stopColors = colors.map(c => repeat(this.mapColor(c))).join(' ');
        const n = colors.length;
        const stopPositions = colors.map((c, i) => `${100 * i / n}% ${100 * (i + 1) / n}%`).join(' ');

        return {
            stopColors: stopColors,
            stopPositions: stopPositions
        };
    }

    private mapColor(color: number[]): string {
        return `rgb(${color[0]},${color[1]},${color[2]})`;
    }

    private applyStationProps(data: GraphServiceData) {
        for (const node of data.nodeData) {
            const station = node.station;
            const colorInfo = this.getColorInfo(station.highlightingInfo.color, GraphService.DEFAULT_NODE_COLOR);
            node.stopColors = colorInfo.stopColors;
            node.stopPositions = colorInfo.stopPositions;
            node.backward = station.backward;
            node.commonLink = station.commonLink;
            node.crossContamination = station.crossContamination;
            node.forward = station.forward;
            node.killContamination = station.killContamination;
            node.observed = station.observed;
            node.outbreak = station.outbreak;
            node.score = station.score;
        }
    }

    private applyDeliveryProps(data: GraphServiceData) {
        for (const edge of data.edgeData) {
            const aggregatedProps = this.aggregateDelProps(edge.deliveries);
            const colorInfo = this.getColorInfo(
                (
                    edge.deliveries.length > 0 ?
                    this.mergeColors(edge.deliveries.map(d => d.highlightingInfo.color)) :
                    edge.deliveries[0].highlightingInfo.color
                ),
                GraphService.DEFAULT_EDGE_COLOR
            );
            edge.stopColors = colorInfo.stopColors;
            edge.stopPositions = colorInfo.stopPositions;
            edge.backward = aggregatedProps.backward;
            edge.crossContamination = aggregatedProps.crossContamination;
            edge.forward = aggregatedProps.forward;
            edge.killContamination = aggregatedProps.killContamination;
            edge.observed = aggregatedProps.observed;
            edge.score = aggregatedProps.score;
        }
    }

    private aggregateDelProps(deliveries: DeliveryData[]): {
        backward: boolean,
        crossContamination: boolean,
        forward: boolean,
        killContamination: boolean,
        observed: ObservedType,
        score: number,
        weight: number
    } {
        if (deliveries.length === 1) {
            const delivery = deliveries[0];
            return {
                backward: delivery.backward,
                forward: delivery.forward,
                observed: delivery.observed,
                crossContamination: delivery.crossContamination,
                killContamination: delivery.killContamination,
                score: delivery.score,
                weight: delivery.weight
            };
        } else {
            const observedTypes = _.uniq(deliveries.filter(d => d.observed !== ObservedType.NONE).map(d => d.observed));

            const observedType =
                observedTypes.some(t => ObservedType.FULL) ?
                ObservedType.FULL :
                (
                    observedTypes.some(t => ObservedType.BACKWARD) ?
                    (
                        observedTypes.some(t => ObservedType.FORWARD) ?
                        ObservedType.FULL :
                        ObservedType.BACKWARD
                    ) :
                    (
                        observedTypes.some(t => ObservedType.FORWARD) ?
                        ObservedType.FORWARD :
                        ObservedType.NONE
                    )
                )
            ;

            return {
                backward: deliveries.some(d => d.backward),
                forward: deliveries.some(d => d.forward),
                observed: observedType,
                crossContamination: deliveries.some(d => d.crossContamination),
                killContamination: deliveries.some(d => d.killContamination),
                score: _.max(deliveries.map(d => d.score)),
                weight: _.sum(deliveries.map(d => d.weight))
            };
        }
    }

    private applyStatSelection(data: GraphServiceData) {
        data.nodeData.forEach(nodeData => {
            nodeData.selected = nodeData.station.selected;
        });
        data.nodeSel = Utils.createStringSet(data.nodeData.filter(n => n.selected).map(n => n.id));
    }

    private applyDelSelection(data: GraphServiceData) {
        data.edgeData.forEach(edgeData => {
            edgeData.selected = edgeData.deliveries.some(d => d.selected);
        });
        data.edgeSel = Utils.createStringSet(data.edgeData.filter(e => e.selected).map(e => e.id));
    }

    private applyState(state: GraphState) {
        const data = this.dataService.getData(state);
        let newData: GraphServiceData = {
            statIdToNodeDataMap: undefined,
            nodeData: undefined,
            delIdToEdgeDataMap: undefined,
            edgeData: undefined,
            nodeSel: undefined,
            edgeSel: undefined,
            propsChangedFlag: undefined,
            ...(this.cachedData ? this.cachedData : {}),
            ...data
        };
        const nodesChanged =
            !this.cachedState ||
            data.stations !== this.cachedData.stations ||
            this.cachedState.highlightingSettings.invisibleStations !== state.highlightingSettings.invisibleStations;

        const edgesChanged =
            nodesChanged ||
            data.deliveries !== this.cachedData.deliveries ||
            this.cachedState.mergeDeliveriesType !== state.mergeDeliveriesType;

        const nodePropsChanged =
            !nodesChanged &&
            this.cachedState.tracingSettings !== state.tracingSettings;

        const nodeSelChanged =
            !nodesChanged &&
            this.cachedState.selectedElements.stations !== state.selectedElements.stations;

        const edgePropsChanged =
            !edgesChanged &&
            this.cachedState.tracingSettings !== state.tracingSettings;

        const edgeSelChanged =
            !edgesChanged &&
            this.cachedState.selectedElements.deliveries !== state.selectedElements.deliveries;

        if (nodesChanged) {
            const nodeData = this.createNodeData(state, data);
            newData = {
                ...newData,
                ...nodeData,
                ...this.createEdgeData(state, data, nodeData),
                propsChangedFlag: {}
            };
        } else if (edgesChanged || (edgePropsChanged && state.mergeDeliveriesType === MergeDeliveriesType.MERGE_LABEL_WISE)) {
            newData = {
                ...newData,
                ...this.createEdgeData(state, data, newData),
                propsChangedFlag: {}
            };
        }

        if (nodePropsChanged) {
            newData.propsChangedFlag = {};
            this.applyStationProps(newData);
        }
        if (edgePropsChanged && state.mergeDeliveriesType !== MergeDeliveriesType.MERGE_LABEL_WISE) {
            newData.propsChangedFlag = {};
            this.applyDeliveryProps(newData);
        }

        if (nodeSelChanged) {
            this.applyStatSelection(newData);
        }

        if (edgeSelChanged) {
            this.applyDelSelection(newData);
        }

        this.cachedState = { ...state };
        this.cachedData = newData;
    }
}
