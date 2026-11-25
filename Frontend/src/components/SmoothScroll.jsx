import { useEffect } from "react";
import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/dist/locomotive-scroll.css";

function SmoothScroll() {
useEffect(() => {
const locomotiveScroll = new LocomotiveScroll();


return () => {
  locomotiveScroll.destroy();
};


}, []);

return null;
}

export default SmoothScroll;
