import { CustomProjectConfig } from "lost-pixel";

export const config: CustomProjectConfig = {
  pageShots: {
    pages: [
      { path: "/", name: "app" },
      { path: "/calibrate", name: "calibrate" },
    ],
    baseUrl: "http://172.17.0.1:3000",
  },
  generateOnly: true,
  failOnDifference: true,
};
