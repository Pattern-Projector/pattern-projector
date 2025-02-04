export default function manifest() {
  return {
    name: "Pattern Projector",
    short_name: "PatternProjector",
    start_url: "/calibrate",
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
    background_color: "#fff",
    description:
      "Calibrates projectors for projecting sewing patterns with accurate scaling and without perspective distortion",
    theme_color: "#fff",
    file_handlers: [
      {
        action: "/calibrate",
        accept: {
          "application/pdf": [".pdf"],
        },
      },
    ],
  };
}
