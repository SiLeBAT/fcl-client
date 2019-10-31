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
import { Cy, CyNodeCollection, CyNode } from '../graph/graph.model';

export enum LayoutActionTypes {
    LayoutAction = '[Tracing] Layout'
}

// interface Cy {
//      layout(options: { name: string, [key: string]: any }): CyLayout;
// }

// interface CyLayout {
//     run(): void;
// }

export class LayoutAction implements Action {
    readonly type = LayoutActionTypes.LayoutAction;

    constructor(public payload: { layoutName: string, nodeIds: string[] }) {}
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {

    constructor(private dialogService: MatDialog) { }

    runLayout(layoutName: string, cyContext: Cy | CyNodeCollection, nodeSize: number, stopCallBack: () => void) {
        switch (layoutName) {
            case LayoutManagerInfo.farmToFork.name:
                cyContext.layout({
                    name: LayoutManagerInfo.farmToFork.name,
                    options: { nodeSize: nodeSize },
                    stop: stopCallBack
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

                layout = cyContext.layout({
                    name: LayoutManagerInfo.constraintBased.name,
                    ungrabifyWhileSimulating: true,
                    avoidOverlap: false,
                    animate: true,
                    maxSimulationTime: 60000,
                    stop: function () {
                        layoutDialog.close();
                        stopCallBack();
                    }
                });
                layout.run();
                break;
            default:
                cyContext.layout({ name: layoutName, stop: stopCallBack }).run();
        }
    }

    getLayoutMenuData(cy: Cy,
        contextGraphElement: CyNode): MenuItemData[] {

        const nodeIds: string[] = (
            contextGraphElement.selected() ?
            cy.nodes(':selected').map(e => e.id()) :
            [contextGraphElement.id()]
        );
        const areAllNodesToBeLayouted = nodeIds.length === 0 || nodeIds.length === cy.nodes().size();
        // const isValidSubSetToBeLayouted = nodeIds.length >= 2 && !areAllNodesToBeLayouted;
        return [
            {
                ...LayoutManagerInfo.fruchtermanReingold,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.fruchtermanReingold.name, nodeIds: nodeIds })
            },
            {
                ...LayoutManagerInfo.farmToFork,
                disabled: !areAllNodesToBeLayouted,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.farmToFork.name, nodeIds: nodeIds })
            },
            {
                ...LayoutManagerInfo.constraintBased,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.constraintBased.name, nodeIds: nodeIds })
            },
            {
                ...LayoutManagerInfo.random,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.random.name, nodeIds: nodeIds })
            },
            {
                ...LayoutManagerInfo.grid,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.grid.name, nodeIds: nodeIds })
            },
            {
                ...LayoutManagerInfo.circle,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.circle.name, nodeIds: nodeIds })
            },
            {
                ...LayoutManagerInfo.concentric,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.concentric.name, nodeIds: nodeIds })
            },
            {
                ...LayoutManagerInfo.breadthFirst,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.breadthFirst.name, nodeIds: nodeIds })
            },
            {
                ...LayoutManagerInfo.spread,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.spread.name, nodeIds: nodeIds })
            },
            {
                ...LayoutManagerInfo.directedAcyclicGraph,
                action: new LayoutAction({ layoutName: LayoutManagerInfo.directedAcyclicGraph.name, nodeIds: nodeIds })
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
