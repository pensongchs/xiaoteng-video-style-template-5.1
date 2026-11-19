import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Fonts} from '../style/components';
import {ShotView} from '../style/archetypes';
import {COLOR} from '../style/tokens';
import {DELIVERY_SHOT} from './shots-delivery.ts';
export const DELIVERY_FRAMES = 150;
/** 「交付实力怎么看」枢纽版式预览（5.1.2）。 */
export const DeliveryHubPreview: React.FC = () => (
  <AbsoluteFill style={{background: COLOR.ink}}><Fonts /><ShotView s={DELIVERY_SHOT} dur={DELIVERY_FRAMES} exampleData /></AbsoluteFill>
);
