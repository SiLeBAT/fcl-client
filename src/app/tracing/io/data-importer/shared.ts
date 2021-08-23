import Ajv from 'ajv';
import { HighlightingSettings, OperationType, ValueType, LinePatternType } from '../../data.model';
import { InputFormatError } from '../io-errors';

const STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX = 'SDHR';
const DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX = 'DDHR';

export async function isValidJson(schema: any, data: any, throwError?: boolean): Promise<boolean> {
    const ajv = new Ajv();
    const valid = ajv.validate(schema, data);
    if (!valid && throwError) {
        throw new InputFormatError('Invalid json schema: ' + ajv.errorsText(ajv.errors));
    }
    return valid;
}

export function compareVersions(version1: string, version2: string): number {
    const versionNumbers1: Number[] = version1.split('.').map(s => Number(s));
    const versionNumbers2: Number[] = version2.split('.').map(s => Number(s));

    for (let i = 0; i < 3; i++) {
        if (versionNumbers1[i] !== versionNumbers2[i]) {
            return versionNumbers1[i] < versionNumbers2[i] ? -1 : 1;
        }
    }
    return 0;
}

export function areMajorVersionsMatching(version1: string, version2: string): boolean {
    const versionNumbers1: Number[] = version1.split('.').map(s => Number(s));
    const versionNumbers2: Number[] = version2.split('.').map(s => Number(s));

    return versionNumbers1[0] === versionNumbers2[0];
}

export function checkVersionFormat(version: String): boolean {
    return version && version.trim().match('^\\d+\\.\\d+\\.\\d+$').length > 0;
}

export function createDefaultHighlights(): HighlightingSettings {
    const defaultHighlights: HighlightingSettings = {
        invisibleStations: [],
        invisibleDeliveries: [],
        stations: [
            {
                id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Outbreak',
                name: 'Outbreak',
                showInLegend: true,
                disabled: false,
                color: [
                    255,
                    0,
                    0
                ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'weight',
                            operationType: OperationType.GREATER,
                            value: '0'
                        }
                    ]
                ],
                shape: null
            },
            {
                id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Observed',
                name: 'Observed',
                showInLegend: true,
                disabled: false,
                color: [
                    0,
                    255,
                    0
                ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'observed',
                            operationType: OperationType.NOT_EQUAL,
                            value: 'none'
                        }
                    ]
                ],
                shape: null
            },
            {
                id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Forward Trace',
                name: 'Forward Trace',
                showInLegend: true,
                disabled: false,
                color: [
                    255,
                    200,
                    0
                ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'forward',
                            operationType: OperationType.EQUAL,
                            value: '1'
                        }
                    ]
                ],
                shape: null
            },
            {
                id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Backward Trace',
                name: 'Backward Trace',
                showInLegend: true,
                disabled: false,
                color: [
                    255,
                    0,
                    255
                ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'backward',
                            operationType: OperationType.EQUAL,
                            value: '1'
                        }
                    ]
                ],
                shape: null
            },
            {
                id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Cross Contamination',
                name: 'Cross Contamination',
                showInLegend: true,
                disabled: false,
                color: [
                    0,
                    0,
                    0
                ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'crossContamination',
                            operationType: OperationType.EQUAL,
                            value: '1'
                        }
                    ]
                ],
                shape: null
            },
            {
                id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Common Link',
                name: 'Common Link',
                showInLegend: true,
                disabled: false,
                color: [
                    255,
                    255,
                    0
                ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'score',
                            operationType: OperationType.EQUAL,
                            value: '1'
                        }
                    ]
                ],
                shape: null
            },
            {
                id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Score',
                name: 'Score',
                showInLegend: false,
                disabled: false,
                color: null,
                invisible: false,
                adjustThickness: true,
                labelProperty: null,
                valueCondition: {
                    propertyName: 'score',
                    valueType: ValueType.VALUE,
                    useZeroAsMinimum: true
                },
                logicalConditions: null,
                shape: null
            },
            {
                id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'StationLabel',
                name: 'StationLabel',
                showInLegend: false,
                disabled: false,
                color: null,
                invisible: false,
                adjustThickness: false,
                labelProperty: 'name',
                valueCondition: null,
                logicalConditions: [
                    []
                ],
                shape: null
            },
            {
                id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Kill Contamination',
                name: 'Kill Contamination',
                showInLegend: true,
                disabled: false,
                color: [ 153, 153, 153 ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'killContamination',
                            operationType: OperationType.EQUAL,
                            value: '1'
                        }
                    ]
                ],
                shape: null
            }
        ],

        deliveries: [
            {
                id: DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Outbreak',
                name: 'Outbreak',
                showInLegend: true,
                disabled: false,
                color: [
                    255,
                    0,
                    0
                ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'weight',
                            operationType: OperationType.GREATER,
                            value: '0'
                        }
                    ]
                ],
                linePattern: LinePatternType.SOLID
            },
            {
                id: DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Observed',
                name: 'Observed',
                showInLegend: true,
                disabled: false,
                color: [
                    0,
                    255,
                    0
                ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'observed',
                            operationType: OperationType.NOT_EQUAL,
                            value: 'none'
                        }
                    ]
                ],
                linePattern: LinePatternType.SOLID
            },
            {
                id: DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Forward Trace',
                name: 'Forward Trace',
                showInLegend: true,
                disabled: false,
                color: [
                    255,
                    200,
                    0
                ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'forward',
                            operationType: OperationType.EQUAL,
                            value: '1'
                        }
                    ]
                ],
                linePattern: LinePatternType.SOLID
            },
            {
                id: DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Backward Trace',
                name: 'Backward Trace',
                showInLegend: true,
                disabled: false,
                color: [
                    255,
                    0,
                    255
                ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'backward',
                            operationType: OperationType.EQUAL,
                            value: '1'
                        }
                    ]
                ],
                linePattern: LinePatternType.SOLID
            },
            {
                id: DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'Kill Contamination',
                name: 'Kill Contamination',
                showInLegend: true,
                disabled: false,
                color: [ 153, 153, 153 ],
                invisible: false,
                adjustThickness: false,
                labelProperty: null,
                valueCondition: null,
                logicalConditions: [
                    [
                        {
                            propertyName: 'killContamination',
                            operationType: OperationType.EQUAL,
                            value: '1'
                        }
                    ]
                ],
                linePattern: LinePatternType.SOLID
            },
            {
                id: DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + 'DeliveryLabel',
                name: 'DeliveryLabel',
                showInLegend: false,
                disabled: false,
                color: null,
                invisible: false,
                adjustThickness: false,
                labelProperty: 'name',
                valueCondition: null,
                logicalConditions: [
                    []
                ],
                linePattern: LinePatternType.SOLID
            }
        ]

    };

    return defaultHighlights;
}
