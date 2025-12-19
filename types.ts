/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Common types and enums for the Shader Pilot application.
 */

export enum AiStage {
  IDLE = 'IDLE',
  ADJUSTING_SLIDERS = 'ADJUSTING_SLIDERS',
  SMART_SLIDER_CREATION = 'SMART_SLIDER_CREATION',
  MODIFYING_CODE = 'MODIFYING_CODE',
  ENABLE_CAMERA_CONTROLS = 'ENABLE_CAMERA_CONTROLS',
}

export interface Slider {
  name: string;
  description: string;
  variableName: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  targetLiteral?: string;
}

export interface SliderSuggestion {
  suggestion: string;
  type: 'safe' | 'creative';
}

export interface Modulation {
  id: string;
  enabled: boolean;
  source: ModulationSource;
  target: ModulationTarget;
  amount: number;
}

export type ModulationSource =
  | 'speed'
  | 'acceleration'
  | 'altitude'
  | 'descent'
  | 'turning'
  | 'turningSigned'
  | 'heading'
  | 'pitch'
  | 'proximity'
  | 'time';

export type ModulationTarget =
  | 'masterVolume'
  | 'drone.gain'
  | 'drone.filter'
  | 'drone.pitch'
  | 'atmosphere.gain'
  | 'arp.gain'
  | 'arp.speed'
  | 'arp.filter'
  | 'arp.octaves'
  | 'arp.direction'
  | 'rhythm.gain'
  | 'rhythm.filter'
  | 'rhythm.bpm'
  | 'melody.gain'
  | 'melody.density'
  | 'reverb.mix'
  | 'reverb.tone';

export interface SoundConfig {
  enabled: boolean;
  masterVolume: number;
  reverb: {
    enabled: boolean;
    mix: number;
    decay: number;
    tone: number;
  };
  drone: {
    enabled: boolean;
    gain: number;
    filter: number;
    pitch: number;
  };
  atmosphere: {
    enabled: boolean;
    gain: number;
    texture?: string;
  };
  melody: {
    enabled: boolean;
    gain: number;
    density: number;
    scale: string;
  };
  arp: {
    enabled: boolean;
    gain: number;
    speed: number;
    octaves: number;
    filter: number;
    direction?: string;
  };
  rhythm: {
    enabled: boolean;
    gain: number;
    bpm: number;
    filter: number;
  };
  modulations: Modulation[];
}

export interface TerraformTarget {
  variableName: string;
  type: 'velocity' | 'value';
  magnitude: number;
  probability?: number;
}

export interface TerraformConfig {
  targets: TerraformTarget[];
}

export interface ControlConfig {
  invertForward?: boolean;
  invertStrafe?: boolean;
  invertAscend?: boolean;
  invertPitch?: boolean;
  invertYaw?: boolean;
  forwardVelocity?: number;
  strafeVelocity?: number;
  ascendVelocity?: number;
  pitchVelocity?: number;
  yawVelocity?: number;
}

export interface CameraData {
  position: [number, number, number];
  rotation: [number, number];
  roll: number;
}

export type ViewMode = 'cockpit' | 'chase';

export interface ShipModulation {
  id: string;
  enabled: boolean;
  source: ModulationSource;
  target: ShipModulationTarget;
  amount: number;
}

export type ShipModulationTarget =
  | 'complexity'
  | 'fold1'
  | 'fold1AsymX'
  | 'fold2'
  | 'fold2AsymX'
  | 'fold3'
  | 'scale'
  | 'scaleAsymX'
  | 'stretch'
  | 'taper'
  | 'twist'
  | 'twistAsymX'
  | 'asymmetryX'
  | 'asymmetryY'
  | 'asymmetryZ';

export interface ShipConfig {
  complexity: number;
  fold1: number;
  fold2: number;
  fold3: number;
  scale: number;
  stretch: number;
  taper: number;
  twist: number;
  asymmetryX: number;
  asymmetryY: number;
  asymmetryZ: number;
  twistAsymX: number;
  scaleAsymX: number;
  fold1AsymX: number;
  fold2AsymX: number;
  chaseDistance: number;
  chaseVerticalOffset: number;
  pitchOffset: number;
  generalScale: number;
  translucency: number;
  modulations: ShipModulation[];
}

// Marketplace types (from App.tsx)
export interface Product {
  id: string;
  nameKh: string;
  nameEn: string;
  price: string;
  unit: string;
  location: string;
  sellerPhone: string;
  image: string;
  category: string;
  timestamp: number;
}

export interface SeedAnalysis {
  status: 'Good' | 'Bad';
  score: number;
  reasonKh: string;
  reasonEn: string;
  defectsKh: string[];
  defectsEn: string[];
}
