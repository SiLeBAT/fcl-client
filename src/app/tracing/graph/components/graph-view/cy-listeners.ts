import { Cy, ContextMenuRequestInfo } from '../../graph.model';
import { Position } from '../../../data.model';
import {
    CY_EVENT_BOX_SELECT, CY_EVENT_CXT_TAP, CY_EVENT_DRAG_FREE_ON, CY_EVENT_PAN,
    CY_EVENT_TAP_END, CY_EVENT_TAP_SELECT, CY_EVENT_TAP_START, CY_EVENT_TAP_UNSELECT,
    CY_EVENT_ZOOM
} from '../../cy-graph/cy.constants';

export function addCyPanListeners(cy: Cy, onPanning: () => void, onPanEnd: () => void): void {
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

export function addCySelectionListener(cy: Cy, onSelectionChanged: () => void): void {
    let triggerListener = true;
    // cy raises the selection event usually multiple times per user selection
    // but we are only interested in one event per user selection
    const selectionProcessor = () => {
        if (triggerListener) {
            triggerListener = false;
            setTimeout(() => {
                // console.log('cySelectionListener fire entered ...');
                onSelectionChanged();
                triggerListener = true;
                // console.log('cySelectionListener fire leaving ...')
            }, 0);
        }
    };
    // click un/selection
    cy.on(CY_EVENT_TAP_SELECT, () => selectionProcessor());
    cy.on(CY_EVENT_TAP_UNSELECT, () => selectionProcessor());

    // box selection
    cy.on(CY_EVENT_BOX_SELECT, () => selectionProcessor());
}

export function addCyDragListener(cy: Cy, onDragEnd: () => void): void {
    cy.on(CY_EVENT_DRAG_FREE_ON, onDragEnd);
}

export function addCyZoomListener(cy: Cy, onZoom: () => void): void {
    cy.on(CY_EVENT_ZOOM, onZoom);
}

export function addCyContextMenuRequestListener(
    cy: Cy,
    onContextMenuRequest: (info: ContextMenuRequestInfo) => void
) {
    // context menu open
    cy.on(CY_EVENT_CXT_TAP, event => {
        const contextElement = event.target;

        const position: Position = {
            x: event.originalEvent.offsetX,
            y: event.originalEvent.offsetY
        };

        onContextMenuRequest({
            position: position,
            context: {
                nodeId: contextElement.isNode && contextElement.isNode() ? contextElement.id() : undefined,
                edgeId: contextElement.isEdge && contextElement.isEdge() ? contextElement.id() : undefined
            }
        });
    });
}
