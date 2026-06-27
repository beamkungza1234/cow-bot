import type {CanvasRenderingContext2D} from '@napi-rs/canvas';

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
   ctx.beginPath();
   ctx.roundRect(x, y, width, height, radius);
   ctx.closePath();
}
