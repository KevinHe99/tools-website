import type { Route } from "./+types/route-hanzi-pinyin";
import { PageHanziPinyin } from "~/pages/tools/hanzi-pinyin/PageHanziPinyin";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hanzi to Pinyin" },
    { name: "description", content: "Convert Chinese Hanzi characters to pinyin — toned, numeric, or plain" },
  ];
}

export default function RouteHanziPinyin() {
  return <PageHanziPinyin />;
}
