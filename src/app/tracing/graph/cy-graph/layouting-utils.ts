import { Layout } from '@app/tracing/data.model';
import { LayoutConfig } from './cy-graph';
import { LAYOUT_CONSTRAINT_BASED, LAYOUT_FARM_TO_FORK, PRESET_LAYOUT_NAME } from './cy.constants';

export type LayoutName = string;

export interface LayoutPayload {
    name: LayoutName;
}

export function getLayoutConfig(layoutName: LayoutName): LayoutConfig {
    switch (layoutName) {
        case LAYOUT_FARM_TO_FORK:
            return {
                name: LAYOUT_FARM_TO_FORK
                // options: { nodeSize: nodeSize },
                // stop: stopCallBack
            };

        // case LAYOUT_CONSTRAINT_BASED:
        //     let layout;
        //     const layoutDialogData: DialogActionsData = {
        //         title: LayoutStrings.layoutRunning, // 'Layout running',
        //         actions: [{ name: LayoutStrings.stopLayouting, action: () => layout.stop() }]
        //     };
        //     const layoutDialog = this.dialogService.open(DialogActionsComponent, {
        //         disableClose: true,
        //         data: layoutDialogData
        //     });

        //     layout = cyContext.layout({
        //         name: LayoutManagerInfo.constraintBased.name,
        //         ungrabifyWhileSimulating: true,
        //         avoidOverlap: false,
        //         animate: true,
        //         maxSimulationTime: 60000,
        //         stop: function () {
        //             layoutDialog.close();
        //             stopCallBack();
        //         }
        //     });
        //     layout.run();
        //     break;
        default:
            return { name: layoutName };
            // cyContext.layout({ name: layoutName, stop: stopCallBack }).run();
    }
}
