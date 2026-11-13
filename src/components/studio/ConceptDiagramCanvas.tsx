import type { SurveyProject, SurveySite } from '@/types/survey';

export interface DiagramNodeSlot {
  // Normalized percentages (0-100) matching Slide 5 EMUs (12192000 x 6858000)
  nodeX: number;
  nodeY: number;
  nodeW: number;
  nodeH: number;
  titleX: number;
  titleY: number;
  titleW: number;
  side: 'left' | 'right';
  // Fiber anchor point on the node (0-100%)
  portX: number;
  portY: number;
  // Cloud anchor point (0-100%)
  cloudX: number;
  cloudY: number;
}

export const DIAGRAM_NODE_SLOTS: DiagramNodeSlot[] = [
  // Slot 1: Top-left (จุดที่ 1)
  {
    nodeX: 5.6,
    nodeY: 13.1,
    nodeW: 14.2,
    nodeH: 15.0,
    titleX: 3.5,
    titleY: 10.2,
    titleW: 19.5,
    side: 'left',
    portX: 18.5,
    portY: 17.5,
    cloudX: 42.5,
    cloudY: 52.3,
  },
  // Slot 2: Mid-upper-left (จุดที่ 2)
  {
    nodeX: 3.1,
    nodeY: 33.1,
    nodeW: 15.0,
    nodeH: 16.2,
    titleX: 1.5,
    titleY: 30.2,
    titleW: 19.5,
    side: 'left',
    portX: 16.7,
    portY: 37.6,
    cloudX: 42.1,
    cloudY: 54.0,
  },
  // Slot 3: Mid-lower-left (จุดที่ 3)
  {
    nodeX: 3.1,
    nodeY: 54.0,
    nodeW: 15.0,
    nodeH: 16.2,
    titleX: 3.5,
    titleY: 51.0,
    titleW: 15.0,
    side: 'left',
    portX: 16.7,
    portY: 58.3,
    cloudX: 42.1,
    cloudY: 58.5,
  },
  // Slot 4: Bottom-left (จุดที่ 4)
  {
    nodeX: 5.5,
    nodeY: 76.2,
    nodeW: 14.2,
    nodeH: 17.0,
    titleX: 4.5,
    titleY: 72.8,
    titleW: 15.5,
    side: 'left',
    portX: 18.6,
    portY: 81.2,
    cloudX: 43.0,
    cloudY: 61.5,
  },
  // Slot 5: Bottom-left-center (จุดที่ 5)
  {
    nodeX: 22.0,
    nodeY: 81.8,
    nodeW: 13.5,
    nodeH: 14.5,
    titleX: 20.5,
    titleY: 77.6,
    titleW: 16.5,
    side: 'left',
    portX: 34.4,
    portY: 85.5,
    cloudX: 45.8,
    cloudY: 61.8,
  },
  // Slot 6: Bottom-center (จุดที่ 6)
  {
    nodeX: 39.2,
    nodeY: 79.8,
    nodeW: 14.5,
    nodeH: 17.5,
    titleX: 37.5,
    titleY: 75.8,
    titleW: 19.5,
    side: 'left',
    portX: 48.5,
    portY: 84.5,
    cloudX: 48.5,
    cloudY: 61.8,
  },
  // Slot 7: Bottom-right-center (จุดที่ 7)
  {
    nodeX: 57.5,
    nodeY: 80.2,
    nodeW: 16.0,
    nodeH: 17.0,
    titleX: 59.0,
    titleY: 76.8,
    titleW: 14.0,
    side: 'right',
    portX: 59.8,
    portY: 84.5,
    cloudX: 50.8,
    cloudY: 61.8,
  },
  // Slot 8: Bottom-right (จุดที่ 8)
  {
    nodeX: 75.5,
    nodeY: 77.2,
    nodeW: 16.0,
    nodeH: 17.0,
    titleX: 76.0,
    titleY: 73.6,
    titleW: 17.5,
    side: 'right',
    portX: 77.8,
    portY: 82.0,
    cloudX: 54.0,
    cloudY: 60.5,
  },
  // Slot 9: Mid-lower-right (จุดที่ 9)
  {
    nodeX: 80.4,
    nodeY: 56.5,
    nodeW: 16.2,
    nodeH: 17.2,
    titleX: 79.5,
    titleY: 52.8,
    titleW: 19.5,
    side: 'right',
    portX: 82.6,
    portY: 61.8,
    cloudX: 56.0,
    cloudY: 56.8,
  },
  // Slot 10: Mid-upper-right (จุดที่ 10)
  {
    nodeX: 81.8,
    nodeY: 35.6,
    nodeW: 16.2,
    nodeH: 17.2,
    titleX: 79.5,
    titleY: 32.0,
    titleW: 19.8,
    side: 'right',
    portX: 84.0,
    portY: 41.0,
    cloudX: 56.0,
    cloudY: 55.2,
  },
  // Slot 11: Top-right (จุดที่ 11)
  {
    nodeX: 75.2,
    nodeY: 12.6,
    nodeW: 16.2,
    nodeH: 17.0,
    titleX: 76.5,
    titleY: 9.4,
    titleW: 15.0,
    side: 'right',
    portX: 77.4,
    portY: 18.2,
    cloudX: 55.6,
    cloudY: 53.5,
  },
];

export function getNodeImagePath(site: SurveySite, side: 'left' | 'right'): string {
  const cams = site.cameras.length;
  const count = cams <= 1 ? 1 : cams === 2 ? 2 : 3;
  return `./assets/template/node-${side}-${count}cam.png`;
}

interface ConceptDiagramCanvasProps {
  project: SurveyProject;
  sites: SurveySite[];
}

export function ConceptDiagramCanvas({ project, sites }: ConceptDiagramCanvasProps) {
  const visibleSites = sites.slice(0, 11);

  return (
    <div className="relative h-full w-full overflow-hidden select-none">
      {/* SVG Layer for dashed blue NT Fiber optic & HDMI lines */}
      <svg
        viewBox="0 0 1000 562.5"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <marker
            id="nt-blue-arrow"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#4472C4" />
          </marker>
        </defs>

        {/* TV -> Rack HDMI line */}
        <line
          x1="476"
          y1="126"
          x2="476"
          y2="154"
          stroke="#4472C4"
          strokeWidth="1.4"
          markerEnd="url(#nt-blue-arrow)"
        />

        {/* Rack -> Cloud Fiber line */}
        <line
          x1="484"
          y1="232"
          x2="484"
          y2="285"
          stroke="#4472C4"
          strokeWidth="1.4"
          strokeDasharray="4 3"
          markerEnd="url(#nt-blue-arrow)"
        />
        <text
          x="491"
          y="265"
          fill="#0096D6"
          fontSize="9.5"
          fontWeight="600"
        >
          {project.controlRoom.linkLabel}
        </text>

        {/* Site Nodes -> Cloud Fiber lines */}
        {visibleSites.map((site, idx) => {
          const slot = DIAGRAM_NODE_SLOTS[idx];
          const x1 = (slot.portX / 100) * 1000;
          const y1 = (slot.portY / 100) * 562.5;
          const x2 = (slot.cloudX / 100) * 1000;
          const y2 = (slot.cloudY / 100) * 562.5;

          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          let angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
          if (angle > 90) angle -= 180;
          if (angle < -90) angle += 180;

          return (
            <g key={site.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#5B9BD5"
                strokeWidth="1.25"
                strokeDasharray="4 3"
                markerEnd="url(#nt-blue-arrow)"
              />
              <text
                x={mx}
                y={my - 4}
                textAnchor="middle"
                fill="#0096D6"
                fontSize="8.8"
                fontWeight="500"
                transform={`rotate(${angle}, ${mx}, ${my - 4})`}
              >
                {project.controlRoom.linkLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Top Center Control Room */}
      <div
        className="absolute text-center font-bold text-[#C00000] text-[0.72em] leading-tight"
        style={{ left: '34.5%', top: '2.5%', width: '28%' }}
      >
        {project.controlRoom.title}
      </div>

      <img
        src="./assets/template/control-tv.png"
        alt="Control TV"
        className="absolute object-contain"
        style={{ left: '41.1%', top: '7.7%', width: '14.6%', height: '15.0%' }}
      />

      <div
        className="absolute text-[0.58em] text-slate-800 whitespace-nowrap"
        style={{ left: '56.2%', top: '13.2%' }}
      >
        {project.controlRoom.displaySpec}
      </div>

      <div
        className="absolute text-[0.55em] font-medium text-[#0070C0]"
        style={{ left: '42.4%', top: '22.4%' }}
      >
        HDMI
      </div>

      <img
        src="./assets/template/control-rack-full.png"
        alt="Control Rack"
        className="absolute object-contain"
        style={{ left: '40.0%', top: '26.7%', width: '18.9%', height: '19.4%' }}
      />

      <div
        className="absolute text-[0.55em] text-slate-800 whitespace-nowrap"
        style={{ left: '51.5%', top: '28.0%' }}
      >
        {project.controlRoom.equipments[0] || 'Ethernet Router'}
      </div>

      {/* Central NT Network Cloud SVG */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: '40.9%', top: '50.2%', width: '15.2%', height: '11.6%' }}
      >
        <svg viewBox="0 0 200 100" className="h-full w-full drop-shadow-xs">
          <path
            d="M 45 82 C 20 82 8 68 12 52 C 15 39 28 32 41 35 C 46 16 66 8 86 15 C 96 6 117 6 128 18 C 145 14 166 25 168 42 C 185 45 192 60 185 72 C 179 81 165 82 152 82 Z"
            fill="#8FAADC"
            stroke="#4472C4"
            strokeWidth="2.5"
          />
        </svg>
        <span className="absolute text-[0.72em] font-semibold text-slate-800 text-center leading-tight px-2">
          {project.controlRoom.networkLabel}
        </span>
      </div>

      {/* Perimeter 11 Site Nodes */}
      {visibleSites.map((site, idx) => {
        const slot = DIAGRAM_NODE_SLOTS[idx];
        const imgSrc = getNodeImagePath(site, slot.side);
        return (
          <div key={site.id}>
            <div
              className="absolute text-[0.5em] font-semibold text-[#C00000] leading-tight line-clamp-2"
              style={{
                left: `${slot.titleX}%`,
                top: `${slot.titleY}%`,
                width: `${slot.titleW}%`,
              }}
              title={`จุดที่ ${site.siteNumber} : ${site.siteName}`}
            >
              จุดที่ {site.siteNumber} : {site.siteName}
            </div>
            <img
              src={imgSrc}
              alt={`Node ${site.siteNumber}`}
              className="absolute object-contain"
              style={{
                left: `${slot.nodeX}%`,
                top: `${slot.nodeY}%`,
                width: `${slot.nodeW}%`,
                height: `${slot.nodeH}%`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
