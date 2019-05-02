import * as _ from 'lodash';
import { Vertex, Edge } from './data_structures';
import { lpSolve, LPModel, LPResult } from './../../../../shared/lp_solver';

export function positionVertices(layers: Vertex[][], vertexDistance: number) {
    // tslint:disable-next-line
    const vertexPositioner: VertexPositionerLP = new VertexPositionerLP();
    vertexPositioner.positionVertices(layers, vertexDistance);
}

function vertexToString(vertex: Vertex): string {
    return vertex.index.toString() + '_' + vertex.name;
}

function buildVarName(...vertices: Vertex[]): string {
    return vertices.map(v => vertexToString(v)).join('_');
}

// pos var
function buildPVarName(vertex: Vertex): string {
    return 'p' + buildVarName(vertex);
}

// distance var
function buildDVarName(vertex: Vertex): string {
    return 'd' + buildVarName(vertex);
}

// slope violation var
function buildSlopeViolationVarName(vertexFrom: Vertex, vertexTo: Vertex): string {
    return 'sv' + buildVarName(vertexFrom, vertexTo);
}

class VertexPositionerLP {
    constructor() {}

    positionVertices(layers: Vertex[][], vertexDistance: number) {
        if (
            Math.max(...layers.map(l => l.length)) <= 1 &&
            _.sum(layers.map(layer => (layer.length > 0 ? 1 : 0))) <= 1
        ) {
            for (const layer of layers) {
                for (const vertex of layer) { vertex.y = vertex.size / 2; }
            }
        }

        const lpModel: LPModel = this.constructLPModel(layers, vertexDistance);

        const lpResult: LPResult = lpSolve(lpModel);

        const bottomMargin = 0.0;

        for (const layer of layers) {
            const y: number = bottomMargin;
            for (const vertex of layer) {
                const solverValue: number = lpResult.vars.get(buildPVarName(vertex));
                vertex.y = solverValue;
            }
        }
    }

    constructLPModel(layers: Vertex[][], vertexDistance: number): LPModel {
        const lpModel = new LPModel();

        lpModel.setObjective('min', {});
        this.addNeighbourRankLinkConstraints(lpModel, layers);
        this.addPositionConstraints(lpModel, layers, vertexDistance);
        this.addSlopeConstraints(lpModel, layers);

        return lpModel;
    }

    addPositionConstraints(lpModel: LPModel, layers: Vertex[][], vertexDistance: number) {
        const varMaxSize: string = 'maxSize';
        for (const layer of layers) {
            if (layer.length > 0) {
                const varPLB: string = buildPVarName(layer[0]);
                const conNameLB: string = 'ConLBLayer' + layer[0].layerIndex.toString();
                lpModel.addConstraint(conNameLB, layer[0].size / 2, null, {
                    [varPLB]: 1
                });

                // add minDistances between neighbours
                // tslint:disable-next-line:one-variable-per-declaration
                for (let iV: number = 1, nV: number = layer.length; iV < nV; iV++) {
                    const vertex: Vertex = layer[iV];
                    const vertexPrecessor: Vertex = layer[iV - 1];
                    const minDistance: number = this.getMinVertexDistance(vertexPrecessor, vertex, vertexDistance);

                    const varPvertex: string = buildPVarName(vertex);
                    const varPprecessor: string = buildPVarName(vertexPrecessor);
                    const conName: string = 'ConMinDist_' + varPprecessor + '_' + varPvertex;
                    lpModel.addConstraint(conName, minDistance, null, {
                        [varPvertex]: 1,
                        [varPprecessor]: -1
                    });
                }
                // link maxSize with position of last element
                const varPUB: string = buildPVarName(layer[layer.length - 1]);
                const conNameUB: string = 'ConUBLayer' + layer[0].layerIndex.toString();

                lpModel.addConstraint(conNameUB, layer[layer.length - 1].size / 2, null, {
                    [varMaxSize]: 1,
                    [varPUB]: -1
                });
            }
        }
        lpModel.setObjectiveCoefficient(varMaxSize, 1);
    }

    addSlopeConstraints(lpModel: LPModel, layers: Vertex[][]) {
        const SLOPE_VIOLATION_PENALTY: number = 100;
        for (const layer of layers) {
            for (const vertex of layer) {
                if (!vertex.isVirtual || vertex.inEdges[0].source.isVirtual) { continue; }

                const nonVirtualSource = vertex.inEdges[0].source;
                const [nonVirtualTarget, spanTarget] = this.getNonVirtualTarget(vertex);
                const layerSpan: number = 1 + spanTarget;
                const varSV: string = buildSlopeViolationVarName(nonVirtualSource, nonVirtualTarget);

                let edge: Edge = vertex.inEdges[0];
                while (edge) {
                    const constraint: Object = {};
                    // -varSV<=(pGlobalFrom-pGlobalTo)/layerSpan-(pLocalFrom-pLocalTo)<=varSV
                    constraint[buildPVarName(nonVirtualSource)] = 1.0 / layerSpan;
                    constraint[buildPVarName(nonVirtualTarget)] = -1.0 / layerSpan;
                    if (edge.source === nonVirtualSource) {
                        constraint[buildPVarName(edge.source)] = constraint[buildPVarName(edge.source)] - 1;
                    } else {
                        constraint[buildPVarName(edge.source)] = -1;
                    }

                    if (edge.target === nonVirtualTarget) {
                        constraint[buildPVarName(edge.target)] = constraint[buildPVarName(edge.target)] + 1;
                    } else {
                        constraint[buildPVarName(edge.target)] = 1;
                    }

                    constraint[varSV] = -1;
                    const conName1: string =
                        'ConSlopeViolation(' + vertexToString(edge.source) + '>' + vertexToString(edge.target) +
                        ',' + varSV + ') globalSlope-localSlope<=SV';
                    lpModel.addConstraint(conName1, null, 0, constraint);

                    constraint[varSV] = 1;
                    const conName2: string =
                        'ConSlopeViolation(' + vertexToString(edge.source) + '>' + vertexToString(edge.target) + ',' +
                        varSV + ') -SV<=globalSlope-localSlope';
                    lpModel.addConstraint(conName2, 0, null, constraint);

                    if (!edge.target.isVirtual) {
                        edge = null;
                    } else {
                        edge = edge.target.outEdges[0];
                    }
                }

                lpModel.setObjectiveCoefficient(varSV, SLOPE_VIOLATION_PENALTY);
            }
        }
    }

    multiplyConstraintWithMinusOne(constraint: Object) {
        for (const key of Object.getOwnPropertyNames(constraint)) {
            constraint[key] = -constraint[key];
        }
    }

    addNeighbourRankLinkConstraints(lpModel: LPModel, layers: Vertex[][]) {
        const VERTEX_DISTANCE_PENALTY: number = 1;

        for (const layer of layers) {
            for (const vertex of layer) {
                if (vertex.isVirtual) { continue; }

                let totalWeight: number = 0.0;
                const constraint: Object = {};
                // d_vertex >= p_vertex - sum_n_(p_n*w_n)
                for (const edge of vertex.inEdges) {
                    let source: Vertex = edge.source;
                    let span: number = 1;
                    if (source.isVirtual) {
                        [source, span] = this.getNonVirtualSource(source);
                    }

                    constraint[buildPVarName(source)] = -edge.weight;
                    totalWeight += edge.weight;
                }

                for (const edge of vertex.outEdges) {
                    let target: Vertex = edge.target;
                    let span: number = 1;
                    if (target.isVirtual) {
                        [target, span] = this.getNonVirtualTarget(target);
                    }
                    constraint[buildPVarName(target)] = -edge.weight;
                    totalWeight += edge.weight;
                }
                for (const key of Object.getOwnPropertyNames(constraint)) {
                    const oldValue: number = constraint[key];
                    constraint[key] = constraint[key] / totalWeight;
                    const newValue: number = constraint[key];
                }
                constraint[buildPVarName(vertex)] = 1;
                const varD: string = buildDVarName(vertex);
                constraint[varD] = -1;
                const conName1: string = 'InterLayPosLink' + vertexToString(vertex) + '_D>=P-wSoN';
                lpModel.addConstraint(conName1, null, 0, constraint);
                for (const key of Object.getOwnPropertyNames(constraint)) {
                    constraint[key] = -constraint[key];
                }
                constraint[varD] = -1;
                const conName2: string = 'InterLayPosLink' + vertexToString(vertex) + '_D>=wSoN-P';
                lpModel.addConstraint(conName2, null, 0, constraint);

                lpModel.setObjectiveCoefficient(varD, totalWeight);
            }
        }
    }

    getNonVirtualTarget(vertex: Vertex): [Vertex, number] {
        let result: Vertex = vertex.outEdges[0].target;
        let span: number = 2;
        while (result.isVirtual) {
            result = result.outEdges[0].target;
            span++;
        }
        return [result, span];
    }

    getNonVirtualSource(vertex: Vertex): [Vertex, number] {
        let result: Vertex = vertex.inEdges[0].source;
        let span: number = 2;
        while (result.isVirtual) {
            result = result.inEdges[0].source;
            span++;
        }
        return [result, span];
    }

    getMinVertexDistance(vertexA: Vertex, vertexB: Vertex, vertexDistance: number): number {
        const MIN_SIBLING_DIST: number = vertexDistance * 1;
        const MIN_NONSIBLING_DIST: number = vertexDistance * 2;
        const MIN_NODE_TO_EDGE_DIST: number = vertexDistance * 1;
        const MIN_EDGE_TO_EDGE_DIST: number = vertexDistance / 2;

        if (vertexB.isVirtual) {
            if (vertexA.isVirtual) {
                return vertexA.size / 2 + MIN_EDGE_TO_EDGE_DIST + vertexB.size / 2;
            } else { return vertexA.size / 2 + MIN_NODE_TO_EDGE_DIST + vertexB.size / 2; }
        } else {
            if (vertexA.isVirtual) {
                return vertexA.size / 2 + MIN_NODE_TO_EDGE_DIST + vertexB.size / 2;
            }
            if (this.shareVerticesAParent(vertexA, vertexB)) {
                return vertexA.size / 2 + MIN_SIBLING_DIST + vertexB.size / 2;
            }
            if (this.shareVerticesAChild(vertexA, vertexB)) {
                return vertexA.size / 2 + MIN_SIBLING_DIST + vertexB.size / 2;
            }
            return vertexA.size / 2 + MIN_NONSIBLING_DIST + vertexB.size / 2;
        }
    }

    shareVerticesAParent(vertexA: Vertex, vertexB: Vertex): boolean {
        return (_.intersection(
            vertexA.inEdges.map(e => e.source.index),
            vertexB.inEdges.map(e => e.source.index)
        ).length > 0);
    }

    shareVerticesAChild(vertexA: Vertex, vertexB: Vertex): boolean {
        return (_.intersection(
            vertexA.outEdges.map(e => e.target.index),
            vertexB.outEdges.map(e => e.target.index)
        ).length > 0);
    }
}
