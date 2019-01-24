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
            lotInfo.commonProductName,
            'brand name: ' + (lotInfo.brandName === null ? 'unknown' : lotInfo.brandName),
            'Lot: ' + (lotInfo.lotIdentifier === null ? 'unknown' : lotInfo.lotIdentifier),
            'Amount: ' + (lotInfo.quantity === null ? 'unknown' : lotInfo.quantity)
        ];
        return this.getLabel(text, GraphSettings.LOT_BOX_MARGIN);
    }

    getStationLabel(stationInfo: StationInformation): VisioLabel {
        const text: string[]  = [
            (stationInfo.activities === null ? 'Unknown activity' : stationInfo.activities) +
            ' ' + stationInfo.ctno + ': ' + stationInfo.name
        ];
        return this.getLabel(text, GraphSettings.STATION_BOX_MARGIN);
    }
}
