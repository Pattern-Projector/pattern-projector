export default function manifest() {
  return {
    name: "Pattern Projector",
    short_name: "PatternProjector",
    start_url: "/calibrate",
    id: "calibrate",
    icons: [
      {
        src: "144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    display: "fullscreen",
    display_override: ["fullscreen", "minimal-ui", "standalone"],
    orientation: "landscape",
    lang: "en-US",
    dir: "ltr",
    scope: "https://patternprojector.com",
    scope_extensions: [{ origin: "*.patternprojector.com" }],
    prefer_related_applications: false,
    launch_handler: {
      client_mode: "navigate-existing",
    },
    handle_links: "preferred",
    background_color: "#fff",
    description:
      "Calibrates projectors for projecting sewing patterns with accurate scaling and without perspective distortion",
    categories: ["productivity", "design", "sewing"],
    theme_color: "#fff",
    file_handlers: [
      {
        action: "/calibrate",
        accept: {
          "application/pdf": [".pdf"],
          "image/svg+xml": [".svg"],
        },
      },
    ],
    share_target: {
      action: "/shared-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        files: [
          {
            name: "shared_file",
            accept: ["application/pdf", "image/svg+xml"],
          },
        ],
      },
    },
  };
}
