import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TestBed, waitForAsync } from '@angular/core/testing';
import { DataService } from './data.service';
import { CrossContTraceType, DataServiceInputState } from '../data.model';
import { createDefaultHighlights } from '../io/data-importer/shared';

function createDefaultInputState(): DataServiceInputState {
    return {
        fclElements: {
            stations: [{
                id: 'S1',
                incoming: [],
                outgoing: [],
                connections: [],
                properties: []
            }],
            deliveries: [],
            samples: []
        },
        groupSettings: [],
        tracingSettings: {
            stations: [],
            deliveries: [],
            crossContTraceType: CrossContTraceType.USE_INFERED_DELIVERY_DATES_LIMITS
        },
        highlightingSettings: createDefaultHighlights(),
        selectedElements: {
            stations: [],
            deliveries: []
        }
    };
}

// function createDefaultOutputData(): DataServiceData {
//     const inState = createDefaultInputState();
//     const stations: StationData[] = inState.fclElements.stations.map(station => {
//         const tracSet = inState.tracingSettings.stations.filter(s => s.id === station.id)[0];
//         return {
//             ...station,
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
//             groupType: null
//         };
//     });
//     return {
//         ...inState,
//         stations: stations,
//         deliveries: deliveries
//     };
// }

describe('DataService', () => {

    let dataService: DataService;
    const defaultInputState: DataServiceInputState = createDefaultInputState();
    // const defaultOutputData: DataServiceData = createDefaultOutputData();

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule
            ],
            providers: [
                DataService
            ]
        });

        dataService = TestBed.inject(DataService);
    }));

    it('should instantiate the data service', () => {
        expect(dataService).toBeTruthy();
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
    //             groupType: null
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
    //     }
    //     expect(observedOutputData).toEqual(defaultOutputData);
    // });


    // add grouping check
    // add vis check
    // add tracing check
    // add highlight check
});
