import { Cy } from "../graph.model";
import { Position } from "../../data.model";
import * as Hammer from "hammerjs";
import { getNormalizedWheelDY } from "./normalize-wheel";
import { EVENT_TYPES } from "@app/tracing/shared/event.constants";

const HAMMER_EVENT_PINCH_START = "pinchstart";
const HAMMER_EVENT_PINCH_IN = "pinchin";
const HAMMER_EVENT_PINCH_OUT = "pinchout";
const HAMMER_EVENT_PINCH_END = "pinchend";
const HAMMER_EVENT_PINCH_CANCEL = "pinchcancel";

const ZOOM_FACTOR_PER_WHEEL_TICK = 1.02;

function getNormalizedZoomFactor(event: WheelEvent): number {
    const normalizedWheelDY = getNormalizedWheelDY(event);
    // eslint-disable-next-line no-console
    console.log(`dY: ${event.deltaY}, nDY: ${normalizedWheelDY}`);
    // return Math.pow(10, 0.0005 * -normalizedWheelDY);
    return ZOOM_FACTOR_PER_WHEEL_TICK ** -normalizedWheelDY;
}

function useFastZoom(event: WheelEvent): boolean {
    // eslint-disable-next-line no-console
    console.log(`use fast zoom: ${event.ctrlKey}`);
    return event.ctrlKey;
}

export function addCustomZoomAdapter(
    cy: Cy,
    getCurrentZoom: () => number,
    zoomTo: (zoom: number, zPos: Position) => void,
): void {
    const container = cy.container();
    if (container) {
        const canvasElement = container.children.item(0)?.children.item(0);
        if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
            throw new Error(
                `Cannot add Zoom adapter, canvas element not found.`,
            );
        }

        const hammer = new Hammer.Manager(canvasElement, {
            recognizers: [[Hammer.Pinch]],
        });
        let pinchCenter: Position;
        let pinchScale: number;

        hammer.on(HAMMER_EVENT_PINCH_START, (e) => {
            cy.userPanningEnabled(false);

            const cyRect = container.getBoundingClientRect();

            pinchCenter = {
                x: e.center.x - cyRect.left,
                y: e.center.y - cyRect.top,
            };
            pinchScale = e.scale;
        });
        hammer.on(
            [HAMMER_EVENT_PINCH_IN, HAMMER_EVENT_PINCH_OUT].join(" "),
            (e) => {
                zoomTo((getCurrentZoom() * e.scale) / pinchScale, {
                    x: pinchCenter.x,
                    y: pinchCenter.y,
                });
                pinchScale = e.scale;
            },
        );
        hammer.on(
            [HAMMER_EVENT_PINCH_END, HAMMER_EVENT_PINCH_CANCEL].join(" "),
            () => {
                cy.userPanningEnabled(true);
            },
        );

        const wheelListener = (e: WheelEvent) => {
            if (e.deltaY === 0) {
                return;
            }
            const fastZoom = useFastZoom(e);
            if (fastZoom) {
                e.preventDefault();
            }

            const zoomFactor =
                getNormalizedZoomFactor(e) ** (useFastZoom(e) ? 4 : 1);

            zoomTo(getCurrentZoom() * zoomFactor, {
                x: e.offsetX,
                y: e.offsetY,
            });
        };

        canvasElement.addEventListener(EVENT_TYPES.wheel, wheelListener, false);
    }
}
