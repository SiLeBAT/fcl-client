import * as _ from 'lodash';
import { Graph, Vertex } from './data-structures';
import { lpSolve, LPModel, LPResult } from './../../../shared/lp-solver';
import { createVirtualVertices } from './shared';
import { concat } from '@app/tracing/util/non-ui-utils';

function sortVerticesAccordingToResult(graph: Graph, lpResult: LPResult) {

    for (const layer of graph.layers) {
        layer.sort((a, b) => (
            a.indexInLayer < b.indexInLayer ?
                (lpResult.vars.get(buildXVarName(a, b))! > 0.5 ? -1 : 1) :
                (lpResult.vars.get(buildXVarName(b, a))! > 0.5 ? 1 : -1)
        ));

        for (let i: number = layer.length - 1; i >= 0; i--) { layer[i].indexInLayer = i; }
    }
}

function constructModel(layers: Vertex[][]): LPModel {
    const lpModel: LPModel = new LPModel();
    addConstraintsAndObjective(layers, lpModel);
    return lpModel;
}

function sort(graph: Graph, timeLimit: number) {
    if (Math.max(...graph.layers.map(l => l.length)) <= 1) { return; }

    const lpModel: LPModel = constructModel(graph.layers);
    const lpResult: LPResult = lpSolve(lpModel, timeLimit);

    sortVerticesAccordingToResult(graph, lpResult);
}

function vertexToString(vertex: Vertex): string {
    return vertex.index.toString() + '_' + vertex.name;
}

function buildVarName(...vertices: Vertex[]): string {
    return vertices.map(v => vertexToString(v)).join('_');
}

function buildXVarName(fromVertex: Vertex, toVertex: Vertex): string {
    return 'x' + buildVarName(fromVertex, toVertex);
}

function buildCVarName(edgeATo: Vertex, edgeAFrom: Vertex, edgeBTo: Vertex, edgeBFrom: Vertex) {
    return 'c(' + vertexToString(edgeAFrom) +
    '->' + vertexToString(edgeATo) + '),(' + vertexToString(edgeBFrom) + '->' + vertexToString(edgeBTo) + ')';
}

function addConstraintsAndObjective(layers: Vertex[][], lpModel) {
    const neighbourVars: string[] = [];
    const crossingVars: string[] = [];
    let pathVars: string[] = [];

    for (const layer of layers) { for (let i: number = layer.length - 1; i >= 0; i--) { layer[i].indexInLayer = i; } }

    for (const layer of layers) {
        let pathVarsInLayer: string[] = [];
        // add Xij == 1 <==> i->j  constraints
        for (let k: number = layer.length - 1; k >= 2; k--) {
            for (let j: number = 1; j < k; j++) {
                const varXjk: string = buildXVarName(layer[j], layer[k]);
                pathVarsInLayer.push(varXjk);
                for (let i: number = 0; i < j; i++) {
                    const varXij: string = buildXVarName(layer[i], layer[j]);
                    pathVarsInLayer.push(varXij);
                    const varXik: string = buildXVarName(layer[i], layer[k]);
                    pathVarsInLayer.push(varXik);
                    const conName: string =
                      'C13.23(L:' + layer[k].layerIndex.toString() + '):(' + layer[i].index.toString() +
                      ',' + layer[j].index.toString() + ',' + layer[k].index.toString() + ')';
                    lpModel.addConstraint(conName, 0, 1, {
                        [varXij]: 1,
                        [varXjk]: 1,
                        [varXik]: -1
                    });
                }
            }
        }
        if (layer.length > 1) {
            pathVarsInLayer = _.uniq(pathVarsInLayer);
        }
        pathVars = pathVars.concat(pathVarsInLayer);

        // add Crossings
        const targets: Vertex[] = layer.filter(v => v.inEdges.length > 0);
        for (let iT2: number = targets.length - 1; iT2 > 0; iT2--) {
            for (let iT1: number = 0; iT1 < iT2; iT1++) {
                const targetI: Vertex = targets[iT1];
                const targetK: Vertex = targets[iT2];
                const sourcesFromTargetI: Vertex[] = targetI.inEdges.map(e => e.source);
                const sourcesFromTargetK: Vertex[] = targetK.inEdges.map(e => e.source);

                const varXik = buildXVarName(targetI, targetK);

                for (const sourceJ of sourcesFromTargetI) {
                    for (const sourceL of sourcesFromTargetK) {
                        if (sourceJ !== sourceL) {
                            const varCijkl = buildCVarName(targetI, sourceJ, targetK, sourceL);
                            crossingVars.push(varCijkl);
                            if (sourceJ.indexInLayer < sourceL.indexInLayer) {
                                const varXjl = buildXVarName(sourceJ, sourceL);
                                const conCijkl1: string =
                                  'c13.21(L:' + targetI.layerIndex.toString() + '):' + varXjl + '-' + varXik + '<=' + varCijkl;
                                lpModel.addConstraint(conCijkl1, null, 0, {
                                    [varXjl]: 1,
                                    [varXik]: -1,
                                    [varCijkl]: -1
                                });
                                const conCijkl2: string =
                                  'c13.21(L:' + targetI.layerIndex.toString() + '):' + '-' + varCijkl + '<=' + varXjl + '-' + varXik;
                                lpModel.addConstraint(conCijkl2, 0, null, {
                                    [varXjl]: 1,
                                    [varXik]: -1,
                                    [varCijkl]: 1
                                });
                            } else {
                                const varXlj = buildXVarName(sourceL, sourceJ);
                                const conCijkl1: string =
                                  'c13.22(L:' + targetI.layerIndex.toString() + '):' + varXlj + '+' + varXik + '<=1+' + varCijkl;
                                lpModel.addConstraint(conCijkl1, null, 1, {
                                    [varXlj]: 1,
                                    [varXik]: 1,
                                    [varCijkl]: -1
                                });
                                const conCijkl2: string =
                                  'c13.22(L:' + targetI.layerIndex.toString() + '):' + '1-' + varCijkl + '<=' + varXlj + '+' + varXik;
                                lpModel.addConstraint(conCijkl2, 1, null, {
                                    [varXlj]: 1,
                                    [varXik]: 1,
                                    [varCijkl]: 1
                                });
                            }
                        }
                    }
                }
            }
        }

    }

    const objective = {};
    for (const varC of crossingVars) { objective[varC] = 1; }
    for (const varN of neighbourVars) { objective[varN] = -1 / neighbourVars.length / 2; }
    lpModel.setObjective('min', objective);
    lpModel.setBinaryVariables(concat(crossingVars, pathVars));
}

export function sortVerticesInLayers(graph: Graph, timeLimit?: number) {
    if (timeLimit === undefined) {
        timeLimit = Number.POSITIVE_INFINITY;
    } else {
        timeLimit = Math.max(timeLimit, 1000);
    }
    createVirtualVertices(graph);
    sort(graph, timeLimit);
}
