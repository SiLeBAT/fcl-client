import { Range } from "@app/tracing/data.model";
import { getRange, isArrayNotEmpty } from "@app/tracing/util/non-ui-utils";
import cytoscape from "cytoscape";
import { GraphElementData } from "../graph.model";
import { CSS_CLASS_HOVER } from "./cy.constants";

enum GraphSize {
    SMALL,
    LARGE,
    HUGE,
}

export interface StyleConfig {
    nodeSize: number;
    edgeWidth: number;
    fontSize: number;
}

function isZeroRange(range: Range): boolean {
    return range.min === range.max;
}

function getZeroRange(value: number): Range {
    return { min: value, max: value };
}

function getScaledRange(range: Range, scale: number): Range {
    return { min: range.min * scale, max: range.max * scale };
}

function getMapDataString(
    property: string,
    fromRange: Range,
    toRange: Range,
): string {
    return isZeroRange(fromRange)
        ? toRange.min.toString()
        : `mapData(${property}, ${fromRange.min}, ${fromRange.max}, ${toRange.min}, ${toRange.max})`;
}

export class CyStyle {
    private static readonly NODE_SIZE_TO_BORDER_WIDTH_FACTOR = 1 / 20;
    private static readonly SELECTED_EDGE_WIDTH_FACTOR = 3;
    private static readonly META_NODE_BORDER_WIDTH_FACTOR = 2;
    private static readonly SELECTED_NODE_BORDER_WIDTH_FACTOR = 2;
    private static readonly MAX_STATION_NUMBER_FOR_SMALL_GRAPHS = 1000;
    private static readonly MAX_DELIVERIES_NUMBER_FOR_SMALL_GRAPHS = 3000;
    private static readonly SIZE_ONE_SIZE_FACTOR = 2;
    private static readonly MAX_EDGE_WIDTH = 20;
    private static readonly DEFAULT_EDGE_WIDTH_RANGE_LENGTH = 10;

    private static readonly DEFAULT_ACTIVE_OVERLAY_OPACITY = 0.5;
    private static readonly DEFAULT_ACTIVE_OVERLAY_COLOR = "rgb(0, 0, 255)";
    private static readonly DEFAULT_ACTIVE_OVERLAY_PADDING = 10;
    private static readonly MIN_STEP_SIZE = 20;
    private static readonly ARROW_SCALE = 1.0;

    private fromNodeSizeRange: Range = { min: 0, max: 0 };
    private fromEdgeWidthRange: Range = { min: 0, max: 0 };

    constructor(
        private graphData: GraphElementData,
        private styleConfig: StyleConfig,
    ) {
        this.initSizeLimits();
    }

    private initSizeLimits(): void {
        const sizes = this.graphData.nodeData.map((n) => n.size);
        const widths = this.graphData.edgeData.map((e) => e.width);

        this.fromNodeSizeRange = isArrayNotEmpty(sizes)
            ? getRange(sizes)
            : getZeroRange(0);
        this.fromEdgeWidthRange = isArrayNotEmpty(widths)
            ? getRange(widths)
            : getZeroRange(0);
    }

    createCyStyle(): Record<string, unknown> {
        const graphSize = this.getProperGraphSize();
        return this.createXGraphStyle(graphSize);
    }

    private getProperGraphSize(): GraphSize {
        if (
            this.graphData.nodeData.length >
            CyStyle.MAX_STATION_NUMBER_FOR_SMALL_GRAPHS
        ) {
            return GraphSize.HUGE;
        } else if (
            this.graphData.edgeData.length >
            CyStyle.MAX_DELIVERIES_NUMBER_FOR_SMALL_GRAPHS
        ) {
            return GraphSize.LARGE;
        } else {
            return GraphSize.SMALL;
        }
    }

    private createNodeSizeStyle(): { height: string; width: string } {
        const nodeSizeMapString = this.createNodeSizeMapString();
        return {
            height: nodeSizeMapString,
            width: nodeSizeMapString,
        };
    }

    private createXGraphStyle(graphSize: GraphSize): any {
        const fontSize = this.styleConfig.fontSize;
        const nodeSize = this.styleConfig.nodeSize;
        // usually a bad style to have magic numbers within code
        // but here it might be more convenient in this way
        const stepSizeWithoutLabelSpace =
            this.getSelectedEdgeWidthRange().max * 2 + CyStyle.MIN_STEP_SIZE;
        const stepSizeWithLabelSpace =
            Math.max(this.getSelectedEdgeWidthRange().max * 1.7, 5) +
            fontSize * 2.0;

        const style = cytoscape
            .stylesheet()
            .selector("*")
            .style({
                "overlay-color": CyStyle.DEFAULT_ACTIVE_OVERLAY_COLOR,
                "overlay-padding": CyStyle.DEFAULT_ACTIVE_OVERLAY_PADDING,
                "overlay-opacity": 0.0,
            })
            .selector("." + CSS_CLASS_HOVER)
            .style({
                "overlay-opacity": CyStyle.DEFAULT_ACTIVE_OVERLAY_OPACITY,
            })
            .selector("node")
            .style({
                ...(graphSize !== GraphSize.HUGE
                    ? {
                          content: "data(label)",
                          "text-valign": "bottom",
                          "text-halign": "right",
                          "text-wrap": "none",
                          "font-size": fontSize,
                      }
                    : {}),
                shape: "data(shape)",
                ...this.createNodeSizeStyle(),
                "background-fill": "linear-gradient",
                "background-gradient-stop-colors": "data(stopColors)",
                "background-gradient-stop-positions": "data(stopPositions)",
                "background-gradient-direction": "to-right",
                "border-width":
                    nodeSize * CyStyle.NODE_SIZE_TO_BORDER_WIDTH_FACTOR,
                "border-color": "rgb(0, 0, 0)",
                "z-index": "data(zindex)",
                color: "rgb(0, 0, 0)",
            })

            .selector("edge")
            .style({
                ...(graphSize !== GraphSize.HUGE
                    ? {
                          content: "data(label)",
                          "text-wrap": "none",
                          "text-rotation": "autorotate",
                          "font-size": fontSize,
                      }
                    : {}),
                "control-point-step-size": stepSizeWithoutLabelSpace,
                "target-arrow-shape": "triangle-cross",
                "target-arrow-color": "rgb(0, 0, 0)",
                "curve-style":
                    graphSize === GraphSize.SMALL ? "bezier" : "straight",
                "line-fill": "linear-gradient",
                "line-gradient-stop-colors": "data(stopColors)",
                "line-gradient-stop-positions": "data(stopPositions)",
                "z-index": "data(zindex)",
                width: this.createEdgeWidthMapString(),
                "arrow-scale": CyStyle.ARROW_SCALE,
            })

            .selector("node:selected")
            .style({
                "background-color": "rgb(128, 128, 255)",
                "border-width":
                    nodeSize *
                    CyStyle.NODE_SIZE_TO_BORDER_WIDTH_FACTOR *
                    CyStyle.SELECTED_NODE_BORDER_WIDTH_FACTOR,
                "border-color": "rgb(0, 0, 255)",
                color: "rgb(0, 0, 255)",
            })
            .selector("edge:selected:inactive")
            .style({
                width: this.createSelectedEdgeWidthString(),
                color: "rgb(0, 0, 255)",
                "overlay-color": "rgb(0, 0, 255)",
                "overlay-padding":
                    this.createSelectedEdgeOverlayPaddingMapString(),
                "overlay-opacity": 1,
                "target-arrow-color": "rgb(0, 0, 255)",
            })
            .selector("edge:selected:inactive." + CSS_CLASS_HOVER)
            .style({
                "overlay-color": CyStyle.DEFAULT_ACTIVE_OVERLAY_COLOR,
                "overlay-padding": CyStyle.DEFAULT_ACTIVE_OVERLAY_PADDING,
                "overlay-opacity": CyStyle.DEFAULT_ACTIVE_OVERLAY_OPACITY,
            })
            .selector("edge[?wLabelSpace]")
            .style({
                ...(graphSize !== GraphSize.HUGE
                    ? {
                          "control-point-step-size": stepSizeWithLabelSpace,
                      }
                    : {}),
            })
            .selector("edge.edge-label-disabled")
            .style({
                content: "",
            })
            .selector("node.ghost-element")
            .style({
                color: "rgb(179, 170, 179)",
                "border-color": "rgb(179, 170, 179)",
            })
            .selector("edge.ghost-element")
            .style({
                color: "rgb(179, 170, 179)",
                "target-arrow-color": "rgb(179, 170, 179)",
            })
            .selector("node[?isMeta]")
            .style({
                "border-width":
                    nodeSize *
                    CyStyle.NODE_SIZE_TO_BORDER_WIDTH_FACTOR *
                    CyStyle.META_NODE_BORDER_WIDTH_FACTOR,
            })
            .selector("node:selected[?isMeta]")
            .style({
                "border-width":
                    nodeSize *
                    CyStyle.NODE_SIZE_TO_BORDER_WIDTH_FACTOR *
                    CyStyle.META_NODE_BORDER_WIDTH_FACTOR *
                    CyStyle.SELECTED_NODE_BORDER_WIDTH_FACTOR,
            })
            .selector(":active")
            .style({
                "overlay-opacity": 0.5,
            })
            .selector("edge.preview")
            .style({
                content: "",
                display: "none",
            })
            .selector("node.preview")
            .style({
                content: "",
                shape: "ellipse",
                // "display": "none",
                "background-fill": "solid",
                //"background-gradient-stop-colors": "",
                //"background-gradient-stop-positions": "",
                //"background-gradient-direction": "",
                "border-color": "red",
                "border-width": 0,
                color: "rgb(0, 0, 0)",
                size: nodeSize,
            });
        return style;
    }

    private getProjectedNodeSizeRange(): Range {
        if (!isZeroRange(this.fromNodeSizeRange)) {
            const minNodeSize = this.styleConfig.nodeSize;
            return {
                min: minNodeSize,
                max:
                    minNodeSize *
                    CyStyle.SIZE_ONE_SIZE_FACTOR *
                    this.fromNodeSizeRange.max,
            };
        }
        return getZeroRange(this.styleConfig.nodeSize);
    }

    private createNodeSizeMapString(): string {
        return getMapDataString(
            "size",
            this.fromNodeSizeRange,
            this.getProjectedNodeSizeRange(),
        );
    }

    private getProjectedEdgeWidthRange(): Range {
        if (!isZeroRange(this.fromEdgeWidthRange)) {
            const minEdgeWidth = this.styleConfig.edgeWidth;
            return {
                min: minEdgeWidth,
                max: Math.max(
                    minEdgeWidth,
                    Math.min(
                        minEdgeWidth + CyStyle.DEFAULT_EDGE_WIDTH_RANGE_LENGTH,
                        CyStyle.MAX_EDGE_WIDTH,
                    ),
                ),
            };
        }
        return getZeroRange(this.styleConfig.edgeWidth);
    }

    private getSelectedEdgeWidthRange(): Range {
        return getScaledRange(
            this.getProjectedEdgeWidthRange(),
            CyStyle.SELECTED_EDGE_WIDTH_FACTOR,
        );
    }

    private getSelectedEdgeOverlayPaddingRange(): Range {
        return getScaledRange(this.getSelectedEdgeWidthRange(), 1 / 5.0);
    }

    private createEdgeWidthMapString(): string {
        return getMapDataString(
            "width",
            this.fromEdgeWidthRange,
            this.getProjectedEdgeWidthRange(),
        );
    }

    private createSelectedEdgeWidthString(): string {
        return getMapDataString(
            "width",
            this.fromEdgeWidthRange,
            this.getSelectedEdgeWidthRange(),
        );
    }

    private createSelectedEdgeOverlayPaddingMapString(): string {
        return getMapDataString(
            "width",
            this.fromEdgeWidthRange,
            this.getSelectedEdgeOverlayPaddingRange(),
        );
    }
}
