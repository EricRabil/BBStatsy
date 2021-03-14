import * as otplib from "otplib";
import { BlackboardController } from "../controller";

export class LoginCoordinator {
    constructor(public controller: BlackboardController) {}

    public async run(): Promise<void> {
        const page = this.controller.page;

        await page.goto("https://learn.dcollege.net");

        await page.evaluate(function() {
            (document.querySelector("a#caslink1") as HTMLElement).click();
        });

        await this.waitLoad();

        console.log(1);

        const token = otplib.authenticator.generate(process.env.DREXEL_MFA!);

        await page.evaluate(function(username: string, password: string) {
            (document.querySelector("#username") as HTMLInputElement).value = username;
            (document.querySelector("#password") as HTMLInputElement).value = password;
            (document.querySelector(".btn.btn-success") as HTMLButtonElement).click();
        }, process.env.DREXEL_USERNAME!, process.env.DREXEL_PASSWORD!);

        await this.waitLoad();

        console.log(2);

        await new Promise(resolve => setTimeout(resolve, 2500));

        console.log(3);

        await page.evaluate(function(token: string) {
            const mfaToken = document.querySelector("#j_mfaToken") as HTMLInputElement | null;

            if (mfaToken) {
                mfaToken.value = token;
            }
            
            (document.querySelector(".btn.btn-success") as HTMLButtonElement).click();
        }, token);

        await this.waitLoad();

        if (page.url() !== "https://learn.dcollege.net/ultra/") {
            throw new Error(`Reached ${page.url()} instead of https://learn.dcollege.net/ultra/`);
        }
    }

    private async waitLoad() {
        return Promise.all([
            new Promise(resolve => this.controller.page.once("framenavigated", resolve)),
            new Promise(resolve => this.controller.page.once("load", resolve))
        ]);
    }
}