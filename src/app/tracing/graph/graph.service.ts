import { Injectable } from "@angular/core";
import {
    DeliveryData,
    DataServiceData,
    NodeShapeType,
    MergeDeliveriesType,
    StationData,
    SharedGraphState,
    SelectedElements,
    DeliveryId,
    StationId,
    Color,
} from "../data.model";
import { DataService } from "../services/data.service";
import {
    CyNodeData,
    CyEdgeData,
    GraphServiceData,
    GraphElementData,
    EdgeId,
    SelectedGraphElements,
    NodeId,
} from "./graph.model";
import { concat, Utils } from "../util/non-ui-utils";
import * as _ from "lodash";

interface CyDataNodes {
    statIdToNodeDataMap: { [key: string]: CyNodeData };
    nodeData: CyNodeData[];
    nodeSel: { [key: string]: boolean };
    idToNodeMap: { [key: string]: CyNodeData };
}

interface CyDataEdges {
    delIdToEdgeDataMap: { [key: string]: CyEdgeData };
    edgeData: CyEdgeData[];
    edgeSel: { [key: string]: boolean };
}

interface CacheUpdateOptions {
    updateAll: boolean;
    createNodes: boolean;
    createEdges: boolean;
    updateEdges: boolean;
    updateNodeProps: boolean;
    updateEdgeProps: boolean;
    updateNodeSelection: boolean;
    updateEdgeSelection: boolean;
    updateEdgeLabel: boolean;
    updateGhosts: boolean;
    updateHoverEdges: boolean;
}

interface EdgeLinking extends Pick<CyEdgeData, "id" | "source" | "target"> {
    deliveries: DeliveryId[];
}

@Injectable({
    providedIn: "root",
})
export class GraphService {
    private static readonly DEFAULT_EDGE_COLOR = { r: 0, g: 0, b: 0 };
    private static readonly DEFAULT_NODE_COLOR = { r: 255, g: 255, b: 255 };
    private static readonly DEFAULT_GHOST_COLOR = { r: 179, g: 179, b: 179 };

    private cachedState: SharedGraphState | null = null;

    private cachedData: GraphServiceData | null = null;

    static updateRelZindexOfNodes(nodeData: CyNodeData[]) {
        nodeData = nodeData.slice();
        nodeData.sort((n1, n2) =>
            n1.station.score !== n2.station.score
                ? n1.station.score < n2.station.score
                    ? -1
                    : 1
                : n1.degree !== n2.degree
                  ? n1.degree < n2.degree
                      ? -1
                      : 1
                  : 0,
        );
        nodeData.forEach((n, i) => {
            n.relZindex = i;
        });
    }

    static updateRelZindexOfEdges(edgeData: CyEdgeData[]) {
        edgeData = edgeData.slice();
        const eScore: Record<EdgeId, number> = {};
        edgeData.forEach(
            (edge) =>
                (eScore[edge.id] = Math.max(
                    ...edge.deliveries.map((d) => d.score),
                )),
        );
        edgeData.sort((e1, e2) => eScore[e1.id] - eScore[e2.id]);
        edgeData.forEach((edge, i) => {
            edge.relZindex = i;
        });
    }

    static updateAbsZindex(nodeData: CyNodeData[], edgeData: CyEdgeData[]) {
        const isNodeConToSelEdge: Record<NodeId, boolean> = {};
        edgeData.forEach((edge) => {
            if (edge.selected) {
                isNodeConToSelEdge[edge.source] = true;
                isNodeConToSelEdge[edge.target] = true;
            }
        });
        const indexOffsetOfSelEdgeEndPoint = nodeData.length;
        const indexOffsetOfSelNode =
            indexOffsetOfSelEdgeEndPoint + nodeData.length;

        const indexOffsetOfSelEdge = edgeData.length;
        nodeData.forEach(
            (n) =>
                (n.zindex =
                    n.relZindex +
                    (n.selected
                        ? indexOffsetOfSelNode
                        : isNodeConToSelEdge[n.id]
                          ? indexOffsetOfSelEdgeEndPoint
                          : 0)),
        );
        edgeData.forEach(
            (e) =>
                (e.zindex =
                    e.relZindex + (e.selected ? indexOffsetOfSelEdge : 0)),
        );
    }

    constructor(private dataService: DataService) {}

    getData(state: SharedGraphState): GraphServiceData {
        this.applyState(state);
        return { ...this.cachedData! };
    }

    createGhostElementDataFromStation(
        ghostStation: StationData,
        state: SharedGraphState,
        graphData: GraphServiceData,
    ): GraphElementData {
        const ghostNodeData = this.createGhostNodeData(
            [ghostStation],
            graphData,
        )[0];
        const ghostEdgeData = this.createGhostEdgeDataFromNode(
            ghostNodeData,
            state,
            graphData,
        );

        return {
            nodeData: [ghostNodeData],
            edgeData: ghostEdgeData,
        };
    }

    createGhostElementDataFromDelivery(
        ghostDelivery: DeliveryData,
        state: SharedGraphState,
        graphData: GraphServiceData,
    ): GraphElementData {
        const ghostStations: StationData[] = [];
        if (!graphData.statVis[ghostDelivery.source]) {
            ghostStations.push(graphData.statMap[ghostDelivery.source]);
        }
        if (!graphData.statVis[ghostDelivery.target]) {
            ghostStations.push(graphData.statMap[ghostDelivery.target]);
        }
        const ghostNodeData = this.createGhostNodeData(
            ghostStations,
            graphData,
        );
        const ghostEdgeData = this.createGhostEdgeDataFromDelivery(
            ghostDelivery,
            ghostNodeData,
            state,
            graphData,
        );

        return {
            nodeData: ghostNodeData,
            edgeData: [ghostEdgeData],
        };
    }

    private createNodeData(
        state: SharedGraphState,
        data: DataServiceData,
    ): CyDataNodes {
        let iNode = 0;
        const nodeData: CyNodeData[] = data.stations
            .filter((s) => !s.invisible && !s.contained)
            .map((s) => ({
                id: "N" + iNode++,
                label: this.createLabel(s),
                ...this.getColorInfo(
                    s.highlightingInfo!.color,
                    GraphService.DEFAULT_NODE_COLOR,
                ),
                isMeta: s.contains && s.contains.length > 0,
                shape: s.highlightingInfo!.shape
                    ? s.highlightingInfo!.shape
                    : NodeShapeType.CIRCLE,
                size: s.highlightingInfo!.size,
                station: s,
                relZindex: 0,
                zindex: 0,
                degree: 0,
                selected: s.selected,
            }));

        return {
            nodeData: nodeData,
            statIdToNodeDataMap: Utils.createObjectFromArray(
                nodeData,
                (n) => n.station.id,
            ),
            nodeSel: Utils.createSimpleStringSet(
                nodeData.filter((n) => n.selected).map((n) => n.id),
            ),
            idToNodeMap: Utils.createObjectFromArray(nodeData, (n) => n.id),
        };
    }

    private createEdgeData(
        state: SharedGraphState,
        data: DataServiceData,
        cyDataNodes: CyDataNodes,
    ): CyDataEdges {
        const edgeData: CyEdgeData[] = [];

        const sourceTargetDelMap: {
            [key: string]: { [key: string]: DeliveryData[] };
        } = {};

        const statMap = cyDataNodes.statIdToNodeDataMap;
        const selDel = Utils.createSimpleStringSet(
            state.selectedElements.deliveries,
        );

        if (state.mergeDeliveriesType !== MergeDeliveriesType.NO_MERGE) {
            for (const delivery of data.deliveries.filter(
                (d) => !d.invisible,
            )) {
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

                    const deliveryGroups = this.groupDeliveries(
                        deliveriesForNodePair,
                        state.mergeDeliveriesType,
                    );
                    for (const deliveries of deliveryGroups) {
                        if (deliveries.length === 1) {
                            const delivery = deliveries[0];
                            console.log('calculatedWidth', delivery.highlightingInfo?.edgeWidth, 279)
                            // edgewidth wie im else 2, --> 1 del, same edge 
                            const selected = !!selDel[delivery.id];
                            edgeData.push({
                                id: "E" + iEdge++,
                                labelWoPrefix: this.createLabel(delivery),
                                ...this.getColorInfo(
                                    delivery.highlightingInfo!.color,
                                    GraphService.DEFAULT_EDGE_COLOR,
                                ),
                                source: sourceDataId,
                                target: targetDataId,
                                deliveries: [delivery],
                                zindex: 0,
                                relZindex: 0,
                                selected: selected,
                                wLabelSpace: false,
                            });
                        } else { // hier max zahl der edgewidth nehmen 
                            edgeData.push({
                                id: "E" + iEdge++,
                                labelWoPrefix:
                                    this.createMergedLabelWoPrefix(deliveries),
                                ...this.getColorInfo(
                                    this.mergeColors(
                                        deliveries.map(
                                            (d) => d.highlightingInfo!.color,
                                        ),
                                    ),
                                    GraphService.DEFAULT_EDGE_COLOR,
                                ),
                                source: sourceDataId,
                                target: targetDataId,
                                deliveries: deliveries,
                                relZindex: 0,
                                zindex: 0,
                                selected: deliveries.some(
                                    (d) => !!selDel[d.id],
                                ),
                                wLabelSpace: false,
                            });
                        }
                    }
                }
            }
        } else {
            let iEdge = 0;
            for (const delivery of data.deliveries.filter(
                (d) => !d.invisible,
            )) {
                const sourceData = statMap[delivery.source];
                const targetData = statMap[delivery.target];
                console.log('calculatedWidth', delivery.highlightingInfo?.edgeWidth, 330)

                if (sourceData && targetData) {
                    edgeData.push({
                        id: "E" + iEdge++,
                        labelWoPrefix: this.createLabel(delivery),
                        ...this.getColorInfo(
                            delivery.highlightingInfo!.color,
                            GraphService.DEFAULT_EDGE_COLOR,
                        ),
                        source: sourceData.id,
                        target: targetData.id,
                        deliveries: [delivery],
                        relZindex: 0,
                        zindex: 0,
                        selected: delivery.selected,
                        wLabelSpace: false,
                        edgeWidth: delivery.highlightingInfo?.edgeWidth
                    });
                }
            }
        }

        const map: { [key: string]: CyEdgeData } = {};

        cyDataNodes.nodeData.forEach((node) => (node.degree = 0));
        for (const eData of edgeData) {
            eData.deliveries.forEach((d) => {
                map[d.id] = eData;
            });
            if (eData.source !== eData.target) {
                cyDataNodes.idToNodeMap[eData.source]!.degree +=
                    eData.deliveries.length;
                cyDataNodes.idToNodeMap[eData.target]!.degree +=
                    eData.deliveries.length;
            }
        }
        this.updateEdgeLabels(state, edgeData);

        return {
            edgeData: edgeData,
            delIdToEdgeDataMap: map,
            edgeSel: Utils.createSimpleStringSet(
                edgeData.filter((n) => n.selected).map((n) => n.id),
            ),
        };
    }

    private createLabel(element: DeliveryData | StationData): string {
        return element.highlightingInfo!.label;
    }

    private createMergedLabelWoPrefix(deliveries: DeliveryData[]): string {
        if (deliveries.length === 0) {
            return "";
        }
        const labels: string[] = _.uniq(
            deliveries.map((d) => this.createLabel(d)),
        );
        return labels.length > 1 ? "" : labels[0];
    }

    private createGhostNodeData(
        ghostStations: StationData[],
        graphData: GraphServiceData,
    ): CyNodeData[] {
        return ghostStations.map((station, index) => ({
            id: "GN" + index,
            label: station.highlightingInfo!.label,
            ...this.getColorInfo([], GraphService.DEFAULT_GHOST_COLOR),
            isMeta: station.contains && station.contains.length > 0,
            shape: station.highlightingInfo!.shape
                ? station.highlightingInfo!.shape
                : NodeShapeType.CIRCLE,
            size: 0,
            station: station,
            selected: station.selected,
            relZindex: 0,
            degree: 0,
            zindex: 3 * graphData.nodeData.length + index,
        }));
    }

    private mapDelToEdgeData(
        deliveries: DeliveryData[],
        idSuffix: string,
        source: CyNodeData,
        target: CyNodeData,
    ): CyEdgeData {
        const labels: string[] = _.uniq(
            deliveries.map((d) => d.highlightingInfo!.label ?? ""),
        );

        const edgeData: CyEdgeData = {
            id: "GE" + idSuffix,
            labelWoPrefix: labels.length === 1 ? labels[0] : "",
            ...this.getColorInfo([], GraphService.DEFAULT_GHOST_COLOR),
            source: source.id,
            target: target.id,
            deliveries: deliveries,
            selected: false,
            wLabelSpace: false,
            zindex: NaN,
            relZindex: NaN,
        };

        return edgeData;
    }

    private createGhostEdgeDataFromNode(
        ghostNodeData: CyNodeData,
        state: SharedGraphState,
        graphData: GraphServiceData,
    ): CyEdgeData[] {
        let ghostEdgeData: CyEdgeData[];
        const ghostDeliveries = this.getGhostDeliveries(
            ghostNodeData.station,
            graphData,
        );

        if (state.mergeDeliveriesType === MergeDeliveriesType.NO_MERGE) {
            ghostEdgeData = ghostDeliveries.map((delivery, index) => {
                const edgeData = this.mapDelToEdgeData(
                    [delivery],
                    "" + index,
                    ghostNodeData.station.id === delivery.source
                        ? ghostNodeData
                        : graphData.statIdToNodeDataMap[delivery.source],
                    ghostNodeData.station.id === delivery.target
                        ? ghostNodeData
                        : graphData.statIdToNodeDataMap[delivery.target],
                );

                return {
                    ...edgeData,
                    relZindex: 0,
                    zindex: 2 * graphData.edgeData.length + index,
                };
            });
            this.updateEdgeLabels(state, ghostEdgeData);

            return ghostEdgeData;
        }
        const deliveriesPerNodePair = Utils.groupRows(ghostDeliveries, [
            (d) => d.source,
            (d) => d.target,
        ]);

        ghostEdgeData = concat(
            ...deliveriesPerNodePair.map((deliveriesForNodePair) => {
                const deliveryGroups = this.groupDeliveries(
                    deliveriesForNodePair,
                    state.mergeDeliveriesType,
                );
                const fromNode =
                    deliveryGroups[0][0].source === ghostNodeData.station.id
                        ? ghostNodeData
                        : graphData.statIdToNodeDataMap[
                              deliveryGroups[0][0].source
                          ];
                const toNode =
                    deliveryGroups[0][0].target === ghostNodeData.station.id
                        ? ghostNodeData
                        : graphData.statIdToNodeDataMap[
                              deliveryGroups[0][0].target
                          ];

                const nodePairEdges = deliveryGroups.map(
                    (deliveryGroup, gIndex) =>
                        this.mapDelToEdgeData(
                            deliveryGroup,
                            "" + fromNode.id + toNode.id + "G" + gIndex,
                            fromNode,
                            toNode,
                        ),
                );
                return nodePairEdges;
            }),
        );
        this.updateEdgeLabels(state, ghostEdgeData);

        return ghostEdgeData;
    }

    private createGhostEdgeDataFromDelivery(
        ghostDelivery: DeliveryData,
        ghostNodeData: CyNodeData[],
        state: SharedGraphState,
        graphData: GraphServiceData,
    ): CyEdgeData {
        const idToGhostNodeDataMap = Utils.createObjectFromArray(
            ghostNodeData,
            (n) => n.station.id,
            (n) => n,
        );
        const sourceNode =
            graphData.statIdToNodeDataMap[ghostDelivery.source] ||
            idToGhostNodeDataMap[ghostDelivery.source];
        const targetNode =
            graphData.statIdToNodeDataMap[ghostDelivery.target] ||
            idToGhostNodeDataMap[ghostDelivery.target];

        const ghostEdgeData = {
            ...this.mapDelToEdgeData(
                [ghostDelivery],
                "",
                sourceNode,
                targetNode,
            ),
            relZindex: 0,
            zindex:
                2 * (graphData.stations.length + graphData.deliveries.length) +
                1,
        };

        this.updateEdgeLabels(state, [ghostEdgeData]);

        return ghostEdgeData;
    }

    private getGhostDeliveries(
        ghostStation: StationData,
        graphData: GraphServiceData,
    ): DeliveryData[] {
        const outDeliveries = graphData
            .getDelById(ghostStation.outgoing)
            .filter(
                (d) =>
                    ghostStation.id === d.target ||
                    !graphData.statMap[d.target].invisible,
            );
        const outIdSet = Utils.createSimpleStringSet(ghostStation.outgoing);
        const inDeliveries = graphData
            .getDelById(ghostStation.incoming)
            .filter(
                (d) =>
                    !outIdSet[d.id] &&
                    (ghostStation.id === d.source ||
                        !graphData.statMap[d.source].invisible),
            );

        return concat(outDeliveries, inDeliveries);
    }

    private updateLabelSpaceFlags(edges: CyEdgeData[]): void {
        const edgeGroups = this.getNodePairEdgeGroups(edges);
        for (const edgeGroup of edgeGroups) {
            const oneLabelExists = edgeGroup.some((edge) => edge.label !== "");
            edgeGroup.forEach((edge) => (edge.wLabelSpace = oneLabelExists));
        }
    }

    private getNodePairEdgeGroups(edges: CyEdgeData[]): CyEdgeData[][] {
        const edgeGroups: { [key: string]: CyEdgeData[] } = {};

        for (const edge of edges) {
            const nodePairKey =
                edge.source < edge.target
                    ? edge.source + edge.target
                    : edge.target + edge.source;
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
            edges.forEach((edge) => {
                const nDel = edge.deliveries.length;
                if (nDel > 1) {
                    const nSel = edge.deliveries.filter(
                        (d) => d.selected,
                    ).length;
                    edge.label =
                        "[" +
                        (nSel > 0 && nSel < nDel ? nSel + "/" : "") +
                        nDel +
                        "]" +
                        (edge.labelWoPrefix !== ""
                            ? " " + edge.labelWoPrefix
                            : "");
                } else {
                    edge.label = edge.labelWoPrefix;
                }
            });
        } else {
            edges.forEach((edge) => (edge.label = edge.labelWoPrefix));
        }
        this.updateLabelSpaceFlags(edges);
    }

    private groupDeliveries(
        deliveries: DeliveryData[],
        mergeDeliveriesType: MergeDeliveriesType,
    ): DeliveryData[][] {
        if (mergeDeliveriesType === MergeDeliveriesType.MERGE_PRODUCT_WISE) {
            return Utils.groupDeliveriesByProduct(deliveries);
        } else if (mergeDeliveriesType === MergeDeliveriesType.MERGE_LOT_WISE) {
            return Utils.groupDeliveriesByLot(deliveries);
        } else if (
            mergeDeliveriesType === MergeDeliveriesType.MERGE_LABEL_WISE
        ) {
            return Utils.groupRows(deliveries, [
                (d: DeliveryData) => d.highlightingInfo!.label,
            ]);
        } else if (mergeDeliveriesType === MergeDeliveriesType.MERGE_ALL) {
            return [deliveries];
        } else if (mergeDeliveriesType === MergeDeliveriesType.NO_MERGE) {
            return deliveries.map((d) => [d]);
        } else {
            throw new Error(
                `Unsupported merge type: ${MergeDeliveriesType[mergeDeliveriesType]}`,
            );
        }
    }

    private mergeColors(edgeColors: Color[][]): Color[] {
        const addDefaultColor = edgeColors.some(
            (deliveryColors) => deliveryColors.length === 0,
        );
        if (addDefaultColor) {
            edgeColors = concat(
                [[GraphService.DEFAULT_EDGE_COLOR]],
                edgeColors,
            );
        }
        return _.uniqWith(
            concat(...edgeColors),
            (c1: Color, c2: Color) =>
                c1.r === c2.r && c1.g === c2.g && c1.b === c2.b,
        );
    }

    private getColorInfo(
        colors: Color[],
        defaultColor: Color,
    ): {
        stopColors: string;
        stopPositions: string;
    } {
        if (colors.length === 0) {
            colors = [defaultColor];
        }
        const repeat = (s: string) => s + " " + s;
        const stopColors = colors
            .map((c) => repeat(Utils.colorToCss(c)))
            .join(" ");
        const n = colors.length;
        const stopPositions = colors
            .map((c, i) => `${(100 * i) / n}% ${(100 * (i + 1)) / n}%`)
            .join(" ");

        return {
            stopColors: stopColors,
            stopPositions: stopPositions,
        };
    }

    private applyStationProps(data: GraphServiceData) {
        for (const node of data.nodeData) {
            const station = node.station;
            node.label = station.highlightingInfo!.label;
            const colorInfo = this.getColorInfo(
                station.highlightingInfo!.color,
                GraphService.DEFAULT_NODE_COLOR,
            );
            node.stopColors = colorInfo.stopColors;
            node.stopPositions = colorInfo.stopPositions;
            node.shape = station.highlightingInfo!.shape
                ? station.highlightingInfo!.shape
                : NodeShapeType.CIRCLE;
            node.size = station.highlightingInfo!.size;
        }
    }

    private applyDeliveryProps(data: GraphServiceData) {
        for (const edge of data.edgeData) {
            const colorInfo = this.getColorInfo(
                edge.deliveries.length > 0
                    ? this.mergeColors(
                          edge.deliveries.map((d) => d.highlightingInfo!.color),
                      )
                    : edge.deliveries[0].highlightingInfo!.color,
                GraphService.DEFAULT_EDGE_COLOR,
            );
            edge.stopColors = colorInfo.stopColors;
            edge.stopPositions = colorInfo.stopPositions;
            edge.labelWoPrefix = this.createMergedLabelWoPrefix(
                edge.deliveries,
            );
        }
    }

    private applyStatSelection(data: GraphServiceData) {
        data.nodeData.forEach(
            (node) => (node.selected = node.station.selected),
        );
        const selectedNodeIds = data.nodeData
            .filter((node) => node.selected)
            .map((node) => node.id);

        data.nodeSel = Utils.createSimpleStringSet(
            data.nodeData.filter((n) => n.selected).map((n) => n.id),
        );
        data.selectedElements = {
            ...data.selectedElements,
            nodes: selectedNodeIds,
        };
    }

    private applyDelSelection(data: GraphServiceData) {
        data.edgeData.forEach(
            (edge) => (edge.selected = edge.deliveries.some((d) => d.selected)),
        );
        const selectedEdgeIds = data.edgeData
            .filter((edge) => edge.selected)
            .map((edge) => edge.id);

        data.edgeSel = Utils.createSimpleStringSet(
            data.edgeData.filter((e) => e.selected).map((e) => e.id),
        );
        data.selectedElements = {
            ...data.selectedElements,
            edges: selectedEdgeIds,
        };
    }

    private getEdgeLinkings(edgeData: CyEdgeData[]): EdgeLinking[] {
        return edgeData.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            deliveries: e.deliveries.map((d) => d.id),
        }));
    }

    private isDeliveryMergeDifferent(
        oldData: CyDataEdges,
        newData: CyDataEdges,
    ): boolean {
        return !_.isEqual(
            this.getEdgeLinkings(oldData.edgeData),
            this.getEdgeLinkings(newData.edgeData),
        );
    }

    private copyEdgeProps(
        edgesFrom: CyEdgeData[],
        edgesTo: CyEdgeData[],
    ): void {
        edgesTo.forEach((edgeTo, i) => {
            const edgeFrom = edgesFrom[i];
            edgeTo.labelWoPrefix = edgeFrom.labelWoPrefix;
            edgeTo.label = edgeFrom.label;
            edgeTo.wLabelSpace = edgeFrom.wLabelSpace;
            edgeTo.stopColors = edgeFrom.stopColors;
            edgeTo.stopPositions = edgeFrom.stopPositions;
            edgeTo.selected = edgeFrom.selected;
        });
    }

    private updateGhosts(
        state: SharedGraphState,
        newData: GraphServiceData,
    ): void {
        if (state.ghostStation === null && state.ghostDelivery === null) {
            newData.ghostElements = null;
        } else if (state.ghostStation !== null) {
            newData.ghostElements = this.createGhostElementDataFromStation(
                newData.statMap[state.ghostStation],
                state,
                newData,
            );
        } else {
            newData.ghostElements = this.createGhostElementDataFromDelivery(
                newData.delMap[state.ghostDelivery!],
                state,
                newData,
            );
        }
    }

    private updateHoverEdges(
        state: SharedGraphState,
        newData: GraphServiceData,
    ): void {
        newData.hoverEdges = state.hoverDeliveries
            .filter((delId) => delId in newData.delIdToEdgeDataMap)
            .map((delId) => newData.delIdToEdgeDataMap[delId].id);
    }

    private updateCache(
        state: SharedGraphState,
        dataServiceData: DataServiceData,
        options: Partial<CacheUpdateOptions>,
    ): void {
        let newData: GraphServiceData = {
            statIdToNodeDataMap: {},
            nodeData: [],
            idToNodeMap: {},
            delIdToEdgeDataMap: {},
            edgeData: [],
            nodeSel: {},
            edgeSel: {},
            nodeAndEdgePropsUpdatedFlag: {},
            ghostElements: null,
            hoverEdges: [],
            selectedElements: {
                nodes: [],
                edges: [],
            },
            ...(this.cachedData ? this.cachedData : {}),
            ...dataServiceData,
        };

        if (options.createNodes) {
            const nodeData = this.createNodeData(state, newData);
            newData = {
                ...newData,
                ...nodeData,
            };
        }

        if (options.createEdges || options.updateEdges) {
            const edgeData = this.createEdgeData(state, newData, newData);
            if (
                options.createEdges ||
                this.isDeliveryMergeDifferent(this.cachedData!, edgeData)
            ) {
                newData = {
                    ...newData,
                    ...edgeData,
                };
            } else {
                // deliverey aggregation did not change
                this.copyEdgeProps(
                    edgeData.edgeData,
                    this.cachedData!.edgeData,
                );
            }
        }

        if (options.updateNodeProps) {
            this.applyStationProps(newData);
        }

        if (options.updateEdgeProps) {
            this.applyDeliveryProps(newData);
        }

        if (options.updateNodeSelection) {
            this.applyStatSelection(newData);
        }

        if (options.updateEdgeSelection) {
            this.applyDelSelection(newData);
        }

        const updateRelZIndexOfNodes =
            options.createNodes ||
            options.updateNodeProps ||
            options.updateEdges;
        const updateRelZIndexOfEdges =
            options.createEdges ||
            options.updateEdgeProps ||
            options.updateEdges;
        const updateAbsZIndex =
            updateRelZIndexOfNodes ||
            updateRelZIndexOfEdges ||
            options.updateNodeSelection ||
            options.updateEdgeSelection;

        if (updateRelZIndexOfNodes) {
            GraphService.updateRelZindexOfNodes(newData.nodeData);
        }

        if (updateRelZIndexOfEdges) {
            GraphService.updateRelZindexOfEdges(newData.edgeData);
        }

        if (updateAbsZIndex) {
            GraphService.updateAbsZindex(newData.nodeData, newData.edgeData);
        }

        if (options.updateEdgeLabel) {
            this.updateEdgeLabels(state, newData.edgeData);
        }

        if (options.updateGhosts) {
            this.updateGhosts(state, newData);
        }

        if (options.updateHoverEdges) {
            this.updateHoverEdges(state, newData);
        }

        if (
            options.updateNodeProps ||
            options.updateEdgeProps ||
            options.updateEdgeLabel ||
            options.updateEdgeSelection ||
            options.updateNodeSelection
        ) {
            newData.nodeAndEdgePropsUpdatedFlag = {};
        }

        this.cachedData = newData;
    }

    private applyState(state: SharedGraphState) {
        const cacheIsEmpty = this.cachedData === null;
        const dataServiceData = this.dataService.getData(state);

        const nodeCreationRequired =
            cacheIsEmpty ||
            this.cachedData!.stations !== dataServiceData.stations ||
            this.cachedData!.statVis !== dataServiceData.statVis;

        const edgeCreationIsRequired =
            nodeCreationRequired ||
            this.cachedData!.deliveries !== dataServiceData.deliveries ||
            this.cachedData!.delVis !== dataServiceData.delVis;

        const tracingPropsWereUpdated =
            cacheIsEmpty ||
            this.cachedData!.tracingPropsUpdatedFlag !==
                dataServiceData.tracingPropsUpdatedFlag;

        const highlightingPropsWereUpdated =
            cacheIsEmpty ||
            this.cachedData!.stationAndDeliveryHighlightingUpdatedFlag !==
                dataServiceData.stationAndDeliveryHighlightingUpdatedFlag;

        const edgeCreationMightBeRequired =
            !edgeCreationIsRequired &&
            (this.cachedState!.mergeDeliveriesType !==
                state.mergeDeliveriesType ||
                (state.mergeDeliveriesType ===
                    MergeDeliveriesType.MERGE_LABEL_WISE &&
                    highlightingPropsWereUpdated));

        const propUpdateRequired =
            tracingPropsWereUpdated || highlightingPropsWereUpdated;

        const nodePropsUpdateRequired =
            !nodeCreationRequired && propUpdateRequired;

        const nodeSelUpdateRequired =
            !nodeCreationRequired &&
            this.cachedData!.statSel !== dataServiceData.statSel;

        const edgePropsUpdateRequired =
            !edgeCreationIsRequired &&
            !edgeCreationMightBeRequired &&
            propUpdateRequired;

        const edgeSelUpdateRequired =
            !edgeCreationIsRequired &&
            !edgeCreationMightBeRequired &&
            this.cachedData!.delSel !== dataServiceData.delSel;

        const edgeLabelUpdateRequired =
            !edgeCreationIsRequired &&
            !edgeCreationMightBeRequired &&
            (edgePropsUpdateRequired ||
                this.cachedState!.showMergedDeliveriesCounts !==
                    state.showMergedDeliveriesCounts ||
                (edgeSelUpdateRequired && state.showMergedDeliveriesCounts));

        const updateGhostElements =
            cacheIsEmpty ||
            this.cachedState!.ghostStation !== state.ghostStation ||
            this.cachedState!.ghostDelivery !== state.ghostDelivery;

        const updateHoverEdges =
            cacheIsEmpty ||
            this.cachedState!.hoverDeliveries !== state.hoverDeliveries;

        this.updateCache(state, dataServiceData, {
            createNodes: nodeCreationRequired,
            createEdges: edgeCreationIsRequired,
            updateEdges: edgeCreationMightBeRequired,
            updateNodeProps: nodePropsUpdateRequired,
            updateEdgeProps: edgePropsUpdateRequired,
            updateNodeSelection: nodeSelUpdateRequired,
            updateEdgeSelection: edgeSelUpdateRequired,
            updateEdgeLabel: edgeLabelUpdateRequired,
            updateGhosts: updateGhostElements,
            updateHoverEdges: updateHoverEdges,
        });

        this.cachedState = { ...state };
    }

    private getEdgeMap(edgeData: CyEdgeData[]): Record<EdgeId, CyEdgeData> {
        const edgeMap: Record<EdgeId, CyEdgeData> = {};
        edgeData.forEach((edge) => (edgeMap[edge.id] = edge));
        return edgeMap;
    }

    convertGraphSelectionToFclSelection(
        selectedGraphElements: SelectedGraphElements,
        graphServiceData: GraphServiceData,
        maintainOffGraphSelection: boolean,
    ): SelectedElements {
        const edgeMap = this.getEdgeMap(graphServiceData.edgeData);
        const selectedElements = {
            stations: selectedGraphElements.nodes.map(
                (nodeId) => graphServiceData.idToNodeMap[nodeId].station.id,
            ),
            deliveries: concat(
                ...selectedGraphElements.edges.map((edgeId) =>
                    edgeMap[edgeId].deliveries.map((d) => d.id),
                ),
            ),
        };
        if (maintainOffGraphSelection) {
            // add selected elements that cannot be selected in graph
            selectedElements.stations = concat(
                selectedElements.stations,
                Utils.getStringArrayDifference(
                    graphServiceData.stations
                        .filter((s) => s.selected)
                        .map((s) => s.id),
                    graphServiceData.nodeData.map((n) => n.station.id),
                ),
            );
            selectedElements.deliveries = concat(
                selectedElements.deliveries,
                Utils.getStringArrayDifference(
                    graphServiceData.deliveries
                        .filter((d) => d.selected)
                        .map((s) => s.id),
                    concat(
                        ...graphServiceData.edgeData.map((e) =>
                            e.deliveries.map((d) => d.id),
                        ),
                    ),
                ),
            );
        }
        return selectedElements;
    }

    getNodeIdFromStationId(
        stationId: StationId,
        state: SharedGraphState,
    ): NodeId | null {
        const data = this.getData(state);
        for (const node of data.nodeData) {
            if (node.station.id === stationId) {
                return node.id;
            }
        }
        return null;
    }

    getEdgeIdFromDeliveryId(
        deliveryId: DeliveryId,
        state: SharedGraphState,
    ): NodeId | null {
        const data = this.getData(state);
        for (const edge of data.edgeData) {
            if (edge.deliveries.some((d) => d.id === deliveryId)) {
                return edge.id;
            }
        }
        return null;
    }
}
