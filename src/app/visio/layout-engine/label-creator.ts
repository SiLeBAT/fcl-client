import { StationInformation, LotInformation, FontMetrics,
    SampleInformation, VisioLabel } from './datatypes';
import { GraphSettings } from './graph-settings';

export abstract class LabelCreator {

    protected constructor(protected fontMetrics: FontMetrics) {
    }

    static getText(text: string, alternativeText: string): string {
        if (text === undefined || text === null) {
            return alternativeText;
        } else {
            return text;
        }
    }

    getLotSampleLabel(sampleInfo: SampleInformation): VisioLabel {
        const text: string[] = [
            LabelCreator.getText(sampleInfo.amount, 'unkown amount'),
            LabelCreator.getText(sampleInfo.result, 'unkown result'),
            LabelCreator.getText(sampleInfo.time, 'unkown time')
        ];
        return this.getLabel(text, GraphSettings.SAMPLE_BOX_MARGIN);
    }

    abstract getLotLabel(lotInfo: LotInformation): VisioLabel;
    abstract getStationLabel(stationInfo: StationInformation): VisioLabel;

    getLabel(text: string[], margin: number): VisioLabel {
        return {
            text: text,
            size: this.fontMetrics.measureText(text),
            relPosition: { x: margin, y: margin }
        };
    }
}
