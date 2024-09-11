import {MapType, ShapeFileData} from '../../data.model';
import {createOpenLayerMap, isProjectionSupported} from '../../util/map-utils';
import {InputDataError, InputFormatError} from '../io-errors';
import {getJsonFromFile} from '../io-utils';
import geojsonHintObject from '../../../../assets/geojsonhint/object';

const ERROR_OLD_STYLE_CRS = 'old-style crs member is not recommended';
const UNSUPPORTED_PROJECTION_TYPE_MSG =
  "Unsupported projection type. Please use geojson with pojection type 'EPSG:4326' or 'EPSG:3857' instead.";

interface ValidationResult {
  isValid: boolean;
  messages: string[];
}

interface Issue {
  line?: number;
  level?: string;
  message: string;
}

export async function getShapeFileData(file: File): Promise<ShapeFileData> {
  const jsonData = await getJsonFromFile(file);
  try {
    // 1. test: can an open layer map be created
    createOpenLayerMap({
      mapType: MapType.SHAPE_FILE,
      shapeFileData: jsonData,
      lineColor: {r: 0, g: 0, b: 0},
      lineWidth: 0.5,
    });
    return jsonData;
  } catch (error) {
    // there is a problem
    // is an invalid GeoJSON format the reason?
    // 2. test: check data against schema file
    const result = await validateGeoJSON(jsonData);
    if (!result.isValid) {
      const isProjSup = isProjectionSupported(jsonData);
      if (!isProjSup) {
        throw new InputDataError(UNSUPPORTED_PROJECTION_TYPE_MSG);
      } else {
        const messages = result.messages.filter(
          m => !m.startsWith(ERROR_OLD_STYLE_CRS)
        );
        throw new InputFormatError(
          `No valid GeoJSON format (${messages.map(m => m[0].toUpperCase() + m.slice(1)).join('. ')}).`
        );
      }
    }
    throw new InputDataError(
      `Could not create open layer map from shape file${error.message ? ' (' + error.message + ')' : ''} + ').`
    );
  }
}

async function validateGeoJSON(data: any): Promise<ValidationResult> {
  const issues = geojsonhint(data);
  return {
    isValid: issues.length === 0,
    messages: issues.map(issue => issue.message),
  };
}

function geojsonhint(jsonObject: any): Issue[] {
  const errors = geojsonHintObject.hint(jsonObject, {
    precisionWarning: false,
    noDuplicateMembers: false,
  });
  return errors;
}
