import "./index.css";
import { MyComposition } from "./Composition";
import { ChurchillComposition } from "./ChurchillComposition";
import { HippocratesComposition } from "./HippocratesComposition";
import { IdeverrayComposition } from "./IdeverrayComposition";
import { AmMuuComposition } from "./AmMuuComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <ChurchillComposition />
      <HippocratesComposition />
      <IdeverrayComposition />
      <AmMuuComposition />
    </>
  );
};
