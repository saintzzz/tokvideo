import "./index.css";
import { MyComposition } from "./Composition";
import { ChurchillComposition } from "./ChurchillComposition";
import { HippocratesComposition } from "./HippocratesComposition";
import { IdeverrayComposition } from "./IdeverrayComposition";
import { AmMuuComposition } from "./AmMuuComposition";
import { SucKhoeCompositions } from "./SucKhoeComposition";
import { SucKhoeLongCompositions } from "./SucKhoeLongComposition";
import { AvatarCompositions } from "./AvatarComposition";
import { BannerCompositions } from "./BannerComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <ChurchillComposition />
      <HippocratesComposition />
      <IdeverrayComposition />
      <AmMuuComposition />
      <SucKhoeCompositions />
      <SucKhoeLongCompositions />
      <AvatarCompositions />
      <BannerCompositions />
    </>
  );
};
