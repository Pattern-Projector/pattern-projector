import { defaultCache } from "@serwist/next/browser";
import type { PrecacheEntry } from "@serwist/precaching";
import { installSerwist } from "@serwist/sw";
import { NavigationRoute, registerRoute } from "@serwist/routing";
import { NetworkOnly } from "@serwist/strategies";

declare const self: ServiceWorkerGlobalScope & {
  // Change this attribute's name to your `injectionPoint`.
  // `injectionPoint` is an InjectManifest option.
  // See https://serwist.pages.dev/docs/build/inject-manifest/configuring
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

registerRoute(
  new NavigationRoute(
    async ({ url, request, event }) => {
      console.log(
        `My Service Worker: Handling navigation request for ${url.pathname}`,
      );
      if (request.method === "POST" && url.pathname === "/share-target") {
        try {
          const formData = await request.formData();
          const sharedFile = formData.get("shared_file");

          if (sharedFile instanceof File) {
            const fileBuffer = await sharedFile.arrayBuffer();
            const allClients = await self.clients.matchAll({
              includeUncontrolled: true,
              type: "window",
            });

            for (const client of allClients) {
              client.postMessage({
                type: "shared-file",
                name: sharedFile.name,
                size: sharedFile.size,
                fileType: sharedFile.type,
                data: fileBuffer,
              });
            }
            return Response.redirect("/calibrate", 303);
          } else {
            console.error(
              "Service Worker: No file received or file is not an instance of File.",
            );
            return new Response("No file received for shared-file.", {
              status: 400,
            });
          }
        } catch (error) {
          console.error("Service Worker: Error handling shared file:", error);
          return new Response("Error processing shared file.", { status: 500 });
        }
      }
      return new NetworkOnly().handle({ url, request, event });
    },
    {
      allowlist: [new RegExp("/share-target")],
    },
  ),
);

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});
