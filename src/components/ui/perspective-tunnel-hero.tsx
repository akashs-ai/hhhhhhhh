"use client";

import {
    motion,
    useTransform,
    useReducedMotion,
    useMotionValue,
    useSpring,
    MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck, ChevronDown } from "lucide-react";

const CAMPUS_IMAGES = [
    {
        src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop",
        title: "Lecture Theatre",
    },
    {
        src: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200&auto=format&fit=crop",
        title: "Central Atrium",
    },
    {
        src: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
        title: "Solver Engine",
    },
    {
        src: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop",
        title: "Robotics Lab",
    },
    {
        src: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop",
        title: "Campus Quad",
    },
    {
        src: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1200&auto=format&fit=crop",
        title: "Innovation Hub",
    },
    {
        src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop",
        title: "Auditorium",
    },
    {
        src: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=1200&auto=format&fit=crop",
        title: "Academic Square",
    },
    {
        src: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop",
        title: "Dean's Chamber",
    },
];

interface TunnelCardData {
    item: { src: string; title: string };
    angleCos: number;
    angleSin: number;
    radiusFactorX: number;
    radiusFactorY: number;
    rotationZ: number;
    index: number;
}

const TUNNEL_CARDS: TunnelCardData[] = CAMPUS_IMAGES.map((item, i) => {
    const goldenAngle = i * 137.5 * (Math.PI / 180);
    const radiusFactorX = 0.28 + (i % 3) * 0.08;
    const radiusFactorY = 0.26 + (i % 2) * 0.09;

    return {
        item,
        angleCos: Math.cos(goldenAngle),
        angleSin: Math.sin(goldenAngle),
        radiusFactorX,
        radiusFactorY,
        rotationZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
        index: i,
    };
});

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

interface StageDimensions {
    width: number;
    height: number;
    isMobile: boolean;
}

function useCameraParallax(enabled: boolean) {
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const x = useSpring(rawX, SPRING_CONFIG);
    const y = useSpring(rawY, SPRING_CONFIG);

    useEffect(() => {
        if (!enabled) return;
        const onMove = (e: PointerEvent) => {
            rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
            rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
    }, [enabled, rawX, rawY]);

    return { x, y };
}

interface TunnelCardProps {
    card: TunnelCardData;
    progress: MotionValue<number>;
    pointer: { x: MotionValue<number>; y: MotionValue<number> };
    total: number;
    stage: StageDimensions;
}

function TunnelCard({ card, progress, pointer, total, stage }: TunnelCardProps) {
    const staggerSpan = 0.55;
    const start = (card.index / total) * (1 - staggerSpan);
    const end = start + staggerSpan;

    const localProgress = useTransform(progress, [start, end], [0, 1]);

    const farZ = stage.isMobile ? -1200 : -1700;
    const nearZ = stage.isMobile ? 350 : 500;
    const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);

    const opacity = useTransform(localProgress, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);

    const cardWidth = stage.isMobile
        ? Math.max(130, Math.min(180, stage.width * 0.38))
        : Math.max(180, Math.min(270, stage.width * 0.18));

    const baseX = card.angleCos * (stage.width * card.radiusFactorX);
    const baseY = card.angleSin * (stage.height * card.radiusFactorY);
    const panStrength = stage.isMobile ? 20 : 45;

    const transform = useTransform(
        [z, pointer.x, pointer.y],
        ([currZ, px, py]: number[]) => {
            const offsetX = baseX - px * panStrength;
            const offsetY = baseY - py * panStrength;
            return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) rotateZ(${card.rotationZ}deg)`;
        }
    );

    return (
        <motion.div
            style={{
                width: cardWidth,
                transform,
                opacity,
                zIndex: card.index + 1,
            }}
            className="pointer-events-auto absolute left-1/2 top-1/2 aspect-[4/5] will-change-transform select-none cursor-pointer"
        >
            <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900 shadow-2xl shadow-neutral-950/20 dark:shadow-black/90 ring-1 ring-black/10 dark:ring-white/15 transition-all duration-500 hover:ring-blue-500/70 dark:hover:ring-blue-400/70 hover:shadow-blue-500/25">
                <img
                    src={card.item.src}
                    alt={card.item.title}
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end p-4 sm:p-5">
                    <span className="text-xs sm:text-sm font-sans font-semibold tracking-wider uppercase text-white/95 drop-shadow-md">
                        {card.item.title}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export interface PerspectiveTunnelHeroProps {
    onGetStarted?: () => void;
    onSignIn?: () => void;
    className?: string;
}

export default function PerspectiveTunnelHero({
    onGetStarted,
    onSignIn,
    className = "",
}: PerspectiveTunnelHeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();

    const [stage, setStage] = useState<StageDimensions>({
        width: 1440,
        height: 900,
        isMobile: false,
    });

    useEffect(() => {
        const updateDimensions = () => {
            setStage({
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768,
            });
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Raw motion value controlled directly by mouse wheel / touch trackpad
    const rawProgress = useMotionValue(0);
    const smoothProgress = useSpring(rawProgress, {
        stiffness: 80,
        damping: 30,
        restDelta: 0.0001,
    });

    // Handle wheel scrolling locally inside the viewport container
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            // When reaching bounds, let normal document scroll take over
            const current = rawProgress.get();
            const delta = e.deltaY * 0.0008;
            const next = Math.min(1, Math.max(0, current + delta));

            // Only prevent default if within tunnel progress range
            if ((delta > 0 && current < 0.98) || (delta < 0 && current > 0.02)) {
                e.preventDefault();
                rawProgress.set(next);
            }
        };

        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [rawProgress]);

    const pointer = useCameraParallax(!reduce);

    const titleScale = useTransform(smoothProgress, [0, 0.5, 1], [0.85, 1, 1.25]);
    const titleOpacity = useTransform(smoothProgress, [0, 0.12, 0.85, 1], [0.35, 1, 1, 0.15]);
    const promptOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);

    return (
        <div
            ref={containerRef}
            className={`relative min-h-[92vh] sm:min-h-screen w-full overflow-hidden bg-slate-950 text-white select-none flex items-center justify-center ${className}`}
            style={{
                perspective: stage.isMobile ? "900px" : "1200px",
                transformStyle: "preserve-3d",
            }}
        >
            {/* Apple-style subtle radial glow & grid background */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-25 [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,#000_60%,transparent_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18)_0%,transparent_70%)]" />

            {/* Depth Ring Guides */}
            <div className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-blue-500/20" />
            <div className="pointer-events-none absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-slate-700/50" />

            {/* Central Anchor Typography (Apple-Style Precision) */}
            <motion.div
                style={{ scale: titleScale, opacity: titleOpacity }}
                className="pointer-events-none z-10 flex flex-col items-center text-center px-6 max-w-3xl"
            >
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-sans font-extrabold tracking-tight leading-[1.05] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    CHILIKA INSTITUTE OF TECHNOLOGY
                </h1>

                <p className="mt-4 max-w-xl text-sm sm:text-base font-normal text-slate-300 leading-relaxed">
                    Smarter scheduling. Zero timetable conflicts. Autonomous examination matrices and dynamic room booking across all academic departments.
                </p>

                {/* Apple-Style Action CTA Buttons */}
                <div className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3.5">
                    {onGetStarted && (
                        <button
                            type="button"
                            onClick={onGetStarted}
                            className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-sans font-semibold text-xs tracking-wide shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
                        >
                            <span>Enter Student & Faculty Portal</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {onSignIn && (
                        <button
                            type="button"
                            onClick={onSignIn}
                            className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-sans font-medium text-xs tracking-wide backdrop-blur-md active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Scroll Prompt */}
            <motion.div
                style={{ opacity: promptOpacity }}
                className="pointer-events-none absolute bottom-8 z-20 flex flex-col items-center gap-2 text-xs font-sans uppercase tracking-[0.25em] text-slate-400"
            >
                <span>Scroll to Explore 3D Campus Corridor</span>
                <ChevronDown className="w-4 h-4 text-blue-400 animate-bounce" />
            </motion.div>

            {/* 3D Z-Space Plane */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ transformStyle: "preserve-3d" }}
            >
                {TUNNEL_CARDS.map((card, i) => (
                    <TunnelCard
                        key={i}
                        card={card}
                        progress={smoothProgress}
                        pointer={pointer}
                        total={TUNNEL_CARDS.length}
                        stage={stage}
                    />
                ))}
            </div>
        </div>
    );
}
