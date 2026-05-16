import type { Route } from "./+types/base64";
import { PageBase64Convertor } from "../tools/base64/PageBase64Convertor";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Base64 Converter" },
    { name: "description", content: "Encode text to Base64 or decode Base64 back to plain text." },
  ];
}

export default function Base64() {
  return <PageBase64Convertor />;
}
