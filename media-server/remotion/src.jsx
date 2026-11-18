import React from 'react';
import { Composition, OffthreadVideo, AbsoluteFill, useVideoConfig, registerRoot } from 'remotion';
const BrandedVideo = ({ videoSrc, title }) => {
  const { width, height } = useVideoConfig();
  return <AbsoluteFill style={{ backgroundColor: '#08080a' }}>
    <OffthreadVideo src={videoSrc} style={{ width, height, objectFit: 'contain' }} />
    <div style={{ position: 'absolute', left: 42, right: 42, bottom: 36, padding: '18px 24px', background: 'rgba(8,8,10,.78)', borderLeft: '6px solid #ed263e', color: 'white', fontFamily: 'Arial, sans-serif', fontSize: 36, fontWeight: 800 }}>{title}</div>
  </AbsoluteFill>;
};
export const RemotionRoot = () => <Composition id="HollywoodVideo" component={BrandedVideo} durationInFrames={300} fps={30} width={1920} height={1080} defaultProps={{ videoSrc: '', title: 'Hollywood Jailbreak Studio', durationInFrames: 300 }} calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })} />;
registerRoot(RemotionRoot);
