import {render, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import UnitConverter from "./unit-converter";
describe("UnitConverter", function (): void {
    it("renders the card with category, value, from-unit, to-unit, and convert button", function (): void {
        let result = render(function () { return <UnitConverter />; });
        let category = result.getByLabelText("Unit category") as HTMLSelectElement;
        expect(category).toBeTruthy();
        let value = result.getByLabelText("Value to convert") as HTMLInputElement;
        expect(value).toBeTruthy();
        let fromUnit = result.getByLabelText("From unit") as HTMLSelectElement;
        expect(fromUnit).toBeTruthy();
        let toUnit = result.getByLabelText("To unit") as HTMLSelectElement;
        expect(toUnit).toBeTruthy();
        let button = result.getByText("Convert");
        expect(button).toBeTruthy();
        let clearButton = result.getByText("Clear");
        expect(clearButton).toBeTruthy();
    });
    it("category dropdown contains all categories returned by UnitConverter.getCategories", function (): void {
        let result = render(function () { return <UnitConverter />; });
        let category = result.getByLabelText("Unit category") as HTMLSelectElement;
        let optionValues: string[] = [];
        for (let i = 0; i < category.options.length; i++) {
            optionValues.push(category.options[i].value);
        }
        expect(optionValues).toContain("length");
        expect(optionValues).toContain("mass");
        expect(optionValues).toContain("volume");
        expect(optionValues).toContain("pressure");
        expect(optionValues).toContain("energy");
        expect(optionValues).toContain("temperature");
        expect(optionValues).toContain("concentration");
        expect(optionValues).toContain("time");
    });
    it("defaults to length category with pm as from-unit and angstrom as to-unit", function (): void {
        let result = render(function () { return <UnitConverter />; });
        let category = result.getByLabelText("Unit category") as HTMLSelectElement;
        expect(category.value).toBe("length");
        let fromUnit = result.getByLabelText("From unit") as HTMLSelectElement;
        expect(fromUnit.value).toBe("pm");
        let toUnit = result.getByLabelText("To unit") as HTMLSelectElement;
        expect(toUnit.value).toBe("\u00C5");
    });
    it("switching category to mass repopulates from-unit and to-unit dropdowns with mass units", function (): void {
        let result = render(function () { return <UnitConverter />; });
        let category = result.getByLabelText("Unit category") as HTMLSelectElement;
        category.value = "mass";
        fireEvent.change(category);
        let fromUnit = result.getByLabelText("From unit") as HTMLSelectElement;
        expect(fromUnit.value).toBe("amu");
        let fromValues: string[] = [];
        for (let i = 0; i < fromUnit.options.length; i++) {
            fromValues.push(fromUnit.options[i].value);
        }
        expect(fromValues).toContain("kg");
        expect(fromValues).toContain("g");
        expect(fromValues).toContain("mg");
        expect(fromValues).not.toContain("m");
        let toUnit = result.getByLabelText("To unit") as HTMLSelectElement;
        let toValues: string[] = [];
        for (let i = 0; i < toUnit.options.length; i++) {
            toValues.push(toUnit.options[i].value);
        }
        expect(toValues).toContain("all");
        expect(toValues).toContain("kg");
        expect(toValues).toContain("g");
    });
    it("converts 1 m to 100 cm", async function (): Promise<void> {
        let result = render(function () { return <UnitConverter />; });
        let valueInput = result.getByLabelText("Value to convert") as HTMLInputElement;
        valueInput.value = "1";
        fireEvent.input(valueInput);
        let fromUnit = result.getByLabelText("From unit") as HTMLSelectElement;
        fromUnit.value = "m";
        fireEvent.change(fromUnit);
        let toUnit = result.getByLabelText("To unit") as HTMLSelectElement;
        toUnit.value = "cm";
        fireEvent.change(toUnit);
        fireEvent.click(result.getByText("Convert"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/1 m = 100/);
        });
        expect(result.container.textContent).toMatch(/cm/);
        expect(result.container.textContent).toMatch(/centimeter/);
    });
    it("converts 1 kg to 1000 g", async function (): Promise<void> {
        let result = render(function () { return <UnitConverter />; });
        let category = result.getByLabelText("Unit category") as HTMLSelectElement;
        category.value = "mass";
        fireEvent.change(category);
        let valueInput = result.getByLabelText("Value to convert") as HTMLInputElement;
        valueInput.value = "1";
        fireEvent.input(valueInput);
        let fromUnit = result.getByLabelText("From unit") as HTMLSelectElement;
        fromUnit.value = "kg";
        fireEvent.change(fromUnit);
        let toUnit = result.getByLabelText("To unit") as HTMLSelectElement;
        toUnit.value = "g";
        fireEvent.change(toUnit);
        fireEvent.click(result.getByText("Convert"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/1 kg = 1000/);
        });
        expect(result.container.textContent).toMatch(/gram/);
    });
    it("converts 0 celsius to 32 fahrenheit", async function (): Promise<void> {
        let result = render(function () { return <UnitConverter />; });
        let category = result.getByLabelText("Unit category") as HTMLSelectElement;
        category.value = "temperature";
        fireEvent.change(category);
        let valueInput = result.getByLabelText("Value to convert") as HTMLInputElement;
        valueInput.value = "0";
        fireEvent.input(valueInput);
        let fromUnit = result.getByLabelText("From unit") as HTMLSelectElement;
        fromUnit.value = "\u00B0C";
        fireEvent.change(fromUnit);
        let toUnit = result.getByLabelText("To unit") as HTMLSelectElement;
        toUnit.value = "\u00B0F";
        fireEvent.change(toUnit);
        fireEvent.click(result.getByText("Convert"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/0 \u00B0C = 32/);
        });
        expect(result.container.textContent).toMatch(/\u00B0F/);
    });
    it("converts 100 celsius to 212 fahrenheit", async function (): Promise<void> {
        let result = render(function () { return <UnitConverter />; });
        let category = result.getByLabelText("Unit category") as HTMLSelectElement;
        category.value = "temperature";
        fireEvent.change(category);
        let valueInput = result.getByLabelText("Value to convert") as HTMLInputElement;
        valueInput.value = "100";
        fireEvent.input(valueInput);
        let fromUnit = result.getByLabelText("From unit") as HTMLSelectElement;
        fromUnit.value = "\u00B0C";
        fireEvent.change(fromUnit);
        let toUnit = result.getByLabelText("To unit") as HTMLSelectElement;
        toUnit.value = "\u00B0F";
        fireEvent.change(toUnit);
        fireEvent.click(result.getByText("Convert"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/100 \u00B0C = 212/);
        });
    });
    it("shows an error when the value is empty", async function (): Promise<void> {
        let result = render(function () { return <UnitConverter />; });
        fireEvent.click(result.getByText("Convert"));
        let errorText = await result.findByText(/Please enter a numeric value/);
        expect(errorText).toBeTruthy();
    });
    it("shows an error for non-numeric input", async function (): Promise<void> {
        let result = render(function () { return <UnitConverter />; });
        let valueInput = result.getByLabelText("Value to convert") as HTMLInputElement;
        Object.defineProperty(valueInput, "value", {get: function (): string { return "abc"; }, set: function (): void { return; }, configurable: true});
        fireEvent.input(valueInput);
        fireEvent.click(result.getByText("Convert"));
        let errorText = await result.findByText(/Please enter a valid numeric value/);
        expect(errorText).toBeTruthy();
    });
    it("renders a conversion table when target unit is all", async function (): Promise<void> {
        let result = render(function () { return <UnitConverter />; });
        let valueInput = result.getByLabelText("Value to convert") as HTMLInputElement;
        valueInput.value = "1";
        fireEvent.input(valueInput);
        let toUnit = result.getByLabelText("To unit") as HTMLSelectElement;
        toUnit.value = "all";
        fireEvent.change(toUnit);
        fireEvent.click(result.getByText("Convert"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Converting 1 pm to all length units/);
        });
        let table = result.container.querySelector("table");
        expect(table).toBeTruthy();
        let rows = result.container.querySelectorAll("tbody tr");
        expect(rows.length).toBeGreaterThan(0);
        expect(result.container.textContent).toMatch(/centimeter/);
    });
    it("clears input and result when the Clear button is clicked", async function (): Promise<void> {
        let result = render(function () { return <UnitConverter />; });
        let valueInput = result.getByLabelText("Value to convert") as HTMLInputElement;
        valueInput.value = "1";
        fireEvent.input(valueInput);
        let fromUnit = result.getByLabelText("From unit") as HTMLSelectElement;
        fromUnit.value = "m";
        fireEvent.change(fromUnit);
        let toUnit = result.getByLabelText("To unit") as HTMLSelectElement;
        toUnit.value = "cm";
        fireEvent.change(toUnit);
        fireEvent.click(result.getByText("Convert"));
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/1 m = 100/);
        });
        fireEvent.click(result.getByText("Clear"));
        expect(valueInput.value).toBe("");
        expect(result.container.textContent).not.toMatch(/1 m = 100/);
    });
    it("triggers conversion on Enter key", async function (): Promise<void> {
        let result = render(function () { return <UnitConverter />; });
        let valueInput = result.getByLabelText("Value to convert") as HTMLInputElement;
        valueInput.value = "1";
        fireEvent.input(valueInput);
        let fromUnit = result.getByLabelText("From unit") as HTMLSelectElement;
        fromUnit.value = "m";
        fireEvent.change(fromUnit);
        let toUnit = result.getByLabelText("To unit") as HTMLSelectElement;
        toUnit.value = "cm";
        fireEvent.change(toUnit);
        fireEvent.keyDown(valueInput, {key: "Enter"});
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/1 m = 100/);
        });
    });
});
