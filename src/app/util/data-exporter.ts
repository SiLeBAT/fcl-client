import { FclData, GroupType, ObservedType, StationData, GraphType, Layout } from './datatypes';
import { Constants } from './data-mappings/data-mappings-v1';
import { Utils } from './utils';

interface GroupData {
    id: string;
    type: string;
    members: string[];
}
export class DataExporter {

    static exportData(fclData: FclData, rawData: any) {

        this.setGroupData(fclData, rawData);
        this.setTracingData(fclData, rawData);
        this.setViewData(fclData, rawData);
        if (!rawData.hasOwnProperty(Constants.DATA)) {
            this.setData(fclData, rawData);
        }
    }

    private static preprocessRawData(rawData: any) {
        // ToDo: refine this method,
        const knownProps: Set<string> = new Set([Constants.DATA, Constants.TRACING_DATA, 'settings', 'version']);
        const unkownProps: string[] = Object.keys(rawData).filter(x => !knownProps.has(x));

        if ((unkownProps.length > 0) && rawData.hasOwnProperty(Constants.DATA)) {
            delete rawData[Constants.DATA];
        }
        for (const propName of unkownProps) {
            delete rawData[propName];
        }
    }

    private static setData(fclData: FclData, rawData: any) {
      // const stationData
    }

    private static setGroupData(fclData: FclData, rawData: any) {
        const intToExtGroupTypeMap: Map<GroupType, string> = Utils.getReverseOfImmutableMap(
            Constants.GROUPTYPE_EXT_TO_INT_MAP, groupType => groupType);
        Utils.setProperty(rawData, Constants.GROUP_DATA,
                fclData.elements.stations.filter(s => s.contains !== null && s.contains.length > 0).map(s => {
                    return {
                        id: s.id,
                        type: intToExtGroupTypeMap.get(s.groupType),
                        members: s.contains
                    };
                }));
    }

    private static getWeight(station: StationData): number {
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
                    fclData.elements.stations.map(s => {
                        return {
                            id: s.id,
                            weight: this.getWeight(s),
                            crossContamination: s.crossContamination,
                            killContamination: s.killContamination,
                            observed: s.observed === null ? null : s.observed !== ObservedType.NONE
                        };
                    }));
        Utils.setProperty(rawData, Constants.TRACING_DATA + '.' + Constants.TRACING_DATA_DELIVERIES,
                    fclData.elements.deliveries.map(s => {
                        return {
                            id: s.id,
                            weight: s.weight,
                            crossContamination: s.crossContamination,
                            killContamination: s.killContamination,
                            observed: s.observed === null ? null : s.observed !== ObservedType.NONE
                        };
                    }));
    }

    private static setViewData(fclData: FclData, rawData: any) {
        const viewData = Utils.getProperty(rawData, Constants.VIEW_SETTINGS);

        Utils.setProperty(viewData, Constants.SHOW_LEGEND, fclData.graphSettings.showLegend);
        Utils.setProperty(viewData, Constants.SKIP_UNCONNECTED_STATIONS, fclData.graphSettings.skipUnconnectedStations);
        Utils.setProperty(viewData, Constants.MERGE_DELIVERIES, fclData.graphSettings.mergeDeliveries);
        Utils.setProperty(viewData, Constants.SHOW_GIS, fclData.graphSettings.type === GraphType.GIS);

        Utils.setProperty(viewData, Constants.GISGRAPH_TRANSFORMATION, this.convertLayout(fclData.gisLayout));
        Utils.setProperty(viewData, Constants.SCHEMAGRAPH_TRANSFORMATION, this.convertLayout(fclData.layout));
        Utils.setProperty(viewData, Constants.NODE_POSITIONS, fclData.elements.stations.map(s => {
            return {
                id: s.id,
                position: {
                    x: s.position.x,
                    y: s.position.y
                }
            };
        }));
    }

    private static convertLayout(intLayout: Layout): any {
        if (intLayout === null) { return null; }

        return {
            scale: { x: intLayout.zoom, y: intLayout.zoom },
            translation: { x: intLayout.pan.x, y: intLayout.pan.y }
        };
    }

}
