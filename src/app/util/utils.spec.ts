import { Utils } from './utils';

describe('Utils', () => {

    it('should compute sum correctly', () => {
        const sum = Utils.sum({ x: 1, y: 2 }, { x: 3, y: 4 });

        expect(sum.x).toBe(4);
        expect(sum.y).toBe(6);
    });

});
