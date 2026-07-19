import {render, fireEvent} from "@solidjs/testing-library";
import {Router, Route} from "@solidjs/router";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach} from "vitest";
import {MobileBottomTabs} from "./MobileBottomTabs";
import {useNavSheet, reset as resetNavSheet} from "../stores/navSheet";
function Host(): JSX.Element {
    return <MobileBottomTabs />;
}
function renderHost() {
    return render(function () {
        return (
            <Router>
                <Route path="*" component={Host} />
            </Router>
        );
    });
}
describe("MobileBottomTabs", function (): void {
    beforeEach(function (): void {
        resetNavSheet();
    });
    it("renders 4 calculator tab links and 1 More button (5 tab items total)", function (): void {
        let result = renderHost();
        let links = result.getAllByRole("link");
        expect(links.length).toBe(4);
        let moreButton = result.getByRole("button", {name: "More calculators"});
        expect(moreButton).toBeTruthy();
    });
    it("renders Molar Mass tab with href /molar-mass", function (): void {
        let result = renderHost();
        let massLink = result.getByRole("link", {name: "Molar mass calculator"});
        expect(massLink.getAttribute("href")).toBe("/molar-mass");
    });
    it("renders Elements tab with href /element-lookup", function (): void {
        let result = renderHost();
        let elementsLink = result.getByRole("link", {name: "Element lookup"});
        expect(elementsLink.getAttribute("href")).toBe("/element-lookup");
    });
    it("renders Balancer tab with href /equation-balancer", function (): void {
        let result = renderHost();
        let balancerLink = result.getByRole("link", {name: "Equation balancer"});
        expect(balancerLink.getAttribute("href")).toBe("/equation-balancer");
    });
    it("renders Dilution tab with href /dilution", function (): void {
        let result = renderHost();
        let dilutionLink = result.getByRole("link", {name: "Dilution calculator"});
        expect(dilutionLink.getAttribute("href")).toBe("/dilution");
    });
    it("opens the nav sheet when More button is clicked", function (): void {
        let result = renderHost();
        let moreButton = result.getByRole("button", {name: "More calculators"});
        fireEvent.click(moreButton);
        let sheet = useNavSheet();
        expect(sheet.isOpen()).toBe(true);
    });
    it("renders all 5 tab labels", function (): void {
        let result = renderHost();
        expect(result.getByText("Elements")).toBeTruthy();
        expect(result.getByText("Molar Mass")).toBeTruthy();
        expect(result.getByText("Balancer")).toBeTruthy();
        expect(result.getByText("Dilution")).toBeTruthy();
        expect(result.getByText("More")).toBeTruthy();
    });
});
