type DragPreviewOverlayProps = {
  title: string;
  x: number;
  y: number;
};

const PREVIEW_OFFSET_X = 12;
const PREVIEW_OFFSET_Y = 12;

export function DragPreviewOverlay({ title, x, y }: DragPreviewOverlayProps): React.JSX.Element {
  const transform = `translate3d(${x + PREVIEW_OFFSET_X}px, ${y + PREVIEW_OFFSET_Y}px, 0)`;
  return (
    <div
      className="drag-preview-overlay"
      role="presentation"
      aria-hidden="true"
      style={{ transform }}
    >
      <span className="drag-preview-overlay__dot" />
      <span className="drag-preview-overlay__title">{title}</span>
    </div>
  );
}
