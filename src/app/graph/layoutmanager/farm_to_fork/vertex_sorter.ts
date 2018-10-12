import {Graph, Vertex, Edge, VertexCounter} from './data_structures';

export function sortVertices(graph: Graph, layers: Vertex[][]) {
    let vertexSorter = new VertexSorter();
    vertexSorter.sortVertices(graph, layers);
} 

class VertexSorter {
    
    constructor() { }
    
    sortVertices(graph: Graph, layers: Vertex[][]) {
        this.createVirtualVertices(graph, layers); 
        
        const layerCopy = (arr: Vertex[][]) => { 
            const layerBackup: Vertex[][] = [];
            let i: number = arr.length;
            while(i--) layerBackup[i] = arr[i].slice();
            return layerBackup;
        }
        
        let bestSolution: Vertex[][] = layerCopy(layers);
        let bestCrossing: number = this.layerCrossing(layers);
        
        const ITERATION_LIMIT = 24;
        const ITERATION_LIMIT_RANDOM = 10;
        for(let iRandom: number = 0; iRandom < ITERATION_LIMIT_RANDOM; iRandom++ ) {
            for (let iIteration = 0; iIteration < ITERATION_LIMIT; iIteration++) {
                this.sortVerticesInLayers(layers, iIteration);
                this.transpose(layers);
                const currentCrossing: number = this.layerCrossing(layers);
                if (currentCrossing < bestCrossing) {
                    bestSolution = layerCopy(layers);
                    bestCrossing = currentCrossing;
                }
            }
            this.randomizeVertexOrderInLayers(graph);
        }
        this.restoreSolution(bestSolution);
    }
    
    private restoreSolution(layers: Vertex[][]) {
        for(let layer of layers) {
            let i: number=-1;
            for(let vertex of layer) vertex.indexInLayer = ++i;
        }
    }
    
    private randomizeVertexOrderInLayers(graph: Graph) {
        for(let layer of graph.layers) {
            for (let i = layer.length-1; i >=0; i--) {
                
                let randomIndex = Math.floor(Math.random()*(i+1)); 
                var itemAtIndex = layer[randomIndex]; 
                
                layer[randomIndex] = layer[i]; 
                layer[i] = itemAtIndex;
            }
        }
        graph.resetVertexIndicesInLayers();
    }
    
    private transpose(layers: Vertex[][]) {
        let improved: boolean = true;
        const maxRank: number = layers.length-1;
        while(improved) {
            improved = false;
            for(let iL: number = 0; iL<=maxRank; iL++) {
                for(let iV: number = 0, maxiV: number = layers[iL].length-2; iV<=maxiV; iV++) {
                    let v: Vertex = layers[iL][iV];
                    let w: Vertex = layers[iL][iV+1];
                    let vwCrossing: number = this.pairCrossing(v,w);
                    let wvCrossing: number = this.pairCrossing(w,v);
                    
                    //                if(this.pairCrossing(v,w)>this.pairCrossing(w,v)) {
                        if(vwCrossing>wvCrossing) {
                            improved = true;
                            layers[iL][iV] = w;
                            layers[iL][iV+1] = v;
                            w.indexInLayer = iV;
                            v.indexInLayer = iV + 1;
                            console.log('Switch at ' + iV.toString() + ' in ' + iL.toString() + ' [' + v.index.toString() + ', ' + w.index.toString() + ', ' + wvCrossing.toString() + ']');
                        }
                    }
                }
            }
        }
        
        private pairCrossing(v: Vertex, w: Vertex): number {
            let crossCount: number = 0;
            const tmpWUpNeighbours: number[] = w.inEdges.map(e => e.source.indexInLayer);
            const tmpWDownNeighbours: number[] = w.outEdges.map(e => e.target.indexInLayer);
            for(let f of [a => a.inEdges.map(e => e.source.indexInLayer), a => a.outEdges.map(e => e.target.indexInLayer)]) {
                
                const vNeighbourIndices = f(v);
                const wNeighbourIndices = f(w);
                const nV: number = vNeighbourIndices.length;
                const nW: number = wNeighbourIndices.length;
                let iV: number = 0;
                let iW: number = 0;
                
                vNeighbourIndices.sort(); // ToDo: make faster by preventing this step
                wNeighbourIndices.sort(); // ToDo: make faster by preventing this step
                while(iV<nV && iW<nW) {
                    while(iV<nV && wNeighbourIndices[iW]>=vNeighbourIndices[iV]) iV++;
                    while(iW<nW && wNeighbourIndices[iW]<vNeighbourIndices[iV]) {
                        crossCount+= nV-iV;
                        iW++;
                    }
                }
            }
            return crossCount;
        }
        
        private layerCrossing(layers: Vertex[][]): number {
            let totalCrossing: number = 0;
            for(let iL: number = 0, nL = layers.length; iL<nL-1; iL++) {
                let vertexCounter = new VertexCounter();
                for(let vertex of layers[iL]) {
                    for(let edge of vertex.inEdges) totalCrossing+= vertexCounter.getVertexCountAbovePosition(edge.source.indexInLayer);
                    for(let edge of vertex.inEdges) vertexCounter.insertVertex(edge.source.indexInLayer);
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
            let tmp: number[][] = layers.map(l => l.map(v => v.indexInLayer));
        }
        
        getWeight(vertex: Vertex, rank: number): number {
            const adjacentPositions: number[] = (rank < vertex.layerIndex ? vertex.outEdges.map(e => e.target.indexInLayer):vertex.inEdges.map(e => e.source.indexInLayer));
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
        
        /*private createVirtualVertices(graph: Graph, layers: number[][]) {
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
        }*/
        
        private createVirtualVertices(graph: Graph, layers: Vertex[][]) {
            for(let layer of layers) for(let vertex of layer) for(let edge of vertex.inEdges) if(Math.abs(edge.source.layerIndex-edge.target.layerIndex)>1) this.splitEdge(graph, layers, edge);
        }
        
        private splitEdge(graph: Graph, layers: Vertex[][], edge: Edge) {
            const layerSpan = edge.source.layerIndex-edge.target.layerIndex;
            const maxVertexIndex: number = graph.vertices.length-1;
            
            // add new virtual nodes
            for(let i: number = 1; i<layerSpan; ++i) {
                let iL: number = edge.source.layerIndex - i;
                let vertex: Vertex = new Vertex();
                graph.insertVertex(vertex);
                vertex.isVirtual = true;
                //graph.vertices.push(new Vertex()); 
                //vertexRank[++maxVertexIndex] = iL; // 
                layers[iL].push(vertex);
                vertex.indexInLayer = layers[iL].length-1;
                vertex.layerIndex = iL;
            }
            
            // ToDO: Improve
            let edgeOutIndex: number = edge.source.outEdges.findIndex(e => {return e.target.index===edge.target.index});
            let edgeInIndex: number = edge.target.inEdges.findIndex(e => {return e.source.index===edge.source.index});
            graph.vertices[edge.source.index].outEdges[edgeOutIndex] = new Edge(graph.vertices[edge.source.index], graph.vertices[maxVertexIndex + 1], true); // replacing old edge
            graph.vertices[maxVertexIndex+1].inEdges = [graph.vertices[edge.source.index].outEdges[edgeOutIndex]];
            graph.vertices[edge.target.index].inEdges[edgeInIndex] = new Edge(graph.vertices[maxVertexIndex + layerSpan - 1], graph.vertices[edge.target.index], true);
            graph.vertices[maxVertexIndex+layerSpan-1].outEdges = [graph.vertices[edge.target.index].inEdges[edgeInIndex]];
            
            for(let i: number = 1; i<layerSpan-1; ++i) { 
                graph.vertices[maxVertexIndex+i].outEdges = [new Edge(graph.vertices[maxVertexIndex+i], graph.vertices[maxVertexIndex+i+1], true)];
                graph.vertices[maxVertexIndex+i+1].inEdges = graph.vertices[maxVertexIndex+i].outEdges;
            }
        }
    }
    
    