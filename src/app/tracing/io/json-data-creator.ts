import { JsonData, VERSION, SettingsData, ViewData, EdgeViewData, NodeViewData } from './ext-data-model.v1';

export function createEmptyJson(): JsonData {
    return {
        version: VERSION,
        data: null,
        tracing: null,
        settings: null
    };
}

export function createDefaultSettings(): SettingsData {
    return {
        version: VERSION,
        metaNodes: []
        // view: null
    };
}

// export function createDefaultViewSettings(): ViewData {
//     return {
//         edge:
//     };
// }

// export function createDefaultEdgeViewSettings(): EdgeViewData {
//     return {
//         joinEdges: false,
//         selectedEdges: []
//     };
// }
