import { StationInformation, LotInformation, FontMetrics,
    SampleInformation, VisioLabel } from './datatypes';
import { GraphSettings } from './graph-settings';

export abstract class LabelCreator {
    // protected fontMetrics: FontMetrics;

    protected constructor(protected fontMetrics: FontMetrics) {
        // this.fontMetrics = new FontMetrics(canvas);
    }

    getLotSampleLabel(sampleInfo: SampleInformation): VisioLabel {
        const text: string[] = [
            sampleInfo.amount,
            sampleInfo.result,
            sampleInfo.time
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
