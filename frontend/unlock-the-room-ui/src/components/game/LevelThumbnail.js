import { useEffect, useRef, memo } from "react";
import { BARRIER_COLORS, OBJECT_COLORS, GAME_BG_FALLBACK } from "../../gameColors";

function LevelThumbnail({ gameObjects, rows, columns }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameObjects || !rows || !columns) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cellW = W / columns;
    const cellH = H / rows;

    ctx.fillStyle = GAME_BG_FALLBACK;
    ctx.fillRect(0, 0, W, H);

    for (const obj of gameObjects) {
      let color = null;
      let alpha = 1;

      switch (obj.objectType) {
        case "Key":
          color = BARRIER_COLORS[obj.color] || BARRIER_COLORS.Yellow;
          break;
        case "Barrier":
          color = BARRIER_COLORS[obj.color] || BARRIER_COLORS.Purple;
          alpha = 0.55;
          break;
        case "ExitDoor":
          color = OBJECT_COLORS.ExitDoor;
          break;
        case "Platform":
          color = OBJECT_COLORS.Platform;
          break;
        case "Hazard":
          color = obj.hazardType === "Platform"
            ? OBJECT_COLORS.Platform
            : OBJECT_COLORS.KillBrick;
          break;
        case "SpawnPoint":
        default:
          break;
      }

      if (!color) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(obj.positionX * cellW),
        Math.round(obj.positionY * cellH),
        Math.max(1, Math.round(obj.width * cellW)),
        Math.max(1, Math.round(obj.height * cellH))
      );
      ctx.globalAlpha = 1;
    }
  }, [gameObjects, rows, columns]);

  return (
    <canvas
      ref={canvasRef}
      width={80}
      height={50}
      style={{
        display: "block",
        width: "100%",
        height: "50px",
        borderRadius: "4px",
        marginBottom: "6px",
      }}
    />
  );
}

export default memo(LevelThumbnail);
