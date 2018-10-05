import {Graph, Vertex, VertexCounter} from './data_structures';

export function sortVertices(dag: Graph, layers: Vertex[][]): number[][] {
  let vertexSorter = new VertexSorter();
  return vertexSorter.sortVertices(layers);
} 

class VertexSorter {
   
  constructor() { }

  sortVertices(layers: Vertex[][]) {
      this.createVirtualVertices(layers); 
      
      //const layers = virtualized[0]
      //const edges = virtualized[1]
      const layerCopy = (arr: Vertex[][]) => { 
          const layerBackup: number[][] = [];
          let i: number = arr.length;
          while(i--) layerBackup[i] = arr[i].map(x => x.index);
          return layerBackup;
      }

      let bestSolution: number[][] = layerCopy(layers);
      let bestCrossing: number = this.layerCrossing(layers);
      const ITERATION_LIMIT = 24;
      for (let iIteration = 0; iIteration < ITERATION_LIMIT; iIteration++) {
          this.sortVerticesInLayers(layers, iIteration);
          this.transpose(layers);
          if (this.layerCrossing(layers) < bestCrossing) {
              bestSolution = layerCopy(layers);
          }
      }
  }

  transpose(layers: Vertex[][]) {
    let improved: boolean = true;
    const maxRank: number = layers.length-1;
    while(improved) {
        improved = false;
        for(let iL: number = 0; iL<=maxRank; iL++) {
            for(let iV: number = 0, maxiV: number = layers[iL].length-2; iV<=maxiV; iV++) {
                let v: Vertex = layers[iL][iV];
                let w: Vertex = layers[iL][iV+1];
                if(this.pairCrossing(v,w)>this.pairCrossing(w,v)) {
                    improved = true;
                    layers[iL][iV] = w;
                    layers[iL][iV+1] = v;
                    w.indexInLayer = iV;
                    v.indexInLayer = iV + 1;
                }
            }
        }
    }
  }

  pairCrossing(v: Vertex, w: Vertex): number {
    let crossCount: number = 0;
    for(let f of [a => a.nextLayer, a=>a.previousLayer]) {

        const vNeighbourIndices = f(v).map(x => x.indexInLayer);
        const wNeighbourIndices = f(w).map(x => x.indexInLayer);
        const nV: number = vNeighbourIndices.length;
        const nW: number = wNeighbourIndices.length;
        let iV: number = 0;
        let iW: number = 0;

        while(iV<nV && iW<nW) {
            while(iV<nV && wNeighbourIndices[iW]>vNeighbourIndices[iV]) iV++;
            while(iW<nW && wNeighbourIndices[iW]<vNeighbourIndices[iV]) {
                crossCount+= nV-iV;
                iW++;
            }
        }
        return crossCount;
    }
  }

  layerCrossing(layers: Vertex[][]): number {
      let totalCrossing: number = 0;
      for(let iL: number = 0, nL = layers.length; iL<nL-1; iL++) {
          let vertexCounter = new VertexCounter();
          for(let vertex of layers[iL]) {
              for(let neighbour of vertex.nextLayer) totalCrossing+= vertexCounter.getVertexCountAbovePosition(neighbour.indexInLayer);
              for(let neighbour of vertex.nextLayer) vertexCounter.insertVertex(neighbour.indexInLayer);
          }
      }
      return totalCrossing;
  }


  sortVerticesInLayers(layers: Vertex[][], iIteration: number) {
      if(iIteration%2==0) {
        for(let iL: number = 1, nL = layers.length; iL<nL; iL++) {
            for(let vertex of layers[iL]) vertex.weight = this.getWeight(vertex, iL-1);
            layers[iL] = layers[iL].sort((a, b) => {return (a.weight<b.weight?-1:1)});
        }
      } else {
        for(let iL: number = layers.length-2; iL>=0; iL--) {
            for(let vertex of layers[iL]) vertex.weight = this.getWeight(vertex, iL+1);
            layers[iL] = layers[iL].sort((a, b) => {return (a.weight<b.weight?-1:1)});
        }
      }
      for(let layer of layers) {
          let indexInLayer: number = -1;
          for(let vertex of layer) vertex.indexInLayer = ++indexInLayer;
      }
  }

  getWeight(vertex: Vertex, rank: number): number {
    const adjacentPositions: number[] = (rank < vertex.rank ? vertex.previousLayer.map(v => v.indexInLayer):vertex.nextLayer.map(v => v.indexInLayer));
    const pCount = adjacentPositions.length;
    if(pCount==0) return -1.0;
    else if(pCount%2==1) return adjacentPositions[(pCount-1)/2];
    else if(pCount==2) return (adjacentPositions[0] + adjacentPositions[1])/2;
    else {
        const halfCount: number = pCount/2; 
        const left: number = adjacentPositions[halfCount-1] - adjacentPositions[0];
        const right: number = adjacentPositions[pCount-1] - adjacentPositions[halfCount];
        return (adjacentPositions[halfCount-1]*right + adjacentPositions[halfCount]*left)/(left-right);
    }

  }

  private createVirtualVertices(graph: Graph, layers: number[][]) {
    let virtualIndex = 0
    const vertexRank: number[] = [];
    vertexRank[graph.vertices.length-1] = -1;
    for(let iL: number = 0, nL = layers.length; iL<nL; iL++) for(let v of layers[iL]) vertexRank[v] = iL;
    let maxVertexIndex: number = graph.vertices.length-1;
    for(let sourceIndex: number = 0, nSources: number = graph.vertices.length; sourceIndex<nSources; ++sourceIndex) {
        for(let iTarget:number=0, nTargets: number = graph.vertices[sourceIndex].outVertices.length; iTarget<nTargets; ++iTarget) {
            let targetIndex = graph.vertices[sourceIndex].outVertices[iTarget];
            let sourceLayerIndex: number = vertexRank[sourceIndex];
            let targetLayerIndex: number = vertexRank[targetIndex];
            let layerSpan: number = Math.abs(sourceLayerIndex - targetLayerIndex);
            if(layerSpan>1) {
                // edge spans multiple layers
                // introduce virtual vertices
                //let layerIndex: number = sourceLayerIndex;
                //let firstNewVertexIndex: number = maxVertexIndex + 1;
                //let lastNewVertexIndex: number = maxVertexIndex + layerSpan;
                for(let i: number = 1; i<layerSpan; ++i) {
                    let iL: number = sourceLayerIndex + (sourceLayerIndex<targetLayerIndex?i:-i);
                    //let vertex: Vertex = new Vertex();
                    graph.vertices.push(new Vertex()); // new virtual vertex
                    vertexRank[++maxVertexIndex] = iL; // 
                    layers[iL].push(maxVertexIndex);
                }
                graph.vertices[sourceIndex].outVertices[iTarget] = maxVertexIndex + 1;
                graph.vertices[maxVertexIndex+1].inVertices = [sourceIndex];
                graph.vertices[targetIndex].inVertices[graph.vertices[targetIndex].inVertices.indexOf(sourceIndex)] = maxVertexIndex + layerSpan - 1;
                graph.vertices[maxVertexIndex+layerSpan-1].outVertices = [targetIndex];

                for(let i: number = 1; i<layerSpan-1; ++i) { 
                    graph.vertices[maxVertexIndex+i].outVertices = [maxVertexIndex+i+1];
                    graph.vertices[maxVertexIndex+layerSpan-i].inVertices = [maxVertexIndex+layerSpan-i-1];
                }
                
            }
        }
    }
    //return [layers, edges]
}
}

