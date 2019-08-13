import { FclData, GroupType, ObservedType, GraphType, Layout, StationTracingSettings } from '../data.model';
import { Constants } from './data-mappings/data-mappings-v1';
import { Utils } from './../util/utils';

export class DataExporter {

    static exportData(fclData: FclData, rawData: any) {

        this.setGroupData(fclData, rawData);
        this.setTracingData(fclData, rawData);
        this.setViewData(fclData, rawData);
        if (!rawData.hasOwnProperty(Constants.DATA)) {
            this.setData(fclData, rawData);
        }
    }

    private static setData(fclData: FclData, rawData: any) {

    }

    private static setGroupData(fclData: FclData, rawData: any) {
        const intToExtGroupTypeMap: Map<GroupType, string> = Utils.getReverseOfImmutableMap(
            Constants.GROUPTYPE_EXT_TO_INT_MAP, groupType => groupType);
        Utils.setProperty(rawData, Constants.GROUP_DATA,
                fclData.groupSettings.map(s => {
                    return {
                        id: s.id,
                        type: (intToExtGroupTypeMap.has(s.groupType) ? intToExtGroupTypeMap.get(s.groupType) : null),
                        members: s.contains
                    };
                }));
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

    private static setTracingData(fclData: FclData, rawData: any) {
        Utils.setProperty(rawData, Constants.TRACING_DATA + '.' + Constants.TRACING_DATA_STATIONS,
            fclData.tracingSettings.stations.map(s => ({
                id: s.id,
                weight: this.getWeight(s),
                crossContamination: s.crossContamination,
                killContamination: s.killContamination,
                observed: s.observed === null ? null : s.observed !== ObservedType.NONE
            }))
        );
        Utils.setProperty(rawData, Constants.TRACING_DATA + '.' + Constants.TRACING_DATA_DELIVERIES,
            fclData.tracingSettings.deliveries.map(s => ({
                id: s.id,
                weight: s.weight,
                crossContamination: s.crossContamination,
                killContamination: s.killContamination,
                observed: s.observed === null ? null : s.observed !== ObservedType.NONE
            }))
        );
    }

    private static setViewData(fclData: FclData, rawData: any) {
        const viewData = Utils.getProperty(rawData, Constants.VIEW_SETTINGS);

        Utils.setProperty(viewData, Constants.SHOW_LEGEND, fclData.graphSettings.showLegend);
        Utils.setProperty(viewData, Constants.SKIP_UNCONNECTED_STATIONS, fclData.graphSettings.skipUnconnectedStations);
        Utils.setProperty(viewData, Constants.MERGE_DELIVERIES, fclData.graphSettings.mergeDeliveries);
        Utils.setProperty(viewData, Constants.SHOW_GIS, fclData.graphSettings.type === GraphType.GIS);

        Utils.setProperty(viewData, Constants.GISGRAPH_TRANSFORMATION, this.convertLayout(fclData.graphSettings.gisLayout));
        Utils.setProperty(viewData, Constants.SCHEMAGRAPH_TRANSFORMATION, this.convertLayout(fclData.graphSettings.schemaLayout));

        Utils.setProperty(viewData, Constants.NODE_POSITIONS, Object.keys(fclData.graphSettings.stationPositions).map(key => ({
            id: key,
            position: fclData.graphSettings.stationPositions[key]
        })));
    }

    private static convertLayout(intLayout: Layout): any {
        if (intLayout === null) { return null; }

        return {
            scale: { x: intLayout.zoom, y: intLayout.zoom },
            translation: { x: intLayout.pan.x, y: intLayout.pan.y }
        };
    }

}
