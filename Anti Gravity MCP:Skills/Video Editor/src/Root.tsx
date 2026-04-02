import React from "react";
import { Composition } from "remotion";
import { z } from "zod";
import { SIPSVideo, calculateSIPSMetadata } from "./SIPSVideo";

const sipsVideoSchema = z.object({
  src: z.string(),
  showPhotos: z.boolean(),
  showCaptions: z.boolean(),
});

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="SIPSVideo"
        component={SIPSVideo}
        schema={sipsVideoSchema}
        defaultProps={{
          src: "sips-video.mp4",
          showPhotos: true,
          showCaptions: true,
        }}
        calculateMetadata={calculateSIPSMetadata}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={300}
      />
    </>
  );
};
