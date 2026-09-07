import Image from "next/image";

const GRADIENTS = [
  "from-violet-400 to-indigo-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-fuchsia-400 to-purple-500",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SIZES = { sm: "h-6 w-6 text-[11px]", md: "h-8 w-8 text-[13px]", lg: "h-11 w-11 text-title-md" };

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: keyof typeof SIZES;
}) {
  const label = (name ?? "?").trim().slice(0, 1).toUpperCase() || "?";
  const grad = GRADIENTS[hash(name ?? "?") % GRADIENTS.length];
  const px = size === "lg" ? 44 : size === "sm" ? 24 : 32;

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br font-bold text-white ${grad} ${SIZES[size]}`}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={`${px}px`} className="object-cover" />
      ) : (
        label
      )}
    </span>
  );
}
