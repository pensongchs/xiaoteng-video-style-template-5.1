import React from 'react';
import {Opening} from './opening/Opening';
import {openingConfig} from './opening/openingConfig';
import {Composition} from 'remotion';
import {Demo, DEMO_FRAMES} from './demo/Demo';
import {ContactSheet} from './ContactSheet';
import {DataChartSample, DCS_FRAMES} from './demo/DataChartSample';
import {DataChartSample2, DCS2_FRAMES} from './demo/DataChartSample2';
import {OutroSample, OUTRO_FRAMES} from './demo/OutroSample';
import {MgGallery, GALLERY_FRAMES} from './gallery/MgGallery';
import {MgGalleryRe10, RE10_FRAMES} from './gallery/MgGalleryRe10';
import {MgGalleryNew, NEW_GALLERY_FRAMES} from './gallery/MgGalleryNew';
import {DeliveryHubPreview, DELIVERY_FRAMES} from './gallery/DeliveryHubPreview';
import {Preview51, PREVIEW51_FRAMES, SCENE as S51, SubCompare} from './cards51/Preview51';
export const Root: React.FC = () => (<>
  <Composition id="Cards51Preview" component={Preview51 as any} durationInFrames={PREVIEW51_FRAMES} fps={30} width={1920} height={1080} defaultProps={{}} />
  <Composition id="Cards51Scene" component={Preview51 as any} durationInFrames={S51} fps={30} width={1920} height={1080} defaultProps={{only: 0}} />
  <Composition id="Cards51SubCompare" component={SubCompare as any} durationInFrames={90} fps={30} width={1920} height={1080} defaultProps={{i: 0}} />
  <Composition id="Opening" component={Opening} durationInFrames={openingConfig.durationInFrames} fps={50} width={1920} height={1080}/>
  <Composition id="Style50-Demo" component={Demo} durationInFrames={DEMO_FRAMES} fps={30} width={1920} height={1080} />
  <Composition id="Style51-Demo" component={Demo} durationInFrames={DEMO_FRAMES} fps={30} width={1920} height={1080} />
  <Composition id="ContactSheet" component={ContactSheet as any} durationInFrames={1} fps={30} width={1328}
    height={392} defaultProps={{files: [] as string[]}}
    calculateMetadata={({props}: any) => ({height: Math.ceil(Math.max(1, props.files.length) / 2) * 376 + 16})} />
  <Composition id="DataChartSample" component={DataChartSample} durationInFrames={DCS_FRAMES} fps={30} width={1920} height={1080} />
  <Composition id="DataChartSample2" component={DataChartSample2} durationInFrames={DCS2_FRAMES} fps={30} width={1920} height={1080} />
  <Composition id="OutroSample" component={OutroSample} durationInFrames={OUTRO_FRAMES} fps={30} width={1920} height={1080} />
  <Composition id="MgGallery" component={MgGallery} durationInFrames={GALLERY_FRAMES} fps={30} width={1920} height={1080} />
  <Composition id="MgGalleryRe10" component={MgGalleryRe10} durationInFrames={RE10_FRAMES} fps={30} width={1920} height={1080} />
  <Composition id="DeliveryHubPreview" component={DeliveryHubPreview} durationInFrames={DELIVERY_FRAMES} fps={30} width={1920} height={1080} />
  <Composition id="MgGalleryNew" component={MgGalleryNew} durationInFrames={NEW_GALLERY_FRAMES} fps={30} width={1920} height={1080} />
</>);
