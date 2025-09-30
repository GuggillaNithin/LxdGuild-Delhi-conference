import { useEffect, useRef } from 'react';
import posterBackground from '@/assets/poster-background.jpg';

interface PosterCanvasProps {
  name?: string;
  company?: string;
  headshotUrl?: string;
}

export const PosterCanvas = ({ name, company, headshotUrl }: PosterCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPoster = async () => {
      // Load background image
      const bg = new Image();
      bg.crossOrigin = 'anonymous';
      bg.src = posterBackground;

      bg.onload = async () => {
        // Set canvas size
        canvas.width = 1152;
        canvas.height = 1536;

        // Draw background
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        // Draw headshot if provided
        if (headshotUrl) {
          try {
            const headshot = new Image();
            headshot.crossOrigin = 'anonymous';
            headshot.src = headshotUrl;
            
            await new Promise((resolve, reject) => {
              headshot.onload = resolve;
              headshot.onerror = reject;
            });

            // Draw circular headshot
            const headshotSize = 280;
            const headshotX = (canvas.width - headshotSize) / 2;
            const headshotY = 450;

            ctx.save();
            ctx.beginPath();
            ctx.arc(headshotX + headshotSize / 2, headshotY + headshotSize / 2, headshotSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(headshot, headshotX, headshotY, headshotSize, headshotSize);
            ctx.restore();

            // Add border to headshot
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(headshotX + headshotSize / 2, headshotY + headshotSize / 2, headshotSize / 2, 0, Math.PI * 2);
            ctx.stroke();
          } catch (error) {
            console.error('Error loading headshot:', error);
          }
        }

        // Draw name
        if (name) {
          ctx.font = 'bold 64px Inter, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 20;
          ctx.fillText(name, canvas.width / 2, 820);
        }

        // Draw company
        if (company) {
          ctx.font = '48px Inter, sans-serif';
          ctx.fillStyle = '#e0d0ff';
          ctx.textAlign = 'center';
          ctx.fillText(company, canvas.width / 2, 900);
        }

        // Draw event title at top
        ctx.font = 'bold 56px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.fillText('LXDGuild Delhi', canvas.width / 2, 280);
        ctx.fillText('Conference 2025', canvas.width / 2, 350);
      };
    };

    drawPoster();
  }, [name, company, headshotUrl]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
      style={{ maxHeight: '85vh' }}
    />
  );
};

export const downloadPoster = (canvasRef: React.RefObject<HTMLCanvasElement>, filename: string) => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
};