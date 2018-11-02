import * as _ from 'lodash';
import {Graph, Vertex, Edge} from './data_structures';
import {lpSolve, LPModel, LPResult} from './lp_solver';
import {createVirtualVertices} from './shared';

function sortVerticesAccordingToResult(graph: Graph, lpResult: LPResult) {
  for(const layer of graph.layers) {
    layer.sort((a,b)=>lpResult.vars.get('x' + a.index.toString() + '_' + b.index.toString())>0?-1:1);
    for(let i: number = layer.length-1; i>=0; i--) layer[i].indexInLayer = i; 
  }
}


function constructModel(layers: Vertex[][]): LPModel {
  const lpModel: LPModel = new LPModel();
  addConstraintsAndObjective(layers, lpModel);
  return lpModel;
}

function sort(graph: Graph) {
  const lpModel: LPModel = constructModel(graph.layers);
  const lpResult: LPResult = lpSolve(lpModel);
  sortVerticesAccordingToResult(graph, lpResult);
}

function addConstraintsAndObjective(layers: Vertex[][], lpModel) {
  const neighbourVars: string[] = [];
  const crossingVars: string[] = [];
  let pathVars: string[] = [];

  for(const layer of layers) for(let i: number = layer.length-1; i>=0; i--) layer[i].indexInLayer = i;

  for(const layer of layers) {
    // add Xij == 1 <==> i->j  constraints
    for(let i1: number = layer.length-3; i1>=0; i1--)  {
      for(let i2: number = layer.length-2; i2>i1; i2--) { 
        const varXij: string = 'x' + layer[i1].index.toString() + '_' + layer[i2].index.toString();
        pathVars.push(varXij);
        for(let i3: number = layer.length-1; i3>2; i3--) {
          const varXjk: string = 'x' + layer[i2].index.toString() + '_' + layer[i3].index.toString();
          pathVars.push(varXij);
          const varXik: string = 'x' + layer[i1].index.toString() + '_' + layer[i3].index.toString();
          pathVars.push(varXik);
          const conName: string = 'C13.23:('+layer[i1].index.toString() + ',' + layer[i2].index.toString() + ',' + layer[i3].index.toString() + ')';
          lpModel.addConstraint(conName,
            0, 1, {
              [varXij]: 1, 
              [varXjk]: 1, 
              [varXik]: -1
            });
          } 
        }
      }
      // add Nij == 1  i is neighbour of j
      let pairs: Vertex[][] = [];
      const siblingsWithRespectToUpLayer: Vertex[][] = _.uniq([].concat(...layer.map(v=>v.inEdges.map(e=>e.source)))).map(v=>v.outEdges.map(e=>e.target));
      const siblingsWithRespectToDownLayer: Vertex[][] = _.uniq([].concat(...layer.map(v=>v.outEdges.map(e=>e.target)))).map(v=>v.inEdges.map(e=>e.source));
      const siblingsArray: Vertex[][] = [].concat(siblingsWithRespectToUpLayer,siblingsWithRespectToDownLayer).filter(l=>l.length>1);
      
      for(const siblings of siblingsArray) {
        siblings.sort((a,b)=>a.getIndexInLayer<b.getIndexInLayer?-1:1);
        for(let iS2: number = siblings.length-1; iS2>0; iS2--) {
          for(let iS1: number = 0; iS1<iS2; iS1++) {
            pairs.push([siblings[iS1],siblings[iS2]]);
          }
        }
        
        pairs = _.uniqWith(pairs,(a,b)=>a[0]==b[0] && a[1]==b[1]);
        for(const pair of pairs) {
          const varNik: string = 'n' + pair[0].index.toString() + '_' + pair[1].index.toString();
          neighbourVars.push(varNik);
          for(const vertex of layer) {
            if(vertex!=pair[0] && vertex!=pair[1]) {
              // add nik<=2-(xjk+xij)
              const varXjk: string = 'x' + vertex.index.toString() + '_' + pair[1].index.toString();
              const varXij: string = 'x' + pair[0].index.toString() + '_' + vertex.index.toString();
              const conName1: string = 'Con:' + varNik + '<=2-' + varXjk + '-' + varXij;
              lpModel.addConstraint(null,2,{[varNik]: 1, [varXjk]: 1, [varXij]: 1});
            }
          }
        }
        //allPairs = allPairs.concat(pairs); 
        
        // add Crossings
        const targets: Vertex[] = layer.filter(v=>v.inEdges.length>0);
        for(let iT2: number = targets.length-1; iT2>0; iT2--) {
          for(let iT1: number = 0; iT1<iT2; iT1++) {
            const targetI: Vertex = targets[iT1];
            const targetK: Vertex = targets[iT2];
            const sourcesFromTargetI: Vertex[] = targetI.inEdges.map(e=>e.source);
            const sourcesFromTargetK: Vertex[] = targetK.inEdges.map(e=>e.source);
            
            
            const varXik = 'x' + targetI.index.toString() + '_' + targetK.index.toString();
            
            for(const sourceJ of sourcesFromTargetI) {
              for(const sourceL of sourcesFromTargetK) {
                if(sourceJ!=sourceL) {
                  const varCijkl = 'c' + targetI.index.toString() + '_' + sourceJ.index.toString() + '_' + targetK.index.toString() + '_' + sourceL.index.toString();        
                  crossingVars.push(varCijkl);
                  if(sourceJ.indexInLayer<sourceL.indexInLayer) {
                    const varXjl = 'x' + sourceJ.index.toString() + '_' + sourceL.index.toString();
                    const conCijkl1: string = 'c13.21:' + varXjl + '-' + varXik + '<=' + varCijkl;
                    lpModel.addConstraint(conCijkl1, null, 0, {
                      [varXjl]: 1, 
                      [varXik]: -1, 
                      [varCijkl]: -1
                    }); 
                    const conCijkl2: string = 'c13.21:' + '-' + varCijkl + '<=' + varXjl + '-' + varXik ;
                    lpModel.addConstraint(conCijkl2, 0, null, {
                      [varXjl]: 1, 
                      [varXik]: -1, 
                      [varCijkl]: 1
                    }); 
                  } else {
                    const varXlj = 'x' + sourceL.index.toString() + '_' + sourceJ.index.toString();
                    const conCijkl1: string = 'c13.22:' + varXlj + '+' + varXik + '<=1+' + varCijkl;
                    lpModel.addConstraint(conCijkl1, null, 1, {
                      [varXlj]: 1, 
                      [varXik]: 1, 
                      [varCijkl]: -1
                    });
                    const conCijkl2: string = 'c13.22:' + '1-' + varCijkl + '<=' + varXlj + '+' + varXik ;
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
    }
    
    const objective = {};
    for(const varC of crossingVars) objective[varC] = 1;
    for(const varN of neighbourVars) objective[varN] = 1/neighbourVars.length/2;
    pathVars = _.uniq(pathVars);
    lpModel.setObjective('min', objective);
    lpModel.setBinaryVariables([].concat(crossingVars, pathVars));
  }
  
  
  /*function createVirtualVertices(graph: Graph) {
    for(let layer of graph.layers) for(let vertex of layer) for(let edge of vertex.inEdges) if(Math.abs(edge.source.layerIndex-edge.target.layerIndex)>1) splitEdge(graph, edge);
  }
  
  function splitEdge(graph: Graph, edge: Edge) {
    const layerSpan = edge.source.layerIndex-edge.target.layerIndex;
    const maxVertexIndex: number = graph.vertices.length-1;
    const layers: Vertex[][] = graph.layers;
    // add new virtual nodes
    for(let i: number = 1; i<layerSpan; ++i) {
      let iL: number = edge.source.layerIndex - i;
      let vertex: Vertex = new Vertex();
      graph.insertVertex(vertex);
      vertex.isVirtual = true;
      //graph.vertices.push(new Vertex()); 
      //vertexRank[++maxVertexIndex] = iL; // 
      layers[iL].push(vertex);
      vertex.setIndexInLayer(layers[iL].length-1);
      vertex.layerIndex = iL;
    }
    
    // ToDO: Improve
    let edgeOutIndex: number = edge.source.outEdges.findIndex(e => {return e.target.index===edge.target.index});
    let edgeInIndex: number = edge.target.inEdges.findIndex(e => {return e.source.index===edge.source.index});
    const newSpanStartEdge: Edge = new Edge(graph.vertices[edge.source.index], graph.vertices[maxVertexIndex + 1], true);
    newSpanStartEdge.weight = edge.weight;
    graph.vertices[edge.source.index].outEdges[edgeOutIndex] = newSpanStartEdge; // replacing old edge
    graph.vertices[maxVertexIndex+1].inEdges = [newSpanStartEdge];
    const newSpanEndEdge: Edge = new Edge(graph.vertices[maxVertexIndex + layerSpan - 1], graph.vertices[edge.target.index], true);
    newSpanEndEdge.weight = edge.weight;
    graph.vertices[edge.target.index].inEdges[edgeInIndex] = newSpanEndEdge;
    graph.vertices[maxVertexIndex+layerSpan-1].outEdges = [newSpanEndEdge];
    
    for(let i: number = 1; i<layerSpan-1; ++i) { 
      const newSpanInBetweenEdge: Edge = new Edge(graph.vertices[maxVertexIndex+i], graph.vertices[maxVertexIndex+i+1], true);
      newSpanInBetweenEdge.weight = edge.weight;
      graph.vertices[maxVertexIndex+i].outEdges = [newSpanInBetweenEdge];
      graph.vertices[maxVertexIndex+i+1].inEdges = [newSpanInBetweenEdge];
    }
    
    // ToDo: 
    // set size to virtual nodes
  }
  */
  export function sortVerticesInLayers(graph: Graph) {
    createVirtualVertices(graph);
    sort(graph);
  } 