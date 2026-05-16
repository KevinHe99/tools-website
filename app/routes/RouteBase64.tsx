import type { Route } from "./+types/route-base64";
import {PageBase64Convertor} from "~/pages/tools/base64/PageBase64Convertor";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Base64 Tools" },
        { name: "description", content: "Base64 Tools" },
    ];
}

export default function RouteBase64() {
    return <PageBase64Convertor />;
}