import { Cookie } from "puppeteer";
import toughCookie from "tough-cookie";
import { BlackboardController } from "../controller";
import { LoginCoordinator } from "./login-coordinator";

const { Cookie: ToughCookie } = toughCookie;

export class SetupCoordinator {
    cookies: Cookie[] = [];

    constructor(public controller: BlackboardController) {}

    private async step1() {
        await new LoginCoordinator(this.controller).run();
    }

    private async step2() {
        await this.controller.api.cookies.puppeteer.storeCookies(this.controller.page);
    }

    public async run(): Promise<void> {
        await this.step1();
        await this.step2();
    }
}