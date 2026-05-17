import type { Route } from "./+types/RouteColorPicker";
import { PageColorPicker } from "~/pages/tools/color-picker/PageColorPicker";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Color Picker" },
        {
            name: "description",
            content: "Pick colors and convert to HEX, RGB, HSL, HSV, CMYK, OKLCH. Generate harmonies, tints, shades, and check WCAG contrast.",
        },
    ];
}

export default function RouteColorPicker() {
    return <PageColorPicker />;
}
