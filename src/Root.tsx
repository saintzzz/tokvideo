import "./index.css";
import { MyComposition } from "./Composition";
import { ChurchillComposition } from "./ChurchillComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <ChurchillComposition />
    </>
  );
};
