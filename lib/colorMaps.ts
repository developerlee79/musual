// Simple perceptual-ish colormap (0..1) → RGB
export function infernoLike(t: number): [number, number, number] {
	
	t = Math.max(0, Math.min(1, t));

	const stops = [
		{ t: 0.0, r: 0, g: 0, b: 0 },
		{ t: 0.3, r: 40, g: 0, b: 80 },
		{ t: 0.6, r: 200, g: 60, b: 0 },
		{ t: 1.0, r: 255, g: 220, b: 70 }
	];
	let i = 0; while (i + 1 < stops.length && t > stops[i + 1].t) i++;
	const a = stops[i], b = stops[Math.min(i + 1, stops.length - 1)];
	const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
	const R = Math.round(a.r + (b.r - a.r) * u);
	const G = Math.round(a.g + (b.g - a.g) * u);
	const B = Math.round(a.b + (b.b - a.b) * u);
	return [R, G, B];
} 