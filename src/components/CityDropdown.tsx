import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { imgVector } from "../imports/svg-wls0g";

interface CityDropdownProps {
  selectedCity: string;
  onCitySelect: (city: string) => void;
}

const germanCities = [
  "München",
  "Berlin", 
  "Karlsruhe",
  "Stuttgart",
  "Frankfurt",
  "Freiburg",
  "Augsburg",
  "Hamburg",
  "Köln",
  "Düsseldorf",
  "Bremen",
  "Dresden",
  "Leipzig",
  "Nürnberg"
];

export function CityDropdown({ selectedCity, onCitySelect }: CityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCitySelect = (city: string) => {
    onCitySelect(city);
    setIsOpen(false);
  };

  return (
    <div className="relative w-[241px]">
      {/* Current selection - styled to match the original design */}
      <div 
        className="relative flex items-center cursor-pointer h-[20px] -translate-y-[1px]"
        onClick={toggleDropdown}
      >
        {/* Text positioned 1px to the right */}
        <div className="absolute left-[-9px] font-['Outfit',_sans-serif] font-medium text-[#3e3e3e] text-[14.516px] text-nowrap">
          {selectedCity}
        </div>
        
        {/* Arrow positioned at the right */}
        <motion.div 
          className="absolute left-[178px] flex h-[6.681px] items-center justify-center w-[12.5px]"
          animate={{ rotate: isOpen ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex-none h-[6.681px] scale-y-[-100%] w-[12.5px]">
            <div className="relative size-full" data-name="Vector">
              <img className="block max-w-none size-full" src={imgVector} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-[30px] left-[-26px] bg-white rounded-[10px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.07)] border-[1.41px] border-[rgba(178,130,229,0.2)] z-50 w-[241px]"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="py-2">
              {/* Helper text with reduced line spacing */}
              <div className="px-[25.92px] py-2 font-['Outfit',_sans-serif] font-bold text-[#bdc1d2] text-[13.333px] tracking-[-0.2933px]">
                <p className="leading-[15px]">You can select multiple start locations.</p>
              </div>
              
              {/* City list */}
              <div className="max-h-[200px] overflow-y-auto">
                {germanCities.map((city, index) => (
                  <motion.div
                    key={city}
                    className={`px-[25.92px] py-[8.5px] cursor-pointer font-['Outfit',_sans-serif] font-semibold text-[14.516px] text-nowrap transition-colors duration-150 ${
                      city === selectedCity 
                        ? 'text-[#3e3e3e] bg-[rgba(178,130,229,0.08)]' 
                        : hoveredCity === city
                          ? 'text-[#3e3e3e] bg-[rgba(178,130,229,0.05)]'
                          : index >= 8 
                            ? 'text-[rgba(62,62,62,0.3)]' 
                            : 'text-[#3e3e3e]'
                    }`}
                    onClick={() => handleCitySelect(city)}
                    onMouseEnter={() => setHoveredCity(city)}
                    onMouseLeave={() => setHoveredCity(null)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1, delay: index * 0.02 }}
                  >
                    <p className="leading-[normal] whitespace-pre">{city}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}