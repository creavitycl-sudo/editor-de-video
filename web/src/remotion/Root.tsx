import {Composition} from "remotion";
import {
  COMP_NAME,
  CompositionProps,
  defaultMyCompProps,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import {Reel, calculateMetadata} from "./compositions/Reel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMP_NAME}
        component={Reel}
        durationInFrames={VIDEO_FPS * 3}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        schema={CompositionProps}
        defaultProps={defaultMyCompProps}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
