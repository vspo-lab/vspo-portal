const sizeClasses = {
  xs: { img: "h-5 w-5", text: "text-xs" },
  sm: { img: "h-8 w-8", text: "text-sm font-medium" },
  md: { img: "h-10 w-10", text: "text-sm font-bold" },
  lg: { img: "h-12 w-12", text: "text-lg font-bold" },
} as const;

type AvatarFallbackProps = {
  readonly src: string | null;
  readonly name: string;
  readonly size: keyof typeof sizeClasses;
};

export function AvatarFallback({ src, name, size }: AvatarFallbackProps) {
  const classes = sizeClasses[size];

  if (src) {
    return (
      <img src={src} alt={name} className={`${classes.img} rounded-full`} />
    );
  }

  return (
    <div
      className={`flex ${classes.img} items-center justify-center rounded-full bg-muted ${classes.text}`}
    >
      {name[0]}
    </div>
  );
}
