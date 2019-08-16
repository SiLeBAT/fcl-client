import { Injectable } from '@angular/core';
import { BasicGraphState, DeliveryData, DataServiceData, ObservedType } from '../data.model';
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
    mergeDeliveries: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class GraphService {

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
            label: s.name || '',
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

        if (state.mergeDeliveries) {

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
                    const deliveries = targetMap[targetDataId];

                    if (deliveries.length === 1) {
                        const delivery = deliveries[0];
                        const selected = !!selDel[delivery.id];
                        edgeData.push({
                            id: 'E' + iEdge++,
                            label: delivery.name,
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

                        const labels: string[] = _.uniq(deliveries.map(d => d.name));
                        edgeData.push({
                            id: 'E' + iEdge++,
                            label: labels.length === 1 ? labels[0] : undefined,
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

        } else {
            let iEdge = 0;
            for (const delivery of data.deliveries.filter(d => !d.invisible)) {
                const sourceData = statMap[delivery.source];
                const targetData = statMap[delivery.target];

                if (sourceData && targetData) {
                    edgeData.push({
                        id: 'E' + iEdge++,
                        label: delivery.name,
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

    private applyStationProps(data: GraphServiceData) {
        for (const node of data.nodeData) {
            const station = node.station;
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
            this.cachedState.mergeDeliveries !== state.mergeDeliveries;

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
        } else if (edgesChanged) {
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
        if (edgePropsChanged) {
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
