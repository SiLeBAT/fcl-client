import { Cy, ContextMenuRequestInfo } from "../graph.model";
import { Position } from "../../data.model";
import {
    CY_EVENT_BOX_SELECT,
    CY_EVENT_CXT_TAP,
    CY_EVENT_DRAG_FREE_ON,
    CY_EVENT_MOUSEDOWN,
    CY_EVENT_PAN,
    CY_EVENT_TAP_END,
    CY_EVENT_TAP_SELECT,
    CY_EVENT_TAP_START,
    CY_EVENT_TAP_UNSELECT,
    CY_EVENT_ZOOM,
} from "./cy.constants";

export function addCyPanListeners(
    cy: Cy,
    onPanning: () => void,
    onPanEnd: () => void,
): void {
    let tapStarted = false;
    let isPanning = false;
    cy.on(CY_EVENT_PAN, () => {
        if (tapStarted) {
            onPanning();
        } else {
            onPanEnd();
        }
        isPanning = true;
    });

    cy.on(CY_EVENT_TAP_START, () => {
        isPanning = false;
        tapStarted = true;
    });

    cy.on(CY_EVENT_TAP_END, () => {
        if (isPanning) {
            tapStarted = false;
            onPanEnd();
        }
    });
}

export function addCySelectionListener(
    cy: Cy,
    onSelectionChanged: (shift: boolean) => void,
): void {
    let triggerListener = true;
    let shiftOnLastMouseDown = false;

    // cy raises the selection event usually multiple times per user selection
    // but we are only interested in one event per user selection
    const selectionProcessor = (shift: boolean) => {
        if (triggerListener) {
            triggerListener = false;
            setTimeout(() => {
                onSelectionChanged(shift);
                triggerListener = true;
            }, 0);
        }
    };
    // store shift on mouse down
    cy.on(CY_EVENT_MOUSEDOWN, (event: { originalEvent: MouseEvent }) => {
        shiftOnLastMouseDown = event.originalEvent.shiftKey;
    });
    // click un/selection
    cy.on(CY_EVENT_TAP_SELECT, () => selectionProcessor(shiftOnLastMouseDown));
    cy.on(CY_EVENT_TAP_UNSELECT, () =>
        selectionProcessor(shiftOnLastMouseDown),
    );

    // box selection
    cy.on(CY_EVENT_BOX_SELECT, () => selectionProcessor(true));
}

export function addCyDragListener(cy: Cy, onDragEnd: () => void): void {
    cy.on(CY_EVENT_DRAG_FREE_ON, onDragEnd);
}

export function addCyZoomListener(cy: Cy, onZoom: () => void): void {
    cy.on(CY_EVENT_ZOOM, onZoom);
}

export function addCyContextMenuRequestListener(
    cy: Cy,
    onContextMenuRequest: (info: ContextMenuRequestInfo) => void,
) {
    // context menu open
    cy.on(CY_EVENT_CXT_TAP, (event) => {
        const contextElement = event.target;

        const position: Position = {
            x: event.originalEvent.offsetX,
            y: event.originalEvent.offsetY,
        };

        onContextMenuRequest({
            position: position,
            hoverContext: {
                nodeId:
                    contextElement.isNode && contextElement.isNode()
                        ? contextElement.id()
                        : undefined,
                edgeId:
                    contextElement.isEdge && contextElement.isEdge()
                        ? contextElement.id()
                        : undefined,
            },
        });
    });
}
