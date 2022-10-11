import { LabelElementInfo, PropElementInfo, ROALabelSettings, TextElementInfo } from '../model';
import { StationInformation, LotInformation, FontMetrics,
    StationSampleInformation, SampleInformation, VisioLabel } from './datatypes';
import { GraphSettings } from './graph-settings';
import { LabelCreator } from './label-creator';

export class CustomLabelCreator extends LabelCreator {

    constructor(protected fontMetrics: FontMetrics, private labelSettings: ROALabelSettings, private roundNumbers: boolean) {
        super(fontMetrics);
    }

    static getText(value: string|number|boolean, alternativeText: string): string {
        if (value === undefined || value === null) {
            return alternativeText;
        } else {
            return value + '';
        }
    }

    getLabelTexts(infoObj: { props: { [key: string]: string | number | boolean }}, labelElements: LabelElementInfo[][]): string[] {
        return labelElements.map(elements =>
            elements.map(element => {
                if (
                    element.dependendOnProp !== undefined &&
                    infoObj.props[element.dependendOnProp] === undefined
                ) {
                    // an element can be dependent on other elements
                    // however the dependency is not matched
                    return '';
                } else
                if ((element as PropElementInfo).prop !== undefined) {
                    const propElement = element as PropElementInfo;

                    let propValue = propElement.prop === null ? null : infoObj.props[propElement.prop];
                    if (
                        propValue !== null && propValue !== undefined && this.roundNumbers &&
                        (
                            typeof propValue === 'number' ||
                            typeof propValue === 'string' && propElement.interpretAsNumber
                        )
                    ) {
                        propValue = this.roundValue(propValue);
                    }
                    return propElement.prop === null ?
                        '' :
                        CustomLabelCreator.getText(propValue, propElement.altText);
                } else {
                    const textElement = element as TextElementInfo;
                    return textElement.text;
                }
            }).join('').trim()
        );
    }

    getLotSampleLabel(sampleInfo: SampleInformation): VisioLabel {
        return this.getLabel(this.getLabelTexts(sampleInfo, this.labelSettings.lotSampleLabel), GraphSettings.SAMPLE_BOX_MARGIN);
    }

    getStationSampleLabel(sampleInfo: StationSampleInformation): VisioLabel {
        return this.getLabel(this.getLabelTexts(sampleInfo, this.labelSettings.stationSampleLabel), GraphSettings.SAMPLE_BOX_MARGIN);
    }

    getLotLabel(lotInfo: LotInformation): VisioLabel {
        return this.getLabel(this.getLabelTexts(lotInfo, this.labelSettings.lotLabel), GraphSettings.LOT_BOX_MARGIN);
    }

    getStationLabel(stationInfo: StationInformation): VisioLabel {
        return this.getLabel(this.getLabelTexts(stationInfo, this.labelSettings.stationLabel), GraphSettings.STATION_BOX_MARGIN);
    }

    private roundNumberToDigits(value: number, nDigits: number): number {
        if (!Number.isFinite(value) || !Number.isInteger(nDigits) || nDigits < 0) {
            return value;
        } else if (value === 0) {
            return 0;
        } else if (nDigits === 0) {
            return value;
        } else {
            const absValue = Math.abs(value);
            return Math.sign(value) * +(Math.round(+(absValue + 'e+' + nDigits)) + 'e-' + nDigits);
        }
    }

    private roundValue(value: string | number): string | number {
        const valueType = typeof value;
        const numValue = valueType === 'number' ? value as number : (valueType === 'string' ? +value : NaN);
        if (!Number.isFinite(numValue)) {
            return value;
        } else if (numValue === 0) {
            return 0;
        } else {
            let roundedValue = this.roundNumberToDigits(numValue, 3);
            if (roundedValue === 0) {
                const absNumValue = Math.abs(numValue);
                const flooredLogAbsValue = Math.floor(Math.log10(absNumValue));
                roundedValue = Math.sign(numValue) * this.roundNumberToDigits(absNumValue, -flooredLogAbsValue + 2);
            }
            return roundedValue;
        }
    }
}
