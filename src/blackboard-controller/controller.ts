import BlackboardAPI from "@bbdash/bb-api";
import puppeteer from "puppeteer";
import ToughStore from "tough-cookie-file-store";
import { SetupCoordinator } from "./coordinators/setup-coordinator";

export let sharedController: BlackboardController = null!;

declare global {
    interface Window {
        __initialContext: {
            user: {
                id: string;
            }
        }
    }
}

export class BlackboardController {
    browser: puppeteer.Browser;
    page: puppeteer.Page;

    api: BlackboardAPI;

    userID: string;

    private constructor() {
        this.api = new BlackboardAPI({
            instanceURL: "https://learn.dcollege.net",
            store: new ToughStore.FileCookieStore("./cookies.json"),
            delegate: {
                xsrfInvalidated: () => this.setupCookies(),
                relogin: () => this.setupCookies(),
                userID: () => this.userID
            }
        })
    }

    public static async make(): Promise<BlackboardController> {
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const instance = new BlackboardController();
        instance.browser = browser;
        instance.page = await browser.newPage();
        await instance.page.setUserAgent(instance.api.userAgent);

        instance.page.on("requestfinished", async () => {
            await instance.api.cookies.puppeteer.storeCookies(instance.page);
        });

        await instance.api.cookies.puppeteer.loadCookies(instance.page)

        sharedController = instance;

        await instance.goto("https://learn.dcollege.net/ultra/");

        if (!instance.page.url().startsWith("https://learn.dcollege.net/ultra")) {
            await instance.setupCookies();
        }

        await instance.refreshUserID();

        return instance;
    }

    public async goto(url: string) {
        const didLoad = new Promise(resolve => this.page.once("load", resolve));
        await this.page.goto(url);
        await didLoad;
    }

    public async setupCookies(): Promise<void> {
        await new SetupCoordinator(this).run();
    }

    public async refreshUserID(): Promise<void> {
        this.userID = await this.page.evaluate(function() {
            return window.__initialContext.user.id;
        });
    }

    public async boot(): Promise<void> {
        await this.api.courses.courseIDsWithGrades();
    }
}