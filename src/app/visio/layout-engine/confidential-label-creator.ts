import { StationInformation, LotInformation,
    VisioLabel } from './datatypes';
import { LabelCreator } from './label-creator';
import { GraphSettings } from './graph-settings';

export class ConfidentialLabelCreator extends LabelCreator {
    constructor(canvas: any) {
        super(canvas);
    }

    getLotLabel(lotInfo: LotInformation): VisioLabel {
        const text: string[] = [
            LabelCreator.getText(lotInfo.commonProductName, 'unknown product name'),
            'brand name: ' + LabelCreator.getText(lotInfo.brandName, 'unknown'),
            'Lot: ' + LabelCreator.getText(lotInfo.lotIdentifier, 'unknown'),
            'Amount: ' + LabelCreator.getText(lotInfo.quantity, 'unknown')
        ];
        return this.getLabel(text, GraphSettings.LOT_BOX_MARGIN);
    }

    getStationLabel(stationInfo: StationInformation): VisioLabel {
        const text: string[] = [
            LabelCreator.getText(stationInfo.activities, 'Unknown activity') +
            ' ' + stationInfo.ctno + ': ' + LabelCreator.getText(stationInfo.name, 'Unkown station name')
        ];
        return this.getLabel(text, GraphSettings.STATION_BOX_MARGIN);
    }
}
