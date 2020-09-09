import { Cy } from '../../graph.model';
import { Position } from '../../../data.model';
import { timer, Subscription } from 'rxjs';

export function registerPanListener(cy: Cy, onPan: (pos: Position) => void, onPanEnd: (pos: Position) => void): void {
    let isPanning = false;
    cy.on('pan', () => {
        onPan(cy.pan());
        isPanning = true;
    });

    cy.on('tapstart', () => isPanning = false);

    cy.on('tapend', () => {
        if (isPanning) {
            onPanEnd(cy.pan());
        }
    });
}

export function registerSelectionListener(cy: Cy, onSelectionChanged: () => void): void {
    let selectionTimerSubscription: Subscription;
    const selectionProcessor = () => {
        if (!selectionTimerSubscription) {
            selectionTimerSubscription = timer(0).subscribe(
                () => {
                    selectionTimerSubscription.unsubscribe();
                    onSelectionChanged();
                    selectionTimerSubscription = null;
                },
                error => {
                    throw new Error(`${error}`);
                }
            );
        }
    };
    // click un/selection
    cy.on('tapselect', selectionProcessor);
    cy.on('tapunselect', selectionProcessor);

    // box selection
    cy.on('boxselect', selectionProcessor);
}
