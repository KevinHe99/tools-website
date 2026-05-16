import type { Route } from "./+types/route-home";
import { PageWelcome } from "~/pages/welcome/PageWelcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function RouteHome() {
  return <PageWelcome />;
}
