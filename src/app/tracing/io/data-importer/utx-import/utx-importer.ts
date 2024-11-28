import { FclData, ObservedType } from "../../../data.model";
import { Utils } from "../../../util/non-ui-utils";
import { createDefaultHighlights } from "../shared";
import { InputFormatError } from "../../io-errors";
import { UtxData } from "./utx-model";
import { validateJsonSchemaV2019 } from "../json-schema-validation";
import { createUtxCoreMaps } from "./create-core-maps";
import { applyUtxDeliveries } from "./delivery-importer";
import { applyUtxStations } from "./station-importer";
import { HttpClient } from "@angular/common/http";

// this schema does not take care about the
// - date or time formats
// - the controlled vocabularies
// - mandatory properties (with the exception of primary keys)
const UTX_SCHEMA_FILE =
    "../../../../assets/schema/UTXSchema_20240208-woM-woD-woCV.json";

export function hasUtxCore(data: any): data is { utxCore: any } {
    return (data as UtxData).utxCore !== undefined;
}

export class UtxImporter {
    constructor(private httpClient: HttpClient) {}

    async loadUtxSchema(): Promise<any> {
        return Utils.getJson(UTX_SCHEMA_FILE, this.httpClient);
    }

    async isDataFormatSupported(data: any): Promise<boolean> {
        const schema = await this.loadUtxSchema();
        return (await validateJsonSchemaV2019(schema, data, true)).isValid;
    }

    preprocessValidatedData(data: UtxData, fclData: FclData): void {
        const coreMaps = createUtxCoreMaps(data);
        applyUtxStations(data, fclData, coreMaps);
        applyUtxDeliveries(data, fclData, coreMaps);
        initTracingSettings(fclData);
        fclData.graphSettings.highlightingSettings = createDefaultHighlights();
    }

    async preprocessData(data: any, fclData: FclData): Promise<void> {
        if (await this.isDataFormatSupported(data)) {
            this.preprocessValidatedData(data, fclData);
            return;
        }
        throw new InputFormatError();
    }
}

function initTracingSettings(fclData: FclData): void {
    const createElementSettings = (id: string) => ({
        id: id,
        crossContamination: false,
        outbreak: false,
        weight: 0,
        killContamination: false,
        observed: ObservedType.NONE,
    });
    fclData.tracingSettings.stations = fclData.fclElements.stations.map((s) =>
        createElementSettings(s.id),
    );
    fclData.tracingSettings.deliveries = fclData.fclElements.deliveries.map(
        (d) => createElementSettings(d.id),
    );
}
