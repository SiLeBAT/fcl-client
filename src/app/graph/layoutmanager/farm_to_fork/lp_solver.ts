import * as Solver from 'javascript-lp-solver';

export function lpSolve(model: LPModel): LPResult {
  //runTestModel();
  //runTestModel2();
  const solver = Solver;
  
  let result: any = solver.Solve(model.getModel());
  
  return new LPResult(result, model);
}

/*function runTestModel() {
  let model = [
    "max: 1200 table 1600 dresser",
    "30 table 20 dresser <= 300",
    "5 table 10 dresser <= 110",
    "30 table 50 dresser <= 400",
    "table <= 5",
    "table >= 2",
    "int table",
    "int dresser",
  ];
  const solver = Solver;
  // Reformat to JSON model              
  model = solver.ReformatLP(model);
  const result = solver.Solve(model);
}*/

/*function runTestModel2() {
  let model = {
    "optimize": "profit",
    "opType": "max",
    "constraints": {
        "wood": {"max": 300, "min": 5},
        "labor": {"max": 110},
        "storage": {"max": 400}
    },
    "variables": {
        "table": {"wood": 30,"labor": 5,"profit": 1200,"table": 1, "storage": 30},
        "dresser": {"wood": 20,"labor": 10,"profit": 1600,"dresser": 1, "storage": 50}
    },
    "binaries": {"table": 1,"dresser": 1}
   };
   const solver = Solver;
  // Reformat to JSON model              
    const model_s: string = solver.ReformatLP(model);
    //const result = solver.Solve(model);
    const model_b = solver.ReformatLP(model_s.split(';'));
}*/

export class LPModel {
  private model: any = {'variables': {}, 'constraints': {}, 'optimize': 'objective'};
  private constraintCount: number = 0;
  private constraintsLabelToIdMap: Map<string,string> = new Map();
  private constraintIdToLabelMap: Map<string, string> = new Map();
  private constraintIds: string[] = [];
  
  constructor() {}
  
  addConstraint(constraintLabel: string, min: number, max: number, constraint: Object) {
    const constraintId: string = 'C' + (++this.constraintCount).toString();
    this.constraintsLabelToIdMap.set(constraintLabel, constraintId);
    this.constraintIdToLabelMap.set(constraintId, constraintLabel);
    this.constraintIds.push(constraintId);
    this.model['constraints'][constraintId] = {}; //{'max': b};
    if(min!=null) this.model['constraints'][constraintId]['min'] = min;
    if(max!=null) this.model['constraints'][constraintId]['max'] = max;
    for (const varName of Object.getOwnPropertyNames(constraint)) {
      if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {}; 
      this.model['variables'][varName][constraintId] = constraint[varName];
    }
  }
  setObjective(opType: String, objective: Object) {
    this.model['opType'] = opType;
    for (const varName of Object.getOwnPropertyNames(objective)) {
      if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {}; 
      this.model['variables'][varName]['objective'] = objective[varName];
    }
  }
  setBinaryVariables(vars: string[]) {
    const binaries = {};
    for(const varName of vars) binaries[varName] = 1;
    this.model['binaries'] = binaries; 
    for(const varName of vars) {
      if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {[varName]: 1}
      else this.model['variables'][varName][varName] = 1;
    }
  }
  setObjectiveCoefficient(varName: string, coeff: number) {
    if(!this.model['variables'].hasOwnProperty(varName)) this.model['variables'][varName] = {[varName]: 1};
    this.model['variables'][varName]['objective'] = coeff;
  }
  
  
  getModel(): any {
    return this.model;
  }
  
  getVariableNames(): String[] {
    return  Object.getOwnPropertyNames(this.model['variables']);
  }
  
  printConstraints(lpResult: LPResult) {
    const varNames: string[] = Object.getOwnPropertyNames(this.model['variables']);
    for(const conName of Object.getOwnPropertyNames(this.model['constraints'])) {
      let conTerm: string = ''; 
      let conValue: number = (lpResult?0.0:null);
      for(const varName of varNames) {
        if(this.model['variables'][varName].hasOwnProperty(conName)) {
          const conVarCoeff: number = this.model['variables'][varName][conName];
          
          if(Math.abs(conVarCoeff)!=1) {
            if(conVarCoeff<0) conTerm+= ' ' + conVarCoeff.toString() + ' ' + varName;
            else conTerm+= ' +' + conVarCoeff.toString() + ' ' + varName; 
          } else conTerm+= ' ' + (conVarCoeff<0?'-':'+') + ' ' + varName; 
          
          
          if(lpResult) {
            const varValue: number = lpResult.vars.get(varName);
            conTerm+= '['+ varValue.toString() + ']';
            conValue+= conVarCoeff * varValue;
          }
        }
      }
      const conLabel: string = this.constraintIdToLabelMap.get(conName) + ': ';
      const text: string = conLabel + ' ' + 
        (this.model['constraints'][conName]['min']!=null ? this.model['constraints'][conName]['min'].toString() + '<=' : '') + 
        conTerm + 
        (lpResult?' = ' + conValue.toString():'') +
        (this.model['constraints'][conName]['max']!=null ? '<=' + this.model['constraints'][conName]['max'].toString() : '');

      console.log(text);
    }
  }
  printObjective(lpResult: LPResult) {
    const objectiveName: string = this.model['optimize'];
    const objectiveType: string = this.model['opType'];
    let text: string = objectiveType + ': ';
    for(const varName of Object.getOwnPropertyNames(this.model['variables'])) {
      if(this.model['variables'][varName].hasOwnProperty(objectiveName)) {
        if(this.model['variables'][varName][objectiveName]<0) text+= ' ' + this.model['variables'][varName][objectiveName] + ' ' + varName;
        else text+= ' +' + this.model['variables'][varName][objectiveName] + ' ' + varName;
        if(lpResult) text+= '[' + lpResult.vars.get(varName).toString() + ']';
      }
    }
    if(lpResult) text+= ' = ' + lpResult.objective.toString();
    console.log(text);
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
      if(isNaN(result[varName.toString()])) {
        const tmp = result[varName.toString()];
        //console.log('LP result yielded NaN for var ' + varName + '. Reset to 0.');
        this.vars.set(varName, 0);
      }
    }
  }
}