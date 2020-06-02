import { StationInformation, LotInformation, FontMetrics,
    StationSampleInformation, SampleInformation, VisioLabel } from './datatypes';
import { GraphSettings } from './graph-settings';
import { LabelCreator } from './label-creator';
import { ROALabelSettings, PropElementInfo, TextElementInfo, LabelElementInfo } from '@app/tracing/data.model';

export class CustomLabelCreator extends LabelCreator {

    constructor(protected fontMetrics: FontMetrics, private labelSettings: ROALabelSettings) {
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
            elements.map(e =>
                (e as PropElementInfo).prop !== undefined ?
                    CustomLabelCreator.getText(infoObj.props[(e as PropElementInfo).prop], (e as PropElementInfo).altText) :
                    (e as TextElementInfo).text
            ).join('')
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
}
