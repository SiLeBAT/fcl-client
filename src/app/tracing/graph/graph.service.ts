import { Injectable } from '@angular/core';
import {
    DeliveryData, DataServiceData, ObservedType, NodeShapeType, MergeDeliveriesType, StationData,
    SharedGraphState, SelectedElements
} from '../data.model';
import { DataService } from '../services/data.service';
import { CyNodeData, CyEdgeData, GraphServiceData, GraphElementData, EdgeId, SelectedGraphElements } from './graph.model';
import { Utils } from '../util/non-ui-utils';
import * as _ from 'lodash';

interface CyDataNodes {
    statIdToNodeDataMap: {[key: string]: CyNodeData };
    nodeData: CyNodeData[];
    nodeSel: { [key: string]: boolean };
    idToNodeMap?: { [key: string]: CyNodeData };
}

interface CyDataEdges {
    delIdToEdgeDataMap: {[key: string]: CyEdgeData };
    edgeData: CyEdgeData[];
    edgeSel: { [key: string]: boolean };
}

@Injectable({
    providedIn: 'root'
})
export class GraphService {

    private static readonly DEFAULT_EDGE_COLOR = [0, 0, 0];
    private static readonly DEFAULT_NODE_COLOR = [255, 255, 255];
    private static readonly DEFAULT_GHOST_COLOR = [179, 179, 179];

    private cachedState: SharedGraphState;

    private cachedData: GraphServiceData;

    static updateRelZindex(nodeData: CyNodeData[]) {
        nodeData = nodeData.slice();
        nodeData.sort((n1, n2) => (
            n1.station.score !== n2.station.score ?
            (n1.station.score < n2.station.score ? -1 : 1) :
            (n1.degree !== n2.degree ? (n1.degree < n2.degree ? -1 : 1) : 0)
        ));
        nodeData.forEach((n, i) => {
            n.relZindex = i;
        });
        this.updateAbsZindex(nodeData);
    }

    static updateAbsZindex(nodeData: CyNodeData[]) {
        const nNodes = nodeData.length;
        nodeData.forEach(n => n.zindex = n.relZindex + (n.selected ? nNodes : 0));
    }

    constructor(
        private dataService: DataService
    ) {}

    getData(state: SharedGraphState): GraphServiceData {
        this.applyState(state);
        return { ...this.cachedData };
    }

    createGhostElementDataFromStation(
        ghostStation: StationData,
        state: SharedGraphState,
        graphData: GraphServiceData
    ): GraphElementData {

        const ghostNodeData = this.createGhostNodeData([ghostStation], graphData)[0];
        const ghostEdgeData = this.createGhostEdgeDataFromNode(ghostNodeData, state, graphData);

        return {
            nodeData: [ghostNodeData],
            edgeData: ghostEdgeData
        };
    }

    createGhostElementDataFromDelivery(
        ghostDelivery: DeliveryData,
        state: SharedGraphState,
        graphData: GraphServiceData
    ): GraphElementData {
        const ghostStations: StationData[] = [];
        if (!graphData.statVis[ghostDelivery.source]) {
            ghostStations.push(graphData.statMap[ghostDelivery.source]);
        }
        if (!graphData.statVis[ghostDelivery.target]) {
            ghostStations.push(graphData.statMap[ghostDelivery.target]);
        }
        const ghostNodeData = this.createGhostNodeData(ghostStations, graphData);
        const ghostEdgeData = this.createGhostEdgeDataFromDelivery(ghostDelivery, ghostNodeData, state, graphData);

        return {
            nodeData: ghostNodeData,
            edgeData: [ghostEdgeData]
        };
    }

    private createNodeData(state: SharedGraphState, data: DataServiceData): CyDataNodes {
        let iNode = 0;
        const nodeData: CyNodeData[] = data.stations.filter(s => !s.invisible && !s.contained).map(s => ({
            id: 'N' + iNode++,
            label: s.highlightingInfo.label.join(' / ').replace(/\s+/, ' '),
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
            statIdToNodeDataMap: Utils.createObjectFromArray(nodeData, (n) => n.station.id),
            nodeSel: Utils.createSimpleStringSet(nodeData.filter(n => n.selected).map(n => n.id)),
            idToNodeMap: Utils.createObjectFromArray(nodeData, (n) => n.id)
        };
    }

    private createEdgeData(state: SharedGraphState, data: DataServiceData, cyDataNodes: CyDataNodes): CyDataEdges {

        const edgeData: CyEdgeData[] = [];

        const sourceTargetDelMap: { [key: string]: { [key: string]: DeliveryData[] }} = {};

        const statMap = cyDataNodes.statIdToNodeDataMap;
        const selDel = Utils.createSimpleStringSet(state.selectedElements.deliveries);

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
                                labelWoPrefix: delivery.highlightingInfo.label.join(' / ').replace(/\s+/, ' '),
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
                                weight: delivery.weight,
                                wLabelSpace: false
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
                                labelWoPrefix: labels.length === 1 ? labels[0].replace(/\s+/, ' ') : '',
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
                                weight: _.sum(deliveries.map(d => d.weight)),
                                wLabelSpace: false
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
                        labelWoPrefix: delivery.highlightingInfo.label.join(' / ').replace(/\s+/, ' '),
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
                        weight: delivery.weight,
                        wLabelSpace: false
                    });
                }
            }
        }

        const map: {[key: string]: CyEdgeData } = {};

        cyDataNodes.nodeData.forEach(node => node.degree = 0);
        for (const eData of edgeData) {
            eData.deliveries.forEach(d => {
                map[d.id] = eData;
            });
            if (eData.source !== eData.target) {
                cyDataNodes.idToNodeMap[eData.source].degree += eData.deliveries.length;
                cyDataNodes.idToNodeMap[eData.target].degree += eData.deliveries.length;
            }
        }
        GraphService.updateRelZindex(cyDataNodes.nodeData);
        this.updateEdgeLabels(state, edgeData);

        return {
            edgeData: edgeData,
            delIdToEdgeDataMap: map,
            edgeSel: Utils.createSimpleStringSet(edgeData.filter(n => n.selected).map(n => n.id))
        };
    }

    private createGhostNodeData(ghostStations: StationData[], graphData: GraphServiceData): CyNodeData[] {
        return ghostStations.map((station, index) => ({
            id: 'GN' + index,
            label: station.highlightingInfo.label.join(' / ').replace(/\s+/, ' '),
            ...this.getColorInfo([], GraphService.DEFAULT_GHOST_COLOR),
            isMeta: station.contains && station.contains.length > 0,
            shape: station.highlightingInfo.shape ? station.highlightingInfo.shape : NodeShapeType.CIRCLE,
            station: station,
            score: station.score,
            forward: station.forward,
            backward: station.backward,
            outbreak: station.outbreak,
            crossContamination: station.crossContamination,
            commonLink: station.commonLink,
            killContamination: station.killContamination,
            selected: station.selected,
            observed: station.observed,
            weight: station.weight,
            zindex: (2 * graphData.stations.length) + index
        }));
    }

    private mapDelToEdgeData(deliveries: DeliveryData[], idSuffix: string, source: CyNodeData, target: CyNodeData) {

        const labels: string[] = _.uniq(
            deliveries.map(d => (d.highlightingInfo.label.length > 0) ? d.highlightingInfo.label.join(' / ') : '')
        );

        const edgeData = {
            id: 'GE' + idSuffix,
            labelWoPrefix: labels.length === 1 ? labels[0].replace(/\s+/, ' ') : '',
            ...this.getColorInfo([], GraphService.DEFAULT_GHOST_COLOR),
            source: source.id,
            target: target.id,
            deliveries: deliveries,
            selected: false,
            backward: false,
            forward: false,
            observed: ObservedType.NONE,
            crossContamination: false,
            killContamination: false,
            score: 0,
            weight: 0,
            wLabelSpace: false
        };

        return edgeData;
    }

    private createGhostEdgeDataFromNode(ghostNodeData: CyNodeData, state: SharedGraphState, graphData: GraphServiceData): CyEdgeData[] {
        let ghostEdgeData: CyEdgeData[];
        const ghostDeliveries = this.getGhostDeliveries(ghostNodeData.station, graphData);

        if (state.mergeDeliveriesType === MergeDeliveriesType.NO_MERGE) {

            ghostEdgeData = ghostDeliveries.map(
                (delivery, index) => {

                    const edgeData = this.mapDelToEdgeData(
                        [delivery],
                        '' + index,
                        ghostNodeData.station.id === delivery.source ? ghostNodeData : graphData.statIdToNodeDataMap[delivery.source],
                        ghostNodeData.station.id === delivery.target ? ghostNodeData : graphData.statIdToNodeDataMap[delivery.target]
                    );

                    return edgeData;
                }
            );
            this.updateEdgeLabels(state, ghostEdgeData);

            return ghostEdgeData;
        }
        const deliveriesPerNodePair = Utils.groupRows(ghostDeliveries, [(d) => d.source, (d) => d.target]);

        ghostEdgeData = [].concat(...deliveriesPerNodePair.map(deliveriesForNodePair => {
            const deliveryGroups = this.groupDeliveries(deliveriesForNodePair, state.mergeDeliveriesType);
            const fromNode = (
                deliveryGroups[0][0].source === ghostNodeData.station.id ?
                ghostNodeData :
                graphData.statIdToNodeDataMap[deliveryGroups[0][0].source]
            );
            const toNode = (
                deliveryGroups[0][0].target === ghostNodeData.station.id ?
                ghostNodeData :
                graphData.statIdToNodeDataMap[deliveryGroups[0][0].target]
            );
            return [].concat(...deliveryGroups.map((deliveryGroup, gIndex) => this.mapDelToEdgeData(
                deliveryGroup,
                '' + fromNode.id + toNode.id + 'G' + gIndex,
                fromNode,
                toNode
            )));
        }));
        this.updateEdgeLabels(state, ghostEdgeData);

        return ghostEdgeData;
    }

    private createGhostEdgeDataFromDelivery(
        ghostDelivery: DeliveryData,
        ghostNodeData: CyNodeData[],
        state: SharedGraphState,
        graphData: GraphServiceData
    ): CyEdgeData {
        const idToGhostNodeDataMap = Utils.createObjectFromArray(ghostNodeData, n => n.station.id, n => n);
        const sourceNode = graphData.statIdToNodeDataMap[ghostDelivery.source] || idToGhostNodeDataMap[ghostDelivery.source];
        const targetNode = graphData.statIdToNodeDataMap[ghostDelivery.target] || idToGhostNodeDataMap[ghostDelivery.target];

        const ghostEdgeData = this.mapDelToEdgeData([ghostDelivery], '', sourceNode, targetNode);

        this.updateEdgeLabels(state, [ghostEdgeData]);

        return ghostEdgeData;
    }

    private getGhostDeliveries(ghostStation: StationData, graphData: GraphServiceData): DeliveryData[] {
        const outDeliveries = graphData.getDelById(ghostStation.outgoing).filter(d =>
            ghostStation.id === d.target || !graphData.statMap[d.target].invisible
        );
        const outIdSet = Utils.createSimpleStringSet(ghostStation.outgoing);
        const inDeliveries = graphData.getDelById(ghostStation.incoming).filter(d =>
            !outIdSet[d.id] &&
            (ghostStation.id === d.source || !graphData.statMap[d.source].invisible)
        );

        return [].concat(outDeliveries, inDeliveries);
    }

    private updateLabelSpaceFlags(edges: CyEdgeData[]): void {
        const edgeGroups = this.getNodePairEdgeGroups(edges);
        for (const edgeGroup of edgeGroups) {
            const oneLabelExists = edgeGroup.some(edge => edge.label !== '');
            edgeGroup.forEach(edge => edge.wLabelSpace = oneLabelExists);
        }
    }

    private getNodePairEdgeGroups(edges: CyEdgeData[]): CyEdgeData[][] {
        const edgeGroups: { [key: string]: CyEdgeData[] } = {};

        for (const edge of edges) {
            const nodePairKey = edge.source < edge.target ? edge.source + edge.target : edge.target + edge.source;
            if (!edgeGroups[nodePairKey]) {
                edgeGroups[nodePairKey] = [edge];
            } else {
                edgeGroups[nodePairKey].push(edge);
            }
        }

        return Object.values(edgeGroups);
    }

    updateEdgeLabels(state: SharedGraphState, edges: CyEdgeData[]): void {
        if (state.showMergedDeliveriesCounts) {
            edges.forEach(edge => {
                const nDel = edge.deliveries.length;
                if (nDel > 1) {
                    const nSel = edge.deliveries.filter(d => d.selected).length;
                    edge.label =
                        '[' + ((nSel > 0 && nSel < nDel) ? nSel + '/' : '') + nDel + ']' +
                        (edge.labelWoPrefix !== '' ? ' ' + edge.labelWoPrefix : '');
                } else {
                    edge.label = edge.labelWoPrefix;
                }
            });
        } else {
            edges.forEach(edge => edge.label = edge.labelWoPrefix);
        }
        this.updateLabelSpaceFlags(edges);
    }

    private groupDeliveries(deliveries: DeliveryData[], mergeDeliveriesType: MergeDeliveriesType): DeliveryData[][] {
        if (mergeDeliveriesType === MergeDeliveriesType.MERGE_PRODUCT_WISE) {
            return Utils.groupDeliveriesByProduct(deliveries);
        } else if (mergeDeliveriesType === MergeDeliveriesType.MERGE_LOT_WISE) {
            return Utils.groupDeliveriesByLot(deliveries);
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
            node.shape = station.highlightingInfo.shape ? station.highlightingInfo.shape : NodeShapeType.CIRCLE;
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
        data.nodeData.forEach(node => node.selected = node.station.selected);
        const selectedNodeIds = data.nodeData.filter(node => node.selected).map(node => node.id);

        data.nodeSel = Utils.createSimpleStringSet(data.nodeData.filter(n => n.selected).map(n => n.id));
        data.selectedElements = {
            ...data.selectedElements,
            nodes: selectedNodeIds
        };
    }

    private applyDelSelection(data: GraphServiceData) {
        data.edgeData.forEach(edge => edge.selected = edge.deliveries.some(d => d.selected));
        const selectedEdgeIds = data.edgeData.filter(edge => edge.selected).map(edge => edge.id);

        data.edgeSel = Utils.createSimpleStringSet(data.edgeData.filter(e => e.selected).map(e => e.id));
        data.selectedElements = {
            ...data.selectedElements,
            edges: selectedEdgeIds
        };
    }

    private applyState(state: SharedGraphState) {
        const data = this.dataService.getData(state);
        let newData: GraphServiceData = {
            statIdToNodeDataMap: undefined,
            nodeData: undefined,
            delIdToEdgeDataMap: undefined,
            edgeData: undefined,
            nodeSel: undefined,
            edgeSel: undefined,
            propsChangedFlag: undefined,
            edgeLabelChangedFlag: undefined,
            ghostElements: null,
            hoverEdges: [],
            selectedElements: {
                nodes: [],
                edges: []
            },
            ...(this.cachedData ? this.cachedData : {}),
            ...data
        };

        const nodeCreationRequired =
            !this.cachedState ||
            data.stations !== this.cachedData.stations ||
            this.cachedState.highlightingSettings.invisibleStations !== state.highlightingSettings.invisibleStations;

        const tracPropsChanged =
            !this.cachedState ||
            this.cachedState.tracingSettings !== state.tracingSettings ||
            data.statVis !== this.cachedData.statVis ||
            data.delVis !== this.cachedData.delVis;

        const edgeCreationRequired =
            nodeCreationRequired ||
            data.deliveries !== this.cachedData.deliveries ||
            this.cachedState.highlightingSettings.invisibleDeliveries !== state.highlightingSettings.invisibleDeliveries ||
            this.cachedState.mergeDeliveriesType !== state.mergeDeliveriesType ||
            tracPropsChanged && state.mergeDeliveriesType === MergeDeliveriesType.MERGE_LABEL_WISE;

        const statHighlightSetChanged =
            !this.cachedState ||
            state.highlightingSettings.stations !== this.cachedState.highlightingSettings.stations;

        const delHighlightSetChanged =
            !this.cachedState ||
            state.highlightingSettings.deliveries !== this.cachedState.highlightingSettings.deliveries;

        const nodePropsUpdateRequired =
            !nodeCreationRequired &&
            (tracPropsChanged || statHighlightSetChanged);

        const nodeSelUpdateRequired =
            !nodeCreationRequired &&
            this.cachedState.selectedElements.stations !== state.selectedElements.stations;

        const edgePropsUpdateRequired =
            !edgeCreationRequired &&
            (tracPropsChanged || delHighlightSetChanged);

        const edgeSelUpdateRequired =
            !edgeCreationRequired &&
            this.cachedState.selectedElements.deliveries !== state.selectedElements.deliveries;

        const edgeLabelUpdateRequired =
            !edgeCreationRequired && (
                edgePropsUpdateRequired ||
                this.cachedState.showMergedDeliveriesCounts !== state.showMergedDeliveriesCounts ||
                edgeSelUpdateRequired && state.showMergedDeliveriesCounts
            );

        if (nodeCreationRequired) {
            const nodeData = this.createNodeData(state, data);
            newData = {
                ...newData,
                ...nodeData,
                ...this.createEdgeData(state, data, nodeData),
                propsChangedFlag: {},
                edgeLabelChangedFlag: {}
            };
        } else if (edgeCreationRequired) {
            newData = {
                ...newData,
                ...this.createEdgeData(state, data, newData),
                propsChangedFlag: {},
                edgeLabelChangedFlag: {}
            };
        }

        if (nodePropsUpdateRequired) {
            newData.propsChangedFlag = {};
            this.applyStationProps(newData);
            GraphService.updateRelZindex(newData.nodeData);
        }

        if (edgePropsUpdateRequired) {
            newData.propsChangedFlag = {};
            this.applyDeliveryProps(newData);
        }

        if (nodeSelUpdateRequired) {
            this.applyStatSelection(newData);
            GraphService.updateAbsZindex(newData.nodeData);
        }

        if (edgeSelUpdateRequired) {
            this.applyDelSelection(newData);
        }

        if (edgeLabelUpdateRequired) {
            newData.edgeLabelChangedFlag = {};
            this.updateEdgeLabels(state, newData.edgeData);
        }

        if (
            !this.cachedState ||
            this.cachedState.ghostStation !== state.ghostStation ||
            this.cachedState.ghostDelivery !== state.ghostDelivery
        ) {
            if (state.ghostStation === null && state.ghostDelivery === null) {
                newData.ghostElements = null;
            } else if (state.ghostStation !== null) {
                newData.ghostElements = this.createGhostElementDataFromStation(data.statMap[state.ghostStation], state, newData);
            } else {
                newData.ghostElements = this.createGhostElementDataFromDelivery(data.delMap[state.ghostDelivery], state, newData);
            }
        }

        if (!this.cachedState || this.cachedState.hoverDeliveries !== state.hoverDeliveries) {
            newData.hoverEdges = state.hoverDeliveries.map(delId => newData.delIdToEdgeDataMap[delId].id);
        }

        this.cachedState = { ...state };
        this.cachedData = newData;
    }

    private getEdgeMap(edgeData: CyEdgeData[]): Record<EdgeId, CyEdgeData> {
        const edgeMap: Record<EdgeId, CyEdgeData> = {};
        edgeData.forEach(edge => edgeMap[edge.id] = edge);
        return edgeMap;
    }

    convertGraphSelectionToFclSelection(
        selectedGraphElements: SelectedGraphElements,
        graphServiceData: GraphServiceData,
        maintainOffGraphSelection: boolean
    ): SelectedElements {
        const edgeMap = this.getEdgeMap(graphServiceData.edgeData);
        const selectedElements = {
            stations: selectedGraphElements.nodes.map(nodeId => graphServiceData.idToNodeMap[nodeId].station.id),
            deliveries: [].concat(...selectedGraphElements.edges.map(edgeId => edgeMap[edgeId].deliveries.map(d => d.id)))
        };
        if (maintainOffGraphSelection) {
            // add selected elements that cannot be selected in graph
            selectedElements.stations = [].concat(
                selectedElements.stations, Utils.getStringArrayDifference(
                    graphServiceData.stations.filter(s => s.selected).map(s => s.id),
                    graphServiceData.nodeData.map(n => n.station.id)
            ));
            selectedElements.deliveries = [].concat(
                selectedElements.deliveries, Utils.getStringArrayDifference(
                    graphServiceData.deliveries.filter(d => d.selected).map(s => s.id),
                    [].concat(...graphServiceData.edgeData.map(e => e.deliveries.map(d => d.id)))
            ));
        }
        return selectedElements;
    }
}
