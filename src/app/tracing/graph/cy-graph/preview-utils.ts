import { Layout, Position } from "@app/tracing/data.model";
import { COLORS } from "@app/tracing/util/colors";
import { Utils } from "@app/tracing/util/non-ui-utils";
import { Cy } from "../graph.model";
import { addWheelListener } from "./cy-adapter";
import { GraphData } from "./cy-graph";
import { StyleConfig } from "./cy-style";
import { getCyCanvasParent, getCyNodeLayer } from "./cy-utils";

const NODE_COLOR = Utils.colorToCss(COLORS.nodePreviewColor);
const PREVIEW_TIMEOUT = 200;

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
        // console.log(`Updating preview viewport ${Date.now() % 60000 }`);
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
        // console.log(`starting preview (${Date.now() % 60000})`);
        this.cyContainer = cyContainer;
        this.zoomTo_ = zoomTo;
        this.postPreviewCb_ = postPreviewCb;
        this.prepareLayers();
        this.drawPreview();
        this.startTimeout();
    }

    private prepareLayers(): void {
        // console.log(`preparing Layers ...`);
        const nodeLayer = getCyNodeLayer(this.cyContainer!);
        if (!nodeLayer) {
            throw new Error(`Could not find node layer!`);
        }
        this.oldNodeLayerVisibility = nodeLayer.style.visibility;
        nodeLayer.style.visibility = "hidden";
        const nodeLayerParent = getCyCanvasParent(this.cyContainer!);
        if (!nodeLayerParent) {
            throw new Error(`Could not find node layer parent!`);
        }
        const previewCanvas = document.createElement("canvas");
        // previewCanvas.style["border-style"] = "solid";
        previewCanvas.width = nodeLayer.width;
        previewCanvas.height = nodeLayer.height;
        nodeLayerParent.appendChild(previewCanvas);
        addWheelListener(
            previewCanvas,
            () => this.viewport_.zoom,
            this.zoomTo_!,
        );
        this.previewCanvas = previewCanvas;
    }

    private cleanupLayers(): void {
        // console.log(`cleaning up layers`);
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
        this.previewCanvas = undefined;
        // this.cyContainer_ = undefined;
    }

    stopPreview(): void {
        // console.log(`stopping preview`);
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
        // console.log(`timeout started ${Date.now() % 60000 }`)
        this.timeoutHandle_ = window.setTimeout(() => {
            // console.log(`Stopping preview by timeout ${Date.now() % 60000 }`);
            this.timeoutHandle_ = undefined;
            this.stopPreview();
        }, PREVIEW_TIMEOUT);
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
        ctx.fillStyle = NODE_COLOR;

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
    }

    destroy(): void {
        this.cyContainer = undefined;
        this.previewCanvas = undefined;
        this.zoomTo_ = undefined;
        this.postPreviewCb_ = undefined;
        // this.cyContainer_ = undefined;
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
