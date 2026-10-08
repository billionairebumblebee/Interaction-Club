/** Outline the artwork's alpha silhouette, not its rectangular image bounds. */
export default function BalloonOutlines() {
  return <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }}><defs>{[
    { id: "ic-balloon-cutout", radius: 5 },
    { id: "ic-wordmark-cutout", radius: 1.5 },
    { id: "ic-lettering-cutout", radius: 3 },
    { id: "ic-lettering-cutout-small", radius: 2 },
  ].map(({ id, radius }) => <filter key={id} id={id} x="-15%" y="-25%" width="130%" height="150%" colorInterpolationFilters="sRGB">
    {/* Continuous alpha removes faint fringe without turning the edge into a pixel staircase. */}
    <feComponentTransfer in="SourceAlpha" result="clean-alpha"><feFuncA type="linear" slope="2" intercept="-0.5"/></feComponentTransfer>
    {/* A Gaussian contour grows round edges; morphology dilation uses a square kernel. */}
    <feGaussianBlur in="clean-alpha" stdDeviation={radius * 0.7} result="rounded-alpha"/>
    <feComponentTransfer in="rounded-alpha" result="expanded"><feFuncA type="linear" slope="16" intercept="-1"/></feComponentTransfer>
    <feFlood floodColor="#ffffff" result="white"/>
    <feComposite in="white" in2="expanded" operator="in" result="outline"/>
    <feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>)}</defs></svg>;
}
