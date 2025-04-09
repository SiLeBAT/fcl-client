import { Cy } from "../graph.model";
import { Position } from "../../data.model";
import * as Hammer from "hammerjs";
import { getCyEventLayer } from "./cy-utils";

const DOM_EVENT_WHEEL = "wheel";

const HAMMER_EVENT_PINCH_START = "pinchstart";
const HAMMER_EVENT_PINCH_IN = "pinchin";
const HAMMER_EVENT_PINCH_OUT = "pinchout";
const HAMMER_EVENT_PINCH_END = "pinchend";
const HAMMER_EVENT_PINCH_CANCEL = "pinchcancel";

function addPinchListeners(
    htmlElement: HTMLElement,
    getCurrentZoom: () => number,
    zoomTo: (zoom: number, zPos: Position) => void,
    getRefRect: () => DOMRect,
    beforePinchStart?: () => void,
    afterPinchEnd?: () => void,
): void {
    const hammer = new Hammer.Manager(htmlElement, {
        recognizers: [[Hammer.Pinch]],
    });
    let pinchCenter: Position;
    let pinchScale: number;

    hammer.on(HAMMER_EVENT_PINCH_START, (e) => {
        if (beforePinchStart) {
            beforePinchStart();
        }
        const refRect = getRefRect();

        pinchCenter = {
            x: e.center.x - refRect.left,
            y: e.center.y - refRect.top,
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
    if (afterPinchEnd) {
        hammer.on(
            [HAMMER_EVENT_PINCH_END, HAMMER_EVENT_PINCH_CANCEL].join(" "),
            afterPinchEnd,
        );
    }
}

export function addWheelListener(
    htmlElement: HTMLElement,
    getCurrentZoom: () => number,
    zoomTo: (zoom: number, zPos: Position) => void,
): void {
    const wheelListener = (e: WheelEvent) => {
        zoomTo(
            getCurrentZoom() *
                Math.pow(
                    10,
                    e.deltaMode === 1 ? e.deltaY / -25 : e.deltaY / -250,
                ),
            {
                x: e.offsetX,
                y: e.offsetY,
            },
        );
    };

    htmlElement.addEventListener(DOM_EVENT_WHEEL, wheelListener, false);
}

// function addZoomAdapter(
//     canvasElement: HTMLCanvasElement,
//     getCurrentZoom: () => number,
//     zoomTo: (zoom: number, zPos: Position) => void,
// ): void {
//         const container = canvasElement.parentElement?.parentElement;
//         if (!container || !(canvasElement instanceof HTMLCanvasElement)) {
//             throw new Error(
//                 `Cannot add Zoom adapter, container element was not found.`,
//             );
//         }
//         // const htmlElement = container.children.item(0)?.children.item(0);
//         // if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
//         //     throw new Error(
//         //         `Cannot add Zoom adapter, canvas element not found.`,
//         //     );
//         // }

//         const hammer = new Hammer.Manager(canvasElement, {
//             recognizers: [[Hammer.Pinch]],
//         });
//         let pinchCenter: Position;
//         let pinchScale: number;

//         hammer.on(HAMMER_EVENT_PINCH_START, (e) => {
//             cy.userPanningEnabled(false);
//             // console.log(`pinch start`);
//             //startEndZoomTO();
//             const cyRect = container.getBoundingClientRect();

//             pinchCenter = {
//                 x: e.center.x - cyRect.left,
//                 y: e.center.y - cyRect.top,
//             };
//             pinchScale = e.scale;
//         });
//         hammer.on(
//             [HAMMER_EVENT_PINCH_IN, HAMMER_EVENT_PINCH_OUT].join(" "),
//             (e) => {
//                 // console.log(`pinch in | out`);
//                 //startEndZoomTO();
//                 zoomTo((getCurrentZoom() * e.scale) / pinchScale, {
//                     x: pinchCenter.x,
//                     y: pinchCenter.y,
//                 });
//                 pinchScale = e.scale;
//             },
//         );
//         hammer.on(
//             [HAMMER_EVENT_PINCH_END, HAMMER_EVENT_PINCH_CANCEL].join(" "),
//             () => {
//                 //console.log(`pinch end | cancel`);
//                 cy.userPanningEnabled(true);
//             },
//         );

//         const wheelListener = (e: WheelEvent) => {
//             // console.log(`wheel`);
//             //startEndZoomTO();
//             zoomTo(
//                 getCurrentZoom() *
//                     Math.pow(
//                         10,
//                         e.deltaMode === 1 ? e.deltaY / -25 : e.deltaY / -250,
//                     ),
//                 {
//                     x: e.offsetX,
//                     y: e.offsetY,
//                 },
//             );
//         };

//         canvasElement.addEventListener(DOM_EVENT_WHEEL, wheelListener, false);
//     }
// }

export function addCustomZoomAdapter(
    cy: Cy,
    getCurrentZoom: () => number,
    zoomTo: (zoom: number, zPos: Position) => void,
): void {
    const container = cy.container();
    if (container) {
        const canvasElement = getCyEventLayer(container);
        if (!canvasElement) {
            throw new Error(
                `Cannot add Zoom adapter, canvas element not found.`,
            );
        }
        addPinchListeners(
            canvasElement,
            getCurrentZoom,
            zoomTo,
            () => container.getBoundingClientRect(),
            () => cy.userPanningEnabled(false),
            () => cy.userPanningEnabled(true),
        );
        addWheelListener(canvasElement, getCurrentZoom, zoomTo);
    }
}

// export function addCustomZoomAdapter(
//     cy: Cy,
//     getCurrentZoom: () => number,
//     zoomTo: (zoom: number, zPos: Position) => void,
// ): void {
//     const container = cy.container();
//     if (container) {
//         //let endZoomTOHandle;
//         // const startEndZoomTO = () => {
//         //     if (endZoomTOHandle === undefined && zoomingStarted) {
//         //         zoomingStarted();
//         //     }
//         //     if (endZoomTOHandle) {
//         //         clearTimeout(endZoomTOHandle);
//         //         endZoomTOHandle = undefined;
//         //     }
//         //     endZoomTOHandle = setTimeout(() => {
//         //         if (zoomingEnded) {
//         //             zoomingEnded();
//         //         }
//         //         endZoomTOHandle = undefined;
//         //     }, 200);
//         // }
//         const canvasElement = container.children.item(0)?.children.item(0);
//         if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
//             throw new Error(
//                 `Cannot add Zoom adapter, canvas element not found.`,
//             );
//         }

//         const hammer = new Hammer.Manager(canvasElement, {
//             recognizers: [[Hammer.Pinch]],
//         });
//         let pinchCenter: Position;
//         let pinchScale: number;

//         hammer.on(HAMMER_EVENT_PINCH_START, (e) => {
//             cy.userPanningEnabled(false);
//             // console.log(`pinch start`);
//             //startEndZoomTO();
//             const cyRect = container.getBoundingClientRect();

//             pinchCenter = {
//                 x: e.center.x - cyRect.left,
//                 y: e.center.y - cyRect.top,
//             };
//             pinchScale = e.scale;
//         });
//         hammer.on(
//             [HAMMER_EVENT_PINCH_IN, HAMMER_EVENT_PINCH_OUT].join(" "),
//             (e) => {
//                 // console.log(`pinch in | out`);
//                 //startEndZoomTO();
//                 zoomTo((getCurrentZoom() * e.scale) / pinchScale, {
//                     x: pinchCenter.x,
//                     y: pinchCenter.y,
//                 });
//                 pinchScale = e.scale;
//             },
//         );
//         hammer.on(
//             [HAMMER_EVENT_PINCH_END, HAMMER_EVENT_PINCH_CANCEL].join(" "),
//             () => {
//                 //console.log(`pinch end | cancel`);
//                 cy.userPanningEnabled(true);
//             },
//         );

//         const wheelListener = (e: WheelEvent) => {
//             // console.log(`wheel`);
//             //startEndZoomTO();
//             zoomTo(
//                 getCurrentZoom() *
//                     Math.pow(
//                         10,
//                         e.deltaMode === 1 ? e.deltaY / -25 : e.deltaY / -250,
//                     ),
//                 {
//                     x: e.offsetX,
//                     y: e.offsetY,
//                 },
//             );
//         };

//         canvasElement.addEventListener(DOM_EVENT_WHEEL, wheelListener, false);
//     }
// }
