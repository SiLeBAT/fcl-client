import { Layout, Position } from "@app/tracing/data.model";
import { COLORS } from "@app/tracing/util/colors";
import { Utils } from "@app/tracing/util/non-ui-utils";
import { Cy } from "../graph.model";
import { addWheelListener } from "./cy-adapter";
import { GraphData } from "./cy-graph";
import { StyleConfig } from "./cy-style";
import { getCyCanvasLayers } from "./cy-utils";
import { EVENT_TYPES } from "@app/tracing/shared/event.constants";

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
    private hiddenLayers: HTMLCanvasElement[] = [];
    private previewCanvas: HTMLCanvasElement | undefined;
    private zoomTo_: ((zoom: number, pos: Position) => void) | undefined;
    private postPreviewCb_:
        | ((graphData: GraphData, styleConfig: StyleConfig) => void)
        | undefined;

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
        this.zoomTo_ = zoomTo;
        this.postPreviewCb_ = postPreviewCb;
        this.prepareLayers(cyContainer);
        this.drawPreview();
        this.startTimeout();
    }

    private prepareLayers(cyContainer: HTMLElement): void {
        const cyCanvasLayers = getCyCanvasLayers(cyContainer);
        const layers = Object.values(cyCanvasLayers);
        layers.forEach((layer) => (layer.style.visibility = "hidden"));
        this.hiddenLayers = layers;

        const previewCanvas = document.createElement("canvas");
        previewCanvas.width = cyCanvasLayers.nodeLayer.width;
        previewCanvas.height = cyCanvasLayers.nodeLayer.height;

        cyCanvasLayers.nodeLayer.parentElement?.appendChild(previewCanvas);

        addWheelListener(
            previewCanvas,
            () => this.viewport_.zoom,
            this.zoomTo_!,
        );
        previewCanvas.addEventListener(
            EVENT_TYPES.mousedown,
            (e: MouseEvent) => e.preventDefault(),
            true,
        );
        previewCanvas.addEventListener(
            EVENT_TYPES.touchstart,
            (e: TouchEvent) => e.preventDefault(),
            true,
        );
        this.previewCanvas = previewCanvas;
    }

    private cleanupLayers(): void {
        if (this.previewCanvas) {
            this.previewCanvas.parentElement?.removeChild(this.previewCanvas);
            this.previewCanvas = undefined;
        }

        this.hiddenLayers.forEach(
            (layer) => (layer.style.visibility = "visible"),
        );
        this.hiddenLayers = [];
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
        this.previewCanvas = undefined;
        this.hiddenLayers = [];
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
