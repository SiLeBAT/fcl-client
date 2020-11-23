
import { MapType } from '../../data.model';
import { createOpenLayerMap } from '../../util/map-utils';
const geojsonHintObject = require('../../../../assets/geojsonhint/object');

interface ValidationResult {
    isValid: boolean;
    messages: string[];
}

interface Issue {
    line?: number;
    level?: string;
    message: string;
}

export async function validateShapeFileData(data: any): Promise<ValidationResult> {
    try {
        // 1. test: can an open layer map be created
        createOpenLayerMap({ mapType: MapType.SHAPE_FILE, shapeFileData: data }, null);
    } catch (error) {
        // there is a problem
        // is an invalid GeoJSON format the reason?
        // 2. test: check data against schema file
        const result = await validateGeoJSON(data);
        if (!result.isValid) {
            return result;
        }
        return {
            isValid: false,
            messages: [`Could not create open layer map from shape file (${error}).`]
        };
    }
    return {
        isValid: true,
        messages: []
    };
}

async function validateGeoJSON(data: any): Promise<ValidationResult> {
    const issues = geojsonhint(data);
    return {
        isValid: issues.length === 0,
        messages: issues.length > 0 ? [`No valid GeoJSON format (${issues[0].message}).`] : []
    };
}

function geojsonhint(jsonObject: any): Issue[] {
    const errors = geojsonHintObject.hint(jsonObject, { precisionWarning: false, noDuplicateMembers: false });
    return errors;
}
