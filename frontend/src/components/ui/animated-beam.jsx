import React, { forwardRef, useRef, useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export const AnimatedBeam = forwardRef(
  (
    {
      className,
      containerRef,
      fromRef,
      toRef,
      curvature = 0,
      reverse = false,
      duration = Math.random() * 3 + 4,
      delay = 0,
      pathColor = "gray",
      pathWidth = 2,
      pathOpacity = 0.2,
      gradientStartColor = "#3b82f6",
      gradientStopColor = "#8b5cf6",
      startXOffset = 0,
      startYOffset = 0,
      endXOffset = 0,
      endYOffset = 0,
    },
    ref
  ) => {
    const id = useRef(Math.random().toString(36).substr(2, 9));
    const [pathD, setPathD] = useState("");
    const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const updatePath = () => {
          const containerRect = containerRef.current.getBoundingClientRect();
          const rectA = fromRef.current.getBoundingClientRect();
          const rectB = toRef.current.getBoundingClientRect();

          const svgWidth = containerRect.width;
          const svgHeight = containerRect.height;
          setSvgDimensions({ width: svgWidth, height: svgHeight });

          const startX =
            rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
          const startY =
            rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
          const endX =
            rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
          const endY =
            rectB.top - containerRect.top + rectB.height / 2 + endYOffset;

          const controlPointX = startX + (endX - startX) / 2;
          const controlPointY = startY + (endY - startY) / 2 - curvature;

          const d = `M ${startX},${startY} Q ${controlPointX},${controlPointY} ${endX},${endY}`;
          setPathD(d);
        };

        updatePath();

        const resizeObserver = new ResizeObserver(updatePath);
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
      }
    }, [
      containerRef,
      fromRef,
      toRef,
      curvature,
      startXOffset,
      startYOffset,
      endXOffset,
      endYOffset,
    ]);

    return (
      <svg
        ref={ref}
        fill="none"
        width={svgDimensions.width}
        height={svgDimensions.height}
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "pointer-events-none absolute left-0 top-0 transform-gpu stroke-2",
          className
        )}
        viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
      >
        <path
          d={pathD}
          stroke={pathColor}
          strokeWidth={pathWidth}
          strokeOpacity={pathOpacity}
          strokeLinecap="round"
        />
        <path
          d={pathD}
          strokeWidth={pathWidth}
          stroke={`url(#${id.current})`}
          strokeOpacity="1"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            className="transform-gpu"
            id={id.current}
            gradientUnits="userSpaceOnUse"
            gradientTransform={`rotate(${reverse ? 180 : 0}, ${
              svgDimensions.width / 2
            }, ${svgDimensions.height / 2})`}
          >
            <stop stopColor={gradientStartColor} stopOpacity="0" offset="0%" />
            <stop stopColor={gradientStartColor} offset="10%" />
            <stop stopColor={gradientStopColor} offset="50%" />
            <stop stopColor={gradientStopColor} stopOpacity="0" offset="100%" />
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              values={`${reverse ? 180 : 0} ${svgDimensions.width / 2} ${
                svgDimensions.height / 2
              }; ${reverse ? 540 : 360} ${svgDimensions.width / 2} ${
                svgDimensions.height / 2
              }`}
              dur={`${duration}s`}
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
      </svg>
    );
  }
);

AnimatedBeam.displayName = "AnimatedBeam";
