import * as _ from 'lodash';
import {Graph, Vertex, Edge} from './data_structures';
import {lpSolve, LPModel, LPResult} from './lp_solver';
import {createVirtualVertices} from './shared';
import { listenOnPlayer } from '@angular/animations/browser/src/render/shared';
import { SummaryResolver } from '@angular/compiler';

function sortVerticesAccordingToResult(graph: Graph, lpResult: LPResult) {
  
  for(let iLayer: number = graph.layers.length-1; iLayer>=0; iLayer--) {
    const layer: Vertex[] = graph.layers[iLayer];
    layer.sort((a,b)=>(a.indexInLayer<b.indexInLayer?
      (lpResult.vars.get(buildXVarName(a, b))>0.5?-1:1):
      (lpResult.vars.get(buildXVarName(b, a))>0.5?1:-1)));
    /*layer.sort(function(a,b) {
      if(a.indexInLayer<b.indexInLayer) {
        const varName: string = buildXVarName(a, b);
        const varValue: number = lpResult.vars.get(varName);
      if(varValue>0.5) return -1;
      else return 1;
    });*/
    for(let i: number = layer.length-1; i>=0; i--) layer[i].indexInLayer = i; 
  }
}


function constructModel(layers: Vertex[][]): LPModel {
  const lpModel: LPModel = new LPModel();
  addConstraintsAndObjective(layers, lpModel);
  return lpModel;
}

function sort(graph: Graph) {
  if(Math.max(...graph.layers.map(l=>l.length))>=8) {
    graph = graph;
  }
  const lpModel: LPModel = constructModel(graph.layers);
  const lpResult: LPResult = lpSolve(lpModel);
  //lpModel.printObjective(lpResult);
  //lpModel.printConstraints(lpResult);
  sortVerticesAccordingToResult(graph, lpResult);
}

function vertexToString(vertex: Vertex): string {
  return vertex.index.toString() + '_' + vertex.name;
}

function buildVarName(...vertices: Vertex[]): string {
  return vertices.map(v=>vertexToString(v)).join('_');
}

function buildXVarName(fromVertex: Vertex, toVertex: Vertex): string {
  return 'x' + buildVarName(fromVertex, toVertex);
}


function buildCVarName(edgeATo: Vertex, edgeAFrom: Vertex, edgeBTo: Vertex, edgeBFrom: Vertex) {
  return 'c(' + vertexToString(edgeAFrom) + '->' + vertexToString(edgeATo) + '),(' + vertexToString(edgeBFrom) + '->' + vertexToString(edgeBTo) + ')';
  //return 'c' + vertexToString(edgeAFrom) + '_' + vertexToString(edgeATo) + '_' + vertexToString(edgeBFrom) + '_' + vertexToString(edgeBTo);
}


function addConstraintsAndObjective(layers: Vertex[][], lpModel) {
  const neighbourVars: string[] = [];
  const crossingVars: string[] = [];
  let pathVars: string[] = [];
  
  for(const layer of layers) for(let i: number = layer.length-1; i>=0; i--) layer[i].indexInLayer = i;
  
  for(const layer of layers) {
    let pathVarsInLayer: string[] = [];
    // add Xij == 1 <==> i->j  constraints
    for(let k: number = layer.length-1; k>=2; k--)  {
      for(let j: number = 1; j<k; j++) { 
        const varXjk: string = buildXVarName(layer[j], layer[k]); //  'x' + layer[i2].index.toString() + layer[i2].name + '_' + layer[i3].index.toString();
        pathVarsInLayer.push(varXjk);
        //const varXij: string = buildXVarName(layer[i1], layer[i2]); //     'x' + layer[i1].index.toString() + layer[i1].name + '_' + layer[i2].index.toString();
        //pathVarsInLayer.push(varXij);
        for(let i: number = 0; i<j; i++) {
          const varXij: string = buildXVarName(layer[i], layer[j]); //     'x' + layer[i1].index.toString() + layer[i1].name + '_' + layer[i2].index.toString();
          pathVarsInLayer.push(varXij);
          //const varXjk: string = buildXVarName(layer[i2], layer[i3]); //  'x' + layer[i2].index.toString() + layer[i2].name + '_' + layer[i3].index.toString();
          //pathVarsInLayer.push(varXij);
          const varXik: string = buildXVarName(layer[i], layer[k]); //  'x' + layer[i1].index.toString() + '_' + layer[i3].index.toString();
          pathVarsInLayer.push(varXik);
          const conName: string = 'C13.23(L:' + layer[k].layerIndex.toString()+'):('+layer[i].index.toString() + ',' + layer[j].index.toString() + ',' + layer[k].index.toString() + ')';
          lpModel.addConstraint(conName,
            0, 1, {
              [varXij]: 1, 
              [varXjk]: 1, 
              [varXik]: -1
            });
          } 
        }
      }
      if(layer.length>1) {
        pathVarsInLayer = _.uniq(pathVarsInLayer);
        /*const constraint = {};
        for(const pathVar of pathVarsInLayer) constraint[pathVar] = 1;
        const sumOfPathVarsInLayer: number = (layer.length-1)*(layer.length)/2;
        const conName: string = 'ConSumOfPathVars(L:' + layer[0].layerIndex.toString() + ') SumOfXij='  + sumOfPathVarsInLayer.toString();
        lpModel.addConstraint(conName, sumOfPathVarsInLayer, sumOfPathVarsInLayer, constraint);*/
      }
      pathVars = pathVars.concat(pathVarsInLayer);
      /*
      // add Nij == 1  i is neighbour of j
      let pairs: Vertex[][] = [];
      const siblingsWithRespectToUpLayer: Vertex[][] = _.uniq([].concat(...layer.map(v=>v.inEdges.map(e=>e.source)))).map(v=>v.outEdges.map(e=>e.target));
      const siblingsWithRespectToDownLayer: Vertex[][] = _.uniq([].concat(...layer.map(v=>v.outEdges.map(e=>e.target)))).map(v=>v.inEdges.map(e=>e.source));
      const siblingsArray: Vertex[][] = [].concat(siblingsWithRespectToUpLayer,siblingsWithRespectToDownLayer).filter(l=>l.length>1);
      
      for(const siblings of siblingsArray) {
        siblings.sort((a,b)=>a.indexInLayer<b.indexInLayer?-1:1);
        for(let iS2: number = siblings.length-1; iS2>0; iS2--) {
          for(let iS1: number = 0; iS1<iS2; iS1++) {
            pairs.push([siblings[iS1],siblings[iS2]]);
          }
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
            lpModel.addConstraint(conName1, null, 2, {
              [varNik]: 1, 
              [varXjk]: 1, 
              [varXij]: 1
            });
            // add nki=nik <= Xij  + Xjk
            const conName2: string = 'Con:' + varNik + '<=' + varXij + '+' + varXjk;
            lpModel.addConstraint(conName2, null, 0, {
              [varNik]: -1, 
              [varXjk]: -1, 
              [varXij]: -1
            });
          }
        }
      }
      //allPairs = allPairs.concat(pairs); 
      */
      // add Crossings
      const targets: Vertex[] = layer.filter(v=>v.inEdges.length>0);
      for(let iT2: number = targets.length-1; iT2>0; iT2--) {
        for(let iT1: number = 0; iT1<iT2; iT1++) {
          const targetI: Vertex = targets[iT1];
          const targetK: Vertex = targets[iT2];
          const sourcesFromTargetI: Vertex[] = targetI.inEdges.map(e=>e.source);
          const sourcesFromTargetK: Vertex[] = targetK.inEdges.map(e=>e.source);
          
          
          const varXik = buildXVarName(targetI, targetK); //  'x' + targetI.index.toString() + '_' + targetK.index.toString();
          
          for(const sourceJ of sourcesFromTargetI) {
            for(const sourceL of sourcesFromTargetK) {
              if(sourceJ!=sourceL) {
                const varCijkl = buildCVarName(targetI, sourceJ,targetK, sourceL);   // 'c' + targetI.index.toString() + '_' + sourceJ.index.toString() + '_' + targetK.index.toString() + '_' + sourceL.index.toString();        
                crossingVars.push(varCijkl);
                if(sourceJ.indexInLayer<sourceL.indexInLayer) {
                  const varXjl = buildXVarName(sourceJ, sourceL); //   'x' + sourceJ.index.toString() + '_' + sourceL.index.toString();
                  const conCijkl1: string = 'c13.21(L:' + targetI.layerIndex.toString()+'):' + varXjl + '-' + varXik + '<=' + varCijkl;
                  lpModel.addConstraint(conCijkl1, null, 0, {
                    [varXjl]: 1, 
                    [varXik]: -1, 
                    [varCijkl]: -1
                  }); 
                  const conCijkl2: string = 'c13.21(L:' + targetI.layerIndex.toString()+'):' + '-' + varCijkl + '<=' + varXjl + '-' + varXik ;
                  lpModel.addConstraint(conCijkl2, 0, null, {
                    [varXjl]: 1, 
                    [varXik]: -1, 
                    [varCijkl]: 1
                  }); 
                } else {
                  const varXlj = buildXVarName(sourceL, sourceJ); //  'x' + sourceL.index.toString() + '_' + sourceJ.index.toString();
                  const conCijkl1: string = 'c13.22(L:' + targetI.layerIndex.toString()+'):' + varXlj + '+' + varXik + '<=1+' + varCijkl;
                  lpModel.addConstraint(conCijkl1, null, 1, {
                    [varXlj]: 1, 
                    [varXik]: 1, 
                    [varCijkl]: -1
                  });
                  const conCijkl2: string = 'c13.22(L:' + targetI.layerIndex.toString()+'):' + '1-' + varCijkl + '<=' + varXlj + '+' + varXik ;
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
    for(const varC of crossingVars) objective[varC] = 1;
    for(const varN of neighbourVars) objective[varN] = -1/neighbourVars.length/2;
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