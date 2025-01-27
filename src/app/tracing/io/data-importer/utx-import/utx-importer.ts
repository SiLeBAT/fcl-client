import { FclData, ObservedType } from "../../../data.model";
import { Utils } from "../../../util/non-ui-utils";
import { createDefaultHighlights } from "../shared";
import { UtxData } from "./utx-model";
import { createUtxCoreMaps } from "./create-core-maps";
import { applyUtxDeliveriesToFclData } from "./delivery-importer";
import { applyUtxStationsToFclData } from "./station-importer";
import { HttpClient } from "@angular/common/http";
import { fixUtxData } from "./fix-utx-data/fix-utx-data";
import { createInitialFclDataState } from "../../../state/tracing.reducers";
import { fixes2Strings } from "./fix-utx-data/report-fixes";
import { validateUtxSchema } from "./utx-schema-validation";
import { IssueFix } from "./fix-utx-data/model";

type NotValidatedUtxData = any;
// this schema does not take care about the
// - the controlled vocabularies
// - mandatory properties (with the exception of primary keys)
const UTX_SCHEMA_FILE =
    "../../../../assets/schema/UTXSchema_20240208-woM-woCV.json";

export function hasUtxCore(data: any): data is { utxCore: any } {
    return (data as UtxData).utxCore !== undefined;
}

export class UtxImporter {
    constructor(private httpClient: HttpClient) {}

    private async loadUtxSchema(): Promise<any> {
        return Utils.getJson(UTX_SCHEMA_FILE, this.httpClient);
    }

    private async getValidUtxData(
        data: NotValidatedUtxData,
    ): Promise<{ utxData: UtxData; issues?: string[] }> {
        const schema = await this.loadUtxSchema();
        let { isValid, errors } = await validateUtxSchema(schema, data);

        let fixedData: any;
        let totalFixes: IssueFix[] | undefined;

        if (!isValid) {
            let iteration = 0;
            do {
                iteration++;
                const fixResult = fixUtxData(fixedData ?? data, errors!);
                fixedData = fixResult.fixedData;
                totalFixes = [...(totalFixes ?? []), ...fixResult.fixes];

                ({ isValid, errors } = await validateUtxSchema(
                    schema,
                    fixedData,
                    iteration > 5 || fixResult.fixes.length === 0,
                ));
            } while (!isValid);
        }

        return {
            utxData: fixedData ?? data,
            issues: totalFixes ? fixes2Strings(totalFixes) : undefined,
        };
    }

    async importData(data: NotValidatedUtxData): Promise<FclData> {
        const { utxData, issues } = await this.getValidUtxData(data);
        const fclData = this.convertUtxDataToFclData(utxData);
        if (issues) {
            fclData.importWarnings = [...issues, ...fclData.importWarnings];
        }
        return fclData;
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
