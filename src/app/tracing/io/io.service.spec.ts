import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TestBed, waitForAsync } from '@angular/core/testing';
import { IOService } from './io.service';
import { FclData, GraphType, ObservedType, MergeDeliveriesType, MapType, CrossContTraceType } from '../data.model';
import { JsonData, VERSION } from './ext-data-model.v1';
import { Constants } from '../util/constants';
import { DENOVO_STATION_PROP_INT_TO_EXT_MAP, DENOVO_DELIVERY_PROP_INT_TO_EXT_MAP } from './data-mappings/data-mappings-v1';

describe('IOService', () => {

    let ioService: IOService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule
            ],
            providers: [
                IOService
            ]
        });

        ioService = TestBed.inject(IOService);
    }));

    it('should instantiate the io service', () => {
        expect(ioService).toBeTruthy();
    });

    it('should generate export data correctly', async () => {
        const fclData: FclData = {
            source: {
                propMaps: {
                    stationPropMap: DENOVO_STATION_PROP_INT_TO_EXT_MAP.toObject(),
                    deliveryPropMap: DENOVO_DELIVERY_PROP_INT_TO_EXT_MAP.toObject()
                }
            },
            fclElements: {
                stations: [
                    { id: 'S1', name: 'Station 1', lat: null, lon: null, incoming: [], outgoing: ['D1'], connections: [], properties: [] },
                    { id: 'S2', name: 'Station 2', lat: null, lon: null, incoming: ['D2'], outgoing: [], connections: [], properties: [] }
                ],
                deliveries: [
                    {
                        id: 'D1', source: 'S1', target: 'S2', name: 'Product P', lot: 'Lot 1', lotKey: null,
                        dateIn: null, dateOut: null, properties: []
                    }
                ],
                samples: []
            },
            graphSettings: {
                type: GraphType.GRAPH,
                mapType: MapType.MAPNIK,
                shapeFileData: null,
                nodeSize: Constants.DEFAULT_GRAPH_NODE_SIZE,
                fontSize: Constants.DEFAULT_GRAPH_FONT_SIZE,
                showLegend: true,
                showZoom: true,
                mergeDeliveriesType: MergeDeliveriesType.NO_MERGE,
                showMergedDeliveriesCounts: false,
                skipUnconnectedStations: false,
                selectedElements: {
                    stations: [],
                    deliveries: []
                },
                ghostStation: undefined,
                schemaLayout: { zoom: 1, pan: { x: 0.5, y: 0.5 } },
                gisLayout: null,
                stationPositions: {
                    S1: { x: 0, y: 0 },
                    S2: { x: 1, y: 1 }
                },
                highlightingSettings: {
                    invisibleStations: [],
                    invisibleDeliveries: [],
                    stations: [],
                    deliveries: []
                },
                hoverDeliveries: []
            },
            groupSettings: [],
            tracingSettings: {
                crossContTraceType: CrossContTraceType.USE_INFERED_DELIVERY_DATES_LIMITS,
                stations: [
                    {
                        id: 'S1',
                        outbreak: false,
                        weight: 0,
                        crossContamination: false,
                        killContamination: false,
                        observed: ObservedType.NONE
                    },
                    {
                        id: 'S2',
                        outbreak: false,
                        weight: 0,
                        crossContamination: false,
                        killContamination: false,
                        observed: ObservedType.NONE
                    }
                ],
                deliveries: [
                    {
                        id: 'D1',
                        weight: 0,
                        crossContamination: false,
                        killContamination: false,
                        observed: ObservedType.NONE
                    }
                ]
            }
        };

        const expectedExportData: JsonData = {
            version: VERSION,
            data: {
                version: VERSION,
                stations: {
                    columnProperties: [
                        { id: 'ID', type: 'string' },
                        { id: 'Name', type: 'string' },
                        { id: 'Latitude', type: 'double' },
                        { id: 'Longitude', type: 'double' }
                    ],
                    data: [
                        [
                            { id: 'ID', value: 'S1' },
                            { id: 'Name', value: 'Station 1' }
                        ],
                        [
                            { id: 'ID', value: 'S2' },
                            { id: 'Name', value: 'Station 2' }
                        ]
                    ]
                },
                deliveries: {
                    columnProperties: [
                        { id: 'ID', type: 'string' },
                        { id: 'from', type: 'string' },
                        { id: 'to', type: 'string' },
                        { id: 'Name', type: 'string' },
                        { id: 'Lot Number', type: 'string' }
                    ],
                    data: [
                        [
                            { id: 'ID', value: 'D1' },
                            { id: 'from', value: 'S1' },
                            { id: 'to', value: 'S2' },
                            { id: 'Name', value: 'Product P' },
                            { id: 'Lot Number', value: 'Lot 1' }
                        ]
                    ]
                },
                deliveryRelations: {
                    columnProperties: [
                        { id: 'from', type: 'string' },
                        { id: 'to', type: 'string' }
                    ],
                    data: []
                }
            },
            tracing: {
                version: VERSION,
                nodes: fclData.tracingSettings.stations.map(s => ({
                    id: s.id,
                    weight: s.weight,
                    crossContamination: s.crossContamination,
                    killContamination: s.killContamination,
                    observed: s.observed !== ObservedType.NONE
                })),
                deliveries: fclData.tracingSettings.deliveries.map(d => ({
                    id: d.id,
                    weight: d.weight,
                    crossContamination: d.crossContamination,
                    killContamination: d.killContamination,
                    observed: d.observed !== ObservedType.NONE
                }))
            },
            settings: {
                version: VERSION,
                metaNodes: [],
                view: {
                    showGis: fclData.graphSettings.type === GraphType.GIS,
                    showLegend: fclData.graphSettings.showLegend,
                    edge: {
                        joinEdges: fclData.graphSettings.mergeDeliveriesType === MergeDeliveriesType.MERGE_ALL,
                        mergeDeliveriesType: 'NO_MERGE',
                        showMergedDeliveriesCounts: false,
                        selectedEdges: fclData.graphSettings.selectedElements.deliveries,
                        highlightConditions: []
                    },
                    node: {
                        highlightConditions: [],
                        skipEdgelessNodes: fclData.graphSettings.skipUnconnectedStations,
                        selectedNodes: fclData.graphSettings.selectedElements.stations
                    },
                    graph: {
                        transformation: {
                            scale: { x: fclData.graphSettings.schemaLayout.zoom, y: fclData.graphSettings.schemaLayout.zoom },
                            translation: fclData.graphSettings.schemaLayout.pan
                        },
                        node: {
                            positions: fclData.fclElements.stations.map(
                                s => ({
                                    id: s.id,
                                    position: fclData.graphSettings.stationPositions[s.id]
                                })
                            )
                        }
                    },
                    gis: {
                        transformation: null
                    }
                }
            }

        };

        ioService.getExportData(fclData)
            .then(observedExportData => {
                expect(observedExportData).toEqual(expectedExportData);
            }).catch(error => { throw error; });
    });
});
