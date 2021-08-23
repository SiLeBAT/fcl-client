import { PositionMap } from '@app/tracing/data.model';

export function isPosMapEmpty(posMap: PositionMap): boolean {
    // tslint:disable-next-line:forin
    for (const x in posMap) {
        return false;
    }
    return true;
}
