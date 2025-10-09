import imgChatGptImage4Sept20251050061 from "@/assets/b6b3fea34652a81d6660bfeb2d0d8db0183d479f.png";
import { imgGroup7, imgGroup93, imgGroup94 } from "./svg-2se1p";
import { motion } from "motion/react";

function MainContent() {
  return (
    <motion.div 
      className="flex flex-col items-center text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <motion.div 
        className="bg-[position:0%_0%,_50%_50%] bg-size-[auto,cover] size-[315px] rounded-2xl overflow-hidden mb-12 -mt-[50px]" 
        data-name="ChatGPT Image 4. Sept. 2025, 10_50_06 1" 
        style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 315 315\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-2.7313e-14 10.855 -10.855 2.8642e-14 157.5 157.5)\\'><stop stop-color=\\'rgba(246,248,255,0)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(246,248,255,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>'), url('${imgChatGptImage4Sept20251050061}')` }}
        animate={{ rotate: [0, 2, -2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="font-['Outfit',_sans-serif] font-bold not-italic text-[#232323] text-[125px] text-center text-nowrap tracking-[-2.75px] -mt-[90px] z-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <motion.p 
          className="leading-[108.333px] mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          We found
        </motion.p>
        <motion.p 
          className="leading-[108.333px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <span className="bg-clip-text bg-gradient-to-b from-[#e7defe] to-[#b282e5]" style={{ WebkitTextFillColor: "transparent" }}>
            the
          </span>
          <span>{` spot.`}</span>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

function Group7() {
  return (
    <div className="h-[15.979px] relative shrink-0 w-[18.523px]">
      <img className="block max-w-none size-full" src={imgGroup7} />
    </div>
  );
}

function UnveilButton({ onClick }: { onClick?: () => void }) {
  return (
    <motion.div 
      className="bg-[#b282e5] box-border content-stretch flex gap-[13.696px] items-center justify-center pl-[29.167px] pr-[26.667px] py-[15.978px] relative rounded-[26.25px] shrink-0 w-[140px] cursor-pointer hover:bg-[#9f70d9] transition-colors duration-300"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.2 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative -ml-1">
        <Group7 />
      </div>
      <div className="font-['Space_Grotesk',_sans-serif] font-bold leading-[0] relative shrink-0 text-[#f6f8ff] text-[15.978px] text-center text-nowrap tracking-[-0.8788px] -ml-0.5">
        <p className="leading-[normal] whitespace-pre">Unveil</p>
      </div>
    </motion.div>
  );
}

function CloudLeft() {
  return (
    <motion.div 
      className="absolute left-1/2 top-[390px] h-[127.476px] w-[171.667px] z-10 -translate-x-[460px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <motion.div 
        className="absolute bottom-[-26.67%] left-[-4.42%] right-[-4.61%] top-0"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <img className="block max-w-none size-full" src={imgGroup93} />
      </motion.div>
    </motion.div>
  );
}

function CloudRight() {
  return (
    <motion.div 
      className="absolute left-1/2 top-[155px] h-[100.182px] w-[134.912px] z-10 translate-x-[220px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <motion.div 
        className="absolute bottom-[-26.67%] left-[-4.42%] right-[-4.61%] top-0"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <img className="block max-w-none size-full" src={imgGroup94} />
      </motion.div>
    </motion.div>
  );
}

interface MacBookPro1674Props {
  onUnveil?: () => void;
}

export default function MacBookPro1674({ onUnveil }: MacBookPro1674Props) {
  return (
    <motion.div 
      className="bg-gradient-to-b from-[#f6f8ff] from-[43.912%] to-[#dde5ff] w-full h-full min-h-screen flex flex-col relative overflow-hidden" 
      data-name="MacBook Pro 16' - 74"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <CloudLeft />
      <CloudRight />
      <div className="flex flex-col items-center px-8 pt-20 pb-16 flex-1">
        <MainContent />
        <div className="flex items-center justify-center mt-[80px] z-20">
          <UnveilButton onClick={onUnveil} />
        </div>
      </div>
    </motion.div>
  );
}