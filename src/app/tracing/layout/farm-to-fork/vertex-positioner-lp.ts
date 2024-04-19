import * as _ from 'lodash';
import { Vertex, CompressedVertexGroup } from './data-structures';
import { lpSolve, LPModel, LPResult, Term } from '../../../shared/lp-solver';
import {
    getMinScaledVertexPairPosDistance, getMinVertexPairSpecificDistance,
    getRequiredScaledLayerSpace
} from './shared';

interface ScaledSpace {
    scale: number;
    scaledSpace: number;
}

const OBJ_FUN_LINE_DISTANCE_PENALTY = 10;
const OBJ_FUN_CENTER_DISTANCE_PENALTY = 1;
const OBJ_FUN_MAX_SIZE_PENALTY = 1;

export function positionVertices(layers: Vertex[][], vertexDistance: number, maxLayerLength?: number) {
    // eslint-disable-next-line
    const vertexPositioner: VertexPositionerLP = new VertexPositionerLP();
    vertexPositioner.positionVertices(layers, vertexDistance, maxLayerLength);
}
// debug version
// function vertexToString(vertex: Vertex): string {
//     return formatIndex(vertex.layerIndex) + ':' + formatIndex(vertex.index) +
//         (vertex.isVirtual ? 'v' : '') +
//         ((vertex as CompressedVertexGroup).compressedVertices !== undefined ? 'c' : '') +
//         '_' + shortenName(vertex.name);
// }

function vertexToString(vertex: Vertex): string {
    return vertex.index + '';
}

function formatIndex(value: number): string {
    return value.toLocaleString('en', { minimumIntegerDigits: 3 });
}

function shortenName(name: string, maxLen: number = 10): string {
    if (name === undefined) {
        return '';
    } else if (name.length <= maxLen) {
        return name;
    } else {
        return name.substr(0, maxLen - 2) + '..';
    }
}

function buildVarName(...vertices: Vertex[]): string {
    return vertices.map(v => vertexToString(v)).join('_');
}

// pos var
function buildPosVarName(vertex: Vertex): string {
    return 'vp' + buildVarName(vertex);
}

// straight line distance var
function buildLineDistanceVarName(vertex: Vertex): string {
    return 'vLd' + buildVarName(vertex);
}

// straight line distance con prefix
function buildLineDistanceConName(vertex: Vertex): string {
    return 'cLd' + buildVarName(vertex);
}

// distance var
function buildDistVarName(vertex: Vertex): string {
    return 'cpd' + buildVarName(vertex);
}

function buildInterLayerPosConName(vertex: Vertex): string {
    return 'ccpd' + buildVarName(vertex);
}

class VertexPositionerLP {

    positionVertices(layers: Vertex[][], vertexDistance: number, maxLayerLength: number | undefined) {

        if (maxLayerLength !== undefined) {
            this.fitLayerScales(layers, vertexDistance, maxLayerLength * 0.999);
        }

        const lpModel: LPModel = this.constructLPModel(layers, vertexDistance, maxLayerLength);

        const lpResult: LPResult = lpSolve(lpModel);

        const bottomMargin = 0.0;

        for (const layer of layers) {
            const y: number = bottomMargin;
            if (layer.length > 0) {
                for (const vertex of layer) {
                    const solverValue: number = lpResult.vars.get(buildPosVarName(vertex))!;
                    vertex.y = solverValue;
                }
            }
        }
    }

    private fitLayerScales(layers: Vertex[][], vertexDistance: number, maxLayerLength: number): void {
        const epsilon = maxLayerLength * 1e-6;
        let requiredLayerSpaces = layers.map(layer => getRequiredScaledLayerSpace(layer, vertexDistance));
        let maxRequiredSpace = Math.max(...requiredLayerSpaces);

        while (maxRequiredSpace > (maxLayerLength + epsilon)) {

            const layerIndex = requiredLayerSpaces.indexOf(maxRequiredSpace);
            this.fitLayerScale(layers[layerIndex], vertexDistance, maxLayerLength);

            requiredLayerSpaces = layers.map(layer => getRequiredScaledLayerSpace(layer, vertexDistance));
            maxRequiredSpace = Math.max(...requiredLayerSpaces);
        }
    }

    private fitLayerScale(layer: Vertex[], vertexDistance: number, maxLayerLength: number): void {
        const epsilon = maxLayerLength * 1e-6;
        let subSpaces = this.getScaledSpacesForLayer(layer, vertexDistance);
        let requiredSpace = _.sum(subSpaces.map(ss => ss.scaledSpace));

        subSpaces.sort((ss1, ss2) => ss2.scale - ss1.scale);
        let newLayerScale = 1;

        while (requiredSpace > (maxLayerLength + epsilon)) {
            const scaledSubSpace = subSpaces[0].scaledSpace;
            const scaledComplementSpace = requiredSpace - scaledSubSpace;
            const unscaledSubSpace = scaledSubSpace / subSpaces[0].scale;
            newLayerScale = (maxLayerLength - scaledComplementSpace) / unscaledSubSpace;

            if (subSpaces.length === 1 || subSpaces[1].scale <= newLayerScale) {
                break;
            } else {
                newLayerScale = subSpaces[1].scale;
                const newScaledSubSpace = unscaledSubSpace * subSpaces[1].scale;
                requiredSpace += newScaledSubSpace - scaledSubSpace;
                subSpaces[1].scaledSpace += newScaledSubSpace;
                subSpaces = subSpaces.slice(1);
            }
        }

        this.setLayerScale(layer, newLayerScale);
    }

    private getScaledSpacesForLayer(layer: Vertex[], vertexDistance: number): ScaledSpace[] {
        const scaleToScaledSpaceMap: Record<number, number> = {};

        layer.forEach((vertex, vertexIndex) => {
            let outerSpace = (vertex.topPadding + vertex.bottomPadding);
            if (vertexIndex > 0) {
                outerSpace += getMinVertexPairSpecificDistance(layer[vertexIndex - 1], vertex, vertexDistance);
            }
            const innerSpace = vertex.innerSize;
            if (outerSpace > 0) {
                scaleToScaledSpaceMap[vertex.layerScale] = (scaleToScaledSpaceMap[vertex.layerScale] || 0) + outerSpace * vertex.layerScale;
            }
            if (innerSpace > 0) {
                scaleToScaledSpaceMap[vertex.innerScale] = (scaleToScaledSpaceMap[vertex.innerScale] || 0) + innerSpace * vertex.innerScale;
            }
        });
        return Object.keys(scaleToScaledSpaceMap).map(key => +key).map(scale => ({
            scale: scale,
            scaledSpace: scaleToScaledSpaceMap[scale]
        }));
    }

    private updateInnerScale(vertex: Vertex, innerScale: number): void {
        if (vertex.innerSize > 0) {
            const vertexGroup = vertex as CompressedVertexGroup;
            if (vertexGroup.innerScale > innerScale) {
                vertexGroup.innerScale = innerScale;
                vertex.inEdges.forEach((edge) => this.updateInnerScale(edge.source, innerScale));
                vertex.outEdges.forEach((edge) => this.updateInnerScale(edge.target, innerScale));
            }
        }
    }

    private setLayerScale(layer: Vertex[], scale: number): void {
        for (const vertex of layer) {
            vertex.layerScale = scale;
            this.updateInnerScale(vertex, scale);
        }
    }

    constructLPModel(layers: Vertex[][], vertexDistance: number, maxLayerLength: number | undefined): LPModel {
        const lpModel = new LPModel();

        lpModel.setObjective('min', {});
        this.addCenterPosConstraints(lpModel, layers);
        this.addPositionConstraints(lpModel, layers, vertexDistance, maxLayerLength);
        this.addStraightLineConstraints(lpModel, layers);

        return lpModel;
    }

    private addPositionConstraints(lpModel: LPModel, layers: Vertex[][], vertexDistance: number, maxLayerLength: number | undefined) {
        const varMaxSize: string = 'maxSize';
        lpModel.setObjectiveCoefficient(varMaxSize, OBJ_FUN_MAX_SIZE_PENALTY);
        if (maxLayerLength !== undefined) {
            lpModel.addConstraint('conMaxSizeUB', null, maxLayerLength, {
                [varMaxSize]: 1
            });
        }

        layers.forEach((layer, layerIndex) => {

            if (layer.length === 0) { return; }

            const firstVertex = layer[0];
            const varFirstVertexPos: string = buildPosVarName(firstVertex);

            const conFirstPosInLayerLB: string = 'ConFirstPosInLayerLB' + layerIndex;

            // add lower bound constraint for the first vertex v in a layer
            lpModel.addConstraint(conFirstPosInLayerLB,
                firstVertex.topPadding * firstVertex.layerScale + firstVertex.innerSize / 2 * firstVertex.innerScale,
                null,
                {
                    [varFirstVertexPos]: 1
                }
            );

            // add minDistances between neighbours
            // eslint-disable-next-line one-var
            for (let iV: number = 1, nV: number = layer.length; iV < nV; iV++) {
                const vertex: Vertex = layer[iV];
                const precessorVertex: Vertex = layer[iV - 1];
                const minDistance: number = getMinScaledVertexPairPosDistance(precessorVertex, vertex, vertexDistance);

                const varVertexPos: string = buildPosVarName(vertex);
                const varPreVertexPos: string = buildPosVarName(precessorVertex);
                const conMinDistBetweenVertexPos: string = 'ConMinDist_' + varPreVertexPos + '_' + varVertexPos;

                lpModel.addConstraint(conMinDistBetweenVertexPos, minDistance, null, {
                    [varVertexPos]: 1,
                    [varPreVertexPos]: -1
                });
            }

            // add for the last vertex of each layer the constraint
            // v_pos + v_size <= max_pos
            // link maxSize with position of last element

            // v_pos + v_scaled_right_padding <= maxSize
            // <==>
            // v_scaled_right_padding <= maxSize  - v_pos
            const lastVertex = layer[layer.length - 1];
            const varLastVertexPos: string = buildPosVarName(lastVertex);
            const conNameUB: string = 'ConUBLayer' + lastVertex.layerIndex;

            lpModel.addConstraint(conNameUB,
                lastVertex.bottomPadding * lastVertex.layerScale + lastVertex.innerSize / 2 * lastVertex.innerScale,
                null,
                {
                    [varMaxSize]: 1,
                    [varLastVertexPos]: -1
                }
            );
        });
    }

    private addStraightLineConstraints(lpModel: LPModel, layers: Vertex[][]) {
        for (const layer of layers) {
            for (const vertex of layer) {
                if (!vertex.isVirtual) { continue; }

                // the vertex is virtual
                // this is a artifical vertex for a long edge

                const nonVirtualSource = this.getNonVirtualSource(vertex);
                const varNonVirtualSourcePos = buildPosVarName(nonVirtualSource);
                const nonVirtualTarget = this.getNonVirtualTarget(vertex);
                const varNonVirtualTargetPos = buildPosVarName(nonVirtualTarget);
                const varVertexPos = buildPosVarName(vertex);
                const varLineDistance = buildLineDistanceVarName(vertex);

                const layerSpan = nonVirtualSource.layerIndex - nonVirtualTarget.layerIndex;
                const spanFactor = (nonVirtualSource.layerIndex - vertex.layerIndex) / layerSpan;

                // pos_s + (s_index-v_index)/(s_index-t_index)(pos_t - pos_s) - pos_v <= edgedist_v
                // pos_s + (s_index-v_index)/(s_index-t_index)(pos_t - pos_s) - pos_v >= -edgedist_v
                // (1-f) pos_s + f pos_t - pos_v <= edgedist_v
                lpModel.addDoubleBoundConstraint(
                    buildLineDistanceConName(vertex),
                    {
                        [varNonVirtualSourcePos]: 1 - spanFactor,
                        [varNonVirtualTargetPos]: spanFactor,
                        [varVertexPos]: -1
                    },
                    {
                        [varLineDistance]: 1
                    }
                );

                lpModel.setObjectiveCoefficient(varLineDistance, OBJ_FUN_LINE_DISTANCE_PENALTY);
            }
        }
    }

    private scaleTerm(term: Term, scale: number): void {
        for (const key of Object.getOwnPropertyNames(term)) {
            term[key] = term[key] * scale;
        }
    }

    private addCenterPosConstraints(lpModel: LPModel, layers: Vertex[][]) {
        // for each non virtual vertex v quasi the following constraint is added
        // d_v = p_v - ((Sum over all inegdes of v: e_weight * e_source_pos) +
        //             (Sum over all outedges of v: e_weight * e_target_pos)) /
        //             (Sum over all edges ov v: e_weight)

        for (const layer of layers) {
            for (const vertex of layer) {
                if (vertex.isVirtual) { continue; }

                const varVertexPos = buildPosVarName(vertex);

                let totalWeight: number = 0.0;
                const term: Term = {};

                for (const edge of vertex.inEdges) {
                    let source: Vertex = edge.source;

                    if (source.isVirtual) {
                        source = this.getNonVirtualSource(source);
                    }

                    const layerSpan = source.layerIndex - vertex.layerIndex;
                    const varSourcePos = buildPosVarName(source);
                    const relativeEdgeWeight = edge.weight / layerSpan;
                    term[varSourcePos] = relativeEdgeWeight;
                    totalWeight += relativeEdgeWeight;
                }

                for (const edge of vertex.outEdges) {
                    let target: Vertex = edge.target;

                    if (target.isVirtual) {
                        target = this.getNonVirtualTarget(target);
                    }

                    const layerSpan = vertex.layerIndex - target.layerIndex;
                    const varTargetPos = buildPosVarName(target);
                    const relativeEdgeWeight = edge.weight / layerSpan;
                    term[varTargetPos] = relativeEdgeWeight;
                    totalWeight += relativeEdgeWeight;
                }
                this.scaleTerm(term, 1 / totalWeight);

                const varDistance = buildDistVarName(vertex);

                // add -D <= wSoN - P <= D
                term[varVertexPos] = -1;
                lpModel.addDoubleBoundConstraint(
                    buildInterLayerPosConName(vertex),
                    term,
                    {
                        [varDistance]: 1
                    }
                );

                lpModel.setObjectiveCoefficient(varDistance, totalWeight * OBJ_FUN_CENTER_DISTANCE_PENALTY);
            }
        }
    }

    getNonVirtualTarget(vertex: Vertex): Vertex {
        let target = vertex.outEdges[0].target;
        while (target.isVirtual) {
            target = target.outEdges[0].target;
        }
        return target;
    }

    getNonVirtualSource(vertex: Vertex): Vertex {
        let source = vertex.inEdges[0].source;
        while (source.isVirtual) {
            source = source.inEdges[0].source;
        }
        return source;
    }
}
