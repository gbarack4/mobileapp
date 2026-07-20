import type { School } from '../../types/school';

export function buildSchoolMarkerHtml(
  initials: string,
  color: string,
  selected = false,
): string {
  const safeInitials = initials.replace(/</g, '').slice(0, 3);
  const ring = selected ? color : '#ffffff';
  const ringWidth = selected ? 3 : 2.5;
  const shadow = selected
    ? '0 8px 20px rgba(15,23,42,0.28)'
    : '0 4px 12px rgba(15,23,42,0.18)';
  const scale = selected ? 'transform:scale(1.1);' : '';

  return `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      filter:drop-shadow(${shadow});
      ${scale}
      transition:transform 0.15s ease;
    ">
      <div style="
        width:44px;
        height:44px;
        border-radius:22px;
        background:${color};
        border:${ringWidth}px solid ${ring};
        display:flex;
        align-items:center;
        justify-content:center;
        box-sizing:border-box;
        position:relative;
      ">
        <div style="
          position:absolute;
          inset:5px;
          border-radius:999px;
          background:rgba(255,255,255,0.16);
        "></div>
        <span style="
          position:relative;
          color:#ffffff;
          font-size:12px;
          font-weight:800;
          letter-spacing:0.4px;
          font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          text-shadow:0 1px 1px rgba(15,23,42,0.25);
        ">${safeInitials}</span>
      </div>
      <div style="
        width:0;
        height:0;
        margin-top:-1px;
        border-left:8px solid transparent;
        border-right:8px solid transparent;
        border-top:12px solid ${color};
      "></div>
      <div style="
        width:8px;
        height:8px;
        margin-top:2px;
        border-radius:999px;
        background:rgba(15,23,42,0.22);
        transform:scaleX(1.5);
      "></div>
    </div>
  `;
}

export function schoolToLatLng(school: School): [number, number] {
  return [school.latitude, school.longitude];
}
