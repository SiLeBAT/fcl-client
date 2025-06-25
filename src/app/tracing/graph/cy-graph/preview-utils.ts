import { Layout, Position } from "@app/tracing/data.model";
import { COLORS } from "@app/tracing/util/colors";
import { Utils } from "@app/tracing/util/non-ui-utils";
import { Cy } from "../graph.model";
import { addWheelListener } from "./cy-adapter";
import { GraphData } from "./cy-graph";
import { StyleConfig } from "./cy-style";
import { getCyCanvasParent, getCyEventLayer, getCyNodeLayer } from "./cy-utils";

const PREVIEW_NODE_COLOR = Utils.colorToCss(COLORS.nodePreviewColor);
const PREVIEW_TIMEOUT = 400; // (E:400, S:300) works good
export const PREVIEW_TRIGGER_TRESHOLD = 300;

export interface IPreviewHandler {
    viewport: Layout;
    stopPreview(): void;
    setSuspendedGraphUpdate(
        graphData: GraphData,
        styleConfig: StyleConfig,
    ): void;
    destroy(): void;
}

export class PreviewHandler implements IPreviewHandler {
    private timeoutHandle_: number | undefined;
    private oldNodeLayerVisibility = "";
    private oldEventLayerVisibility = "";
    private previewCanvas: HTMLCanvasElement | undefined;
    private zoomTo_: ((zoom: number, pos: Position) => void) | undefined;
    private postPreviewCb_:
        | ((graphData: GraphData, styleConfig: StyleConfig) => void)
        | undefined;
    private cyContainer: HTMLElement | undefined;

    get graphData(): GraphData {
        return this.graphData_;
    }

    get style(): StyleConfig {
        return this.styleConfig_;
    }

    set viewport(viewport: Layout) {
        this.viewport_ = viewport;
        this.drawPreview();
        this.resetTimeout();
    }

    get viewport(): Layout {
        return this.viewport_;
    }

    constructor(
        cyContainer: HTMLElement,
        private graphData_: GraphData,
        private styleConfig_: StyleConfig,
        private viewport_: Layout,
        zoomTo: (zoom: number, pos: Position) => void,
        postPreviewCb: (graphData: GraphData, styleConfig: StyleConfig) => void,
    ) {
        this.cyContainer = cyContainer;
        this.zoomTo_ = zoomTo;
        this.postPreviewCb_ = postPreviewCb;
        this.prepareLayers();
        this.drawPreview();
        this.startTimeout();
    }

    private prepareLayers(): void {
        const nodeLayer = getCyNodeLayer(this.cyContainer!);
        const nodeLayerParent = getCyCanvasParent(this.cyContainer!);
        const eventLayer = getCyEventLayer(this.cyContainer!)!;
        if (!nodeLayer) {
            throw new Error(`Could not find node layer!`);
        }
        if (!nodeLayerParent) {
            throw new Error(`Could not find node layer parent!`);
        }
        if (!eventLayer) {
            throw new Error(`Could not find event layer!`);
        }
        this.oldNodeLayerVisibility = nodeLayer.style.visibility;
        nodeLayer.style.visibility = "hidden";

        this.oldEventLayerVisibility = eventLayer.style.visibility;
        eventLayer.style.visibility = "hidden";

        const previewCanvas = document.createElement("canvas");
        previewCanvas.width = nodeLayer.width;
        previewCanvas.height = nodeLayer.height;

        nodeLayerParent.appendChild(previewCanvas);
        addWheelListener(
            previewCanvas,
            () => this.viewport_.zoom,
            this.zoomTo_!,
        );
        previewCanvas.addEventListener(
            "mousedown",
            (e: MouseEvent) => e.preventDefault(),
            true,
        );
        previewCanvas.addEventListener(
            "touchstart",
            (e: TouchEvent) => e.preventDefault(),
            true,
        );
        this.previewCanvas = previewCanvas;
    }

    private cleanupLayers(): void {
        const previewCanvas = this.previewCanvas;
        if (previewCanvas) {
            const parentElement = getCyCanvasParent(this.cyContainer!);
            if (parentElement) {
                parentElement.removeChild(previewCanvas);
            }
            this.previewCanvas = undefined;
        }
        const nodeLayer = getCyNodeLayer(this.cyContainer!);
        if (nodeLayer) {
            nodeLayer.style.visibility = this.oldNodeLayerVisibility;
        }
        const eventLayer = getCyEventLayer(this.cyContainer!)!;
        eventLayer.style.visibility = this.oldEventLayerVisibility;
        this.previewCanvas = undefined;
    }

    stopPreview(): void {
        this.clearTimeout();
        this.cleanupLayers();
        this.postPreviewCb_!(this.graphData_, this.styleConfig_);
        this.destroy();
    }

    private resetTimeout(): void {
        this.clearTimeout();
        this.startTimeout();
    }

    private startTimeout(): void {
        this.timeoutHandle_ = window.setTimeout(() => {
            this.timeoutHandle_ = window.setTimeout(() => {
                this.timeoutHandle_ = undefined;
                this.stopPreview();
            }, PREVIEW_TIMEOUT);
        }, 0);
    }

    private clearTimeout(): void {
        if (this.timeoutHandle_ !== undefined) {
            window.clearTimeout(this.timeoutHandle_);
            this.timeoutHandle_ = undefined;
        }
    }

    private drawPreview(): void {
        if (!this.previewCanvas) {
            return;
        }
        if (!this.previewCanvas.getContext) {
            return;
        }

        const ctx = this.previewCanvas.getContext("2d");
        if (!ctx) {
            return;
        }
        // not supported by TS
        // ctx.reset();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const r = this.styleConfig_.nodeSize / 2.0;
        const endAngle = 2 * Math.PI;
        const zoom = this.viewport_.zoom;
        const panX = this.viewport_.pan.x;
        const panY = this.viewport_.pan.y;
        ctx.fillStyle = PREVIEW_NODE_COLOR;

        const nodePositions = this.graphData_.nodePositions;
        this.graphData_.nodeData.forEach((n) => {
            const p = nodePositions[n.id];
            ctx.beginPath();
            ctx.arc(panX + p.x * zoom, panY + p.y * zoom, r, 0, endAngle);
            ctx.fill();
        });
    }

    setSuspendedGraphUpdate(
        graphData: GraphData,
        styleConfig: StyleConfig,
    ): void {
        this.graphData_ = graphData;
        this.styleConfig_ = styleConfig;
        this.viewport_ = graphData.layout ?? this.viewport_;
    }

    destroy(): void {
        this.cyContainer = undefined;
        this.previewCanvas = undefined;
        this.zoomTo_ = undefined;
        this.postPreviewCb_ = undefined;
    }
}

export function createPreviewHandler(
    cy: Cy,
    viewport: Layout,
    graphData: GraphData,
    styleConfig: StyleConfig,
    zoomTo: (zoom: number, pos: Position) => void,
    postPreviewCb: (graphData: GraphData, styleConfig: StyleConfig) => void,
): IPreviewHandler {
    return new PreviewHandler(
        cy.container()!,
        graphData,
        styleConfig,
        viewport,
        zoomTo,
        postPreviewCb,
    );
}
