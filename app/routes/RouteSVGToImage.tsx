import type { Route } from "./+types/route-svg-to-image";
import { PageSVGToImage } from "~/pages/tools/svg-to-image/PageSVGToImage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SVG to Image" },
    { name: "description", content: "Convert SVG markup to PNG, JPEG, or WebP using the browser canvas API" },
  ];
}

export default function RouteSVGToImage() {
  return <PageSVGToImage />;
}
