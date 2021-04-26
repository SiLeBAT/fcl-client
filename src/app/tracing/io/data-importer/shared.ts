import Ajv from 'ajv';
import { HighlightingSettings, OperationType, ValueType, LinePatternType } from '../../data.model';
import { InputFormatError } from '../io-errors';

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
        stations: [
            {
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
