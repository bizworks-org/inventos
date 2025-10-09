import { imgGroup, imgGroup101 } from "./svg-t3q0w";

function Group() {
  return (
    <div className="absolute inset-[33.8%_95.36%_35.21%_2.79%]" data-name="Group">
      <img className="block max-w-none size-full" src={imgGroup} />
    </div>
  );
}

function Group140() {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute bg-[rgba(255,255,255,0.9)] h-[59.167px] left-0 pointer-events-none rounded-[19.167px] top-0 w-[986.667px]">
        <div aria-hidden="true" className="absolute border-[0.915px] border-[rgba(255,255,255,0.5)] border-solid inset-0 rounded-[19.167px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.04)]" />
        <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)]" />
      </div>
      <div className="absolute font-['Outfit',_sans-serif] font-medium leading-[0] left-[70.83px] text-[#c3c3c3] text-[15px] text-nowrap top-5 tracking-[-0.33px]">
        <p className="leading-[20px] whitespace-pre">Write down, what comes to your mind..</p>
      </div>
      <Group />
    </div>
  );
}

function Group101() {
  return (
    <div className="absolute inset-[33.8%_2.03%_35.21%_96.11%]">
      <img className="block max-w-none size-full" src={imgGroup101} />
    </div>
  );
}

function Group141() {
  return (
    <div className="absolute contents left-[936.67px] top-[9.17px]">
      <div className="absolute bg-[#f2f2f2] left-[936.67px] rounded-[8.333px] size-[40.833px] top-[9.17px]" />
      <Group101 />
    </div>
  );
}

function Group142() {
  return (
    <div className="absolute contents left-0 top-0">
      <Group140 />
      <Group141 />
    </div>
  );
}

export default function Group139() {
  return (
    <div className="relative size-full">
      <Group142 />
    </div>
  );
}