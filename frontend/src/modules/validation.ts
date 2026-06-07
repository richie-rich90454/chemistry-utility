export function validateInputs(inputs: number[], ids: string[]): void{
	for (let i=0; i<inputs.length; i++){
		if (isNaN(inputs[i])){
			if (ids&&i<ids.length&&ids[i]){
				let input=document.getElementById(ids[i]) as HTMLInputElement;
				input.classList.add("error");
			}
			throw new Error("Please fill all required fields with valid numbers");
		}
	}
}
