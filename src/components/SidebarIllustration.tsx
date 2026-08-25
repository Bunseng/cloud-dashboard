import illusVector6 from "@/assets/sidebar/illus-vector6.svg";
import illusVector7 from "@/assets/sidebar/illus-vector7.svg";
import illusGroup1 from "@/assets/sidebar/illus-group1.svg";
import illusVector8 from "@/assets/sidebar/illus-vector8.svg";
import illusGroup2 from "@/assets/sidebar/illus-group2.svg";
import illusGroup3 from "@/assets/sidebar/illus-group3.svg";
import illusVector9 from "@/assets/sidebar/illus-vector9.svg";

/* ------------------------------------------------------------------ *
 * SidebarIllustration — the "undraw_plan-mode" artwork used by the
 * sidebar's Subscribe Plan upsell card. Ported layer-for-layer from the
 * Figma "Sidebar" component (node 286:732) instead of the lucide-icon
 * placeholder previously used here.
 * ------------------------------------------------------------------ */

export function SidebarIllustration() {
  return (
    <div className="relative h-[124px] w-[119px] shrink-0 overflow-clip">
      <div className="absolute inset-[-5.95%_0_0_0] contents">
        <div className="absolute inset-[96.84%_6.67%_2.91%_0]">
          <img alt="" className="absolute block size-full max-w-none" src={illusVector6} />
        </div>
        <div className="absolute inset-[61.11%_58.85%_3.04%_16.2%]">
          <img alt="" className="absolute block size-full max-w-none" src={illusVector7} />
        </div>
        <div className="absolute inset-[25.08%_67.81%_38.89%_19.9%]">
          <img alt="" className="absolute block size-full max-w-none" src={illusGroup1} />
        </div>
        <div className="absolute inset-[50.2%_32.11%_3.15%_42.12%]">
          <img alt="" className="absolute block size-full max-w-none" src={illusVector8} />
        </div>
        <div className="absolute inset-[22.21%_0_0_68.89%]">
          <img alt="" className="absolute block size-full max-w-none" src={illusGroup2} />
        </div>
        <div
          className="absolute inset-[-5.95%_26.64%_68.12%_34.56%] contents"
          style={{ containerType: "size" }}
        >
          <div
            className="absolute inset-[0_33.71%_74.07%_41.64%] flex items-center justify-center"
            style={{ containerType: "size" }}
          >
            <div className="h-[hypot(13.9154cqw,89.1123cqh)] w-[hypot(86.0846cqw,-10.8877cqh)] shrink-0 rotate-[-7.89deg] skew-x-[0.21deg]">
              <div className="relative size-full">
                <img alt="" className="absolute block size-full max-w-none" src={illusGroup3} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-[22.21%_58.85%_70.23%_25.82%]">
          <img alt="" className="absolute block size-full max-w-none" src={illusVector9} />
        </div>
      </div>
    </div>
  );
}
