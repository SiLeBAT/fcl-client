import * as Solver from 'javascript-lp-solver';

export function lpSolve(model: LPModel): LPResult {
  //var solver = require("javascript-lp-solver");
  const tmp = Solver;
  /*for(let prop of Solver) {
    console.log(prop);
  }*/
  let result: any = tmp.Solve(model.getModel());
  //const result: any = solver.solve(model);
  //const result = null;
  return new LPResult(result, model);
}

export class LPModel {
  private variables: String[];
  private model: any = {'variables': {}, 'constraints': {}, 'optimize': 'objective'};
  private constraintCount: number = 0;

  constructor() {}
  
  addConstraint(constraintName: string, b: number, constraint: Object) {
    //const constId = (++this.constraintCount).toString();
    this.model['constraints'][constraintName] = {'max': b};
    for (const varName of Object.getOwnPropertyNames(constraint)) {
      if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {};
      this.model['variables'][varName][constraintName] = constraint[varName];
    }
  }
  setObjective(opType: String, objective: Object) {
    //this.model['optimize'] = 'objective';
    this.model['opType'] = opType;
    for (const varName of Object.getOwnPropertyNames(objective)) {
      if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {};
      this.model['variables'][varName]['objective'] = objective[varName];
    }
  }
  setObjectiveCoefficient(varName: string, coeff: number) {
    if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {};
    this.model['variables'][varName]['objective'] = coeff;
  }
  
  getModel(): any {
    return this.model;
  }

  getVariableNames(): String[] {
   return  Object.getOwnPropertyNames(this.model['variables']);
  }

  printConstraints(lpResult: LPResult) {
    //let text: string = '';
    const varNames: string[] = Object.getOwnPropertyNames(this.model['variables']);
    for(const conName of Object.getOwnPropertyNames(this.model['constraints'])) {
      let text: string = conName + ': ';
      let conValue: number = (lpResult?0.0:null);
      for(const varName of varNames) {
        if(this.model['variables'][varName].hasOwnProperty(conName)) {
          if(this.model['variables'][varName][conName]<0) text+= ' ' + this.model['variables'][varName][conName].toString() + ' ' + varName;
          else text+= ' +' + this.model['variables'][varName][conName].toString() + ' ' + varName; 
          if(lpResult) conValue+= this.model['variables'][varName][conName] * lpResult.vars.get(varName);
        }
      }
      text+= (lpResult?' = ' + conValue.toString():'') + ' <= ' + this.model['constraints'][conName]['max'].toString();
      console.log(text);
    }
  }
  printObjective() {
    const objectiveName: string = this.model['optimize'];
    const objectiveType: string = this.model['opType'];
    let text: string = objectiveType + ': ';
    for(const varName of Object.getOwnPropertyNames(this.model['variables'])) {
      if(this.model['variables'][varName].hasOwnProperty(objectiveName)) {
        if(this.model['variables'][varName][objectiveName]<0) text+= ' ' + this.model['variables'][varName][objectiveName] + ' ' + varName;
        else text+= ' +' + this.model['variables'][varName][objectiveName] + ' ' + varName;
      }
    }
  }


}

export class LPResult {
  feasible: boolean;
  bounded: boolean;
  objective: number;
  vars: Map<String, number>;
  constructor(result: any, lpModel: LPModel) {
    this.feasible = result['feasible'];
    this.bounded = result['bounded'];
    this.objective = result['result'];
    this.vars = new Map();
    for(const varName of lpModel.getVariableNames()) {
      this.vars.set(varName, result[varName.toString()]);
    }
  }
}