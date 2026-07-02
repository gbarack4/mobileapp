import type { School } from '../../types/school';

export function buildSchoolMarkerHtml(
  initials: string,
  color: string,
  selected = false,
): string {
  const scale = selected ? 'transform:scale(1.08);' : '';

  return `
    <div style="display:flex;flex-direction:column;align-items:center;${scale}">
      <div style="
        min-width:38px;
        height:38px;
        border-radius:19px;
        padding:0 8px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:${color};
        border:2px solid #ffffff;
        box-shadow:0 4px 6px rgba(15,23,42,0.2);
        color:#ffffff;
        font-size:13px;
        font-weight:800;
        letter-spacing:0.3px;
        font-family:system-ui,-apple-system,sans-serif;
      ">${initials}</div>
      <div style="
        width:10px;
        height:10px;
        margin-top:-5px;
        transform:rotate(45deg);
        border-radius:1px;
        background:${color};
      "></div>
    </div>
  `;
}

export function schoolToLatLng(school: School): [number, number] {
  return [school.latitude, school.longitude];
}
