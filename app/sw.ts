import { defaultCache } from "@serwist/next/browser";
import type { PrecacheEntry } from "@serwist/precaching";
import { installSerwist } from "@serwist/sw";
import { registerRoute } from "@serwist/routing";
import { NetworkOnly } from "@serwist/strategies";

declare const self: ServiceWorkerGlobalScope & {
  // Change this attribute's name to your `injectionPoint`.
  // `injectionPoint` is an InjectManifest option.
  // See https://serwist.pages.dev/docs/build/inject-manifest/configuring
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

registerRoute(
  /shared-target/,
  async ({ url, request, event }) => {
    console.log(
      `My Service Worker: Handling navigation request for ${url.pathname}`,
    );
    if (request.method === "POST" && url.pathname === "/shared-target") {
      try {
        const formData = await request.formData();
        const sharedFile = formData.get("shared_file");

        if (sharedFile instanceof File) {
          const fileBuffer = await sharedFile.arrayBuffer();
          // use the cache fo all requests
          const cache = await caches.open("shared-file-cache");
          console.log(
            `Service Worker: Caching shared file ${sharedFile.name} with size ${sharedFile.size} bytes`,
          );
          // Store the file in the cache with a request to the shared-file endpoint
          // This allows us to retrieve it later using the same URL
          // The request URL is `/shared-file/` and the response is the file content
          // with appropriate headers
          await cache.put(
            new Request(`/shared-file/`),
            new Response(fileBuffer, {
              headers: {
                "Content-Type": sharedFile.type,
                "Content-Length": sharedFile.size.toString(),
                "Content-Disposition": `attachment; filename="${sharedFile.name}"`,
              },
            }),
          );
          const openFileUrl = new URL("/calibrate", self.location.origin);
          openFileUrl.searchParams.set("name", sharedFile.name);
          openFileUrl.searchParams.set("open", "/shared-file/");
          return Response.redirect(openFileUrl, 303);
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
  "POST",
);

registerRoute(
  ({ url }) => url.pathname.startsWith("/shared-file/"),
  async ({ url, request }) => {
    console.log(
      `My Service Worker: Handling request for shared file ${url.pathname}`,
    );
    const cache = await caches.open("shared-file-cache");
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log(
        `My Service Worker: Found cached response for ${url.pathname}`,
      );
      return cachedResponse;
    } else {
      console.log(`My Service Worker: No cached response for ${url.pathname}`);
      return new Response("Shared file not found in cache.", { status: 404 });
    }
  },
  "GET",
);

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});
