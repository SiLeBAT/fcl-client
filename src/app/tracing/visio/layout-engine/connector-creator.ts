import { VisioConnector, DeliveryInformation, ConnectorType } from './datatypes';
import { BoxCreator } from './box-creator';
import { InformationProvider } from './information-provider';

export class ConnectorCreator {
    private connectorCounter = 0;

    constructor(private boxCreator: BoxCreator, private infoProvider: InformationProvider) {

    }

    createConnectors(): VisioConnector[] {
        this.connectorCounter = 0;
        return this.infoProvider.getDeliveries().map(delivery => this.createConnector(delivery));
    }

    createConnector(delivery: DeliveryInformation): VisioConnector {
        const lotInfo = this.infoProvider.getDeliverySource(delivery);
        const lotBox = this.boxCreator.getLotBox(lotInfo);
        const stationInfo = this.infoProvider.getDeliveryTarget(delivery);
        const stationBox = this.boxCreator.getStationBox(stationInfo);

        return {
            id: 'c' + this.connectorCounter++,
            type: this.getConnectorType(delivery),
            fromPort: lotBox.ports[0].id,
            toPort: stationBox.ports[0].id
        };
    }

    private getConnectorType(delivery: DeliveryInformation): ConnectorType {
        if (delivery.backward) {
            return ConnectorType.DeliveryBackward;
        } else {
            return ConnectorType.DeliveryForward;
        }
    }

}
