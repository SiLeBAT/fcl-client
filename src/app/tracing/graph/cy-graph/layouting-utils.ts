import { LayoutConfig, LayoutName } from './cy-graph';
import { LAYOUT_CONSTRAINT_BASED, LAYOUT_FARM_TO_FORK } from './cy.constants';

export function getLayoutConfig(layoutName: LayoutName): LayoutConfig {
    const layoutConfig = { name: layoutName };
    switch (layoutName) {
        case LAYOUT_FARM_TO_FORK:
            return {
                ...layoutConfig,
                timelimit: 10000
            };
        case LAYOUT_CONSTRAINT_BASED:
            return {
                ...layoutConfig,
                ungrabifyWhileSimulating: true,
                avoidOverlap: false,
                animate: true,
                maxSimulationTime: 60000
            };
    }
    return layoutConfig;
}
