import { PropInfo } from "../shared/property-info";
import { ROASettings } from "./model";

const LCASE_AMOUNT_PROP_SUFFIX = 'amount';
const LCASE_UNIT_PROP_SUFFIX = 'unit';

export function getUnitPropFromAmountProp(amountProp: string, availableProps: PropInfo[]): string | null {
    if (amountProp !== null) {
        const lCaseAmountProp = amountProp.toLowerCase();
        if (lCaseAmountProp.endsWith(LCASE_AMOUNT_PROP_SUFFIX)) {
            const lCasePropPrefix = lCaseAmountProp.substr(0, amountProp.length - LCASE_AMOUNT_PROP_SUFFIX.length);
            const lCaseUnitProp = lCasePropPrefix + LCASE_UNIT_PROP_SUFFIX;
            for(const propInfo of availableProps) {
                if (propInfo.prop.toLowerCase() === lCaseUnitProp) {
                    return propInfo.prop;
                }
            }
        }
    }
    return null;
}

export function createDefaultROASettings(): ROASettings {
    return {
        labelSettings: {
            stationLabel: [
                [
                    { prop: 'typeOfBusiness', altText: 'Unknown activity', isNullable: false },
                    { text: ': ' },
                    { prop: 'name', altText: 'Unknown FBO', isNullable: false }
                ]
            ],

            lotLabel: [
                [ { prop: 'name', altText: 'Unknown product name', isNullable: false } ],
                [ { text: 'Lot: ' }, { prop: 'lot', altText: 'unknown', isNullable: false } ],
                [
                    { text: 'Amount: ' }, { prop: 'lotQuantity', altText: 'unknown', isNullable: false },
                    { text: ' ' }, { prop: null, altText: 'unknown', isNullable: true }
                ]
            ],

            stationSampleLabel: [
                [ { prop: 'type', altText: 'Unknown type', isNullable: false } ],
                [ { prop: 'material', altText: 'Unknown material', isNullable: false } ],
                [ { prop: 'amount', altText: 'Unknown amount', isNullable: false } ],
                [ { prop: 'result', altText: 'Unknown result', isNullable: false } ],
                [ { prop: 'time', altText: 'Unknown time', isNullable: false } ]
            ],

            lotSampleLabel: [
                [ { prop: 'type', altText: 'Unknown type', isNullable: false } ],
                [ { prop: 'amount', altText: 'Unknown amount', isNullable: false } ],
                [ { prop: 'result', altText: 'Unknown result', isNullable: false } ],
                [ { prop: 'time', altText: 'Unknown time', isNullable: false } ]
            ]
        }
    };
}
