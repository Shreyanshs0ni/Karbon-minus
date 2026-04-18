import Image from "next/image";

const leaf =
  "pointer-events-none select-none object-contain opacity-90 dark:opacity-80";

export function LeafBorder() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <Image
        src="/top-right.png"
        alt=""
        width={420}
        height={420}
        className={`${leaf} absolute right-0 top-0 h-24 max-h-[28vh] w-auto max-w-[min(55vw,16rem)] object-right-top md:h-32 md:max-w-[18rem]`}
      />
      <Image
        src="/bottom-left.png"
        alt=""
        width={480}
        height={420}
        className={`${leaf} absolute bottom-0 left-0 h-28 max-h-[32vh] w-auto max-w-[min(60vw,18rem)] object-left-bottom md:h-40 md:max-w-[20rem]`}
      />
      <Image
        src="/bottom-right.png"
        alt=""
        width={480}
        height={420}
        className={`${leaf} absolute bottom-0 right-0 h-28 max-h-[32vh]  w-auto max-w-[min(60vw,18rem)] object-right-bottom md:h-40 md:max-w-[20rem] -scale-x-100`}
      />
    </div>
  );
}
