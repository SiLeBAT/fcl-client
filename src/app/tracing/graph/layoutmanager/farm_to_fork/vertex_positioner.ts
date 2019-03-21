import { Graph, Vertex } from './data_structures';
import { BusinessTypeRanker } from './business_type_ranker';

export function positionVertices(layers: Vertex[][]) {
  // tslint:disable-next-line
  const vertexPositioner: VertexPositioner = new VertexPositioner();
    vertexPositioner.positionVertices(layers);
}

class VertexPositioner {
    private static MIN_SIBLING_DIST: number = 1;
    private static MIN_NONSIBLING_DIST: number = 4;
    private static MIN_NODE_TO_EDGE_DIST: number = 2;
    private static MIN_EDGE_TO_EDGE_DIST: number = 1;

    private nodePos: number[];
    private nodeDist: number[];
    private nodeWeight: number[];
    private layers: number[][];
    private vertices: Vertex[];
    private maxNonCrossingVertexIndex: number;

    constructor() {}

    init() {
    // init node Positions
    // tslint:disable-next-line:one-variable-per-declaration
        for (let iL: number = 0, nL = this.layers.length; iL < nL; iL++) {
            const nV: number = this.layers[iL].length;
            let currentVIndex: number;
            if (nV > 0) {
                currentVIndex = this.layers[iL][0];
                this.nodePos[currentVIndex] = 0;
                this.nodeDist[currentVIndex] = 0;
            }
            let oldVIndex: number;
            for (let iV: number = 1; iV < nV; ++iV) {
                oldVIndex = currentVIndex;
                currentVIndex = this.layers[iL][iV];
                if (currentVIndex > this.maxNonCrossingVertexIndex) {
          // crossingNode
                    if (oldVIndex > this.maxNonCrossingVertexIndex) {
            // previous node in the layer is crossing node to
                        this.nodeDist[currentVIndex] =
              VertexPositioner.MIN_EDGE_TO_EDGE_DIST;
                    } else {
                        this.nodeDist[currentVIndex] =
              VertexPositioner.MIN_NODE_TO_EDGE_DIST;
                    }
                } else {
          /*
          if((this.vertices[currentVIndex].inVertices.some(r=> this.vertices[oldVIndex].inVertices.indexOf(r) >= 0)) ||
            (this.vertices[currentVIndex].outVertices.some(r=> this.vertices[oldVIndex].outVertices.indexOf(r) >= 0))) {
               // do the neighbours share a source or a target
            this.nodeDist[currentVIndex] = VertexPositioner.MIN_SIBLING_DIST;
          } else {
            this.nodeDist[currentVIndex] = VertexPositioner.MIN_NONSIBLING_DIST;
          }
          */
                }
                this.nodePos[currentVIndex] =
          this.nodePos[oldVIndex] + this.nodeDist[currentVIndex];
            }
        }
    }

    positionVertices(layers: Vertex[][]) {}

    refinePositions() {
    // tslint:disable-next-line:one-variable-per-declaration
        for (let iR: number = 1, nR: number = this.layers.length; iR < nR; iR++) {
      // tslint:disable-next-line:one-variable-per-declaration
            for (let iL: number = 0, nL: number = this.layers.length; iL < nL; iL++) {
                for (
          // tslint:disable-next-line:one-variable-per-declaration
          let iV: number = 0, nV: number = this.layers[iL].length;
          iV < nV;
          ++iV
        ) {
                    const currentVIndex = this.layers[iL][iV];
                    const posSum: number = 0;
                    const weightSum: number = 0;
          // Todo: apply median concept because it is more robust
          /*for(let iInV: number = 0, nInV: number = this.vertices[currentVIndex].inVertices.length; iInV<nInV; iInV++) {
            let w: number = this.nodeWeight[this.vertices[currentVIndex].inVertices[iInV]];
            posSum+= this.nodePos[this.vertices[currentVIndex].inVertices[iInV]] * w;
            weightSum+= w;
          }
          for(let iOutV: number = 0, nOutV: number = this.vertices[currentVIndex].outVertices.length; iOutV<nOutV; iOutV++) {
            let w: number = this.nodeWeight[this.vertices[currentVIndex].outVertices[iOutV]];
            posSum+= this.nodePos[this.vertices[currentVIndex].outVertices[iOutV]] * w;
            weightSum+= w;
          }*/
                    const newPos: number = posSum / weightSum;
                    if (iV > 0) {
                        this.nodePos[currentVIndex] = Math.max(
              this.nodePos[this.layers[iL][iV - 1]] +
                this.nodeDist[currentVIndex],
              newPos
            );
                    } else {
                        this.nodePos[currentVIndex] = newPos;
                    }
                }
            }
        }
    }
}
