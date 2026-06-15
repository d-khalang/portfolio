import type { CSSProperties } from 'react';

import './JourneyEnvironment.css';

export interface JourneyEnvironmentPalette {
  skyTop: string;
  skyMiddle: string;
  skyHorizon: string;
  cloudLight: string;
  cloudShade: string;
  distantGround: string;
  middleGround: string;
  nearGround: string;
  forestFloor: string;
}

export const defaultJourneyPalette: JourneyEnvironmentPalette = {
  skyTop: '#91c5df',
  skyMiddle: '#c4dfdf',
  skyHorizon: '#e8e4c9',
  cloudLight: '#f8f5e9',
  cloudShade: '#d8e3dd',
  distantGround: '#718b58',
  middleGround: '#4f7047',
  nearGround: '#345b42',
  forestFloor: '#203f35',
};

interface JourneyEnvironmentProps {
  palette?: JourneyEnvironmentPalette;
}

const clouds = [
  { id: 'far-left', className: 'journey-cloud--far-left' },
  { id: 'center', className: 'journey-cloud--center' },
  { id: 'right', className: 'journey-cloud--right' },
];

export default function JourneyEnvironment({
  palette = defaultJourneyPalette,
}: JourneyEnvironmentProps) {
  const environmentStyle = {
    '--journey-sky-top': palette.skyTop,
    '--journey-sky-middle': palette.skyMiddle,
    '--journey-sky-horizon': palette.skyHorizon,
    '--journey-cloud-light': palette.cloudLight,
    '--journey-cloud-shade': palette.cloudShade,
    '--journey-ground-distant': palette.distantGround,
    '--journey-ground-middle': palette.middleGround,
    '--journey-ground-near': palette.nearGround,
    '--journey-forest-floor': palette.forestFloor,
  } as CSSProperties;

  return (
    <div
      className="journey-environment"
      style={environmentStyle}
      aria-hidden="true"
    >
      <div className="journey-sky-glow" />

      <div className="journey-clouds">
        {clouds.map((cloud) => (
          <span
            key={cloud.id}
            className={`journey-cloud ${cloud.className}`}
          />
        ))}
      </div>

      <div className="journey-horizon-haze" />
      <div className="journey-ground-fill" />
    </div>
  );
}
