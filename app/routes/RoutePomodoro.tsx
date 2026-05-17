import type { Route } from "./+types/RoutePomodoro";
import { PagePomodoro } from "~/pages/tools/pomodoro/PagePomodoro";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Pomodoro Timer" },
        {
            name: "description",
            content: "Focus timer with custom intervals and YouTube playlist integration.",
        },
    ];
}

export default function RoutePomodoro() {
    return <PagePomodoro />;
}
