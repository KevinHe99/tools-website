import {type RouteConfig, index, route, prefix} from "@react-router/dev/routes";

export default [index("routes/RouteHome.tsx"),
    ...prefix("base64-convertor", [
        index("routes/RouteBase64.tsx"),
    ]),

    ...prefix("uuid-generator", [
        index("routes/RouteUUID.tsx"),
    ]),

    ...prefix("svg-to-image", [
        index("routes/RouteSVGToImage.tsx"),
    ]),

    route("*", "routes/Route404.tsx")
] satisfies RouteConfig;
