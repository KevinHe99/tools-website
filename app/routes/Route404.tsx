import type { Route } from "./+types/route-404";
import { Page404 } from "~/pages/404/Page404";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Error 404 - Page not found" },
    { name: "description", content: "Page Not Found" },
  ];
}

export default function Route404() {
  return <Page404 />;
}
