import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Fonts} from '../style/components';
import {ShotView} from '../style/archetypes';
import {COLOR} from '../style/tokens';
import {IMAGE_GALLERY} from './shots-image.ts';

export const I_SHOT = 180;
export const IMAGE_GALLERY_FRAMES = I_SHOT * IMAGE_GALLERY.length;
/** 5.1.5 图片动效组件 4 款样镜。 */
export const ImageGallery: React.FC<{only?: number}> = ({only}) => (
  <AbsoluteFill style={{background: COLOR.ink}}><Fonts />
    {IMAGE_GALLERY.map((s, i) => (only == null || only === i) && <Sequence key={s.id} from={only == null ? i * I_SHOT : 0} durationInFrames={I_SHOT} premountFor={30}>
      <ShotView s={s} dur={I_SHOT} />
    </Sequence>)}
  </AbsoluteFill>
);
