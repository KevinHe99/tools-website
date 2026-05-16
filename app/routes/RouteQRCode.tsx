import type { Route } from "./+types/route-qr-code";
import { PageQRCode } from "~/pages/tools/qr-code/PageQRCode";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "QR Code Generator" },
        { name: "description", content: "Generate QR codes from any URL or text." },
    ];
}

export default function RouteQRCode() {
    return <PageQRCode />;
}
