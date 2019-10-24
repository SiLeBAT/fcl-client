import { FclData, GroupType, ObservedType, GraphType, Layout, StationTracingSettings, MergeDeliveriesType } from '../data.model';
import { Constants } from './data-mappings/data-mappings-v1';
import { Utils } from './../util/non-ui-utils';
import { createFclElements } from './fcl-elements-creator';
import { VERSION, JsonData, ViewData } from './ext-data-model.v1';
import { createDefaultSettings } from './json-data-creator';

export class DataExporter {

    static exportData(fclData: FclData, rawData: JsonData) {

        this.setGroupData(fclData, rawData);
        this.setTracingData(fclData, rawData);
        this.setViewData(fclData, rawData);
        if (!rawData.data) {
            this.setData(fclData, rawData);
        }
    }

    private static setData(fclData: FclData, rawData: JsonData) {
        rawData.data = {
            version: VERSION,
            ...createFclElements(fclData)
        };
    }

    private static setGroupData(fclData: FclData, rawData: JsonData) {
        const intToExtGroupTypeMap: Map<GroupType, string> = Utils.getReverseOfImmutableMap(
            Constants.GROUPTYPE_EXT_TO_INT_MAP, groupType => groupType);

        if (!rawData.settings) {
            rawData.settings = createDefaultSettings();
        }
        rawData.settings.metaNodes = fclData.groupSettings.map(
            s => ({
                id: s.id,
                type: (intToExtGroupTypeMap.has(s.groupType) ? intToExtGroupTypeMap.get(s.groupType) : null),
                members: s.contains
            })
        );
    }

    private static getWeight(station: StationTracingSettings): number {
        const outbreakWeight: number = (station.outbreak === null ? null : (station.outbreak ? 1.0 : 0.0));
        if (station.weight === null) {
            return outbreakWeight;
        } else if (station.outbreak === null) {
            return null;
        } else if ((station.weight > 0) !== station.outbreak) {
            return outbreakWeight;
        } else {
            return station.weight;
        }
    }

    private static setTracingData(fclData: FclData, rawData: JsonData) {
        rawData.tracing = {
            version: VERSION,
            nodes: fclData.tracingSettings.stations.map(s => ({
                id: s.id,
                weight: this.getWeight(s),
                crossContamination: s.crossContamination,
                killContamination: s.killContamination,
                observed: s.observed === null ? null : s.observed !== ObservedType.NONE
            })),
            deliveries: fclData.tracingSettings.deliveries.map(s => ({
                id: s.id,
                weight: s.weight,
                crossContamination: s.crossContamination,
                killContamination: s.killContamination,
                observed: s.observed === null ? null : s.observed !== ObservedType.NONE
            }))
        };
    }

    private static setViewData(fclData: FclData, jsonData: JsonData) {
        const viewData: ViewData = jsonData.settings && jsonData.settings.view ? jsonData.settings.view : {
            edge: undefined,
            node: undefined
        };
        if (!viewData.edge) {
            viewData.edge = {
                joinEdges: undefined,
                mergeDeliveriesType: undefined,
                selectedEdges: []
            };
        }
        if (!viewData.node) {
            viewData.node = {};
        }

        Utils.setProperty(viewData, Constants.SHOW_LEGEND, fclData.graphSettings.showLegend);
        Utils.setProperty(viewData, Constants.SKIP_UNCONNECTED_STATIONS, fclData.graphSettings.skipUnconnectedStations);

        viewData.edge.joinEdges = fclData.graphSettings.mergeDeliveriesType !== MergeDeliveriesType.NO_MERGE;
        viewData.edge.mergeDeliveriesType = Utils.getReverseOfImmutableMap(
            Constants.MERGE_DEL_TYPE_EXT_TO_INT_MAP,
            mergeDeliveriesType => mergeDeliveriesType
        ).get(fclData.graphSettings.mergeDeliveriesType);

        Utils.setProperty(viewData, Constants.SHOW_GIS, fclData.graphSettings.type === GraphType.GIS);

        Utils.setProperty(viewData, Constants.GISGRAPH_TRANSFORMATION, this.convertLayout(fclData.graphSettings.gisLayout));
        Utils.setProperty(viewData, Constants.SCHEMAGRAPH_TRANSFORMATION, this.convertLayout(fclData.graphSettings.schemaLayout));

        Utils.setProperty(viewData, Constants.NODE_POSITIONS, Object.keys(fclData.graphSettings.stationPositions).map(key => ({
            id: key,
            position: fclData.graphSettings.stationPositions[key]
        })));

        viewData.edge.selectedEdges = fclData.graphSettings.selectedElements.deliveries.slice();
        viewData.node.selectedNodes = fclData.graphSettings.selectedElements.stations.slice();
        jsonData.settings.view = viewData;
    }

    private static convertLayout(intLayout: Layout): any {
        if (intLayout === null) { return null; }

        return {
            scale: { x: intLayout.zoom, y: intLayout.zoom },
            translation: { x: intLayout.pan.x, y: intLayout.pan.y }
        };
    }

}
