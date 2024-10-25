import {
    Component,
    ElementRef,
    Inject,
    OnDestroy,
    OnInit,
    ViewChild,
} from "@angular/core";
import {
    MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
    MatLegacyDialogRef as MatDialogRef,
} from "@angular/material/legacy-dialog";
import * as d3 from "d3-selection";

import {
    DeliveryData,
    StationData,
    DeliveryId,
    StationId,
    TableColumn,
} from "../../data.model";
import { Constants } from "../../util/constants";
import { concat, Utils } from "../../util/non-ui-utils";
import { State } from "@app/tracing/state/tracing.reducers";
import { Store } from "@ngrx/store";
import { SetHoverDeliveriesSOA } from "@app/tracing/state/tracing.actions";
import { StationPropertiesDialog } from "../dialog-movable/dialog-movable.component";

export interface StationPropertiesData {
    station: StationData;
    deliveries: Map<DeliveryId, DeliveryData>;
    connectedStations: Map<StationId, StationData>;
    stationColumns: TableColumn[];
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
    name?: string;
    station?: string;
    deliveryIds: DeliveryId[];
    lot?: string;
    date?: string;
    invisible: boolean;
    x: number;
    y: number;
}

interface EdgeDatum {
    source: NodeDatum;
    target: NodeDatum;
    invisible: boolean;
}

class DataOptimizer {
    private inIds: string[];
    private inConnections: Map<string, string[]>;
    private outIds: string[];
    private outConnections: Map<string, string[]>;

    constructor(
        private nodeInData: NodeDatum[],
        private nodeOutData: NodeDatum[],
        private edgeData: EdgeDatum[],
    ) {
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
            this.inConnections.get(e.source.id)!.push(e.target.id);
            this.outConnections.get(e.target.id)!.push(e.source.id);
        }
    }

    optimize() {
        this.step(this.inIds, this.inConnections, this.outIds);
        this.step(this.outIds, this.outConnections, this.inIds);

        const nodesInById = new Map<string, NodeDatum>();
        const nodesOutById = new Map<string, NodeDatum>();

        for (const n of this.nodeInData) {
            nodesInById.set(n.id, n);
        }

        for (const n of this.nodeOutData) {
            nodesOutById.set(n.id, n);
        }

        this.inIds.forEach((id, index) => {
            this.nodeInData[index] = nodesInById.get(id)!;
        });

        this.outIds.forEach((id, index) => {
            this.nodeOutData[index] = nodesOutById.get(id)!;
        });
    }

    private step(
        ids1: string[],
        connections1: Map<string, string[]>,
        ids2: string[],
    ) {
        const indices2 = new Map<string, number>();

        ids2.forEach((id, index) => indices2.set(id, index));

        const centers1 = new Map<string, number>();

        for (const id of ids1) {
            const connections = connections1.get(id)!;
            let sum = 0;

            for (const c of connections) {
                sum += indices2.get(c)!;
            }

            centers1.set(
                id,
                connections.length > 0 ? sum / connections.length : Infinity,
            );
        }

        const sortedCenters1 = Array.from(centers1.entries());

        sortedCenters1.sort((a, b) => a[1] - b[1]);
        sortedCenters1.forEach((center, index) => {
            ids1[index] = center[0];
        });
    }
}

@Component({
    selector: "fcl-station-properties",
    templateUrl: "./station-properties.component.html",
    styleUrls: ["./station-properties.component.scss"],
})
export class StationPropertiesComponent implements OnInit, OnDestroy {
    private static readonly SVG_WIDTH = 600;
    private static readonly NODE_PADDING = 15;
    private static readonly NODE_WIDTH = 200;
    private static readonly NODE_HEIGHT = 50;
    private static readonly TEXT_X_PADDING = 5;
    private static readonly INCOMING_HEADER = "Incoming Deliveries:";
    private static readonly OUTGOING_HEADER = "Outgoing Deliveries:";
    private static readonly DELIVERIES_HEADER_HEIGHT = 14;
    private static readonly CONTAINER_PADDING = 1;

    @ViewChild("inOutConnector", { static: true }) inOutConnector: ElementRef;

    otherPropertiesHidden = true;
    properties: Properties = {};

    vipProperties: string[] = [
        "id",
        "address",
        "country",
        "typeOfBusiness",
        "score",
        "commonLink",
        "outbreak",
        "weight",
    ];

    notListedProps: string[] = ["name", "incoming", "outgoing"];
    otherProperties: string[] = [];

    conditionalNotListedPropsMap = new Map<
        string,
        (station: StationData) => boolean
    >([["contains", (station: StationData) => station.isMeta === false]]);

    private nodeInData: NodeDatum[];
    private nodeOutData: NodeDatum[];
    private edgeData: EdgeDatum[];
    private lotBased: boolean;
    private height: number;
    private selected: NodeDatum;

    private svg: d3.Selection<SVGGElement, any, any, any>;
    private nodesInG: d3.Selection<SVGElement, NodeDatum, any, any>;
    private nodesOutG: d3.Selection<SVGElement, NodeDatum, any, any>;
    private edgesG: d3.Selection<SVGElement, EdgeDatum, any, any>;
    private connectLine: d3.Selection<SVGElement, any, any, any>;
    contentData: StationPropertiesData;

    private static line(x1: number, y1: number, x2: number, y2: number) {
        return "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
    }

    constructor(
        public dialogRef: MatDialogRef<StationPropertiesComponent>,
        @Inject(MAT_DIALOG_DATA) public data: StationPropertiesDialog,
        private store: Store<State>,
    ) {
        this.contentData = this.data.content;
        this.initProperties(
            this.contentData.station,
            this.contentData.stationColumns,
        );

        if (
            data.content.station.incoming.length > 0 ||
            data.content.station.outgoing.length > 0
        ) {
            const ingredientsByLotKey = this.getIngredientsByLotKey();

            this.lotBased = ingredientsByLotKey != null;

            if (this.lotBased) {
                this.initLotBasedData(ingredientsByLotKey!);
            } else {
                this.initDeliveryBasedData();
            }

            const optimizer = new DataOptimizer(
                this.nodeInData,
                this.nodeOutData,
                this.edgeData,
            );
            optimizer.optimize();

            let currentYPositionIncoming =
                StationPropertiesComponent.CONTAINER_PADDING +
                StationPropertiesComponent.DELIVERIES_HEADER_HEIGHT +
                StationPropertiesComponent.NODE_PADDING;
            let currentYPositionOutgoing = currentYPositionIncoming;

            for (const node of this.nodeInData) {
                node.x = StationPropertiesComponent.CONTAINER_PADDING;
                node.y = currentYPositionIncoming;
                currentYPositionIncoming +=
                    StationPropertiesComponent.NODE_HEIGHT +
                    StationPropertiesComponent.NODE_PADDING;
            }

            for (const node of this.nodeOutData) {
                node.x =
                    StationPropertiesComponent.SVG_WIDTH -
                    StationPropertiesComponent.NODE_WIDTH -
                    StationPropertiesComponent.CONTAINER_PADDING;
                node.y = currentYPositionOutgoing;
                currentYPositionOutgoing +=
                    StationPropertiesComponent.NODE_HEIGHT +
                    StationPropertiesComponent.NODE_PADDING;
            }

            this.height =
                Math.max(currentYPositionIncoming, currentYPositionOutgoing) -
                StationPropertiesComponent.NODE_PADDING +
                StationPropertiesComponent.CONTAINER_PADDING;
        }
    }

    private initProperties(station: StationData, columns: TableColumn[]): void {
        const properties: Properties = {};
        const hiddenProps = Utils.createSimpleStringSet(this.notListedProps);

        this.conditionalNotListedPropsMap.forEach(
            (isHiddenFun, propId) =>
                (hiddenProps[propId] = isHiddenFun(station)),
        );

        Object.keys(station)
            .filter((key) => Constants.PROPERTIES.has(key) && !hiddenProps[key])
            .forEach((key) => {
                const column = columns.find((column) => column.id === key);
                const label =
                    column !== undefined
                        ? column.name
                        : Constants.PROPERTIES.get(key).name;
                const value = station[key];
                properties[key] = {
                    label: label,
                    value: value != null ? value + "" : "",
                };
            });

        station.properties.forEach((prop) => {
            const column = columns.find((column) => column.id === prop.name);
            const label =
                column !== undefined
                    ? column.name
                    : this.convertPropNameToLabel(prop.name);
            properties[prop.name] = {
                label: label,
                value: prop.value + "",
            };
        });

        const vipProps = Utils.createSimpleStringSet(this.vipProperties);
        this.otherProperties = Object.keys(properties)
            .filter((key) => !vipProps[key])
            .slice()
            .map((property) => {
                const column = columns.find((column) => column.id === property);
                return column !== undefined
                    ? column.name
                    : Constants.PROPERTIES.get(property).name;
            });
        this.otherProperties.sort();
        // add default for missing props
        this.vipProperties
            .filter((key) => !properties[key])
            .forEach((key) => {
                const tmp = Constants.PROPERTIES.get(key);
                properties[key] = {
                    label: tmp ? tmp.name : this.convertPropNameToLabel(key),
                    value: "",
                };
            });
        this.properties = properties;
    }

    private capitelizeFirstLetter(str: string): string {
        return str && str.length > 0
            ? str.charAt(0).toUpperCase() + str.slice(1)
            : str;
    }

    private decamelize(str: string): string {
        const separator = " ";
        return str
            .replace(/([a-z\d])([A-Z])/g, "$1" + separator + "$2")
            .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, "$1" + separator + "$2");
    }

    private convertPropNameToLabel(str: string): string {
        return this.capitelizeFirstLetter(this.decamelize(str));
    }

    ngOnInit() {
        if (this.height != null) {
            this.svg = d3
                .select(this.inOutConnector.nativeElement)
                .append<SVGGElement>("svg")
                .attr("display", "block")
                .attr("width", StationPropertiesComponent.SVG_WIDTH)
                .attr("height", this.height);

            const defs = this.svg.append<SVGElement>("defs");
            const g = this.svg.append<SVGElement>("g");

            defs.append("marker")
                .attr("id", "end-arrow")
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 7)
                .attr("markerWidth", 3.5)
                .attr("markerHeight", 3.5)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5")
                .attr("fill", Utils.colorToCss(Constants.DEFAULT_STROKE_COLOR));

            this.connectLine = g
                .append<SVGElement>("path")
                .attr("marker-end", "url(#end-arrow)")
                .attr("visibility", "hidden")
                .attr("fill", "none")
                .attr(
                    "stroke",
                    Utils.colorToCss(Constants.DEFAULT_STROKE_COLOR),
                )
                .attr("stroke-width", "6px")
                .attr("cursor", "default");
            this.edgesG = g.append<SVGElement>("g");
            this.nodesInG = g.append<SVGElement>("g");
            this.nodesOutG = g.append<SVGElement>("g");

            this.addNodesHeader();
            this.addNodes();
            this.updateEdges();

            d3.select("body").on("mousemove", () => this.updateConnectLine());
        }
    }

    ngOnDestroy() {
        d3.select("body").on("mousemove", null);
        this.hoverDeliveries([]);
    }

    toggleOtherProperties() {
        this.otherPropertiesHidden = !this.otherPropertiesHidden;
    }

    getOtherPropertiesOri() {
        return this.otherProperties.map((property) =>
            Object.keys(this.properties).find(
                (key) => this.properties[key].label === property,
            ),
        );
    }

    private createDeliveryNode(deliveryId: DeliveryId): NodeDatum {
        const delivery = this.contentData.deliveries.get(deliveryId)!;
        const otherStation = this.contentData.connectedStations.get(
            delivery.source !== this.contentData.station.id
                ? delivery.source
                : delivery.target,
        )!;

        return {
            id: deliveryId,
            name: delivery.name,
            station: otherStation.name,
            lot: delivery.lot,
            deliveryIds: [deliveryId],
            date: delivery.dateOut,
            invisible: delivery.invisible,
            x: 0,
            y: 0,
        };
    }

    private getInternalLotKey(delivery: DeliveryData): LotKey {
        return JSON.stringify([
            delivery.originalSource,
            delivery.name ?? delivery.id,
            delivery.lot ?? delivery.id,
        ]);
    }

    private getIngredientsByLotKey(): Map<LotKey, Set<DeliveryId>> | null {
        const ingredientsByDelivery: Map<
            DeliveryId,
            Set<DeliveryId>
        > = new Map();

        for (const deliveryId of this.contentData.station.outgoing) {
            ingredientsByDelivery.set(deliveryId, new Set());
        }

        for (const connection of this.contentData.station.connections) {
            ingredientsByDelivery
                .get(connection.target)!
                .add(connection.source);
        }

        const ingredientsByLotKey: Map<LotKey, Set<DeliveryId>> = new Map();
        let valid = true;

        ingredientsByDelivery.forEach((ingredientsIds, deliveryId) => {
            const delivery = this.contentData.deliveries.get(deliveryId)!;

            if (delivery.lot == null || delivery.name == null) {
                valid = false;
            } else {
                const lotKey = this.getInternalLotKey(delivery);
                if (!ingredientsByLotKey.has(lotKey)) {
                    ingredientsByLotKey.set(lotKey, ingredientsIds);
                } else {
                    const expectedIngredientsIds =
                        ingredientsByLotKey.get(lotKey)!;
                    const areEqual =
                        ingredientsIds.size === expectedIngredientsIds.size &&
                        Array.from(ingredientsIds).find(
                            (id) => !expectedIngredientsIds.has(id),
                        ) == null;

                    if (!areEqual) {
                        valid = false;
                    }
                }
            }
        });

        return valid ? ingredientsByLotKey : null;
    }

    private initDeliveryBasedData() {
        const nodeInMap = new Map<DeliveryId, NodeDatum>();
        const nodeOutMap = new Map<DeliveryId, NodeDatum>();

        for (const deliveryId of this.contentData.station.incoming) {
            nodeInMap.set(deliveryId, this.createDeliveryNode(deliveryId));
        }

        for (const deliveryId of this.contentData.station.outgoing) {
            nodeOutMap.set(deliveryId, this.createDeliveryNode(deliveryId));
        }

        this.nodeInData = Array.from(nodeInMap.values());
        this.nodeOutData = Array.from(nodeOutMap.values());
        this.edgeData = [];

        for (const connection of this.contentData.station.connections) {
            const source = nodeInMap.get(connection.source)!;
            const target = nodeOutMap.get(connection.target)!;
            this.edgeData.push({
                source: source,
                target: target,
                invisible: source.invisible || target.invisible,
            });
        }
    }

    private initLotBasedData(
        ingredientsByLotKey: Map<LotKey, Set<DeliveryId>>,
    ) {
        const deliveriesByLotKey: Map<LotKey, DeliveryId[]> = new Map();

        this.contentData.deliveries.forEach((delivery) => {
            const lotKey = this.getInternalLotKey(delivery);

            if (deliveriesByLotKey.has(lotKey)) {
                deliveriesByLotKey.get(lotKey)!.push(delivery.id);
            } else {
                deliveriesByLotKey.set(lotKey, [delivery.id]);
            }
        });

        const nodeInMap = new Map<DeliveryId, NodeDatum>();
        const nodeOutMap = new Map<LotKey, NodeDatum>();

        for (const deliveryId of this.contentData.station.incoming) {
            nodeInMap.set(deliveryId, this.createDeliveryNode(deliveryId));
        }

        this.nodeInData = Array.from(nodeInMap.values());
        this.edgeData = [];

        ingredientsByLotKey.forEach((ingredientsIds, lotKey) => {
            const names: Set<string> = new Set();
            const lotDeliveryIds = deliveriesByLotKey.get(lotKey);
            if (lotDeliveryIds) {
                const lotDeliveries = lotDeliveryIds.map((deliveryId) =>
                    this.contentData.deliveries.get(deliveryId),
                );
                for (const delivery of lotDeliveries) {
                    names.add(delivery!.name ?? "");
                }

                nodeOutMap.set(lotKey, {
                    id: lotKey,
                    name: Array.from(names).join("/"),
                    lot: lotDeliveries[0]!.lot,
                    deliveryIds: lotDeliveryIds,
                    invisible: lotDeliveries.every(
                        (delivery) => delivery?.invisible,
                    ),
                    x: 0,
                    y: 0,
                });

                ingredientsIds.forEach((ingredientId) => {
                    const source = nodeInMap.get(ingredientId);
                    const target = nodeOutMap.get(lotKey);
                    if (source && target) {
                        this.edgeData.push({
                            source: source,
                            target: target,
                            invisible: source.invisible || target.invisible,
                        });
                    }
                });
            }
        });

        this.nodeOutData = Array.from(nodeOutMap.values());
    }

    private addNodesHeader(): void {
        const headers = [
            {
                x: StationPropertiesComponent.TEXT_X_PADDING,
                label: StationPropertiesComponent.INCOMING_HEADER,
            },
            {
                x:
                    StationPropertiesComponent.SVG_WIDTH -
                    StationPropertiesComponent.NODE_WIDTH -
                    1 +
                    StationPropertiesComponent.TEXT_X_PADDING,
                label: StationPropertiesComponent.OUTGOING_HEADER,
            },
        ];

        const nodesHeaderG = this.svg.append<SVGElement>("g");

        headers.forEach((header) => {
            const text = nodesHeaderG
                .append("text")
                .attr("text-anchor", "left");
            text.append("tspan")
                .attr("x", header.x)
                .attr("dy", 15)
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .text(header.label);
        });
    }

    private addNodes() {
        const updateColor = (
            nodes: d3.Selection<SVGElement, any, any, any>,
            hovered: boolean,
            invisible: boolean,
        ) => {
            nodes
                .selectAll("rect")
                .attr(
                    "fill",
                    Utils.colorToCss(
                        hovered
                            ? Constants.HOVER_FILL_COLOR
                            : Constants.DEFAULT_FILL_COLOR,
                    ),
                )
                .attr(
                    "stroke",
                    Utils.colorToCss(
                        hovered
                            ? Constants.HOVER_STROKE_COLOR
                            : invisible
                              ? Constants.INVISIBLE_COLOR
                              : Constants.DEFAULT_STROKE_COLOR,
                    ),
                );
        };
        const initRectAndText = (
            nodes: d3.Selection<SVGElement, NodeDatum, any, any>,
            isIncoming: boolean,
        ) => {
            nodes.attr(
                "transform",
                (d) => "translate(" + d.x + "," + d.y + ")",
            );
            nodes
                .append("rect")
                .attr("stroke-width", "2px")
                .attr("width", StationPropertiesComponent.NODE_WIDTH)
                .attr("height", StationPropertiesComponent.NODE_HEIGHT)
                .attr("fill", Utils.colorToCss(Constants.DEFAULT_FILL_COLOR))
                .attr("stroke", (datum) =>
                    Utils.colorToCss(
                        datum.invisible
                            ? Constants.INVISIBLE_COLOR
                            : Constants.DEFAULT_STROKE_COLOR,
                    ),
                );

            const text = nodes.append("text").attr("text-anchor", "left");

            text.append("tspan")
                .attr("x", StationPropertiesComponent.TEXT_X_PADDING)
                .attr("dy", 15)
                .attr("font-size", "14px")
                .text((d) =>
                    d.lot != null
                        ? d.name + " (" + d.lot + ")"
                        : (d.name ?? ""),
                );
            text.filter((d) => d.station != null)
                .append("tspan")
                .attr("x", StationPropertiesComponent.TEXT_X_PADDING)
                .attr("dy", 15)
                .attr("font-size", "14px")
                .text((d) =>
                    isIncoming ? "from: " + d.station : "to: " + d.station,
                );
            text.filter((d) => d.date != null)
                .append("tspan")
                .attr("x", StationPropertiesComponent.TEXT_X_PADDING)
                .attr("dy", 15)
                .attr("font-size", "12px")
                .text((d) => d.date ?? "");
        };

        const newNodesIn = this.nodesInG
            .selectAll<SVGElement, NodeDatum>("g")
            .data(this.nodeInData, (d) => d.id)
            .enter()
            .append<SVGElement>("g");
        const newNodesOut = this.nodesOutG
            .selectAll<SVGElement, NodeDatum>("g")
            .data(this.nodeOutData, (d) => d.id)
            .enter()
            .append<SVGElement>("g");

        initRectAndText(newNodesIn, true);
        initRectAndText(newNodesOut, false);

        newNodesIn
            .on("mouseover", (event, inNode: NodeDatum) => {
                updateColor(
                    d3.select(event.currentTarget),
                    true,
                    inNode.invisible,
                );
                this.hoverDeliveries(inNode.deliveryIds);
            })
            .on("mouseout", (event, inNode) => {
                updateColor(
                    d3.select(event.currentTarget),
                    false,
                    inNode.invisible,
                );
                this.hoverDeliveries([]);
            });

        newNodesOut
            .on("mouseover", (event, outNode: NodeDatum) => {
                updateColor(
                    d3.select(event.currentTarget),
                    true,
                    outNode.invisible,
                );
                this.hoverDeliveries(outNode.deliveryIds);
            })
            .on("mouseout", (event, outNode) => {
                updateColor(
                    d3.select(event.currentTarget),
                    false,
                    outNode.invisible,
                );
                this.hoverDeliveries([]);
            });
    }

    private updateEdges() {
        // eslint-disable-next-line no-shadow, @typescript-eslint/no-shadow
        const updateColor = (
            edges: d3.Selection<SVGElement, any, any, any>,
            hovered: boolean,
            invisible: boolean,
        ) => {
            edges.attr(
                "stroke",
                Utils.colorToCss(
                    hovered
                        ? Constants.HOVER_STROKE_COLOR
                        : invisible
                          ? Constants.INVISIBLE_COLOR
                          : Constants.DEFAULT_STROKE_COLOR,
                ),
            );
        };

        const edges = this.edgesG
            .selectAll<SVGElement, EdgeDatum>("path")
            .data(
                this.edgeData,
                (d) => d.source.id + Constants.ARROW_STRING + d.target.id,
            );
        const newEdges = edges
            .enter()
            .append<SVGElement>("path")
            .attr("d", (edgeDatum) =>
                StationPropertiesComponent.line(
                    edgeDatum.source.x + StationPropertiesComponent.NODE_WIDTH,
                    edgeDatum.source.y +
                        StationPropertiesComponent.NODE_HEIGHT / 2,
                    edgeDatum.target.x,
                    edgeDatum.target.y +
                        StationPropertiesComponent.NODE_HEIGHT / 2,
                ),
            )
            .attr("stroke", (edgeDatum) =>
                Utils.colorToCss(
                    edgeDatum.invisible
                        ? Constants.INVISIBLE_COLOR
                        : Constants.DEFAULT_STROKE_COLOR,
                ),
            )
            .attr("fill", "none")
            .attr("stroke-width", "6px")
            .attr("cursor", "default");

        edges.exit().remove();

        newEdges
            .on("mouseover", (event, edge: EdgeDatum) => {
                if (this.selected == null) {
                    updateColor(
                        d3.select(event.currentTarget),
                        true,
                        edge.invisible,
                    );
                    this.hoverDeliveries(
                        concat(
                            edge.source.deliveryIds,
                            edge.target.deliveryIds,
                        ),
                    );
                }
            })
            .on("mouseout", (event, edge) => {
                updateColor(
                    d3.select(event.currentTarget),
                    false,
                    edge.invisible,
                );
                this.hoverDeliveries([]);
            });
    }

    private hoverDeliveries(deliveryIds: DeliveryId[]): void {
        this.store.dispatch(
            new SetHoverDeliveriesSOA({ deliveryIds: deliveryIds }),
        );
    }

    private updateConnectLine() {
        if (this.selected != null) {
            const mousePos = d3.pointer(this.svg.node());

            this.connectLine.attr(
                "d",
                StationPropertiesComponent.line(
                    this.selected.x + StationPropertiesComponent.NODE_WIDTH,
                    this.selected.y +
                        StationPropertiesComponent.NODE_HEIGHT / 2,
                    mousePos[0],
                    mousePos[1],
                ),
            );
        }
    }
}
