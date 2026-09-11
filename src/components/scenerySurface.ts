import type { CardWindow } from './JourneyScenery';

export interface SceneryTile {
  id: number;
  image: HTMLImageElement | ImageBitmap;
  width: number;
  height: number;
  top: number;
  offset: number;
}
export interface ScenerySurface {
  resize: (width: number, height: number, dpr: number) => void;
  draw: (tiles: SceneryTile[], card?: CardWindow | null) => void;
  dispose: () => void;
}

export function scenerySurface(canvas: HTMLCanvasElement, useCanvas2D = false): ScenerySurface {
  const gl = useCanvas2D ? null : canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true });
  let width = 0, height = 0;
  const resizeCanvas = (w: number, h: number, dpr: number) => {
    width = w; height = h;
    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
  };
  if (!gl) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Scenery rendering is unavailable');
    canvas.dataset.renderer = 'canvas2d';
    return {
      resize(w, h, dpr) { resizeCanvas(w, h, dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); },
      draw(tiles, card) {
        ctx.clearRect(0, 0, width, height);
        if (card === null) return;
        ctx.save();
        if (card) { ctx.beginPath(); ctx.roundRect(card.left, card.top, card.width, card.height, Math.min(16, 16 * card.width / 420)); ctx.clip(); }
        for (const tile of tiles) {
          for (let x = tile.offset; x < width; x += tile.width) ctx.drawImage(tile.image, x, tile.top, tile.width, tile.height);
        }
        ctx.restore();
      },
      dispose() {},
    };
  }
  canvas.dataset.renderer = 'webgl';
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Scenery shader compilation failed');
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, 'attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }');
  const fragment = compile(gl.FRAGMENT_SHADER, `
    precision highp float;
    uniform sampler2D image;
    uniform vec2 viewport;
    uniform vec2 resolution;
    uniform vec4 tile;
    uniform vec4 card;
    uniform float radius;
    void main() {
      vec2 p = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y) * viewport / resolution;
      float v = (p.y - tile.z) / tile.y;
      if (v < 0.0 || v > 1.0) discard;
      float alpha = 1.0;
      if (radius >= 0.0) {
        vec2 q = abs(p - card.xy - card.zw * 0.5) - (card.zw * 0.5 - radius);
        float distance = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
        alpha = 1.0 - smoothstep(-0.5, 0.5, distance);
        if (alpha <= 0.0) discard;
      }
      gl_FragColor = texture2D(image, vec2(fract((p.x - tile.w) / tile.x), v)) * alpha;
    }
  `);
  const program = gl.createProgram()!;
  gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Scenery shader linking failed');
  gl.useProgram(program);
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['viewport', 'resolution', 'tile', 'card', 'radius', 'image'].map(name => [name, gl.getUniformLocation(program, name)]));
  gl.uniform1i(uniforms.image, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const textures = new Map<number, { texture: WebGLTexture; image: SceneryTile['image'] }>();
  return {
    resize(w, h, dpr) {
      resizeCanvas(w, h, dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.viewport, w, h); gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    },
    draw(tiles, card) {
      if (gl.isContextLost()) return;
      gl.disable(gl.SCISSOR_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (card === null) return;
      gl.uniform1f(uniforms.radius, card ? Math.min(16, 16 * card.width / 420) : -1);
      if (card) gl.uniform4f(uniforms.card, card.left, card.top, card.width, card.height);
      for (const tile of tiles) {
        let cached = textures.get(tile.id);
        if (!cached || cached.image !== tile.image) {
          const texture = cached?.texture || gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tile.image);
          cached = { texture, image: tile.image }; textures.set(tile.id, cached);
        }
        gl.bindTexture(gl.TEXTURE_2D, cached.texture);
        gl.uniform4f(uniforms.tile, tile.width, tile.height, tile.top, tile.offset);
        // Don't shade transparent sky or the entire viewport for a card-sized
        // window. Scissoring preserves the same world coordinates and pixels.
        const left = Math.max(0, card?.left ?? 0);
        const top = Math.max(0, tile.top, card?.top ?? 0);
        const right = Math.min(width, card ? card.left + card.width : width);
        const bottom = Math.min(height, tile.top + tile.height, card ? card.top + card.height : height);
        if (right <= left || bottom <= top) continue;
        const dx = canvas.width / width, dy = canvas.height / height;
        gl.enable(gl.SCISSOR_TEST);
        const x = Math.floor(left * dx), y = Math.floor((height - bottom) * dy);
        gl.scissor(x, y, Math.ceil(right * dx) - x, Math.ceil((height - top) * dy) - y);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    },
    dispose() {
      textures.forEach(({ texture }) => gl.deleteTexture(texture));
      gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment);
    },
  };
}
