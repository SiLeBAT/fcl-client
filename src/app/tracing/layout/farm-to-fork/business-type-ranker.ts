import { Vertex } from './data-structures';

export class BusinessTypeRanker {
    private indexMap: Map<String, number> = new Map();
    private isSink: boolean[] = [];
    private isSource: boolean[] = [];
    private rankMatrix: boolean[][] = [];

    constructor(
    private sinkTypes: String[],
    private sourceTypes: String[],
    typeOrderings: String[][]
    ) {
        this.init(sinkTypes, sourceTypes, typeOrderings);
    }

    private init(
        sinkTypes: String[],
        sourceTypes: String[],
        typeOrderings: String[][]
    ) {
    // register businessTypes
        for (const s of sinkTypes) { this.isSink[this.add(s)] = true; }
        for (const s of sourceTypes) { this.isSource[this.add(s)] = true; }
        for (const orderedChain of typeOrderings) {
            for (const s of orderedChain) { this.add(s); }
        }

        const typeCount: number = this.indexMap.size;
        for (let i: number = typeCount - 1; i >= 0; i--) {
            if (this.isSink[i] != null) { this.isSink[i] = false; }
            if (this.isSource[i] != null) { this.isSource[i] = false; }
        }
        // init rankMatrix
        this.rankMatrix[typeCount - 1] = [];
        for (let i: number = typeCount - 1; i >= 0; i--) {
            this.rankMatrix[typeCount - 1][i] = null;
        }
        for (let i: number = typeCount - 2; i >= 0; i--) {
            this.rankMatrix[i] = this.rankMatrix[typeCount - 1].slice();
        }

        const sinkCodes = sinkTypes.map(t => {
            return this.indexMap.get(t);
        });
        const sourceCodes = sourceTypes.map(t => {
            return this.indexMap.get(t);
        });

        for (const sinkCode of sinkCodes) {
            for (let i: number = typeCount - 1; i >= 0; i--) {
                if (!this.isSink[i]) { this.rankMatrix[sinkCode][i] = true; }
            }
        }

        for (const orderedChain of typeOrderings) {
            for (let i: number = orderedChain.length - 2; i > 0; i--) {
                this.rankMatrix[this.indexMap.get(orderedChain[i])][
                    this.indexMap.get(orderedChain[i + 1])
                ] = true;
            }
        }
        // make rank matrix transitive
        for (let i: number = 0; i < typeCount; i++) {
            for (let j: number = 0; j < typeCount; j++) {
                if (i !== j) {
                    for (let k: number = 0; k < typeCount; k++) {
                        if (this.rankMatrix[j][i] && this.rankMatrix[i][k]) {
                            this.rankMatrix[j][k] = true;
                        }
                    }
                }
            }
        }
    }

    compareRankingByCode(typeA: number, typeB: number): number {
        if (typeA != null) {
            if (typeB != null) {
                if (this.rankMatrix[typeA][typeB]) { return -1; }
                if (this.rankMatrix[typeB][typeA]) { return 1; }
                return null;
            } else {
                // type B is unknown
                if (this.isSink[typeA]) { return -1; }
                if (this.isSource[typeA]) { return 1; }
                return null;
            }
        } else if (typeB != null) {
            // typeA is unkown
            if (this.isSink[typeB]) { return 1; }
            if (this.isSource[typeB]) { return -1; }
            return null;
        }
        return null;
    }

    compareRankingByType(typeA: String, typeB: String): number {
        const codeA: number = this.indexMap.has(typeA)
            ? this.indexMap.get(typeA)
            : -1;
        const codeB: number = this.indexMap.has(typeB)
            ? this.indexMap.get(typeB)
            : -1;
        return this.compareRankingByCode(codeA, codeB);
    }

    compareRanking(vertexA: Vertex, vertexB: Vertex): number {
        return this.compareRankingByCode(vertexA.typeCode, vertexB.typeCode);
    }

    getBusinessTypeCode(type: String): number {
        return this.indexMap.has(type) ? this.indexMap.get(type) : null;
    }

    private add(type: String): number {
        if (this.indexMap.has(type)) { return this.indexMap.get(type); }
        const index: number = this.indexMap.size;
        this.indexMap.set(type, index);
        return index;
    }

    isSinkType(typeCode: number): boolean {
        return typeCode >= 0 ? this.isSink[typeCode] : false;
    }

    isSourceType(typeCode: number): boolean {
        return typeCode >= 0 ? this.isSource[typeCode] : false;
    }
}
