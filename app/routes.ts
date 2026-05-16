import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("base64", "routes/base64.tsx"),
] satisfies RouteConfig;
