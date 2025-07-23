import { HttpClientTestingModule } from "@angular/common/http/testing";

import { TestBed, waitForAsync } from "@angular/core/testing";
import { DataService } from "./data.service";
import {
    CrossContTraceType,
    DataServiceInputState,
    ObservedType,
    StationStoreData,
    GroupData,
    ElementTracingSettings,
} from "../data.model";
import { createDefaultHighlights } from "../io/data-importer/shared";
import { createDefaultPropMappings } from "../state/tracing.reducers";
import { isAnonymizationRule, isLabelHRule } from "../util/highlighting-utils";

function createGroups(...groupDefs: [string, ...string[]]): GroupData[] {
    const groups: GroupData[] = [];
    groupDefs.forEach((groupDef) => {
        const match = groupDef.match(/^(?<îd>\w+):(?<members>\w+(,\w+)+)$/);
        if (!match?.groups) {
            throw new Error(`Invalid group definition "${groupDef}"`);
        }
        groups.push({
            id: match.groups.id,
            contains: match.groups.members.split(","),
        });
    });
    return groups;
}

function createTracingSettings(
    ...tracingDefs: [string, ...string[]]
): ElementTracingSettings[] {
    const tracings: ElementTracingSettings[] = [];
    tracingDefs.forEach((tracingDef) => {
        const match = tracingDef.match(/^(?<îd>\w+):(?<flags>[okt]+)$/);
        if (!match?.groups) {
            throw new Error(`Invalid tracing definition "${tracingDef}"`);
        }
        const flags = match.groups.flags;
        tracings.push({
            id: match.groups.id,
            killContamination: flags.includes("k"),
            outbreak: flags.includes("o"),
            weight: flags.includes("o") ? 1 : 0,
            observed: flags.includes("t")
                ? ObservedType.FULL
                : ObservedType.NONE,
            crossContamination: flags.includes("c"),
        });
    });
    return tracings;
}

function createStations(...ids: [string, ...string[]]): StationStoreData[] {
    return ids.map((id) => ({
        id: id,
        name: id,
        incoming: [],
        outgoing: [],
        connections: [],
        properties: [],
    }));
}

function createDefaultEmptyInputState(): DataServiceInputState {
    return {
        int2ExtPropMaps: createDefaultPropMappings(),
        fclElements: {
            stations: [],
            deliveries: [],
            samples: [],
        },
        groupSettings: [],
        tracingSettings: {
            stations: [],
            deliveries: [],
            crossContTraceType:
                CrossContTraceType.USE_INFERED_DELIVERY_DATES_LIMITS,
        },
        highlightingSettings: createDefaultHighlights(),
        selectedElements: {
            stations: [],
            deliveries: [],
        },
    };
}

// function createDefaultOutputData(): DataServiceData {
//     const inState = createDefaultInputState();
//     const dataServiceStations = inState.fclElements.stations.map(stateStation => {
//         const tracSet = inState.tracingSettings.stations.filter(s => s.id === stateStation.id)[0];
//         const dataServiceStation: StationData = {
//             ...stateStation,
//             ...tracSet,
//             isMeta: false,
//             contained: false,
//             forward: false,
//             backward: false,
//             commonLink: false,
//             score: 0,
//             selected: false,
//             invisible: false,
//             expInvisible: false,
//             contains: [],
//             groupType: undefined
//         };
//         return dataServiceStation;
//     });
//     const dataServiceDeliveries = inState.fclElements.deliveries.map(stateDelivery => {
//         const tracSet = inState.tracingSettings.deliveries.filter(d => d.id === stateDelivery.id)[0];
//         const dataServiceDelivery: DeliveryData = {
//             ...stateDelivery,
//             ...tracSet,
//             forward: false,
//             backward: false,
//             score: 0,
//             selected: false,
//             invisible: false,
//             expInvisible: false,
//             originalSource: stateDelivery.source,
//             originalTarget: stateDelivery.target
//         };
//         return dataServiceDelivery;
//     });
//     return {
//         ...inState,
//         stations: dataServiceStations,
//         deliveries: dataServiceDeliveries,
//         statMap: {},
//         delMap: {},
//         getStatById: (ids) => [],
//         getDelById: (ids) => [],
//         statSel: {},
//         delSel: {},
//         statVis: {},
//         delVis: {},
//         isStationAnonymizationActive: false,
//         modelFlag: {},
//         tracingPropsUpdatedFlag: {},
//         stationAndDeliveryHighlightingUpdatedFlag: {}
//     };
// }

describe("DataService", () => {
    let dataService: DataService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [DataService],
        });

        dataService = TestBed.inject(DataService);
    }));

    it("should instantiate the data service", () => {
        expect(dataService).toBeTruthy();
    });

    describe("should provide dataservice data from store data", () => {
        it("for simple example", () => {
            const state = createDefaultEmptyInputState();
            state.fclElements.stations = createStations("S1");
            expect(dataService.getData(state)).toBeTruthy();
        });

        it("with enabled anonymization and a meta statiom", () => {
            const state = createDefaultEmptyInputState();
            state.fclElements.stations = createStations("S1", "S2");
            state.groupSettings = createGroups("G1:S1,S2");
            state.highlightingSettings.stations.forEach((rule) => {
                if (isAnonymizationRule(rule)) {
                    rule.userDisabled = false;
                    rule.autoDisabled = false;
                } else if (isLabelHRule(rule)) {
                    rule.autoDisabled = true;
                }
            });
            const data = dataService.getData(state);

            expect(data).toBeTruthy();
            const visibleStationLabel = data.stations.map(
                (s) => s.highlightingInfo?.label,
            );
            expect(visibleStationLabel).toEqual([
                "Station 1",
                "Station 2",
                "Station 3",
            ]);
        });
    });

    // it('should provide dataservice data from store data', () => {
    //     const observedOutputData = dataService.getData(defaultInputState);
    //     expect(observedOutputData).toEqual(defaultOutputData);
    // });

    // it('should apply changed grouping data from store data', () => {
    //     const observedOutputData = dataService.getData(defaultInputState);
    //     const inputStateWithChangedGroups: DataServiceInputState = {
    //         ...defaultInputState,
    //         groupSettings: [{
    //             id: 'G1',
    //             contains: ['S3', 'S4'],
    //             groupType: undefined
    //         }],
    //         tracingSettings: {
    //             ...defaultInputState.tracingSettings,
    //             stations: [...defaultInputState.tracingSettings.stations, {
    //                 id: 'G1',
    //                 outbreak: false,
    //                 observed: ObservedType.NONE,
    //                 crossContamination: false,
    //                 killContamination: false,
    //                 weight: 0
    //             }]
    //         }
    //     };
    //     expect(observedOutputData).toEqual(defaultOutputData);
    // });

    // add grouping check
    // add vis check
    // add tracing check
    // add highlight check
});
