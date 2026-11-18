// A soft colour wash behind the dashboard — the "light" the glass cards refract.
// Deliberately STATIC: anything moving behind frosted glass forces the browser to re-blur every frame.
const BLOBS = [
    { cls: "-top-32 -right-24 size-[40rem]", color: "oklch(0.8 0.15 215)", o: 0.8 },
    { cls: "top-[22rem] left-[6%] size-[36rem]", color: "oklch(0.76 0.14 248)", o: 0.7 },
    { cls: "top-[10rem] left-[38%] size-[30rem]", color: "oklch(0.84 0.12 190)", o: 0.6 },
    { cls: "top-[48rem] right-[8%] size-[34rem]", color: "oklch(0.8 0.12 230)", o: 0.6 },
];

export default function Aurora() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1400px] overflow-hidden">
            {BLOBS.map((b) => (
                <div
                    key={b.cls}
                    className={`absolute rounded-full ${b.cls}`}
                    style={{ background: `radial-gradient(circle, ${b.color}, transparent 66%)`, opacity: b.o }}
                />
            ))}
            {/* fade into the page background so the wash never ends in a hard edge */}
            <div className="absolute inset-x-0 bottom-0 h-72 bg-linear-to-b from-transparent to-background" />
        </div>
    );
}
