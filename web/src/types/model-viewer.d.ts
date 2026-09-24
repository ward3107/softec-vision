import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/** JSX typing for the <model-viewer> custom element registered by @google/model-viewer.
 *  React 19 moved the JSX namespace under the `react` module, so the custom
 *  element is declared there rather than on the global `JSX`. */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'camera-orbit'?: string;
        'min-camera-orbit'?: string;
        'max-camera-orbit'?: string;
        'interaction-prompt'?: 'auto' | 'none';
        'shadow-intensity'?: string;
        exposure?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        reveal?: 'auto' | 'interaction' | 'manual';
      };
    }
  }
}

export {};
