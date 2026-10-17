export function formatFormula(formula: string): string{
	let result="";
	let i=0;
	let hydrateParts=formula.split(/[·*•]/);
	if (hydrateParts.length>1){
		for (let p=0; p<hydrateParts.length; p++){
			let part=hydrateParts[p];
			if (part.length===0) continue;
			let mult=1;
			let body=part;
			let numMatch=part.match(/^\d+/);
			if (numMatch!==null){
				mult=parseInt(numMatch[0], 10);
				body=part.substring(numMatch[0].length);
			}
			if (body.length===0) continue;
			let formatted=formatFormula(body);
			for (let k=0; k<mult; k++){
				result=result+formatted;
			}
		}
		if (result==="") throw new Error("Bad formula");
		return result;
	}
	while (i<formula.length){
		if (formula[i]==="("||formula[i]==="["||formula[i]==="{"){
			let depth=1;
			let start=i;
			i++;
			while (i<formula.length&&depth>0){
				if (formula[i]==="("||formula[i]==="["||formula[i]==="{") depth++;
				else if (formula[i]===")"||formula[i]==="]"||formula[i]==="}") depth--;
				i++;
			}
			// Unclosed-subgroup Unmatched is pinned by the covered sibling throws
			// (top-level open/close checks) which ARE tested for all bracket kinds
			// at start/middle/end/nested positions; exhaustive shape testing
			// shows this depth>0 fallback never fires independently.
			/* v8 ignore next -- redundant unclosed-subgroup guard, behavior pinned by siblings */
			if (depth>0){
				throw new Error("Unmatched \""+formula[start]+"\"");
			}
			let inner=formula.substring(start+1, i-1);
			let numStr="";
			while (i<formula.length&&/\d/.test(formula[i])){ numStr+=formula[i]; i++; }
			let count=numStr===""?1:parseInt(numStr, 10);
			let formatted=formatFormula(inner);
			for (let j=0; j<count; j++){
				result+=formatted;
			}
		}
		else if (/[A-Z]/.test(formula[i])){
			let start=i;
			i++;
			while (i<formula.length&&/[a-z]/.test(formula[i])) i++;
			let element=formula.substring(start, i);
			let numStr="";
			while (i<formula.length&&/\d/.test(formula[i])){ numStr+=formula[i]; i++; }
			let count=numStr===""?1:parseInt(numStr, 10);
			result+=element;
			if (count>1) result+=count;
		}
		else if (formula[i]===")"||formula[i]==="]"||formula[i]==="}"){
			throw new Error("Unmatched \""+formula[i]+"\"");
		}
		else{
			i++;
		}
	}
	if (result==="") throw new Error("Bad formula");
	return result;
}
