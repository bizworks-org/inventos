import { useState, useEffect } from "react";
import { imgGroup7, imgVector, imgVector94, imgSun, imgVector1, imgVector2, imgVector3, imgVector4, imgVector5, imgVector6, imgVector7, imgVector8, imgVector9, imgGroup, imgGroup101, imgGroup8 } from "../imports/svg-wshcu";
import { motion } from "motion/react";
import { useSession } from "./SessionContext";

function Group7() {
  return (
    <div className="[grid-area:1_/_1] h-[8.142px] ml-[31.646%] mt-[32.911%] relative w-[9.437px]">
      <img className="block max-w-none size-full" src={imgGroup7} />
    </div>
  );
}

function Group8() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
      <div className="[grid-area:1_/_1] bg-[#aa76e1] ml-0 mt-0 rounded-[7.113px] size-[24.621px]" />
      <Group7 />
    </div>
  );
}

function Frame117() {
  return (
    <motion.div 
      className="relative w-[986.667px] leading-[0] shrink-0"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* "Share your preferences" aligned with General section below at left-0 */}
      <motion.div 
        className="absolute left-0 top-0 font-outfit font-bold not-italic text-[#232323] text-[39.324px] text-nowrap tracking-[-0.8651px]"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
        <p className="leading-[normal] whitespace-pre">Share your preferences.</p>
      </motion.div>
      
      {/* Group8 icon positioned to the left of the text */}
      <motion.div 
        className="absolute left-[-374.167px] top-[280px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      >
        <Group8 />
      </motion.div>
      
      {/* Right aligned description text - aligned to right edge of content */}
      <motion.div 
        className="absolute right-0 top-0 font-outfit font-medium not-italic text-[#858ca7] text-[16.667px] text-right tracking-[-0.3667px] w-[490.833px]"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      >
        <p className="leading-[20px]">Tell us what matters most for your trip – from budget to activities – so AI can match the perfect destination for your group.</p>
      </motion.div>
    </motion.div>
  );
}

function Group16() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[357.181px] mt-[61.735px] place-items-start relative z-40">
      <div className="[grid-area:1_/_1] bg-[#b1a3ff] h-[16.959px] ml-0 mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b1a3ff] h-[16.959px] ml-[47.242px] mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b1a3ff] h-[10.599px] ml-[15.748px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b1a3ff] h-[10.599px] ml-[31.495px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b1a3ff] h-[16.959px] ml-[94.484px] mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b1a3ff] h-[10.599px] ml-[62.989px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b1a3ff] h-[10.599px] ml-[78.736px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b1a3ff] h-[16.959px] ml-[141.725px] mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b1a3ff] h-[10.599px] ml-[110.231px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b1a3ff] h-[10.599px] ml-[125.977px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-white h-[16.959px] ml-[188.967px] mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b1a3ff] h-[10.599px] ml-[157.472px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-white h-[10.599px] ml-[173.219px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
    </div>
  );
}

function Group21() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[735.115px] mt-[61.735px] place-items-start relative z-40">
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[16.959px] ml-0 mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[16.959px] ml-[47.241px] mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[10.599px] ml-[15.747px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[10.599px] ml-[31.494px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[16.959px] ml-[94.483px] mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[10.599px] ml-[62.989px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[10.599px] ml-[78.736px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[16.959px] ml-[141.725px] mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[10.599px] ml-[110.23px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[10.599px] ml-[125.977px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
    </div>
  );
}

function Group20() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[561.896px] mt-[61.735px] place-items-start relative z-40">
      <div className="[grid-area:1_/_1] bg-white h-[16.959px] ml-[31.494px] mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-white h-[10.599px] ml-0 mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-white h-[10.599px] ml-[15.747px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-white h-[16.959px] ml-[78.735px] mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-white h-[10.599px] ml-[47.241px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-white h-[10.599px] ml-[62.988px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[16.959px] ml-[125.977px] mt-0 rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-white h-[10.599px] ml-[94.482px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[10.599px] ml-[110.23px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[10.599px] ml-[141.725px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
      <div className="[grid-area:1_/_1] bg-[#b199ce] h-[10.599px] ml-[157.472px] mt-[3.18px] rounded-[2.423px] w-[3.634px]" />
    </div>
  );
}

function Group137() {
  // Define ALL individual indicator lines with their absolute positions (same as in InteractiveIndicatorLines)
  const allLineSteps = [
    // First group around SEP (357.181 base)
    { x: 357.181, y: 61.735, tall: true },
    { x: 357.181 + 15.748, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 31.495, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 47.242, y: 61.735, tall: true },
    { x: 357.181 + 62.989, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 78.736, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 94.484, y: 61.735, tall: true },
    { x: 357.181 + 110.231, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 125.977, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 141.725, y: 61.735, tall: true },
    { x: 357.181 + 157.472, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 173.219, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 188.967, y: 61.735, tall: true },

    // Second group around JAN-FEB-MAR (561.896 base)
    { x: 561.896 + 0, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 15.747, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 31.494, y: 61.735, tall: true },
    { x: 561.896 + 47.241, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 62.988, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 78.735, y: 61.735, tall: true },
    { x: 561.896 + 94.482, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 110.23, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 125.977, y: 61.735, tall: true },
    { x: 561.896 + 141.725, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 157.472, y: 61.735 + 3.18, tall: false },

    // Third group around JUL-AUG (735.115 base)
    { x: 735.115, y: 61.735, tall: true },
    { x: 735.115 + 15.747, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 31.494, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 47.241, y: 61.735, tall: true },
    { x: 735.115 + 62.989, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 78.736, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 94.483, y: 61.735, tall: true },
    { x: 735.115 + 110.23, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 125.977, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 141.725, y: 61.735, tall: true }
  ].sort((a, b) => a.x - b.x); // Sort by x position

  // Default to a range covering JAN-MAR area (around steps 13-22)
  const [sliderRange, setSliderRange] = useState({ start: 13, end: 22 });
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);

  // Month data with positions
  const months = [
    { name: 'SEP', x: 360.458 },
    { name: 'OCT', x: 408.579 },
    { name: 'NOV', x: 454.609 },
    { name: 'DEZ', x: 502.561 },
    { name: 'JAN', x: 549.092 },
    { name: 'FEB', x: 596.167 },
    { name: 'MAR', x: 644.12 },
    { name: 'APR', x: 690.817 },
    { name: 'JUN', x: 738.436 },
    { name: 'JUL', x: 785.255 },
    { name: 'AUG', x: 830.497 },
    { name: 'SEP', x: 878.072 }
  ];

  // Slider track dimensions
  const trackStart = 334.167;
  const trackWidth = 570.533;
  const sliderHeight = 27.5;

  // Calculate slider position and width based on line steps
  const getSliderPosition = () => {
    const startLine = allLineSteps[sliderRange.start];
    const endLine = allLineSteps[sliderRange.end];
    
    // Calculate the exact positioning to cover one line at each end
    const lineWidth = 3.634; // Width of each indicator line
    const halfLineWidth = lineWidth / 2;
    
    // Position slider to exactly cover the start and end lines
    const left = startLine.x - trackStart - halfLineWidth; 
    const right = endLine.x - trackStart + halfLineWidth;
    const width = right - left;
    
    return { left: trackStart + left, width };
  };

  const sliderPos = getSliderPosition();

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent, handle: 'start' | 'end') => {
    e.preventDefault();
    setIsDragging(handle);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    
    // Find the closest line step based on current position
    const currentStep = isDragging === 'start' ? sliderRange.start : sliderRange.end;
    const currentLineX = allLineSteps[currentStep].x;
    const newX = currentLineX + deltaX;
    
    // Find the closest line to the new position
    let closestStepIndex = currentStep;
    let minDistance = Infinity;
    
    allLineSteps.forEach((line, index) => {
      const distance = Math.abs(line.x - newX);
      if (distance < minDistance) {
        minDistance = distance;
        closestStepIndex = index;
      }
    });
    
    if (isDragging === 'start') {
      const newStart = Math.max(0, Math.min(sliderRange.end - 1, closestStepIndex));
      if (newStart !== sliderRange.start) {
        setSliderRange(prev => ({ ...prev, start: newStart }));
        setDragStartX(e.clientX);
      }
    } else if (isDragging === 'end') {
      const newEnd = Math.max(sliderRange.start + 1, Math.min(allLineSteps.length - 1, closestStepIndex));
      if (newEnd !== sliderRange.end) {
        setSliderRange(prev => ({ ...prev, end: newEnd }));
        setDragStartX(e.clientX);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStartX, sliderRange]);

  // Check if month is selected based on line coverage
  const isMonthSelected = (monthIndex: number) => {
    const monthX = months[monthIndex].x;
    const startLineX = allLineSteps[sliderRange.start].x;
    const endLineX = allLineSteps[sliderRange.end].x;
    return monthX >= startLineX - 30 && monthX <= endLineX + 30; // 30px tolerance
  };

  return (
    <motion.div 
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
    >
      <div className="[grid-area:1_/_1] bg-[rgba(255,255,255,0.5)] h-[145.655px] ml-0 mt-0 pointer-events-none relative rounded-[18.983px] w-[986.667px]">
        <div aria-hidden="true" className="absolute border-[0.904px] border-[rgba(255,255,255,0.5)] border-solid inset-0 rounded-[18.983px] shadow-[0px_0px_13.167px_0px_rgba(0,0,0,0.07)]" />
        <div className="absolute inset-0 shadow-[0px_0px_5.424px_0px_inset_rgba(255,255,255,0.8)]" />
      </div>
      <div className="[grid-area:1_/_1] font-outfit font-semibold ml-[37.5px] mt-[33.333px] not-italic relative text-[#232323] text-[18.333px] text-nowrap tracking-[-0.4033px]">
        <p className="leading-[20px] whitespace-pre">Travel Dates</p>
      </div>
      <div className="[grid-area:1_/_1] font-outfit font-medium leading-[15.833px] ml-[37.5px] mt-[64.167px] not-italic relative text-[#b8b6c4] text-[14.167px] text-nowrap tracking-[-0.3117px] whitespace-pre">
        <p className="mb-0">Move the slider to your preferred</p>
        <p>travel period.</p>
      </div>

      {/* Slider track */}
      <div className="[grid-area:1_/_1] bg-[#ebe2fa] h-[37.551px] ml-[334.167px] mt-[50.833px] rounded-[12.113px] w-[570.533px] z-20" />
      
      {/* Interactive slider */}
      <div 
        className="[grid-area:1_/_1] bg-[#b282e5] h-[27.5px] mt-[55.833px] rounded-[6.057px] z-30 relative cursor-pointer"
        style={{ 
          marginLeft: `${sliderPos.left}px`, 
          width: `${sliderPos.width}px`,
          transition: isDragging ? 'none' : 'all 0.2s ease-out'
        }}
      >
        {/* Left handle */}
        <div 
          className="absolute left-[-8px] top-0 h-full w-4 cursor-ew-resize bg-[#9f70d9] rounded-l-[6.057px] flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        >
          <div className="w-1 h-4 bg-white rounded opacity-70"></div>
        </div>
        
        {/* Right handle */}
        <div 
          className="absolute right-[-8px] top-0 h-full w-4 cursor-ew-resize bg-[#9f70d9] rounded-r-[6.057px] flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        >
          <div className="w-1 h-4 bg-white rounded opacity-70"></div>
        </div>
      </div>

      {/* Month labels */}
      {months.map((month, index) => (
        <div 
          key={`${month.name}-${index}`}
          className={`[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold mt-[93.23px] relative text-[9.691px] text-center text-nowrap tracking-[-0.533px] translate-x-[-50%] transition-colors duration-200 ${
            isMonthSelected(index) ? 'text-[#232323]' : 'text-[silver]'
          }`}
          style={{ marginLeft: `${month.x}px` }}
        >
          <p className="leading-[normal] whitespace-pre">{month.name}</p>
        </div>
      ))}

      {/* Small indicator lines - dynamic based on selection */}
      <InteractiveIndicatorLines sliderRange={sliderRange} />
      
      <div className="[grid-area:1_/_1] ml-[929.167px] mt-[28.333px] relative size-[23.333px]" data-name="Vector">
        <img className="block max-w-none size-full" src={imgVector} />
      </div>
    </motion.div>
  );
}

// Component for the small indicator lines that change color based on slider coverage
function InteractiveIndicatorLines({ sliderRange }: { sliderRange: { start: number; end: number } }) {
  // Define ALL individual indicator lines with their absolute positions (same as in parent component)
  const allLines = [
    // First group around SEP (357.181 base)
    { x: 357.181, y: 61.735, tall: true },
    { x: 357.181 + 15.748, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 31.495, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 47.242, y: 61.735, tall: true },
    { x: 357.181 + 62.989, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 78.736, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 94.484, y: 61.735, tall: true },
    { x: 357.181 + 110.231, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 125.977, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 141.725, y: 61.735, tall: true },
    { x: 357.181 + 157.472, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 173.219, y: 61.735 + 3.18, tall: false },
    { x: 357.181 + 188.967, y: 61.735, tall: true },

    // Second group around JAN-FEB-MAR (561.896 base)
    { x: 561.896 + 0, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 15.747, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 31.494, y: 61.735, tall: true },
    { x: 561.896 + 47.241, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 62.988, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 78.735, y: 61.735, tall: true },
    { x: 561.896 + 94.482, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 110.23, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 125.977, y: 61.735, tall: true },
    { x: 561.896 + 141.725, y: 61.735 + 3.18, tall: false },
    { x: 561.896 + 157.472, y: 61.735 + 3.18, tall: false },

    // Third group around JUL-AUG (735.115 base)
    { x: 735.115, y: 61.735, tall: true },
    { x: 735.115 + 15.747, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 31.494, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 47.241, y: 61.735, tall: true },
    { x: 735.115 + 62.989, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 78.736, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 94.483, y: 61.735, tall: true },
    { x: 735.115 + 110.23, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 125.977, y: 61.735 + 3.18, tall: false },
    { x: 735.115 + 141.725, y: 61.735, tall: true }
  ].sort((a, b) => a.x - b.x); // Sort by x position

  // Check if individual line is covered by slider based on step indices
  const isLineCovered = (lineIndex: number) => {
    // Lines at the exact start and end positions should be invisible (hidden by slider edges)
    if (lineIndex === sliderRange.start || lineIndex === sliderRange.end) {
      return 'hidden';
    }
    // Lines between start and end should be white
    if (lineIndex > sliderRange.start && lineIndex < sliderRange.end) {
      return 'white';
    }
    // All other lines should be the default purple color
    return 'purple';
  };

  return (
    <>
      {allLines.map((line, index) => {
        const coverageState = isLineCovered(index);
        
        return (
          <div 
            key={index}
            className={`[grid-area:1_/_1] rounded-[2.423px] w-[3.634px] transition-all duration-200 ${
              line.tall ? 'h-[16.959px]' : 'h-[10.599px]'
            } ${
              coverageState === 'hidden' 
                ? 'opacity-0' 
                : coverageState === 'white' 
                  ? 'bg-white' 
                  : 'bg-[#b1a3ff]'
            }`}
            style={{ 
              marginLeft: `${line.x}px`, 
              marginTop: `${line.y}px`,
              position: 'absolute',
              zIndex: 40
            }}
          />
        );
      })}
    </>
  );
}



function Group22() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[22.906px] mt-[10.85px] place-items-start relative">
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[16.878px] ml-0 mt-0 rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[16.878px] ml-[47.018px] mt-0 rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-[15.672px] mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-[31.345px] mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[16.878px] ml-[94.036px] mt-0 rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-[62.691px] mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-[78.363px] mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[16.878px] ml-[141.053px] mt-0 rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-[109.708px] mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-[125.381px] mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[16.878px] ml-[188.071px] mt-0 rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-[156.726px] mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-[172.398px] mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
    </div>
  );
}

function Group23() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[13px] mt-[10.833px] place-items-start relative">
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[16.878px] ml-[31.345px] mt-0 rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-0 mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-[15.672px] mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[16.878px] ml-[78.363px] mt-0 rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-[47.017px] mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
      <div className="[grid-area:1_/_1] bg-[rgba(126,89,166,0.53)] h-[10.549px] ml-[62.69px] mt-[3.164px] rounded-[2.411px] w-[3.617px]" />
    </div>
  );
}

function Group96({ onPriceChange }: { onPriceChange: (price: number) => void }) {
  // Default to 400 euros (matching original design)
  const [currentPrice, setCurrentPrice] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  // Initialize price on mount
  useEffect(() => {
    onPriceChange(currentPrice);
  }, []);

  // Track dimensions - matching original sizes
  const trackWidth = 325;
  const minPrice = 100;
  const maxPrice = 1000;

  // Calculate slider width based on current price - constrained to stay within track
  const getSliderWidth = () => {
    const progress = (currentPrice - minPrice) / (maxPrice - minPrice);
    // Account for 5px left margin + 5px right padding + 8px handle extension = 18px total
    const maxSliderWidth = trackWidth - 18; // 325 - 18 = 307px max width
    return Math.max(30, Math.min(maxSliderWidth, (trackWidth - 18) * progress)); // Constrained within track
  };

  const sliderWidth = getSliderWidth();

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const sensitivity = 1; // 1 pixel per euro for more responsive movement
    const priceChange = Math.round(deltaX / sensitivity) * 5; // Round to nearest 5 for smoother movement
    const newPrice = Math.max(minPrice, Math.min(maxPrice, currentPrice + priceChange));
    
    if (newPrice !== currentPrice) {
      setCurrentPrice(newPrice);
      onPriceChange(newPrice);
      setDragStartX(e.clientX); // Update drag position for continuous movement
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStartX, currentPrice]);

  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-[37.5px] mt-[74.167px] place-items-start relative">
      {/* Background track - lowest layer */}
      <div className="[grid-area:1_/_1] bg-[rgba(178,130,229,0.2)] h-[37.5px] ml-0 mt-0 rounded-[12.056px] w-[325px] z-10" />
      
      {/* Indicator lines - positioned to be visible inside the slider */}
      <div className="[grid-area:1_/_1] z-30 pointer-events-none">
        <Group22 />
        <Group23 />
      </div>

      {/* Interactive slider - middle layer */}
      <div 
        className="[grid-area:1_/_1] bg-[#b282e5] h-[27.5px] ml-[5px] mt-[5px] rounded-[7.234px] z-20 relative cursor-pointer"
        style={{ 
          width: `${sliderWidth}px`,
          transition: isDragging ? 'none' : 'all 0.2s ease-out'
        }}
      >
        {/* Right handle - highest layer */}
        <div 
          className="absolute right-[-8px] top-0 h-full w-4 cursor-ew-resize bg-[#9f70d9] rounded-r-[7.234px] flex items-center justify-center z-40"
          onMouseDown={handleMouseDown}
        >
          <div className="w-1 h-4 bg-[#ffffff] rounded opacity-100"></div>
        </div>
      </div>
    </div>
  );
}

function Group99() {
  const [currentPrice, setCurrentPrice] = useState(400);

  return (
    <motion.div 
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.8, ease: "easeOut" }}
    >
      <div className="[grid-area:1_/_1] bg-[rgba(255,255,255,0.5)] h-[147.5px] ml-0 mt-0 pointer-events-none relative rounded-[19.224px] w-[479.167px]">
        <div aria-hidden="true" className="absolute border-[0.915px] border-[rgba(255,255,255,0.5)] border-solid inset-0 rounded-[19.224px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.07)]" />
        <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)]" />
      </div>
      <div className="[grid-area:1_/_1] flex h-[1.667px] items-center justify-center ml-[388.334px] mt-[100px] relative w-[55px]">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <div className="h-[1.667px] relative w-[55px]">
            <div className="absolute inset-[-200%_-6.06%_-200.01%_-6.06%]">
              <img className="block max-w-none size-full" src={imgVector94} />
            </div>
          </div>
        </div>
      </div>
      <div className="[grid-area:1_/_1] flex h-[1.667px] items-center justify-center ml-[388.334px] mt-[100px] relative w-[55px]">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <div className="h-[1.667px] relative w-[55px]">
            <div className="absolute inset-[-200%_-6.06%_-200.01%_-6.06%]">
              <img className="block max-w-none size-full" src={imgVector94} />
            </div>
          </div>
        </div>
      </div>
      <div className="[grid-area:1_/_1] font-outfit font-semibold leading-[0] ml-[37.5px] mt-[33.333px] not-italic relative text-[#232323] text-[18.333px] text-nowrap tracking-[-0.4033px]">
        <p className="leading-[20px] whitespace-pre">Overall Budget</p>
      </div>
      <div className="[grid-area:1_/_1] font-outfit font-bold leading-[0] ml-[388.334px] mt-[81.667px] not-italic relative text-[#232323] text-[21.667px] text-nowrap tracking-[-0.4767px]">
        <p className="leading-[20px] whitespace-pre">{currentPrice},-</p>
      </div>
      <Group96 onPriceChange={setCurrentPrice} />
      <div className="[grid-area:1_/_1] ml-[421.667px] mt-[28.333px] relative size-[23.333px]" data-name="Vector">
        <img className="block max-w-none size-full" src={imgVector} />
      </div>
    </motion.div>
  );
}

function Sun() {
  return (
    <div className="[grid-area:1_/_1] aspect-[15/15] ml-[13.334px] mt-[9.345px] relative w-[14.167px]" data-name="sun">
      <img className="block max-w-none size-full" src={imgSun} />
    </div>
  );
}

function Group125({ isSelected, onClick }: { isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-[37.5px] mt-[95px] place-items-start relative cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <div className={`[grid-area:1_/_1] h-[33.172px] ml-0 mt-0 rounded-[8.966px] w-[130px] ${isSelected ? 'bg-[#534e5b]' : 'bg-[#edeef1]'}`} />
      <div className={`[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold h-[15.241px] ml-[39.322px] mt-[8.069px] relative text-[13.448px] tracking-[-0.7397px] w-[76.207px] ${isSelected ? 'text-white' : 'text-[#4b5059]'}`}>
        <p className="leading-[normal]">Into the sun</p>
      </div>
      <div className={`[grid-area:1_/_1] aspect-[15/15] ml-[13.334px] mt-[9.345px] relative w-[14.167px] transition-all duration-200`} data-name="sun">
        <img className={`block max-w-none size-full ${isSelected ? '[filter:brightness(0)_invert(1)]' : '[filter:brightness(0)_saturate(100%)_invert(29%)_sepia(8%)_saturate(1087%)_hue-rotate(202deg)_brightness(95%)_contrast(85%)]'}`} src={imgSun} />
      </div>
    </div>
  );
}

function Group126({ isSelected, onClick }: { isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-[177.5px] mt-[95px] place-items-start relative cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <div className={`[grid-area:1_/_1] h-[33.172px] ml-0 mt-0 rounded-[8.966px] w-[130px] ${isSelected ? 'bg-[#534e5b]' : 'bg-[#edeef1]'}`} />
      <div className={`[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold ml-[42.655px] mt-[8.069px] relative text-[13.448px] text-nowrap tracking-[-0.7397px] ${isSelected ? 'text-white' : 'text-[#4b5059]'}`}>
        <p className="leading-[normal] whitespace-pre">Mountains</p>
      </div>
      <div className={`[grid-area:1_/_1] aspect-[512.347/512.002] ml-[13.334px] mt-[9.345px] relative w-[13.338px] transition-all duration-200`} data-name="Vector">
        <img className={`block max-w-none size-full ${isSelected ? '[filter:brightness(0)_invert(1)]' : '[filter:brightness(0)_saturate(100%)_invert(29%)_sepia(8%)_saturate(1087%)_hue-rotate(202deg)_brightness(95%)_contrast(85%)]'}`} src={imgVector1} />
      </div>
    </div>
  );
}

function Group129({ isSelected, onClick }: { isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-[37.5px] mt-[138.333px] place-items-start relative cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <div className={`[grid-area:1_/_1] h-[33.172px] ml-0 mt-0 rounded-[8.966px] w-[130px] ${isSelected ? 'bg-[#534e5b]' : 'bg-[#edeef1]'}`} />
      <div className={`[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold ml-[48.488px] mt-[8.069px] relative text-[13.448px] text-nowrap tracking-[-0.7397px] ${isSelected ? 'text-white' : 'text-[#4b5059]'}`}>
        <p className="leading-[normal] whitespace-pre">City life</p>
      </div>
      <div className={`[grid-area:1_/_1] aspect-[512/512] ml-[13.334px] mt-[9.345px] relative w-[13.333px] transition-all duration-200`} data-name="Vector">
        <img className={`block max-w-none size-full ${isSelected ? '[filter:brightness(0)_invert(1)]' : '[filter:brightness(0)_saturate(100%)_invert(29%)_sepia(8%)_saturate(1087%)_hue-rotate(202deg)_brightness(95%)_contrast(85%)]'}`} src={imgVector2} />
      </div>
    </div>
  );
}

function Group127({ isSelected, onClick }: { isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-[317.5px] mt-[95px] place-items-start relative cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <div className={`[grid-area:1_/_1] h-[33.172px] ml-0 mt-0 rounded-[8.966px] w-[130px] ${isSelected ? 'bg-[#534e5b]' : 'bg-[#edeef1]'}`} />
      <div className={`[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold h-[15.833px] ml-[38.334px] mt-[7.679px] relative text-[13.448px] tracking-[-0.7397px] w-[87.5px] ${isSelected ? 'text-white' : 'text-[#4b5059]'}`}>
        <p className="leading-[normal]">Close to sea</p>
      </div>
      <div className={`[grid-area:1_/_1] aspect-[24.0756/24] ml-[13.334px] mt-[10.179px] relative w-[12.52px] transition-all duration-200`} data-name="Vector">
        <img className={`block max-w-none size-full ${isSelected ? '[filter:brightness(0)_invert(1)]' : '[filter:brightness(0)_saturate(100%)_invert(29%)_sepia(8%)_saturate(1087%)_hue-rotate(202deg)_brightness(95%)_contrast(85%)]'}`} src={imgVector3} />
      </div>
    </div>
  );
}

function Group128({ isSelected, onClick }: { isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-[177.5px] mt-[138.333px] place-items-start relative cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <div className={`[grid-area:1_/_1] h-[33.172px] ml-0 mt-0 rounded-[8.966px] w-[130px] ${isSelected ? 'bg-[#534e5b]' : 'bg-[#edeef1]'}`} />
      <div className={`[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold ml-[45.988px] mt-[8.069px] relative text-[13.448px] text-nowrap tracking-[-0.7397px] ${isSelected ? 'text-white' : 'text-[#4b5059]'}`}>
        <p className="leading-[normal] whitespace-pre">Peaceful</p>
      </div>
      <div className={`[grid-area:1_/_1] aspect-[24.0013/24.0012] ml-[13.334px] mt-[9.345px] relative w-[13.333px] transition-all duration-200`} data-name="Vector">
        <img className={`block max-w-none size-full ${isSelected ? '[filter:brightness(0)_invert(1)]' : '[filter:brightness(0)_saturate(100%)_invert(29%)_sepia(8%)_saturate(1087%)_hue-rotate(202deg)_brightness(95%)_contrast(85%)]'}`} src={imgVector4} />
      </div>
    </div>
  );
}

function Group136() {
  // State for Destination Types - Initialize with Mountains and City life selected (as shown in design)
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(['Mountains', 'City life']);

  // Handler for toggling destination selection
  const toggleDestination = (destination: string) => {
    setSelectedDestinations(prev => 
      prev.includes(destination) 
        ? prev.filter(d => d !== destination)
        : [...prev, destination]
    );
  };

  return (
    <motion.div 
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
    >
      <div className="[grid-area:1_/_1] bg-[rgba(255,255,255,0.5)] h-[223.333px] ml-0 mt-0 pointer-events-none relative rounded-[19.224px] w-[479.167px]">
        <div aria-hidden="true" className="absolute border-[0.915px] border-[rgba(255,255,255,0.5)] border-solid inset-0 rounded-[19.224px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.07)]" />
        <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)]" />
      </div>
      <div className="[grid-area:1_/_1] font-outfit font-semibold leading-[0] ml-[37.5px] mt-[33.333px] not-italic relative text-[#232323] text-[18.333px] text-nowrap tracking-[-0.4033px]">
        <p className="leading-[20px] whitespace-pre">Destination type</p>
      </div>
      <div className="[grid-area:1_/_1] font-outfit font-medium leading-[0] ml-[37.5px] mt-[57.5px] not-italic relative text-[#b8b6c4] text-[14.167px] text-nowrap tracking-[-0.3117px]">
        <p className="leading-[20px] whitespace-pre">Select at least two options.</p>
      </div>
      <div className="[grid-area:1_/_1] ml-[421.667px] mt-[28.333px] relative size-[23.333px]" data-name="Vector">
        <img className="block max-w-none size-full" src={imgVector} />
      </div>
      <Group125 isSelected={selectedDestinations.includes('Into the sun')} onClick={() => toggleDestination('Into the sun')} />
      <Group126 isSelected={selectedDestinations.includes('Mountains')} onClick={() => toggleDestination('Mountains')} />
      <Group129 isSelected={selectedDestinations.includes('City life')} onClick={() => toggleDestination('City life')} />
      <Group127 isSelected={selectedDestinations.includes('Close to sea')} onClick={() => toggleDestination('Close to sea')} />
      <Group128 isSelected={selectedDestinations.includes('Peaceful')} onClick={() => toggleDestination('Peaceful')} />
    </motion.div>
  );
}

function Frame110() {
  return (
    <div className="content-stretch flex flex-col gap-[28.333px] items-start justify-start leading-[0] relative shrink-0 w-[479.167px]">
      <Group99 />
      <Group136 />
    </div>
  );
}

function Group133({ isSelected, onClick }: { isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-[177.5px] mt-[138.333px] place-items-start relative cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <div className={`[grid-area:1_/_1] h-[33.172px] ml-0 mt-0 rounded-[8.966px] w-[130px] ${isSelected ? 'bg-[#534e5b]' : 'bg-[#edeef1]'}`} />
      <div className={`[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold h-[15.241px] ml-[75.758px] mt-[8.069px] relative text-[13.448px] text-center tracking-[-0.7397px] translate-x-[-50%] w-[76.207px] ${isSelected ? 'text-white' : 'text-[#4b5059]'}`}>
        <p className="leading-[normal]">Sightseeing</p>
      </div>
      <div className={`[grid-area:1_/_1] aspect-[512/512] ml-[13.334px] mt-[10.179px] relative w-[13.333px] transition-all duration-200`} data-name="Vector">
        <img className={`block max-w-none size-full ${isSelected ? '[filter:brightness(0)_invert(1)]' : '[filter:brightness(0)_saturate(100%)_invert(29%)_sepia(8%)_saturate(1087%)_hue-rotate(202deg)_brightness(95%)_contrast(85%)]'}`} src={imgVector5} />
      </div>
    </div>
  );
}

function Group130({ isSelected, onClick }: { isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-[37.5px] mt-[95px] place-items-start relative cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <div className={`[grid-area:1_/_1] h-[33.172px] ml-0 mt-0 rounded-[8.966px] w-[130px] ${isSelected ? 'bg-[#534e5b]' : 'bg-[#edeef1]'}`} />
      <div className={`[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold h-[15.241px] ml-[75.758px] mt-[8.069px] relative text-[13.448px] text-center tracking-[-0.7397px] translate-x-[-50%] w-[76.207px] ${isSelected ? 'text-white' : 'text-[#4b5059]'}`}>
        <p className="leading-[normal]">Surfing</p>
      </div>
      <div className={`[grid-area:1_/_1] aspect-[24.0009/24] ml-[13.334px] mt-[9.345px] relative w-[14.167px] transition-all duration-200`} data-name="Vector">
        <img className={`block max-w-none size-full ${isSelected ? '[filter:brightness(0)_invert(1)]' : '[filter:brightness(0)_saturate(100%)_invert(29%)_sepia(8%)_saturate(1087%)_hue-rotate(202deg)_brightness(95%)_contrast(85%)]'}`} src={imgVector6} />
      </div>
    </div>
  );
}

function Group131({ isSelected, onClick }: { isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-[177.5px] mt-[95px] place-items-start relative cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <div className={`[grid-area:1_/_1] h-[33.172px] ml-0 mt-0 rounded-[8.966px] w-[130px] ${isSelected ? 'bg-[#534e5b]' : 'bg-[#edeef1]'}`} />
      <div className={`[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold h-[15.241px] ml-[74.925px] mt-[8.069px] relative text-[13.448px] text-center tracking-[-0.7397px] translate-x-[-50%] w-[76.207px] ${isSelected ? 'text-white' : 'text-[#4b5059]'}`}>
        <p className="leading-[normal]">Biking</p>
      </div>
      <div className={`[grid-area:1_/_1] aspect-[512/469.333] ml-[14.167px] mt-[9.345px] relative w-[14.356px] transition-all duration-200`} data-name="Vector">
        <img className={`block max-w-none size-full ${isSelected ? '[filter:brightness(0)_invert(1)]' : '[filter:brightness(0)_saturate(100%)_invert(29%)_sepia(8%)_saturate(1087%)_hue-rotate(202deg)_brightness(95%)_contrast(85%)]'}`} src={imgVector7} />
      </div>
    </div>
  );
}

function Group132({ isSelected, onClick }: { isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-[317.5px] mt-[95px] place-items-start relative cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <div className={`[grid-area:1_/_1] h-[33.172px] ml-0 mt-0 rounded-[8.966px] w-[130px] ${isSelected ? 'bg-[#534e5b]' : 'bg-[#edeef1]'}`} />
      <div className={`[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold ml-[73.988px] mt-[8.069px] relative text-[13.448px] text-center text-nowrap tracking-[-0.7397px] translate-x-[-50%] ${isSelected ? 'text-white' : 'text-[#4b5059]'}`}>
        <p className="leading-[normal] whitespace-pre">Partying</p>
      </div>
      <div className={`[grid-area:1_/_1] aspect-[20/23.986] ml-[13.334px] mt-[9.345px] relative w-[11.74px] transition-all duration-200`} data-name="Vector">
        <img className={`block max-w-none size-full ${isSelected ? '[filter:brightness(0)_invert(1)]' : '[filter:brightness(0)_saturate(100%)_invert(29%)_sepia(8%)_saturate(1087%)_hue-rotate(202deg)_brightness(95%)_contrast(85%)]'}`} src={imgVector8} />
      </div>
    </div>
  );
}

function Group134({ isSelected, onClick }: { isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] ml-[37.5px] mt-[138.333px] place-items-start relative cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <div className={`[grid-area:1_/_1] h-[33.172px] ml-0 mt-0 rounded-[8.966px] w-[130px] ${isSelected ? 'bg-[#534e5b]' : 'bg-[#edeef1]'}`} />
      <div className={`[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold h-[15.241px] ml-[75.758px] mt-[8.069px] relative text-[13.448px] text-center tracking-[-0.7397px] translate-x-[-50%] w-[76.207px] ${isSelected ? 'text-white' : 'text-[#4b5059]'}`}>
        <p className="leading-[normal]">Chilling</p>
      </div>
      <div className={`[grid-area:1_/_1] aspect-[24/24] ml-[13.334px] mt-[10.179px] relative w-[13.333px] transition-all duration-200`} data-name="Vector">
        <img className={`block max-w-none size-full ${isSelected ? '[filter:brightness(0)_invert(1)]' : '[filter:brightness(0)_saturate(100%)_invert(29%)_sepia(8%)_saturate(1087%)_hue-rotate(202deg)_brightness(95%)_contrast(85%)]'}`} src={imgVector9} />
      </div>
    </div>
  );
}

function Group135() {
  // State for Activities & Interests - Initialize with Biking and Chilling selected (as shown in design)
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['Biking', 'Chilling']);

  // Handler for toggling activity selection
  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  return (
    <motion.div 
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.2, ease: "easeOut" }}
    >
      <div className="[grid-area:1_/_1] bg-[rgba(255,255,255,0.5)] h-[223.333px] ml-0 mt-0 pointer-events-none relative rounded-[19.224px] w-[479.167px]">
        <div aria-hidden="true" className="absolute border-[0.915px] border-[rgba(255,255,255,0.5)] border-solid inset-0 rounded-[19.224px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.07)]" />
        <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)]" />
      </div>
      <div className="[grid-area:1_/_1] font-outfit font-semibold leading-[0] ml-[37.5px] mt-[33.333px] not-italic relative text-[#232323] text-[18.333px] text-nowrap tracking-[-0.4033px]">
        <p className="leading-[20px] whitespace-pre">{`Activities & Interests`}</p>
      </div>
      <div className="[grid-area:1_/_1] font-outfit font-medium leading-[0] ml-[37.5px] mt-[57.5px] not-italic relative text-[#b8b6c4] text-[14.167px] text-nowrap tracking-[-0.3117px]">
        <p className="leading-[20px] whitespace-pre">Select at least two options.</p>
      </div>
      <div className="[grid-area:1_/_1] ml-[421.667px] mt-[28.333px] relative size-[23.333px]" data-name="Vector">
        <img className="block max-w-none size-full" src={imgVector} />
      </div>
      <Group133 isSelected={selectedActivities.includes('Sightseeing')} onClick={() => toggleActivity('Sightseeing')} />
      <Group130 isSelected={selectedActivities.includes('Surfing')} onClick={() => toggleActivity('Surfing')} />
      <Group131 isSelected={selectedActivities.includes('Biking')} onClick={() => toggleActivity('Biking')} />
      <Group132 isSelected={selectedActivities.includes('Partying')} onClick={() => toggleActivity('Partying')} />
      <Group134 isSelected={selectedActivities.includes('Chilling')} onClick={() => toggleActivity('Chilling')} />
    </motion.div>
  );
}

function Group97() {
  return (
    <motion.div 
      className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.4, ease: "easeOut" }}
    >
      <div className="[grid-area:1_/_1] bg-[rgba(255,255,255,0.5)] h-[147.5px] ml-0 mt-0 pointer-events-none relative rounded-[19.224px] w-[479.167px]">
        <div aria-hidden="true" className="absolute border-[0.915px] border-[rgba(255,255,255,0.5)] border-solid inset-0 rounded-[19.224px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.07)]" />
        <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)]" />
      </div>
      <div className="[grid-area:1_/_1] font-outfit font-semibold leading-[0] ml-[37.5px] mt-[33.333px] not-italic relative text-[#232323] text-[18.333px] text-nowrap tracking-[-0.4033px]">
        <p className="leading-[20px] whitespace-pre">Travel Duration</p>
      </div>
      <div className="[grid-area:1_/_1] ml-[421.667px] mt-[28.333px] relative size-[23.333px]" data-name="Vector">
        <img className="block max-w-none size-full" src={imgVector} />
      </div>
      <div className="[grid-area:1_/_1] bg-[#ece3fa] h-[33.333px] ml-[37.5px] mt-[74.167px] rounded-[8.966px] w-[94.167px] z-10" />
      <div className="[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold leading-[0] ml-[84.167px] mt-[82.5px] relative text-[#976cc4] text-[13.448px] text-center text-nowrap tracking-[-0.7397px] translate-x-[-50%] z-20">
        <p className="leading-[normal] whitespace-pre">1-2 Days</p>
      </div>
      <div className="[grid-area:1_/_1] bg-[#b282e5] h-[33.333px] ml-[141.667px] mt-[74.167px] rounded-[8.966px] w-[94.167px] z-10" />
      <div className="[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold leading-[0] ml-[189px] mt-[82.5px] relative text-[13.448px] text-center text-nowrap text-white tracking-[-0.7397px] translate-x-[-50%] z-20">
        <p className="leading-[normal] whitespace-pre">3-5 Days</p>
      </div>
      <div className="[grid-area:1_/_1] bg-[#ece3fa] h-[33.333px] ml-[245.834px] mt-[74.167px] rounded-[8.966px] w-[94.167px] z-10" />
      <div className="[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold leading-[0] ml-[293.167px] mt-[82.5px] relative text-[#976cc4] text-[13.448px] text-center text-nowrap tracking-[-0.7397px] translate-x-[-50%] z-20">
        <p className="leading-[normal] whitespace-pre">6-8 Days</p>
      </div>
      <div className="[grid-area:1_/_1] bg-[#ece3fa] h-[33.333px] ml-[350px] mt-[73.333px] rounded-[8.966px] w-[94.167px] z-10" />
      <div className="[grid-area:1_/_1] font-['Space_Grotesk',_sans-serif] font-bold leading-[0] ml-[396.5px] mt-[81.667px] relative text-[#976cc4] text-[13.448px] text-center text-nowrap tracking-[-0.7397px] translate-x-[-50%] z-20">
        <p className="leading-[normal] whitespace-pre">9+ Days</p>
      </div>
    </motion.div>
  );
}

function Frame111() {
  return (
    <div className="content-stretch flex flex-col gap-[28.333px] items-start justify-start leading-[0] relative shrink-0 w-[479.167px]">
      <Group135 />
      <Group97 />
    </div>
  );
}

function Frame112() {
  return (
    <div className="content-end flex flex-wrap gap-[28.333px] items-end justify-start relative shrink-0 w-full">
      <Group137 />
      <Frame110 />
      <Frame111 />
    </div>
  );
}

function Frame115() {
  return (
    <div className="content-stretch flex flex-col gap-[23.333px] items-start justify-start relative shrink-0 w-full">
      <div className="font-outfit font-medium leading-[0] not-italic relative shrink-0 text-[#d7dae7] text-[16.667px] tracking-[-0.3667px] w-full">
        <p className="leading-[20px]">General</p>
      </div>
      <Frame112 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute left-[27.5px] top-[20px] size-[18.333px] z-20" data-name="Group">
      <img className="block max-w-none size-full" src={imgGroup} />
    </div>
  );
}

function Group101() {
  return (
    <div className="absolute left-[948.25px] top-[21.25px] size-[18.333px] z-20">
      <img className="block max-w-none size-full" src={imgGroup101} />
    </div>
  );
}

function Group138() {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <motion.div 
      className="relative h-[59.167px] w-[986.667px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.6, ease: "easeOut" }}
    >
      {/* Background container */}
      <div className="absolute bg-[rgba(255,255,255,0.9)] h-[59.167px] left-0 rounded-[19.167px] top-0 w-[986.667px]">
        <div aria-hidden="true" className="absolute border-[0.915px] border-[rgba(255,255,255,0.5)] border-solid inset-0 rounded-[19.167px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.04)]" />
        <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)]" />
      </div>
      
      {/* Microphone icon */}
      <Group />
      
      {/* Text input */}
      <input
        type="text"
        placeholder="Write down, what comes to your mind.."
        value={inputValue}
        onChange={handleInputChange}
        className={`absolute font-['Space_Grotesk:Medium',_sans-serif] font-medium bg-transparent border-none outline-none left-[70.83px] text-[15px] text-nowrap top-5 tracking-[-0.33px] placeholder:text-[#c3c3c3] w-[815px] z-10 transition-colors duration-200 ${
          inputValue.trim() ? 'text-[#232323]' : 'text-[#c3c3c3]'
        }`}
      />
      
      {/* Plus button container */}
      <div className="absolute bg-[#f2f2f2] left-[936.67px] rounded-[8.333px] size-[40.833px] top-[9.17px] z-10" />
      <Group101 />
    </motion.div>
  );
}

function Frame113() {
  return (
    <div className="content-stretch flex flex-col gap-[23.333px] items-start justify-start leading-[0] relative shrink-0 w-full">
      <div className="font-outfit font-medium min-w-full not-italic relative shrink-0 text-[#d7dae7] text-[16.667px] tracking-[-0.3667px]" style={{ width: "min-content" }}>
        <p className="leading-[20px]">Custom</p>
      </div>
      <Group138 />
    </div>
  );
}

function Group9() {
  return (
    <div className="h-[15.979px] relative shrink-0 w-[18.523px]">
      <img className="block max-w-none size-full" src={imgGroup8} />
    </div>
  );
}

function Frame16({ onClick }: { onClick?: () => void }) {
  const { completePreferences } = useSession();

  const handleClick = () => {
    completePreferences();
    onClick?.();
  };

  return (
    <motion.div 
      className="bg-[#b282e5] box-border content-stretch flex gap-[13.696px] items-center justify-start pl-[29.167px] pr-[26.667px] py-[15.978px] relative rounded-[26.25px] shrink-0 w-[140px] cursor-pointer hover:bg-[#9f70d9] transition-colors duration-300" 
      onClick={handleClick}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 1.8, ease: "easeOut" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Group9 />
      <div className="font-['Space_Grotesk',_sans-serif] font-bold leading-[0] relative shrink-0 text-[#f6f8ff] text-[15.978px] text-center text-nowrap tracking-[-0.8788px]">
        <p className="leading-[normal] whitespace-pre">Finish</p>
      </div>
    </motion.div>
  );
}

function Frame114({ onFinish }: { onFinish?: () => void }) {
  return (
    <div className="content-stretch flex flex-col gap-10 items-end justify-start relative shrink-0 w-full">
      <Frame113 />
      <Frame16 onClick={onFinish} />
    </div>
  );
}

function Frame116({ onFinish }: { onFinish?: () => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[47.5px] items-start justify-start relative shrink-0 w-[986.667px]">
      <Frame115 />
      <Frame114 onFinish={onFinish} />
    </div>
  );
}

function Frame118({ onFinish }: { onFinish?: () => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[81.667px] items-start justify-start relative shrink-0 w-full">
      <div className="flex justify-center w-full">
        <Frame117 />
      </div>
      <div className="flex justify-center w-full">
        <Frame116 onFinish={onFinish} />
      </div>
    </div>
  );
}

interface SharePreferencesScreenProps {
  onFinish?: () => void;
}

export default function SharePreferencesScreen({ onFinish }: SharePreferencesScreenProps) {
  return (
    <div className="bg-gradient-to-b from-[#f6f8ff] from-[43.912%] to-[#dde5ff] min-h-screen w-full overflow-y-auto" data-name="MacBook Pro 16' - 73">
      <div className="relative w-full">
        <div className="box-border content-stretch flex flex-col gap-[8.333px] items-center justify-start py-[140.833px] relative w-full">
          <Frame118 onFinish={onFinish} />
        </div>
      </div>
    </div>
  );
}