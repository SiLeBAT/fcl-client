import { FclData, ObservedType } from "../../../data.model";
import { Utils } from "../../../util/non-ui-utils";
import { createDefaultHighlights } from "../shared";
import { UtxData } from "./utx-model";
import { validateJsonSchemaV2019 } from "../json-schema-validation";
import { createUtxCoreMaps } from "./create-core-maps";
import { applyUtxDeliveriesToFclData } from "./delivery-importer";
import { applyUtxStationsToFclData } from "./station-importer";
import { HttpClient } from "@angular/common/http";
import { fixUtxData } from "./fix-utx-data";
import { createInitialFclDataState } from "../../../state/tracing.reducers";

type NotValidatedUtxData = any;
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

    private async loadUtxSchema(): Promise<any> {
        return Utils.getJson(UTX_SCHEMA_FILE, this.httpClient);
    }

    private async getValidUtxData(data: NotValidatedUtxData): Promise<UtxData> {
        const schema = await this.loadUtxSchema();
        let { isValid, errors } = await validateJsonSchemaV2019(schema, data);
        let fixedData: any;

        if (!isValid) {
            fixedData = fixUtxData(data, errors!);
            ({ isValid, errors } = await validateJsonSchemaV2019(
                schema,
                fixedData,
                true,
            ));
        }
        return fixedData ?? data;
    }

    async importData(data: NotValidatedUtxData): Promise<FclData> {
        const utxData = await this.getValidUtxData(data);
        return this.convertUtxDataToFclData(utxData);
    }

    private convertUtxDataToFclData(data: UtxData): FclData {
        let fclData = createInitialFclDataState();
        const coreMaps = createUtxCoreMaps(data);
        fclData = applyUtxStationsToFclData(data, fclData, coreMaps);
        fclData = applyUtxDeliveriesToFclData(data, fclData, coreMaps);
        fclData = initTracingSettings(fclData);
        fclData.graphSettings.highlightingSettings = createDefaultHighlights();
        return fclData;
    }
}

function initTracingSettings(fclData: FclData): FclData {
    const createElementSettings = (id: string) => ({
        id: id,
        crossContamination: false,
        outbreak: false,
        weight: 0,
        killContamination: false,
        observed: ObservedType.NONE,
    });
    return {
        ...fclData,
        tracingSettings: {
            ...fclData.tracingSettings,
            stations: fclData.fclElements.stations.map((s) =>
                createElementSettings(s.id),
            ),
            deliveries: fclData.fclElements.deliveries.map((d) =>
                createElementSettings(d.id),
            ),
        },
    };
}
