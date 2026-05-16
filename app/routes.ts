import {type RouteConfig, index, route, prefix} from "@react-router/dev/routes";

export default [index("routes/RouteHome.tsx"),
    ...prefix("base64-convertor", [
        index("routes/RouteBase64.tsx"),
    ]),
    ...prefix("qr-code", [
        index("routes/RouteQRCode.tsx"),
    ]),

    route("*", "routes/Route404.tsx")
] satisfies RouteConfig;
