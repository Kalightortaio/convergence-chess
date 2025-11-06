import Svg, { Path, Defs, LinearGradient, Stop, G } from "react-native-svg";
import { useZoom } from './ZoomContext'

interface SVGLoaderProps {
    type: string,
    name: string,
    rightColor?: string,
    leftColor?: string,
    style?: object | object[],
    scale?: number,
    rotate?: number,
}

export default function SVGLoader({ type, name, rightColor = "grey", leftColor = "white", scale = 1, rotate = 0, style }: SVGLoaderProps) {
    const zoom = useZoom();

    function loadViewBox() { 
        switch (type) {
            case 'ui':
                switch (name) {
                    case 'board':
                        return "0 0 24 24";
                    case 'profile':
                        return "0 0 512 512";
                    case 'cap':
                        return "0 0 32 32";
                    default:
                        console.warn(`Unknown name '${name}' for type 'ui'`);
                }
            case 'symbol':
                switch (name) {
                    case 'checked':
                        return "0 0 48 48";
                    case 'pawn':
                    case 'scout':
                    case 'rook':
                    case 'knight':
                    case 'king':
                    case 'bishop':
                    case 'queen':
                    case 'dead_king':
                        return "0 0 50 50";
                    default:
                        console.warn(`Unknown name '${name}' for type 'symbol'`);
                }
            default:
                console.warn(`Unknown SVG type '${type}'`);
        }
    }

    function LoadSVG() {
        switch (type) {
            case 'ui':
                switch (name) {
                    case 'board':
                        return (
                            <G>
                                <Path fill={leftColor} d="M21 2H3a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm-1 6h-4v4h4v4h-4v4h-4v-4H8v4H4v-4h4v-4H4V8h4V4h4v4h4V4h4v4z" />
                                <Path fill={leftColor} d="M8 8h4v4H8zm4 4h4v4h-4z" />
                            </G>
                        );
                    case 'profile':
                        return (
                            <G>
                                <Path fill={leftColor} d="M332.64,64.58C313.18,43.57,286,32,256,32c-30.16,0-57.43,11.5-76.8,32.38-19.58,21.11-29.12,49.8-26.88,80.78C156.76,206.28,203.27,256,256,256s99.16-49.71,103.67-110.82C361.94,114.48,352.34,85.85,332.64,64.58Z" />
                                <Path fill={leftColor} d="M432,480H80A31,31,0,0,1,55.8,468.87c-6.5-7.77-9.12-18.38-7.18-29.11C57.06,392.94,83.4,353.61,124.8,326c36.78-24.51,83.37-38,131.2-38s94.42,13.5,131.2,38c41.4,27.6,67.74,66.93,76.18,113.75,1.94,10.73-.68,21.34-7.18,29.11A31,31,0,0,1,432,480Z" />
                            </G>
                        );
                    case 'cap':
                        return (
                            <G>
                                <Path fill={leftColor} d="M30,22v3c0,0.552-0.448,1-1,1h-1c-0.552,0-1-0.448-1-1v-3c0-0.552,0.448-1,1-1v-7.539l-11.198-0.896 C16.621,12.822,16.337,13,16,13c-0.552,0-1-0.448-1-1c0-0.552,0.448-1,1-1c0.396,0,0.732,0.235,0.894,0.57l11.186,0.895 c0.516,0.041,0.92,0.479,0.92,0.997V21C29.552,21,30,21.448,30,22z M16,19.725c-0.547,0-1.094-0.111-1.603-0.334L8,16.592v2.227 c0,1.136,0.642,2.175,1.658,2.683l0,0C11.655,22.501,13.827,23,16,23s4.345-0.499,6.341-1.497l0,0C23.358,20.995,24,19.956,24,18.82 v-2.227l-6.397,2.799C17.094,19.614,16.547,19.725,16,19.725z M29.906,11.084L17.202,5.526C16.819,5.358,16.41,5.275,16,5.275 c-0.41,0-0.819,0.084-1.202,0.252L2.094,11.084c-0.799,0.35-0.799,1.483,0,1.832l12.703,5.559c0.765,0.334,1.641,0.334,2.405,0 l9.416-4.121l-9.438-0.755C16.843,13.858,16.434,14,16,14c-1.103,0-2-0.897-2-2c0-1.103,0.897-2,2-2 c0.552,0,1.062,0.224,1.431,0.609l10.729,0.858c0.842,0.067,1.525,0.666,1.751,1.445C30.704,12.561,30.703,11.433,29.906,11.084z"/>
                            </G>
                        );
                    default:
                        console.warn(`Unknown name '${name}' for type 'ui'`);
                        return (
                            <Path />
                        );
                }
            case 'symbol':
                switch (name) {
                    case 'checked':
                        return (
                            <G>
                                <Defs>
                                    <LinearGradient id="a" x1={6} y1={3} x2={43} y2={46} gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                </Defs>
                                <Path fill="url(#a)" fillRule="nonzero" stroke="#000" strokeLinejoin="round" strokeWidth={4} d="M6 8.26 25 3l18 5.26v10.77A26.3 26.3 0 0 1 24 46 26.3 26.3 0 0 1 6 19.03z"  />
                            </G>
                        );
                    case 'pawn':
                        return (
                            <G>
                                <Defs>
                                    <LinearGradient id="a" x1={-639.4} x2={-612.91} y1={-465.15} y2={-465.15} gradientTransform="matrix(.943 0 0 1 615.66 493.37)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                </Defs>
                                <Path fill="url(#a)" stroke="#000" strokeLinejoin="round" strokeWidth={1.6} d="M25 12.26c-3.56 0-6.45 2.66-6.45 5.93 0 1.7.8 3.33 2.2 4.45h-1.67c-1.32 0-2.4.98-2.4 2.16v.44c0 1.18 1.08 2.16 2.4 2.16h2.37c0 7.29-9.34 6.45-8.69 16.78L25 44.17h12.23c.66-10.32-8.68-9.48-8.68-16.77h2.37c1.31 0 2.4-.98 2.4-2.16v-.44c0-1.18-1.09-2.16-2.4-2.16h-1.66a5.7 5.7 0 0 0 2.19-4.45c0-3.27-2.89-5.93-6.45-5.93z"/>
                                <Path d="M25 12.26a7 7 0 0 0-1.51.17c6.25.7 7.67 6.47 4.91 9.22-2.01 1.7-7.66 1-7.66 1 2.56.44 4.97 1.95 7.25 2.48-6.03 11.44 9.7 9.03 9.25 19.05.99-10.6-7.68-8.15-8.7-16.78h2.38c1.32 0 2.4-.98 2.4-2.16v-.44c0-1.18-1.08-2.16-2.4-2.16h-1.66a5.7 5.7 0 0 0 2.19-4.45c0-3.27-2.89-5.93-6.45-5.93" opacity={0.15}/>
                                <Path fill="#fff" d="M23.75 13.4a11 11 0 0 0-3.48 6.19s-1.16-4.23 3.48-6.19M14.24 43.42c.28-5.32 2.57-6.18 7.54-11.44-1.03 3.57-7.39 5.87-7.54 11.44"/>
                            </G>
                        );
                    case 'scout':
                        return (
                            <G>
                                <Defs>
                                    <LinearGradient id="a" x1={-639.4} x2={-612.91} y1={-465.15} y2={-465.15} gradientTransform="matrix(.943 0 0 1 615.66 493.37)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                    <LinearGradient id="b" x1={-464.54} x2={-434.16} y1={-452.1} y2={-452.1} gradientTransform="translate(474.35 493.34)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                </Defs>
                                <Path fill="url(#a)" stroke="#000" strokeLinejoin="round" strokeWidth={1.6} d="M25 6.26c-3.56 0-6.45 2.66-6.45 5.93 0 1.7.8 3.33 2.2 4.45h-1.67c-1.31 0-2.4.98-2.4 2.16v.44c0 1.18 1.09 2.16 2.4 2.16h2.37c0 7.29-9.34 6.45-8.69 16.78L25 38.17h12.24c.65-10.32-8.7-9.48-8.7-16.77h2.38c1.32 0 2.4-.98 2.4-2.16v-.44c0-1.18-1.08-2.16-2.4-2.16h-1.66a5.7 5.7 0 0 0 2.19-4.45c0-3.27-2.89-5.93-6.45-5.93z"/>
                                <Path d="M25 6.26a7 7 0 0 0-1.51.17c6.25.7 7.67 6.47 4.91 9.22-2.01 1.7-7.66 1-7.66 1 2.56.44 4.97 1.95 7.25 2.48-6.03 11.44 9.7 9.03 9.24 19.05 1-10.6-7.67-8.15-8.68-16.78h2.37c1.31 0 2.4-.98 2.4-2.16v-.44c0-1.18-1.09-2.16-2.4-2.16h-1.66a5.7 5.7 0 0 0 2.19-4.44c0-3.28-2.89-5.94-6.45-5.94" opacity={0.15}/>
                                <Path fill="#fff" d="M23.75 7.4a11 11 0 0 0-3.48 6.2s-1.16-4.24 3.48-6.2m-9.62 30.02c.27-5.32 2.57-6.18 7.54-11.43-1.03 3.56-7.39 5.86-7.54 11.43"/>
                                <Path fill="url(#b)" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13.24 38.29a2.7 2.7 0 0 0-2.63 2.68v.55l.02 2.68h28.74l.02-2.68v-.55a2.7 2.7 0 0 0-2.63-2.68H25z"/>
                            </G>
                        )
                    case 'rook':
                        return (
                            <G>
                                <Defs>
                                    <LinearGradient id="a" x1={-570.82} x2={-544.4} y1={-468.61} y2={-468.61} gradientTransform="translate(582.87 492.95)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                    <LinearGradient id="b" x1={-573.06} x2={-542.69} y1={-451.71} y2={-451.71} gradientTransform="translate(582.87 492.95)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                </Defs>
                                <Path fill="url(#a)" stroke="#000" strokeLinejoin="round" strokeWidth={1.6} d="M12.86 10.38v7.67c0 3.26 6.53 3.77 6.53 3.77a33 33 0 0 1-5.04 16.49l21.43-.04s-4.65-6.62-5-16.45c0 0 6.9-.5 6.9-3.77v-7.67h-4.73s.46 2.25-.47 3.26c-1.03 1.13-2.42 1.13-3.45 0-.93-1-.47-3.26-.47-3.26h-6.6s.47 2.25-.46 3.26c-1.12 1.22-2.7 1.22-3.82 0-.93-1-.47-3.26-.47-3.26z"/>
                                <Path d="m37.54 10.46.02 7.59c.26 3.48-24.58 2.13-24.53 1.03 2.1 2.53 4.45 2.61 6.36 2.74 7.29.5 9.8 8.9 13.3 16.45h2.97s-4.65-6.62-5-16.45c2.55-.4 2.96-.81 4.04-1.06h.02c1.02-.24 2.8-1.38 2.84-2.71v-7.67z" opacity={0.1}/>
                                <Path fill="url(#b)" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13.24 38.29a2.67 2.67 0 0 0-2.63 2.68v.55l.01 2.68h28.75l.02-2.68v-.55a2.67 2.67 0 0 0-2.63-2.68H25z"/>
                                <G fill="#fff">
                                    <Path d="M13.66 11.17v5.54c.48-1.87.3-4.09 1.55-5.54zM22.88 11.16c.05.9-.16 1.75-.27 2.62.48-1.87 1.82-2.62 1.82-2.62zM17.95 36.31c.87-1.14 3.6-10.33 3.23-13.24.7.39.66 10.05-3.23 13.24M33.86 11.2c0 .6-.05 1.24-.18 2.03.48-1.87 1.3-2.04 1.3-2.04z" />
                                </G>
                            </G>
                        );
                    case 'knight':
                        return (
                            <G>
                                <Defs>
                                    <LinearGradient id="a" x1={-462.21} x2={-434.18} y1={-469.84} y2={-469.84} gradientTransform="translate(474.35 493.34)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                    <LinearGradient id="b" x1={-464.54} x2={-434.16} y1={-452.1} y2={-452.1} gradientTransform="translate(474.35 493.34)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                </Defs>
                                <Path fill="url(#a)" stroke="#000" strokeLinejoin="round" strokeWidth={1.6} d="m25.99 23.55-11.6 1.1-1.45-5.22 14.47-6.82 1.76-3.9 10.2 11.9-4.11 17.67H14.74c.24-11.29 9.64-8.1 11.25-14.73z"/>
                                <Path d="m29.17 8.72-.88 1.94.43-.94c2.7 3.72 5.6 7.28 8.45 10.89l-5.29 17.67h3.38l4.11-17.67z" opacity={0.1}/>
                                <Path fill="url(#b)" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13.24 38.29a2.67 2.67 0 0 0-2.63 2.68v.55l.02 2.68h28.74l.02-2.68v-.55a2.67 2.67 0 0 0-2.63-2.68H25z"/>
                                <Path fill="#fff" d="M17.62 37.4c.16-4.47 2.14-6.97 8.67-9.83-.99 1.1-6.4 2.23-8.67 9.83M14.42 21.67l-.53-1.8 14.14-6.66 1.22-2.76-.67 3.55-14.35 5.93z"/>
                            </G>
                        );
                    case 'bishop':
                        return (
                            <G>
                                <Defs>
                                    <LinearGradient id="a" x1={3341.2} x2={3366.2} y1={-469.26} y2={-469.26} gradientTransform="matrix(1.019 0 0 1.075 -3392.3 527.45)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                    <LinearGradient id="b" x1={-177.63} x2={-151.24} y1={156.68} y2={156.68} gradientTransform="translate(214.24 -138.92)scale(1.15)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                </Defs>
                                <Path fill="url(#a)" stroke="#000" strokeLinejoin="round" strokeWidth={1.6} d="M26.87 8.22c-5.8-2.3-6.95 2.53-4.67 5.86-9.9 10.6-11.25 16.43-6.2 24.2h18c6.08-6.9 2.56-14.5-4.83-22.3-2.88 4.13-3.27 7.36-3.94 11.14l-3.62-.07c-.66-6 7.62-15.14 5.26-18.83z"/>
                                <Path d="M24.93 7.65c-.62.02-.2.2-.77.57h.01c3.58-.3-2.37 11.78-3.4 18.9a25 25 0 0 1 3.09-8.72c2-4.35 4.24-8.68 3-10.17a2.8 2.8 0 0 0-1.93-.58M29.17 16c-.6.86-.51.67-.97 1.46 6 6.05 8.73 13.8 3.1 20.84H34c6.08-6.91 2.55-14.51-4.83-22.3" opacity={0.1}/>
                                <Path fill="url(#b)" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13.24 38.29a2.67 2.67 0 0 0-2.63 2.68v.55l.02 2.68h28.74l.02-2.68v-.55a2.67 2.67 0 0 0-2.63-2.68H25z"/>
                                <Path fill="#fff" d="M15.9 34.33c-.72-1.4-3.27-6.82 4.5-15.74-2.1 4.86-5.95 8.69-4.5 15.74"/>
                            </G>
                        );
                    case 'queen':
                        return (
                            <G>
                                <Defs>
                                    <LinearGradient id="a" x1={-540.02} x2={-501.82} y1={-470.59} y2={-470.59} gradientTransform="translate(545.92 492.79)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                    <LinearGradient id="b" x1={-536.12} x2={-505.75} y1={-451.55} y2={-451.55} gradientTransform="translate(545.92 492.79)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                </Defs>
                                <Path fill="url(#a)" stroke="#000" strokeLinejoin="round" strokeWidth={1.6} d="M25 6.12a4.73 4.73 0 0 0-4.77 4.69 4.7 4.7 0 0 0 2.85 4.28c-.37 2.29-1.51 7.56-4.68 8-2.36.34-3.86-1.28-4.88-3.14a4.2 4.2 0 0 0 1.76-3.4 4.25 4.25 0 0 0-4.29-4.2 4.25 4.25 0 0 0-4.29 4.2 4.24 4.24 0 0 0 3.8 4.19l4.98 17.54h19.04l4.97-17.54a4.24 4.24 0 0 0 3.81-4.19 4.25 4.25 0 0 0-4.3-4.2 4.25 4.25 0 0 0-4.28 4.2c0 1.35.66 2.61 1.76 3.4-1.02 1.86-2.52 3.48-4.88 3.15-3.17-.45-4.3-5.72-4.68-8.01a4.7 4.7 0 0 0 2.85-4.28A4.73 4.73 0 0 0 25 6.12z"/>
                                <Path d="M39 12.34q-.81 0-1.56.3c4.74 1.68 3.87 6.8.59 7.31L30.4 38.28h4.2l4.87-17.54a4.24 4.24 0 0 0 3.81-4.19 4.25 4.25 0 0 0-4.29-4.2" opacity={0.1}/>
                                <Path fill="url(#b)" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13.23 38.29a2.67 2.67 0 0 0-2.63 2.68v.55l.01 2.68h28.75l.01-2.68v-.55a2.67 2.67 0 0 0-2.62-2.68H24.99z"/>
                                <G fill="#fff">
                                    <Path d="M10.52 13.49c-.8 1.17-1.73 2.67-1.56 4.78 0 0-1.6-3.01 1.56-4.78M24.66 7.23c-.85.87-2.37 2.93-2.13 5.37-.21-.08-1.73-3.89 2.13-5.37M13.06 23.33l5.25 14.1-1.17.03z"/>
                                </G>
                            </G>
                        );
                    case 'king':
                        return (
                            <G>
                                <Defs>
                                    <LinearGradient id="a" x1={-825.75} x2={-704.44} y1={2712.8} y2={2712.8} gradientTransform="matrix(.265 0 0 .254 227.43 -666.55)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                    <LinearGradient id="b" x1={-215.24} x2={-184.86} y1={731.78} y2={731.78} gradientTransform="translate(225.05 -690.53)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor={leftColor} />
                                        <Stop offset={1} stopColor={rightColor} />
                                    </LinearGradient>
                                    </Defs>
                                    <Path fill="url(#a)" stroke="#000" strokeLinejoin="round" strokeWidth={1.6} d="M25 3.87c-1.8.1-3.22 1.23-3.22 2.62 0 .56.24 1.64.7 2.1H16.7v5.1H23l-2.6 2.83 2.66 2.17c-5.58.36-12.02 1.64-13.15 4-1.27 2.63 6.22 15.6 6.22 15.6h17.73s7.48-12.97 6.21-15.6c-1.13-2.36-7.6-3.64-13.18-4l2.71-2.17-2.6-2.83h6.3v-5.1h-5.77c.45-.46.7-1.54.7-2.1 0-1.39-1.43-2.52-3.23-2.62z"/>
                                    <Path d="M31.29 38.28h2.57s7.48-12.43 6.22-15.07C35.94 19.4 26.9 18.7 26.9 18.7c11.05 2.82 12.61 5.03 4.39 19.6" opacity={0.1}/>
                                    <Path fill="url(#b)" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13.24 38.29a2.67 2.67 0 0 0-2.62 2.68v3.23h28.76v-3.23a2.67 2.67 0 0 0-2.62-2.68H25z"/>
                                    <G fill="#fff">
                                        <Path d="M15.28 31.14s-3.07-6.56-2.66-8.1c.4-1.53 5.98-2.73 5.98-2.73-6.48 2.71-4.78 4.56-3.32 10.83M17.52 12.88V9.36h1.53c-.89 0-1.53 2.14-1.53 3.52M24.8 4.67s-2.62.92-1.53 3.52c-.18 0-2.14-2.72 1.53-3.52"/>
                                    </G>
                            </G>
                        );
                    case 'dead_king':
                        return (
                            <G>
                                <Defs>
                                    <LinearGradient id="a" x1={-825.75} x2={-704.44} y1={2712.8} y2={2712.8} gradientTransform="matrix(.265 0 0 .254 227.43 -666.55)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor="dimgrey" />
                                        <Stop offset={1} stopColor="black" />
                                    </LinearGradient>
                                    <LinearGradient id="b" x1={-215.24} x2={-184.86} y1={731.78} y2={731.78} gradientTransform="translate(225.05 -690.53)" gradientUnits="userSpaceOnUse">
                                        <Stop offset={0} stopColor="dimgrey" />
                                        <Stop offset={1} stopColor="black" />
                                    </LinearGradient>
                                    </Defs>
                                    <Path fill="url(#a)" stroke="#000" strokeLinejoin="round" strokeWidth={1.6} d="M25 3.87c-1.8.1-3.22 1.23-3.22 2.62 0 .56.24 1.64.7 2.1H16.7v5.1H23l-2.6 2.83 2.66 2.17c-5.58.36-12.02 1.64-13.15 4-1.27 2.63 6.22 15.6 6.22 15.6h17.73s7.48-12.97 6.21-15.6c-1.13-2.36-7.6-3.64-13.18-4l2.71-2.17-2.6-2.83h6.3v-5.1h-5.77c.45-.46.7-1.54.7-2.1 0-1.39-1.43-2.52-3.23-2.62z"/>
                                    <Path d="M31.29 38.28h2.57s7.48-12.43 6.22-15.07C35.94 19.4 26.9 18.7 26.9 18.7c11.05 2.82 12.61 5.03 4.39 19.6" opacity={0.1}/>
                                    <Path fill="url(#b)" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13.24 38.29a2.67 2.67 0 0 0-2.62 2.68v3.23h28.76v-3.23a2.67 2.67 0 0 0-2.62-2.68H25z"/>
                                    <G fill="#fff">
                                        <Path d="M15.28 31.14s-3.07-6.56-2.66-8.1c.4-1.53 5.98-2.73 5.98-2.73-6.48 2.71-4.78 4.56-3.32 10.83M17.52 12.88V9.36h1.53c-.89 0-1.53 2.14-1.53 3.52M24.8 4.67s-2.62.92-1.53 3.52c-.18 0-2.14-2.72 1.53-3.52"/>
                                    </G>
                            </G>
                        );
                    default:
                        console.warn(`Unknown name '${name}' for type 'symbol'`);
                        return (
                            <Path />
                        );
                }
            default:
                console.warn(`Unknown type '${type}'`);
                return (
                    <Path />
                );
        }
    }

    return (
        <Svg width={`${100 * zoom}%`} height={`${100 * zoom}%`} clipRule="evenodd" fillRule="evenodd" viewBox={loadViewBox()} style={[style, { transform: [{ rotate: `${rotate}deg` }, {scale: scale / zoom }]}]}>
            {LoadSVG()}
        </Svg>
    )
};