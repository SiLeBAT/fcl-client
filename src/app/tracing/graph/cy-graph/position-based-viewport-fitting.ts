import { getEnclosingRectFromPoints } from '@app/tracing/util/geometry-utils';
import { Layout, Size, Range, Position } from '../../data.model';
import _ from 'lodash';

const DEFAULT_VIEWPORT = { zoom: 1, pan: { x: 0, y: 0 } };

export function getPositionBasedFitViewPort(
    positions: Position[],
    availableSpace: Size,
    zoomLimits: Range,
    defaultViewPort?: Layout
): Layout {
    defaultViewPort = defaultViewPort || DEFAULT_VIEWPORT;
    if (
        positions.length > 0 &&
        availableSpace.width > 0 && availableSpace.height > 0
    ) {
        const rect = getEnclosingRectFromPoints(positions);
        let zoom = rect.width > 0 && rect.height > 0 ?
            Math.min(availableSpace.width / rect.width, availableSpace.height / rect.height) :
            defaultViewPort.zoom;
        zoom = Math.max(Math.min(zoom, zoomLimits.max), zoomLimits.min);

        const layout = {
            zoom: zoom,
            pan: {
                x: - (rect.left - (availableSpace.width / zoom - rect.width) / 2) * zoom,
                y:  - (rect.top - (availableSpace.height / zoom - rect.height) / 2) * zoom
            }
        };
        return layout;
    }
    return defaultViewPort;
}
