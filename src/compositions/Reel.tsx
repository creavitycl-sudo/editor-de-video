import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  staticFile,
} from "remotion";
import { Video } from "@remotion/media";
import type { Caption } from "@remotion/captions";
import { brand, dimensions, type Platform } from "../brand";
import { reelPropsSchema, type ReelProps } from "../schemas/reel.schema";
import { SubtitulosReel } from "../components/text/SubtitulosReel";
import { Sticker } from "../components/overlays/Sticker";

const COLA_FINAL_SEGUNDOS = 2;

async function fetchCaptions(reelId: string): Promise<Caption[]> {
  const response = await fetch(staticFile(`captions-${reelId}.json`));
  if (!response.ok) return [];
  return response.json();
}

function hacerCalculateMetadata(
  platform: Platform,
): CalculateMetadataFunction<ReelProps> {
  return async ({ props }) => {
    const captions = await fetchCaptions(props.reelId);
    const finMs =
      captions.length > 0 ? captions[captions.length - 1].endMs : 3000;
    const durationInFrames = Math.ceil(
      ((finMs + COLA_FINAL_SEGUNDOS * 1000) / 1000) * props.fps,
    );

    return {
      durationInFrames: Math.max(durationInFrames, props.fps * 3),
      width: dimensions[platform].width,
      height: dimensions[platform].height,
      props: { ...props, captions },
    };
  };
}

const defaultProps: ReelProps = {
  reelId: "demo",
  tema: "Demo",
  ctaPalabra: "DEMO",
  fps: 30,
  captions: [],
};

export const ReelComposition: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={ReelVideo}
        durationInFrames={90}
        fps={30}
        width={dimensions.vertical.width}
        height={dimensions.vertical.height}
        schema={reelPropsSchema}
        defaultProps={defaultProps}
        calculateMetadata={hacerCalculateMetadata("vertical")}
      />
      {/* Horizontal 1920x1080, opcional, para subir el mismo reel a YouTube. */}
      <Composition
        id="ReelHorizontal"
        component={ReelVideo}
        durationInFrames={90}
        fps={30}
        width={dimensions.horizontal.width}
        height={dimensions.horizontal.height}
        schema={reelPropsSchema}
        defaultProps={defaultProps}
        calculateMetadata={hacerCalculateMetadata("horizontal")}
      />
    </>
  );
};

export const ReelVideo: React.FC<ReelProps> = ({
  reelId,
  ctaPalabra,
  captions,
}) => {
  const videoPath = staticFile(`assets/${reelId}.mp4`);

  return (
    <AbsoluteFill style={{ background: brand.colors.background }}>
      <Video
        src={videoPath}
        style={{ width: "100%", height: "100%" }}
        objectFit="cover"
      />
      <SubtitulosReel captions={captions} />
      <Sticker
        texto={`Comenta ${ctaPalabra.toUpperCase()}`}
        desdeSegundos={0}
      />
    </AbsoluteFill>
  );
};
