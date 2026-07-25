import "./index.css";
import { MyComposition } from "./Composition";
import { ChurchillComposition } from "./ChurchillComposition";
import { HippocratesComposition } from "./HippocratesComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <ChurchillComposition />
      <HippocratesComposition />
    </>
  );
};
