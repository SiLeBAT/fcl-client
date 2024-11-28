import { FclData } from "../../../data.model";
import { InputFormatError } from "../../io-errors";
import * as _ from "lodash";
import { validateJsonSchemaV2019 } from "../json-schema-validation";
import { fixUtxData } from "./fix-utx-data";
import { UtxImporter } from "./utx-importer";
import { HttpClient } from "@angular/common/http";

export class RelaxedUtxImporter {
    private utxImporter: UtxImporter;

    constructor(httpClient: HttpClient) {
        this.utxImporter = new UtxImporter(httpClient);
    }

    async preprocessData(data: any, fclData: FclData): Promise<void> {
        const schema = await this.utxImporter.loadUtxSchema();
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

        if (isValid) {
            const utxData = fixedData ?? data;
            this.utxImporter.preprocessValidatedData(utxData, fclData);
            return;
        }
        throw new InputFormatError();
    }
}
