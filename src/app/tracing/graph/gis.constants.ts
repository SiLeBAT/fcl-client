import {BoundaryRect} from '../util/geometry-utils';
import {Utils as UIUtils} from '../util/ui-utils';

export const REF_ZOOM = 1.0;
const EMPTY_FRAME_MIN_LON = -108;
const EMPTY_FRAME_MAX_LON = 108;
const EMPTY_FRAME_MIN_LAT = -54;
const EMPTY_FRAME_MAX_LAT = 54;

const EMPTY_FRAME_TOPLEFT_POS = UIUtils.latLonToPosition(
  EMPTY_FRAME_MAX_LAT,
  EMPTY_FRAME_MIN_LON,
  REF_ZOOM
);
const EMPTY_FRAME_BOTTOMRIGHT_POS = UIUtils.latLonToPosition(
  EMPTY_FRAME_MIN_LAT,
  EMPTY_FRAME_MAX_LON,
  REF_ZOOM
);

export const EMPTY_FRAME: BoundaryRect = {
  left: EMPTY_FRAME_TOPLEFT_POS.x,
  top: EMPTY_FRAME_TOPLEFT_POS.y,
  right: EMPTY_FRAME_BOTTOMRIGHT_POS.x,
  bottom: EMPTY_FRAME_BOTTOMRIGHT_POS.y,
  width: EMPTY_FRAME_BOTTOMRIGHT_POS.x - EMPTY_FRAME_TOPLEFT_POS.x,
  height: EMPTY_FRAME_BOTTOMRIGHT_POS.y - EMPTY_FRAME_TOPLEFT_POS.y,
};

export const RELATIVE_FRAME_MARGIN = 0.2;
export const ABSOLUTE_FRAME_MARGIN =
  (RELATIVE_FRAME_MARGIN * Math.min(EMPTY_FRAME.width, EMPTY_FRAME.height)) /
  (1 + 2 * RELATIVE_FRAME_MARGIN);

export const DEFAULT_ZOOM = 2;
