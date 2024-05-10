import { HttpClient } from '@angular/common/http';
import { InputEncodingError, InputFormatError } from './io-errors';

export async function getDataFromPath(filePath: string, httpClient: HttpClient): Promise<any> {
    return httpClient.get(filePath).toPromise()
        .then(response => response)
        .catch(async error => Promise.reject(error));
}

export async function getJsonFromFile(file: File): Promise<any> {
    const text = await getTextFromUtf8EncodedFile(file);
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new InputFormatError(`Invalid json format.${ error.message ? ' ' + error.message + '.' : '' }`);
    }
}

export function isJsonFileType(file: File): boolean {
    return file.name.endsWith('.json');
}

export function isExcelFileType(file: File): boolean {
    return file.name.endsWith('.xlsx');
}

export async function getTextFromUtf8EncodedFile(file: File): Promise<string> {
    const arrBuf = await new Response(file).arrayBuffer();
    const textDecoder = new TextDecoder(undefined, { fatal: true });
    try {
        return textDecoder.decode(arrBuf);
    } catch (error) {
        throw new InputEncodingError(`Invalid text encoding.${ error.message ? ' ' + error.message + '.' : '' }`);
    }
}
