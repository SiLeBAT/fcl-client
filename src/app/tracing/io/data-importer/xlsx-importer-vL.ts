import { TableRow } from '@app/tracing/data.model';
import { concat, isNotNullish } from '@app/tracing/util/non-ui-utils';
import { ArrayWith2OrMoreElements, NonEmptyArray, RequiredPick } from '@app/tracing/util/utility-types';
import * as Excel from 'exceljs';
import * as _ from 'lodash';
import { Workbook as IntWorkbook, Worksheet as IntWorksheet, Row as WSRow, HeaderConf, ColumnHeader, ReadTableOptions, Table, Row, TableHeader, CellSpecs, TypeString, EachRowOptions} from './xlsx-model-vL';
import { CellValue } from './xlsx-model-v0';
import { XlsxReader } from './xlsx-reader-S';
import { JsonData } from '../ext-data-model.v1';
import { importAllInOneTemplate } from './xlsx-all-in-one-importer-vL';


export async function importXlsxFile(file: File): Promise<JsonData> {
    const xlsxReader = new XlsxReader();
    await xlsxReader.loadFile(file);

}
