import { Injectable } from '@angular/core';
import { MenuItemData } from '../graph/menu-item-data.model';
import { LayoutManagerInfo, LayoutStrings } from './layout.constants';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';
import spread from 'cytoscape-spread';
import { FruchtermanLayout } from './fruchterman-reingold';
import { FarmToForkLayout } from './farm-to-fork/farm-to-fork';
import { DialogActionsComponent, DialogActionsData } from '../dialog/dialog-actions/dialog-actions.component';
import { MatDialog } from '@angular/material';
import { Action } from '@ngrx/store';

export enum LayoutActionTypes {
    LayoutAction = '[Tracing] Layout'
}

interface Cy {
    layout(options: { name: string, [key: string]: any }): CyLayout;
}

interface CyLayout {
    run(): void;
}

export class LayoutAction implements Action {
    readonly type = LayoutActionTypes.LayoutAction;

    constructor(public payload: { layoutName: string }) {}
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {

    constructor(private dialogService: MatDialog) { }

    runLayout(layoutName: string, cy: Cy, nodeSize: number) {
        switch (layoutName) {
            case LayoutManagerInfo.farmToFork.name:
                cy.layout({
                    name: LayoutManagerInfo.farmToFork.name,
                    options: { nodeSize: nodeSize }
                })
                .run();
                break;
            case LayoutManagerInfo.constraintBased.name:
                let layout;
                const layoutDialogData: DialogActionsData = {
                    title: LayoutStrings.layoutRunning, // 'Layout running',
                    actions: [{ name: LayoutStrings.stopLayouting, action: () => layout.stop() }]
                };
                const layoutDialog = this.dialogService.open(DialogActionsComponent, {
                    disableClose: true,
                    data: layoutDialogData
                });

                layout = cy.layout({
                    name: LayoutManagerInfo.constraintBased.name,
                    ungrabifyWhileSimulating: true,
                    avoidOverlap: false,
                    animate: true,
                    maxSimulationTime: 60000,
                    stop: function () {
                        layoutDialog.close();
                    }
                });
                layout.run();
                break;
            default:
                cy.layout({ name: layoutName }).run();
        }
    }

    getLayoutMenuData(): MenuItemData[] {
        return [
            {
                ...LayoutManagerInfo.fruchtermanReingold,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.fruchtermanReingold.name })
            },
            {
                ...LayoutManagerInfo.farmToFork,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.farmToFork.name })
            },
            {
                ...LayoutManagerInfo.constraintBased,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.constraintBased.name })
            },
            {
                ...LayoutManagerInfo.random,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.random.name })
            },
            {
                ...LayoutManagerInfo.grid,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.grid.name })
            },
            {
                ...LayoutManagerInfo.circle,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.circle.name })
            },
            {
                ...LayoutManagerInfo.concentric,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.concentric.name })
            },
            {
                ...LayoutManagerInfo.breadthFirst,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.breadthFirst.name })
            },
            {
                ...LayoutManagerInfo.spread,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.spread.name })
            },
            {
                ...LayoutManagerInfo.directedAcyclicGraph,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.directedAcyclicGraph.name })
            }
        ];
    }

    addLayoutManagerToCytoScape(cy) {
        cy.use(cola);
        cy.use(dagre);
        cy.use(spread);
        cy('layout', 'fruchterman', FruchtermanLayout);
        cy('layout', 'farm_to_fork', FarmToForkLayout);
    }
}
