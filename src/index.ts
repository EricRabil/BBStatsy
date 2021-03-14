import dotenv from "dotenv";
import cron from "node-cron";
import Statsy from "@erics-world/statsy";
import { BlackboardController } from "./blackboard-controller/controller";

Object.assign(process.env, dotenv.config().parsed || {});

const statsy = new Statsy({
    host: process.env.STATSY_HOST || "https://statsy.ericrabil.com",
    gatewayHost: process.env.STATSY_GW_HOST || "wss://statsy.ericrabil.com",
    authorization: process.env.STATSY_TOKEN
})

BlackboardController.make().then(async controller => {
    await controller.boot();

    console.log("boot");

    async function refresh() {
        const courses = await controller.api.courses.all(false);
        const grades = await controller.api.grades.all(true, false);

        await Promise.all([
            statsy.set("eric", "grades", grades),
            statsy.set("eric", "courses", courses.reduce((acc, course) => Object.assign(acc, { [course.id]: course }), {}))
        ]);
    }

    await refresh();

    cron.schedule('*/15 * * * *', refresh);
});
