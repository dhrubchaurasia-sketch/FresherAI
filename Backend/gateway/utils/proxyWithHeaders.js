import proxy from "express-http-proxy";

export const proxyWithHeaders = (serviceUrl) => {
    return proxy(serviceUrl, {
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {

            console.log("GATEWAY USER:", srcReq.user);

            const userId =
                srcReq.user?.userId ||
                srcReq.user?._id ||
                srcReq.user?.id;

            if (userId) {
                proxyReqOpts.headers["x-user-id"] = String(userId);
                console.log("FORWARDED USER ID:", userId);
            } else {
                console.log("USER ID NOT FOUND");
            }

            return proxyReqOpts;
        }
    });
};