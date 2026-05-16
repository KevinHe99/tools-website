import type { Route } from "./+types/route-uuid";
import { PageUUIDGenerator } from "~/pages/tools/uuid/PageUUIDGenerator";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UUID Generator" },
    { name: "description", content: "Generate version 4 UUIDs using the built-in crypto API" },
  ];
}

export default function RouteUUID() {
  return <PageUUIDGenerator />;
}
