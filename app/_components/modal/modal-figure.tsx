import Image from "next/image";

export default function ModalFigure({
  src,
  caption,
}: {
  src: string;
  caption: string;
}) {
  return (
    <figure>
      <Image
        src={src}
        width={480}
        height={480}
        alt=""
        className="flex mx-auto"
      />
      <figcaption className="mt-2 mx-4 text-sm text-center text-gray-500 dark:text-gray-400">
        {caption}
      </figcaption>
    </figure>
  );
}
